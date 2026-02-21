const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const { authenticate, filterByOrganization } = require('../middleware/auth');
const mongoose = require('mongoose');

// Helper to get date difference in days
const getDaysDiff = (date1, date2) => {
    return Math.floor((date1 - date2) / (1000 * 60 * 60 * 24));
};

// Helper query function
const buildQuery = (req, baseQuery) => {
    const { startDate, endDate, consignorId, driverId } = req.query;
    let query = { ...baseQuery };

    if (startDate && endDate) {
        query.tripDateTime = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    if (consignorId) {
        query.consignorId = new mongoose.Types.ObjectId(consignorId);
    }

    if (driverId) {
        query.assignedDriver = new mongoose.Types.ObjectId(driverId);
    }

    return query;
};

// GET /api/reports/financials
router.get('/financials', authenticate, filterByOrganization, async (req, res) => {
    try {
        let query = {
            ...req.organizationFilter,
            // vehicleCategory: { $in: ['LCV', 'MCV', 'HCV', 'Container', 'Trailer'] } // Removed to show all
        };
        query = buildQuery(req, query);

        console.log('Reports Financials Query:', JSON.stringify(query, null, 2));

        // 1. Trip Profitability
        const profitability = await Trip.aggregate([
            { $match: query },
            { $sort: { tripDateTime: -1 } },
            {
                $lookup: {
                    from: 'drivers',
                    localField: 'assignedDriver',
                    foreignField: '_id',
                    as: 'driver'
                }
            },
            { $unwind: { path: '$driver', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'consignors',
                    localField: 'consignorId',
                    foreignField: '_id',
                    as: 'consignor'
                }
            },
            { $unwind: { path: '$consignor', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    date: '$tripDateTime',
                    tripId: '$_id',
                    consignorName: '$consignor.name',
                    vehicleNumber: '$driver.vehicleNumber',
                    totalHireValue: { $ifNull: ['$totalFreight', 0] },
                    driverPayable: { $ifNull: ['$driverTotalPayable', 0] }, // Includes advance + balance
                    driverAdvance: { $ifNull: ['$driverAdvance', 0] },
                    commission: { $ifNull: ['$commissionAmount', 0] },
                    expenses: {
                        $add: [
                            { $ifNull: ['$tollParking', 0] },
                            { $ifNull: ['$permit', 0] }
                        ]
                    },
                    grossProfit: {
                        $subtract: [
                            { $ifNull: ['$totalFreight', 0] },
                            { $add: [{ $ifNull: ['$driverTotalPayable', 0] }, { $ifNull: ['$tollParking', 0] }, { $ifNull: ['$permit', 0] }] }
                        ]
                    }
                }
            }
        ]);

        // 2. Commission Summary
        const commissionSummary = await Trip.aggregate([
            { $match: { ...query, commissionAmount: { $gt: 0 } } },
            {
                $group: {
                    _id: '$paymentMode', // Proxy for "Account"
                    totalCommission: { $sum: '$commissionAmount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            profitability,
            commissionSummary
        });

    } catch (error) {
        console.error('Error fetching financial reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/reports/aging
router.get('/aging', authenticate, filterByOrganization, async (req, res) => {
    try {
        let query = {
            ...req.organizationFilter
            // vehicleCategory: { $in: ['LCV', 'MCV', 'HCV', 'Container', 'Trailer'] }
        };
        query = buildQuery(req, query);

        // 1. Receivables Aging Bucket
        // Get all trips with outstanding balance in this period
        const outstandingTrips = await Trip.find({
            ...query,
            balanceReceivable: { $gt: 0 }
        }).populate('consignorId', 'name');

        const agingBuckets = {
            '0-30': [],
            '31-45': [],
            '45+': []
        };

        const now = new Date();

        outstandingTrips.forEach(trip => {
            const tripDate = new Date(trip.tripDateTime || trip.createdAt);
            const diffDays = Math.floor((now - tripDate) / (1000 * 60 * 60 * 24));

            const item = {
                tripId: trip._id,
                date: tripDate,
                consignorName: trip.consignorId?.name || 'Unknown',
                amount: trip.balanceReceivable,
                days: diffDays
            };

            if (diffDays <= 30) agingBuckets['0-30'].push(item);
            else if (diffDays <= 45) agingBuckets['31-45'].push(item);
            else agingBuckets['45+'].push(item);
        });

        // 2. Consignor Balance Report
        const consignorBalances = await Trip.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$consignorId',
                    totalInvoiced: { $sum: '$totalFreight' },
                    totalReceived: { $sum: '$consignorAdvance' },
                    totalOutstanding: { $sum: '$balanceReceivable' }
                }
            },
            {
                $lookup: {
                    from: 'consignors',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'consignor'
                }
            },
            { $unwind: '$consignor' },
            {
                $project: {
                    consignorName: '$consignor.name',
                    totalInvoiced: 1,
                    totalReceived: { $subtract: ['$totalInvoiced', '$totalOutstanding'] },
                    totalOutstanding: 1
                }
            }
        ]);

        // 3. Pending POD Report
        const pendingPOD = await Trip.find({
            ...query,
            status: { $in: ['COMPLETED', 'UNLOADED'] },
            'documents.type': { $ne: 'POD' }
        })
            .select('tripDateTime loadingLocation unloadingLocation vehicleCategory assignedDriver')
            .populate('assignedDriver', 'name vehicleNumber');

        res.json({
            agingBuckets,
            consignorBalances,
            pendingPOD
        });

    } catch (error) {
        console.error('Error fetching aging reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/reports/operations
router.get('/operations', authenticate, filterByOrganization, async (req, res) => {
    try {
        let query = {
            ...req.organizationFilter
            // vehicleCategory: { $in: ['LCV', 'MCV', 'HCV', 'Container', 'Trailer'] }
        };
        query = buildQuery(req, query);

        // 1. Vehicle Performance (Actual vs Expected)
        const vehiclePerformance = await Trip.aggregate([
            { $match: { ...query, actualWeight: { $exists: true, $gt: 0 }, expectedWeight: { $exists: true } } },
            {
                $lookup: {
                    from: 'drivers',
                    localField: 'assignedDriver',
                    foreignField: '_id',
                    as: 'driver'
                }
            },
            { $unwind: '$driver' },
            {
                $project: {
                    vehicleNumber: '$driver.vehicleNumber',
                    tripDate: '$tripDateTime',
                    expectedWeight: 1,
                    actualWeight: 1,
                    diff: { $subtract: ['$expectedWeight', '$actualWeight'] }
                }
            }
        ]);

        // 2. Problem & Exception Report
        const exceptions = await Trip.find({
            ...query,
            'issues.0': { $exists: true } // Trips with at least one issue
        })
            .select('tripDateTime issues assignedDriver')
            .populate('assignedDriver', 'name vehicleNumber');

        // 3. Driver/Owner Ledger
        const driverLedger = await Trip.aggregate([
            { $match: { ...query, assignedDriver: { $ne: null } } },
            {
                $group: {
                    _id: '$assignedDriver',
                    totalTrips: { $sum: 1 },
                    totalPayable: { $sum: '$driverTotalPayable' },
                    totalPaid: { $sum: '$driverAdvance' },
                    balance: { $sum: '$balancePayableToDriver' }
                }
            },
            {
                $lookup: {
                    from: 'drivers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'driver'
                }
            },
            { $unwind: '$driver' },
            {
                $project: {
                    driverName: '$driver.name',
                    vehicleNumber: '$driver.vehicleNumber',
                    totalTrips: 1,
                    totalPayable: 1,
                    totalPaid: 1,
                    balance: 1
                }
            }
        ]);

        res.json({
            vehiclePerformance,
            exceptions,
            driverLedger
        });

    } catch (error) {
        console.error('Error fetching ops reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
