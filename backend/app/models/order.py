from ..extensions import db
from datetime import datetime

class Order(db.Model):
    __tablename__ = "orders"

    # Attributes
    order_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.customer_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    status = db.Column(db.Enum("pending", "confirmed", "shipped", "delivered", "cancelled"), default="pending")
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    placed_at = db.Column(db.TIMESTAMP, server_default=db.func.now())

    # Relationships
    customer = db.relationship("Customer", back_populates="orders")
    order_items = db.relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = db.relationship("Payment", back_populates="order", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        db.Index("idx_customer_order", "customer_id"),
    )

    def to_dict(self):
        return {
            "order_id": self.order_id,
            "customer_id": self.customer_id,
            "status": self.status,
            "total_amount": float(self.total_amount),
            "placed_at": self.placed_at.isoformat() if self.placed_at else None
        }


class OrderItem(db.Model):
    __tablename__ = "order_items"

    # Attributes
    item_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.order_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.product_id", ondelete="RESTRICT", onupdate="CASCADE"), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Numeric(10, 2), nullable=False)

    # Relationships
    order = db.relationship("Order", back_populates="order_items")
    product = db.relationship("Product", back_populates="order_items")

    __table_args__ = (
        db.Index("idx_order_item", "order_id"),
        db.Index("idx_product_item", "product_id")
    )

    def to_dict(self):
        return {
            "item_id": self.item_id,
            "order_id": self.order_id,
            "product_id": self.product_id,
            "quantity": self.quantity,
            "unit_price": float(self.unit_price)
        }