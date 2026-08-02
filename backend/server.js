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

// Inflation
app.get('/api/inflation', async (req, res) => {
  try {
    const response = await axios.get(`https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${FRED_API_KEY}&sort_order=desc&limit=24&file_type=json`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inflation data' });
  }
});

// GDP
app.get('/api/gdp', async (req, res) => {
  try {
    const response = await axios.get(`https://api.stlouisfed.org/fred/series/observations?series_id=GDP&api_key=${FRED_API_KEY}&sort_order=desc&limit=1&file_type=json`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch GDP data' });
  }
});

// Exchange Rate
app.get('/api/exchange', async (req, res) => {
  try {
    const response = await axios.get(`https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/USD`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch exchange rate data' });
  }
});

// News
app.get('/api/news', async (req, res) => {
  try {
    const response = await axios.get(`https://newsapi.org/v2/everything?q=kenya+economy&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news data' });
  }
});

// AI Report
app.post('/api/report', async (req, res) => {
  try {
    const { inflation, exchangeKES, exchangeUGX, unemployment } = req.body;
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are an expert economist analyzing real-time Kenya economic data. Write a professional economic intelligence report based on this live data:

- Latest CPI (Inflation Index): ${inflation}
- USD to KES Exchange Rate: ${exchangeKES}
- USD to UGX Exchange Rate: ${exchangeUGX}
- Unemployment Rate: ${unemployment}%

Write a clear, insightful 3-paragraph report covering:
1. Current economic situation and what these numbers mean
2. Key risks and opportunities for Kenya's economy
3. Short-term outlook and recommendations

Use professional economic language suitable for investors, researchers, and policymakers.`
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