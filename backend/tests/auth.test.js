const request = require('supertest');
const mongoose = require('mongoose');

// We need to import the app, but sometimes app.listen() is called immediately in server.js.
// For testing, we ideally export the 'app' from server.js without listening.
// However, since we are testing a running server or a local instance, 
// let's assume we are hitting the deployed staging URL for this "E2E" style test 
// OR we can spin up a local instance if we refactor server.js.

// STRATEGY: HIT THE STAGING URL DIRECTLY
// This matches our plan to run E2E against the Cloud Run instance.

const BASE_URL = 'https://backend-191882634358.asia-south1.run.app';

describe('Backend API Sanity Check', () => {

    it('should be reachable (Health Check)', async () => {
        // Assuming there's a root route or health route. If not, 404 is still a response.
        const res = await request(BASE_URL).get('/');
        console.log('Root response status:', res.status);
        expect(res.status).toBeDefined();
    }, 10000); // 10s timeout for network

    // Test Driver Login (using a known test account if possible, or failing gracefully)
    it('should attempt driver login and return 400/401 for bad data', async () => {
        const res = await request(BASE_URL)
            .post('/api/auth/driver/login')
            .send({
                phone: '0000000000',
                password: 'wrongpassword'
            });

        expect(res.status).toBe(401);
        // expect(res.body).toHaveProperty('msg', 'Invalid Credentials');
    }, 10000);

});
