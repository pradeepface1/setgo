const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        sparse: true, // Allow null but unique if provided
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['SUPER_ADMIN', 'ORG_ADMIN', 'COMMUTER'],
        default: 'ORG_ADMIN'
    },
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: function () {
            return this.role === 'ORG_ADMIN';
        }
    },
    permissions: [{
        type: String,
        enum: [
            'view_dashboard',
            'manage_drivers',
            'manage_commuters',
            'manage_trips',
            'view_reports',
            'manage_users',
            'manage_organizations'
        ]
    }],
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);
