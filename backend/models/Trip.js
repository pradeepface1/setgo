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
            'High End Coaches'
        ]
    },
    vehicleSubcategory: {
        type: String
    },
    // Legacy field for backward compatibility
    vehiclePreference: String,
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'ASSIGNED', 'COMPLETED', 'CANCELLED'],
        default: 'PENDING'
    },
    assignedDriver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Trip Completion Details
    totalKm: Number,
    totalHours: Number,
    tollParking: Number,
    permit: Number,
    extraKm: Number,
    extraHours: Number
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
