"""
CUSTOMER ROUTES
===========================================
GET    /api/products                - list products with filters + safe sorting
GET    /api/products/<id>           - product detail + reviews
GET    /api/categories              - list all categories
POST   /api/cart                    - add / update cart item
GET    /api/cart                    - view cart
DELETE /api/cart/<item_id>          - remove single cart item
DELETE /api/cart                    - clear entire cart
GET    /api/customer/profile        - get own profile
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import or_
from ..extensions import db
from ..models import Product, Category, Cart, Customer
from ..middleware.role_required import role_required

customer_bp = Blueprint("customer", __name__, url_prefix="/api")

# Columns the user is allowed to sort by — prevents arbitrary attribute injection
_SORT_WHITELIST = {"created_at", "price", "name"}


# ===============================
# PRODUCTS - List with filters
# ===============================
@customer_bp.route("/products", methods=["GET"])
def list_products():
    query = Product.query.filter_by(is_active=True)

    # Keyword search across name, description, brand
    keyword = request.args.get("q", "").strip()
    if keyword:
        like = f"%{keyword}%"
        query = query.filter(
            or_(Product.name.ilike(like), Product.description.ilike(like), Product.brand.ilike(like),)
        )

    # Category filter
    category_id = request.args.get("category_id", type=int)
    if category_id:
        if not Category.query.get(category_id):
            return jsonify({"error": "Category not found"}), 404
        query = query.filter_by(category_id=category_id)

    # Price range
    min_price = request.args.get("min_price", type=float)
    max_price = request.args.get("max_price", type=float)
    if min_price is not None and min_price < 0:
        return jsonify({"error": "'min_price' cannot be negative"}), 400
    if max_price is not None and max_price < 0:
        return jsonify({"error": "'max_price' cannot be negative"}), 400
    if min_price is not None and max_price is not None and min_price > max_price:
        return jsonify({"error": "'min_price' cannot exceed 'max_price'"}), 400
    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)

    # Safe sorting - whitelist prevents arbitrary column injection
    sort_by = request.args.get("sort_by", "created_at")
    if sort_by not in _SORT_WHITELIST:
        return jsonify({"error": f"'sort_by' must be one of: {', '.join(sorted(_SORT_WHITELIST))}"}), 400

    order = request.args.get("order", "desc").lower()
    if order not in ("asc", "desc"):
        return jsonify({"error": "'order' must be 'asc' or 'desc'"}), 400

    sort_col = getattr(Product, sort_by)
    if not sort_col:
        return jsonify({"error": "Invalid sort field"}), 400
    query = query.order_by(sort_col.desc() if order == "desc" else sort_col.asc())

    # Pagination
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    if page < 1:
        return jsonify({"error": "'page' must be >= 1"}), 400
    if not (1 <= per_page <= 100):
        return jsonify({"error": "'per_page' must be between 1 and 100"}), 400

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "products": [p.to_dict() for p in paginated.items],
        "total": paginated.total,
        "pages": paginated.pages,
        "page": paginated.page,
    }), 200


# =======================
# PRODUCTS - Detail
# =======================
@customer_bp.route("/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = Product.query.filter_by(product_id=product_id, is_active=True).first()
    if not product:
        return jsonify({"error": "Product not found"}), 404

    reviews = [r.to_dict() for r in product.reviews]
    avg_rating = (
        round(sum(r["rating"] for r in reviews) / len(reviews), 1)
        if reviews else None
    )

    data = product.to_dict()
    data["reviews"] = reviews
    data["avg_rating"] = avg_rating
    data["review_count"] = len(reviews)
    data["category"] = product.category.to_dict() if product.category else None
    data["vendor"] = (
        {"vendor_id": product.vendor.vendor_id, "store_name": product.vendor.store_name}
        if product.vendor else None
    )
    return jsonify(data), 200


# ==========================
# CATEGORIES - List all
# ==========================
@customer_bp.route("/categories", methods=["GET"])
def list_categories():
    categories = Category.query.order_by(Category.name).all()
    return jsonify({"categories": [c.to_dict() for c in categories]}), 200


# ==========================
# CART - Add / update
# ==========================
@customer_bp.route("/cart", methods=["POST"])
@jwt_required()
@role_required("customer")
def add_to_cart():
    customer_id = int(get_jwt_identity())
    data = request.get_json() or {}

    product_id = data.get("product_id")

    try:
        product_id = int(product_id)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid product_id"}), 400
    
    quantity = data.get("quantity", 1)

    # Input validation
    if not product_id:
        return jsonify({"error": "'product_id' is required"}), 400

    # Accept both int and float that is a whole number (e.g. 2.0 from JSON)
    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return jsonify({"error": "'quantity' must be a positive integer"}), 400
    if quantity < 1:
        return jsonify({"error": "'quantity' must be at least 1"}), 400

    # Product existence check
    product = Product.query.filter_by(product_id=product_id, is_active=True).first()
    if not product:
        return jsonify({"error": "Product not found or no longer available"}), 404

    # Stock validation (correct for both new and existing cart items)
    # If the item already exists in the cart, we replace the quantity,
    # not adding to it — so compare against full requested quantity.
    existing_item = Cart.query.filter_by(customer_id=customer_id, product_id=product_id).first()

    if product.stock_qty < quantity:
        return jsonify({"error": f"Only {product.stock_qty} unit(s) available in stock"}), 400

    if existing_item:
        existing_item.quantity = quantity
        message = "Cart item updated"
        item = existing_item
    else:
        item = Cart(customer_id=customer_id, product_id=product_id, quantity=quantity)
        db.session.add(item)
        message = "Item added to cart"

    db.session.commit()
    return jsonify({"message": message, "cart_item": item.to_dict()}), 200


# ==================
# CART - View
# ==================
@customer_bp.route("/cart", methods=["GET"])
@jwt_required()
@role_required("customer")
def view_cart():
    customer_id = int(get_jwt_identity())
    items = Cart.query.filter_by(customer_id=customer_id).all()

    cart_data = []
    total = 0.0
    orphaned_ids = []  # cart items whose product was deleted or inactive

    for item in items:
        product = item.product  # could be None if product was hard-deleted
        if not product or not product.is_active:
            orphaned_ids.append(item.cart_id)
            continue

        subtotal = float(product.price) * item.quantity
        total += subtotal
        entry = item.to_dict()
        entry["product_name"] = product.name
        entry["product_price"] = float(product.price)
        entry["subtotal"] = round(subtotal, 2)
        entry["stock_available"] = product.stock_qty
        entry["is_active"] = product.is_active
        cart_data.append(entry)

    # Silently remove orphaned/inactive items so they don't pile up
    if orphaned_ids:
        Cart.query.filter(Cart.cart_id.in_(orphaned_ids)).delete(synchronize_session=False)
        db.session.commit()

    return jsonify({
        "cart": cart_data,
        "total": round(total, 2),
        "item_count": len(cart_data),
    }), 200


# ===================================
# CART - Remove single item
# ===================================
@customer_bp.route("/cart/<int:item_id>", methods=["DELETE"])
@jwt_required()
@role_required("customer")
def remove_cart_item(item_id):
    customer_id = int(get_jwt_identity())
    item = Cart.query.filter_by(cart_id=item_id, customer_id=customer_id).first()
    if not item:
        return jsonify({"error": "Cart item not found"}), 404

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Item removed from cart"}), 200


# ============================
# CART - Clear all
# ============================
@customer_bp.route("/cart", methods=["DELETE"])
@jwt_required()
@role_required("customer")
def clear_cart():
    customer_id = int(get_jwt_identity())
    Cart.query.filter_by(customer_id=customer_id).delete()
    db.session.commit()
    return jsonify({"message": "Cart cleared"}), 200


# ===============================
# CUSTOMER PROFILE - Get
# ===============================
@customer_bp.route("/customer/profile", methods=["GET"])
@jwt_required()
@role_required("customer")
def get_profile():
    customer_id = int(get_jwt_identity())
    customer = Customer.query.get(customer_id)
    if not customer:
        return jsonify({"error": "Customer not found"}), 404
    return jsonify({"customer": customer.to_dict()}), 200