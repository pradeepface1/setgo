const mongoose = require('mongoose');
const Driver = require('./models/Driver');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jubilant_mvp')
    .then(async () => {
        console.log('MongoDB Connected');

        try {
            const result = await Driver.updateMany({ status: 'OFFLINE' }, { status: 'ONLINE' });
            console.log(`Updated ${result.modifiedCount} drivers to ONLINE status.`);
        } catch (err) {
            console.error('Error updating drivers:', err);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => console.error(err));
