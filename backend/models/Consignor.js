const mongoose = require('mongoose');

const ConsignorSchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    contactPerson: String,
    phone: String,
    email: String,
    address: String,
    gstin: String,

    // Default routes/rates can be stored here for auto-population
    defaultRoutes: [{
        from: String,
        to: String,
        ratePerTon: Number
    }],

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Consignor', ConsignorSchema);
