import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import jsPDF from "jspdf";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getInflationData, getExchangeRate, getNews } from "./api";

const BACKEND_URL = "https://nexus-economics.onrender.com";

const styles = {
  app: { display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif", backgroundColor: "#0f172a" },
  sidebar: { width: "260px", backgroundColor: "#1e293b", color: "white", padding: "30px 20px", display: "flex", flexDirection: "column", gap: "8px", borderRight: "1px solid #334155" },
  logo: { fontSize: "22px", fontWeight: "800", color: "#38bdf8", marginBottom: "30px", letterSpacing: "-0.5px" },
  logoSub: { fontSize: "11px", color: "#64748b", fontWeight: "400", display: "block", marginTop: "2px" },
  navItem: { padding: "12px 16px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", color: "#94a3b8", display: "flex", alignItems: "center", gap: "10px" },
  navItemActive: { backgroundColor: "#0ea5e9", color: "white" },
  main: { flex: 1, padding: "40px", overflowY: "auto" },
  headerTitle: { fontSize: "32px", fontWeight: "700", color: "white", margin: "0 0 6px 0" },
  headerSub: { color: "#64748b", fontSize: "14px", margin: 0 },
  badge: { display: "inline-block", backgroundColor: "#0ea5e910", color: "#38bdf8", border: "1px solid #0ea5e930", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", marginTop: "8px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "28px", marginTop: "28px" },
  card: { backgroundColor: "#1e293b", borderRadius: "16px", padding: "24px", border: "1px solid #334155" },
  cardLabel: { fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" },
  cardValue: { fontSize: "36px", fontWeight: "700", color: "white", margin: "0 0 4px 0" },
  cardSub: { fontSize: "12px", color: "#64748b" },
  cardTrend: { fontSize: "12px", color: "#22c55e", marginTop: "6px" },
  section: { backgroundColor: "#1e293b", borderRadius: "16px", padding: "28px", border: "1px solid #334155", marginBottom: "24px" },
  sectionTitle: { fontSize: "18px", fontWeight: "600", color: "white", marginBottom: "20px" },
  newsItem: { padding: "16px 0", borderBottom: "1px solid #334155" },
  newsLink: { color: "#38bdf8", fontWeight: "600", textDecoration: "none", fontSize: "14px" },
  newsDesc: { color: "#64748b", fontSize: "13px", marginTop: "6px" },
  btn: { backgroundColor: "#0ea5e9", color: "white", border: "none", padding: "12px 24px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "600" },
  btnGreen: { backgroundColor: "#059669", color: "white", border: "none", padding: "12px 24px", borderRadius: "10px", cursor: "pointer", fontSize: "14px", fontWeight: "600", marginLeft: "12px" },
  btnDisabled: { backgroundColor: "#1e3a4a", color: "#64748b", border: "none", padding: "12px 24px", borderRadius: "10px", cursor: "not-allowed", fontSize: "14px", fontWeight: "600" },
  report: { backgroundColor: "#0f172a", borderRadius: "12px", padding: "20px", marginTop: "20px", color: "#cbd5e1", lineHeight: "1.8", fontSize: "14px", whiteSpace: "pre-line" },
  riskGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  riskItem: { backgroundColor: "#0f172a", borderRadius: "10px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" },
  riskText: { color: "#cbd5e1", fontSize: "14px" },
  footer: { textAlign: "center", color: "#334155", fontSize: "13px", paddingTop: "20px", borderTop: "1px solid #1e293b", marginTop: "20px" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" },
  countryBtn: { padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "13px" },
};

export default function App() {
  const [inflationData, setInflationData] = useState([]);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [news, setNews] = useState([]);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [country, setCountry] = useState("Kenya");

  useEffect(() => {
    async function fetchData() {
      try {
        const [inflation, exchange, newsData] = await Promise.all([
          getInflationData(), getExchangeRate(), getNews(),
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

  const chartData = inflationData.slice().reverse().slice(-12).map((obs) => ({
    month: obs.date.slice(0, 7),
    inflation: parseFloat(obs.value),
  }));

  const exchangeChartData = exchangeRate ? [
    { currency: "KES", rate: exchangeRate.KES },
    { currency: "UGX", rate: exchangeRate.UGX / 10 },
    { currency: "TZS", rate: exchangeRate.TZS / 10 },
  ] : [];

  const unemploymentData = [
    { year: "2021", rate: 7.9 },
    { year: "2022", rate: 7.4 },
    { year: "2023", rate: 7.3 },
    { year: "2024", rate: 7.2 },
    { year: "2025", rate: 7.1 },
    { year: "2026", rate: 7.1 },
  ];

  const latestInflation = inflationData.length > 0
    ? parseFloat(inflationData[inflationData.length - 1].value).toFixed(1)
    : "...";

  const countryData = {
    Kenya: {
      flag: "🇰🇪",
      currency: "KES",
      currencyName: "Kenya Shilling",
      rate: exchangeRate ? exchangeRate.KES.toFixed(2) : "...",
      unemployment: "7.1%",
      risk: { inflation: "Medium", growth: "Low", currency: "Medium", energy: "High" },
    },
    Uganda: {
      flag: "🇺🇬",
      currency: "UGX",
      currencyName: "Uganda Shilling",
      rate: exchangeRate ? exchangeRate.UGX.toFixed(0) : "...",
      unemployment: "9.2%",
      risk: { inflation: "High", growth: "Medium", currency: "High", energy: "High" },
    },
  };

  const selected = countryData[country];

  async function generateReport() {
    setReportLoading(true);
    setReport("");
    try {
      const response = await fetch(`${BACKEND_URL}/api/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inflation: latestInflation,
          exchangeKES: exchangeRate?.KES?.toFixed(2),
          exchangeUGX: exchangeRate?.UGX?.toFixed(0),
          unemployment: country === "Kenya" ? "7.1" : "9.2",
        }),
      });
      const data = await response.json();
      setReport(data.report);
    } catch (error) {
      setReport("Error generating report. Please try again.");
    } finally {
      setReportLoading(false);
    }
  }

  function downloadPDF() {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(14, 165, 233);
    doc.text("NexusEconomics", 20, 22);
    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139);
    doc.text("AI-Powered Economic Intelligence Report", 20, 31);
    doc.text(`Country: ${country}   |   Generated: ${new Date().toLocaleDateString()}`, 20, 39);
    doc.setDrawColor(51, 65, 85);
    doc.line(20, 44, 190, 44);
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text("Economic Indicators", 20, 56);
    doc.setFontSize(11);
    doc.text(`Inflation (CPI):         ${latestInflation}`, 20, 68);
    doc.text(`Unemployment:            ${selected.unemployment}`, 20, 78);
    doc.text(`USD / ${selected.currency}:              ${selected.rate}`, 20, 88);
    doc.text(`USD / TZS:               ${exchangeRate ? exchangeRate.TZS.toFixed(0) : "N/A"}`, 20, 98);
    doc.line(20, 106, 190, 106);
    doc.setFontSize(14);
    doc.text("Risk Assessment", 20, 118);
    doc.setFontSize(11);
    doc.text(`Inflation Risk:     ${selected.risk.inflation}`, 20, 130);
    doc.text(`Growth Risk:        ${selected.risk.growth}`, 20, 140);
    doc.text(`Currency Risk:      ${selected.risk.currency}`, 20, 150);
    doc.text(`Energy Price Risk:  ${selected.risk.energy}`, 20, 160);
    doc.line(20, 168, 190, 168);
    if (report) {
      doc.setFontSize(14);
      doc.text("AI Economic Analysis", 20, 180);
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(report, 170);
      doc.text(lines, 20, 192);
    } else {
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text("No AI report generated yet. Click 'Generate AI Report' first.", 20, 180);
    }
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("NexusEconomics v2.0 — Live Economic Intelligence — Developed by Brian Otieno", 20, 285);
    doc.save(`NexusEconomics_${country}_Report.pdf`);
  }

  const navItems = [
    { icon: "📊", label: "Dashboard" },
    { icon: "📈", label: "Analytics" },
    { icon: "🌍", label: "Global Markets" },
    { icon: "🤖", label: "AI Reports" },
    { icon: "⚙️", label: "Settings" },
  ];

  const tooltipStyle = { contentStyle: { backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "white" } };

  return (
    <div style={styles.app}>
      <Helmet>
        <title>NexusEconomics - AI-Powered Economic Intelligence Platform</title>
        <meta name="description" content="NexusEconomics is a real-time AI-powered economic intelligence and forecasting platform tracking Kenya inflation, exchange rates, and African economic news." />
        <meta name="keywords" content="NexusEconomics, Kenya economy, economic intelligence, AI forecasting, inflation, exchange rate" />
      </Helmet>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          NexusEconomics
          <span style={styles.logoSub}>Economic Intelligence Platform</span>
        </div>
        {navItems.map((item) => (
          <div key={item.label} style={{ ...styles.navItem, ...(activeNav === item.label ? styles.navItemActive : {}) }} onClick={() => setActiveNav(item.label)}>
            {item.icon} {item.label}
          </div>
        ))}
        <div style={{ marginTop: "auto", padding: "16px", backgroundColor: "#0f172a", borderRadius: "12px" }}>
          <div style={{ fontSize: "12px", color: "#64748b" }}>Live Data Status</div>
          <div style={{ fontSize: "13px", color: "#22c55e", marginTop: "4px" }}>● All systems operational</div>
        </div>
      </div>

      {/* MAIN */}
      <div style={styles.main}>
        <div>
          <h1 style={styles.headerTitle}>Economic Dashboard</h1>
          <p style={styles.headerSub}>Real-time economic intelligence for Kenya & East Africa</p>
          <span style={styles.badge}>🔴 Live Data</span>

          {/* COUNTRY SELECTOR */}
          <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
            {["Kenya", "Uganda"].map((c) => (
              <button
                key={c}
                onClick={() => setCountry(c)}
                style={{
                  ...styles.countryBtn,
                  backgroundColor: country === c ? "#0ea5e9" : "#1e293b",
                  color: country === c ? "white" : "#64748b",
                }}
              >
                {countryData[c].flag} {c}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ color: "#64748b", fontSize: "16px", marginTop: "40px" }}>Loading live data...</div>
        ) : (
          <>
            {/* KPI CARDS */}
            <div style={styles.grid}>
              <div style={styles.card}>
                <div style={styles.cardLabel}>Inflation (CPI)</div>
                <div style={styles.cardValue}>{latestInflation}</div>
                <div style={styles.cardSub}>Latest CPI Index</div>
                <div style={styles.cardTrend}>↑ FRED Data</div>
              </div>
              <div style={styles.card}>
                <div style={styles.cardLabel}>Unemployment</div>
                <div style={styles.cardValue}>{selected.unemployment}</div>
                <div style={styles.cardSub}>{country} National Rate</div>
                <div style={{ ...styles.cardTrend, color: "#f59e0b" }}>→ Stable</div>
              </div>
              <div style={styles.card}>
                <div style={styles.cardLabel}>USD / {selected.currency}</div>
                <div style={styles.cardValue}>{selected.rate}</div>
                <div style={styles.cardSub}>{selected.currencyName}</div>
                <div style={styles.cardTrend}>↑ Live Rate</div>
              </div>
              <div style={styles.card}>
                <div style={styles.cardLabel}>USD / TZS</div>
                <div style={styles.cardValue}>{exchangeRate ? exchangeRate.TZS.toFixed(0) : "..."}</div>
                <div style={styles.cardSub}>Tanzania Shilling</div>
                <div style={styles.cardTrend}>↑ Live Rate</div>
              </div>
            </div>

            {/* TWO CHARTS */}
            <div style={styles.twoCol}>
              <div style={styles.section}>
                <div style={styles.sectionTitle}>📈 Inflation Trend (CPI)</div>
                <div style={{ height: "250px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                      <Tooltip {...tooltipStyle} />
                      <Line type="monotone" dataKey="inflation" stroke="#38bdf8" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div style={styles.section}>
                <div style={styles.sectionTitle}>💹 Unemployment Trend — {country}</div>
                <div style={{ height: "250px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={unemploymentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[6, 9]} />
                      <Tooltip {...tooltipStyle} />
                      <Bar dataKey="rate" fill="#818cf8" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* EXCHANGE RATE CHART */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>💱 East Africa Exchange Rates vs USD</div>
              <p style={{ color: "#64748b", fontSize: "12px", marginBottom: "16px" }}>UGX and TZS divided by 10 for scale comparison</p>
              <div style={{ height: "250px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={exchangeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="currency" stroke="#64748b" tick={{ fontSize: 13 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="rate" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* NEWS */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>📰 Latest {country} Economic News</div>
              {news.length > 0 ? news.map((article, index) => (
                <div key={index} style={styles.newsItem}>
                  <a href={article.url} target="_blank" rel="noreferrer" style={styles.newsLink}>{article.title}</a>
                  <p style={styles.newsDesc}>{article.description}</p>
                </div>
              )) : <p style={{ color: "#64748b" }}>No news available.</p>}
            </div>

            {/* AI REPORT */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>🤖 AI Economic Analysis — {country}</div>
              <p style={{ color: "#64748b", fontSize: "13px", marginBottom: "16px" }}>Powered by Claude AI — generates real-time economic insights from live data</p>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <button onClick={generateReport} disabled={reportLoading} style={reportLoading ? styles.btnDisabled : styles.btn}>
                  {reportLoading ? "⏳ Generating Report..." : "Generate AI Report"}
                </button>
                <button onClick={downloadPDF} style={styles.btnGreen}>
                  ⬇ Download PDF
                </button>
              </div>
              {report && <div style={styles.report}>{report}</div>}
            </div>

            {/* RISK MONITOR */}
            <div style={styles.section}>
              <div style={styles.sectionTitle}>⚠️ Economic Risk Monitor — {country}</div>
              <div style={styles.riskGrid}>
                <div style={styles.riskItem}><span style={{ fontSize: "20px" }}>{selected.risk.inflation === "High" ? "🔴" : "🟡"}</span><span style={styles.riskText}>Inflation Risk: <strong>{selected.risk.inflation}</strong></span></div>
                <div style={styles.riskItem}><span style={{ fontSize: "20px" }}>{selected.risk.growth === "Low" ? "🟢" : "🟡"}</span><span style={styles.riskText}>Growth Risk: <strong>{selected.risk.growth}</strong></span></div>
                <div style={styles.riskItem}><span style={{ fontSize: "20px" }}>{selected.risk.currency === "High" ? "🔴" : "🟡"}</span><span style={styles.riskText}>Currency Risk: <strong>{selected.risk.currency}</strong></span></div>
                <div style={styles.riskItem}><span style={{ fontSize: "20px" }}>🔴</span><span style={styles.riskText}>Energy Price Risk: <strong>{selected.risk.energy}</strong></span></div>
              </div>
            </div>

            <div style={styles.footer}>
              NexusEconomics v2.0 — Live Economic Intelligence · Developed by Brian Otieno
            </div>
          </>
        )}
      </div>
    </div>
  );
}