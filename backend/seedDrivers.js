const mongoose = require('mongoose');
require('dotenv').config();
const Driver = require('./models/Driver');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jubilant_mvp';

const vehicleCategories = [
    { category: 'Sedan Regular', models: ['Swift', 'Desire', 'Etios', 'Aura'] },
    { category: 'Sedan Premium', models: ['Benz E', 'BMW 5', 'Audi A6'] },
    { category: 'Sedan Premium+', models: ['Benz S', 'BMW 7'] },
    { category: 'SUV Regular', models: ['Cyta', 'Ertiga'] },
    { category: 'SUV Premium', models: ['Hycross', 'Fortuner'] },
    { category: 'Tempo Traveller', models: ['TT 12-Seater'] },
    { category: 'Force Premium', models: ['Urbania 16-Seater'] },
    { category: 'Bus', models: ['20-Seater', '25-Seater', '33-Seater', '40-Seater', '50-Seater'] },
    { category: 'High-End Coach', models: ['Volvo Commuter', 'Welphire', 'Benz Van'] }
];

const indianNames = [
    "Aarav", "Vihaan", "Aditya", "Sai", "Arjun", "Reyansh", "Muhammad", "Rohan", "Krishna", "Ishaan",
    "Shaurya", "Atharv", "Advik", "Pranav", "Advaith", "Ayan", "Dhruv", "Kabir", "Ritvik", "Ayaan",
    "Kian", "Darsh", "Veer", "Aaryan", "Andrew", "Aryan", "Sarthak", "Vivaan", "Rehansh", "Rudra"
];

const seedDrivers = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected');

        // Hash the default password once
        const hashedPassword = await bcrypt.hash('12345', 10);
        console.log('Password hashed');

        const drivers = [];
        for (let i = 0; i < 100; i++) {
            const typeIdx = Math.floor(Math.random() * vehicleCategories.length);
            const type = vehicleCategories[typeIdx];
            const modelIdx = Math.floor(Math.random() * type.models.length);
            const model = type.models[modelIdx];
            const nameIdx = Math.floor(Math.random() * indianNames.length);
            const name = `${indianNames[nameIdx]} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}.`;
            const phone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

            drivers.push({
                name: name,
                phone: phone,
                password: hashedPassword, // Add hashed password
                vehicleModel: model,
                vehicleNumber: `KA-${String(Math.floor(Math.random() * 99)).padStart(2, '0')}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}-${Math.floor(1000 + Math.random() * 9000)}`,
                vehicleCategory: type.category,
                status: Math.random() > 0.3 ? 'ONLINE' : 'OFFLINE',
                rating: (3.5 + Math.random() * 1.5).toFixed(1)
            });
        }

        try {
            await Driver.insertMany(drivers, { ordered: false });
            console.log('Successfully seeded 100 sample drivers!');
        } catch (e) {
            console.log('Some duplicates skipped or inserted.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedDrivers();
