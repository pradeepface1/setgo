const mongoose = require('mongoose');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Organization = require('../models/Organization');
const Trip = require('../models/Trip');
const SOS = require('../models/SOS');
require('dotenv').config({ path: '../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jubilant_mvp';

async function clearData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Clear Drivers
        const drivers = await Driver.deleteMany({});
        console.log(`🗑️ Deleted ${drivers.deletedCount} Drivers`);

        // 2. Clear Trips
        const trips = await Trip.deleteMany({});
        console.log(`🗑️ Deleted ${trips.deletedCount} Trips`);

        // 3. Clear SOS Alerts
        const sosAlerts = await SOS.deleteMany({});
        console.log(`🗑️ Deleted ${sosAlerts.deletedCount} SOS Alerts`);

        // 4. Clear Organizations
        const orgs = await Organization.deleteMany({});
        console.log(`🗑️ Deleted ${orgs.deletedCount} Organizations`);

        // 4. Clear Users (Except Super Admin)
        const users = await User.deleteMany({ role: { $ne: 'SUPER_ADMIN' } });
        console.log(`🗑️ Deleted ${users.deletedCount} Users (Org Admins & Commuters)`);

        // Check if Super Admin exists
        const superAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
        if (superAdmin) {
            console.log(`✅ Super Admin '${superAdmin.username}' preserved.`);
        } else {
            console.log('⚠️ No Super Admin found! You might need to create one manually.');
        }

        console.log('\n🎉 Database cleared successfully for fresh testing!');
    } catch (error) {
        console.error('❌ Error clearing data:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Disconnected');
    }
}

clearData();
