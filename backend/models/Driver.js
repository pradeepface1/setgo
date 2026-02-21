const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true }, // Unique per organization, not globally
    password: { type: String, required: true, default: '$2a$10$YourHashedPasswordHere' }, // Will be properly hashed
    vehicleModel: { type: String }, // Optional
    vehicleNumber: { type: String }, // Optional
    vehicleCategory: {
        type: String,
        // Enum validation removed or extended to allow Logistics types if strictness passed
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
    },
    vertical: {
        type: String,
        enum: ['TAXI', 'LOGISTICS'],
        default: 'TAXI',
        required: true
    },
    status: {
        type: String,
        enum: ['ONLINE', 'OFFLINE', 'BUSY'],
        default: 'OFFLINE'
    },
    currentLocation: {
        lat: Number,
        lng: Number
    },
    rating: { type: Number, default: 5.0 },
    // Logistics Specific Fields
    lorryName: String,
    ownerName: String,
    ownerPhone: String,
    ownerHometown: String,
    panNumber: String,

    // Fleet Compliance Documents
    fcStatus: Date,       // Fitness Certificate Expiry
    insuranceExpiry: Date,
    taxExpiry: Date,

    isActive: { type: Boolean, default: true },

    bankDetails: {
        accountName: String,
        bankName: String,
        accountNumber: String,
        ifsc: String,
        upiNumber: String
    }
});

// Phone number unique per organization
DriverSchema.index({ organizationId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Driver', DriverSchema);
