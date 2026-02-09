const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Driver = require('../models/Driver');
const User = require('../models/User');

// POST /api/auth/register - Create new user (admin or commuter)
router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Validate role
        const validRoles = ['admin', 'superadmin', 'commuter'];
        const userRole = role && validRoles.includes(role) ? role : 'admin';

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
            password: hashedPassword,
            role: userRole
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                role: newUser.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed', details: error.message });
    }
});

// GET /api/auth/users - List all admin users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, '-password').sort({ createdAt: -1 });
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
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Return user data (excluding password)
        const userData = {
            _id: user._id,
            username: user.username,
            role: user.role,
            createdAt: user.createdAt
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
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({ error: 'Phone and password are required' });
        }

        // Find driver by phone
        const driver = await Driver.findOne({ phone });
        if (!driver) {
            return res.status(401).json({ error: 'Invalid phone number or password' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, driver.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid phone number or password' });
        }

        // Return driver data (excluding password)
        const driverData = {
            _id: driver._id,
            name: driver.name,
            phone: driver.phone,
            vehicleModel: driver.vehicleModel,
            vehicleNumber: driver.vehicleNumber,
            vehicleCategory: driver.vehicleCategory,
            status: driver.status,
            rating: driver.rating
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
router.put('/users/:id', async (req, res) => {
    try {
        const { username, password } = req.body;
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (username) {
            // Check if username unique
            const existingUser = await User.findOne({ username });
            if (existingUser && existingUser._id.toString() !== userId) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            user.username = username;
        }

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();
        res.json({ success: true, message: 'User updated successfully', user: { id: user._id, username: user.username, role: user.role } });
    } catch (error) {
        res.status(500).json({ error: 'Update failed', details: error.message });
    }
});

// DELETE /api/auth/users/:id - Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.username === 'superadmin') {
            return res.status(403).json({ error: 'Cannot delete superadmin user' });
        }

        await User.findByIdAndDelete(userId);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Delete failed', details: error.message });
    }
});

module.exports = router;
