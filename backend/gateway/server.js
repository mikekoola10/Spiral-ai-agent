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

// Financial Ledger Data (Mocked based on recent reports)
const ledger = {
    total_revenue: 2581.00,
    costs: 161.94,
    kill_switch: false,
    get operations_fund() { return this.total_revenue * 0.3; },
    get spendable_fund() { return this.total_revenue * 0.7; },
    get roi() { return this.spendable_fund / this.costs; }
};

// Vault Summary Endpoint
app.get('/vault/summary', (req, res) => {
    res.json({
        total_revenue: ledger.total_revenue,
        operations_fund: ledger.operations_fund,
        spendable_fund: ledger.spendable_fund
    });
});

// Monitor Endpoint (for Dashboard)
app.get('/monitor', (req, res) => {
    res.json({
        status: ledger.kill_switch ? "KILL_SWITCH_ACTIVE" : "SYSTEM_NOMINAL",
        uptime: "137h0m19s",
        autonomy: 0.95,
        active_swarms: 0,
        revenue: {
            operations: ledger.operations_fund,
            spendable: ledger.spendable_fund,
            total: ledger.total_revenue
        },
        total_costs: ledger.costs,
        roi: ledger.roi
    });
});

// Mock endpoints for dashboard actions
app.post('/grants/monitor', (req, res) => res.json({ success: true }));
app.post('/compliance/kill-switch', (req, res) => {
    ledger.kill_switch = true;
    res.json({ success: true });
});
app.post('/compliance/kill-switch/reset', (req, res) => {
    ledger.kill_switch = false;
    res.json({ success: true });
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
