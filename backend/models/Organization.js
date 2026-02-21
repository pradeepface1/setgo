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
    verticals: {
        type: [{
            type: String,
            enum: ['TAXI', 'LOGISTICS']
        }],
        default: ['TAXI']
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
    preferences: {
        theme: {
            primaryColor: { type: String, default: '#4f46e5' }, // Indigo default
            logoUrl: { type: String, default: '' },
            slogan: { type: String, default: 'll Sri Murugan Thunai ll' },
            companyHeader: { type: String, default: 'Default Company Pvt Ltd' },
            companySubHeader: { type: String, default: 'TRANSPORT CONTRACTORS & COMMISSION AGENTS' },
            phoneLine1: { type: String, default: 'Phone : 9448275227, 9739361561' },
            phoneLine2: { type: String, default: '080-28523888, 080-28523777' },
            addressLine1: { type: String, default: '# 32, Behind HP Petrol Bunk, Old Chandapura' },
            addressLine2: { type: String, default: 'Thirumagondanahalli Cross, Anekal Taluk, Bengaluru - 560099' }
        },
        features: {
            enableCommuter: { type: Boolean, default: false },
            enableAccounting: { type: Boolean, default: true },
            requireDriverApproval: { type: Boolean, default: false }
        },
        pdfSettings: {
            slipTemplate: { type: String, enum: ['STANDARD', 'KARUR_CUSTOM'], default: 'STANDARD' },
            showLoadingDate: { type: Boolean, default: true },
            showDriverBankDetails: { type: Boolean, default: false }
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
