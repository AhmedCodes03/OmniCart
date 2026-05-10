"""
REVIEWS ROUTES
============================================
POST   /api/reviews                      - submit review (verified purchase required)
GET    /api/reviews/my                   - customer's own reviews (with product name)
PUT    /api/reviews/<id>                 - edit own review (customer only)
DELETE /api/reviews/<id>                 - delete review (own: customer | any: admin)
GET    /api/products/<id>/reviews        - product reviews with full summary stats
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import func
from ..extensions import db
from ..models import Review, Product, Order, OrderItem, Customer
from ..middleware.role_required import role_required

try:
    from textblob import TextBlob
    TEXTBLOB_AVAILABLE = True
except ImportError:
    TEXTBLOB_AVAILABLE = False

reviews_bp = Blueprint("reviews", __name__, url_prefix="/api")


# ==========================
# Helper Functions
# ==========================

def _compute_sentiment(text: str) -> float:
    """
    Returns a normalised polarity score in [0.0, 1.0].
    TextBlob raw polarity is [-1.0, 1.0] → mapped to [0.0, 1.0].
    Falls back to neutral 0.5 if TextBlob is not installed or text is empty.
    """
    if not TEXTBLOB_AVAILABLE or not text or not text.strip():
        return 0.5
    raw = TextBlob(text).sentiment.polarity   # -1.0 to 1.0
    return round((raw + 1.0) / 2.0, 2)        # 0.0 to 1.0
 
 
def _validate_rating(value) -> tuple:
    """
    Returns (int_rating, None) on success or (None, error_string) on failure.
    Rejects booleans, floats, strings, and values outside 1–5.
    """
    if isinstance(value, bool):
        return None, "'rating' must be an integer between 1 and 5"
    if isinstance(value, float) and not value.is_integer():
        return None, "'rating' must be an integer between 1 and 5"
    try:
        rating = int(value)
    except (TypeError, ValueError):
        return None, "'rating' must be an integer between 1 and 5"
    if rating not in range(1, 6):
        return None, "'rating' must be between 1 and 5"
    return rating, None
 
 
def _build_review_stats(product_id: int) -> dict:
    """
    Returns avg_rating, avg_sentiment, and rating_distribution for a product
    using a single SQL aggregation query — no Python-side averaging.
    avg_rating is computed live here; no cached column on Product is needed.
    """
    agg = (
        db.session.query(
            func.round(func.avg(Review.rating), 1).label("avg_rating"),
            func.round(func.avg(Review.sentiment_score), 2).label("avg_sentiment"),
            func.count(Review.review_id).label("total"),
        )
        .filter(Review.product_id == product_id)
        .first()
    )
 
    dist_rows = (
        db.session.query(Review.rating, func.count(Review.review_id).label("cnt"))
        .filter(Review.product_id == product_id)
        .group_by(Review.rating)
        .all()
    )
    distribution = {str(i): 0 for i in range(1, 6)}
    for row in dist_rows:
        distribution[str(row.rating)] = row.cnt
 
    return {
        "avg_rating": float(agg.avg_rating)    if agg.avg_rating    is not None else None,
        "avg_sentiment": float(agg.avg_sentiment) if agg.avg_sentiment is not None else None,
        "total_reviews": int(agg.total),
        "rating_distribution": distribution,
    }


# ========================================
# SUBMIT REVIEW
# POST /api/reviews
# ========================================
@reviews_bp.route("/reviews", methods=["POST"])
@jwt_required()
@role_required("customer")
def submit_review():
    customer_id = int(get_jwt_identity())
    data = request.get_json() or {}

    # Required field presence
    if data.get("product_id") is None:
        return jsonify({"error": "'product_id' is required"}), 400
    if data.get("rating") is None:
        return jsonify({"error": "'rating' is required"}), 400

    # product_id must be a positive integer
    product_id = data["product_id"]
    if not isinstance(product_id, int) or isinstance(product_id, bool) or product_id < 1:
        return jsonify({"error": "'product_id' must be a positive integer"}), 400

    # rating strict validation
    rating, rating_err = _validate_rating(data["rating"])
    if rating_err:
        return jsonify({"error": rating_err}), 400

    # Product must exist
    product = Product.query.filter_by(product_id=product_id, is_active=True).first()
    if not product:
        return jsonify({"error": "Product not found"}), 404

    # Verified purchase check
    purchased = (
        db.session.query(OrderItem)
        .join(Order, Order.order_id == OrderItem.order_id)
        .filter(
            Order.customer_id == customer_id,
            OrderItem.product_id == product_id,
            Order.status.in_(["confirmed", "shipped", "delivered"]),
        )
        .first()
    )
    if not purchased:
        return jsonify({"error": "You can only review products you have purchased"}), 403

    # One review per customer per product
    if Review.query.filter_by(customer_id=customer_id, product_id=product_id).first():
        return jsonify({"error": "You have already reviewed this product"}), 409

    comment = str(data.get("comment") or "").strip()
    sentiment_score = _compute_sentiment(comment)

    review = Review(
        customer_id=customer_id,
        product_id=product_id,
        rating=rating,
        comment=comment,
        sentiment_score=sentiment_score,
    )
    db.session.add(review)

    db.session.flush()

    db.session.commit()

    return jsonify({
        "message": "Review submitted",
        "review": review.to_dict(),
        "sentiment_score": sentiment_score,
    }), 201


# ======================================
# MY REVIEWS
# GET /api/reviews/my
# ======================================
@reviews_bp.route("/reviews/my", methods=["GET"])
@jwt_required()
@role_required("customer")
def my_reviews():
    customer_id = int(get_jwt_identity())

    rows = (
        db.session.query(Review, Product)
        .join(Product, Review.product_id == Product.product_id)
        .filter(Review.customer_id == customer_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    result = []
    for review, product in rows:
        entry = review.to_dict()
        entry["product_name"] = product.name  if product else None
        entry["product_brand"] = product.brand if product else None
        result.append(entry)

    return jsonify({"reviews": result, "count": len(result)}), 200


# ======================================
# EDIT REVIEW
# PUT /api/reviews/<review_id>
# ======================================
@reviews_bp.route("/reviews/<int:review_id>", methods=["PUT"])
@jwt_required()
@role_required("customer")
def edit_review(review_id):
    customer_id = int(get_jwt_identity())
    data = request.get_json() or {}

    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Ownership check: customers may only edit their own reviews
    review = Review.query.filter_by(review_id=review_id, customer_id=customer_id).first()
    if not review:
        return jsonify({"error": "Review not found"}), 404

    # rating: validate only if provided
    if "rating" in data:
        rating, rating_err = _validate_rating(data["rating"])
        if rating_err:
            return jsonify({"error": rating_err}), 400
        review.rating = rating

    # comment: recalculate sentiment if changed
    if "comment" in data:
        comment = str(data["comment"] or "").strip()
        review.comment = comment
        review.sentiment_score = _compute_sentiment(comment)

    db.session.commit()

    return jsonify({
        "message": "Review updated",
        "review": review.to_dict(),
    }), 200


# =====================================
# DELETE REVIEW
# DELETE /api/reviews/<review_id>
# Customers: own reviews only
# Admins: any review
# Vendors: forbidden
# =====================================
@reviews_bp.route("/reviews/<int:review_id>", methods=["DELETE"])
@jwt_required()
def delete_review(review_id):
    claims = get_jwt()
    role = claims.get("role")
    identity_id = int(get_jwt_identity())

    # Vendors are not allowed to delete reviews
    if role == "vendor":
        return jsonify({"error": "Vendors are not permitted to delete reviews"}), 403

    review = Review.query.get(review_id)
    if not review:
        return jsonify({"error": "Review not found"}), 404

    # Customers can only delete their own reviews
    if role == "customer" and review.customer_id != identity_id:
        return jsonify({"error": "You can only delete your own reviews"}), 403

    # Admins can delete any review; no further check needed
    product_id = review.product_id
    db.session.delete(review)

    db.session.flush()

    db.session.commit()
    return jsonify({"message": "Review deleted"}), 200


# ============================================
# PRODUCT REVIEWS - with full summary stats
# GET /api/products/<id>/reviews
# ============================================
@reviews_bp.route("/products/<int:product_id>/reviews", methods=["GET"])
def get_product_reviews(product_id):
    product = Product.query.filter_by(product_id=product_id, is_active=True).first()
    if not product:
        return jsonify({"error": "Product not found"}), 404

    rows = (
        db.session.query(Review, Customer)
        .join(Customer, Review.customer_id == Customer.customer_id)
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    review_list = []
    for review, customer in rows:
        entry = review.to_dict()
        entry["customer_name"] = customer.name if customer else None
        review_list.append(entry)

    stats = _build_review_stats(product_id)

    return jsonify({
        "product_id": product_id,
        "product_name": product.name,
        "reviews": review_list,
        "total_reviews": stats["total_reviews"],
        "avg_rating": stats["avg_rating"],
        "avg_sentiment": stats["avg_sentiment"],
        "rating_distribution": stats["rating_distribution"],
    }), 200