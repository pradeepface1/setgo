// Standalone script using native fetch in Node 18+
async function testUpdate() {
    try {
        const API_URL = 'http://localhost:5001/api';

        console.log('Testing driver password update...');

        // 1. Login as admin
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin@jubilant.com', password: 'password123' })
        });

        if (!loginRes.ok) {
            console.error('Login failed:', await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.user.token;
        console.log('Logged in successfully');

        // 2. Get drivers
        const driversRes = await fetch(`${API_URL}/drivers`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const drivers = await driversRes.json();

        if (drivers.length === 0) {
            console.log('No drivers found to update');
            return;
        }

        const driver = drivers[0];
        console.log(`Attempting to update password for driver: ${driver.name} (ID: ${driver._id})`);

        // 3. Update password
        const updateRes = await fetch(`${API_URL}/drivers/${driver._id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ password: 'testnewpassword123' })
        });

        if (updateRes.ok) {
            const data = await updateRes.json();
            console.log('Password update SUCCESS:', data);
        } else {
            console.log('Password update FAILED:', await updateRes.text());
        }

    } catch (e) {
        console.error('Test failed with exception:', e);
    }
}

testUpdate();
