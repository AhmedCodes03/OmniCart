"""
VENDOR ROUTES
===========================================
POST   /api/vendor/products           - add product
GET    /api/vendor/products           - list own products
GET    /api/vendor/products/<id>      - single product
PUT    /api/vendor/products/<id>      - update stock/price (calls UpdateProductInventory SP)
DELETE /api/vendor/products/<id>      - deactivate product
GET    /api/vendor/orders             - orders containing vendor's products
GET    /api/vendor/stats              - revenue + sales summary
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text, func
from ..extensions import db
from ..models import Product, Category, Order, OrderItem
from ..middleware.role_required import role_required
from .validations import clean_str, extract_sp_error

vendor_bp = Blueprint("vendor", __name__, url_prefix="/api/vendor")

# Internal helpers
def _validate_price(value) -> tuple:
    """
    Returns (float_price, None) on success or (None, error_string) on failure.
    Rejects booleans, strings, and negatives.
    """
    if isinstance(value, bool):
        return None, "'price' must be a non-negative number"
    try:
        price = float(value)
    except (TypeError, ValueError):
        return None, "'price' must be a non-negative number"
    if price < 0:
        return None, "'price' must be a non-negative number"
    return price, None


def _validate_stock(value) -> tuple:
    """
    Returns (int_stock, None) on success or (None, error_string) on failure.
    Rejects booleans, floats, strings, and negatives.
    """
    if isinstance(value, bool):
        return None, "'stock_qty' must be a non-negative integer"
    # Reject floats like 1.5, only allow whole numbers
    if isinstance(value, float) and not value.is_integer():
        return None, "'stock_qty' must be a non-negative integer"
    try:
        stock = int(value)
    except (TypeError, ValueError):
        return None, "'stock_qty' must be a non-negative integer"
    if stock < 0:
        return None, "'stock_qty' must be a non-negative integer"
    return stock, None


# ===================
# ADD PRODUCT
# ===================
@vendor_bp.route("/products", methods=["POST"])
@jwt_required()
@role_required("vendor")
def add_product():
    vendor_id = int(get_jwt_identity())
    data = request.get_json() or {}

    # Required field presence
    for field in ("name", "price", "category_id"):
        if data.get(field) is None:
            return jsonify({"error": f"'{field}' is required"}), 400

    # name must be a non-empty string
    name = clean_str(data["name"])
    if not name:
        return jsonify({"error": "'name' cannot be empty"}), 400

    # category must exist
    category_id = data["category_id"]
    if not isinstance(category_id, int) or isinstance(category_id, bool):
        return jsonify({"error": "'category_id' must be an integer"}), 400
    if not Category.query.get(category_id):
        return jsonify({"error": "Category not found"}), 404

    # price validation
    price, price_err = _validate_price(data["price"])
    if price_err:
        return jsonify({"error": price_err}), 400

    # stock_qty validation (defaults to 0)
    stock_raw = data.get("stock_qty", 0)
    stock, stock_err = _validate_stock(stock_raw)
    if stock_err:
        return jsonify({"error": stock_err}), 400

    product = Product(
        vendor_id=vendor_id,
        category_id=category_id,
        name=name,
        description=clean_str(data.get("description")),
        price=price,
        stock_qty=stock,
        brand=clean_str(data.get("brand")),
        is_active=True,
    )
    db.session.add(product)
    db.session.commit()
    return jsonify({"message": "Product added", "product": product.to_dict()}), 201


# ==========================
# LIST OWN PRODUCTS
# ==========================
@vendor_bp.route("/products", methods=["GET"])
@jwt_required()
@role_required("vendor")
def list_vendor_products():
    vendor_id = int(get_jwt_identity())
    products = (Product.query.filter_by(vendor_id=vendor_id).order_by(Product.created_at.desc()).all())
    return jsonify({"products": [p.to_dict() for p in products], "total": len(products)}), 200


# ====================
# SINGLE PRODUCT
# ====================
@vendor_bp.route("/products/<int:product_id>", methods=["GET"])
@jwt_required()
@role_required("vendor")
def get_vendor_product(product_id):
    vendor_id = int(get_jwt_identity())
    product = Product.query.filter_by(product_id=product_id, vendor_id=vendor_id).first()
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify({"product": product.to_dict()}), 200


# ==============================================================
# UPDATE PRODUCT - calls UpdateProductInventory stored proc
# ==============================================================
@vendor_bp.route("/products/<int:product_id>", methods=["PUT"])
@jwt_required()
@role_required("vendor")
def update_product(product_id):
    vendor_id = int(get_jwt_identity())
    data = request.get_json() or {}

    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Ownership check
    product = Product.query.filter_by(product_id=product_id, vendor_id=vendor_id).first()
    if not product:
        return jsonify({"error": "Product not found"}), 404

    # Validate ALL inputs BEFORE touching the DB or calling the SP

    # price: validate only if provided, otherwise keep current
    if "price" in data:
        new_price, price_err = _validate_price(data["price"])
        if price_err:
            return jsonify({"error": price_err}), 400
    else:
        new_price = float(product.price)

    # stock_qty: validate only if provided, otherwise keep current
    if "stock_qty" in data:
        new_stock, stock_err = _validate_stock(data["stock_qty"])
        if stock_err:
            return jsonify({"error": stock_err}), 400
    else:
        new_stock = product.stock_qty

    # name: non-empty string if provided
    new_name = None
    if "name" in data:
        new_name = str(data["name"]).strip()
        if not new_name:
            return jsonify({"error": "'name' cannot be empty"}), 400

    # category_id: must exist if provided
    new_category_id = None
    if "category_id" in data:
        cid = data["category_id"]
        if not isinstance(cid, int) or isinstance(cid, bool):
            return jsonify({"error": "'category_id' must be an integer"}), 400
        if not Category.query.get(cid):
            return jsonify({"error": "Category not found"}), 404
        new_category_id = cid

    # All validation passed => now call the stored procedure
    try:
        result = db.session.execute(
            text("CALL UpdateProductInventory(:pid, :vid, :stock, :price)"),
            {"pid": product_id, "vid": vendor_id, "stock": new_stock, "price": new_price},
        )
        row = result.fetchone()

        # Stored proc result safety
        if not row:
            db.session.rollback()
            return jsonify({"error": "Update failed: no result from database"}), 500

        # Apply remaining field updates in the same transaction
        if "name" in data:
            if data["name"] is None:
                return jsonify({"error": "'name' cannot be null"}), 400
            
            new_name = clean_str(data["name"])
            if not new_name:
                return jsonify({"error": "'name' cannot be empty"}), 400
            product.name = new_name
            
        if "description" in data:
            product.description = clean_str(data["description"]) or None
        if "brand" in data:
            product.brand = clean_str(data["brand"]) or None
        if new_category_id:
            product.category_id = new_category_id

        # Single commit => SP + field updates are atomic
        db.session.commit()

        return jsonify({"message": "Product updated", "product": product.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        sp_msg = extract_sp_error(e)
        return jsonify({"error": sp_msg or "Update failed"}), 400


# ==========================
# DEACTIVATE PRODUCT
# ==========================
@vendor_bp.route("/products/<int:product_id>", methods=["DELETE"])
@jwt_required()
@role_required("vendor")
def deactivate_product(product_id):
    vendor_id = int(get_jwt_identity())
    product = Product.query.filter_by(product_id=product_id, vendor_id=vendor_id).first()
    if not product:
        return jsonify({"error": "Product not found"}), 404

    if not product.is_active:
        return jsonify({"error": "Product is already deactivated"}), 409

    product.is_active = False
    db.session.commit()
    return jsonify({"message": "Product deactivated"}), 200


# =====================================================
# VENDOR ORDERS - orders containing vendor's products
# =====================================================
@vendor_bp.route("/orders", methods=["GET"])
@jwt_required()
@role_required("vendor")
def vendor_orders():
    vendor_id = int(get_jwt_identity())

    rows = (
        db.session.query(Order, OrderItem, Product)
        .join(OrderItem, Order.order_id == OrderItem.order_id)
        .join(Product, OrderItem.product_id == Product.product_id)
        .filter(Product.vendor_id == vendor_id)
        .order_by(Order.placed_at.desc())
        .all()
    )

    if not rows:
        return jsonify({"orders": [], "total": 0, "message": "No orders found"}), 200

    # Group line items under their parent order using an ordered dict
    # to preserve placed_at DESC sort from the query above
    orders_map: dict = {}
    for order, oi, product in rows:
        oid = order.order_id
        if oid not in orders_map:
            orders_map[oid] = {
                **order.to_dict(),
                "items": [],
            }
        item_data = oi.to_dict()
        # Safe: product reference may be stale in edge cases
        item_data["product_name"] = product.name if product else None
        item_data["product_brand"] = product.brand if product else None
        item_data["subtotal"] = round(float(oi.unit_price) * oi.quantity, 2)
        orders_map[oid]["items"].append(item_data)

    return jsonify({"orders": list(orders_map.values()), "total": len(orders_map)}), 200


# ======================
# VENDOR STATS
# ======================
@vendor_bp.route("/stats", methods=["GET"])
@jwt_required()
@role_required("vendor")
def vendor_stats():
    vendor_id = int(get_jwt_identity())

    # Revenue + units sold per product
    rows = (
        db.session.query(
            Product.product_id,
            Product.name,
            Product.price,
            Product.brand,
            Product.stock_qty,
            Product.is_active,
            func.coalesce(func.sum(OrderItem.quantity), 0).label("units_sold"),
            func.coalesce(func.sum(OrderItem.quantity * OrderItem.unit_price), 0).label("revenue"),
        )
        .outerjoin(OrderItem, Product.product_id == OrderItem.product_id)
        .filter(Product.vendor_id == vendor_id)
        .group_by(
            Product.product_id,
            Product.name,
            Product.price,
            Product.brand,
            Product.stock_qty,
            Product.is_active
        )
        .all()
    )

    product_stats = [
        {
            "product_id": r.product_id,
            "name": r.name,
            "price": float(r.price or 0),
            "stock_qty": r.stock_qty,
            "is_active": r.is_active,
            "brand": r.brand or "Studio Spec",
            "units_sold": int(r.units_sold or 0),
            "revenue": round(float(r.revenue or 0), 2),
        }
        for r in rows
    ]

    # Derive low-stock list from the stats query result - avoids a second DB round-trip
    low_stock = [p for p in product_stats if p["stock_qty"] < 10 and p["is_active"]]

    total_revenue = round(sum(p["revenue"] for p in product_stats), 2)
    total_units = sum(p["units_sold"] for p in product_stats)

    # 7-Day Sales History for the Chart
    history_rows = (
        db.session.query(
            func.date(Order.placed_at).label("day"),
            func.sum(OrderItem.quantity * OrderItem.unit_price).label("revenue")
        )
        .join(OrderItem, Order.order_id == OrderItem.order_id)
        .join(Product, OrderItem.product_id == Product.product_id)
        .filter(Product.vendor_id == vendor_id)
        .filter(Order.placed_at >= func.date_sub(func.now(), text("INTERVAL 7 DAY")))
        .group_by(func.date(Order.placed_at))
        .order_by(func.date(Order.placed_at))
        .all()
    )

    history = [{"day": str(r.day), "revenue": float(r.revenue)} for r in history_rows]

    # Recent Orders (Top 5)
    recent_order_rows = (
        db.session.query(Order, OrderItem, Product)
        .join(OrderItem, Order.order_id == OrderItem.order_id)
        .join(Product, OrderItem.product_id == Product.product_id)
        .filter(Product.vendor_id == vendor_id)
        .order_by(Order.placed_at.desc())
        .limit(20) # Get enough to group into 5 orders
        .all()
    )
    
    recent_orders_map = {}
    for o, oi, p in recent_order_rows:
        if o.order_id not in recent_orders_map and len(recent_orders_map) < 5:
            recent_orders_map[o.order_id] = {**o.to_dict(), "items": []}
        if o.order_id in recent_orders_map:
            item_data = oi.to_dict()
            item_data["product_name"] = p.name
            item_data["subtotal"] = round(float(oi.unit_price) * oi.quantity, 2)
            recent_orders_map[o.order_id]["items"].append(item_data)

    return jsonify({
        "total_revenue": total_revenue,
        "total_units_sold": total_units,
        "product_count": len(product_stats),
        "low_stock_count": len(low_stock),
        "products": product_stats,
        "low_stock_products": low_stock,
        "sales_history": history,
        "recent_orders": list(recent_orders_map.values())
    }), 200