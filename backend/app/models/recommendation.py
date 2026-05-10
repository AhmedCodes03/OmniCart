from ..extensions import db
from datetime import datetime

class Recommendation(db.Model):
    __tablename__ = "recommendations"

    # Attributes
    rec_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.customer_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.product_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    score = db.Column(db.Numeric(5, 4), nullable=False)
    explanation = db.Column(db.Text)
    generated_at = db.Column(db.TIMESTAMP, server_default=db.func.now())

    # Relationships
    customer = db.relationship("Customer", back_populates="recommendations")
    product = db.relationship("Product", back_populates="recommendations")

    __table_args__ = (
        db.UniqueConstraint("customer_id", "product_id", name="unique_recommendation"),
        db.Index("idx_customer_rec", "customer_id"),
    )

    def to_dict(self):
        return {
            "rec_id": self.rec_id,
            "customer_id": self.customer_id,
            "product_id": self.product_id,
            "score": float(self.score),
            "explanation": self.explanation,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None
        }