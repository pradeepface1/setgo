
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Config
const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBlx_kJhijrjLoQ5Oyx2-6fRAlHH1Ln4d0";

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
    try {
        /* 
           Note: The Node SDK might not expose listModels directly on the main class in older versions, 
           but let's try to access the model list or just try a simple generation with a known 'safe' model.
           Actually, the SDK doesn't have a direct 'listModels' helper in the high-level entry. 
           We can use the REST API via axios to be sure.
        */
        const axios = require('axios');
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

        console.log('Fetching models from:', url);
        const response = await axios.get(url);

        console.log('Available Models:');
        response.data.models.forEach(m => {
            console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
        });

    } catch (error) {
        console.error('Error fetching models:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
    }
}

listModels();
