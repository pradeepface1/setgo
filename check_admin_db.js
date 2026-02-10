const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = 'mongodb://localhost:27017/jubilant_mvp';

async function checkAdmin() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();
        const users = await db.collection('users').find({ role: 'SUPER_ADMIN' }).toArray();
        console.log("Super Admins found:", users.length);

        for (const user of users) {
            console.log(`- Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
            // Verify password 'password123'
            const isMatch = await bcrypt.compare('password123', user.password);
            console.log(`  Password 'password123' valid? ${isMatch}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

checkAdmin();
