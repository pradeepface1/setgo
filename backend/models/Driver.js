const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true, default: '$2a$10$YourHashedPasswordHere' }, // Will be properly hashed
    vehicleModel: { type: String, required: true }, // e.g., "Toyota Innova"
    vehicleNumber: { type: String, required: true },
    vehicleCategory: {
        type: String,
        enum: [
            'Sedan Regular', 'Sedan Premium', 'Sedan Premium+',
            'SUV Regular', 'SUV Premium',
            'Tempo Traveller', 'Force Premium',
            'Bus', 'High-End Coach'
        ],
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
    rating: { type: Number, default: 5.0 }
});

module.exports = mongoose.model('Driver', DriverSchema);
