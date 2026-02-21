/**
 * Organization Routes
 * Handles CRUD operations for organizations
 */

const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const { authenticate, isSuperAdmin, isOrgAdmin } = require('../middleware/auth');

// Get all organizations (Super Admin only, optionally filtered by vertical)
router.get('/', authenticate, isSuperAdmin, async (req, res) => {
    try {
        let query = {};
        if (req.query.vertical) {
            query.verticals = req.query.vertical;
        }
        const organizations = await Organization.find(query).sort({ createdAt: -1 });
        res.json(organizations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get organization by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Org Admin can only view their own organization
        if (req.user.role === 'ORG_ADMIN' &&
            organization._id.toString() !== req.user.organizationId.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(organization);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get organization statistics
router.get('/:id/stats', authenticate, async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Org Admin can only view their own organization stats
        if (req.user.role === 'ORG_ADMIN' &&
            organization._id.toString() !== req.user.organizationId.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [driverCount, tripCount, userCount] = await Promise.all([
            Driver.countDocuments({ organizationId: req.params.id }),
            Trip.countDocuments({ organizationId: req.params.id }),
            User.countDocuments({ organizationId: req.params.id, role: 'ORG_ADMIN' })
        ]);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayTrips = await Trip.countDocuments({
            organizationId: req.params.id,
            createdAt: { $gte: todayStart }
        });

        const activeDrivers = await Driver.countDocuments({
            organizationId: req.params.id,
            status: 'ONLINE'
        });

        res.json({
            organization,
            stats: {
                totalDrivers: driverCount,
                totalTrips: tripCount,
                totalAdmins: userCount,
                todayTrips,
                activeDrivers
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create organization (Super Admin only)
router.post('/', authenticate, isSuperAdmin, async (req, res) => {
    try {
        const { name, code, displayName, contactEmail, contactPhone, address, settings, verticals } = req.body;

        // Validate required fields
        if (!name || !code || !displayName || !contactEmail || !contactPhone) {
            return res.status(400).json({
                error: 'Missing required fields: name, code, displayName, contactEmail, contactPhone'
            });
        }

        // Check if organization with same code already exists
        const existing = await Organization.findOne({
            $or: [{ code: code.toUpperCase() }, { name: name.toLowerCase() }]
        });

        if (existing) {
            return res.status(400).json({
                error: 'Organization with this code or name already exists'
            });
        }

        const organization = new Organization({
            name: name.toLowerCase(),
            code: code.toUpperCase(),
            displayName,
            contactEmail,
            contactPhone,
            address,
            verticals: verticals || ['TAXI'], // Default to TAXI if not provided
            settings: settings || {
                enableReports: true,
                timezone: 'Asia/Kolkata'
            }
        });

        await organization.save();
        res.status(201).json(organization);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update My Organization Preferences (For Org Admins)
router.put('/my-preferences', authenticate, async (req, res) => {
    try {
        if (!req.user.organizationId) {
            return res.status(400).json({ error: 'User does not belong to an organization' });
        }

        const organization = await Organization.findById(req.user.organizationId);
        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        // Deep merge the incoming preferences
        // Since it's nested, we'll assign the objects, but ideally we'd dot-notation it or spread.
        // For simplicity and to allow complete override of sections:
        if (req.body.preferences) {
            if (req.body.preferences.theme) {
                organization.preferences.theme = {
                    ...organization.preferences.theme,
                    ...req.body.preferences.theme
                };
            }
            if (req.body.preferences.consignorTheme) {
                organization.preferences.consignorTheme = {
                    ...organization.preferences.consignorTheme,
                    ...req.body.preferences.consignorTheme
                };
            }
            if (req.body.preferences.features) {
                organization.preferences.features = {
                    ...organization.preferences.features,
                    ...req.body.preferences.features
                };
            }
            if (req.body.preferences.pdfSettings) {
                organization.preferences.pdfSettings = {
                    ...organization.preferences.pdfSettings,
                    ...req.body.preferences.pdfSettings
                };
            }
        }

        organization.updatedAt = Date.now();
        await organization.save();

        res.json(organization);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update organization
router.put('/:id', authenticate, isSuperAdmin, async (req, res) => {
    try {
        const { displayName, contactEmail, contactPhone, address, settings, verticals } = req.body;

        const organization = await Organization.findByIdAndUpdate(
            req.params.id,
            {
                displayName,
                contactEmail,
                contactPhone,
                address,
                settings,
                verticals, // Ensure verticals can be updated
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        res.json(organization);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update organization status
router.patch('/:id/status', authenticate, isSuperAdmin, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const organization = await Organization.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: Date.now() },
            { new: true }
        );

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        res.json(organization);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete organization (Super Admin only)
router.delete('/:id', authenticate, isSuperAdmin, async (req, res) => {
    try {
        // Check if organization has any data
        const [driverCount, tripCount, userCount] = await Promise.all([
            Driver.countDocuments({ organizationId: req.params.id }),
            Trip.countDocuments({ organizationId: req.params.id }),
            User.countDocuments({ organizationId: req.params.id })
        ]);

        if (driverCount > 0 || tripCount > 0 || userCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete organization with existing data. Please delete all drivers, trips, and users first.'
            });
        }

        const organization = await Organization.findByIdAndDelete(req.params.id);

        if (!organization) {
            return res.status(404).json({ error: 'Organization not found' });
        }

        res.json({ message: 'Organization deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
