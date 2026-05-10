from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..extensions import db
from ..models import Recommendation, Product, Review, OrderItem, Customer
from ..middleware.role_required import role_required
from ..services.recommendation_service import (
    get_similar_products,
    get_hybrid_recommendations,
    analyze_review_sentiment
)
from ..services.openai_service import generate_recommendation_reason
from sqlalchemy import func

recommendations_bp = Blueprint("recommendations", __name__, url_prefix="/api/recommendations")


@recommendations_bp.route("/", methods=["GET"])
@jwt_required()
@role_required("customer")
def get_recommendations():
    customer_id = int(get_jwt_identity())
    stored = Recommendation.query.filter_by(customer_id=customer_id)\
                                 .order_by(Recommendation.score.desc()).all()
    if stored:
        data = []
        for r in stored:
            d = r.to_dict()
            d["product"] = r.product.to_dict() if r.product else None
            data.append(d)
        return jsonify({"recommendations": data, "source": "stored", "total": len(data)}), 200

    all_products = Product.query.filter_by(is_active=True).all()
    product_ids  = [p.product_id for p in all_products]
    if not product_ids:
        return jsonify({"recommendations": [], "message": "No products available"}), 200

    scores = get_hybrid_recommendations(customer_id, product_ids, top_n=5)
    results = []
    for pid, score in scores:
        existing = Recommendation.query.filter_by(customer_id=customer_id, product_id=pid).first()
        if not existing:
            rec = Recommendation(customer_id=customer_id, product_id=pid, score=score,
                                 explanation="Recommended based on collaborative filtering and content similarity.")
            db.session.add(rec)
        product = next((p for p in all_products if p.product_id == pid), None)
        if product:
            results.append({"product_id": pid, "score": score,
                            "explanation": "Recommended based on your preferences.",
                            "product": product.to_dict()})
    db.session.commit()
    return jsonify({"recommendations": results, "source": "ml_generated", "total": len(results)}), 200


@recommendations_bp.route("/similar/<int:product_id>", methods=["GET"])
def get_similar(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    similar_scores = get_similar_products(product_id, top_n=5)
    results = []
    for pid, score in similar_scores:
        p = Product.query.get(pid)
        if p and p.is_active:
            d = p.to_dict()
            d["similarity_score"] = score
            results.append(d)
    return jsonify({"product_id": product_id, "product": product.name,
                    "similar": results, "total": len(results)}), 200


@recommendations_bp.route("/trending", methods=["GET"])
def get_trending():
    trending = db.session.query(
        Product, func.sum(OrderItem.quantity).label("total_sold")
    ).join(OrderItem, Product.product_id == OrderItem.product_id)\
     .filter(Product.is_active == True)\
     .group_by(Product.product_id, Product.vendor_id, Product.category_id, Product.name, Product.description, 
               Product.price, Product.stock_qty, Product.brand, Product.is_active, Product.created_at)\
     .order_by(func.sum(OrderItem.quantity).desc()).limit(10).all()
    data = []
    for product, total_sold in trending:
        d = product.to_dict()
        d["total_sold"] = int(total_sold)
        data.append(d)
    return jsonify({"trending": data, "total": len(data)}), 200


@recommendations_bp.route("/explain", methods=["POST"])
@jwt_required()
@role_required("customer")
def explain_recommendation():
    customer_id = int(get_jwt_identity())
    data = request.get_json()
    product_id  = data.get("product_id")
    if not product_id:
        return jsonify({"error": "product_id is required"}), 400
    customer = Customer.query.get(customer_id)
    product = Product.query.get(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    reason = generate_recommendation_reason(
        customer_name=customer.name,
        product_name=product.name,
        category=product.category.name if product.category else "General"
    )
    existing = Recommendation.query.filter_by(customer_id=customer_id, product_id=product_id).first()
    if existing:
        existing.explanation = reason
    else:
        db.session.add(Recommendation(customer_id=customer_id, product_id=product_id,
                                      score=0.85, explanation=reason))
    db.session.commit()
    return jsonify({"product": product.to_dict(), "explanation": reason,
                    "generated_by": "LLaMA via NVIDIA"}), 200


@recommendations_bp.route("/analyze-sentiment", methods=["POST"])
def analyze_sentiment():
    data = request.get_json()
    text = data.get("text", "")
    if not text:
        return jsonify({"error": "text is required"}), 400
    result = analyze_review_sentiment(text)
    return jsonify({"text": text[:100], "score": result["score"],
                    "label": result["label"], "engine": "TextBlob"}), 200


@recommendations_bp.route("/", methods=["POST"])
@jwt_required()
@role_required("admin")
def add_recommendation():
    data = request.get_json()
    required = ["customer_id", "product_id", "score"]
    missing = [f for f in required if data.get(f) is None]
    if missing:
        return jsonify({"error": f"Missing: {', '.join(missing)}"}), 400
    existing = Recommendation.query.filter_by(
        customer_id=data["customer_id"], product_id=data["product_id"]).first()
    if existing:
        return jsonify({"error": "Recommendation already exists"}), 409
    rec = Recommendation(customer_id=data["customer_id"], product_id=data["product_id"],
                         score=data["score"],
                         explanation=data.get("explanation", "Recommended by admin"))
    db.session.add(rec)
    db.session.commit()
    return jsonify({"message": "Recommendation added", "recommendation": rec.to_dict()}), 201