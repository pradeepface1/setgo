const express = require('express');
const router = express.Router();
const { generateAIResponse } = require('../services/aiService');
const auth = require('../middleware/auth'); // Optional: Protect this route

router.post('/query', async (req, res) => {
    try {
        const { prompt, context } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const aiResponse = await generateAIResponse(prompt, context);
        res.json({ response: aiResponse });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to process AI request' });
    }
});

module.exports = router;
