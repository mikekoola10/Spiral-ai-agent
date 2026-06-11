const express = require('express');
const { spawn } = require('child_process');
const app = express();

// Parse JSON bodies
app.use(express.json());

// Simple GET route for browser
app.get('/', (req, res) => {
  res.send('🌀 Spiral AI Agent is live. Use POST /chat to talk to me.');
});

// POST /chat endpoint
app.post('/chat', (req, res) => {
    const userMsg = req.body.message;
    if (!userMsg) {
        return res.status(400).json({ error: 'Missing "message" field' });
    }
    const python = spawn('python3', ['../agent/agent_cli.py', userMsg]);
    let output = '';
    python.stdout.on('data', (d) => output += d.toString());
    python.stderr.on('data', (d) => console.error(d.toString()));
    python.on('close', () => res.json({ reply: output || "No response" }));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Spiral Gateway listening on port ${PORT}`));
