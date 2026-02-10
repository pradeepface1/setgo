const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/setgo-oncall';

async function restoreAdmin() {
    try {
        await mongoose.connect(mongoURI);
        console.log('MongoDB Connected');

        // Check if user exists
        const email = 'admin@jubilant.com';
        const existing = await User.findOne({ username: email });

        if (existing) {
            console.log('User already exists:', existing.username);
            // Optionally reset password if needed
            const salt = await bcrypt.genSalt(10);
            existing.password = await bcrypt.hash('password123', salt);
            await existing.save();
            console.log('Password reset to password123');
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);

            const newUser = new User({
                username: email,
                email: email,
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                status: 'ACTIVE',
                permissions: ['all']
            });

            await newUser.save();
            console.log('Super Admin restored:', email);
            console.log('Password: password123');
        }

        mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

restoreAdmin();
