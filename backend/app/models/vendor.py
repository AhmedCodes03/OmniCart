from ..extensions import db
from datetime import datetime

class Vendor(db.Model):
    __tablename__ = "vendors"

    # Attributes
    vendor_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    store_name = db.Column(db.String(150))
    phone = db.Column(db.String(20))
    is_approved = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.now())

    # Relationships
    products = db.relationship("Product", back_populates="vendor", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "vendor_id": self.vendor_id,
            "name": self.name,
            "email": self.email,
            "store_name": self.store_name,
            "phone": self.phone,
            "is_approved": self.is_approved,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }