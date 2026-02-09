const mongoose = require('mongoose');
const Trip = require('./models/Trip');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jubilant_mvp';

async function testTripCreation() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Test data
        const testData = {
            customerName: 'Test Customer',
            pickupLocation: 'Test Pickup',
            dropLocation: 'Test Drop',
            tripDateTime: new Date(),
            vehicleCategory: 'Sedan Regular',
            vehicleSubcategory: 'Swift Desire',
            requestSource: 'MANUAL'
        };

        console.log('\n===== TEST TRIP CREATION =====');
        console.log('1. Creating trip with data:', JSON.stringify(testData, null, 2));

        const trip = new Trip(testData);

        console.log('2. Trip before save:');
        console.log('   vehicleCategory:', trip.vehicleCategory);
        console.log('   vehicleSubcategory:', trip.vehicleSubcategory);
        console.log('   vehiclePreference:', trip.vehiclePreference);

        await trip.save();

        console.log('3. Trip after save:');
        console.log('   vehicleCategory:', trip.vehicleCategory);
        console.log('   vehicleSubcategory:', trip.vehicleSubcategory);
        console.log('   vehiclePreference:', trip.vehiclePreference);

        console.log('4. Full trip object:', JSON.stringify(trip.toObject(), null, 2));
        console.log('===============================\n');

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testTripCreation();
