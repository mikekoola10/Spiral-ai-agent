const express = require('express');
const { spawn } = require('child_process');
const app = express();
app.use(express.json());
app.post('/chat', (req, res) => {
    const userMsg = req.body.message;
    const python = spawn('python3', ['/app/backend/agent/agent_cli.py', userMsg]);
    let output = '';
    python.stdout.on('data', (d) => output += d.toString());
    python.stderr.on('data', (d) => console.error(d.toString()));
    python.on('close', () => res.json({ reply: output || "No response" }));
});
app.listen(3001, () => console.log('Gateway on 3001'));
