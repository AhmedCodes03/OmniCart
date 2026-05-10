from ..extensions import db
from datetime import datetime

class Review(db.Model):
    __tablename__ = "reviews"

    # Attributes
    review_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    customer_id = db.Column(db.Integer, db.ForeignKey("customers.customer_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.product_id", ondelete="CASCADE", onupdate="CASCADE"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    comment = db.Column(db.Text)
    sentiment_score = db.Column(db.Numeric(3, 2), nullable=True)
    created_at = db.Column(db.TIMESTAMP, server_default=db.func.now())

    # Relationships
    customer = db.relationship("Customer", back_populates="reviews")
    product = db.relationship("Product", back_populates="reviews")

    __table_args__ = (
        db.UniqueConstraint("customer_id", "product_id", name="unique_review"),
        db.Index("idx_product_review", "product_id"),
    )

    def to_dict(self):
        return {
            "review_id": self.review_id,
            "customer_id": self.customer_id,
            "product_id": self.product_id,
            "rating": self.rating,
            "comment": self.comment,
            "sentiment_score": float(self.sentiment_score) if self.sentiment_score else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }