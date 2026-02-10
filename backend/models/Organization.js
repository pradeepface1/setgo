const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    displayName: {
        type: String,
        required: true,
        trim: true
    },
    contactEmail: {
        type: String,
        required: true,
        trim: true
    },
    contactPhone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    logo: {
        type: String, // URL to logo
        default: null
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
        default: 'ACTIVE'
    },
    settings: {
        allowSOS: {
            type: Boolean,
            default: true
        },
        enableReports: {
            type: Boolean,
            default: true
        },
        timezone: {
            type: String,
            default: 'Asia/Kolkata'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
OrganizationSchema.pre('save', async function () {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('Organization', OrganizationSchema);
