const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Import JWT
const Driver = require('../models/Driver');
const User = require('../models/User');
const Organization = require('../models/Organization'); // Import Organization
const { authenticate, isSuperAdmin, isOrgAdmin, isTaxiAdmin, isLogisticsAdmin } = require('../middleware/auth'); // Import middleware

// POST /api/auth/register - Create new user
router.post('/register', authenticate, async (req, res) => {
    // Check permissions manually here or use a more flexible middleware
    const allowedRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'TAXI_ADMIN', 'LOGISTICS_ADMIN'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        let { username, password, role, organizationId, email, permissions, vertical } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Validate role
        const validRoles = ['SUPER_ADMIN', 'ORG_ADMIN', 'COMMUTER', 'TAXI_ADMIN', 'LOGISTICS_ADMIN', 'ROAD_PILOT'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        // Admin Restrictions (Org, Taxi, Logistics)
        if (req.user.role !== 'SUPER_ADMIN') {
            if (role === 'SUPER_ADMIN') {
                return res.status(403).json({ error: 'Admins cannot create Super Admins' });
            }

            // Logistics Admin can only create ROAD_PILOT
            if (req.user.role === 'LOGISTICS_ADMIN' && role !== 'ROAD_PILOT') {
                return res.status(403).json({ error: 'Logistics Admin can only create Road Pilots' });
            }

            // Taxi Admin / Org Admin can create Commuters (and drivers, but drivers are different model usually)
            if (['TAXI_ADMIN', 'ORG_ADMIN'].includes(req.user.role) && role !== 'COMMUTER') {
                // return res.status(403).json({ error: 'You can only create Commuters' });
                // Keeping it flexible for now, but usually they create commuters
            }

            // Force organizationId to match the admin's
            organizationId = req.user.organizationId._id || req.user.organizationId;
        }

        // If Admin/Commuter/Pilot (created by Super Admin), organizationId is required
        if (['ORG_ADMIN', 'TAXI_ADMIN', 'LOGISTICS_ADMIN', 'COMMUTER', 'ROAD_PILOT'].includes(role) && !organizationId) {
            return res.status(400).json({ error: 'Organization ID is required' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            role: role || 'ORG_ADMIN',
            organizationId: role === 'SUPER_ADMIN' ? null : organizationId,
            permissions,
            vertical: vertical || 'TAXI'
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                role: newUser.role,
                organizationId: newUser.organizationId
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
});

// GET /api/auth/users - List users (Super Admin sees all, Org Admin sees their org users)
router.get('/users', authenticate, async (req, res) => {
    try {
        let query = {};
        const { role, organizationId } = req.user;

        // Only allow Admins to list users
        if (role !== 'SUPER_ADMIN' && role !== 'ORG_ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // If Org Admin, filter by organization AND exclude Super Admins
        if (role === 'ORG_ADMIN') {
            query.organizationId = organizationId;
            query.role = { $ne: 'SUPER_ADMIN' }; // Exclude Super Admins
        }

        const users = await User.find(query, '-password')
            .populate('organizationId', 'name displayName')
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Fetch failed', details: error.message });
    }
});

// POST /api/auth/login - Admin login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user by username
        const user = await User.findOne({ username }).populate('organizationId');
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Check if user is active
        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ error: 'Account is inactive' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate JWT Token
        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role,
                organizationId: user.organizationId ? user.organizationId._id : null
            },
            process.env.JWT_SECRET || 'your-secret-key', // Use env var in production
            { expiresIn: '24h' }
        );

        // Return user data (excluding password)
        const userData = {
            _id: user._id,
            username: user.username,
            role: user.role,
            organizationId: user.organizationId ? user.organizationId._id : null,
            organizationName: user.organizationId ? user.organizationId.displayName : 'Super Admin',
            organizationPreferences: user.organizationId ? user.organizationId.preferences : null,
            permissions: user.permissions,
            vertical: user.vertical,
            token // Include token in response
        };

        res.json({
            success: true,
            user: userData,
            message: 'Login successful'
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
});

// POST /api/auth/driver/login - Driver login
router.post('/driver/login', async (req, res) => {
    try {
        const { phone, password, organizationCode } = req.body;

        if (!phone || !password) {
            return res.status(400).json({ error: 'Phone and password are required' });
        }

        // Find driver(s) by phone
        // Since phone is unique per org but not globally, we might find multiple.
        let query = { phone };
        if (organizationCode) {
            const org = await Organization.findOne({ code: organizationCode.toUpperCase() });
            if (org) {
                query.organizationId = org._id;
            }
        }

        console.log(`[DEBUG] Driver login attempt for phone: ${phone}`);
        const drivers = await Driver.find(query).populate('organizationId');

        if (!drivers || drivers.length === 0) {
            console.log(`[DEBUG] No drivers found for phone ${phone}`);
            return res.status(401).json({ error: 'Invalid phone number or password' });
        }
        console.log(`[DEBUG] Found ${drivers.length} drivers for phone ${phone}`);
        drivers.forEach(d => console.log(`[DEBUG] Found driver: ${d._id} - ${d.phone} - ${d.name}`));

        let driver = null;
        // Check password against all found drivers
        for (const d of drivers) {
            const isMatch = await bcrypt.compare(password, d.password);
            if (isMatch) {
                driver = d;
                console.log(`[DEBUG] Password match for driver ${d._id}`);
                break;
            }
        }

        if (!driver) {
            console.log(`[DEBUG] Password mismatch for all found drivers`);
            return res.status(401).json({ error: 'Invalid phone number or password' });
        }

        // Verify status
        if (driver.status === 'OFFLINE' || driver.status === 'BLOCKED') {
            // Maybe allow login but warn? Or block?
            // For now allow login
        }

        // Generate Token for driver (optional if driver app doesn't use JWT yet, but good practice)
        // If driver app uses session or no auth for other requests, this is fine
        // Assuming driver app might need updates to use token

        const token = jwt.sign(
            {
                driverId: driver._id,
                role: 'DRIVER',
                organizationId: driver.organizationId._id
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        // Return driver data
        const driverData = {
            _id: driver._id,
            name: driver.name,
            phone: driver.phone,
            vehicleModel: driver.vehicleModel,
            vehicleNumber: driver.vehicleNumber,
            vehicleCategory: driver.vehicleCategory,
            status: driver.status,
            rating: driver.rating,
            vertical: driver.vertical,
            // Owner / Lorry details for Road Pilots
            ownerName: driver.ownerName,
            ownerPhone: driver.ownerPhone,
            ownerHometown: driver.ownerHometown,
            organizationId: driver.organizationId._id,
            organizationName: driver.organizationId.displayName,
            token
        };

        res.json({
            success: true,
            driver: driverData,
            message: 'Login successful'
        });
    } catch (error) {
        res.status(500).json({ error: 'Login failed', details: error.message });
    }
});

// PUT /api/auth/users/:id - Update user
router.put('/users/:id', authenticate, async (req, res) => {
    try {
        const { username, password, email, role, status } = req.body;
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check permissions
        if (req.user.role === 'ORG_ADMIN') {
            if (user.organizationId.toString() !== req.user.organizationId.toString()) {
                return res.status(403).json({ error: 'Access denied' });
            }
            if (user.role === 'SUPER_ADMIN') {
                return res.status(403).json({ error: 'Cannot modify Super Admin' });
            }
        }

        if (username) {
            // Check if username unique
            const existingUser = await User.findOne({ username });
            if (existingUser && existingUser._id.toString() !== userId) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            user.username = username;
        }

        if (email) user.email = email;
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        // Only Super Admin can change roles or status
        if (req.user.role === 'SUPER_ADMIN') {
            if (role) user.role = role;
            if (status) user.status = status;
        }

        await user.save();
        res.json({
            success: true,
            message: 'User updated successfully',
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Update failed', details: error.message });
    }
});

// DELETE /api/auth/users/:id - Delete user
router.delete('/users/:id', authenticate, async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.role === 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Cannot delete Super Admin user' });
        }

        // Check permissions
        if (req.user.role === 'ORG_ADMIN') {
            if (user.organizationId.toString() !== req.user.organizationId.toString()) {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        await User.findByIdAndDelete(userId);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Delete failed', details: error.message });
    }
});

module.exports = router;
