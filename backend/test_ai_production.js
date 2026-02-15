
const axios = require('axios');

const API_URL = 'https://backend-191882634358.asia-south1.run.app/api/ai/query';

async function testAI() {
    try {
        console.log('Testing AI Service at:', API_URL);
        const response = await axios.post(API_URL, {
            prompt: "Hello, are you online?",
            context: "User is checking system status."
        });

        console.log('AI Response Success!');
        console.log('Response:', response.data);

    } catch (error) {
        console.error('AI Request Failed!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testAI();
