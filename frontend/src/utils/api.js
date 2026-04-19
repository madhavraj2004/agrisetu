const BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

const headers = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const api = {
  // ── Auth ──────────────────────────────────────────────────
  register: (data) =>
    fetch(`${BASE}/auth/register`, { method: "POST", headers: headers(), body: JSON.stringify(data) }).then((r) => r.json()),

  login: (data) =>
    fetch(`${BASE}/auth/login`, { method: "POST", headers: headers(), body: JSON.stringify(data) }).then((r) => r.json()),

  // ── Crop Advisory ─────────────────────────────────────────
  predictCrop: (soilData) =>
    fetch(`${BASE}/crops/predict`, { method: "POST", headers: headers(), body: JSON.stringify(soilData) }).then((r) => r.json()),

  getCropHistory: (userId) =>
    fetch(`${BASE}/crops/history/${userId}`, { headers: headers() }).then((r) => r.json()),

  getCropsList: () =>
    fetch(`${BASE}/crops/crops-list`, { headers: headers() }).then((r) => r.json()),

  // ── Marketplace ───────────────────────────────────────────
  getProducts: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return fetch(`${BASE}/marketplace/products?${params}`, { headers: headers() }).then((r) => r.json());
  },

  createProduct: (data) =>
    fetch(`${BASE}/marketplace/products`, { method: "POST", headers: headers(), body: JSON.stringify(data) }).then((r) => r.json()),

  updateProduct: (id, data) =>
    fetch(`${BASE}/marketplace/products/${id}`, { method: "PUT", headers: headers(), body: JSON.stringify(data) }).then((r) => r.json()),

  deleteProduct: (id) =>
    fetch(`${BASE}/marketplace/products/${id}`, { method: "DELETE", headers: headers() }).then((r) => r.json()),

  getSellerProducts: (sellerId) =>
    fetch(`${BASE}/marketplace/products/seller/${sellerId}`, { headers: headers() }).then((r) => r.json()),

  placeOrder: (data) =>
    fetch(`${BASE}/marketplace/orders`, { method: "POST", headers: headers(), body: JSON.stringify(data) }).then((r) => r.json()),

  updateOrderStatus: (orderId, status) =>
    fetch(`${BASE}/marketplace/orders/${orderId}/status?status=${status}`, { method: "PATCH", headers: headers() }).then((r) => r.json()),

  getBuyerOrders: (buyerId) =>
    fetch(`${BASE}/marketplace/orders/buyer/${buyerId}`, { headers: headers() }).then((r) => r.json()),

  getSellerOrders: (sellerId) =>
    fetch(`${BASE}/marketplace/orders/seller/${sellerId}`, { headers: headers() }).then((r) => r.json()),

  getFarmerStats: (farmerId) =>
    fetch(`${BASE}/marketplace/stats/farmer/${farmerId}`, { headers: headers() }).then((r) => r.json()),

  // ── External ──────────────────────────────────────────────
  getWeather: (city) =>
    fetch(`${BASE}/external/weather?city=${encodeURIComponent(city)}`, { headers: headers() }).then((r) => r.json()),

  getMandiPrices: (crop = "") =>
    fetch(`${BASE}/external/mandi-prices${crop ? `?crop=${crop}` : ""}`, { headers: headers() }).then((r) => r.json()),
};

export default api;
