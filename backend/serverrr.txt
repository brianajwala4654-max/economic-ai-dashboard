const express = require('express');
const axios = require('axios');
const cors = require('cors');
const xml2js = require('xml2js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const EXCHANGE_API_KEY = process.env.EXCHANGE_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

const countryInflation = {
  Kenya:    { rate: 3.6,  trend: [3.2,3.4,3.6,3.8,3.9,3.7,3.6,3.5,3.6,3.7,3.6,3.6] },
  Uganda:   { rate: 3.5,  trend: [3.8,3.6,3.4,3.2,3.3,3.5,3.6,3.5,3.4,3.5,3.5,3.5] },
  Tanzania: { rate: 3.1,  trend: [3.5,3.4,3.3,3.2,3.1,3.0,3.1,3.2,3.1,3.0,3.1,3.1] },
  Rwanda:   { rate: 4.8,  trend: [5.2,5.0,4.9,4.8,4.7,4.8,4.9,4.8,4.7,4.8,4.8,4.8] },
  Ethiopia: { rate: 9.4,  trend: [11.0,10.5,10.2,9.9,9.7,9.5,9.4,9.4,9.3,9.4,9.4,9.4] },
};

const months = ['2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03','2026-04','2026-05','2026-06'];

const rssFeeds = {
  Kenya: [
    'https://www.businessdailyafrica.com/feed',
    'https://nation.africa/kenya/business/rss.xml',
  ],
  Uganda: [
    'https://www.monitor.co.ug/Uganda/Business/rss',
    'https://businessfocus.co.ug/feed',
  ],
  Tanzania: [
    'https://www.thecitizen.co.tz/feed',
    'https://dailynews.co.tz/feed',
  ],
  Rwanda: [
    'https://rw.linkedin.com/feed',
    'https://www.newtimes.co.rw/feed',
  ],
  Ethiopia: [
    'https://addisfortune.news/feed',
    'https://www.thereporterethiopia.com/feed',
  ],
};

app.get('/api/inflation/:country', (req, res) => {
  const country = req.params.country;
  const data = countryInflation[country];
  if (!data) return res.status(404).json({ error: 'Country not found' });
  const observations = data.trend.map((value, i) => ({ date: months[i], value: value.toString() }));
  res.json({ observations, latestRate: data.rate });
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
    const country = req.query.country || 'Kenya';
    const feeds = rssFeeds[country] || rssFeeds['Kenya'];
    const parser = new xml2js.Parser({ explicitArray: false });
    const articles = [];

    for (const feedUrl of feeds) {
      try {
        const response = await axios.get(feedUrl, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        const result = await parser.parseStringPromise(response.data);
        const items = result?.rss?.channel?.item || [];
        const itemArray = Array.isArray(items) ? items : [items];
        itemArray.slice(0, 3).forEach(item => {
          articles.push({
            title: item.title || '',
            description: item.description ? item.description.replace(/<[^>]*>/g, '').slice(0, 150) + '...' : '',
            url: item.link || '#',
          });
        });
      } catch (feedError) {
        console.error(`Failed to fetch feed: ${feedUrl}`);
      }
    }

    res.json({ articles: articles.slice(0, 5) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news', articles: [] });
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
        messages: [{
          role: 'user',
          content: `You are a senior economist at a leading African financial institution. Write a concise, data-driven economic intelligence brief for ${country} based on the following live indicators:

- Inflation Rate: ${inflation}%
- USD/KES Exchange Rate: ${exchangeKES}
- USD/UGX Exchange Rate: ${exchangeUGX}
- Unemployment Rate: ${unemployment}%

Write exactly 3 paragraphs:
Paragraph 1 — Current situation: Interpret what these specific numbers mean for ${country}'s economy right now. Mention the actual figures.
Paragraph 2 — Risks and opportunities: Key economic risks and opportunities for trade, investment, and growth.
Paragraph 3 — Outlook and recommendations: Short-term outlook and what policymakers, investors, or businesses should do.

Write in professional flowing paragraphs — no bullet points.`
        }]
      },
      { headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' } }
    );
    res.json({ report: response.data.content[0].text });
  } catch (error) {
    console.error('Claude API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));