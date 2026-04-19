import React, { useState } from "react";

const SAMPLE_LISTINGS = [
  { id: 1, farmer: "Rajan Kumar",    location: "Siliguri, WB",    crop: "Rice",     qty: 50,  price: 2100, unit: "quintal", verified: true,  img: "🌾", posted: "2 hours ago" },
  { id: 2, farmer: "Priya Devi",     location: "Jalpaiguri, WB",  crop: "Tomato",   qty: 20,  price: 1800, unit: "quintal", verified: true,  img: "🍅", posted: "5 hours ago" },
  { id: 3, farmer: "Mohan Singh",    location: "Cooch Behar, WB", crop: "Potato",   qty: 100, price: 1200, unit: "quintal", verified: false, img: "🥔", posted: "1 day ago"   },
  { id: 4, farmer: "Sunita Boro",    location: "Alipurduar, WB",  crop: "Mustard",  qty: 30,  price: 5200, unit: "quintal", verified: true,  img: "🌼", posted: "3 hours ago" },
  { id: 5, farmer: "Dilip Mahato",   location: "Darjeeling, WB",  crop: "Maize",    qty: 80,  price: 1850, unit: "quintal", verified: false, img: "🌽", posted: "6 hours ago" },
  { id: 6, farmer: "Anita Sarkar",   location: "Malda, WB",       crop: "Wheat",    qty: 60,  price: 2015, unit: "quintal", verified: true,  img: "🌿", posted: "12 hours ago"},
];

const CATEGORIES = ["All", "Grains", "Vegetables", "Oilseeds", "Fruits"];

export default function Marketplace() {
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("All");
  const [showForm, setShowForm]   = useState(false);
  const [listings, setListings]   = useState(SAMPLE_LISTINGS);
  const [contacted, setContacted] = useState({});
  const [newListing, setNewListing] = useState({
    crop: "", qty: "", price: "", location: "", notes: ""
  });

  const filtered = listings.filter(l =>
    (search === "" || l.crop.toLowerCase().includes(search.toLowerCase()) ||
     l.farmer.toLowerCase().includes(search.toLowerCase())) &&
    (category === "All")
  );

  const handleContact = (id) => {
    setContacted(prev => ({ ...prev, [id]: true }));
  };

  const handleAddListing = (e) => {
    e.preventDefault();
    const newItem = {
      id: listings.length + 1,
      farmer: "You (Demo)",
      location: newListing.location || "Your Location",
      crop: newListing.crop,
      qty: parseInt(newListing.qty),
      price: parseInt(newListing.price),
      unit: "quintal",
      verified: false,
      img: "🌱",
      posted: "Just now",
    };
    setListings([newItem, ...listings]);
    setShowForm(false);
    setNewListing({ crop: "", qty: "", price: "", location: "", notes: "" });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={s.pageTitle}>🛒 Marketplace</h1>
          <p style={s.pageSub}>Buy directly from verified farmers — no middlemen</p>
        </div>
        <button style={s.addBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ List Your Produce"}
        </button>
      </div>

      {/* Add listing form */}
      {showForm && (
        <div style={{ ...s.card, marginBottom: 24, border: "1px solid #9FE1CB" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>List your produce</h3>
          <form onSubmit={handleAddListing} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={s.label}>Crop name *</label>
              <input style={s.input} value={newListing.crop} onChange={e => setNewListing({...newListing, crop: e.target.value})} placeholder="e.g. Rice" required />
            </div>
            <div>
              <label style={s.label}>Quantity (quintals) *</label>
              <input style={s.input} type="number" value={newListing.qty} onChange={e => setNewListing({...newListing, qty: e.target.value})} placeholder="e.g. 50" required />
            </div>
            <div>
              <label style={s.label}>Price per quintal (₹) *</label>
              <input style={s.input} type="number" value={newListing.price} onChange={e => setNewListing({...newListing, price: e.target.value})} placeholder="e.g. 2100" required />
            </div>
            <div>
              <label style={s.label}>Location</label>
              <input style={s.input} value={newListing.location} onChange={e => setNewListing({...newListing, location: e.target.value})} placeholder="e.g. Siliguri, WB" />
            </div>
            <div>
              <label style={s.label}>Notes</label>
              <input style={s.input} value={newListing.notes} onChange={e => setNewListing({...newListing, notes: e.target.value})} placeholder="e.g. Organic, freshly harvested" />
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button type="submit" style={{ ...s.addBtn, width: "100%", padding: 10 }}>Submit Listing</button>
            </div>
          </form>
        </div>
      )}

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          style={{ ...s.input, flex: 1, minWidth: 200 }}
          placeholder="Search crop or farmer..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #ddd", background: category === c ? "#1D9E75" : "#fff", color: category === c ? "#fff" : "#666", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Active listings", value: listings.length },
          { label: "Verified farmers", value: listings.filter(l => l.verified).length },
          { label: "Avg price (Rice)", value: "₹2,100/q" },
        ].map((stat, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "12px 20px", flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Listings grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {filtered.map(listing => (
          <div key={listing.id} style={s.listingCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <span style={{ fontSize: 40 }}>{listing.img}</span>
              {listing.verified && (
                <span style={{ background: "#E1F5EE", color: "#0F6E56", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                  ✓ Verified
                </span>
              )}
            </div>
            <h3 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800 }}>{listing.crop}</h3>
            <p style={{ margin: "0 0 2px", fontSize: 13, color: "#666" }}>👨‍🌾 {listing.farmer}</p>
            <p style={{ margin: "0 0 12px", fontSize: 12, color: "#999" }}>📍 {listing.location}</p>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#1D9E75" }}>₹{listing.price.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: "#999" }}>per {listing.unit}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{listing.qty} qtl</div>
                <div style={{ fontSize: 11, color: "#999" }}>available</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#bbb", marginBottom: 12 }}>Posted {listing.posted}</div>
            <button
              onClick={() => handleContact(listing.id)}
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "none", background: contacted[listing.id] ? "#f0f0f0" : "#1D9E75", color: contacted[listing.id] ? "#888" : "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
              {contacted[listing.id] ? "✓ Request Sent" : "Contact Farmer"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  pageTitle:   { fontSize: 26, fontWeight: 900, marginBottom: 6, margin: 0 },
  pageSub:     { color: "#777", fontSize: 15, margin: "4px 0 0" },
  card:        { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" },
  addBtn:      { background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  label:       { display: "block", fontSize: 13, fontWeight: 500, color: "#555", marginBottom: 4 },
  input:       { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, outline: "none", boxSizing: "border-box" },
  listingCard: { background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", transition: "box-shadow 0.2s" },
};