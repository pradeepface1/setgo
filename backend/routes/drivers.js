const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const bcrypt = require('bcryptjs');

const { authenticate, filterByOrganization } = require('../middleware/auth');

// GET /api/drivers - List drivers (optionally filter by status/category and organization)
router.get('/', authenticate, filterByOrganization, async (req, res) => {
    try {
        const { status, category } = req.query;
        // Use req.organizationFilter populated by middleware
        const query = { ...req.organizationFilter };

        if (status && status !== 'ALL') query.status = status;
        if (category) query.vehicleCategory = category;

        const drivers = await Driver.find(query).populate('organizationId', 'name displayName code');
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed', details: error.message });
    }
});

// POST /api/drivers - Create a driver
router.post('/', authenticate, async (req, res) => {
    try {
        const driverData = { ...req.body };

        // Determine organization
        if (req.user.role === 'SUPER_ADMIN') {
            if (!driverData.organizationId) {
                return res.status(400).json({ error: 'Organization ID is required for Super Admin' });
            }
        } else {
            // Org Admin: Force assign their organization
            driverData.organizationId = req.user.organizationId;
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

        res.json(trips);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed', details: error.message });
    }
});

// GET /api/drivers/:id/trips - Get assigned trips for a driver
router.get('/:id/trips', authenticate, async (req, res) => {
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
            status: { $in: ['ASSIGNED', 'ACCEPTED', 'STARTED'] }
        }).sort({ tripDateTime: 1 });

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

module.exports = router;
