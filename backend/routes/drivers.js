const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const bcrypt = require('bcryptjs');

// GET /api/drivers - List drivers (optionally filter by status/category)
router.get('/', async (req, res) => {
    try {
        const { status, category } = req.query;
        const query = {};
        if (status && status !== 'ALL') query.status = status;
        if (category) query.vehicleCategory = category;

        const drivers = await Driver.find(query);
        res.json(drivers);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed', details: error.message });
    }
});

// POST /api/drivers - Create a driver (for seeding/testing)
router.post('/', async (req, res) => {
    try {
        const driverData = { ...req.body };

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
router.patch('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        // Basic validation
        if (status && !['ONLINE', 'OFFLINE', 'BUSY'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const driver = await Driver.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        if (!driver) return res.status(404).json({ error: 'Driver not found' });
        res.json(driver);
    } catch (error) {
        res.status(500).json({ error: 'Update failed', details: error.message });
    }
});

// GET /api/drivers/:id/history - Get trip history for a driver (completed and cancelled)
router.get('/:id/history', async (req, res) => {
    try {
        const Trip = require('../models/Trip');
        const trips = await Trip.find({
            assignedDriver: req.params.id,
            status: { $in: ['COMPLETED', 'CANCELLED'] }
        }).sort({ tripDateTime: -1 }); // Most recent first

        res.json(trips);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed', details: error.message });
    }
});

// GET /api/drivers/:id/trips - Get assigned trips for a driver
router.get('/:id/trips', async (req, res) => {
    try {
        const Trip = require('../models/Trip');
        const trips = await Trip.find({
            assignedDriver: req.params.id,
            status: { $in: ['ASSIGNED'] }
        }).sort({ tripDateTime: 1 });

        res.json(trips);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed', details: error.message });
    }
});

module.exports = router;
