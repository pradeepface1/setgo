const mongoose = require('mongoose');
const Driver = require('./models/Driver');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jubilant_mvp';

async function checkDrivers() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB\n');

        const drivers = await Driver.find({}).limit(3);

        console.log('===== SAMPLE DRIVERS =====');
        drivers.forEach(driver => {
            console.log(`\nName: ${driver.name}`);
            console.log(`Phone: ${driver.phone}`);
            console.log(`Password (hashed): ${driver.password ? driver.password.substring(0, 20) + '...' : 'NOT SET'}`);
            console.log(`Password starts with $2: ${driver.password ? driver.password.startsWith('$2') : false}`);
        });
        console.log('\n==========================');

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkDrivers();
