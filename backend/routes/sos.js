const express = require('express');
const router = express.Router();
const SOS = require('../models/SOS');

// Create SOS Alert
router.post('/', async (req, res) => {
    try {
        const { userId, customerName, customerPhone, location } = req.body;

        const newSOS = new SOS({
            userId,
            customerName,
            customerPhone,
            location
        });

        await newSOS.save();

        // Emit socket event to admins
        // Assuming 'io' is attached to req or available globally (we'll attach it in server.js)
        if (req.io) {
            req.io.to('admin').emit('sos-alert', newSOS);
        }

        res.status(201).json({ message: 'SOS Alert Sent', sos: newSOS });
    } catch (err) {
        console.error('Error creating SOS:', err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get All SOS Alerts
router.get('/', async (req, res) => {
    try {
        const alerts = await SOS.find().sort({ createdAt: -1 });
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get SOS Stats
router.get('/stats', async (req, res) => {
    try {
        const stats = await SOS.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Format for easier consumption
        const formattedStats = {
            open: 0,
            resolved: 0,
            false_alarm: 0
        };

        stats.forEach(stat => {
            if (stat._id === 'OPEN') formattedStats.open = stat.count;
            if (stat._id === 'RESOLVED') formattedStats.resolved = stat.count;
            if (stat._id === 'FALSE_ALARM') formattedStats.false_alarm = stat.count;
        });

        res.json(formattedStats);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// Resolve SOS Alert
router.put('/:id/resolve', async (req, res) => {
    try {
        const { status, resolvedBy } = req.body; // resolvedBy should be admin ID
        const sos = await SOS.findByIdAndUpdate(
            req.params.id,
            {
                status: status || 'RESOLVED',
                resolvedBy: resolvedBy,
                resolvedAt: new Date()
            },
            { new: true }
        );

        if (req.io) {
            req.io.to('admin').emit('sos-resolved', sos);
        }

        res.json(sos);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
