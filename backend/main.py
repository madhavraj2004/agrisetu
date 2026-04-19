from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests as http_requests
import pickle
import numpy as np
import os

app = FastAPI(title="AgriMinds API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load ML model ─────────────────────────────────────────
MODEL_PATH  = os.path.join(os.path.dirname(__file__), "ml", "model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "ml", "scaler.pkl")
LE_PATH     = os.path.join(os.path.dirname(__file__), "ml", "label_encoder.pkl")

model, scaler, le = None, None, None

try:
    with open(MODEL_PATH,  "rb") as f: model  = pickle.load(f)
    with open(SCALER_PATH, "rb") as f: scaler = pickle.load(f)
    with open(LE_PATH,     "rb") as f: le     = pickle.load(f)
    print("✅ ML model loaded successfully")
except Exception as e:
    print(f"⚠️  Model not found: {e}")
    print("   Run the notebook first to generate model.pkl")

# ── Crop tips ─────────────────────────────────────────────
CROP_TIPS = {
    "rice":       "High rainfall crop. Your humidity and temperature are optimal for rice.",
    "wheat":      "Cool weather crop. Your soil pH and nitrogen suit wheat well.",
    "maize":      "Versatile crop. Moderate water needs — good for your conditions.",
    "cotton":     "Warm climate crop. Your potassium levels are ideal for cotton.",
    "sugarcane":  "High water crop. Your rainfall and temperature support sugarcane.",
    "potato":     "Cool season crop. Your soil pH is in the right range for potato.",
    "tomato":     "Warm season crop. Your phosphorus levels benefit tomato growth.",
    "onion":      "Moderate temperature crop. Your NPK balance suits onion.",
    "banana":     "Tropical crop. Your humidity and temperature are ideal.",
    "mustard":    "Cool oilseed crop. Your conditions favour mustard.",
    "groundnut":  "Legume crop. Light soil and warm temperature work well.",
    "coffee":     "Plantation crop. Your rainfall and shade conditions suit coffee.",
    "jute":       "Fiber crop. High rainfall and warm temp are perfect.",
    "coconut":    "Coastal crop. Your humidity and temperature are suitable.",
    "grapes":     "Dry climate crop. Your temperature range suits grape growing.",
    "watermelon": "Warm season crop. Sandy loam and heat suit watermelon.",
    "muskmelon":  "Hot dry crop. Your temperature is ideal for muskmelon.",
    "orange":     "Citrus crop. Moderate rainfall and your pH range work well.",
    "apple":      "Cool climate crop. Your lower temperature favours apple.",
    "papaya":     "Tropical crop. Warm temp and good drainage suit papaya.",
    "mango":      "Dry spell before flowering improves your mango yield.",
    "lentil":     "Cool season legume. Your soil nitrogen is well-suited.",
    "blackgram":  "Warm season pulse. Your humidity and rainfall are suitable.",
    "mungbean":   "Short duration crop. Your temperature range is ideal.",
    "mothbeans":  "Drought tolerant crop. Low rainfall conditions suit mothbeans.",
    "pigeonpeas": "Long duration pulse. Your soil and climate are appropriate.",
    "kidneybeans":"Cool moist crop. Your humidity supports kidney bean growth.",
    "chickpea":   "Cool season crop. Your low rainfall suits chickpea well.",
    "pomegranate":"Dry climate fruit. Your temperature range is ideal.",
}

MARKET_PRICES = {
    "rice": 2100, "wheat": 2015, "maize": 1850, "cotton": 6200,
    "sugarcane": 350, "potato": 1200, "tomato": 1800, "onion": 1500,
    "banana": 2200, "mustard": 5200, "groundnut": 5600, "coffee": 18000,
    "jute": 3200, "coconut": 2800, "mango": 4500, "grapes": 6000,
    "watermelon": 800, "muskmelon": 900, "orange": 3500, "apple": 8000,
    "papaya": 1500, "lentil": 5500, "blackgram": 6000, "mungbean": 7000,
    "mothbeans": 5000, "pigeonpeas": 5800, "kidneybeans": 8000,
    "chickpea": 4800, "pomegranate": 7000,
}

# ── Input schema ──────────────────────────────────────────
class SoilInput(BaseModel):
    nitrogen:    float
    phosphorus:  float
    potassium:   float
    temperature: float
    humidity:    float
    ph:          float
    rainfall:    float

# ── Routes ────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status": "AgriMinds API running",
        "model_loaded": model is not None
    }

@app.post("/api/predict")
def predict_crop(data: SoilInput):
    if model is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # Match exact feature engineering from training script
        N = data.nitrogen
        P = data.phosphorus
        K = data.potassium

        N_P_ratio    = N / (P + 1)
        N_K_ratio    = N / (K + 1)
        nutrient_sum = N + P + K
        climate_index = data.temperature * data.humidity / 100
        soil_moisture = data.rainfall * data.humidity / 100

        # Must match training order exactly
        features = np.array([[
            N, P, K,
            data.temperature, data.humidity, data.ph, data.rainfall,
            N_P_ratio, N_K_ratio, nutrient_sum, climate_index, soil_moisture
        ]])

        scaled = scaler.transform(features)
        proba  = model.predict_proba(scaled)[0]
        top3   = np.argsort(proba)[-3:][::-1]

        recommendations = []
        for idx in top3:
            crop = le.inverse_transform([idx])[0].lower()
            recommendations.append({
                "crop":       crop.capitalize(),
                "confidence": round(float(proba[idx]) * 100, 1),
                "tip":        CROP_TIPS.get(crop, "Suitable for your soil and climate conditions."),
                "price":      MARKET_PRICES.get(crop, 2000),
            })

        top = recommendations[0]["crop"].lower()
        return {
            "top_recommendation":  recommendations[0]["crop"],
            "all_recommendations": recommendations,
            "market_price":        MARKET_PRICES.get(top, 2000),
            "revenue_estimate":    MARKET_PRICES.get(top, 2000) * 8,
            "model_used":          "ML (Random Forest) — 99% accuracy",
        }

    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/api/market/{crop}")
def market_price(crop: str):
    price = MARKET_PRICES.get(crop.lower(), 2000)
    return {
        "crop":    crop,
        "price":   price,
        "unit":    "per quintal (₹)",
        "revenue": price * 8,
    }

@app.get("/api/weather")
def get_weather(lat: float, lon: float):
    """
    Get current weather by GPS coordinates
    Used to auto-fill temperature, humidity, rainfall in advisory form
    """
    WEATHER_KEY = os.getenv("WEATHER_KEY", "")
    
    if not WEATHER_KEY:
        return {"error": "Weather API key not configured"}
    
    try:
        url = (
            f"https://api.openweathermap.org/data/2.5/weather"
            f"?lat={lat}&lon={lon}"
            f"&appid={WEATHER_KEY}"
            f"&units=metric"
        )
        resp = http_requests.get(url, timeout=8)
        data = resp.json()
        
        return {
            "temperature": round(data["main"]["temp"], 1),
            "humidity":    data["main"]["humidity"],
            "rainfall":    round(data.get("rain", {}).get("1h", 0), 1),
            "description": data["weather"][0]["description"].title(),
            "city":        data.get("name", "Your Location"),
            "feels_like":  round(data["main"]["feels_like"], 1),
        }
        
    except Exception as e:
        return {"error": str(e)}


@app.get("/api/live-prices")
def live_prices(state: str = "West Bengal", commodity: str = "Rice"):
    """
    Fetch real mandi prices from data.gov.in (Agmarknet)
    """
    DATA_GOV_KEY = os.getenv("DATA_GOV_KEY", "")
    
    if not DATA_GOV_KEY:
        # Return sample data if no API key
        return {
            "source": "sample",
            "records": [
                {"market": "Siliguri", "commodity": commodity, 
                 "modal_price": "2100", "date": "19/04/2026"},
            ]
        }
    
    try:
        url = (
            "https://api.data.gov.in/resource/"
            "9ef84268-d588-465a-a308-a864a43d0070"
            f"?api-key={DATA_GOV_KEY}"
            f"&format=json&limit=10"
            f"&filters%5BState%5D={state}"
            f"&filters%5BCommodity%5D={commodity}"
        )
        resp = http_requests.get(url, timeout=8)
        data = resp.json()
        
        records = []
        for r in data.get("records", []):
            records.append({
                "market":      r.get("Market", ""),
                "commodity":   r.get("Commodity", commodity),
                "min_price":   r.get("Min Price", "0"),
                "max_price":   r.get("Max Price", "0"),
                "modal_price": r.get("Modal Price", "0"),
                "date":        r.get("Arrival Date", ""),
                "state":       r.get("State", state),
            })
        
        return {
            "source":  "Agmarknet Live",
            "records": records,
            "count":   len(records)
        }
        
    except Exception as e:
        return {
            "source":  "error",
            "error":   str(e),
            "records": []
        }

@app.get("/api/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}
