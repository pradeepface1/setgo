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
        let query = { ...req.organizationFilter };
        query = buildQuery(req, query);

        // 1. Trip Profitability & Detailed Metrics
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
                    consignorName: { $ifNull: ['$consignor.name', '$consignorName'] },
                    consignorMobile: { $ifNull: ['$consignor.phone', '$consignorMobile'] },
                    vehicleNumber: { $ifNull: ['$driver.vehicleNumber', '$vehicleNumber'] },
                    unloadingLocation: 1,
                    totalFreight: { $ifNull: ['$totalFreight', 0] },
                    driverPayable: { $ifNull: ['$driverTotalPayable', 0] },
                    driverAdvance: { $ifNull: ['$driverAdvance', 0] },
                    driverBalancePaid: { $ifNull: ['$driverBalancePaid', 0] },
                    consignorAdvance: { $ifNull: ['$consignorAdvance', 0] },
                    consignorBalanceReceived: { $ifNull: ['$consignorBalanceReceived', 0] },
                    commission: { $ifNull: ['$commissionAmount', 0] },
                    balanceReceivable: { $ifNull: ['$balanceReceivable', 0] },
                    balancePayableToDriver: { $ifNull: ['$balancePayableToDriver', 0] },
                    driverBalanceStatus: { $ifNull: ['$driverBalanceStatus', 'PENDING'] },
                    handLoanAmount: { $ifNull: ['$handLoan.amount', 0] },
                    driverOtherExpenses: { $ifNull: ['$driverOtherExpenses', 0] },
                    driverLoadingCommission: { $ifNull: ['$driverLoadingCommission', 0] },
                    consignorBalanceReceiveMode: 1,
                    driverBalanceStatus: { $ifNull: ['$driverBalanceStatus', 'PENDING'] },
                    // To Pay: use stored fields
                    toPayAmount: { $ifNull: ['$toPayAmount', 0] },
                    toPayCommission: { $ifNull: ['$toPayCommission', 0] },
                    toPayPendingCommission: { $ifNull: ['$toPayPendingCommission', 0] },
                    toPayDate: 1,
                    // Calculated fields for frontend
                    totalHireValue: { $ifNull: ['$driverTotalPayable', 0] },
                    expenses: { $ifNull: ['$driverOtherExpenses', 0] },
                    grossProfit: {
                        $subtract: [
                            { $ifNull: ['$totalFreight', 0] },
                            { $add: [{ $ifNull: ['$driverTotalPayable', 0] }, { $ifNull: ['$driverOtherExpenses', 0] }] }
                        ]
                    }
                }
            }
        ]);

        // 2. Financial Summary Buckets
        const summary = profitability.reduce((acc, trip) => {
            // Commission Calculation based on Actual Cashflow
            const consignorTotalReceived = (trip.consignorAdvance || 0) + (trip.consignorBalanceReceived || 0);
            const driverTotalPaid = (trip.driverAdvance || 0) + (trip.driverBalancePaid || 0);
            const realizedProfit = consignorTotalReceived - driverTotalPaid - (trip.driverOtherExpenses || 0);
            const expectedProfit = trip.commission || 0;

            acc.commission.received += Math.max(0, realizedProfit);
            acc.commission.pending += Math.max(0, expectedProfit - realizedProfit);

            // Driver
            // "Expenses" -> Maps to Payable to Lorry (Net Driver Keeps)
            if (trip.toPayAmount > 0) {
                acc.driver.expenses += Math.max(0, (trip.toPayAmount || 0) - (trip.toPayCommission || 0));
            } else {
                acc.driver.expenses += trip.driverPayable || 0;
            }

            // "Net Outstanding" -> Maps to Pending amount (balancePayableToDriver)
            // For To Pay trips, tracking unpaid commission to admin
            if (trip.toPayAmount > 0) {
                acc.driver.netOutstanding += trip.toPayPendingCommission || 0;
            } else {
                acc.driver.netOutstanding += trip.balancePayableToDriver || 0;
            }

            // Consignor
            if (trip.toPayAmount > 0) {
                acc.consignor.totalRevenue += trip.toPayAmount || 0;
            } else {
                acc.consignor.totalRevenue += trip.totalFreight || 0;
            }
            acc.consignor.totalOutstanding += trip.balanceReceivable || 0;

            // To Pay (Consignor pays driver directly; driver owes commission back)
            // toPayPendingCommission = what's still owed (admin sets to 0 when collected)
            // Commission Received = toPayCommission - toPayPendingCommission
            if (trip.toPayAmount > 0) {
                const pending = trip.toPayPendingCommission || 0;
                const received = Math.max(0, (trip.toPayCommission || 0) - pending);

                // Also add to main commission buckets for the aggregate view
                acc.commission.received += received;
                acc.commission.pending += pending;

                acc.toPay.received += received;
                acc.toPay.pending += pending;
                acc.toPay.totalFreight += trip.toPayAmount || 0;
            }

            return acc;
        }, {
            commission: { received: 0, pending: 0 },
            driver: { expenses: 0, netOutstanding: 0, handloanPending: 0 },
            consignor: { totalRevenue: 0, totalOutstanding: 0 },
            toPay: { totalFreight: 0, received: 0, pending: 0 }
        });

        // Calculate actual Handloan Pending from HandLoan model
        const HandLoan = require('../models/HandLoan'); // Ensure imported if not already
        const activeHandLoans = await HandLoan.find({
            ...req.organizationFilter,
            status: { $in: ['PENDING', 'PARTIAL'] }
        });

        let totalHandLoanPending = 0;
        activeHandLoans.forEach(loan => {
            const recovered = loan.recoveries?.reduce((sum, r) => sum + r.amount, 0) || 0;
            totalHandLoanPending += Math.max(0, loan.amount - recovered);
        });
        summary.driver.handloanPending = totalHandLoanPending;

        // 3. Driver Balance Pending Recovery (Trips with pending commission or handloans)
        const driverBalancePending = await Trip.find({

            ...query,
            driverBalanceStatus: { $in: ['PENDING', 'PARTIALLY_COLLECTED'] }
        }).sort({ tripDateTime: -1 });

        res.json({
            profitability,
            summary,
            driverBalancePending
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
                    totalInvoiced: {
                        $sum: {
                            $cond: [
                                { $gt: [{ $toDouble: { $ifNull: ['$toPayAmount', 0] } }, 0] },
                                { $toDouble: { $ifNull: ['$toPayAmount', 0] } },
                                { $toDouble: { $ifNull: ['$totalFreight', 0] } }
                            ]
                        }
                    },
                    totalReceived: { $sum: { $toDouble: { $ifNull: ['$consignorAdvance', 0] } } },
                    totalOutstanding: { $sum: { $toDouble: { $ifNull: ['$balanceReceivable', 0] } } }
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
                    diff: {
                        $subtract: [
                            { $toDouble: { $ifNull: ['$expectedWeight', 0] } },
                            { $toDouble: { $ifNull: ['$actualWeight', 0] } }
                        ]
                    }
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
                    totalPayable: {
                        $sum: {
                            $cond: [
                                { $gt: [{ $toDouble: { $ifNull: ['$toPayAmount', 0] } }, 0] },
                                {
                                    $subtract: [
                                        { $toDouble: { $ifNull: ['$toPayAmount', 0] } },
                                        { $toDouble: { $ifNull: ['$toPayCommission', 0] } }
                                    ]
                                },
                                { $toDouble: { $ifNull: ['$driverTotalPayable', 0] } }
                            ]
                        }
                    },
                    totalPaid: { $sum: { $toDouble: { $ifNull: ['$driverAdvance', 0] } } },
                    balance: { $sum: { $toDouble: { $ifNull: ['$balancePayableToDriver', 0] } } }
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

// GET /api/reports/analytical
router.get('/analytical', authenticate, filterByOrganization, async (req, res) => {
    try {
        let query = { ...req.organizationFilter };
        query = buildQuery(req, query);

        // 1. Route Profitability
        const routeProfitability = await Trip.aggregate([
            { $match: query },
            {
                $group: {
                    _id: { from: '$loadingLocation', to: '$unloadingLocation' },
                    totalTrips: { $sum: 1 },
                    totalRevenue: { $sum: { $ifNull: ['$totalFreight', 0] } },
                    totalCost: { $sum: { $ifNull: ['$driverTotalPayable', 0] } },
                    totalCommission: { $sum: { $ifNull: ['$commissionAmount', 0] } }
                }
            },
            {
                $project: {
                    route: { $concat: [{ $ifNull: ['$_id.from', 'Unknown'] }, ' → ', { $ifNull: ['$_id.to', 'Unknown'] }] },
                    totalTrips: 1,
                    totalRevenue: 1,
                    totalCost: 1,
                    avgMargin: {
                        $cond: [
                            { $gt: ['$totalRevenue', 0] },
                            { $multiply: [{ $divide: [{ $subtract: ['$totalRevenue', '$totalCost'] }, '$totalRevenue'] }, 100] },
                            0
                        ]
                    }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        // 2. Collection Efficiency (To Pay Trips)
        const toPayStats = await Trip.aggregate([
            {
                $match: {
                    ...query,
                    consignorBalanceReceiveMode: 'DIRECT_TO_DRIVER',
                    commissionAmount: { $gt: 0 }
                }
            },
            {
                $group: {
                    _id: '$driverBalanceStatus',
                    count: { $sum: 1 },
                    amount: { $sum: '$commissionAmount' }
                }
            }
        ]);

        // 3. Claims & Shortages
        const claimsSummary = await Trip.aggregate([
            { $match: query },
            { $unwind: { path: '$driverOtherExpensesDetails', preserveNullAndEmptyArrays: false } },
            { $match: { 'driverOtherExpensesDetails.expenseType': { $in: ['Claim', 'Shortage'] } } },
            {
                $group: {
                    _id: '$driverOtherExpensesDetails.expenseType',
                    totalAmount: { $sum: '$driverOtherExpensesDetails.amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // 4. TDS Summary (Monthly)
        const tdsSummary = await Trip.aggregate([
            { $match: { ...query, tds: { $gt: 0 } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$tripDateTime" } },
                    totalTds: { $sum: '$tds' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            routeProfitability,
            toPayStats,
            claimsSummary,
            tdsSummary
        });

    } catch (error) {
        console.error('Error fetching analytical reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/reports/handloans
router.get('/handloans', authenticate, filterByOrganization, async (req, res) => {
    try {
        const HandLoan = require('../models/HandLoan');
        const orgFilter = { ...req.organizationFilter };

        // Optional date filtering
        if (req.query.startDate || req.query.endDate) {
            orgFilter.date = {};
            if (req.query.startDate) orgFilter.date.$gte = new Date(req.query.startDate);
            if (req.query.endDate) {
                const end = new Date(req.query.endDate);
                end.setHours(23, 59, 59, 999);
                orgFilter.date.$lte = end;
            }
        }

        // Optional driver filter
        if (req.query.driverId) orgFilter.driverId = req.query.driverId;

        const loans = await HandLoan.find(orgFilter).sort({ date: -1 });

        // Shape records for frontend table (same keys the UI expects)
        const handLoanTrips = loans.map(loan => {
            const totalRecovered = (loan.recoveries || []).reduce((sum, r) => sum + (r.amount || 0), 0);
            const balance = Math.max(0, loan.amount - totalRecovered);

            return {
                _id: loan._id,
                date: loan.date,
                driverName: loan.driverName || 'Unknown',
                vehicleNumber: loan.vehicleNumber || '—',
                consignorName: '—',           // standalone loans have no consignor
                loadingLocation: '—',
                unloadingLocation: '—',
                handLoanAmount: loan.amount || 0,
                handLoanPaymentMode: 'CASH',
                handLoanRemarks: loan.reason || '',
                commissionAmount: 0,
                totalOwedByDriver: balance,
                driverBalanceCollectedAmount: totalRecovered,
                driverBalancePendingAmount: balance,
                driverBalanceStatus: loan.status === 'RECOVERED'
                    ? 'COLLECTED'
                    : loan.status === 'PARTIALLY_RECOVERED'
                        ? 'PARTIALLY_COLLECTED'
                        : 'PENDING'
            };
        });

        // Summary buckets
        const summary = handLoanTrips.reduce((acc, loan) => {
            acc.totalIssued += loan.handLoanAmount;
            acc.totalRecovered += loan.driverBalanceCollectedAmount;
            acc.totalPending += loan.driverBalancePendingAmount;
            return acc;
        }, { totalIssued: 0, totalRecovered: 0, totalPending: 0 });

        res.json({ handLoanTrips, summary });

    } catch (error) {
        console.error('Error fetching hand loan reports:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
