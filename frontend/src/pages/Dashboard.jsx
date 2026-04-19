import React, { useState } from "react";

const MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
const SALES_DATA = [12000, 18000, 15000, 22000, 19000, 28000];
const CROP_DATA = [
  { crop: "Rice",    qty: 120, revenue: 25200, color: "#1D9E75" },
  { crop: "Wheat",   qty: 80,  revenue: 16120, color: "#3B82F6" },
  { crop: "Tomato",  qty: 40,  revenue: 7200,  color: "#EF4444" },
  { crop: "Mustard", qty: 30,  revenue: 15600, color: "#F59E0B" },
];

const RECENT_ORDERS = [
  { id: "#001", buyer: "Ram Stores, Siliguri",   crop: "Rice",   qty: 20, amount: 42000, status: "Delivered", date: "Apr 15" },
  { id: "#002", buyer: "Meena Traders, NJP",     crop: "Wheat",  qty: 15, amount: 30225, status: "In Transit", date: "Apr 17" },
  { id: "#003", buyer: "Kolkata Wholesale Mkt",  crop: "Mustard",qty: 10, amount: 52000, status: "Pending",    date: "Apr 18" },
  { id: "#004", buyer: "Local Mandi, Jalpaiguri",crop: "Tomato", qty: 8,  amount: 14400, status: "Delivered",  date: "Apr 12" },
];

const STATUS_COLOR = {
  Delivered:  { bg: "#E1F5EE", color: "#0F6E56" },
  "In Transit":{ bg: "#DBEAFE", color: "#1D4ED8" },
  Pending:    { bg: "#FEF3C7", color: "#92400E" },
};

export default function Dashboard() {
  const [activeMonth, setActiveMonth] = useState(5);
  const totalRevenue = CROP_DATA.reduce((a, c) => a + c.revenue, 0);
  const maxSales = Math.max(...SALES_DATA);

  return (
    <div>
      <h1 style={s.pageTitle}>📊 Farmer Dashboard</h1>
      <p style={s.pageSub}>Your farm performance at a glance</p>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Revenue",   value: `₹${totalRevenue.toLocaleString()}`, sub: "This season",     icon: "💰", color: "#E1F5EE" },
          { label: "Total Sold",      value: "270 qtl",                           sub: "Across 4 crops",  icon: "📦", color: "#DBEAFE" },
          { label: "Active Listings", value: "3",                                 sub: "On marketplace",  icon: "🛒", color: "#FEF3C7" },
          { label: "Pending Orders",  value: "1",                                 sub: "Needs attention", icon: "⏳", color: "#FEE2E2" },
        ].map((kpi, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>{kpi.value}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{kpi.label}</div>
                <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{kpi.sub}</div>
              </div>
              <div style={{ fontSize: 28, background: kpi.color, borderRadius: 10, padding: "8px 10px" }}>{kpi.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Revenue chart */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Monthly Revenue (₹)</h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 140, marginTop: 16 }}>
            {SALES_DATA.map((val, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 10, color: "#888" }}>₹{(val/1000).toFixed(0)}k</div>
                <div
                  onClick={() => setActiveMonth(i)}
                  style={{
                    width: "100%", borderRadius: "4px 4px 0 0", cursor: "pointer",
                    height: `${(val / maxSales) * 110}px`,
                    background: i === activeMonth ? "#1D9E75" : "#C6F0E0",
                    transition: "all 0.2s",
                  }}
                />
                <div style={{ fontSize: 11, color: i === activeMonth ? "#1D9E75" : "#999", fontWeight: i === activeMonth ? 700 : 400 }}>
                  {MONTHS[i]}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#f8f8f8", borderRadius: 8, fontSize: 13 }}>
            {MONTHS[activeMonth]}: <strong>₹{SALES_DATA[activeMonth].toLocaleString()}</strong>
            {activeMonth > 0 && (
              <span style={{ marginLeft: 8, color: SALES_DATA[activeMonth] > SALES_DATA[activeMonth-1] ? "#0F6E56" : "#DC2626", fontSize: 12 }}>
                {SALES_DATA[activeMonth] > SALES_DATA[activeMonth-1] ? "▲" : "▼"}
                {Math.abs(((SALES_DATA[activeMonth] - SALES_DATA[activeMonth-1]) / SALES_DATA[activeMonth-1]) * 100).toFixed(0)}% vs last month
              </span>
            )}
          </div>
        </div>

        {/* Crop breakdown */}
        <div style={s.card}>
          <h3 style={s.cardTitle}>Crop Revenue Breakdown</h3>
          {CROP_DATA.map((c, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{c.crop}</span>
                <span style={{ fontSize: 13, color: "#666" }}>₹{c.revenue.toLocaleString()}</span>
              </div>
              <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(c.revenue / totalRevenue) * 100}%`, background: c.color, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: 11, color: "#999", marginTop: 2 }}>{c.qty} quintals sold</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent orders */}
      <div style={s.card}>
        <h3 style={{ ...s.cardTitle, marginBottom: 16 }}>Recent Orders</h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #f0f0f0" }}>
              {["Order ID", "Buyer", "Crop", "Qty", "Amount", "Status", "Date"].map(h => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#888", fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RECENT_ORDERS.map((order, i) => {
              const sc = STATUS_COLOR[order.status] || {};
              return (
                <tr key={i} style={{ borderBottom: "1px solid #f8f8f8" }}>
                  <td style={{ padding: "12px" }}><strong>{order.id}</strong></td>
                  <td style={{ padding: "12px", color: "#555" }}>{order.buyer}</td>
                  <td style={{ padding: "12px" }}>{order.crop}</td>
                  <td style={{ padding: "12px" }}>{order.qty} qtl</td>
                  <td style={{ padding: "12px", fontWeight: 700, color: "#1D9E75" }}>₹{order.amount.toLocaleString()}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ background: sc.bg, color: sc.color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px", color: "#999", fontSize: 13 }}>{order.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const s = {
  pageTitle: { fontSize: 26, fontWeight: 900, marginBottom: 6, margin: 0 },
  pageSub:   { color: "#777", fontSize: 15, margin: "4px 0 24px" },
  card:      { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  cardTitle: { fontSize: 15, fontWeight: 700, margin: 0 },
};