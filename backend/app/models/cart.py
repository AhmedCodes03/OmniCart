from ..extensions import db
from datetime import datetime

class Cart(db.Model):
    __tablename__ = "cart"

    # Attributes
    cart_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.customer_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.product_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    added_at = db.Column(db.TIMESTAMP, server_default=db.func.now())

    # Relationships
    customer = db.relationship("Customer", back_populates="cart")
    product = db.relationship("Product", back_populates="cart_items")

    __table_args__ = (
        db.UniqueConstraint("customer_id", "product_id", name="unique_cart_item"),
        db.Index("idx_customer_cart", "customer_id"),
    )

    def to_dict(self):
        return {
            "cart_id": self.cart_id,
            "customer_id": self.customer_id,
            "product_id": self.product_id,
            "quantity": self.quantity,
            "added_at": self.added_at.isoformat() if self.added_at else None
        }