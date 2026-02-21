const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
    requestSource: {
        type: String,
        enum: ['WHATSAPP', 'EMAIL', 'MANUAL', 'APP'],
        default: 'WHATSAPP'
    },
    originalText: String, // Store the raw message for debugging/verification
    customerName: String,
    customerContact: String,
    pickupLocation: String,
    pickupType: {
        type: String,
        enum: ['AIRPORT', 'RAILWAY_STATION', 'BUS_STAND', 'OTHERS'],
        default: 'OTHERS'
    },
    pickupContext: {
        flightNumber: String,
        trainNumber: String,
        busNumber: String
    },
    googleLocation: String, // URL or Coordinates
    dropLocation: String,
    tripDateTime: Date,
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional for now to support legacy/manual trips
    },
    vehicleCategory: {
        type: String,
        enum: [
            'Sedan Regular',
            'Sedan Premium',
            'Sedan Premium+',
            'SUV Regular',
            'SUV Premium',
            'Tempo Traveller',
            'Force Premium',
            'Bus',
            'High End Coaches',
            // Logistics
            'LCV', 'MCV', 'HCV', 'Container', 'Trailer'
        ]
    },
    vehicleSubcategory: {
        type: String
    },
    // Legacy field for backward compatibility
    vehiclePreference: String,
    status: {
        type: String,
        enum: [
            'PENDING', 'ACCEPTED', 'ASSIGNED', 'STARTED', 'COMPLETED', 'CANCELLED',
            // Logistics Statuses
            'LOADING', 'IN_TRANSIT', 'UNLOADED', 'PAYMENT_PENDING'
        ],
        default: 'PENDING'
    },
    assignedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        default: null
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Trip Flow Details
    // Trip Flow Details
    acceptTime: Date,
    startTime: Date,
    completionTime: Date,
    dripSheetImage: String, // Path to uploaded image

    // Trip Completion Details
    totalKm: Number,
    totalHours: Number,
    tollParking: Number,
    permit: Number,
    extraKm: Number,
    extraHours: Number,

    // ==========================================
    // LOGISTICS SPECIFIC FIELDS
    // ==========================================
    consignorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Consignor'
    },
    loadingLocation: String,
    unloadingLocation: String,
    expectedWeight: Number, // Tons
    actualWeight: Number,   // Tons

    // Commercials
    ratePerTon: Number,
    totalFreight: Number,       // totalWeight * ratePerTon
    commissionPercentage: Number,
    commissionAmount: Number,
    driverAdvance: Number,      // Paid to driver
    driverAdvancePaymentMode: {
        type: String,
        enum: ['CASH', 'NEFT', 'UPI', 'IMPS', 'DIESEL', 'CREDIT'],
        default: 'CASH'
    },
    consignorAdvance: Number,   // Received from consignor
    consignorAdvancePaymentMode: {
        type: String,
        enum: ['CASH', 'NEFT', 'UPI', 'IMPS', 'CHEQUE'],
        default: 'CASH'
    },
    paymentMode: { // Deprecated mostly, but keeping for legacy
        type: String,
        enum: ['CASH', 'NEFT', 'UPI', 'IMPS', 'DIESEL', 'CREDIT'],
        default: 'CASH'
    },
    // Calculated Balances
    balanceReceivable: Number, // From Consignor
    balancePayableToDriver: Number, // To Driver/Owner

    // Driver Payables (Expense Side)
    driverRatePerTon: Number,
    driverTotalPayable: Number,
    loadingCharge: Number,      // Costing side (payable to labor)
    unloadingCharge: Number,    // Costing side (payable to labor)
    driverLoadingCommission: Number, // Commission deducted from Hire Value
    driverOtherExpenses: Number, // Additional deductable expenses

    // Consignor Receivables
    loadingMamul: Number,       // Billing side
    consignorName: String,     // Free text name if ID not present

    // Document Generation
    hireSlipNo: Number,        // Auto-incrementing L.R. / Hire Slip Number

    // Proof Documents
    documents: [{
        type: { type: String, enum: ['LR', 'POD', 'WEIGHT_SLIP', 'OTHER'] },
        url: String,
        uploadedAt: { type: Date, default: Date.now }
    }],

    // Issue Tracking
    issues: [{
        type: { type: String, enum: ['ACCIDENT', 'SHORTAGE', 'DELAY', 'DOC_ISSUE', 'OTHER'] },
        description: String,
        reportedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' }
    }],

    consignmentItem: String, // Added field
    loadingDate: Date,       // Added field for Logistics Loading Date

    // Ad-hoc Vehicle Details (Snapshot)
    vehicleNumber: String,
    lorryName: String,         // Specific name of the lorry/transport co
    ownerName: String,         // Lorry Owner Name
    ownerPhone: String,        // Lorry Owner Phone
    driverName: String,
    driverPhone: String
});

// Pre-save hook for debugging
TripSchema.pre('save', async function () {
    console.log('===== PRE-SAVE HOOK =====');
    console.log('vehicleCategory:', this.vehicleCategory);
    console.log('vehicleSubcategory:', this.vehicleSubcategory);
    console.log('vehiclePreference:', this.vehiclePreference);
    console.log('requestSource:', this.requestSource);
    console.log('=========================');
});

module.exports = mongoose.model('Trip', TripSchema);
