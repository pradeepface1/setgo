// Standalone script using native fetch

async function createDriver() {
    const API_URL = 'http://localhost:5001/api';
    try {
        // Login
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ username: 'admin@jubilant.com', password: 'password123' }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!loginRes.ok) {
            console.error('Login failed:', await loginRes.json());
            return;
        }
        const loginData = await loginRes.json();
        const token = loginData.user.token; // It's nested in user object based on auth.js login response: res.json({ success: true, user: { ... token } })


        // Create Driver
        const newDriver = {
            name: "Test Driver",
            phone: "9999999999",
            password: "initialpass",
            vehicleModel: "Test Car",
            vehicleNumber: "KA01AB1234",
            vehicleCategory: "Sedan Regular",
            organizationId: loginData.user.organizationId || "000000000000000000000000" // Fallback if super admin has no org, but driver needs one. 
            // Actually super admin needs to provide org ID. 
            // Let's first get Orgs.
        };

        // Get Orgs
        const orgRes = await fetch(`${API_URL}/organizations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const orgs = await orgRes.json();

        let orgId;
        if (orgs.length > 0) {
            orgId = orgs[0]._id;
        } else {
            // Create org
            const createOrgRes = await fetch(`${API_URL}/organizations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: "Test Org", code: "TEST", city: "Bangalore" })
            });
            const orgData = await createOrgRes.json();
            orgId = orgData._id;
        }

        newDriver.organizationId = orgId;

        const res = await fetch(`${API_URL}/drivers`, {
            method: 'POST',
            body: JSON.stringify(newDriver),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        console.log("Create Driver Status:", res.status);
        console.log(await res.json());

    } catch (e) { console.error(e); }
}

createDriver();
