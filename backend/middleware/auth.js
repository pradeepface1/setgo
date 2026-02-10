/**
 * Authentication & Authorization Middleware
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token and attach user to request
const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        let user = null;
        if (decoded.role === 'DRIVER') {
            const Driver = require('../models/Driver');
            user = await Driver.findById(decoded.driverId).populate('organizationId');
        } else {
            user = await User.findById(decoded.userId).populate('organizationId');
        }

        if (!user || user.status === 'BLOCKED') { // Drivers might be OFFLINE, so check BLOCKED
            // For standard Users, status is usually ACTIVE. 
            // Let's generalize: if no user found, or if explicitly inactive/blocked
            if (!user) return res.status(401).json({ error: 'Invalid authentication' });

            if (user.status !== 'ACTIVE' && user.status !== 'ONLINE' && user.status !== 'OFFLINE' && user.status !== 'BUSY') {
                // Allowing OFFLINE/BUSY for drivers, strict ACTIVE for admin users if that's the convention
                // Assuming 'User' model has 'ACTIVE' and 'Driver' has 'ONLINE'/'OFFLINE'/'BUSY'
                // But let's be careful. If User and status is NOT ACTIVE -> block
                if (decoded.role !== 'DRIVER' && user.status !== 'ACTIVE') {
                    return res.status(401).json({ error: 'Account is inactive' });
                }
            }
        }

        req.user = user;
        req.userId = user._id; // Normalized ID
        req.userRole = decoded.role; // Explicit role from token
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid authentication token' });
    }
};

// Check if user is Super Admin
const isSuperAdmin = (req, res, next) => {
    if (req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Access denied. Super Admin only.' });
    }
    next();
};

// Check if user is Organization Admin
const isOrgAdmin = (req, res, next) => {
    if (req.user.role !== 'ORG_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'Access denied. Admin access required.' });
    }
    next();
};

// Add organization filter for Org Admins
const filterByOrganization = (req, res, next) => {
    if (req.user.role === 'ORG_ADMIN') {
        // Org Admin can only see their organization's data
        // Handle case where organizationId is populated
        const orgId = req.user.organizationId && req.user.organizationId._id
            ? req.user.organizationId._id
            : req.user.organizationId;

        req.organizationFilter = { organizationId: orgId };
        req.organizationId = orgId;
    } else if (req.user.role === 'SUPER_ADMIN') {
        // Super Admin can see all organizations
        // Check if a specific organization is requested
        if (req.query.organizationId) {
            req.organizationFilter = { organizationId: req.query.organizationId };
            req.organizationId = req.query.organizationId;
        } else {
            req.organizationFilter = {}; // No filter, see all
            req.organizationId = null;
        }
    } else {
        req.organizationFilter = {};
        req.organizationId = null;
    }
    next();
};

// Check if user has specific permission
const hasPermission = (permission) => {
    return (req, res, next) => {
        if (req.user.role === 'SUPER_ADMIN') {
            // Super Admin has all permissions
            return next();
        }

        if (!req.user.permissions || !req.user.permissions.includes(permission)) {
            return res.status(403).json({
                error: `Access denied. Required permission: ${permission}`
            });
        }
        next();
    };
};

module.exports = {
    authenticate,
    isSuperAdmin,
    isOrgAdmin,
    filterByOrganization,
    hasPermission
};
