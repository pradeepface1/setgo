const mongoose = require('mongoose');
const Trip = require('./models/Trip');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jubilant_mvp';

async function checkLatestTrip() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Get the latest trip
        const latestTrip = await Trip.findOne().sort({ createdAt: -1 });

        if (!latestTrip) {
            console.log('No trips found in database');
            await mongoose.connection.close();
            process.exit(0);
            return;
        }

        console.log('===== LATEST TRIP IN DATABASE =====');
        console.log('Customer:', latestTrip.customerName);
        console.log('Created at:', latestTrip.createdAt);
        console.log('\nVehicle fields:');
        console.log('  vehicleCategory:', latestTrip.vehicleCategory);
        console.log('  vehicleSubcategory:', latestTrip.vehicleSubcategory);
        console.log('  vehiclePreference:', latestTrip.vehiclePreference);
        console.log('\nFull trip object:');
        console.log(JSON.stringify(latestTrip.toObject(), null, 2));
        console.log('====================================\n');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkLatestTrip();
