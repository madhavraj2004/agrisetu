"""
AgriSetu - Database Setup
Uses SQLite for local dev (zero setup), PostgreSQL for production.
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# SQLite for dev — change to PostgreSQL URL for production
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./agrisetu.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ── Models ────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(100), nullable=False)
    email        = Column(String(120), unique=True, index=True)
    phone        = Column(String(15), unique=True)
    password     = Column(String(200), nullable=False)
    role         = Column(String(20), default="farmer")   # farmer | buyer | admin
    location     = Column(String(100))
    state        = Column(String(50))
    created_at   = Column(DateTime, default=datetime.utcnow)
    is_active    = Column(Boolean, default=True)

    products     = relationship("Product", back_populates="seller")
    orders_made  = relationship("Order", foreign_keys="Order.buyer_id", back_populates="buyer")
    orders_recv  = relationship("Order", foreign_keys="Order.seller_id", back_populates="seller")


class Product(Base):
    __tablename__ = "products"
    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String(100), nullable=False)
    category     = Column(String(50))           # cereals, vegetables, spices, etc.
    description  = Column(Text)
    price        = Column(Float, nullable=False) # per kg in ₹
    quantity     = Column(Float, nullable=False) # kg available
    unit         = Column(String(20), default="kg")
    location     = Column(String(100))
    image_url    = Column(String(300))
    is_available = Column(Boolean, default=True)
    seller_id    = Column(Integer, ForeignKey("users.id"))
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    seller       = relationship("User", back_populates="products")
    orders       = relationship("Order", back_populates="product")


class Order(Base):
    __tablename__ = "orders"
    id           = Column(Integer, primary_key=True, index=True)
    product_id   = Column(Integer, ForeignKey("products.id"))
    buyer_id     = Column(Integer, ForeignKey("users.id"))
    seller_id    = Column(Integer, ForeignKey("users.id"))
    quantity     = Column(Float)
    price_agreed = Column(Float)
    total_amount = Column(Float)
    status       = Column(String(30), default="pending")  # pending|confirmed|dispatched|delivered|cancelled
    notes        = Column(Text)
    created_at   = Column(DateTime, default=datetime.utcnow)

    product      = relationship("Product", back_populates="orders")
    buyer        = relationship("User", foreign_keys=[buyer_id], back_populates="orders_made")
    seller       = relationship("User", foreign_keys=[seller_id], back_populates="orders_recv")


class CropAdvisory(Base):
    """Store each farmer's soil input + recommendation for history."""
    __tablename__ = "crop_advisories"
    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id"))
    N            = Column(Float)
    P            = Column(Float)
    K            = Column(Float)
    temperature  = Column(Float)
    humidity     = Column(Float)
    ph           = Column(Float)
    rainfall     = Column(Float)
    top_crop     = Column(String(50))
    confidence   = Column(Float)
    full_result  = Column(Text)   # JSON string
    created_at   = Column(DateTime, default=datetime.utcnow)


# ── DB helpers ────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")
