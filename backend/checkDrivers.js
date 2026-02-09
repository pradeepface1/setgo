const mongoose = require('mongoose');
const Driver = require('./models/Driver');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jubilant_mvp';

const checkDrivers = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        const count = await Driver.countDocuments();
        console.log(`Total Drivers in DB: ${count}`);

        if (count > 0) {
            const sample = await Driver.findOne();
            console.log('Sample Driver:', sample);
        }
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkDrivers();
