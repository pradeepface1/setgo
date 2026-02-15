
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Use the production URI provided by user (Lowercase username)
const MONGO_URI = "mongodb+srv://pradeep:Fat52Row1!@setgo.lrqbayp.mongodb.net/jubilant_mvp?retryWrites=true&w=majority&appName=SetGo";

async function createAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to Production DB');

        const username = 'admin';
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if exists
        const existing = await User.findOne({ username });
        if (existing) {
            console.log('User already exists. Updating password...');
            existing.password = hashedPassword;
            existing.role = 'SUPER_ADMIN';
            await existing.save();
            console.log('Admin user updated.');
        } else {
            const newAdmin = new User({
                username,
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                name: 'Super Admin',
                email: 'admin@setgo.com', // Dummy email
                phone: '9999999999'
            });
            await newAdmin.save();
            console.log('Admin user created successfully.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createAdmin();
