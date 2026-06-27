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

// Auth middleware
const authenticate = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (apiKey && apiKey === process.env.ADMIN_API_KEY) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Chat endpoint
app.post('/chat', (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({ error: 'Missing "message" field' });
    }
    // Echo response (later integrate DeepSeek)
    res.json({ reply: `You said: ${userMessage}` });
});

// Admin endpoints
app.post('/admin/agentcard/create', authenticate, (req, res) => {
    res.json({
        message: 'AgentCard creation triggered',
        status: 'pending_login',
        instructions: 'Please run "agent-cards cards create" in your local terminal to complete the interactive setup.'
    });
});

app.get('/admin/subscriptions', authenticate, (req, res) => {
    const subsPath = path.join(__dirname, 'subscriptions.json');
    if (fs.existsSync(subsPath)) {
        const subs = JSON.parse(fs.readFileSync(subsPath, 'utf8'));
        res.json(subs);
    } else {
        res.json({ subscriptions: [] });
    }
});

// Financial endpoints
app.get('/vault/summary', authenticate, (req, res) => {
    const ledgerPath = path.join(__dirname, 'ledger.json');
    if (fs.existsSync(ledgerPath)) {
        const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
        res.json(ledger);
    } else {
        res.json({ total_revenue: 0, costs: 0, spendable_fund: 0 });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Spiral listening on port ${PORT}`);
});
