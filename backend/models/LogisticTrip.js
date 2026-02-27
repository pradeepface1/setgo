const mongoose = require('mongoose');

const LogisticTripSchema = new mongoose.Schema({
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },

    // Section 1: Turn Details
    tripDate: { type: Date, default: Date.now },
    month: String, // e.g., "Oct 2023"
    lorryNumber: { type: String, required: true },
    route: {
        from: String,
        to: String
    },

    // Section 2: Entities
    consignor: {
        name: String,
        mobile: String, // Added for persistence
        referenceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Consignor' }
    },
    marketVehicle: {
        lorryName: String,
        ownerName: String,
        ownerPhone: String,
        ownerHometown: String,
        driverName: String,
        driverPhone: String,
        panNumber: String
    },

    // Section 3: Loading & Consignment Details
    consignmentItem: String,
    weight: {
        loaded: Number,
        unloaded: Number,
        unit: { type: String, default: 'Ton' }
    },

    // Section 4: Costing (Expense/Debit - Payable to Lorry)
    costing: {
        ratePerTon: Number,
        hireValue: Number, // Gross Payable to Driver
        hireType: { type: String, enum: ['FIXED', 'PER_TON'], default: 'PER_TON' },

        loadingCharge: Number,
        unloadingCharge: Number,
        commission: Number,

        // Direct Consignor to Driver Payment
        toPayAmount: Number,
        toPayCommission: Number,
        toPayDate: Date,

        // Banking for Owner (Snapshot at time of trip)
        bankDetails: {
            accountName: String,
            bankName: String,
            accountNumber: String,
            ifsc: String,
            upiId: String
        }
    },

    // Section 5: Billing (Income/Credit - Receivable from Consignor)
    billing: {
        ratePerTon: Number,
        grossAmount: Number, // Consignor Payable
        loadingMamul: Number,
        totalReceivable: Number
    },

    // Additional Billing Fields (Root level as sent by form)
    billedWeight: Number,
    loadingMamul: Number,
    consignorUnloadingMamul: Number,
    consignorPaymentMamul: Number,
    tds: Number,
    roundOff: Number,
    balanceReceivable: Number,
    consignorAdvance: Number,
    consignorAdvancePaymentMode: String,
    consignorPaymentAccount: String,
    consignorBalanceReceived: Number,
    consignorBalanceReceivedDate: Date,
    consignorBalanceReceiveMode: String,
    consignorBalanceReceiveAccount: String,

    // Section 6: Payment Tracking (The Ledger)
    transactions: [{
        type: { type: String, enum: ['ADVANCE_PAID', 'PART_PAYMENT', 'BALANCE_PAID', 'RECEIVED_FROM_CONSIGNOR'] },
        amount: Number,
        date: { type: Date, default: Date.now },
        mode: { type: String, enum: ['CASH', 'BANK', 'UPI'] },
        reference: String,
        notes: String,
        status: { type: String, enum: ['PENDING', 'PAID', 'VERIFIED'], default: 'PAID' }
    }],

    // Summaries (Computed)
    financials: {
        totalDriverAdvance: { type: Number, default: 0 },
        totalDriverBalance: { type: Number, default: 0 },
        totalConsignorReceived: { type: Number, default: 0 },
        totalConsignorBalance: { type: Number, default: 0 }
    },

    status: {
        type: String,
        enum: ['PLANNED', 'LOADED', 'IN_TRANSIT', 'DELIVERED', 'SETTLED', 'CANCELLED'],
        default: 'PLANNED'
    },

    createdAt: { type: Date, default: Date.now }
});

// Middleware to calculate financials before saving
LogisticTripSchema.pre('save', function (next) {
    // 1. Calculate Driver/Market Vehicle Financials
    // Hire Value is usually Weight * Rate
    if (!this.costing.hireValue && this.costing.ratePerTon && this.weight.loaded) {
        this.costing.hireValue = this.costing.ratePerTon * this.weight.loaded;
    }

    let calculatedDriverPaid = 0;

    // 2. Calculate Consignor Financials
    // Gross Amount is Billing Rate * Weight
    if (!this.billing.grossAmount && this.billing.ratePerTon && this.weight.loaded) {
        this.billing.grossAmount = this.billing.ratePerTon * this.weight.loaded;
    }

    // Total Receivable = Gross + Mamul
    this.billing.totalReceivable = (this.billing.grossAmount || 0) + (this.billing.loadingMamul || 0);

    let calculatedConsignorReceived = 0;

    // 3. Process Transactions
    if (this.transactions && this.transactions.length > 0) {
        this.transactions.forEach(txn => {
            if (['ADVANCE_PAID', 'PART_PAYMENT', 'BALANCE_PAID'].includes(txn.type)) {
                calculatedDriverPaid += txn.amount;
            } else if (txn.type === 'RECEIVED_FROM_CONSIGNOR') {
                calculatedConsignorReceived += txn.amount;
            }
        });
    }

    this.financials.totalDriverAdvance = calculatedDriverPaid;
    // Driver Balance = Hire Value - Commission - Paid
    const deductions = (this.costing.commission || 0) + (this.costing.loadingCharge || 0) + (this.costing.unloadingCharge || 0);
    this.financials.totalDriverBalance = (this.costing.hireValue || 0) - deductions - calculatedDriverPaid;

    this.financials.totalConsignorReceived = calculatedConsignorReceived;
    this.financials.totalConsignorBalance = this.billing.totalReceivable - calculatedConsignorReceived;

    next();
});

module.exports = mongoose.model('LogisticTrip', LogisticTripSchema);
