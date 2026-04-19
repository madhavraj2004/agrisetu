from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from ..database import get_db, Product, Order, User

router = APIRouter(prefix="/marketplace", tags=["marketplace"])

# ── Schemas ───────────────────────────────────────────────────
class ProductIn(BaseModel):
    name:        str
    category:    str
    description: str = ""
    price:       float
    quantity:    float
    unit:        str = "kg"
    location:    str = ""
    image_url:   str = ""
    seller_id:   int

class OrderIn(BaseModel):
    product_id:  int
    buyer_id:    int
    quantity:    float
    price_agreed: float
    notes:       str = ""

# ── Product routes ────────────────────────────────────────────

@router.get("/products")
def list_products(
    category: Optional[str] = None,
    search:   Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    location:  Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Browse all available produce listings with filters."""
    q = db.query(Product).filter(Product.is_available == True)

    if category:
        q = q.filter(Product.category.ilike(f"%{category}%"))
    if search:
        q = q.filter(Product.name.ilike(f"%{search}%"))
    if min_price:
        q = q.filter(Product.price >= min_price)
    if max_price:
        q = q.filter(Product.price <= max_price)
    if location:
        q = q.filter(Product.location.ilike(f"%{location}%"))

    products = q.order_by(Product.created_at.desc()).limit(50).all()
    return [_product_json(p) for p in products]


@router.post("/products")
def create_product(data: ProductIn, db: Session = Depends(get_db)):
    """Farmer lists a new produce item."""
    seller = db.query(User).filter(User.id == data.seller_id).first()
    if not seller:
        raise HTTPException(404, "Seller not found")

    product = Product(**data.model_dump())
    db.add(product); db.commit(); db.refresh(product)
    return _product_json(product)


@router.put("/products/{product_id}")
def update_product(product_id: int, data: dict, db: Session = Depends(get_db)):
    """Farmer updates price or quantity of their listing."""
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(404, "Product not found")

    for key, val in data.items():
        if hasattr(p, key):
            setattr(p, key, val)
    p.updated_at = datetime.utcnow()
    db.commit(); db.refresh(p)
    return _product_json(p)


@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(404, "Product not found")
    p.is_available = False
    db.commit()
    return {"message": "Product removed from listing"}


@router.get("/products/seller/{seller_id}")
def seller_products(seller_id: int, db: Session = Depends(get_db)):
    """Get all products listed by a specific farmer."""
    products = db.query(Product).filter(Product.seller_id == seller_id).all()
    return [_product_json(p) for p in products]


# ── Order routes ──────────────────────────────────────────────

@router.post("/orders")
def place_order(data: OrderIn, db: Session = Depends(get_db)):
    """Buyer places an order for a product."""
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(404, "Product not found")
    if data.quantity > product.quantity:
        raise HTTPException(400, f"Only {product.quantity} {product.unit} available")

    order = Order(
        product_id   = data.product_id,
        buyer_id     = data.buyer_id,
        seller_id    = product.seller_id,
        quantity     = data.quantity,
        price_agreed = data.price_agreed,
        total_amount = data.quantity * data.price_agreed,
        notes        = data.notes,
    )
    # Deduct stock
    product.quantity -= data.quantity
    if product.quantity <= 0:
        product.is_available = False

    db.add(order); db.commit(); db.refresh(order)
    return {"order_id": order.id, "total": order.total_amount, "status": order.status}


@router.patch("/orders/{order_id}/status")
def update_order_status(order_id: int, status: str, db: Session = Depends(get_db)):
    """Update order status: confirmed | dispatched | delivered | cancelled."""
    valid = ["confirmed", "dispatched", "delivered", "cancelled"]
    if status not in valid:
        raise HTTPException(400, f"Status must be one of: {valid}")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Order not found")

    order.status = status
    db.commit()
    return {"order_id": order_id, "status": status}


@router.get("/orders/buyer/{buyer_id}")
def buyer_orders(buyer_id: int, db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.buyer_id == buyer_id)\
                .order_by(Order.created_at.desc()).all()
    return [_order_json(o) for o in orders]


@router.get("/orders/seller/{seller_id}")
def seller_orders(seller_id: int, db: Session = Depends(get_db)):
    orders = db.query(Order).filter(Order.seller_id == seller_id)\
                .order_by(Order.created_at.desc()).all()
    return [_order_json(o) for o in orders]


# ── Dashboard stats ───────────────────────────────────────────

@router.get("/stats/farmer/{farmer_id}")
def farmer_stats(farmer_id: int, db: Session = Depends(get_db)):
    """Aggregated stats for a farmer's dashboard."""
    products = db.query(Product).filter(Product.seller_id == farmer_id).all()
    orders   = db.query(Order).filter(Order.seller_id == farmer_id).all()

    total_revenue  = sum(o.total_amount for o in orders if o.status == "delivered")
    pending_orders = sum(1 for o in orders if o.status in ["pending", "confirmed"])
    active_listings= sum(1 for p in products if p.is_available)

    return {
        "total_revenue":   round(total_revenue, 2),
        "total_orders":    len(orders),
        "pending_orders":  pending_orders,
        "active_listings": active_listings,
        "products":        len(products),
    }


# ── Helpers ───────────────────────────────────────────────────

def _product_json(p: Product) -> dict:
    return {
        "id":          p.id,
        "name":        p.name,
        "category":    p.category,
        "description": p.description,
        "price":       p.price,
        "quantity":    p.quantity,
        "unit":        p.unit,
        "location":    p.location,
        "image_url":   p.image_url,
        "is_available":p.is_available,
        "seller_id":   p.seller_id,
        "created_at":  p.created_at.isoformat() if p.created_at else None,
    }

def _order_json(o: Order) -> dict:
    return {
        "id":           o.id,
        "product_id":   o.product_id,
        "quantity":     o.quantity,
        "price_agreed": o.price_agreed,
        "total_amount": o.total_amount,
        "status":       o.status,
        "notes":        o.notes,
        "created_at":   o.created_at.isoformat() if o.created_at else None,
    }
