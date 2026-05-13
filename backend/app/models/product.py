from ..extensions import db
from datetime import datetime

class Product(db.Model):
    __tablename__ = "products"

    # Attributes
    product_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey("vendors.vendor_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("categories.category_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    stock_qty = db.Column(db.Integer, default=0)
    brand = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.now())

    # Relationships
    vendor = db.relationship("Vendor", back_populates="products")
    category = db.relationship("Category", back_populates="products")
    order_items = db.relationship("OrderItem", back_populates="product")
    reviews = db.relationship("Review", back_populates="product", cascade="all, delete-orphan")
    cart_items = db.relationship("Cart", back_populates="product", cascade="all, delete-orphan")
    recommendations = db.relationship("Recommendation", back_populates="product", cascade="all, delete-orphan")

    __table_args__ = (
        db.Index("idx_vendor", "vendor_id"),
        db.Index("idx_category", "category_id"),
    )

    def __init__(self, **kwargs):
        super(Product, self).__init__(**kwargs)

    def to_dict(self):

        ratings = [r.rating for r in self.reviews]
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0
        
        return {
            "product_id": self.product_id,
            "vendor_id": self.vendor_id,
            "category_id": self.category_id,
            "name": self.name,
            "description": self.description,
            "price": float(self.price),
            "stock_qty": self.stock_qty,
            "brand": self.brand,
            "is_active": self.is_active,
            "avg_rating": avg_rating,
            "review_count": len(ratings),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }