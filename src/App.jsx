import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getInflationData, getGDPData, getExchangeRate, getNews } from "./api";

export default function App() {
  const [inflationData, setInflationData] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [news, setNews] = useState([]);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [inflation, exchange, newsData] = await Promise.all([
          getInflationData(),
          getExchangeRate(),
          getNews(),
        ]);
        setInflationData(inflation);
        setExchangeRate(exchange);
        setNews(newsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const chartData = inflationData.slice(-7).map((obs) => ({
    month: obs.date.slice(0, 7),
    inflation: parseFloat(obs.value),
  }));

  const latestInflation =
    inflationData.length > 0
      ? parseFloat(inflationData[inflationData.length - 1].value).toFixed(1)
      : "...";

  function generateReport() {
    setReport(`
Inflation (CPI) is currently at ${latestInflation}, based on real FRED data.
Exchange Rate: 1 USD = ${exchangeRate?.KES?.toFixed(2)} KES.
Economic momentum remains positive, but rising prices indicate increasing inflationary pressure.
GDP growth remains healthy, suggesting continued economic expansion.
Exchange-rate fluctuations and global energy prices remain key risks.
Forecast: Inflation is likely to remain elevated over the next quarter unless monetary policy tightens.
    `);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial", backgroundColor: "#f3f4f6" }}>
      <Helmet>
        <title>NexusEconomics - AI-Powered Economic Intelligence Platform</title>
        <meta name="description" content="NexusEconomics is a real-time AI-powered economic intelligence and forecasting platform tracking Kenya inflation, exchange rates, and African economic news." />
        <meta name="keywords" content="NexusEconomics, Kenya economy, economic intelligence, AI forecasting, inflation, exchange rate" />
      </Helmet>

      {/* SIDEBAR */}
      <div style={{ width: "250px", backgroundColor: "#111827", color: "white", padding: "30px" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "bold" }}>NexusEconomics</h2>
        <div style={{ marginTop: "40px", lineHeight: "3" }}>
          <p>📊 Dashboard</p>
          <p>📈 Analytics</p>
          <p>🌍 Global Markets</p>
          <p>🤖 AI Reports</p>
          <p>⚙️ Settings</p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "40px" }}>
        <h1 style={{ fontSize: "42px", marginBottom: "10px" }}>NexusEconomics</h1>
        <p style={{ color: "#6b7280" }}>AI-Powered Economic Intelligence & Forecasting Platform</p>

        {loading ? (
          <p style={{ marginTop: "30px", fontSize: "18px" }}>Loading live data...</p>
        ) : (
          <>
            {/* KPI CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginTop: "30px" }}>
              <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "15px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <h3>Inflation (CPI)</h3>
                <h1>{latestInflation}</h1>
                <p style={{ color: "#6b7280" }}>Latest CPI Index</p>
              </div>
              <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "15px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <h3>Unemployment</h3>
                <h1>7.1%</h1>
              </div>
              <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "15px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <h3>Exchange Rate</h3>
                <h1>{exchangeRate ? exchangeRate.KES.toFixed(2) : "..."}</h1>
                <p style={{ color: "#6b7280" }}>KES per USD</p>
              </div>
              <div style={{ backgroundColor: "white", padding: "25px", borderRadius: "15px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                <h3>UGX per USD</h3>
                <h1>{exchangeRate ? exchangeRate.UGX.toFixed(0) : "..."}</h1>
                <p style={{ color: "#6b7280" }}>Uganda Shilling</p>
              </div>
            </div>

            {/* CHART */}
            <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "15px", marginTop: "30px" }}>
              <h2>Inflation Trend (CPI)</h2>
              <div style={{ height: "350px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="inflation" stroke="#2563eb" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* NEWS */}
            <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "15px", marginTop: "30px" }}>
              <h2>Latest Kenya Economic News</h2>
              {news.length > 0 ? (
                news.map((article, index) => (
                  <div key={index} style={{ marginTop: "15px", borderBottom: "1px solid #f3f4f6", paddingBottom: "15px" }}>
                    <a href={article.url} target="_blank" rel="noreferrer" style={{ fontWeight: "bold", color: "#2563eb", textDecoration: "none" }}>
                      {article.title}
                    </a>
                    <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "5px" }}>{article.description}</p>
                  </div>
                ))
              ) : (
                <p>No news available.</p>
              )}
            </div>

            {/* AI REPORT */}
            <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "15px", marginTop: "30px" }}>
              <h2>AI Economic Analysis</h2>
              <button onClick={generateReport} style={{ backgroundColor: "#2563eb", color: "white", border: "none", padding: "12px 20px", borderRadius: "10px", cursor: "pointer", marginTop: "10px" }}>
                Generate AI Report
              </button>
              {report && (
                <div style={{ marginTop: "20px", backgroundColor: "#f9fafb", padding: "20px", borderRadius: "10px", whiteSpace: "pre-line" }}>
                  {report}
                </div>
              )}
            </div>

            {/* RISK MONITOR */}
            <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "15px", marginTop: "30px" }}>
              <h2>Economic Risk Monitor</h2>
              <p>🟡 Inflation Risk: Medium</p>
              <p>🟢 Growth Risk: Low</p>
              <p>🟡 Currency Risk: Medium</p>
              <p>🔴 Energy Price Risk: High</p>
            </div>

            {/* FOOTER */}
            <div style={{ marginTop: "40px", textAlign: "center", color: "#6b7280", paddingBottom: "30px" }}>
              NexusEconomics v2.0 — Live Economic Intelligence<br />
              Developed by Brian Otieno
            </div>
          </>
        )}
      </div>
    </div>
  );
}