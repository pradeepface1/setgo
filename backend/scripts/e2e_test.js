const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
// const fetch = require('node-fetch'); // Using global fetch
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

const User = require('../models/User');
const Organization = require('../models/Organization');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');

// Config
const API_URL = `http://localhost:${process.env.PORT || 5001}/api`;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function runTest() {
    console.log('🚀 Starting End-to-End Test for Multi-Tenancy Flow...\n');

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jubilant_mvp');
        console.log('✅ Connected to MongoDB');

        // 1. Setup Super Admin Session
        let superAdmin = await User.findOne({ username: 'superadmin' });
        if (!superAdmin) {
            console.log('⚠️ Super Admin not found, creating one...');
            // Create dummy super admin logic here if needed, but for now assuming it exists or failing
            throw new Error('Super Admin user "superadmin" not found. Please run migration or create user first.');
        }

        const superAdminToken = jwt.sign(
            { userId: superAdmin._id, role: 'SUPER_ADMIN' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log('✅ Super Admin Logged In (Token Generated)');

        // 2. Create Organization
        const orgCode = `TEST_${Date.now()}`; // Unique code
        const orgData = {
            name: `Test Org ${orgCode}`,
            code: orgCode,
            displayName: `E2E Test Organization ${orgCode}`,
            contactEmail: `admin@${orgCode.toLowerCase()}.com`,
            contactPhone: '9998887776',
            address: 'Test Address',
            status: 'ACTIVE'
        };

        const orgRes = await fetch(`${API_URL}/organizations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${superAdminToken}` },
            body: JSON.stringify(orgData)
        });

        if (!orgRes.ok) throw new Error(`Failed to create Org: ${await orgRes.text()}`);
        const orgResult = await orgRes.json();
        const orgId = orgResult._id;
        console.log(`✅ Organization Created: ${orgResult.displayName}`);

        // 3. Create Org Admin
        const orgAdminUsername = `admin_${orgCode}`;
        const orgAdminData = {
            username: orgAdminUsername,
            password: 'password123',
            role: 'ORG_ADMIN',
            organizationId: orgId
        };

        const adminRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${superAdminToken}` },
            body: JSON.stringify(orgAdminData)
        });

        if (!adminRes.ok) throw new Error(`Failed to create Org Admin: ${await adminRes.text()}`);
        const adminResult = await adminRes.json();
        console.log(`✅ Org Admin Created: ${orgAdminUsername}`);

        // 3.5 Create Commuter User (Org Admin Level or via Super Admin for Org)
        // Testing Super Admin creating a Commuter for the Org (matches UI flow)
        const commuterUsername = `commuter_${orgCode}`;
        const commuterData = {
            username: commuterUsername,
            password: 'password123',
            role: 'COMMUTER',
            organizationId: orgId
        };

        const commuterRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${superAdminToken}` },
            body: JSON.stringify(commuterData)
        });

        if (!commuterRes.ok) throw new Error(`Failed to create Commuter: ${await commuterRes.text()}`);
        console.log(`✅ Commuter User Created: ${commuterUsername}`);
        //    Let's use the new Org Admin to create the driver!

        // Login as Org Admin (or generate token)
        const orgAdminToken = jwt.sign(
            { userId: adminResult.user.id, role: 'ORG_ADMIN', organizationId: orgId },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        // Note: adminResult.user.id or _id might vary, checking backend response structure
        // The register response returns `user: { id: ... }` based on auth.js line 56

        const driverPhone = `999${Math.floor(Math.random() * 10000000)}`;
        const driverData = {
            name: `Driver ${orgCode}`,
            phone: driverPhone,
            password: 'password123',
            vehicleModel: 'Test Car',
            vehicleNumber: `KA01${orgCode.substring(0, 4)}`,
            vehicleCategory: 'Sedan Regular',
            organizationId: orgId
        };

        const driverRes = await fetch(`${API_URL}/drivers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${orgAdminToken}` },
            body: JSON.stringify(driverData)
        });

        // Backend currently might not support Org Admin creating drivers if not fully implemented in routes/drivers.js
        // I remember seeing `drivers.router.post('/', ...)` in `drivers.js`.
        // Let's check if it needs super admin or org admin access.

        if (!driverRes.ok) throw new Error(`Failed to create Driver: ${await driverRes.text()}`);
        const driverResult = await driverRes.json();
        const driverId = driverResult._id; // Or driverResult.driver._id
        console.log(`✅ Driver Created: ${driverResult.name} (${driverPhone})`);

        // 5. Create Trip (by Org Admin)
        const tripData = {
            customerName: 'Test Commuter',
            pickupLocation: 'Point A',
            dropLocation: 'Point B',
            tripDateTime: new Date(Date.now() + 3600000).toISOString(),
            vehicleCategory: 'Sedan Regular',
            organizationId: orgId
        };
        // Wait, trips are usually created via requesting? Or by admin manually?
        // Let's assume Admin manually creates via POST /api/trips

        const tripRes = await fetch(`${API_URL}/trips`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${orgAdminToken}` },
            body: JSON.stringify(tripData)
        });

        if (!tripRes.ok) throw new Error(`Failed to create Trip: ${await tripRes.text()}`);
        const tripResult = await tripRes.json();
        const tripId = tripResult._id;
        console.log(`✅ Trip Created: ${tripId}`);

        // 6. Assign Driver to Trip
        const assignRes = await fetch(`${API_URL}/trips/${tripId}/assign`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${orgAdminToken}` },
            body: JSON.stringify({ driverId: driverId })
        });

        if (!assignRes.ok) throw new Error(`Failed to assign Driver: ${await assignRes.text()}`);
        console.log(`✅ Driver Assigned to Trip`);

        // 7. Driver Login & Verify Trip
        // 7. Driver Login
        console.log(`\n🔑 Driver Logging In...`);
        const driverLoginRes = await fetch(`${API_URL}/auth/driver/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: driverPhone, password: 'password123', organizationCode: orgCode })
        });

        if (!driverLoginRes.ok) throw new Error(`Driver Login Failed: ${await driverLoginRes.text()}`);
        const driverLoginData = await driverLoginRes.json();
        const driverToken = driverLoginData.driver.token;
        console.log(`✅ Driver Logged In`);

        // 8. Driver Fetch Trips
        console.log(`\n📋 Driver Fetching Trips...`);
        const driverTripsRes = await fetch(`${API_URL}/drivers/${driverId}/trips`, {
            headers: { 'Authorization': `Bearer ${driverToken}` }
        });
        if (!driverTripsRes.ok) throw new Error(`Driver Fetch Trips Failed: ${await driverTripsRes.text()}`);
        const driverTrips = await driverTripsRes.json();
        console.log(`✅ Driver Fetched ${driverTrips.length} Trips`);

        // Verification passed if we reach here without error
        console.log('🎉 End-to-End Test Passed Successfully!');

    } catch (err) {
        console.error('❌ Test Failed:', err);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Disconnected');
    }
}

runTest();
