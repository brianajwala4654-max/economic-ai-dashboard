const express = require("express");
const path = require("path");
const axios = require("axios");
const cors = require("cors");
const xml2js = require("xml2js");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ----------------------------------------------------
// FRONTEND
// ----------------------------------------------------

const frontendPath = path.join(__dirname, "..", "dist");

app.use(express.static(frontendPath));

// ----------------------------------------------------
// ENVIRONMENT
// ----------------------------------------------------

const PORT = process.env.PORT || 3001;
const EXCHANGE_API_KEY = process.env.EXCHANGE_API_KEY;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

// ----------------------------------------------------
// ECONOMIC DATA
// ----------------------------------------------------

const countryData = {
  Kenya: {
    inflation: {
      rate: 4.1,
      trend: [
        6.3,
        6.0,
        5.8,
        5.7,
        5.6,
        5.2,
        4.9,
        4.8,
        4.6,
        4.4,
        4.2,
        4.1
      ]
    },

    gdp: {
      rate: 4.6,
      trend: [
        4.2,
        4.5,
        4.8,
        4.9,
        5.0,
        4.7,
        4.6,
        4.5,
        4.6,
        4.7
      ]
    },

    unemployment: {
      rate: 5.4,
      trend: [
        6.2,
        6.0,
        5.9,
        5.8,
        5.7,
        5.6,
        5.5,
        5.5,
        5.4,
        5.4
      ]
    }
  },

  Uganda: {
    inflation: {
      rate: 3.5,
      trend: [
        3.8,
        3.6,
        3.4,
        3.2,
        3.3,
        3.5,
        3.6,
        3.5,
        3.4,
        3.5,
        3.5,
        3.5
      ]
    },

    gdp: {
      rate: 6.1,
      trend: [
        4.5,
        4.8,
        5.0,
        5.4,
        5.6,
        5.8,
        6.0,
        6.1,
        6.1,
        6.1
      ]
    },

    unemployment: {
      rate: 3.4,
      trend: [
        3.9,
        3.7,
        3.5,
        3.4,
        3.4,
        3.4,
        3.4,
        3.4,
        3.4,
        3.4
      ]
    }
  },

  Tanzania: {
    inflation: {
      rate: 3.1,
      trend: [
        3.5,
        3.4,
        3.3,
        3.2,
        3.1,
        3.0,
        3.1,
        3.2,
        3.1,
        3.0,
        3.1,
        3.1
      ]
    },

    gdp: {
      rate: 5.8,
      trend: [
        4.8,
        5.0,
        5.1,
        5.2,
        5.3,
        5.4,
        5.5,
        5.6,
        5.7,
        5.8
      ]
    },

    unemployment: {
      rate: 2.6,
      trend: [
        3.1,
        2.9,
        2.7,
        2.6,
        2.6,
        2.6,
        2.6,
        2.6,
        2.6,
        2.6
      ]
    }
  },

  Rwanda: {
    inflation: {
      rate: 4.8,
      trend: [
        5.2,
        5.0,
        4.9,
        4.8,
        4.7,
        4.8,
        4.9,
        4.8,
        4.7,
        4.8,
        4.8,
        4.8
      ]
    },

    gdp: {
      rate: 7.2,
      trend: [
        5.5,
        5.8,
        6.0,
        6.2,
        6.4,
        6.6,
        6.8,
        7.0,
        7.1,
        7.2
      ]
    },

    unemployment: {
      rate: 14.3,
      trend: [
        15.1,
        14.8,
        14.6,
        14.4,
        14.3,
        14.3,
        14.3,
        14.3,
        14.3,
        14.3
      ]
    }
  },

  Ethiopia: {
    inflation: {
      rate: 9.4,
      trend: [
        11.0,
        10.5,
        10.2,
        9.9,
        9.7,
        9.5,
        9.4,
        9.4,
        9.3,
        9.4,
        9.4,
        9.4
      ]
    },

    gdp: {
      rate: 6.5,
      trend: [
        5.2,
        5.4,
        5.7,
        5.9,
        6.0,
        6.1,
        6.2,
        6.3,
        6.4,
        6.5
      ]
    },

    unemployment: {
      rate: 3.4,
      trend: [
        3.8,
        3.6,
        3.5,
        3.4,
        3.4,
        3.4,
        3.4,
        3.4,
        3.4,
        3.4
      ]
    }
  }
};

// ----------------------------------------------------
// MONTHS
// ----------------------------------------------------

const months = [
  "2025-07",
  "2025-08",
  "2025-09",
  "2025-10",
  "2025-11",
  "2025-12",
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06"
];

// ----------------------------------------------------
// NEWS SOURCES
// ----------------------------------------------------

const rssFeeds = {
  Kenya: [
    "https://www.businessdailyafrica.com/feed",
    "https://nation.africa/kenya/business/rss.xml",
    "https://www.the-star.co.ke/rss"
  ],

  Uganda: [
    "https://www.monitor.co.ug/Uganda/Business/rss",
    "https://businessfocus.co.ug/feed"
  ],

  Tanzania: [
    "https://www.thecitizen.co.tz/feed",
    "https://dailynews.co.tz/feed"
  ],

  Rwanda: [
    "https://www.newtimes.co.rw/feed"
  ],

  Ethiopia: [
    "https://addisfortune.news/feed",
    "https://www.thereporterethiopia.com/feed"
  ]
};

// ----------------------------------------------------
// HEALTH CHECK
// ----------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    status: "operational",
    service: "NexusEconomics API",
    version: "3.0",
    timestamp: new Date().toISOString()
  });
});

// ----------------------------------------------------
// INFLATION
// ----------------------------------------------------

app.get("/api/inflation/:country", (req, res) => {
  const country = req.params.country;

  const data = countryData[country];

  if (!data) {
    return res.status(404).json({
      error: "Country not found"
    });
  }

  const observations = data.inflation.trend.map(
    (value, index) => ({
      date: months[index],
      value: value.toString()
    })
  );

  res.json({
    country,
    latestRate: data.inflation.rate,
    observations
  });
});

// ----------------------------------------------------
// GDP
// ----------------------------------------------------

app.get("/api/gdp/:country", (req, res) => {
  const country = req.params.country;

  const data = countryData[country];

  if (!data) {
    return res.status(404).json({
      error: "Country not found"
    });
  }

  const observations = data.gdp.trend.map(
    (value, index) => ({
      year: String(2017 + index),
      value
    })
  );

  res.json({
    country,
    latestRate: data.gdp.rate,
    observations
  });
});

// ----------------------------------------------------
// UNEMPLOYMENT
// ----------------------------------------------------

app.get("/api/unemployment/:country", (req, res) => {
  const country = req.params.country;

  const data = countryData[country];

  if (!data) {
    return res.status(404).json({
      error: "Country not found"
    });
  }

  const observations =
    data.unemployment.trend.map(
      (value, index) => ({
        year: String(2017 + index),
        value
      })
    );

  res.json({
    country,
    latestRate: data.unemployment.rate,
    observations
  });
});

// ----------------------------------------------------
// ECONOMIC SUMMARY
// ----------------------------------------------------

app.get("/api/economy/:country", (req, res) => {
  const country = req.params.country;

  const data = countryData[country];

  if (!data) {
    return res.status(404).json({
      error: "Country not found"
    });
  }

  res.json({
    country,

    inflation: data.inflation.rate,

    gdpGrowth: data.gdp.rate,

    unemployment: data.unemployment.rate
  });
});

// ----------------------------------------------------
// EXCHANGE RATES
// ----------------------------------------------------

app.get("/api/exchange", async (req, res) => {
  try {
    if (!EXCHANGE_API_KEY) {
      return res.status(500).json({
        error: "Exchange API key is missing"
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
      "Exchange API error:",
      error.message
    );

    res.status(500).json({
      error: "Failed to fetch exchange rate data"
    });
  }
});

// ----------------------------------------------------
// NEWS
// ----------------------------------------------------

app.get("/api/news", async (req, res) => {
  const country =
    req.query.country || "Kenya";

  const feeds =
    rssFeeds[country] || rssFeeds.Kenya;

  const parser = new xml2js.Parser({
    explicitArray: false,
    trim: true
  });

  const articles = [];

  for (const feedUrl of feeds) {
    try {
      console.log(
        `Fetching news feed: ${feedUrl}`
      );

      const response = await axios.get(
        feedUrl,
        {
          timeout: 10000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
            Accept:
              "application/rss+xml, application/xml, text/xml, */*"
          }
        }
      );

      const result =
        await parser.parseStringPromise(
          response.data
        );

      // ------------------------------------------
      // RSS FORMAT
      // ------------------------------------------

      let items =
        result?.rss?.channel?.item;

      if (items) {
        if (!Array.isArray(items)) {
          items = [items];
        }

        items.forEach((item) => {
          const title =
            typeof item.title === "string"
              ? item.title
              : item.title?._ || "";

          const link =
            typeof item.link === "string"
              ? item.link
              : item.link?._ || "";

          const description =
            typeof item.description ===
            "string"
              ? item.description
              : item.description?._ || "";

          if (title && link) {
            articles.push({
              title: cleanText(title),

              description:
                cleanText(description).slice(
                  0,
                  180
                ),

              url: link,

              country,

              source: feedUrl,

              published:
                item.pubDate ||
                item["dc:date"] ||
                ""
            });
          }
        });
      }

      // ------------------------------------------
      // ATOM FORMAT
      // ------------------------------------------

      let atomEntries =
        result?.feed?.entry;

      if (atomEntries) {
        if (!Array.isArray(atomEntries)) {
          atomEntries = [atomEntries];
        }

        atomEntries.forEach((entry) => {
          const title =
            typeof entry.title === "string"
              ? entry.title
              : entry.title?._ || "";

          let link = "";

          if (Array.isArray(entry.link)) {
            const alternate =
              entry.link.find(
                (l) =>
                  l.$?.rel ===
                  "alternate"
              );

            link =
              alternate?.$?.href ||
              entry.link[0]?.$?.href ||
              "";
          } else {
            link =
              entry.link?.$?.href ||
              "";
          }

          const summary =
            typeof entry.summary ===
            "string"
              ? entry.summary
              : entry.summary?._ || "";

          if (title && link) {
            articles.push({
              title: cleanText(title),

              description:
                cleanText(summary).slice(
                  0,
                  180
                ),

              url: link,

              country,

              source: feedUrl,

              published:
                entry.updated ||
                entry.published ||
                ""
            });
          }
        });
      }

      console.log(
        `Loaded news from ${feedUrl}`
      );
    } catch (feedError) {
      console.error(
        `News feed failed: ${feedUrl}`,
        feedError.message
      );
    }
  }

  // ------------------------------------------
  // CLEAN + REMOVE DUPLICATES
  // ------------------------------------------

  const uniqueArticles =
    articles.filter(
      (article, index, self) =>
        index ===
        self.findIndex(
          (item) =>
            item.title ===
            article.title
        )
    );

  // ------------------------------------------
  // SORT BY DATE
  // ------------------------------------------

  uniqueArticles.sort(
    (a, b) =>
      new Date(b.published || 0) -
      new Date(a.published || 0)
  );

  // ------------------------------------------
  // FALLBACK NEWS
  // ------------------------------------------

  if (uniqueArticles.length === 0) {
    return res.json({
      country,

      articles: [
        {
          title: `${country} economic news service is currently updating`,
          description:
            "Live economic news feeds are temporarily unavailable. Please refresh the dashboard shortly.",
          url: "#",
          country,
          source: "NexusEconomics"
        }
      ]
    });
  }

  res.json({
    country,

    articles:
      uniqueArticles.slice(0, 8)
  });
});

// ----------------------------------------------------
// CLEAN TEXT HELPER
// ----------------------------------------------------

function cleanText(text) {
  if (!text) return "";

  return String(text)
    .replace(/<!\[CDATA\[/g, "")
    .replace(/\]\]>/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// ----------------------------------------------------
// AI ECONOMIC REPORT
// ----------------------------------------------------

app.post("/api/report", async (req, res) => {
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
        error: "Claude API key is missing"
      });
    }

    const response =
      await axios.post(
        "https://api.anthropic.com/v1/messages",

        {
          model:
            "claude-haiku-4-5-20251001",

          max_tokens: 1024,

          messages: [
            {
              role: "user",

              content: `
You are a senior economist specializing in African economies.

Prepare a concise economic intelligence brief for ${country}.

Current indicators:

Inflation: ${inflation}%

USD/KES: ${exchangeKES}

USD/UGX: ${exchangeUGX}

Unemployment: ${unemployment}%

Write exactly three professional paragraphs.

Paragraph 1:
Explain the current economic situation using the actual figures.

Paragraph 2:
Discuss the main risks and opportunities affecting businesses, investors, households and trade.

Paragraph 3:
Provide a short-term economic outlook and practical recommendations.

Do not invent statistics.

Do not use bullet points.

Do not use headings.

Write naturally and professionally.
`
            }
          ]
        },

        {
          headers: {
            "Content-Type":
              "application/json",

            "x-api-key":
              CLAUDE_API_KEY,

            "anthropic-version":
              "2023-06-01"
          },

          timeout: 30000
        }
      );

    const report =
      response.data?.content?.[0]?.text;

    res.json({
      report:
        report ||
        "The AI report could not be generated."
    });
  } catch (error) {
    console.error(
      "Claude API error:",
      error.response?.data ||
        error.message
    );

    res.status(500).json({
      error:
        "Failed to generate economic report"
    });
  }
});

// ----------------------------------------------------
// FRONTEND ROUTING
// ----------------------------------------------------

app.get("*", (req, res) => {
  res.sendFile(
    path.join(
      frontendPath,
      "index.html"
    )
  );
});

// ----------------------------------------------------
// SERVER
// ----------------------------------------------------

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `NexusEconomics API running on port ${PORT}`
    );
  }
);