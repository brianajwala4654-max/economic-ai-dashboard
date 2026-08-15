const express = require('express');
const path = require('path');
const axios = require('axios');
const cors = require('cors');
const xml2js = require('xml2js');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// ============================================================
// FRONTEND
// ============================================================

const frontendPath = path.join(__dirname, '..', 'dist');

app.use(express.static(frontendPath));

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const PORT = process.env.PORT || 3001;
const EXCHANGE_API_KEY = process.env.EXCHANGE_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// ============================================================
// COUNTRY INFLATION DATA
// ============================================================

const countryInflation = {
  Kenya: {
    rate: 3.6,
    trend: [
      3.2, 3.4, 3.6, 3.8, 3.9, 3.7,
      3.6, 3.5, 3.6, 3.7, 3.6, 3.6
    ]
  },

  Uganda: {
    rate: 3.5,
    trend: [
      3.8, 3.6, 3.4, 3.2, 3.3, 3.5,
      3.6, 3.5, 3.4, 3.5, 3.5, 3.5
    ]
  },

  Tanzania: {
    rate: 3.1,
    trend: [
      3.5, 3.4, 3.3, 3.2, 3.1, 3.0,
      3.1, 3.2, 3.1, 3.0, 3.1, 3.1
    ]
  },

  Rwanda: {
    rate: 4.8,
    trend: [
      5.2, 5.0, 4.9, 4.8, 4.7, 4.8,
      4.9, 4.8, 4.7, 4.8, 4.8, 4.8
    ]
  },

  Ethiopia: {
    rate: 9.4,
    trend: [
      11.0, 10.5, 10.2, 9.9, 9.7, 9.5,
      9.4, 9.4, 9.3, 9.4, 9.4, 9.4
    ]
  }
};

// ============================================================
// INFLATION MONTHS
// ============================================================

const months = [
  '2025-07',
  '2025-08',
  '2025-09',
  '2025-10',
  '2025-11',
  '2025-12',
  '2026-01',
  '2026-02',
  '2026-03',
  '2026-04',
  '2026-05',
  '2026-06'
];

// ============================================================
// NEWS SEARCH QUERIES
// ============================================================

const newsQueries = {
  Kenya: 'Kenya economy OR Kenya business OR Kenya markets',
  Uganda: 'Uganda economy OR Uganda business OR Uganda markets',
  Tanzania: 'Tanzania economy OR Tanzania business OR Tanzania markets',
  Rwanda: 'Rwanda economy OR Rwanda business OR Rwanda markets',
  Ethiopia: 'Ethiopia economy OR Ethiopia business OR Ethiopia markets'
};

// ============================================================
// HELPER: CLEAN HTML
// ============================================================

function cleanText(text = '') {
  return String(text)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// GOOGLE NEWS RSS
// ============================================================

async function fetchGoogleNews(country) {
  const query = newsQueries[country] || newsQueries.Kenya;

  const url =
    `https://news.google.com/rss/search?q=${encodeURIComponent(
      query
    )}&hl=en-KE&gl=KE&ceid=KE:en`;

  try {
    console.log(`Fetching Google News for ${country}`);

    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        Accept:
          'application/rss+xml, application/xml, text/xml'
      }
    });

    const parser = new xml2js.Parser({
      explicitArray: false,
      trim: true
    });

    const result = await parser.parseStringPromise(response.data);

    const items = result?.rss?.channel?.item || [];

    const itemArray = Array.isArray(items)
      ? items
      : [items];

    const articles = itemArray
      .filter(Boolean)
      .map(item => {
        const title = cleanText(item.title || '');

        const description = cleanText(
          item.description || ''
        );

        let link = item.link || '';

        if (typeof link === 'object') {
          link =
            link._ ||
            link.href ||
            '';
        }

        return {
          title,
          description:
            description.length > 180
              ? description.slice(0, 180) + '...'
              : description,
          url: link,
          publishedAt:
            item.pubDate ||
            item.pubdate ||
            ''
        };
      })
      .filter(
        article =>
          article.title &&
          article.url
      );

    console.log(
      `Found ${articles.length} articles for ${country}`
    );

    return articles;

  } catch (error) {
    console.error(
      `Google News error for ${country}:`,
      error.message
    );

    return [];
  }
}

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'NexusEconomics API',
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// INFLATION API
// ============================================================

app.get('/api/inflation/:country', (req, res) => {
  const country = req.params.country;

  const data = countryInflation[country];

  if (!data) {
    return res.status(404).json({
      error: 'Country not found'
    });
  }

  const observations = data.trend.map(
    (value, index) => ({
      date: months[index],
      value: value.toString()
    })
  );

  res.json({
    observations,
    latestRate: data.rate
  });
});

// ============================================================
// EXCHANGE RATE API
// ============================================================

app.get('/api/exchange', async (req, res) => {
  try {
    if (!EXCHANGE_API_KEY) {
      return res.status(500).json({
        error:
          'EXCHANGE_API_KEY is not configured'
      });
    }

    const response = await axios.get(
      `https://v6.exchangerate-api.com/v6/${EXCHANGE_API_KEY}/latest/USD`,
      {
        timeout: 10000
      }
    );

    res.json(response.data);

  } catch (error) {
    console.error(
      'Exchange API error:',
      error.response?.data ||
      error.message
    );

    res.status(500).json({
      error:
        'Failed to fetch exchange rate data'
    });
  }
});

// ============================================================
// NEWS API
// ============================================================

app.get('/api/news', async (req, res) => {
  try {
    const country =
      req.query.country || 'Kenya';

    const articles =
      await fetchGoogleNews(country);

    res.json({
      country,
      articles: articles.slice(0, 8)
    });

  } catch (error) {
    console.error(
      'News API error:',
      error.message
    );

    res.status(500).json({
      error: 'Failed to fetch news',
      articles: []
    });
  }
});

// ============================================================
// AI ECONOMIC REPORT
// ============================================================

app.post('/api/report', async (req, res) => {
  try {
    const {
      inflation,
      exchangeKES,
      exchangeUGX,
      unemployment,
      country
    } = req.body;

    if (!CLAUDE_API_KEY) {
      return res.status(500).json({
        error:
          'CLAUDE_API_KEY is not configured'
      });
    }

    const prompt = `
You are a senior economist at a leading African financial institution.

Write a concise, data-driven economic intelligence brief for ${country}.

Use the following indicators:

Inflation Rate: ${inflation}%
USD/KES Exchange Rate: ${exchangeKES}
USD/UGX Exchange Rate: ${exchangeUGX}
Unemployment Rate: ${unemployment}%

Write exactly 3 paragraphs.

Paragraph 1 — Current situation:
Interpret what these specific numbers mean for ${country}'s economy right now. Mention the actual figures.

Paragraph 2 — Risks and opportunities:
Discuss the key economic risks and opportunities for trade, investment, employment and growth.

Paragraph 3 — Outlook and recommendations:
Give a short-term economic outlook and practical recommendations for policymakers, investors and businesses.

Use professional economic language.

Do not use bullet points.

Do not invent statistics that were not provided.
`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model:
          'claude-haiku-4-5-20251001',

        max_tokens: 1200,

        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        timeout: 30000,

        headers: {
          'Content-Type':
            'application/json',

          'x-api-key':
            CLAUDE_API_KEY,

          'anthropic-version':
            '2023-06-01'
        }
      }
    );

    const report =
      response.data?.content?.[0]?.text ||
      'No report was generated.';

    res.json({
      report
    });

  } catch (error) {
    console.error(
      'Claude API error:',
      error.response?.data ||
      error.message
    );

    res.status(500).json({
      error:
        'Failed to generate economic report'
    });
  }
});

// ============================================================
// REACT FRONTEND FALLBACK
// ============================================================

// IMPORTANT:
// Do NOT use app.get('*') here.
// Express 5 / path-to-regexp causes:
// "Missing parameter name at index 1: *"
//
// Instead we use middleware after the API routes.

app.use((req, res, next) => {
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api/')
  ) {
    return res.sendFile(
      path.join(
        frontendPath,
        'index.html'
      )
    );
  }

  next();
});

// ============================================================
// 404 API HANDLER
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(
  PORT,
  '0.0.0.0',
  () => {
    console.log(
      `NexusEconomics server running on port ${PORT}`
    );
  }
);