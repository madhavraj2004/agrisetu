"""
AgriSetu - Crop Prediction Logic
Loads trained model and returns top-3 crop recommendations with reasoning.
"""
import pickle
import json
import numpy as np
from pathlib import Path

BASE = Path(__file__).parent

# Load all artifacts once at startup
with open(BASE / 'model.pkl', 'rb') as f:
    model = pickle.load(f)
with open(BASE / 'scaler.pkl', 'rb') as f:
    scaler = pickle.load(f)
with open(BASE / 'label_encoder.pkl', 'rb') as f:
    label_encoder = pickle.load(f)
with open(BASE / 'metadata.json') as f:
    metadata = json.load(f)

FEATURE_COLS = metadata['feature_cols']

# Ideal ranges per parameter (for generating human-readable reasons)
PARAM_LABELS = {
    'N':             ('Nitrogen',     'kg/ha'),
    'P':             ('Phosphorus',   'kg/ha'),
    'K':             ('Potassium',    'kg/ha'),
    'temperature':   ('Temperature',  '°C'),
    'humidity':      ('Humidity',     '%'),
    'ph':            ('Soil pH',      ''),
    'rainfall':      ('Rainfall',     'mm'),
}

def _engineer_features(raw: dict) -> list:
    """Add derived features matching training pipeline."""
    N, P, K = raw['N'], raw['P'], raw['K']
    T, H, R  = raw['temperature'], raw['humidity'], raw['rainfall']
    return [
        N, P, K, T, H, raw['ph'], R,
        N / (P + 1),          # N_P_ratio
        N / (K + 1),          # N_K_ratio
        N + P + K,            # nutrient_sum
        T * H / 100,          # climate_index
        R * H / 100,          # soil_moisture
    ]

def predict_crops(soil: dict) -> dict:
    """
    Input:
      soil = {N, P, K, temperature, humidity, ph, rainfall}
    Returns:
      {
        top3: [{crop, confidence, reasons}, ...],
        model_accuracy: float
      }
    """
    features = np.array([_engineer_features(soil)])
    scaled   = scaler.transform(features)

    # Probability for every class
    probs    = model.predict_proba(scaled)[0]
    top3_idx = np.argsort(probs)[-3:][::-1]

    results = []
    for idx in top3_idx:
        crop       = label_encoder.classes_[idx]
        confidence = round(float(probs[idx]) * 100, 1)
        reasons    = _generate_reasons(soil, crop)
        results.append({
            'crop':       crop,
            'confidence': confidence,
            'reasons':    reasons,
        })

    return {
        'top3':           results,
        'model_accuracy': round(metadata['accuracy'] * 100, 1),
        'inputs_used':    _summarise_inputs(soil),
    }

def _generate_reasons(soil: dict, crop: str) -> list[str]:
    """Generate human-readable reasons why this crop was recommended."""
    reasons = []
    ph  = soil['ph']
    tmp = soil['temperature']
    rain= soil['rainfall']
    N   = soil['N']

    if 6.0 <= ph <= 7.5:
        reasons.append(f"Soil pH {ph} is in optimal neutral range")
    elif ph < 6.0:
        reasons.append(f"Acidic soil (pH {ph}) suits this crop")
    else:
        reasons.append(f"Alkaline soil (pH {ph}) suits this crop")

    if tmp > 30:
        reasons.append(f"High temperature ({tmp}°C) favors warm-season crops")
    elif tmp < 20:
        reasons.append(f"Cool temperature ({tmp}°C) suits cold-tolerant crops")
    else:
        reasons.append(f"Moderate temperature ({tmp}°C) is ideal")

    if rain > 1500:
        reasons.append(f"High rainfall ({rain}mm) supports water-intensive crops")
    elif rain < 500:
        reasons.append(f"Low rainfall ({rain}mm) suits drought-resistant crops")
    else:
        reasons.append(f"Moderate rainfall ({rain}mm) supports diverse crops")

    if N > 200:
        reasons.append(f"High nitrogen ({N} kg/ha) boosts leafy growth")
    elif N < 100:
        reasons.append(f"Low nitrogen — consider nitrogen-fixing crops")

    return reasons[:3]  # max 3 reasons

def _summarise_inputs(soil: dict) -> dict:
    return {
        PARAM_LABELS[k][0]: f"{v} {PARAM_LABELS[k][1]}".strip()
        for k, v in soil.items() if k in PARAM_LABELS
    }
