from ..extensions import db
from datetime import datetime

class Payment(db.Model):
    __tablename__ = "payments"

    # Attributes
    payment_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    order_id = db.Column(db.Integer, db.ForeignKey("orders.order_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False, unique=True)
    method = db.Column(db.Enum("credit_card", "debit_card", "cash_on_delivery", "bank_transfer"), nullable=False)
    status = db.Column(db.Enum("pending", "completed", "failed", "refunded"), default="pending")
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    paid_at = db.Column(db.TIMESTAMP, nullable=True)

    # Relationships
    order = db.relationship("Order", back_populates="payment")

    def to_dict(self):
        return {
            "payment_id": self.payment_id,
            "order_id": self.order_id,
            "method": self.method,
            "status": self.status,
            "amount": float(self.amount),
            "paid_at": self.paid_at.isoformat() if self.paid_at else None,
        }