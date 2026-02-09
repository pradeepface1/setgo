const mongoose = require('mongoose');
const Trip = require('./models/Trip');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jubilant_mvp';

async function testWithCategoryData() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB\n');

        // Exact data that frontend is sending
        const testData = {
            customerName: 'test1',
            pickupLocation: 'fdaf',
            dropLocation: 'fadf',
            tripDateTime: '2026-02-09T07:25:00.000Z',
            requestSource: 'MANUAL',
            vehicleCategory: 'Sedan Regular',
            vehicleSubcategory: 'Swift Desire'
        };

        console.log('===== CREATING TRIP WITH CATEGORY DATA =====');
        console.log('Input data:', JSON.stringify(testData, null, 2));

        const trip = new Trip(testData);

        console.log('\nBefore save:');
        console.log('  vehicleCategory:', trip.vehicleCategory);
        console.log('  vehicleSubcategory:', trip.vehicleSubcategory);
        console.log('  vehiclePreference:', trip.vehiclePreference);
        console.log('  requestSource:', trip.requestSource);

        await trip.save();

        console.log('\nAfter save:');
        console.log('  vehicleCategory:', trip.vehicleCategory);
        console.log('  vehicleSubcategory:', trip.vehicleSubcategory);
        console.log('  vehiclePreference:', trip.vehiclePreference);
        console.log('  requestSource:', trip.requestSource);

        console.log('\nFull saved trip:');
        console.log(JSON.stringify(trip.toObject(), null, 2));
        console.log('=============================================\n');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testWithCategoryData();
