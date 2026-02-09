const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Driver = require('./models/Driver');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jubilant_mvp';

async function updateDriverPasswords() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Hash the password "12345"
        const hashedPassword = await bcrypt.hash('12345', 10);
        console.log('New hashed password created for: 12345\n');

        // Update all drivers
        const result = await Driver.updateMany(
            {},
            { $set: { password: hashedPassword } }
        );

        console.log(`Updated ${result.modifiedCount} drivers with new password`);
        console.log('All drivers now have password: 12345\n');

        // Show sample drivers
        const drivers = await Driver.find({}).limit(3);
        console.log('===== SAMPLE DRIVERS (for testing) =====');
        drivers.forEach(driver => {
            console.log(`Name: ${driver.name}`);
            console.log(`Phone: ${driver.phone}`);
            console.log(`Password: 12345`);
            console.log('---');
        });

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

updateDriverPasswords();
