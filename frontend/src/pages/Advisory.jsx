import React, { useState } from "react";

const API = "https://agrisetu-fi4b.onrender.com/";

// Crop info shown without needing backend
const CROP_INFO = {
  rice:       { emoji: "🌾", tip: "High rainfall crop. Thrives in humid, warm conditions.", season: "Kharif (Jun–Nov)" },
  wheat:      { emoji: "🌿", tip: "Cool weather crop. Best sown in winter months.", season: "Rabi (Nov–Apr)" },
  maize:      { emoji: "🌽", tip: "Versatile crop. Moderate water needs, good for mixed farming.", season: "Kharif (Jun–Sep)" },
  cotton:     { emoji: "🌸", tip: "Warm climate crop. Requires deep well-drained soil.", season: "Kharif (May–Nov)" },
  sugarcane:  { emoji: "🎋", tip: "Long duration crop. High water requirement.", season: "Year-round" },
  potato:     { emoji: "🥔", tip: "Cool season crop. Needs well-drained loamy soil.", season: "Rabi (Oct–Mar)" },
  tomato:     { emoji: "🍅", tip: "Warm season crop. Needs consistent moisture.", season: "Year-round" },
  onion:      { emoji: "🧅", tip: "Moderate temperature crop. Well-drained sandy loam ideal.", season: "Rabi (Oct–Apr)" },
  banana:     { emoji: "🍌", tip: "Tropical crop. Needs high humidity and warmth.", season: "Year-round" },
  mango:      { emoji: "🥭", tip: "Fruit crop. Dry spell before flowering boosts yield.", season: "Summer" },
  mustard:    { emoji: "🌼", tip: "Cool season oilseed crop. Drought tolerant once established.", season: "Rabi (Oct–Mar)" },
  groundnut:  { emoji: "🥜", tip: "Legume crop. Fixes nitrogen. Light sandy loam preferred.", season: "Kharif (Jun–Oct)" },
  coffee:     { emoji: "☕", tip: "Plantation crop. Needs shade and high rainfall.", season: "Year-round" },
  jute:       { emoji: "🌿", tip: "Fiber crop. Thrives in alluvial soil with high rainfall.", season: "Kharif (Mar–Aug)" },
  coconut:    { emoji: "🥥", tip: "Coastal crop. Tolerates saline soil and high humidity.", season: "Year-round" },
};

const FIELDS = [
  { key: "nitrogen",    label: "Nitrogen (N)",   unit: "kg/ha", placeholder: "e.g. 90",  min: 0,   max: 300 },
  { key: "phosphorus",  label: "Phosphorus (P)", unit: "kg/ha", placeholder: "e.g. 42",  min: 0,   max: 150 },
  { key: "potassium",   label: "Potassium (K)",  unit: "kg/ha", placeholder: "e.g. 43",  min: 0,   max: 250 },
  { key: "temperature", label: "Temperature",    unit: "°C",    placeholder: "e.g. 25",  min: 5,   max: 45  },
  { key: "humidity",    label: "Humidity",       unit: "%",     placeholder: "e.g. 80",  min: 10,  max: 100 },
  { key: "ph",          label: "Soil pH",        unit: "",      placeholder: "e.g. 6.5", min: 3,   max: 10  },
  { key: "rainfall",    label: "Rainfall",       unit: "mm",    placeholder: "e.g. 200", min: 20,  max: 300 },
];

// Simple rule-based fallback when backend is not running
function getRuleBasedRecommendation(data) {
  const { temperature: t, rainfall: r, humidity: h, ph, nitrogen: n, phosphorus: p, potassium: k } = data;

  const scores = {
    rice:      (r > 150 ? 30 : 0) + (h > 75 ? 25 : 0) + (t > 22 && t < 28 ? 25 : 0) + (ph > 5.5 && ph < 7 ? 20 : 0),
    wheat:     (r < 100 ? 25 : 0) + (t > 10 && t < 20 ? 35 : 0) + (ph > 6 && ph < 7.5 ? 20 : 0) + (n > 80 ? 20 : 0),
    maize:     (t > 20 && t < 30 ? 30 : 0) + (r > 50 && r < 120 ? 25 : 0) + (h > 50 ? 20 : 0) + (ph > 5.5 ? 25 : 0),
    cotton:    (t > 25 ? 30 : 0) + (r < 100 ? 20 : 0) + (k > 50 ? 25 : 0) + (ph > 6 ? 25 : 0),
    sugarcane: (t > 24 && t < 32 ? 30 : 0) + (r > 150 ? 30 : 0) + (h > 65 ? 20 : 0) + (n > 100 ? 20 : 0),
    potato:    (t > 15 && t < 22 ? 35 : 0) + (h > 70 ? 25 : 0) + (ph < 6.5 ? 20 : 0) + (k > 80 ? 20 : 0),
    tomato:    (t > 20 && t < 28 ? 30 : 0) + (h > 60 ? 25 : 0) + (ph > 5.5 && ph < 7 ? 25 : 0) + (p > 40 ? 20 : 0),
    mustard:   (t > 10 && t < 20 ? 35 : 0) + (r < 60 ? 25 : 0) + (n > 60 ? 20 : 0) + (ph > 6 ? 20 : 0),
    groundnut: (t > 25 ? 30 : 0) + (r > 50 && r < 120 ? 25 : 0) + (ph < 7 ? 25 : 0) + (p > 40 ? 20 : 0),
    banana:    (t > 24 ? 30 : 0) + (h > 75 ? 30 : 0) + (r > 100 ? 25 : 0) + (k > 200 ? 15 : 0),
  };

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const total = sorted[0][1];

  return sorted.map(([crop, score]) => ({
    crop: crop.charAt(0).toUpperCase() + crop.slice(1),
    confidence: Math.min(99, Math.round((score / Math.max(total, 1)) * 85 + 10)),
    tip: CROP_INFO[crop]?.tip || "Suitable for your soil and climate conditions.",
  }));
}

export default function Advisory() {
  const [form, setForm] = useState({
    nitrogen: "", phosphorus: "", potassium: "",
    temperature: "", humidity: "", ph: "", rainfall: ""
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource]   = useState(""); // "api" or "local"

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const parsed = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, parseFloat(v)])
    );

    try {
      const res = await fetch(`${API}/predict`, {
  method: "POST",
  headers: { 
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  body: JSON.stringify(parsed),
});
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      setResult(data);
      setSource("api");
    } catch (err) {
      console.log("Backend error:", err.message);
      // Fallback to rule-based
      const recs = getRuleBasedRecommendation(parsed);
      setResult({
        top_recommendation: recs[0].crop,
        all_recommendations: recs,
      });
      setSource("local");
    } finally {
      setLoading(false);
    }
  };

  const topCrop = result?.top_recommendation?.toLowerCase();
  const cropInfo = CROP_INFO[topCrop] || {};

  return (
    <div>
      <h1 style={s.pageTitle}>🌱 Crop Advisory</h1>
      <p style={s.pageSub}>Enter your field data to get AI-powered crop recommendations with market prices</p>

      <div style={s.twoCol}>
        {/* ── Input Form ── */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Your Field Data</h2>
          <form onSubmit={handleSubmit}>
            {FIELDS.map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={s.label}>
                  {f.label}
                  {f.unit && <span style={s.unit}> ({f.unit})</span>}
                </label>
                <input
                  style={s.input}
                  type="number"
                  step="any"
                  min={f.min}
                  max={f.max}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  required
                />
              </div>
            ))}
            <button type="submit" style={s.btn} disabled={loading}>
              {loading ? "Analysing your field..." : "Get Crop Recommendation"}
            </button>
          </form>

          {/* Sample data button for quick demo */}
          <button style={s.sampleBtn} onClick={() => setForm({
            nitrogen: "90", phosphorus: "42", potassium: "43",
            temperature: "25", humidity: "82", ph: "6.5", rainfall: "202"
          })}>
            Fill sample data (Rice conditions)
          </button>
        </div>

        {/* ── Results ── */}
        <div>
          {!result && (
            <div style={s.emptyState}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🌾</div>
              <p style={{ color: "#888", fontSize: 15 }}>Fill in your field data and click the button to get your personalised crop recommendation</p>
            </div>
          )}

          {result && (
            <>
              {/* Source badge */}
              {source === "local" && (
                <div style={s.warningBanner}>
                  ⚠️ Backend not connected — showing rule-based recommendation. Start your FastAPI server for ML predictions.
                </div>
              )}

              {/* Top recommendation */}
              <div style={{ ...s.card, background: "linear-gradient(135deg, #E1F5EE, #F0FDF8)", border: "1px solid #9FE1CB", marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#0F6E56", marginBottom: 4, letterSpacing: 1 }}>BEST CROP FOR YOUR FIELD</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span style={{ fontSize: 48 }}>{cropInfo.emoji || "🌿"}</span>
                  <div>
                    <h2 style={{ fontSize: 32, fontWeight: 900, color: "#0F6E56", margin: 0 }}>
                      {result.top_recommendation}
                    </h2>
                    <span style={{ background: "#0F6E56", color: "#fff", borderRadius: 20, padding: "2px 12px", fontSize: 12, fontWeight: 700 }}>
                      {result.all_recommendations[0].confidence}% match
                    </span>
                  </div>
                </div>
                <p style={{ color: "#2D6A4F", fontSize: 14, margin: "0 0 8px" }}>{cropInfo.tip}</p>
                {cropInfo.season && (
                  <p style={{ fontSize: 13, color: "#555" }}>📅 Best season: <strong>{cropInfo.season}</strong></p>
                )}
              </div>

              {/* All 3 recommendations */}
              <div style={s.card}>
                <h3 style={s.cardTitle}>All Recommendations</h3>
                {result.all_recommendations.map((r, i) => {
                  const ci = CROP_INFO[r.crop.toLowerCase()] || {};
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 2 ? "1px solid #f0f0f0" : "none" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: i === 0 ? "#1D9E75" : "#f0f0f0", color: i === 0 ? "#fff" : "#666", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <span style={{ fontSize: 24 }}>{ci.emoji || "🌿"}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{r.crop}</div>
                        <div style={{ fontSize: 12, color: "#888" }}>{r.tip}</div>
                      </div>
                      <div style={{ fontWeight: 800, color: "#1D9E75", fontSize: 16, flexShrink: 0 }}>
                        {r.confidence}%
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Market price estimate */}
              <div style={s.card}>
                <h3 style={s.cardTitle}>💰 Estimated Market Value</h3>
                <MarketEstimate crop={result.top_recommendation} />
              </div>

              {/* Soil health summary */}
              <div style={s.card}>
                <h3 style={s.cardTitle}>🧪 Soil Health Summary</h3>
                <SoilSummary form={form} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Market price estimates (static for demo, replace with API later)
const MARKET_PRICES = {
  rice: 2100, wheat: 2015, maize: 1850, cotton: 6200,
  sugarcane: 350, potato: 1200, tomato: 1800, onion: 1500,
  banana: 2200, mustard: 5200, groundnut: 5600, coffee: 18000,
};

function MarketEstimate({ crop }) {
  const price = MARKET_PRICES[crop?.toLowerCase()] || 2000;
  const revenue1acre = price * 8;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
        <span style={{ color: "#666", fontSize: 14 }}>Avg mandi price</span>
        <span style={{ fontWeight: 800, fontSize: 20, color: "#1D9E75" }}>₹{price.toLocaleString()}/quintal</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0" }}>
        <span style={{ color: "#666", fontSize: 14 }}>Est. revenue (1 acre)</span>
        <span style={{ fontWeight: 700, fontSize: 16 }}>₹{revenue1acre.toLocaleString()}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
        <span style={{ color: "#666", fontSize: 14 }}>Avg yield</span>
        <span style={{ fontWeight: 600, fontSize: 14 }}>~8 quintals/acre</span>
      </div>
      <p style={{ fontSize: 11, color: "#aaa", marginTop: 8 }}>* Prices from Agmarknet sample data. Connect backend for live prices.</p>
    </div>
  );
}

function SoilSummary({ form }) {
  const ph = parseFloat(form.ph);
  const n  = parseFloat(form.nitrogen);
  const p  = parseFloat(form.phosphorus);
  const k  = parseFloat(form.potassium);

  const items = [
    { label: "Soil pH",    value: ph,  good: ph >= 6 && ph <= 7.5,    status: ph >= 6 && ph <= 7.5 ? "Optimal" : ph < 6 ? "Too Acidic" : "Too Alkaline" },
    { label: "Nitrogen",   value: n,   good: n >= 60,                  status: n >= 60 ? "Adequate" : "Low — consider urea" },
    { label: "Phosphorus", value: p,   good: p >= 30,                  status: p >= 30 ? "Adequate" : "Low — consider DAP" },
    { label: "Potassium",  value: k,   good: k >= 40,                  status: k >= 40 ? "Adequate" : "Low — consider MOP" },
  ];

  return (
    <div>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < items.length - 1 ? "1px solid #f5f5f5" : "none" }}>
          <span style={{ fontSize: 14, color: "#555" }}>{item.label}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{item.value}</span>
            <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 20, background: item.good ? "#E1F5EE" : "#FEF3C7", color: item.good ? "#0F6E56" : "#92400E", fontWeight: 600 }}>
              {item.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

const s = {
  pageTitle:    { fontSize: 26, fontWeight: 900, marginBottom: 6 },
  pageSub:      { color: "#777", marginBottom: 28, fontSize: 15 },
  twoCol:       { display: "grid", gridTemplateColumns: "380px 1fr", gap: 24, alignItems: "start" },
  card:         { background: "#fff", borderRadius: 12, padding: 24, marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  cardTitle:    { fontSize: 15, fontWeight: 700, marginBottom: 16, margin: "0 0 16px" },
  label:        { display: "block", fontSize: 13, fontWeight: 500, color: "#555", marginBottom: 5 },
  unit:         { color: "#aaa", fontWeight: 400 },
  input:        { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, outline: "none", boxSizing: "border-box" },
  btn:          { width: "100%", padding: 13, background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 8 },
  sampleBtn:    { width: "100%", padding: 9, background: "none", color: "#1D9E75", border: "1px solid #1D9E75", borderRadius: 8, fontSize: 13, cursor: "pointer", marginTop: 10 },
  emptyState:   { textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  warningBanner:{ background: "#FEF3C7", color: "#92400E", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 },
};