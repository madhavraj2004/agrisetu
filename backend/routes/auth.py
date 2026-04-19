from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

from ..database import get_db, User

router   = APIRouter(prefix="/auth", tags=["auth"])
pwd_ctx  = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET   = os.getenv("JWT_SECRET", "agrisetu-secret-change-in-prod")
ALGO     = "HS256"

# ── Pydantic Schemas ──────────────────────────────────────────
class RegisterIn(BaseModel):
    name:     str
    email:    EmailStr
    phone:    str
    password: str
    role:     str = "farmer"   # farmer | buyer
    location: str = ""
    state:    str = ""

class LoginIn(BaseModel):
    email:    EmailStr
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type:   str
    user: dict

# ── Helpers ───────────────────────────────────────────────────
def make_token(user_id: int, role: str) -> str:
    payload = {"sub": str(user_id), "role": role, "exp": datetime.utcnow() + timedelta(days=7)}
    return jwt.encode(payload, SECRET, algorithm=ALGO)

def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET, algorithms=[ALGO])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ── Routes ────────────────────────────────────────────────────
@router.post("/register", response_model=TokenOut)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(400, "Email already registered")

    user = User(
        name     = data.name,
        email    = data.email,
        phone    = data.phone,
        password = pwd_ctx.hash(data.password),
        role     = data.role,
        location = data.location,
        state    = data.state,
    )
    db.add(user); db.commit(); db.refresh(user)

    return TokenOut(
        access_token = make_token(user.id, user.role),
        token_type   = "bearer",
        user         = {"id": user.id, "name": user.name, "role": user.role}
    )

@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not pwd_ctx.verify(data.password, user.password):
        raise HTTPException(401, "Invalid email or password")

    return TokenOut(
        access_token = make_token(user.id, user.role),
        token_type   = "bearer",
        user         = {"id": user.id, "name": user.name, "role": user.role, "location": user.location}
    )
