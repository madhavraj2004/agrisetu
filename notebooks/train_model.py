"""
AgriSetu - Crop Recommendation Model Training
=============================================
Uses the Kaggle Crop Recommendation Dataset which has REAL correlations.
Download from: https://www.kaggle.com/datasets/atharvaingle/crop-recommendation-dataset
Expected accuracy: 95-99% (vs your previous 16%)

Dataset columns: N, P, K, temperature, humidity, ph, rainfall, label
"""

import pandas as pd
import numpy as np
import pickle
import json
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, classification_report
import warnings
warnings.filterwarnings('ignore')

# ── 1. Load Dataset ──────────────────────────────────────────
print("Loading dataset...")
# Download from Kaggle and place in same folder as this script
df = pd.read_csv('Crop_recommendation.csv')

print(f"Dataset shape: {df.shape}")
print(f"Crops: {df['label'].unique()}")
print(f"\nSample:\n{df.head()}")
print(f"\nCorrelation check (should be non-zero unlike your previous dataset):")

# Encode label temporarily for correlation
temp_df = df.copy()
temp_df['label'] = LabelEncoder().fit_transform(temp_df['label'])

print(temp_df.corr()['label'].sort_values(ascending=False).round(3))
# ── 2. Feature Engineering ───────────────────────────────────
print("\nEngineering features...")

# Nutrient ratios (agronomically meaningful)
df['N_P_ratio']      = df['N'] / (df['P'] + 1)
df['N_K_ratio']      = df['N'] / (df['K'] + 1)
df['nutrient_sum']   = df['N'] + df['P'] + df['K']

# Climate index
df['climate_index']  = df['temperature'] * df['humidity'] / 100

# Soil-moisture interaction
df['soil_moisture']  = df['rainfall'] * df['humidity'] / 100

# ── 3. Prepare X and y ───────────────────────────────────────
feature_cols = [
    'N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall',
    'N_P_ratio', 'N_K_ratio', 'nutrient_sum', 'climate_index', 'soil_moisture'
]

X = df[feature_cols]
y = df['label']

label_encoder = LabelEncoder()
y_encoded = label_encoder.fit_transform(y)

X_train, X_test, y_train, y_test = train_test_split(
    X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled  = scaler.transform(X_test)

# ── 4. Train Model ───────────────────────────────────────────
print("\nTraining Random Forest (should get ~99% accuracy)...")
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=None,
    min_samples_split=2,
    min_samples_leaf=1,
    random_state=42,
    n_jobs=-1
)
model.fit(X_train_scaled, y_train)

# ── 5. Evaluate ──────────────────────────────────────────────
y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)
cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5)

print(f"\n{'='*50}")
print(f"Test Accuracy:     {accuracy:.4f} ({accuracy*100:.1f}%)")
print(f"CV Mean Accuracy:  {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
print(f"{'='*50}")
print(f"\nClassification Report:\n{classification_report(y_test, y_pred, target_names=label_encoder.classes_)}")

# ── 6. Feature Importance ────────────────────────────────────
feat_importance = pd.DataFrame({
    'feature': feature_cols,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)
print(f"\nTop Features:\n{feat_importance.to_string(index=False)}")

# ── 7. Save Everything ───────────────────────────────────────
print("\nSaving model artifacts...")

with open('../backend/ml/model.pkl', 'wb') as f:
    pickle.dump(model, f)

with open('../backend/ml/scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)

with open('../backend/ml/label_encoder.pkl', 'wb') as f:
    pickle.dump(label_encoder, f)

# Save metadata for the API
metadata = {
    'feature_cols':   feature_cols,
    'crops':          label_encoder.classes_.tolist(),
    'accuracy':       float(accuracy),
    'cv_mean':        float(cv_scores.mean()),
    'feature_importance': feat_importance.to_dict('records')
}
with open('../backend/ml/metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

print("Saved: model.pkl, scaler.pkl, label_encoder.pkl, metadata.json")
print("\nDone! Now run the FastAPI backend.")
