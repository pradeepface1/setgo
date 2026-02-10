
const mongoose = require('mongoose');
const Driver = require('./models/Driver');
const Organization = require('./models/Organization');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const VEHICLE_CATEGORIES = {
    'Sedan Regular': ['Swift Desire', 'Etios', 'Xcent'],
    'Sedan Premium': ['Honda City', 'Verna', 'Ciaz'],
    'Sedan Premium+': ['BMW 7 series', 'Audi A6', 'Mercedes E class'],
    'SUV Regular': ['Ertiga', 'Innova'],
    'SUV Premium': ['Innova Crysta', 'XUV 700'],
    'Tempo Traveller': ['14 Seater', '17 Seater', '20 Seater'],
    'Force Premium': ['Urbania'],
    'Bus': ['32 Seater', '45 Seater', '50 Seater'],
    'High End Coaches': ['Volvo', 'Scania', 'Mercedes']
};

const seedDrivers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jubilant-db');
        console.log('Connected to MongoDB');

        // Find an organization
        let org = await Organization.findOne();
        if (!org) {
            console.log('No organization found. Creating default "SetGo" org.');
            org = new Organization({
                name: 'SetGo Transport',
                displayName: 'SetGo',
                code: 'SETGO',
                email: 'admin@setgo.com',
                phone: '1234567890',
                address: 'HQ'
            });
            await org.save();
        }
        console.log(`Using Organization: ${org.name}`);

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('123456', salt);

        let count = 0;
        let phoneStart = 9000000000;

        for (const [category, models] of Object.entries(VEHICLE_CATEGORIES)) {
            for (const model of models) {
                // Create 2 drivers for each model
                for (let i = 1; i <= 2; i++) {
                    const driverName = `${model} Pilot ${i}`;
                    const phone = `${phoneStart++}`;
                    const vehicleNumber = `KA-01-${phone.slice(-4)}`;

                    const existing = await Driver.findOne({ phone });
                    if (existing) continue;

                    const driver = new Driver({
                        name: driverName,
                        phone: phone,
                        password: passwordHash,
                        vehicleCategory: category,
                        vehicleModel: model,
                        vehicleNumber: vehicleNumber,
                        organizationId: org._id,
                        status: 'ONLINE', // Default to ONLINE
                        location: {
                            type: 'Point',
                            coordinates: [77.5946 + (Math.random() * 0.1 - 0.05), 12.9716 + (Math.random() * 0.1 - 0.05)] // Around Bangalore
                        }
                    });

                    await driver.save();
                    count++;
                    console.log(`Created: ${driverName} (${category})`);
                }
            }
        }

        console.log(`Successfully seeded ${count} drivers.`);

    } catch (error) {
        console.error('Seeding error:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedDrivers();
