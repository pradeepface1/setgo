const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const { authenticate, filterByOrganization } = require('../middleware/auth');

// GET /api/drivers - List drivers (optionally filter by status/category and organization)
// GET /api/drivers - List drivers (optionally filter by status/category and organization)
router.get('/', authenticate, filterByOrganization, async (req, res) => {
    try {
        const { status, category, vertical } = req.query;
        // Use req.organizationFilter populated by middleware
        const query = { ...req.organizationFilter };

        if (status && status !== 'ALL') query.status = status;
        if (category) query.vehicleCategory = category;

        // Vertical filtering
        if (vertical) {
            query.vertical = vertical;
        } else if (req.user.role === 'TAXI_ADMIN') {
            query.vertical = 'TAXI';
        } else if (req.user.role === 'LOGISTICS_ADMIN') {
            query.vertical = 'LOGISTICS';
        }

        // Search Logic
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            query.$or = [
                { name: searchRegex },
                { phone: searchRegex },
                { vehicleNumber: searchRegex }
            ];
        }

        // Pagination Logic
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;
        const skip = (page - 1) * limit;

        if (limit > 0) {
            const [drivers, total] = await Promise.all([
                Driver.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('organizationId', 'name displayName code'),
                Driver.countDocuments(query)
            ]);

            res.json({
                drivers,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            });
        } else {
            const drivers = await Driver.find(query).populate('organizationId', 'name displayName code');
            res.json(drivers);
        }
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed', details: error.message });
    }
});

// POST /api/drivers - Create a driver
router.post('/', authenticate, async (req, res) => {
    try {
        const driverData = { ...req.body };

        // Determine organization and vertical
        if (req.user.role === 'SUPER_ADMIN') {
            if (!driverData.organizationId) {
                return res.status(400).json({ error: 'Organization ID is required for Super Admin' });
            }
        } else {
            // Org Admin: Force assign their organization
            driverData.organizationId = req.user.organizationId;
        }

        // Set Vertical
        if (req.user.role === 'LOGISTICS_ADMIN') {
            driverData.vertical = 'LOGISTICS';
        } else if (req.user.role === 'TAXI_ADMIN') {
            driverData.vertical = 'TAXI';
        } else if (!driverData.vertical) {
            driverData.vertical = 'TAXI'; // Default
        }

        // Hash password if provided
        if (driverData.password) {
            driverData.password = await bcrypt.hash(driverData.password, 10);
        }

        const driver = new Driver(driverData);
        await driver.save();
        res.status(201).json(driver);
    } catch (error) {
        res.status(400).json({ error: 'Creation failed', details: error.message });
    }
});

// POST /api/drivers/bulk - Bulk create drivers
router.post('/bulk', authenticate, filterByOrganization, async (req, res) => {
    try {
        const { drivers } = req.body;
        const organizationId = req.organizationId; // Set by filterByOrganization middleware

        if (!organizationId) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        let vertical = req.body.vertical || req.user.vertical || 'TAXI';
        if (req.user.role === 'LOGISTICS_ADMIN') {
            vertical = 'LOGISTICS';
        } else if (req.user.role === 'TAXI_ADMIN') {
            vertical = 'TAXI';
        }

        if (!Array.isArray(drivers) || drivers.length === 0) {
            return res.status(400).json({ error: 'A valid array of drivers is required.' });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        const processedPhones = new Set();
        const processedLorries = new Set();

        // Ensure organizationId is treated as an ObjectId for accurate querying
        const orgIdObj = (typeof organizationId === 'string' && mongoose.Types.ObjectId.isValid(organizationId))
            ? new mongoose.Types.ObjectId(organizationId)
            : organizationId;

        for (let i = 0; i < drivers.length; i++) {
            const row = drivers[i];

            // Basic Info
            const name = (row['DriverName (Compulsory)'] || row.name || row.Name || row.DriverName || '').toString().trim();
            const phoneRaw = (row['MobileNumber (Compulsory)'] || row.phone || row.MobileNumber || '').toString().trim();
            const lorryNumber = (row['LorryNumber (Compulsory)'] || row['VehicleNumber (Compulsory)'] || row.lorryNumber || row.LorryNumber || row.vehicleNumber || row.VehicleNumber || '').toString().trim();
            const passwordStr = (row['Password (Compulsory)'] || row.password || row.Password || phoneRaw || 'pass123').toString().trim();
            const vehicleCategory = (row['VehicleCategory (Compulsory)'] || row['Category (Compulsory)'] || row.category || row.Category || row.vehicleCategory || 'Others').toString().trim();
            const vehicleModel = (row['VehicleModel (Compulsory)'] || row.vehicleModel || row.VehicleModel || '').toString().trim();
            const statusRaw = (row['Status (Compulsory)'] || row.status || row.Status || 'OFFLINE').toString().trim();

            if (!name || !phoneRaw || !lorryNumber) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: Name, MobileNumber, and VehicleNumber are compulsory.`);
                continue;
            }

            // Standardize phone to last 10 digits
            const phone = phoneRaw.replace(/\D/g, '').slice(-10);
            if (phone.length < 10) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: Invalid mobile number "${phoneRaw}".`);
                continue;
            }

            // Internal batch duplicate check
            const lorryKey = lorryNumber.toUpperCase();
            if (processedPhones.has(phone)) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: Duplicate mobile "${phone}" found multiple times in this file.`);
                continue;
            }
            if (processedLorries.has(lorryKey)) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: Duplicate lorry "${lorryNumber}" found multiple times in this file.`);
                continue;
            }

            // Status Normalization
            let status = statusRaw.toUpperCase().replace(/\s+/g, '_');
            if (status === 'ON_DUTY' || status === 'DUTY') status = 'ON_DUTY';
            if (status === 'OFF_DUTY') status = 'OFF_DUTY';
            if (status === 'ONLINE' || status === 'ON') status = 'ONLINE';
            if (status === 'OFFLINE' || status === 'OFF') status = 'OFFLINE';
            if (!['ONLINE', 'OFFLINE', 'BUSY', 'ON_DUTY', 'OFF_DUTY'].includes(status)) status = 'OFFLINE';

            // Uniqueness validation (Database)
            const vehicleExists = await Driver.findOne({
                organizationId: orgIdObj,
                $or: [
                    { vehicleNumber: { $regex: new RegExp(`^${lorryNumber.trim()}$`, 'i') } },
                    { lorryNumber: { $regex: new RegExp(`^${lorryNumber.trim()}$`, 'i') } }
                ]
            });

            if (vehicleExists) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: Lorry "${lorryNumber}" already exists in the system.`);
                continue;
            }

            const phoneExists = await Driver.findOne({
                organizationId: orgIdObj,
                phone: { $regex: new RegExp(`${phone}$`) }
            });

            if (phoneExists) {
                results.failed++;
                results.errors.push(`Row ${i + 1}: Mobile number "${phone}" already registered.`);
                continue;
            }

            // Logistics Specific
            const lorryName = row['LorryName'] || row.lorryName || row.LorryName;
            const ownerName = row['OwnerName'] || row.ownerName || row.OwnerName;
            const ownerPhone = row['OwnerPhone'] || row.ownerPhone || row.OwnerPhone;
            const ownerHometown = row['OwnerHometown'] || row.ownerHometown || row.OwnerHometown;
            const panNumber = row['PANNumber'] || row.panNumber || row.PanNumber;
            const panCardName = row['PANCardName'] || row.panCardName || row.PanCardName;

            // Bank Details
            const bankDetails = {
                accountName: row['Bank_AccountName'] || row.accountName,
                bankName: row['Bank_BankName'] || row.bankName,
                accountNumber: row['Bank_AccountNumber'] || row.accountNumber,
                ifsc: row['Bank_IFSC'] || row.ifsc,
                upiNumber: row['Bank_UPINumber'] || row.upiNumber
            };

            const secondaryBankDetails = {
                accountName: row['SecondaryBank_AccountName'] || row.secondaryAccountName,
                bankName: row['SecondaryBank_BankName'] || row.secondaryBankName,
                accountNumber: row['SecondaryBank_AccountNumber'] || row.secondaryAccountNumber,
                ifsc: row['SecondaryBank_IFSC'] || row.secondaryIfsc,
                upiNumber: row['SecondaryBank_UPINumber'] || row.secondaryUpiNumber
            };

            try {
                const hashedPassword = await bcrypt.hash(passwordStr, 10);

                const newDriver = new Driver({
                    organizationId: orgIdObj,
                    vertical,
                    name: name,
                    phone: phone,
                    vehicleNumber: lorryNumber.trim(),
                    lorryNumber: lorryNumber.trim(),
                    lorryName: lorryName ? lorryName.toString().trim() : undefined,
                    vehicleCategory: vehicleCategory,
                    vehicleModel: vehicleModel,
                    status: status,
                    password: hashedPassword,
                    ownerName: ownerName ? ownerName.toString().trim() : undefined,
                    ownerPhone: ownerPhone ? ownerPhone.toString().trim() : undefined,
                    ownerHometown: ownerHometown ? ownerHometown.toString().trim() : undefined,
                    panNumber: panNumber ? panNumber.toString().trim().toUpperCase() : undefined,
                    panCardName: panCardName ? panCardName.toString().trim().toUpperCase() : undefined,
                    bankDetails,
                    secondaryBankDetails
                });
                await newDriver.save();
                results.success++;
                processedPhones.add(phone);
                processedLorries.add(lorryKey);
            } catch (err) {
                results.failed++;
                if (err.code === 11000 || err.message.includes('E11000')) {
                    results.errors.push(`Row ${i + 1}: Duplicate phone or lorry number detected.`);
                } else {
                    results.errors.push(`Row ${i + 1}: ${err.message}`);
                }
            }
        }

        res.status(200).json(results);

    } catch (error) {
        res.status(500).json({ error: 'Bulk creation failed', details: error.message });
    }
});

// PATCH /api/drivers/:id - Update driver (e.g. status)
router.patch('/:id', authenticate, async (req, res) => {
    try {
        const { status, password } = req.body;
        // Basic validation
        if (status && !['ONLINE', 'OFFLINE', 'BUSY'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Hash password if updating
        if (password) {
            console.log(`[DEBUG] Updating password for driver ${req.params.id}. Plaintext length: ${password.length}`);
            req.body.password = await bcrypt.hash(password, 10);
            console.log(`[DEBUG] Password hashed.`);
        }

        const query = { _id: req.params.id };
        // Check organization permissions
        if (req.user.role === 'ORG_ADMIN') {
            query.organizationId = req.user.organizationId;
        }

        const driver = await Driver.findOneAndUpdate(
            query,
            { $set: req.body },
            { new: true }
        );

        if (!driver) {
            console.log(`[DEBUG] Driver not found or access denied for ID ${req.params.id}`);
            return res.status(404).json({ error: 'Driver not found or access denied' });
        }

        // Broadcast update via Socket.io
        if (req.io) {
            req.io.to('admin').emit('driverLocationUpdate', {
                driverId: driver._id,
                status: driver.status,
                lat: driver.currentLocation?.lat,
                lng: driver.currentLocation?.lng,
                name: driver.name
            });
            // Also notify the driver specifically if needed
            // req.io.to(`driver_${driver._id}`).emit('statusUpdate', { status: driver.status });
        }

        console.log(`[DEBUG] Driver updated successfully: ${driver._id}`);
        res.json(driver);
    } catch (error) {
        res.status(500).json({ error: 'Update failed', details: error.message });
    }
});

// GET /api/drivers/:id/history - Get trip history for a driver
router.get('/:id/history', authenticate, async (req, res) => {
    try {
        // Verify driver belongs to allowed organization
        const driverQuery = { _id: req.params.id };
        if (req.user.role === 'ORG_ADMIN') {
            driverQuery.organizationId = req.user.organizationId;
        }
        const driver = await Driver.findOne(driverQuery);
        if (!driver) return res.status(404).json({ error: 'Driver not found or access denied' });

        const Trip = require('../models/Trip');
        const trips = await Trip.find({
            assignedDriver: req.params.id,
            status: { $in: ['COMPLETED', 'CANCELLED'] }
        }).sort({ tripDateTime: -1 });

        // Map customerContact to customerPhone for frontend compatibility
        const tripsWithPhone = trips.map(trip => ({
            ...trip.toObject(),
            customerPhone: trip.customerContact || trip.customerPhone
        }));

        res.json(tripsWithPhone);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed', details: error.message });
    }
});

// GET /api/drivers/:id/trips - Get trips for a driver (active or history)
router.get('/:id/trips', authenticate, async (req, res) => {
    try {
        const isHistory = req.query.history === 'true';
        const driverQuery = { _id: req.params.id };
        if (req.user.role === 'ORG_ADMIN') {
            driverQuery.organizationId = req.user.organizationId;
        }
        const driver = await Driver.findOne(driverQuery);
        if (!driver) return res.status(404).json({ error: 'Driver not found or access denied' });

        // If Logistics driver, query Trip collection (standardized)
        if (driver.vertical === 'LOGISTICS') {
            const Trip = require('../models/Trip');
            const activeStatuses = ['ASSIGNED', 'ACCEPTED', 'STARTED', 'PLANNED', 'LOADED', 'IN_TRANSIT'];
            const historyStatuses = ['COMPLETED', 'DELIVERED', 'SETTLED', 'CANCELLED'];

            const trips = await Trip.find({
                assignedDriver: req.params.id,
                status: { $in: isHistory ? historyStatuses : activeStatuses }
            })
                .sort({ tripDateTime: isHistory ? -1 : 1 })
                .populate('consignorId', 'name');

            const normalized = trips.map(t => ({
                _id: t._id,
                type: 'LOGISTICS',
                status: t.status,
                tripDateTime: t.tripDateTime,
                pickupLocation: t.loadingLocation || 'Loading Point',
                dropLocation: t.unloadingLocation || 'Unloading Point',
                customerName: t.consignorId?.name || 'Consignor',
                customerPhone: null,
                vehicleCategory: driver.vehicleCategory || 'LCV',
                lorryNumber: driver.vehicleNumber,
                consignmentItem: 'Goods', // Placeholder or add field if available
                weight: null, // Removed as per request
                weightUnit: 'Ton',
                financials: {
                    price: t.driverTotalPayable || t.totalFreight || 0
                }
            }));

            return res.json(normalized);
        }

        // TAXI driver
        const Trip = require('../models/Trip');
        const activeStatuses = ['ASSIGNED', 'ACCEPTED', 'STARTED'];
        const historyStatuses = ['COMPLETED', 'CANCELLED'];
        const trips = await Trip.find({
            assignedDriver: req.params.id,
            status: { $in: isHistory ? historyStatuses : activeStatuses }
        }).sort({ tripDateTime: isHistory ? -1 : 1 });

        res.json(trips);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed', details: error.message });
    }
});

// DELETE /api/drivers/:id - Delete a driver
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const query = { _id: req.params.id };
        // Check organization permissions
        if (req.user.role === 'ORG_ADMIN') {
            query.organizationId = req.user.organizationId;
        }

        // Before deleting, check if driver has active trips?
        // Let's prevent deleting if they have ASSIGNED trips
        const Trip = require('../models/Trip');
        const activeTrips = await Trip.countDocuments({
            assignedDriver: req.params.id,
            status: { $in: ['ASSIGNED', 'APPROVED'] }
        });

        if (activeTrips > 0) {
            return res.status(400).json({
                error: 'Cannot delete driver with active assigned trips. Reassign or cancel trips first.'
            });
        }

        const driver = await Driver.findOneAndDelete(query);

        if (!driver) {
            return res.status(404).json({ error: 'Driver not found or access denied' });
        }

        res.json({ message: 'Driver deleted successfully', driverId: driver._id });
    } catch (error) {
        res.status(500).json({ error: 'Deletion failed', details: error.message });
    }
});

// GET /api/drivers/:id - Get single driver details (for profile refresh)
router.get('/:id', authenticate, async (req, res) => {
    try {
        const query = { _id: req.params.id };

        // Security: Drivers can only view themselves
        if (req.user.role === 'DRIVER' && req.user.driverId !== req.params.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        // Org Admin can only view their own
        if (req.user.role === 'ORG_ADMIN') {
            query.organizationId = req.user.organizationId;
        }

        const driver = await Driver.findOne(query).populate('organizationId', 'displayName name');
        if (!driver) return res.status(404).json({ error: 'Driver not found' });

        // Normalize response
        const driverData = {
            _id: driver._id,
            name: driver.name,
            phone: driver.phone,
            vehicleModel: driver.vehicleModel,
            vehicleNumber: driver.vehicleNumber,
            vehicleCategory: driver.vehicleCategory,
            status: driver.status,
            rating: driver.rating,
            vertical: driver.vertical,
            ownerName: driver.ownerName,
            ownerPhone: driver.ownerPhone,
            ownerHometown: driver.ownerHometown,
            organizationId: driver.organizationId?._id || driver.organizationId,
            organizationName: driver.organizationId?.displayName || driver.organizationId?.name,
        };

        res.json(driverData);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed', details: error.message });
    }
});

module.exports = router;
