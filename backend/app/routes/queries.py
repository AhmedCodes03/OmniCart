"""
QUERY ROUTES
============
Exposes the 5 complex DB course queries as JSON API endpoints.

GET /api/queries/order-history      - customer order history (JOIN)
GET /api/queries/monthly-revenue    - monthly revenue report (GROUP BY + DATE_FORMAT)
GET /api/queries/top-customers      - top customers by spend (HAVING + subquery)
GET /api/queries/vendor-performance - vendor sales performance (multi-JOIN + COALESCE)
GET /api/queries/category-sentiment - category sentiment analysis (subquery + AVG)
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..queries import (
    customer_order_history,
    monthly_revenue_report,
    top_customers_by_spend,
    vendor_sales_performance,
    category_sentiment_analysis,
)
from ..middleware.role_required import role_required

queries_bp = Blueprint("queries", __name__, url_prefix="/api/queries")


@queries_bp.route("/order-history", methods=["GET"])
@jwt_required()
@role_required("customer", "admin")
def query_order_history():
    customer_id = int(get_jwt_identity())
    rows = customer_order_history(customer_id)
    return jsonify({"results": rows, "count": len(rows)}), 200


@queries_bp.route("/monthly-revenue", methods=["GET"])
@jwt_required()
@role_required("admin")
def query_monthly_revenue():
    rows = monthly_revenue_report()
    return jsonify({"results": rows, "count": len(rows)}), 200


@queries_bp.route("/top-customers", methods=["GET"])
@jwt_required()
@role_required("admin")
def query_top_customers():
    min_orders = request.args.get("min_orders", 1, type=int)
    if min_orders < 1:
        return jsonify({"error": "'min_orders' must be a positive integer"}), 400
    rows = top_customers_by_spend(min_orders)
    return jsonify({"results": rows, "count": len(rows)}), 200


@queries_bp.route("/vendor-performance", methods=["GET"])
@jwt_required()
@role_required("admin")
def query_vendor_performance():
    rows = vendor_sales_performance()
    return jsonify({"results": rows, "count": len(rows)}), 200


@queries_bp.route("/category-sentiment", methods=["GET"])
@jwt_required()
@role_required("admin")
def query_category_sentiment():
    rows = category_sentiment_analysis()
    return jsonify({"results": rows, "count": len(rows)}), 200