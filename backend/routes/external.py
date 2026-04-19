from fastapi import APIRouter, HTTPException
import httpx
import os

router = APIRouter(prefix="/external", tags=["external"])

OWM_KEY = os.getenv("OPENWEATHER_KEY", "")   # Free at openweathermap.org

# ── Weather ───────────────────────────────────────────────────

@router.get("/weather")
async def get_weather(city: str = "Kolkata"):
    """Fetch current weather + 5-day forecast for a city."""
    if not OWM_KEY:
        # Return mock data if no API key configured
        return {
            "city": city,
            "temperature": 28.5,
            "humidity": 72,
            "rainfall_mm": 5.2,
            "description": "Partly cloudy",
            "advisory": "Good conditions for most crops",
            "mock": True
        }
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://api.openweathermap.org/data/2.5/weather",
                params={"q": city + ",IN", "appid": OWM_KEY, "units": "metric"}
            )
            data = r.json()
            return {
                "city":        city,
                "temperature": data["main"]["temp"],
                "humidity":    data["main"]["humidity"],
                "rainfall_mm": data.get("rain", {}).get("1h", 0),
                "description": data["weather"][0]["description"],
                "advisory":    _weather_advisory(data["main"]["temp"], data["main"]["humidity"]),
            }
    except Exception as e:
        raise HTTPException(500, f"Weather fetch failed: {str(e)}")


def _weather_advisory(temp: float, humidity: float) -> str:
    if temp > 38:
        return "Extreme heat — avoid sowing, irrigate crops"
    elif temp < 10:
        return "Cold weather — protect crops from frost"
    elif humidity > 85:
        return "High humidity — watch for fungal diseases"
    elif humidity < 30:
        return "Low humidity — increase irrigation"
    else:
        return "Favorable conditions for most crops"


# ── Mandi Prices ──────────────────────────────────────────────

# Fallback static prices (used when Agmarknet API is unavailable)
MOCK_PRICES = {
    "Rice":      {"price": 2100, "unit": "quintal", "trend": "+5%",  "market": "Kolkata APMC"},
    "Wheat":     {"price": 2275, "unit": "quintal", "trend": "+2%",  "market": "Delhi APMC"},
    "Maize":     {"price": 1850, "unit": "quintal", "trend": "-3%",  "market": "Patna Mandi"},
    "Tomato":    {"price": 1200, "unit": "quintal", "trend": "+18%", "market": "Nashik Mandi"},
    "Potato":    {"price": 900,  "unit": "quintal", "trend": "-8%",  "market": "Agra Mandi"},
    "Onion":     {"price": 1500, "unit": "quintal", "trend": "+12%", "market": "Lasalgaon Mandi"},
    "Cotton":    {"price": 6800, "unit": "quintal", "trend": "+1%",  "market": "Akola Mandi"},
    "Mustard":   {"price": 5400, "unit": "quintal", "trend": "+3%",  "market": "Jaipur Mandi"},
    "Sugarcane": {"price": 340,  "unit": "quintal", "trend": "0%",   "market": "UP Mandi"},
    "Soybean":   {"price": 4200, "unit": "quintal", "trend": "-2%",  "market": "Indore Mandi"},
    "Groundnut": {"price": 5800, "unit": "quintal", "trend": "+4%",  "market": "Rajkot Mandi"},
    "Barley":    {"price": 1700, "unit": "quintal", "trend": "+1%",  "market": "MP Mandi"},
}

@router.get("/mandi-prices")
def get_mandi_prices(crop: str = None):
    """
    Get current mandi prices.
    In production, integrate with https://agmarknet.gov.in/
    API: https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
    """
    if crop:
        crop_title = crop.title()
        if crop_title in MOCK_PRICES:
            data = MOCK_PRICES[crop_title]
            # Calculate estimated revenue per acre
            estimated_yield_per_acre = _yield_estimate(crop_title)
            revenue = (data['price'] / 100) * estimated_yield_per_acre  # price per kg
            data['estimated_revenue_per_acre'] = f"₹{revenue:,.0f}"
            data['yield_estimate']             = f"~{estimated_yield_per_acre} kg/acre"
            return {crop_title: data}
        raise HTTPException(404, f"Price for {crop} not found")

    return {"prices": MOCK_PRICES, "note": "Prices in ₹ per quintal. Updated daily from APMC data."}


def _yield_estimate(crop: str) -> int:
    """Average yield per acre in kg for common crops."""
    yields = {
        "Rice": 2000, "Wheat": 1800, "Maize": 2500, "Tomato": 15000,
        "Potato": 10000, "Onion": 8000, "Cotton": 500, "Mustard": 800,
        "Sugarcane": 35000, "Soybean": 1000, "Groundnut": 1200, "Barley": 1500,
    }
    return yields.get(crop, 1000)
