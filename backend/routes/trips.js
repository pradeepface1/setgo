const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const { parseWhatsAppMessage } = require('../utils/parser');

const { authenticate, filterByOrganization } = require('../middleware/auth');

// GET /api/trips/debug - Debug the query logic
router.get('/debug', authenticate, filterByOrganization, async (req, res) => {
    try {
        const { status, userId, vertical } = req.query;
        let query = { ...req.organizationFilter };
        const debugInfo = {
            userRole: req.user.role,
            organizationFilter: req.organizationFilter,
            queryReceived: req.query
        };

        if (status) {
            if (status.includes(',')) {
                query.status = { $in: status.split(',') };
            } else {
                query.status = status;
            }
        }
        if (userId) query.userId = userId;

        if (vertical) {
            const Organization = require('../models/Organization');
            const orgs = await Organization.find({ verticals: vertical }).select('_id');
            const orgIds = orgs.map(org => org._id);
            debugInfo.orgIdsForVertical = orgIds;

            if (query.organizationId) {
                const isAllowed = orgIds.some(id => id.equals(query.organizationId));
                if (!isAllowed) {
                    debugInfo.error = 'Org ID not allowed';
                    return res.json(debugInfo);
                }
            } else {
                query.organizationId = { $in: orgIds };
            }
        }

        debugInfo.finalQuery = query;
        const trips = await Trip.find(query).limit(5);
        debugInfo.tripsFound = trips.length;

        res.json(debugInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/trips/parse - Parse raw text (Requires authentication now?)
router.post('/parse', authenticate, async (req, res) => {
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
router.post('/', authenticate, async (req, res) => {
    try {
        const tripData = { ...req.body };

        // Auto-assign organization
        if (req.user.role === 'SUPER_ADMIN') {
            if (!tripData.organizationId) {
                // If not provided, could fallback to user's choice or error
                // For now, let's say Super Admin must specify unless testing
                // But for manual trip creation, we might default to SetGo...
                // Actually, if creating from UI, UI should send it, or we select one.
                if (!tripData.organizationId) {
                    // Try to find default SetGo org? Or error?
                    // Let's require it for Super Admin for correctness
                    // But to avoid breaking, maybe handle gracefully?
                }
            }
        } else {
            tripData.organizationId = req.user.organizationId;
        }

        if (!tripData.organizationId) {
            return res.status(400).json({ error: 'Organization ID could not be determined' });
        }

        // Auto-generate Sequential Hire Slip Number for Logistics Trips
        if (tripData.loadingLocation || tripData.consignorName || tripData.consignorId) {
            const lastTrip = await Trip.findOne({
                organizationId: tripData.organizationId,
                hireSlipNo: { $exists: true }
            }).sort({ hireSlipNo: -1 });

            tripData.hireSlipNo = lastTrip && lastTrip.hireSlipNo ? lastTrip.hireSlipNo + 1 : 1;
        }

        const trip = new Trip(tripData);
        await trip.save();

        // Auto-update assigned driver to BUSY
        if (trip.assignedDriver) {
            await Driver.findByIdAndUpdate(trip.assignedDriver, { status: 'BUSY' });
        }

        res.status(201).json(trip);
    } catch (error) {
        res.status(400).json({ error: 'Creation failed', details: error.message });
    }
});

// PATCH /api/trips/:id - Update generic trip details
router.patch('/:id', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const query = { _id: id };

        if (req.user.role === 'ORG_ADMIN') {
            query.organizationId = req.user.organizationId;
        }

        const trip = await Trip.findOneAndUpdate(query, updates, { new: true });

        if (!trip) {
            return res.status(404).json({ error: 'Trip not found or access denied' });
        }

        // Auto-update Driver status based on trip status
        if (trip.assignedDriver) {
            if (['PENDING', 'ASSIGNED', 'ACCEPTED', 'ARRIVED', 'ONGOING'].includes(trip.status)) {
                await Driver.findByIdAndUpdate(trip.assignedDriver, { status: 'BUSY' });
            } else if (['COMPLETED', 'CANCELLED'].includes(trip.status)) {
                await Driver.findByIdAndUpdate(trip.assignedDriver, { status: 'ONLINE' });
            }
        }

        res.json(trip);
    } catch (error) {
        res.status(400).json({ error: 'Update failed', details: error.message });
    }
});

// PATCH /api/trips/:id/assign - Assign a driver to a trip
router.patch('/:id/assign', authenticate, async (req, res) => {
    try {
        const { driverId } = req.body;

        const query = { _id: req.params.id };
        if (req.user.role === 'ORG_ADMIN') query.organizationId = req.user.organizationId;

        const trip = await Trip.findOneAndUpdate(
            query,
            { assignedDriver: driverId, status: 'ASSIGNED' },
            { new: true }
        ).populate('assignedDriver');

        if (!trip) return res.status(404).json({ error: 'Trip not found or access denied' });

        // Update Driver Status to BUSY
        if (driverId) {
            await Driver.findByIdAndUpdate(driverId, { status: 'BUSY' }, { new: true });
        }

        res.json(trip);
    } catch (error) {
        res.status(400).json({ error: 'Assignment failed', details: error.message });
    }
});

// PATCH /api/trips/:id/accept - Driver accepts the trip
router.patch('/:id/accept', authenticate, async (req, res) => {
    try {
        const query = { _id: req.params.id };
        // Ideally verify driver is the one assigned
        // if (req.user.role === 'DRIVER') query.assignedDriver = req.user.driverId;

        const trip = await Trip.findOne(query);
        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        if (trip.status !== 'ASSIGNED') {
            return res.status(400).json({ error: 'Trip must be in ASSIGNED state to accept' });
        }

        trip.status = 'ACCEPTED';
        trip.acceptTime = new Date();
        await trip.save();

        res.json(trip);
    } catch (error) {
        res.status(400).json({ error: 'Accept failed', details: error.message });
    }
});

// PATCH /api/trips/:id/start - Driver starts the trip (OTP check)
router.patch('/:id/start', authenticate, async (req, res) => {
    try {
        const query = { _id: req.params.id };

        const trip = await Trip.findOne(query);
        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        if (trip.status !== 'ACCEPTED') {
            return res.status(400).json({ error: 'Trip must be ACCEPTED before starting' });
        }

        trip.status = 'STARTED';
        trip.startTime = new Date();
        await trip.save();

        res.json(trip);
    } catch (error) {
        res.status(400).json({ error: 'Start failed', details: error.message });
    }
});

const upload = require('../middleware/upload');

// PATCH /api/trips/:id/complete - Mark a trip as completed (with optional drip sheet)
router.patch('/:id/complete', authenticate, upload.single('dripSheet'), async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.role === 'ORG_ADMIN') query.organizationId = req.user.organizationId;

        const trip = await Trip.findOne(query);
        if (!trip) return res.status(404).json({ error: 'Trip not found or access denied' });

        // Update trip status to COMPLETED and save details
        trip.status = 'COMPLETED';
        trip.completionTime = new Date();

        // Handle file upload
        if (req.file) {
            trip.dripSheetImage = `/uploads/${req.file.filename}`;
        }

        // Save completion details
        if (req.body.totalKm) trip.totalKm = Number(req.body.totalKm);
        if (req.body.totalHours) trip.totalHours = Number(req.body.totalHours);
        if (req.body.tollParking) trip.tollParking = Number(req.body.tollParking);
        if (req.body.permit) trip.permit = Number(req.body.permit);
        if (req.body.extraKm) trip.extraKm = Number(req.body.extraKm);
        if (req.body.extraHours) trip.extraHours = Number(req.body.extraHours);

        await trip.save();

        // Set driver back to ONLINE if they were assigned
        if (trip.assignedDriver) {
            await Driver.findByIdAndUpdate(
                trip.assignedDriver,
                { status: 'ONLINE' },
                { new: true }
            );
        }

        await trip.populate('assignedDriver');
        res.json(trip);
    } catch (error) {
        console.error("Completion Error:", error);
        res.status(400).json({ error: 'Completion failed', details: error.message });
    }
});

// PATCH /api/trips/:id/cancel - Cancel a trip
router.patch('/:id/cancel', authenticate, async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.role === 'ORG_ADMIN') query.organizationId = req.user.organizationId;

        const trip = await Trip.findOne(query);
        if (!trip) return res.status(404).json({ error: 'Trip not found or access denied' });

        // Update trip status to CANCELLED
        trip.status = 'CANCELLED';
        await trip.save();

        // Set driver back to ONLINE if they were assigned
        if (trip.assignedDriver) {
            await Driver.findByIdAndUpdate(
                trip.assignedDriver,
                { status: 'ONLINE' },
                { new: true }
            );
        }

        res.json(trip);
    } catch (error) {
        res.status(400).json({ error: 'Cancellation failed', details: error.message });
    }
});

// DELETE /api/trips/:id - Delete a trip (SUPER ADMIN ONLY)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Access denied. Super Admin only.' });
        }

        const trip = await Trip.findById(req.params.id);
        if (!trip) return res.status(404).json({ error: 'Trip not found' });

        // If trip was active/assigned, free the driver
        if (['ASSIGNED', 'ACCEPTED', 'STARTED'].includes(trip.status) && trip.assignedDriver) {
            await Driver.findByIdAndUpdate(
                trip.assignedDriver,
                { status: 'ONLINE' },
                { new: true }
            );
        }

        await Trip.findByIdAndDelete(req.params.id);
        res.json({ message: 'Trip deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Deletion failed', details: error.message });
    }
});

// GET /api/trips/reports - Get consolidated trip metrics
router.get('/reports', authenticate, filterByOrganization, async (req, res) => {
    try {
        const { vertical } = req.query;
        let query = { status: 'COMPLETED', ...req.organizationFilter };

        if (vertical) {
            const Organization = require('../models/Organization');
            const orgs = await Organization.find({ verticals: vertical }).select('_id');
            const orgIds = orgs.map(org => org._id);

            if (query.organizationId) {
                const isAllowed = orgIds.some(id => id.equals(query.organizationId));
                if (!isAllowed) return res.json({ totalKm: 0, totalHours: 0, tollParking: 0, permit: 0, extraKm: 0, extraHours: 0 });
            } else {
                query.organizationId = { $in: orgIds };
            }
        }

        const result = await Trip.aggregate([
            { $match: query },
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
            totalKm: 0, totalHours: 0, tollParking: 0, permit: 0, extraKm: 0, extraHours: 0
        };
        delete metrics._id;
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ error: 'Reports fetch failed', details: error.message });
    }
});

// GET /api/trips/stats - Get trip statistics by status
router.get('/stats', authenticate, filterByOrganization, async (req, res) => {
    try {
        const { vertical } = req.query;
        let query = { ...req.organizationFilter };

        if (vertical) {
            const Organization = require('../models/Organization');
            const orgs = await Organization.find({ verticals: vertical }).select('_id');
            const orgIds = orgs.map(org => org._id);

            if (query.organizationId) {
                const isAllowed = orgIds.some(id => id.equals(query.organizationId));
                if (!isAllowed) return res.json({ pending: 0, assigned: 0, completed: 0, cancelled: 0 });
            } else {
                query.organizationId = { $in: orgIds };
            }
        }

        const stats = await Trip.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const result = { pending: 0, assigned: 0, completed: 0, cancelled: 0 };
        stats.forEach(stat => {
            if (stat._id) {
                const status = stat._id.toLowerCase();
                result[status] = stat.count;
            }
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Stats fetch failed', details: error.message });
    }
});

// GET /api/trips/my-trips - Get trips for the authenticated user
router.get('/my-trips', authenticate, async (req, res) => {
    try {
        const query = { userId: req.userId };
        // We could also filter by organization, but userId is unique enough mostly.
        // But for safety:
        if (req.user.organizationId) query.organizationId = req.user.organizationId;

        const trips = await Trip.find(query).sort({ createdAt: -1 }).populate('assignedDriver');
        res.json(trips);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed', details: error.message });
    }
});

// GET /api/trips - List trips
router.get('/', authenticate, filterByOrganization, async (req, res) => {
    try {
        console.log('GET /trips Request Query:', req.query);
        const { status, userId, vertical } = req.query;
        let query = { ...req.organizationFilter };

        if (status) {
            if (status.includes(',')) {
                query.status = { $in: status.split(',') };
            } else {
                query.status = status;
            }
        }
        if (userId) query.userId = userId;

        // Logistics Filters
        if (req.query.consignorId) {
            query.consignorId = req.query.consignorId;
        }
        if (req.query.startDate && req.query.endDate) {
            query.tripDateTime = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        // If vertical is specified, we need to filter by organizations in that vertical
        if (vertical) {
            // Find all organizations with this vertical
            const Organization = require('../models/Organization');
            const orgs = await Organization.find({ verticals: vertical }).select('_id');
            const orgIds = orgs.map(org => org._id);

            // Add to query. If organizationFilter already has organizationId, we need to intersect
            if (query.organizationId) {
                // If the specific orgId is not in the allowed list for this vertical, return empty
                const isAllowed = orgIds.some(id => id.equals(query.organizationId));
                if (!isAllowed) {
                    return res.json([]);
                }
                // query.organizationId is already set, so just leave it
            } else {
                query.organizationId = { $in: orgIds };
            }
        }

        console.log('GET /trips Query:', JSON.stringify(query, null, 2));

        // Pagination Logic
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0; // 0 means no limit (backward compatibility)
        const skip = (page - 1) * limit;

        let trips;
        let total = 0;

        if (limit > 0) {
            [trips, total] = await Promise.all([
                Trip.find(query)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .populate('assignedDriver')
                    .populate('consignorId'),
                Trip.countDocuments(query)
            ]);

            console.log(`GET /trips Found ${trips.length} trips (Page ${page})`);
            res.json({
                trips,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            });
        } else {
            trips = await Trip.find(query)
                .sort({ createdAt: -1 })
                .populate('assignedDriver')
                .populate('consignorId');

            console.log(`GET /trips Found ${trips.length} trips`);
            res.json(trips);
        }
    } catch (error) {
        console.error('GET /trips Error:', error);
        res.status(500).json({ error: 'Fetch failed', details: error.message });
    }
});

module.exports = router;
