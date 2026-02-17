
const axios = require('axios');

const API_URL = 'https://backend-191882634358.asia-south1.run.app/api/auth/login';

async function testLogin() {
    try {
        console.log('Attempting login to:', API_URL);
        const response = await axios.post(API_URL, {
            username: 'superadmin',
            password: 'password123'
        });

        console.log('Login Successful!');
        console.log('Status:', response.status);
        console.log('User Role:', response.data.user.role);
        console.log('Token received:', response.data.token ? 'YES' : 'NO');

    } catch (error) {
        console.error('Login Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testLogin();
