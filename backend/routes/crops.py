from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import json

from ..database import get_db, CropAdvisory
from ..ml.predict import predict_crops

router = APIRouter(prefix="/crops", tags=["crops"])

# ── Schemas ───────────────────────────────────────────────────
class SoilInput(BaseModel):
    N:           float = Field(..., ge=0,   le=300,  description="Nitrogen kg/ha")
    P:           float = Field(..., ge=0,   le=150,  description="Phosphorus kg/ha")
    K:           float = Field(..., ge=0,   le=300,  description="Potassium kg/ha")
    temperature: float = Field(..., ge=5,   le=50,   description="°C")
    humidity:    float = Field(..., ge=10,  le=100,  description="%")
    ph:          float = Field(..., ge=3.5, le=9.5,  description="Soil pH")
    rainfall:    float = Field(..., ge=20,  le=2500, description="mm/year")
    user_id:     int | None = None

class CropResult(BaseModel):
    crop:       str
    confidence: float
    reasons:    list[str]

class PredictOut(BaseModel):
    top3:           list[CropResult]
    model_accuracy: float
    inputs_used:    dict

# ── Routes ────────────────────────────────────────────────────

@router.post("/predict", response_model=PredictOut)
def predict(soil: SoilInput, db: Session = Depends(get_db)):
    """
    Main crop recommendation endpoint.
    Returns top 3 crops with confidence scores and human-readable reasons.
    """
    soil_dict = soil.model_dump(exclude={"user_id"})
    result    = predict_crops(soil_dict)

    # Optionally save to history if user is logged in
    if soil.user_id:
        advisory = CropAdvisory(
            user_id     = soil.user_id,
            top_crop    = result['top3'][0]['crop'],
            confidence  = result['top3'][0]['confidence'],
            full_result = json.dumps(result),
            **soil_dict
        )
        db.add(advisory)
        db.commit()

    return result


@router.get("/history/{user_id}")
def get_history(user_id: int, db: Session = Depends(get_db)):
    """Get a farmer's past crop advisory history."""
    records = db.query(CropAdvisory)\
                .filter(CropAdvisory.user_id == user_id)\
                .order_by(CropAdvisory.created_at.desc())\
                .limit(20).all()

    return [
        {
            "id":          r.id,
            "top_crop":    r.top_crop,
            "confidence":  r.confidence,
            "N": r.N, "P": r.P, "K": r.K,
            "ph":          r.ph,
            "rainfall":    r.rainfall,
            "temperature": r.temperature,
            "date":        r.created_at.isoformat(),
        }
        for r in records
    ]


@router.get("/crops-list")
def crops_list():
    """Return list of all crops the model can predict."""
    from ..ml.predict import metadata
    return {"crops": metadata['crops'], "count": len(metadata['crops'])}
