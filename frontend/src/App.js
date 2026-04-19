import React, { useState } from "react";
import Prices from "./pages/Prices";
import Advisory     from "./pages/Advisory";
import Marketplace  from "./pages/Marketplace";
import Dashboard    from "./pages/Dashboard";

const NAV = ["Advisory", "Marketplace", "Dashboard", "Prices"];

function App() {
  const [tab, setTab] = useState("Advisory");

  return (
    <div style={{ fontFamily: "sans-serif", minHeight: "100vh", background: "#f5f4f0" }}>
      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e0e0e0", padding: "0 24px", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#1D9E75" }} />
          <span style={{ fontWeight: 800, fontSize: 16 }}>AgriMinds</span>
          <span style={{ fontSize: 11, color: "#999", background: "#f0f0f0", padding: "2px 8px", borderRadius: 20 }}>Beta</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {NAV.map(n => (
            <button key={n} onClick={() => setTab(n)}
              style={{ background: tab === n ? "#1D9E75" : "none", color: tab === n ? "#fff" : "#666", border: "none", padding: "6px 14px", borderRadius: 7, cursor: "pointer", fontWeight: 500, fontSize: 13 }}>
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
        {tab === "Advisory"    && <Advisory />}
        {tab === "Marketplace" && <Marketplace />}
        {tab === "Dashboard"   && <Dashboard />}
        {tab === "Prices" && <Prices />}      </div>
    </div>
  );
}

function ComingSoon({ title, desc }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
      <h2 style={{ fontWeight: 800, marginBottom: 8 }}>{title}</h2>
      <p style={{ color: "#888" }}>{desc}</p>
    </div>
  );
}

export default App;