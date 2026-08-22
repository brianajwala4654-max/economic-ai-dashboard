import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import jsPDF from "jspdf";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

import {
  getInflationData,
  getExchangeRate,
  getNews,
  getEconomicIndicators,
} from "./api";

const BACKEND_URL = "https://nexus-economics.onrender.com";

const countries = {
  Kenya: {
    flag: "🇰🇪",
    currency: "KES",
    currencyName: "Kenyan Shilling",
  },

  Uganda: {
    flag: "🇺🇬",
    currency: "UGX",
    currencyName: "Ugandan Shilling",
  },

  Tanzania: {
    flag: "🇹🇿",
    currency: "TZS",
    currencyName: "Tanzanian Shilling",
  },

  Rwanda: {
    flag: "🇷🇼",
    currency: "RWF",
    currencyName: "Rwandan Franc",
  },

  Ethiopia: {
    flag: "🇪🇹",
    currency: "ETB",
    currencyName: "Ethiopian Birr",
  },
};

const styles = {
  app: {
    display: "flex",
    width: "100%",
    minHeight: "100vh",
    fontFamily: "'Segoe UI', sans-serif",
    backgroundColor: "#0f172a",
    overflowX: "hidden",
    boxSizing: "border-box",
  },

  sidebar: {
    width: "250px",
    minWidth: "250px",
    flexShrink: 0,
    backgroundColor: "#1e293b",
    color: "white",
    padding: "28px 18px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    borderRight: "1px solid #334155",
    boxSizing: "border-box",
  },

  logo: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#38bdf8",
    marginBottom: "30px",
    whiteSpace: "nowrap",
  },

  logoSub: {
    display: "block",
    fontSize: "11px",
    color: "#64748b",
    marginTop: "4px",
    fontWeight: "500",
  },

  navItem: {
    padding: "13px 15px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minHeight: "46px",
    boxSizing: "border-box",
    userSelect: "none",
  },

  navActive: {
    backgroundColor: "#0ea5e9",
    color: "white",
  },

  main: {
    flex: 1,
    minWidth: 0,
    width: "calc(100% - 250px)",
    padding: "38px",
    overflowY: "auto",
    overflowX: "hidden",
    boxSizing: "border-box",
  },

  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "white",
    margin: "0 0 6px",
    lineHeight: "1.2",
  },

  subtitle: {
    color: "#64748b",
    fontSize: "14px",
    margin: 0,
    lineHeight: "1.5",
  },

  badge: {
    display: "inline-block",
    marginTop: "12px",
    padding: "5px 12px",
    borderRadius: "20px",
    backgroundColor: "#082f49",
    color: "#38bdf8",
    border: "1px solid #075985",
    fontSize: "12px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))",
    gap: "18px",
    marginTop: "26px",
    marginBottom: "25px",
    minWidth: 0,
  },

  card: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "22px",
    minWidth: 0,
    boxSizing: "border-box",
  },

  cardLabel: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color: "#64748b",
    marginBottom: "8px",
  },

  cardValue: {
    fontSize: "29px",
    fontWeight: "700",
    color: "white",
    overflowWrap: "break-word",
  },

  cardSub: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "6px",
  },

  trend: {
    marginTop: "9px",
    fontSize: "12px",
    color: "#22c55e",
  },

  section: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "16px",
    padding: "25px",
    marginBottom: "22px",
    minWidth: 0,
    boxSizing: "border-box",
    overflow: "hidden",
  },

  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "white",
    marginBottom: "20px",
  },

  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "22px",
    minWidth: 0,
  },

  button: {
    backgroundColor: "#0ea5e9",
    border: "none",
    color: "white",
    padding: "11px 20px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "600",
    boxSizing: "border-box",
  },

  greenButton: {
    backgroundColor: "#059669",
    border: "none",
    color: "white",
    padding: "11px 20px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "600",
    boxSizing: "border-box",
  },

  darkButton: {
    backgroundColor: "#334155",
    border: "none",
    color: "white",
    padding: "11px 18px",
    borderRadius: "9px",
    cursor: "pointer",
    boxSizing: "border-box",
  },

  select: {
    width: "100%",
    maxWidth: "100%",
    backgroundColor: "#0f172a",
    color: "white",
    border: "1px solid #334155",
    borderRadius: "9px",
    padding: "12px",
    marginTop: "8px",
    boxSizing: "border-box",
  },

  report: {
    backgroundColor: "#0f172a",
    borderRadius: "12px",
    padding: "20px",
    color: "#cbd5e1",
    lineHeight: "1.8",
    marginTop: "20px",
    whiteSpace: "pre-line",
    overflowWrap: "break-word",
    wordBreak: "break-word",
  },

  footer: {
    textAlign: "center",
    color: "#475569",
    fontSize: "12px",
    padding: "20px",
    lineHeight: "1.6",
  },
};

function formatValue(value, decimals = 1) {
  if (
    value === null ||
    value === undefined ||
    Number.isNaN(Number(value))
  ) {
    return "...";
  }

  return Number(value).toFixed(decimals);
}

function latestValue(data) {
  if (!data || data.length === 0) {
    return null;
  }

  return data[data.length - 1]?.value;
}

function prepareSeries(data) {
  if (!Array.isArray(data)) return [];

  return data.map((item) => ({
    year: item.year || item.date,
    value: Number(item.value),
  }));
}

export default function App() {
  const [activeNav, setActiveNav] = useState("Dashboard");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [country, setCountry] = useState("Kenya");

  const [inflationData, setInflationData] = useState([]);

  const [economicData, setEconomicData] = useState({
    gdpGrowth: [],
    unemployment: [],
    inflation: [],
  });

  const [exchangeRate, setExchangeRate] = useState(null);

  const [news, setNews] = useState([]);

  const [loading, setLoading] = useState(true);

  const [reportLoading, setReportLoading] = useState(false);

  const [report, setReport] = useState("");

  const [autoRefresh, setAutoRefresh] = useState(false);

  const [lastUpdated, setLastUpdated] = useState(null);

  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.innerWidth <= 768
  );

  const selected = countries[country];

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth <= 768;

      setIsMobile(mobile);

      if (!mobile) {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);

    handleResize();

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  useEffect(() => {
    loadData();
  }, [country]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(
      loadData,
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [autoRefresh, country]);

  async function loadData() {
    setLoading(true);

    try {
      const [
        inflation,
        exchange,
        newsData,
        indicators,
      ] = await Promise.all([
        getInflationData(country),
        getExchangeRate(),
        getNews(country),
        getEconomicIndicators(country),
      ]);

      setInflationData(
        Array.isArray(inflation)
          ? inflation
          : []
      );

      setExchangeRate(exchange || {});

      setNews(
        Array.isArray(newsData)
          ? newsData
          : []
      );

      setEconomicData(
        indicators || {
          gdpGrowth: [],
          unemployment: [],
          inflation: [],
        }
      );

      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        "NexusEconomics error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  const gdpSeries = prepareSeries(
    economicData.gdpGrowth
  );

  const unemploymentSeries =
    prepareSeries(
      economicData.unemployment
    );

  const worldBankInflation =
    prepareSeries(
      economicData.inflation
    );

  const backendInflation =
    inflationData.map((item) => ({
      year: item.date,
      value: Number(item.value),
    }));

  const currentGDP =
    latestValue(gdpSeries);

  const currentUnemployment =
    latestValue(unemploymentSeries);

  const currentInflation =
    latestValue(worldBankInflation) ??
    latestValue(backendInflation);

  const currentFX =
    exchangeRate?.[selected.currency];

  function downloadPDF() {
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(14, 165, 233);

    doc.text(
      "NexusEconomics",
      20,
      22
    );

    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);

    doc.text(
      "Economic Intelligence Report",
      20,
      31
    );

    doc.text(
      `Country: ${country}`,
      20,
      40
    );

    doc.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      20,
      47
    );

    doc.line(
      20,
      53,
      190,
      53
    );

    doc.setTextColor(
      30,
      30,
      30
    );

    doc.setFontSize(14);

    doc.text(
      "Economic Indicators",
      20,
      65
    );

    doc.setFontSize(11);

    doc.text(
      `Inflation: ${formatValue(
        currentInflation
      )}%`,
      20,
      77
    );

    doc.text(
      `GDP Growth: ${formatValue(
        currentGDP
      )}%`,
      20,
      87
    );

    doc.text(
      `Unemployment: ${formatValue(
        currentUnemployment
      )}%`,
      20,
      97
    );

    doc.text(
      `USD/${selected.currency}: ${formatValue(
        currentFX,
        selected.currency === "UGX" ||
          selected.currency === "TZS"
          ? 0
          : 2
      )}`,
      20,
      107
    );

    if (report) {
      doc.line(
        20,
        115,
        190,
        115
      );

      doc.setFontSize(14);

      doc.text(
        "AI Economic Analysis",
        20,
        128
      );

      doc.setFontSize(10);

      const lines =
        doc.splitTextToSize(
          report,
          170
        );

      doc.text(
        lines,
        20,
        139
      );
    }

    doc.save(
      `NexusEconomics_${country}_Report.pdf`
    );
  }

  async function generateReport() {
    setReportLoading(true);
    setReport("");

    try {
      const response =
        await fetch(
          `${BACKEND_URL}/api/report`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              country,

              inflation:
                formatValue(
                  currentInflation
                ),

              gdpGrowth:
                formatValue(
                  currentGDP
                ),

              unemployment:
                formatValue(
                  currentUnemployment
                ),

              exchangeRate:
                formatValue(
                  currentFX,
                  selected.currency ===
                    "UGX" ||
                    selected.currency ===
                      "TZS"
                    ? 0
                    : 2
                ),
            }),
          }
        );

      const data =
        await response.json();

      setReport(
        data.report ||
          "The AI report could not be generated."
      );
    } catch (error) {
      console.error(error);

      setReport(
        "Unable to connect to the AI reporting service."
      );
    } finally {
      setReportLoading(false);
    }
  }

  function Dashboard() {
    return (
      <>
        <h1 style={styles.title}>
          Economic Dashboard
        </h1>

        <p style={styles.subtitle}>
          Real-time economic intelligence
          for East Africa
        </p>

        <span style={styles.badge}>
          🟢 Live Economic Data
        </span>

        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginTop: "18px",
          }}
        >
          {Object.keys(countries).map(
            (item) => (
              <button
                key={item}
                onClick={() => {
                  setCountry(item);
                  setReport("");
                }}
                style={{
                  ...styles.darkButton,
                  backgroundColor:
                    country === item
                      ? "#0ea5e9"
                      : "#1e293b",
                }}
              >
                {countries[item].flag}{" "}
                {item}
              </button>
            )
          )}
        </div>

        {loading ? (
          <p
            style={{
              color: "#64748b",
              marginTop: "40px",
            }}
          >
            Loading {country} economic
            intelligence...
          </p>
        ) : (
          <>
            <div
              style={{
                ...styles.grid,
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "repeat(auto-fit,minmax(210px,1fr))",
              }}
            >
              <div style={styles.card}>
                <div style={styles.cardLabel}>
                  Inflation
                </div>

                <div style={styles.cardValue}>
                  {formatValue(
                    currentInflation
                  )}
                  %
                </div>

                <div style={styles.cardSub}>
                  Consumer price inflation
                </div>

                <div style={styles.trend}>
                  ● Latest available
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardLabel}>
                  GDP Growth
                </div>

                <div style={styles.cardValue}>
                  {formatValue(
                    currentGDP
                  )}
                  %
                </div>

                <div style={styles.cardSub}>
                  Annual GDP growth
                </div>

                <div style={styles.trend}>
                  ↑ Economic growth
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardLabel}>
                  Unemployment
                </div>

                <div style={styles.cardValue}>
                  {formatValue(
                    currentUnemployment
                  )}
                  %
                </div>

                <div style={styles.cardSub}>
                  National unemployment
                </div>

                <div
                  style={{
                    ...styles.trend,
                    color: "#f59e0b",
                  }}
                >
                  ● Latest available
                </div>
              </div>

              <div style={styles.card}>
                <div style={styles.cardLabel}>
                  USD /{" "}
                  {selected.currency}
                </div>

                <div style={styles.cardValue}>
                  {formatValue(
                    currentFX,
                    selected.currency ===
                      "UGX" ||
                      selected.currency ===
                        "TZS"
                      ? 0
                      : 2
                  )}
                </div>

                <div style={styles.cardSub}>
                  {selected.currencyName}
                </div>

                <div style={styles.trend}>
                  ● Live FX
                </div>
              </div>
            </div>

            {lastUpdated && (
              <p
                style={{
                  color: "#64748b",
                  fontSize: "12px",
                  marginBottom: "20px",
                }}
              >
                Last updated:{" "}
                {lastUpdated.toLocaleString()}
              </p>
            )}

            <div
              style={{
                ...styles.twoCol,
                gridTemplateColumns: isMobile
                  ? "1fr"
                  : "1fr 1fr",
              }}
            >
              <div style={styles.section}>
                <div
                  style={styles.sectionTitle}
                >
                  📈 GDP Growth Trend
                </div>

                <div
                  style={{
                    height: isMobile
                      ? "240px"
                      : "280px",
                    minWidth: 0,
                  }}
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={gdpSeries}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#334155"
                      />

                      <XAxis
                        dataKey="year"
                        stroke="#64748b"
                      />

                      <YAxis
                        stroke="#64748b"
                      />

                      <Tooltip />

                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#22c55e"
                        strokeWidth={3}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={styles.section}>
                <div
                  style={styles.sectionTitle}
                >
                  📊 Inflation Trend
                </div>

                <div
                  style={{
                    height: isMobile
                      ? "240px"
                      : "280px",
                    minWidth: 0,
                  }}
                >
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <AreaChart
                      data={
                        worldBankInflation
                      }
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#334155"
                      />

                      <XAxis
                        dataKey="year"
                        stroke="#64748b"
                      />

                      <YAxis
                        stroke="#64748b"
                      />

                      <Tooltip />

                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#38bdf8"
                        fill="#38bdf8"
                        fillOpacity={0.12}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <div
                style={styles.sectionTitle}
              >
                👷 Unemployment Trend
              </div>

              <div
                style={{
                  height: isMobile
                    ? "250px"
                    : "300px",
                  minWidth: 0,
                }}
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={
                      unemploymentSeries
                    }
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#334155"
                    />

                    <XAxis
                      dataKey="year"
                      stroke="#64748b"
                    />

                    <YAxis
                      stroke="#64748b"
                    />

                    <Tooltip />

                    <Bar
                      dataKey="value"
                      fill="#818cf8"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={styles.section}>
              <div
                style={styles.sectionTitle}
              >
                📰 Latest {country} Economic News
              </div>

              {news.length > 0 ? (
                news.map(
                  (article, index) => (
                    <div
                      key={index}
                      style={{
                        padding:
                          "14px 0",
                        borderBottom:
                          "1px solid #334155",
                        minWidth: 0,
                      }}
                    >
                      <a
                        href={
                          article.url
                        }
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color:
                            "#38bdf8",
                          fontWeight:
                            "600",
                          textDecoration:
                            "none",
                          overflowWrap:
                            "break-word",
                        }}
                      >
                        {article.title}
                      </a>

                      <p
                        style={{
                          color:
                            "#64748b",
                          fontSize:
                            "13px",
                          overflowWrap:
                            "break-word",
                          wordBreak:
                            "break-word",
                        }}
                      >
                        {
                          article.description
                        }
                      </p>
                    </div>
                  )
                )
              ) : (
                <p
                  style={{
                    color:
                      "#64748b",
                  }}
                >
                  No news available.
                </p>
              )}
            </div>
          </>
        )}
      </>
    );
  }

  function Analytics() {
    return (
      <>
        <h1 style={styles.title}>
          Analytics
        </h1>

        <p style={styles.subtitle}>
          Deeper analysis of{" "}
          {country}'s economic indicators
        </p>

        <div
          style={{
            ...styles.grid,
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit,minmax(210px,1fr))",
          }}
        >
          <div style={styles.card}>
            <div style={styles.cardLabel}>
              GDP Growth
            </div>

            <div style={styles.cardValue}>
              {formatValue(
                currentGDP
              )}
              %
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardLabel}>
              Inflation
            </div>

            <div style={styles.cardValue}>
              {formatValue(
                currentInflation
              )}
              %
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardLabel}>
              Unemployment
            </div>

            <div style={styles.cardValue}>
              {formatValue(
                currentUnemployment
              )}
              %
            </div>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            📈 GDP Growth Analysis
          </div>

          <div
            style={{
              height: isMobile
                ? "260px"
                : "350px",
              minWidth: 0,
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={gdpSeries}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                />

                <XAxis
                  dataKey="year"
                  stroke="#64748b"
                />

                <YAxis
                  stroke="#64748b"
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#22c55e"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            📊 Inflation Analysis
          </div>

          <div
            style={{
              height: isMobile
                ? "260px"
                : "350px",
              minWidth: 0,
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <AreaChart
                data={
                  worldBankInflation
                }
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                />

                <XAxis
                  dataKey="year"
                  stroke="#64748b"
                />

                <YAxis
                  stroke="#64748b"
                />

                <Tooltip />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#38bdf8"
                  fill="#38bdf8"
                  fillOpacity={0.12}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>
    );
  }

  function GlobalMarkets() {
    const currencies = [
      ["KES", "🇰🇪", "Kenya"],
      ["UGX", "🇺🇬", "Uganda"],
      ["TZS", "🇹🇿", "Tanzania"],
      ["RWF", "🇷🇼", "Rwanda"],
      ["ETB", "🇪🇹", "Ethiopia"],
    ];

    return (
      <>
        <h1 style={styles.title}>
          Global Markets
        </h1>

        <p style={styles.subtitle}>
          East African foreign exchange
          intelligence
        </p>

        <div
          style={{
            marginTop: "20px",
            marginBottom: "20px",
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span style={styles.badge}>
            🟢 Live FX Data
          </span>

          <button
            onClick={loadData}
            style={styles.button}
          >
            🔄 Refresh Markets
          </button>
        </div>

        <div
          style={{
            ...styles.grid,
            gridTemplateColumns: isMobile
              ? "1fr"
              : "repeat(auto-fit,minmax(210px,1fr))",
          }}
        >
          {currencies.map(
            ([code, flag, name]) => (
              <div
                key={code}
                style={styles.card}
              >
                <div
                  style={{
                    fontSize: "26px",
                  }}
                >
                  {flag}
                </div>

                <div
                  style={{
                    ...styles.cardLabel,
                    marginTop: "15px",
                  }}
                >
                  USD / {code}
                </div>

                <div
                  style={styles.cardValue}
                >
                  {formatValue(
                    exchangeRate?.[
                      code
                    ],
                    code === "UGX" ||
                      code === "TZS"
                      ? 0
                      : 2
                  )}
                </div>

                <div
                  style={styles.cardSub}
                >
                  {name}
                </div>
              </div>
            )
          )}
        </div>

        <div style={styles.section}>
          <div
            style={styles.sectionTitle}
          >
            🌍 Currency Comparison
          </div>

          <div
            style={{
              height: isMobile
                ? "280px"
                : "350px",
              minWidth: 0,
            }}
          >
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={currencies.map(
                  ([code]) => ({
                    currency: code,
                    rate: Number(
                      exchangeRate?.[
                        code
                      ] || 0
                    ),
                  })
                )}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                />

                <XAxis
                  dataKey="currency"
                  stroke="#64748b"
                />

                <YAxis
                  stroke="#64748b"
                />

                <Tooltip />

                <Bar
                  dataKey="rate"
                  fill="#38bdf8"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>
    );
  }

  function AIReports() {
    return (
      <>
        <h1 style={styles.title}>
          AI Reports
        </h1>

        <p style={styles.subtitle}>
          AI-powered economic intelligence
        </p>

        <div style={styles.section}>
          <div
            style={styles.sectionTitle}
          >
            🤖 Generate Economic Report
          </div>

          <p
            style={{
              color: "#94a3b8",
              lineHeight: "1.7",
            }}
          >
            Generate an economic assessment
            using the latest available
            indicators for {country}.
          </p>

          <select
            value={country}
            onChange={(e) => {
              setCountry(
                e.target.value
              );
              setReport("");
            }}
            style={styles.select}
          >
            {Object.keys(countries).map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {countries[item].flag}{" "}
                  {item}
                </option>
              )
            )}
          </select>

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={generateReport}
              disabled={
                reportLoading
              }
              style={styles.button}
            >
              {reportLoading
                ? "⏳ Generating..."
                : "🤖 Generate AI Report"}
            </button>

            {report && (
              <button
                onClick={downloadPDF}
                style={
                  styles.greenButton
                }
              >
                ⬇ Download PDF
              </button>
            )}
          </div>

          {report && (
            <div style={styles.report}>
              {report}
            </div>
          )}
        </div>
      </>
    );
  }

  function Settings() {
    return (
      <>
        <h1 style={styles.title}>
          Settings
        </h1>

        <p style={styles.subtitle}>
          Manage NexusEconomics preferences
        </p>

        <div style={styles.section}>
          <div
            style={styles.sectionTitle}
          >
            🌍 Default Country
          </div>

          <select
            value={country}
            onChange={(e) =>
              setCountry(
                e.target.value
              )
            }
            style={styles.select}
          >
            {Object.keys(countries).map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {countries[item].flag}{" "}
                  {item}
                </option>
              )
            )}
          </select>
        </div>

        <div style={styles.section}>
          <div
            style={styles.sectionTitle}
          >
            🔄 Automatic Data Refresh
          </div>

          <p
            style={{
              color: "#64748b",
            }}
          >
            Refresh economic data every
            five minutes.
          </p>

          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() =>
                setAutoRefresh(
                  !autoRefresh
                )
              }
              style={
                autoRefresh
                  ? styles.greenButton
                  : styles.button
              }
            >
              {autoRefresh
                ? "✓ Auto Refresh Enabled"
                : "Enable Auto Refresh"}
            </button>

            <button
              onClick={loadData}
              style={
                styles.darkButton
              }
            >
              🔄 Refresh Now
            </button>
          </div>
        </div>

        <div style={styles.section}>
          <div
            style={styles.sectionTitle}
          >
            ℹ️ About NexusEconomics
          </div>

          <p
            style={{
              color: "#94a3b8",
              lineHeight: "1.8",
            }}
          >
            NexusEconomics is an
            AI-powered economic
            intelligence platform
            designed to monitor and
            analyze East African
            economies.
          </p>

          <p
            style={{
              color: "#64748b",
              fontSize: "13px",
            }}
          >
            Version 3.0 · Developed by
            Brian Otieno
          </p>
        </div>
      </>
    );
  }

  function renderPage() {
    if (activeNav === "Analytics") {
      return <Analytics />;
    }

    if (
      activeNav ===
      "Global Markets"
    ) {
      return <GlobalMarkets />;
    }

    if (
      activeNav === "AI Reports"
    ) {
      return <AIReports />;
    }

    if (
      activeNav === "Settings"
    ) {
      return <Settings />;
    }

    return <Dashboard />;
  }

  const navItems = [
    ["📊", "Dashboard"],
    ["📈", "Analytics"],
    ["🌍", "Global Markets"],
    ["🤖", "AI Reports"],
    ["⚙️", "Settings"],
  ];

  const sidebarStyle = isMobile
    ? {
        ...styles.sidebar,
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: "270px",
        minWidth: "270px",
        zIndex: 1000,
        padding: "28px 18px",
        transform: mobileMenuOpen
          ? "translateX(0)"
          : "translateX(-100%)",
        transition:
          "transform 0.3s ease",
        boxShadow: mobileMenuOpen
          ? "8px 0 30px rgba(0,0,0,0.35)"
          : "none",
      }
    : styles.sidebar;

  const mainStyle = isMobile
    ? {
        ...styles.main,
        width: "100%",
        padding: "82px 14px 22px",
      }
    : styles.main;

  return (
    <>
      <Helmet>
        <title>
          NexusEconomics —
          Economic Intelligence
        </title>

        <meta
          name="description"
          content="AI-powered economic intelligence platform for East Africa."
        />
      </Helmet>

      {/* MOBILE TOP BAR */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: "64px",
            backgroundColor: "#1e293b",
            borderBottom:
              "1px solid #334155",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            zIndex: 900,
            boxSizing: "border-box",
          }}
        >
          <button
            onClick={() =>
              setMobileMenuOpen(
                !mobileMenuOpen
              )
            }
            style={{
              background:
                "transparent",
              border: "none",
              color: "white",
              fontSize: "28px",
              cursor: "pointer",
              padding: "4px 8px",
              marginRight: "12px",
              lineHeight: 1,
            }}
            aria-label={
              mobileMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
          >
            {mobileMenuOpen
              ? "✕"
              : "☰"}
          </button>

          <div
            style={{
              color: "#38bdf8",
              fontSize: "20px",
              fontWeight: "800",
            }}
          >
            NexusEconomics
          </div>
        </div>
      )}

      {/* MOBILE DARK OVERLAY */}
      {isMobile && mobileMenuOpen && (
        <div
          onClick={() =>
            setMobileMenuOpen(false)
          }
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor:
              "rgba(0,0,0,0.55)",
            zIndex: 950,
          }}
        />
      )}

      <div style={styles.app}>
        {/* SIDEBAR / MOBILE DRAWER */}
        <aside style={sidebarStyle}>
          <div
            style={{
              ...styles.logo,
              marginBottom: "30px",
              textAlign: isMobile
                ? "left"
                : "left",
              width: "100%",
            }}
          >
            NexusEconomics

            <span
              style={
                styles.logoSub
              }
            >
              Economic Intelligence
              Platform
            </span>
          </div>

          {navItems.map(
            ([icon, label]) => (
              <div
                key={label}
                onClick={() => {
                  setActiveNav(label);

                  if (isMobile) {
                    setMobileMenuOpen(
                      false
                    );
                  }
                }}
                title={label}
                style={{
                  ...styles.navItem,

                  ...(activeNav ===
                  label
                    ? styles.navActive
                    : {}),
                }}
              >
                <span
                  style={{
                    fontSize: "20px",
                    width: "26px",
                    textAlign: "center",
                  }}
                >
                  {icon}
                </span>

                <span>
                  {label}
                </span>
              </div>
            )
          )}

          <div
            style={{
              marginTop: "auto",
              padding: "15px",
              backgroundColor:
                "#0f172a",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                color: "#64748b",
                fontSize: "11px",
              }}
            >
              SYSTEM STATUS
            </div>

            <div
              style={{
                color: "#22c55e",
                fontSize: "13px",
                marginTop: "5px",
              }}
            >
              ● Operational
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main style={mainStyle}>
          {renderPage()}

          <div style={styles.footer}>
            NexusEconomics v3.0 —
            East African Economic
            Intelligence · Developed by
            Brian Otieno
          </div>
        </main>
      </div>
    </>
  );
}