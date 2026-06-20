const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

// Parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' folder (if it exists)
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Fallback: serve index.html if it exists
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

// Chat endpoint
app.post('/chat', (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({ error: 'Missing "message" field' });
    }
    // Echo response (later integrate DeepSeek)
    res.json({ reply: `You said: ${userMessage}` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Spiral listening on port ${PORT}`);
});
