const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true }, // Unique per organization, not globally
    password: { type: String, required: true, default: '$2a$10$YourHashedPasswordHere' }, // Will be properly hashed
    vehicleModel: { type: String, required: true }, // e.g., "Toyota Innova"
    vehicleNumber: { type: String, required: true },
    vehicleCategory: {
        type: String,
        enum: [
            'Sedan Regular', 'Sedan Premium', 'Sedan Premium+',
            'SUV Regular', 'SUV Premium',
            'Tempo Traveller', 'Force Premium',
            'Bus', 'High End Coaches'
        ],
        required: true
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true,
        index: true
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
    rating: { type: Number, default: 5.0 }
});

// Phone number unique per organization
DriverSchema.index({ organizationId: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Driver', DriverSchema);
