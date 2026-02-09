const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Optional, in case user is not logged in or we just want basic details
    },
    customerName: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: { type: String } // Optional address string
    },
    status: {
        type: String,
        enum: ['OPEN', 'RESOLVED', 'FALSE_ALARM'],
        default: 'OPEN'
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Admin user
    },
    resolvedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('SOS', sosSchema);
