const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const { parseWhatsAppMessage } = require('../utils/parser');

// POST /api/trips/parse - Parse raw text into structured data
router.post('/parse', async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Text is required' });

        const parsedData = parseWhatsAppMessage(text);
        res.json(parsedData);
    } catch (error) {
        res.status(500).json({ error: 'Parsing failed', details: error.message });
    }
});

// POST /api/trips - Create a new trip
router.post('/', async (req, res) => {
    try {
        console.log('===== TRIP CREATION DEBUG =====');
        console.log('1. Received req.body:', JSON.stringify(req.body, null, 2));

        const trip = new Trip(req.body);

        console.log('2. Trip object before save:', JSON.stringify(trip.toObject(), null, 2));
        console.log('3. vehicleCategory:', trip.vehicleCategory);
        console.log('4. vehicleSubcategory:', trip.vehicleSubcategory);
        console.log('5. vehiclePreference:', trip.vehiclePreference);

        await trip.save();

        console.log('6. Trip object after save:', JSON.stringify(trip.toObject(), null, 2));
        console.log('===============================');

        res.status(201).json(trip);
    } catch (error) {
        console.error('Trip creation error:', error.message);
        console.error('Error details:', error);
        res.status(400).json({ error: 'Creation failed', details: error.message });
    }
});

// PATCH /api/trips/:id/assign - Assign a driver to a trip
router.patch('/:id/assign', async (req, res) => {
    try {
        const { driverId } = req.body;
        const trip = await Trip.findByIdAndUpdate(
            req.params.id,
            { assignedDriver: driverId, status: 'ASSIGNED' },
            { new: true }
        ).populate('assignedDriver');

        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        // Update Driver Status to BUSY
        if (driverId) {
            console.log(`Setting Driver ${driverId} status to BUSY`);
            const updatedDriver = await Driver.findByIdAndUpdate(driverId, { status: 'BUSY' }, { new: true });
            console.log('Driver updated:', updatedDriver);
        }

        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        // Notify driver (simulated)
        // req.io.emit(`driver_${driverId}`, { type: 'NEW_TRIP', trip });

        res.json(trip);
    } catch (error) {
        res.status(400).json({ error: 'Assignment failed', details: error.message });
    }
});

// PATCH /api/trips/:id/complete - Mark a trip as completed
router.patch('/:id/complete', async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        // Update trip status to COMPLETED and save details
        trip.status = 'COMPLETED';

        // Save completion details
        if (req.body.totalKm) trip.totalKm = req.body.totalKm;
        if (req.body.totalHours) trip.totalHours = req.body.totalHours;
        if (req.body.tollParking) trip.tollParking = req.body.tollParking;
        if (req.body.permit) trip.permit = req.body.permit;
        if (req.body.extraKm) trip.extraKm = req.body.extraKm;
        if (req.body.extraHours) trip.extraHours = req.body.extraHours;

        await trip.save();

        // Set driver back to ONLINE if they were assigned
        if (trip.assignedDriver) {
            console.log(`Setting Driver ${trip.assignedDriver} status to ONLINE`);
            const updatedDriver = await Driver.findByIdAndUpdate(
                trip.assignedDriver,
                { status: 'ONLINE' },
                { new: true }
            );
            console.log('Driver updated:', updatedDriver);
        }

        // Populate driver info before returning
        await trip.populate('assignedDriver');

        res.json(trip);
    } catch (error) {
        res.status(400).json({ error: 'Completion failed', details: error.message });
    }
});

// PATCH /api/trips/:id/cancel - Cancel a trip
router.patch('/:id/cancel', async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        // Update trip status to CANCELLED
        trip.status = 'CANCELLED';
        await trip.save();

        // Set driver back to ONLINE if they were assigned
        if (trip.assignedDriver) {
            console.log(`Setting Driver ${trip.assignedDriver} status to ONLINE (trip cancelled)`);
            const updatedDriver = await Driver.findByIdAndUpdate(
                trip.assignedDriver,
                { status: 'ONLINE' },
                { new: true }
            );
            console.log('Driver updated:', updatedDriver);
        }

        res.json(trip);
    } catch (error) {
        res.status(400).json({ error: 'Cancellation failed', details: error.message });
    }
});

// GET /api/trips/reports - Get consolidated trip metrics
router.get('/reports', async (req, res) => {
    try {
        const result = await Trip.aggregate([
            { $match: { status: 'COMPLETED' } },
            {
                $group: {
                    _id: null,
                    totalKm: { $sum: '$totalKm' },
                    totalHours: { $sum: '$totalHours' },
                    tollParking: { $sum: '$tollParking' },
                    permit: { $sum: '$permit' },
                    extraKm: { $sum: '$extraKm' },
                    extraHours: { $sum: '$extraHours' }
                }
            }
        ]);

        const metrics = result.length > 0 ? result[0] : {
            totalKm: 0,
            totalHours: 0,
            tollParking: 0,
            permit: 0,
            extraKm: 0,
            extraHours: 0
        };

        // Remove _id from response
        delete metrics._id;

        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: 'Reports fetch failed', details: error.message });
    }
});

// GET /api/trips/stats - Get trip statistics by status
router.get('/stats', async (req, res) => {
    try {
        const stats = await Trip.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Convert array to object with default values
        const result = {
            pending: 0,
            assigned: 0,
            completed: 0,
            cancelled: 0
        };

        stats.forEach(stat => {
            const status = stat._id.toLowerCase();
            result[status] = stat.count;
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Stats fetch failed', details: error.message });
    }
});

// GET /api/trips - List trips
router.get('/', async (req, res) => {
    try {
        const { status, userId } = req.query;
        const query = {};
        if (status) query.status = status;
        if (userId) query.userId = userId;
        const trips = await Trip.find(query).sort({ createdAt: -1 }).populate('assignedDriver');
        res.json(trips);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed', details: error.message });
    }
});

module.exports = router;
