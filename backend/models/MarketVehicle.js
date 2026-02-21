const mongoose = require('mongoose');

const MarketVehicleSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    lorryNumber: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    lorryName: String,
    ownerName: String,
    ownerPhone: String,
    ownerHometown: String,

    // Bank Details for Payments
    bankDetails: {
        accountName: String,
        bankName: String,
        accountNumber: String,
        ifsc: String,
        upiId: String
    },

    driverName: String,
    driverPhone: String,
    panNumber: String,

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('MarketVehicle', MarketVehicleSchema);
