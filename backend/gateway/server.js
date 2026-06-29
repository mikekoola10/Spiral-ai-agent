const express = require('express');
const path = require('path');
const fs = require('fs');
const StellarSdk = require('stellar-sdk');
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

// Helper to manage ledger data
const LEDGER_PATH = path.join(__dirname, 'ledger.json');
const loadLedger = () => {
    try {
        const data = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
        return {
            ...data,
            get operations_fund() { return this.total_revenue * 0.3; },
            get spendable_fund() { return this.total_revenue * 0.7; },
            get roi() { return this.spendable_fund / this.costs; }
        };
    } catch (e) {
        return { total_revenue: 0, costs: 0, kill_switch: false };
    }
};

const saveLedger = (data) => {
    const { total_revenue, costs, kill_switch } = data;
    fs.writeFileSync(LEDGER_PATH, JSON.stringify({ total_revenue, costs, kill_switch }, null, 2));
};

let ledger = loadLedger();

// Helper to manage subscription and scheduler data
const SUBSCRIPTIONS_PATH = path.join(__dirname, 'subscriptions.json');
const SCHEDULER_PATH = path.join(__dirname, 'scheduler.json');

const loadData = (filePath) => {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
        return [];
    }
};

// Authentication middleware
const auth = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const authHeader = req.headers['authorization'];
    let bearerToken;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        bearerToken = authHeader.substring(7);
    }

    if ((apiKey && apiKey === process.env.ADMIN_API_KEY) ||
        (bearerToken && bearerToken === process.env.ADMIN_API_KEY)) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Stellar Configuration
const STELLAR_SECRET = process.env.STELLAR_SECRET;
const server = new StellarSdk.Horizon.Server('https://horizon.stellar.org');

// Vault Summary Endpoint
app.get('/vault/summary', auth, (req, res) => {
    res.json({
        total_revenue: ledger.total_revenue,
        operations_fund: ledger.operations_fund,
        spendable_fund: ledger.spendable_fund
    });
});

app.get('/admin/ledger', auth, (req, res) => {
    res.json(ledger);
});

// Stellar Balance Endpoint
app.get('/admin/stellar/balance', auth, async (req, res) => {
    try {
        if (!STELLAR_SECRET) return res.json({ balance: "0.0000", error: "No secret configured" });
        const pair = StellarSdk.Keypair.fromSecret(STELLAR_SECRET);
        const account = await server.loadAccount(pair.publicKey());
        const nativeBalance = account.balances.find(b => b.asset_type === 'native');
        res.json({ balance: nativeBalance ? nativeBalance.balance : "0.0000", public_key: pair.publicKey() });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Stellar Send Endpoint
app.post('/admin/stellar/send', auth, async (req, res) => {
    const { to, amount, asset = 'XLM' } = req.body;
    try {
        if (!STELLAR_SECRET) throw new Error("No STELLAR_SECRET configured");
        const sourcePair = StellarSdk.Keypair.fromSecret(STELLAR_SECRET);
        const sourceAccount = await server.loadAccount(sourcePair.publicKey());

        let stellarAsset;
        if (asset === 'XLM') {
            stellarAsset = StellarSdk.Asset.native();
        } else {
            const [code, issuer] = asset.split(':');
            if (!code || !issuer) throw new Error("Invalid asset format. Expected CODE:ISSUER");
            stellarAsset = new StellarSdk.Asset(code, issuer);
        }

        const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
            fee: StellarSdk.BASE_FEE,
            networkPassphrase: StellarSdk.Networks.PUBLIC
        })
        .addOperation(StellarSdk.Operation.payment({
            destination: to,
            asset: stellarAsset,
            amount: amount
        }))
        .setTimeout(30)
        .build();

        transaction.sign(sourcePair);
        const result = await server.submitTransaction(transaction);
        res.json({ success: true, hash: result.hash });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Monitor Endpoint (for Dashboard)
app.get('/monitor', auth, async (req, res) => {
    let stellarBalance = "0.00";
    try {
        if (STELLAR_SECRET) {
            const pair = StellarSdk.Keypair.fromSecret(STELLAR_SECRET);
            const account = await server.loadAccount(pair.publicKey());
            const native = account.balances.find(b => b.asset_type === 'native');
            stellarBalance = native ? native.balance : "0.00";
        }
    } catch (e) {}

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
        stellar: {
            balance: stellarBalance,
            asset: "XLM"
        },
        total_costs: ledger.costs,
        roi: ledger.roi
    });
});

// Mock endpoints for dashboard actions
app.post('/grants/monitor', auth, (req, res) => res.json({ success: true }));
app.post('/compliance/kill-switch', auth, (req, res) => {
    ledger.kill_switch = true;
    saveLedger(ledger);
    res.json({ success: true });
});
app.post('/compliance/kill-switch/reset', auth, (req, res) => {
    ledger.kill_switch = false;
    saveLedger(ledger);
    res.json({ success: true });
});

// Subscription Management Endpoints
app.get('/admin/subscriptions', auth, (req, res) => {
    res.json(loadData(SUBSCRIPTIONS_PATH));
});

// Scheduler Management Endpoints
app.get('/admin/scheduler', auth, (req, res) => {
    res.json(loadData(SCHEDULER_PATH));
});

// AgentCard Integration Endpoint
const { exec } = require('child_process');

app.post('/admin/agentcards/create', auth, (req, res) => {
    const { name, limit } = req.body;
    if (!limit) return res.status(400).json({ error: "Limit is required" });

    const cmd = `agent-cards cards create --amount ${limit} --json`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: stderr || error.message });
        }
        try {
            const card = JSON.parse(stdout);
            // If name is provided, the current CLI might not support --name yet,
            // but we can return it in the response for consistency.
            res.json({ success: true, card: { ...card, name: name || card.name } });
        } catch (e) {
            res.json({ success: true, output: stdout.trim() });
        }
    });
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
