
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Use the production URI provided by user (Try lowercase username)
const MONGO_URI = "mongodb+srv://pradeep:Fat52Row1!@setgo.lrqbayp.mongodb.net/jubilant_mvp?retryWrites=true&w=majority&appName=SetGo";

async function checkAdmin() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to Production DB');

        const admin = await User.findOne({
            $or: [{ username: 'admin' }, { role: 'admin' }, { role: 'superadmin' }]
        });

        if (admin) {
            console.log('Found Admin User:', admin.username);
            console.log('Role:', admin.role);

            // Check password 'admin123' (default)
            const isMatchDefault = await bcrypt.compare('admin123', admin.password);
            console.log('Password is "admin123":', isMatchDefault);

            if (!isMatchDefault) {
                // Check if it's 'password'
                const isMatchSimple = await bcrypt.compare('password', admin.password);
                console.log('Password is "password":', isMatchSimple);
            }

        } else {
            console.log('NO Admin user found!');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkAdmin();
