const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use the generic 'latest' alias which is supported
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

async function generateAIResponse(prompt, context = "") {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY not found in environment variables");
        }

        // Construct a system-like prompt by combining context and user query
        const fullPrompt = `
      You are an intelligent assistant for the SetGo Transport Admin Platform.
      Your goal is to help transport managers with insights, logs, and general queries.
      
      CONTEXT DATA (Use this if relevant to the query):
      ${context}

      USER QUERY:
      ${prompt}
    `;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        return text;
    } catch (error) {
        console.error("Error in AI Service:", error);

        if (error.message.includes("429")) {
            return "I'm currently overloaded with requests (Quota Exceeded). Please try again in a minute.";
        }
        if (error.message.includes("404")) {
            return "My AI model is currently unavailable. Please contact support.";
        }

        return "I encountered an error processing your request. Please check the backend logs.";
    }
}

module.exports = { generateAIResponse };
