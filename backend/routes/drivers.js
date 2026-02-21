const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const bcrypt = require('bcryptjs');

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
