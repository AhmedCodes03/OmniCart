"""
ADMIN ROUTES
=======================================================
GET  /api/admin/users                           - list customers + vendors
POST /api/admin/deactivate                      - calls DeactivateUser stored proc
GET  /api/admin/stats                           - platform-wide analytics
GET  /api/admin/vendors/pending                 - unapproved vendors
POST /api/admin/vendors/<id>/approve            - approve vendor
GET  /api/admin/products                        - full catalog
GET  /api/admin/categories                      - list all categories
POST /api/admin/categories                      - add category
DELETE /api/admin/categories/<id>               - delete category (safe FK check)
GET  /api/admin/all-customers                   - all active customers (n8n weekly digest)
GET  /api/admin/low-stock                       - low stock products  (n8n alert)
GET  /api/admin/abandoned-carts                 - carts older than 24 h (n8n abandonment)
POST /api/admin/trigger/abandoned-carts         - trigger cart abandonment workflow
POST /api/admin/trigger/low-stock               - trigger low stock workflow
POST /api/admin/trigger/weekly-digest           - trigger weekly digest workflow
"""

from datetime import datetime, timedelta, UTC
import os
import requests as http_requests
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, text
from ..extensions import db
from ..models import Customer, Vendor, Product, Order, OrderItem, Cart, Category, Recommendation
from ..middleware.role_required import role_required
from .validations import clean_str, extract_sp_error

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

# ==================
# LIST USERS
# ==================
@admin_bp.route("/users", methods=["GET"])
@jwt_required()
@role_required("admin")
def list_users():
    user_type = request.args.get("type", "all").lower()

    if user_type not in ("all", "customer", "vendor"):
        return jsonify({"error": "'type' must be 'all', 'customer', or 'vendor'"}), 400

    result = {}
    if user_type in ("all", "customer"):
        customers = Customer.query.order_by(Customer.created_at.desc()).all()
        result["customers"] = [c.to_dict() for c in customers]
    if user_type in ("all", "vendor"):
        vendors = Vendor.query.order_by(Vendor.created_at.desc()).all()
        result["vendors"] = [v.to_dict() for v in vendors]

    return jsonify(result), 200


# =======================================================
# DEACTIVATE USER - calls DeactivateUser stored proc
# =======================================================
@admin_bp.route("/deactivate", methods=["POST"])
@jwt_required()
@role_required("admin")
def deactivate_user():
    admin_id = int(get_jwt_identity())
    data = request.get_json() or {}

    # Required field presence
    for field in ("user_id", "user_type", "reason"):
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400

    # user_id must be a positive integer
    user_id = data["user_id"]
    if not isinstance(user_id, int) or isinstance(user_id, bool) or user_id < 1:
        return jsonify({"error": "'user_id' must be a positive integer"}), 400

    user_type = clean_str(data["user_type"])
    if not user_type:
        return jsonify({"error": "Invalid 'user_type'"}), 400
    user_type = user_type.lower()

    if user_type not in ("customer", "vendor"):
        return jsonify({"error": "'user_type' must be 'customer' or 'vendor'"}), 400

    reason = clean_str(data["reason"])
    if not reason:
        return jsonify({"error": "'reason' cannot be empty"}), 400

    try:
        result = db.session.execute(
            text("CALL DeactivateUser(:admin_id, :user_id, :user_type, :reason)"),
            {
                "admin_id": admin_id,
                "user_id": user_id,
                "user_type": user_type,
                "reason":reason,
            },
        )
        row = result.fetchone()

        # Stored proc result safety
        if not row:
            db.session.rollback()
            return jsonify({"error": "Deactivation failed: no result from database"}), 500

        db.session.commit()
        return jsonify({"message": row[0]}), 200

    except Exception as e:
        db.session.rollback()
        sp_msg = extract_sp_error(e)
        return jsonify({"error": sp_msg or "Deactivation failed"}), 400


# =======================
# PLATFORM STATS
# =======================
@admin_bp.route("/stats", methods=["GET"])
@jwt_required()
@role_required("admin")
def platform_stats():
    # Totals; single aggregation query
    totals = db.session.query(
        func.count(Order.order_id).label("total_orders"),
        func.coalesce(func.sum(Order.total_amount), 0).label("total_revenue"),
    ).first()

    # Monthly summary: last 12 months, cancelled orders excluded
    # GROUP BY the full expression (not alias string) for strict-mode MySQL
    month_expr = func.date_format(Order.placed_at, "%Y-%m")
    monthly = (
        db.session.query(
            month_expr.label("month"),
            func.count(Order.order_id).label("orders"),
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
        )
        .filter(Order.status != "cancelled")
        .group_by(month_expr)
        .order_by(month_expr.desc())   # most recent first
        .limit(12)
        .all()
    )

    # Top 5 products by revenue
    # GROUP BY all non-aggregated columns selected (required for strict mode)
    top_products = (
        db.session.query(
            Product.product_id,
            Product.name,
            func.coalesce(
                func.sum(OrderItem.quantity * OrderItem.unit_price), 0
            ).label("revenue"),
            func.coalesce(func.sum(OrderItem.quantity), 0).label("units_sold"),
        )
        .join(OrderItem, Product.product_id == OrderItem.product_id)
        .group_by(Product.product_id, Product.name)
        .order_by(
            func.coalesce(
                func.sum(OrderItem.quantity * OrderItem.unit_price), 0
            ).desc()
        )
        .limit(5)
        .all()
    )

    # Category Distribution
    category_dist = (
        db.session.query(
            Category.name,
            func.count(Product.product_id).label("count")
        )
        .join(Product, Category.category_id == Product.category_id)
        .group_by(Category.name)
        .all()
    )

    # Counts
    total_customers = Customer.query.filter_by(is_active=True).count()
    total_vendors = Vendor.query.filter_by(is_active=True, is_approved=True).count()
    total_products = Product.query.filter_by(is_active=True).count()

    return jsonify({
        "total_orders": int(totals.total_orders),
        "total_revenue": round(float(totals.total_revenue), 2),
        "total_customers": total_customers,
        "total_vendors": total_vendors,
        "total_products": total_products,
        "monthly_summary": [
            {
                "month": r.month,
                "orders": int(r.orders),
                "revenue": round(float(r.revenue), 2),
            }
            for r in monthly
        ],
        "top_products": [
            {
                "product_id": r.product_id,
                "name": r.name,
                "revenue": round(float(r.revenue), 2),
                "units_sold": int(r.units_sold),
            }
            for r in top_products
        ],
        "category_distribution": [
            {"name": r.name, "count": r.count}
            for r in category_dist
        ]
    }), 200


# ====================
# PENDING VENDORS
# ====================
@admin_bp.route("/vendors/pending", methods=["GET"])
@jwt_required()
@role_required("admin")
def pending_vendors():
    vendors = (
        Vendor.query
        .filter_by(is_approved=False, is_active=True)
        .order_by(Vendor.created_at.asc())
        .all()
    )
    return jsonify({"vendors": [v.to_dict() for v in vendors], "count": len(vendors)}), 200


# ==================
# APPROVE VENDOR
# ==================
@admin_bp.route("/vendors/<int:vendor_id>/approve", methods=["POST"])
@jwt_required()
@role_required("admin")
def approve_vendor(vendor_id):
    vendor = Vendor.query.get(vendor_id)
    if not vendor:
        return jsonify({"error": "Vendor not found"}), 404
    if not vendor.is_active:
        return jsonify({"error": "Cannot approve a deactivated vendor"}), 409
    if vendor.is_approved:
        return jsonify({"message": "Vendor already approved", "vendor": vendor.to_dict()}), 200

    vendor.is_approved = True
    db.session.commit()
    return jsonify({
        "message": f"Vendor '{vendor.store_name}' approved successfully",
        "vendor":  vendor.to_dict(),
    }), 200


# ===========================
# FULL PRODUCT CATALOG
# ===========================
@admin_bp.route("/products", methods=["GET"])
@jwt_required()
@role_required("admin")
def all_products():
    products = Product.query.order_by(Product.created_at.desc()).all()
    return jsonify({"products": [p.to_dict() for p in products], "total": len(products)}), 200


# =======================
# CATEGORY MANAGEMENT
# =======================
@admin_bp.route("/categories", methods=["GET"])
@jwt_required()
@role_required("admin")
def list_categories():
    cats = Category.query.order_by(Category.name).all()
    return jsonify({"categories": [c.to_dict() for c in cats], "count": len(cats)}), 200


@admin_bp.route("/categories", methods=["POST"])
@jwt_required()
@role_required("admin")
def add_category():
    data = request.get_json() or {}

    name = clean_str(data.get("name"))
    if not name:
        return jsonify({"error": "'name' is required and cannot be empty"}), 400

    # Validate parent exists if provided
    parent_id = data.get("parent_category_id")
    if parent_id is not None:
        if not isinstance(parent_id, int) or isinstance(parent_id, bool):
            return jsonify({"error": "'parent_category_id' must be an integer"}), 400
        if not Category.query.get(parent_id):
            return jsonify({"error": "Parent category not found"}), 404

    cat = Category(
        name = name,
        description=clean_str(data.get("description")),
        parent_category_id=parent_id,
    )
    db.session.add(cat)
    db.session.commit()
    return jsonify({"message": "Category created", "category": cat.to_dict()}), 201


@admin_bp.route("/categories/<int:cat_id>", methods=["DELETE"])
@jwt_required()
@role_required("admin")
def delete_category(cat_id):
    cat = Category.query.get(cat_id)
    if not cat:
        return jsonify({"error": "Category not found"}), 404

    # Safe Foreign Key check before delete
    product_count = Product.query.filter_by(category_id=cat_id).count()
    if product_count > 0:
        return jsonify({
            "error": f"Cannot delete category: {product_count} product(s) still assigned to it"
        }), 409

    child_count = Category.query.filter_by(parent_category_id=cat_id).count()
    if child_count > 0:
        return jsonify({
            "error": f"Cannot delete category: {child_count} sub-categorie(s) exist under it"
        }), 409

    try:
        db.session.delete(cat)
        db.session.commit()
        return jsonify({"message": "Category deleted"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Category deletion failed", "detail": str(e)}), 500


# ============================
# n8n SUPPORT ENDPOINTS
# ============================

@admin_bp.route("/all-customers", methods=["GET"])
@jwt_required()
@role_required("admin")
def all_customers_for_n8n():
    """Used by n8n weekly digest workflow."""
    customers = Customer.query.filter_by(is_active=True).all()
    return jsonify({"customers": [c.to_dict() for c in customers], "count": len(customers)}), 200


@admin_bp.route("/low-stock", methods=["GET"])
@jwt_required()
@role_required("admin")
def low_stock():
    """Used by n8n low-stock alert workflow."""
    threshold = request.args.get("threshold", 10, type=int)
    if threshold < 1:
        return jsonify({"error": "'threshold' must be a positive integer"}), 400

    rows = (
        db.session.query(Product, Vendor)
        .outerjoin(Vendor, Product.vendor_id == Vendor.vendor_id)
        .filter(Product.stock_qty < threshold, Product.is_active == True)
        .order_by(Product.stock_qty.asc())
        .all()
    )

    result = []
    for product, vendor in rows:
        data = product.to_dict()
        # Null-safe: vendor may be None if hard-deleted
        data["vendor_email"] = vendor.email if vendor else None
        data["vendor_store"] = vendor.store_name if vendor else None
        result.append(data)

    return jsonify({"low_stock_products": result, "count": len(result)}), 200


@admin_bp.route("/abandoned-carts", methods=["GET"])
@jwt_required()
@role_required("admin")
def abandoned_carts():
    """Used by n8n cart abandonment workflow. Returns carts older than 24 hours."""
    cutoff = (datetime.now(UTC) - timedelta(hours=24)).replace(tzinfo=None)

    rows = (
        db.session.query(Cart, Customer, Product)
        .join(Customer, Cart.customer_id == Customer.customer_id)
        .outerjoin(Product, Cart.product_id == Product.product_id)
        .filter(Cart.added_at <= cutoff, Customer.is_active == True)
        .order_by(Cart.customer_id, Cart.added_at.asc())
        .all()
    )

    customer_carts: dict = {}
    for cart_item, customer, product in rows:
        cid = cart_item.customer_id
        if cid not in customer_carts:
            customer_carts[cid] = {
                "customer_id": cid,
                "customer_name": customer.name,
                "customer_email": customer.email,
                "items": [],
            }
        customer_carts[cid]["items"].append({
            "product_id": cart_item.product_id,
            "product_name": product.name  if product else None,
            "quantity": cart_item.quantity,
            "price": round(float(product.price), 2) if product else None,
        })

    return jsonify({
        "abandoned_carts": list(customer_carts.values()),
        "count": len(customer_carts),
    }), 200


# ============================
# n8n MANUAL TRIGGER ENDPOINTS
# ============================

@admin_bp.route("/trigger/abandoned-carts", methods=["POST"])
@jwt_required()
@role_required("admin")
def trigger_abandoned_carts():
    webhook_url = os.getenv("N8N_ABANDONED_CARTS_URL")
    if not webhook_url:
        return jsonify({"error": "Workflow URL not configured"}), 500

    cutoff = (datetime.now(UTC) - timedelta(hours=24)).replace(tzinfo=None)
    rows = (
        db.session.query(Cart, Customer, Product)
        .join(Customer, Cart.customer_id == Customer.customer_id)
        .outerjoin(Product, Cart.product_id == Product.product_id)
        .filter(Cart.added_at <= cutoff, Customer.is_active == True)
        .order_by(Cart.customer_id, Cart.added_at.asc())
        .all()
    )

    customer_carts = {}
    for cart_item, customer, product in rows:
        cid = cart_item.customer_id
        if cid not in customer_carts:
            customer_carts[cid] = {
                "customer_id": cid,
                "customer_name": customer.name,
                "customer_email": customer.email,
                "items": [],
            }
        customer_carts[cid]["items"].append({
            "product_name": product.name if product else None,
            "quantity": cart_item.quantity,
            "price": round(float(product.price), 2) if product else None,
        })

    payload = {
        "triggered_by": "admin",
        "abandoned_carts": list(customer_carts.values()),
        "count": len(customer_carts),
    }

    try:
        http_requests.post(webhook_url, json=payload, timeout=5)
        return jsonify({"message": f"Abandoned carts workflow triggered for {len(customer_carts)} customers"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to trigger workflow", "detail": str(e)}), 500


@admin_bp.route("/trigger/low-stock", methods=["POST"])
@jwt_required()
@role_required("admin")
def trigger_low_stock_workflow():
    webhook_url = os.getenv("N8N_LOW_STOCK_URL")
    if not webhook_url:
        return jsonify({"error": "Workflow URL not configured"}), 500

    threshold = request.args.get("threshold", 10, type=int)

    rows = (
        db.session.query(Product, Vendor)
        .outerjoin(Vendor, Product.vendor_id == Vendor.vendor_id)
        .filter(Product.stock_qty < threshold, Product.is_active == True)
        .order_by(Product.stock_qty.asc())
        .all()
    )

    low_stock_products = []
    for product, vendor in rows:
        low_stock_products.append({
            "product_id": product.product_id,
            "product_name": product.name,
            "stock_qty": product.stock_qty,
            "vendor_email": vendor.email if vendor else None,
            "vendor_store": vendor.store_name if vendor else None,
        })

    payload = {
        "triggered_by": "admin",
        "low_stock_products": low_stock_products,
        "count": len(low_stock_products),
    }

    try:
        http_requests.post(webhook_url, json=payload, timeout=5)
        return jsonify({"message": f"Low stock workflow triggered for {len(low_stock_products)} products"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to trigger workflow", "detail": str(e)}), 500


@admin_bp.route("/trigger/weekly-digest", methods=["POST"])
@jwt_required()
@role_required("admin")
def trigger_weekly_digest():
    webhook_url = os.getenv("N8N_WEEKLY_DIGEST_URL")
    if not webhook_url:
        return jsonify({"error": "Workflow URL not configured"}), 500

    customers = Customer.query.filter_by(is_active=True).all()

    customers_data = []
    for customer in customers:
        recs = (
            Recommendation.query
            .filter_by(customer_id=customer.customer_id)
            .order_by(Recommendation.score.desc())
            .limit(5)
            .all()
        )
        rec_list = []
        for r in recs:
            rec_list.append({
                "product_name": r.product.name if r.product else None,
                "product_price": float(r.product.price) if r.product else None,
                "explanation": r.explanation,
                "score": float(r.score),
            })

        if rec_list:
            customers_data.append({
                "customer_id": customer.customer_id,
                "customer_name": customer.name,
                "customer_email": customer.email,
                "recommendations": rec_list,
            })

    payload = {
        "triggered_by": "admin",
        "customers": customers_data,
        "count": len(customers_data),
    }

    try:
        http_requests.post(webhook_url, json=payload, timeout=5)
        return jsonify({"message": f"Weekly digest triggered for {len(customers_data)} customers"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to trigger workflow", "detail": str(e)}), 500