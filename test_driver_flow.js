const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch'); // Requires node-fetch v2 for CommonJS or dynamic import for v3

const API_URL = 'http://localhost:5001/api';

async function runTest() {
    try {
        console.log("=== 1. Login as Admin ===");
        const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin@jubilant.com', password: 'password123' })
        });
        const adminData = await adminLoginRes.json();
        if (!adminLoginRes.ok) throw new Error(`Admin Login Failed: ${JSON.stringify(adminData)}`);
        const adminToken = adminData.user.token;
        const orgId = adminData.user.organizationId;
        console.log("Admin Logged In. Org:", orgId);

        console.log("\n=== 2. Create Driver ===");
        const driverPayload = {
            name: "Flow Tester " + Date.now(),
            phone: "999" + Math.floor(Math.random() * 10000000), // Random phone
            password: "password123",
            vehicleModel: "Test Car",
            vehicleNumber: "TEST-" + Math.floor(Math.random() * 1000),
            vehicleCategory: "Sedan Regular",
            organizationId: orgId
        };

        const createDriverRes = await fetch(`${API_URL}/drivers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(driverPayload)
        });
        const driver = await createDriverRes.json();
        if (!createDriverRes.ok) throw new Error(`Create Driver Failed: ${JSON.stringify(driver)}`);

        console.log("Created Driver:", driver.name, driver._id, driver.phone);

        console.log("\n=== 3. Create Trip ===");
        const tripPayload = {
            customerName: "Test Customer",
            customerContact: "9876543210",
            pickupLocation: "Point A",
            dropLocation: "Point B",
            tripDateTime: new Date(),
            vehicleCategory: "Sedan Regular",
            organizationId: orgId,
            requestSource: "MANUAL"
        };

        const createTripRes = await fetch(`${API_URL}/trips`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify(tripPayload)
        });
        const trip = await createTripRes.json();
        console.log("Trip Created:", trip._id, trip.otp);

        console.log("\n=== 4. Assign Driver ===");
        const assignRes = await fetch(`${API_URL}/trips/${trip._id}/assign`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ driverId: driver._id })
        });
        const assignedTrip = await assignRes.json();
        console.log("Driver Assigned. Status:", assignedTrip.status);

        console.log("\n=== 5. Login as Driver ===");
        const driverLoginRes = await fetch(`${API_URL}/auth/driver/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: driver.phone, password: 'password123' })
        });

        if (!driverLoginRes.ok) throw new Error("Driver Login Failed. Check password.");

        const driverData = await driverLoginRes.json();
        // Check structure based on auth.js: res.json({ token, driver: { ... } }) OR res.json({ success: true, driver: { ... token ... } })? 
        // Let's print it to be safe or rely on what I see in auth.js
        // If auth.js says: res.json({ token, driver: { ... } }); then driverData.token is correct.
        // If auth.js says: res.json({ success: true, token, driver: ... }); then driverData.token is correct.
        // If auth.js says: res.json({ driver: { ... token: ... } });

        let driverToken = driverData.token;
        if (!driverToken && driverData.driver && driverData.driver.token) driverToken = driverData.driver.token;
        if (!driverToken && driverData.user && driverData.user.token) driverToken = driverData.user.token;

        console.log("Driver Logged In. Token length:", driverToken ? driverToken.length : "MISSING");

        console.log("\n=== 6. Driver Accepts Trip ===");
        const acceptRes = await fetch(`${API_URL}/trips/${trip._id}/accept`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${driverToken}` }
        });
        const acceptedTrip = await acceptRes.json();
        console.log("Trip Accepted. Status:", acceptedTrip.status);

        console.log("\n=== 7. Driver Starts Trip (OTP) ===");
        const startRes = await fetch(`${API_URL}/trips/${trip._id}/start`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${driverToken}`
            },
            body: JSON.stringify({ otp: '0000' })
        });
        const startedTrip = await startRes.json();
        console.log("Trip Started. Status:", startedTrip.status);

        console.log("\n=== 8. Driver Completes Trip (Upload) ===");
        // Create dummy file
        fs.writeFileSync('dummysheet.jpg', 'fake image content');

        const form = new FormData();
        form.append('totalKm', '100');
        form.append('totalHours', '5');
        form.append('tollParking', '50');
        form.append('dripSheet', fs.createReadStream('dummysheet.jpg'));

        const completeRes = await fetch(`${API_URL}/trips/${trip._id}/complete`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${driverToken}`,
                ...form.getHeaders()
            },
            body: form
        });

        if (!completeRes.ok) {
            console.error(await completeRes.text());
        } else {
            const completedTrip = await completeRes.json();
            console.log("Trip Completed. Status:", completedTrip.status);
            console.log("Drip Sheet URL:", completedTrip.dripSheetImage);
        }

        // Cleanup
        fs.unlinkSync('dummysheet.jpg');

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

runTest();
