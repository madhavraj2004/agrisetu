import { useState } from "react";
import api from "../utils/api";
import { useAuth } from "../utils/AuthContext";
import s from "./CropAdvisor.module.css";

const FIELDS = [
  { key: "N",           label: "Nitrogen (N)",      unit: "kg/ha",  min: 0,   max: 300, step: 1,   tip: "Boosts leafy growth" },
  { key: "P",           label: "Phosphorus (P)",    unit: "kg/ha",  min: 0,   max: 150, step: 1,   tip: "Root & flower development" },
  { key: "K",           label: "Potassium (K)",     unit: "kg/ha",  min: 0,   max: 300, step: 1,   tip: "Disease resistance" },
  { key: "temperature", label: "Temperature",       unit: "°C",     min: 5,   max: 50,  step: 0.1, tip: "Average annual temperature" },
  { key: "humidity",    label: "Humidity",          unit: "%",      min: 10,  max: 100, step: 1,   tip: "Average relative humidity" },
  { key: "ph",          label: "Soil pH",           unit: "",       min: 3.5, max: 9.5, step: 0.1, tip: "6-7 is neutral/ideal" },
  { key: "rainfall",    label: "Annual Rainfall",   unit: "mm",     min: 20,  max: 2500, step: 10, tip: "Total annual rainfall" },
];

const CONFIDENCE_COLOR = (c) => c >= 70 ? "#1a7a4a" : c >= 40 ? "#c47c0a" : "#8b3a3a";

export default function CropAdvisor() {
  const { user } = useAuth();
  const [form, setForm]     = useState({ N:90, P:42, K:43, temperature:25, humidity:71, ph:6.5, rainfall:103 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await api.predictCrop({ ...form, user_id: user?.id || null });
      setResult(res);
    } catch (err) {
      setError("Prediction failed. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.header}>
        <h1 className={s.title}>🌾 Crop Advisor</h1>
        <p className={s.sub}>Enter your soil and climate values to get AI-powered crop recommendations</p>
      </div>

      <div className={s.layout}>
        {/* Input Form */}
        <div className={s.formCard}>
          <h2 className={s.cardTitle}>Soil & Climate Parameters</h2>
          <form onSubmit={handleSubmit}>
            <div className={s.grid}>
              {FIELDS.map((f) => (
                <div key={f.key} className={s.field}>
                  <label className={s.label}>
                    {f.label}
                    {f.unit && <span className={s.unit}> {f.unit}</span>}
                  </label>
                  <input
                    type="number"
                    className={s.input}
                    value={form[f.key]}
                    min={f.min} max={f.max} step={f.step}
                    onChange={(e) => setForm({ ...form, [f.key]: parseFloat(e.target.value) })}
                  />
                  <span className={s.tip}>{f.tip}</span>
                </div>
              ))}
            </div>
            <button type="submit" className={s.btn} disabled={loading}>
              {loading ? "Analysing soil..." : "Get Crop Recommendations"}
            </button>
          </form>
          {error && <p className={s.error}>{error}</p>}
        </div>

        {/* Results */}
        <div className={s.resultsCard}>
          {!result ? (
            <div className={s.placeholder}>
              <div className={s.placeholderIcon}>🌱</div>
              <p>Enter your soil values and click the button to get recommendations</p>
            </div>
          ) : (
            <>
              <div className={s.accuracyBadge}>
                Model Accuracy: <strong>{result.model_accuracy}%</strong>
              </div>
              <h2 className={s.cardTitle}>Top Crop Recommendations</h2>
              {result.top3.map((crop, i) => (
                <div key={i} className={s.cropCard} style={{ borderLeftColor: CONFIDENCE_COLOR(crop.confidence) }}>
                  <div className={s.cropHeader}>
                    <span className={s.rank}>#{i + 1}</span>
                    <span className={s.cropName}>{crop.crop}</span>
                    <span className={s.confidence} style={{ color: CONFIDENCE_COLOR(crop.confidence) }}>
                      {crop.confidence}% confidence
                    </span>
                  </div>
                  <div className={s.progressBar}>
                    <div className={s.progressFill} style={{ width: `${crop.confidence}%`, background: CONFIDENCE_COLOR(crop.confidence) }} />
                  </div>
                  <ul className={s.reasons}>
                    {crop.reasons.map((r, j) => <li key={j}>✓ {r}</li>)}
                  </ul>
                  <MandiPrice cropName={crop.crop} />
                </div>
              ))}

              <div className={s.inputSummary}>
                <h3>Your soil inputs</h3>
                {Object.entries(result.inputs_used).map(([k, v]) => (
                  <div key={k} className={s.summaryRow}>
                    <span>{k}</span><span>{v}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline mandi price fetcher per crop
function MandiPrice({ cropName }) {
  const [price, setPrice] = useState(null);

  useState(() => {
    api.getMandiPrices(cropName).then((res) => {
      const data = res[cropName];
      if (data) setPrice(data);
    }).catch(() => {});
  }, [cropName]);

  if (!price) return null;
  return (
    <div style={{ marginTop: 8, padding: "6px 10px", background: "#f0faf5", borderRadius: 6, fontSize: 12 }}>
      📊 Current mandi price: <strong>₹{price.price}/quintal</strong> ({price.trend}) · {price.market}
      {price.estimated_revenue_per_acre && <span> · Est. revenue/acre: <strong>{price.estimated_revenue_per_acre}</strong></span>}
    </div>
  );
}
