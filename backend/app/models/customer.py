from ..extensions import db
from datetime import datetime

class Customer(db.Model):
    __tablename__ = "customers"

    # Attributes
    customer_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    date_of_birth = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.now())

    # Relationships
    orders = db.relationship("Order", back_populates="customer", cascade="all, delete-orphan")
    reviews = db.relationship("Review", back_populates="customer", cascade="all, delete-orphan")
    cart = db.relationship("Cart", back_populates="customer", cascade="all, delete-orphan")
    recommendations = db.relationship("Recommendation", back_populates="customer", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "customer_id": self.customer_id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "date_of_birth": str(self.date_of_birth) if self.date_of_birth else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }