import React, { useState, useEffect } from "react";

const PRICE_DATA = {
  "West Bengal": [
    { crop: "Rice",      price: 2100, change: +5.2,  unit: "quintal", market: "Siliguri Mandi",   emoji: "🌾" },
    { crop: "Wheat",     price: 2015, change: -1.1,  unit: "quintal", market: "NJP Mandi",        emoji: "🌿" },
    { crop: "Potato",    price: 1200, change: +12.4, unit: "quintal", market: "Jalpaiguri Mandi", emoji: "🥔" },
    { crop: "Tomato",    price: 1800, change: -8.3,  unit: "quintal", market: "Siliguri Mandi",   emoji: "🍅" },
    { crop: "Mustard",   price: 5200, change: +2.1,  unit: "quintal", market: "Cooch Behar",      emoji: "🌼" },
    { crop: "Maize",     price: 1850, change: +0.8,  unit: "quintal", market: "Malda Mandi",      emoji: "🌽" },
    { crop: "Onion",     price: 1500, change: -15.2, unit: "quintal", market: "Kolkata Market",   emoji: "🧅" },
    { crop: "Sugarcane", price: 350,  change: +1.0,  unit: "quintal", market: "Murshidabad",      emoji: "🎋" },
  ],
  "Punjab": [
    { crop: "Wheat",     price: 2200, change: +3.1,  unit: "quintal", market: "Amritsar Mandi",   emoji: "🌿" },
    { crop: "Rice",      price: 2300, change: +1.5,  unit: "quintal", market: "Ludhiana Mandi",   emoji: "🌾" },
    { crop: "Maize",     price: 1950, change: -2.0,  unit: "quintal", market: "Patiala Mandi",    emoji: "🌽" },
    { crop: "Cotton",    price: 6500, change: +4.2,  unit: "quintal", market: "Bathinda Mandi",   emoji: "🌸" },
    { crop: "Mustard",   price: 5400, change: +1.8,  unit: "quintal", market: "Jalandhar Mandi",  emoji: "🌼" },
  ],
  "Maharashtra": [
    { crop: "Onion",     price: 1400, change: -20.5, unit: "quintal", market: "Nashik Mandi",     emoji: "🧅" },
    { crop: "Tomato",    price: 1600, change: -5.2,  unit: "quintal", market: "Pune Mandi",       emoji: "🍅" },
    { crop: "Sugarcane", price: 380,  change: +2.5,  unit: "quintal", market: "Kolhapur Mandi",   emoji: "🎋" },
    { crop: "Cotton",    price: 6200, change: +3.1,  unit: "quintal", market: "Nagpur Mandi",     emoji: "🌸" },
    { crop: "Groundnut", price: 5600, change: +1.2,  unit: "quintal", market: "Latur Mandi",      emoji: "🥜" },
  ],
};

const STATES = Object.keys(PRICE_DATA);

const HISTORY = {
  Rice:    [1950, 2000, 1980, 2050, 2080, 2100],
  Wheat:   [1900, 1950, 1980, 2000, 2010, 2015],
  Potato:  [800,  950,  1000, 1100, 1150, 1200],
  Tomato:  [2100, 1900, 2000, 1950, 1850, 1800],
  Mustard: [4800, 4900, 5000, 5100, 5150, 5200],
  Maize:   [1700, 1750, 1780, 1800, 1830, 1850],
};
const HISTORY_MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];

export default function Prices() {
  const [state, setState]         = useState("West Bengal");
  const [selected, setSelected]   = useState(null);
  const [search, setSearch]       = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Simulate live update every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => setLastUpdated(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const prices = PRICE_DATA[state] || [];
  const filtered = prices.filter(p =>
    search === "" || p.crop.toLowerCase().includes(search.toLowerCase())
  );
  const selectedData = selected
    ? prices.find(p => p.crop === selected)
    : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={s.pageTitle}>📈 Live Mandi Prices</h1>
          <p style={s.pageSub}>Real-time wholesale prices from major mandis across India</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#999" }}>Last updated</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1D9E75" }}>
            {lastUpdated.toLocaleTimeString()}
          </div>
          <div style={{ fontSize: 11, color: "#bbb" }}>Source: Agmarknet</div>
        </div>
      </div>

      {/* State selector + search */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          style={{ ...s.input, width: 220 }}
          placeholder="Search crop..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {STATES.map(st => (
            <button key={st} onClick={() => { setState(st); setSelected(null); }}
              style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #ddd", background: state === st ? "#1D9E75" : "#fff", color: state === st ? "#fff" : "#666", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
              {st}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 340px" : "1fr", gap: 20 }}>
        {/* Price table */}
        <div style={s.card}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>
            {state} — {filtered.length} commodities
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f0f0f0" }}>
                {["Commodity", "Market", "Price", "Change", "Trend", ""].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#888", fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, i) => {
                const up = item.change > 0;
                const hist = HISTORY[item.crop];
                return (
                  <tr key={i}
                    onClick={() => setSelected(selected === item.crop ? null : item.crop)}
                    style={{ borderBottom: "1px solid #f8f8f8", cursor: "pointer", background: selected === item.crop ? "#F0FDF8" : "transparent", transition: "background 0.15s" }}>
                    <td style={{ padding: "14px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 22 }}>{item.emoji}</span>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{item.crop}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 12px", fontSize: 13, color: "#666" }}>{item.market}</td>
                    <td style={{ padding: "14px 12px" }}>
                      <span style={{ fontWeight: 900, fontSize: 18, color: "#1D9E75" }}>₹{item.price.toLocaleString()}</span>
                      <span style={{ fontSize: 11, color: "#999" }}>/qtl</span>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <span style={{ color: up ? "#0F6E56" : "#DC2626", fontWeight: 700, fontSize: 14 }}>
                        {up ? "▲" : "▼"} {Math.abs(item.change)}%
                      </span>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      {/* Mini sparkline */}
                      {hist ? (
                        <svg width="60" height="24">
                          {hist.map((v, j) => {
                            if (j === 0) return null;
                            const min = Math.min(...hist), max = Math.max(...hist);
                            const x1 = ((j-1) / (hist.length-1)) * 56 + 2;
                            const y1 = 22 - ((hist[j-1]-min)/(max-min||1)) * 18;
                            const x2 = (j / (hist.length-1)) * 56 + 2;
                            const y2 = 22 - ((v-min)/(max-min||1)) * 18;
                            return <line key={j} x1={x1} y1={y1} x2={x2} y2={y2} stroke={up?"#1D9E75":"#DC2626"} strokeWidth="1.5" />;
                          })}
                        </svg>
                      ) : <span style={{ color: "#ddd", fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <span style={{ fontSize: 12, color: "#1D9E75", fontWeight: 600 }}>
                        {selected === item.crop ? "▲ Hide" : "Details →"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selectedData && (
          <div>
            <div style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 36 }}>{selectedData.emoji}</span>
                  <h3 style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 900 }}>{selectedData.crop}</h3>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#999" }}>✕</button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                <span style={{ color: "#666", fontSize: 14 }}>Current price</span>
                <span style={{ fontWeight: 900, fontSize: 22, color: "#1D9E75" }}>₹{selectedData.price.toLocaleString()}/qtl</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                <span style={{ color: "#666", fontSize: 14 }}>Price change</span>
                <span style={{ fontWeight: 700, color: selectedData.change > 0 ? "#0F6E56" : "#DC2626" }}>
                  {selectedData.change > 0 ? "▲" : "▼"} {Math.abs(selectedData.change)}% this week
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                <span style={{ color: "#666", fontSize: 14 }}>Market</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{selectedData.market}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                <span style={{ color: "#666", fontSize: 14 }}>Est. revenue (1 acre)</span>
                <span style={{ fontWeight: 700, fontSize: 16 }}>₹{(selectedData.price * 8).toLocaleString()}</span>
              </div>

              {/* 6-month price history chart */}
              {HISTORY[selectedData.crop] && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: "#555" }}>6-Month Price History</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
                    {HISTORY[selectedData.crop].map((val, i) => {
                      const hist = HISTORY[selectedData.crop];
                      const min = Math.min(...hist), max = Math.max(...hist);
                      const h = ((val - min) / (max - min || 1)) * 60 + 16;
                      const isLast = i === hist.length - 1;
                      return (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div style={{ fontSize: 10, color: isLast ? "#1D9E75" : "#bbb", fontWeight: isLast ? 700 : 400 }}>
                            ₹{(val/1000).toFixed(1)}k
                          </div>
                          <div style={{ width: "100%", height: h, background: isLast ? "#1D9E75" : "#C6F0E0", borderRadius: "3px 3px 0 0" }} />
                          <div style={{ fontSize: 10, color: isLast ? "#1D9E75" : "#999", fontWeight: isLast ? 700 : 400 }}>
                            {HISTORY_MONTHS[i]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Advice */}
              <div style={{ marginTop: 16, padding: "12px 14px", background: selectedData.change > 0 ? "#E1F5EE" : "#FEF3C7", borderRadius: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: selectedData.change > 0 ? "#0F6E56" : "#92400E", marginBottom: 4 }}>
                  {selectedData.change > 0 ? "📈 Good time to sell" : "📉 Prices falling"}
                </div>
                <div style={{ fontSize: 12, color: selectedData.change > 0 ? "#2D6A4F" : "#78350F" }}>
                  {selectedData.change > 0
                    ? `${selectedData.crop} prices are rising. Consider selling soon to maximise your profit.`
                    : `${selectedData.crop} prices are falling. Consider storing and waiting for prices to recover.`}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  pageTitle: { fontSize: 26, fontWeight: 900, marginBottom: 6, margin: 0 },
  pageSub:   { color: "#777", fontSize: 15, margin: "4px 0 0" },
  card:      { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  input:     { padding: "9px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, outline: "none" },
};