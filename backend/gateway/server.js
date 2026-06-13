const express = require('express');
const fs = require('fs');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files for Helix UI
app.use(express.static('public'));

// GET / – health check
app.get('/', (req, res) => {
  res.send('🌀 Spiral AI Agent is live. Use POST /chat to talk to me, or POST /create-card for a virtual card.');
});

// POST /chat – uses DeepSeek API
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).json({ error: 'Missing "message" field' });
  }

  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (!deepseekKey) {
    return res.status(500).json({ error: 'DeepSeek API key not configured' });
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response from DeepSeek.';
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /create-card – creates a virtual card via AgentCard API
app.post('/create-card', async (req, res) => {
  const { name, limit } = req.body; // limit in dollars
  if (!name || !limit) {
    return res.status(400).json({ error: 'Missing "name" or "limit" (in dollars)' });
  }

  let agentcardJwt = process.env.AGENTCARD_JWT;
  if (!agentcardJwt) {
    try {
      agentcardJwt = fs.readFileSync('/etc/secrets/AGENTCARD_JWT', 'utf8').trim();
    } catch (err) {
      return res.status(500).json({ error: 'AgentCard JWT not configured (secret file missing)' });
    }
  }

  try {
    const response = await fetch('https://api.agentcard.sh/v1/cards', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${agentcardJwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name,
        limit: Math.round(limit * 100), // convert dollars to cents
      }),
    });
    const cardData = await response.json();
    res.json(cardData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Spiral listening on port ${PORT}`);
});
