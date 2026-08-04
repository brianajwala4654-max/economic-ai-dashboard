const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const FRED_API_KEY = process.env.FRED_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const EXCHANGE_API_KEY = process.env.EXCHANGE_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

app.get('/api/inflation', async (req, res) => {
  try {
    const response = await axios.get(`https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${FRED_API_KEY}&sort_order=asc&limit=36&file_type=json`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inflation data' });
  }
});

app.get('/api/gdp', async (req, res) => {
  try {
    const response = await axios.get(`https://api.stlouisfed.org/fred/series/observations?series_id=GDP&api_key=${FRED_API_KEY}&sort_order=desc&limit=1&file_type=json`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch GDP data' });
  }
});

app.get('/api/exchange', async (req, res) => {
  try {
    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/USD`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exchange rate data' });
  }
});

app.get('/api/news', async (req, res) => {
  try {
    const response = await axios.get(`https://newsapi.org/v2/everything?q=Kenya+CBK+Treasury+KRA+NSE+inflation+GDP+fuel+prices&sortBy=publishedAt&language=en&apiKey=${NEWS_API_KEY}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news data' });
  }
});

app.post('/api/report', async (req, res) => {
  try {
    const { inflation, exchangeKES, exchangeUGX, unemployment, country } = req.body;
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are a senior economist at a leading African financial institution. Write a concise, data-driven economic intelligence brief for ${country} based on the following live indicators:

- CPI Inflation Index: ${inflation}
- USD/KES Exchange Rate: ${exchangeKES}
- USD/UGX Exchange Rate: ${exchangeUGX}
- Unemployment Rate: ${unemployment}%

Write exactly 3 paragraphs:

Paragraph 1 — Current situation: Interpret what these specific numbers mean for ${country}'s economy right now. Be specific — mention the actual figures.

Paragraph 2 — Risks and opportunities: What are the key economic risks (inflation pressure, currency volatility, energy prices) and opportunities (trade, investment, growth sectors)?

Paragraph 3 — Outlook and recommendations: What is the short-term economic outlook? What should policymakers, investors, or businesses do?

Write in a professional but accessible tone. Be specific, not generic. Do not use bullet points — write in flowing paragraphs like a real economic brief.`
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    res.json({ report: response.data.content[0].text });
  } catch (error) {
    console.error('Claude API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});