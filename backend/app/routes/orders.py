"""
ORDERS ROUTES
===========================================
POST /api/orders                 - place order  (calls PlaceOrder stored proc)
GET  /api/orders                 - customer order history
GET  /api/orders/<id>            - order detail with items
POST /api/orders/<id>/cancel     - cancel order (calls CancelOrder stored proc)
POST /api/payments               - process payment (calls ProcessPayment stored proc)
GET  /api/payments/<order_id>    - get payment for order (ownership verified)
PUT  /api/orders/<id>/status      - update order status (vendor/admin only)
"""

import os
import json
import requests as http_requests
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from ..extensions import db
from ..models import Order, OrderItem, Payment, Product
from ..middleware.role_required import role_required
from .validations import extract_sp_error

orders_bp = Blueprint("orders", __name__, url_prefix="/api")

# Allowed payment methods - any other value is rejected at the route level
_VALID_PAYMENT_METHODS = {"credit_card", "debit_card", "cash_on_delivery", "bank_transfer"}


# =============================================
# PLACE ORDER - calls PlaceOrder stored proc
# =============================================
@orders_bp.route("/orders", methods=["POST"])
@jwt_required()
@role_required("customer")
def place_order():
    customer_id = int(get_jwt_identity())
    data = request.get_json() or {}

    cart_items = data.get("cart_items")

    # Validate cart_items list exists and is non-empty
    if not cart_items or not isinstance(cart_items, list):
        return jsonify({"error": "'cart_items' must be a non-empty list"}), 400

    seen = set()
    for idx, item in enumerate(cart_items):
        if not isinstance(item, dict):
            return jsonify({"error": f"Item at index {idx} must be an object"}), 400

        pid = item.get("product_id")
        if pid is None:
            return jsonify({"error": f"Item {idx}: 'product_id' is required"}), 400
        if not isinstance(pid, int) or isinstance(pid, bool) or pid < 1:
            return jsonify({"error": f"Item {idx}: 'product_id' must be a positive integer"}), 400

        if pid in seen:
            return jsonify({"error": f"Duplicate product_id {pid}"}), 400
        seen.add(pid)

        product = Product.query.get(pid)
        if not product or not product.is_active:
            return jsonify({"error": f"Item {idx}: product not available"}), 404

        qty = item.get("quantity")
        if qty is None:
            return jsonify({"error": f"Item {idx}: 'quantity' is required"}), 400
        if not isinstance(qty, int) or isinstance(qty, bool) or qty < 1:
            return jsonify({"error": f"Item {idx}: 'quantity' must be a positive integer"}), 400

    cart_json = json.dumps(cart_items)

    try:
        result = db.session.execute(
            text("CALL PlaceOrder(:cid, :items)"),
            {"cid": customer_id, "items": cart_json},
        )
        row = result.fetchone()
        db.session.commit()

        # Stored proc result safety
        if not row:
            return jsonify({"error": "Order placement failed: no result from database"}), 500

        order_id, total_amount = row[0], float(row[1])

        # Fire n8n webhook (non-blocking - failures never break order)
        try:
            webhook_url = os.getenv("N8N_ORDER_PLACED_URL")
            if webhook_url:
                order_obj = Order.query.get(order_id)
                if order_obj:
                    items_payload = [
                        {
                            "product_id": oi.product_id,
                            "product_name": oi.product.name if oi.product else None,
                            "quantity": oi.quantity,
                            "unit_price": float(oi.unit_price),
                        }
                        for oi in order_obj.order_items
                    ]
                    http_requests.post(
                        webhook_url,
                        json={
                            "order_id": order_id,
                            "customer_id": customer_id,
                            "total_amount": total_amount,
                            "items": items_payload,
                        },
                        timeout=3,
                    )
        except Exception:
            pass  # Webhook failure must never affect the order response

        return jsonify({
            "message": "Order placed successfully",
            "order_id": order_id,
            "total_amount": total_amount,
        }), 201

    except Exception as e:
        db.session.rollback()
        sp_msg = extract_sp_error(e)
        if sp_msg:
            return jsonify({"error": sp_msg}), 400
        return jsonify({"error": "Order placement failed", "detail": str(e)}), 500


# =================================
# ORDER HISTORY - Customer
# =================================
@orders_bp.route("/orders", methods=["GET"])
@jwt_required()
@role_required("customer")
def get_orders():
    customer_id = int(get_jwt_identity())
    orders = (Order.query.filter_by(customer_id=customer_id).order_by(Order.placed_at.desc()).all())
    
    order_list = []
    for o in orders:
        d = o.to_dict()
        d["items"] = [None] * len(o.order_items) # Provide items array (or just count) for frontend
        order_list.append(d)
        
    return jsonify({"orders": order_list}), 200


# ===================
# ORDER DETAIL
# ===================
@orders_bp.route("/orders/<int:order_id>", methods=["GET"])
@jwt_required()
@role_required("customer")
def get_order(order_id):
    customer_id = int(get_jwt_identity())
    order = Order.query.filter_by(order_id=order_id, customer_id=customer_id).first()
    if not order:
        return jsonify({"error": "Order not found"}), 404

    data = order.to_dict()
    data["items"] = []
    for oi in order.order_items:
        item_data = oi.to_dict()
        item_data["product_name"] = oi.product.name if oi.product else None
        item_data["product_brand"] = oi.product.brand if oi.product else None
        item_data["subtotal"] = round(float(oi.unit_price) * oi.quantity, 2)
        data["items"].append(item_data)

    data["payment"] = order.payment.to_dict() if order.payment else None
    return jsonify({"order": data}), 200


# ===================================================
# CANCEL ORDER - calls CancelOrder stored proc
# ===================================================
@orders_bp.route("/orders/<int:order_id>/cancel", methods=["POST"])
@jwt_required()
@role_required("customer")
def cancel_order(order_id):
    customer_id = int(get_jwt_identity())

    try:
        result = db.session.execute(
            text("CALL CancelOrder(:oid, :cid)"),
            {"oid": order_id, "cid": customer_id},
        )
        row = result.fetchone()
        db.session.commit()

        # Stored proc result safety
        if not row:
            return jsonify({"error": "Cancellation failed: no result from database"}), 500

        (
            cancelled_order_id,
            _customer_id,
            previous_status,
            new_status,
            payment_action,
            _unused,
            message,
        ) = row

        return jsonify({
            "message": message,
            "order_id": cancelled_order_id,
            "previous_status": previous_status,
            "new_status": new_status,
            "payment_action": payment_action,
        }), 200

    except Exception as e:
        db.session.rollback()
        sp_msg = extract_sp_error(e)
        return jsonify({"error": sp_msg or "Cancellation failed"}), 400


# =====================================================
# PROCESS PAYMENT - calls ProcessPayment stored proc
# =====================================================
@orders_bp.route("/payments", methods=["POST"])
@jwt_required()
@role_required("customer")
def process_payment():
    customer_id = int(get_jwt_identity())
    data = request.get_json() or {}

    # Required field presence
    for field in ("order_id", "method", "amount"):
        if data.get(field) is None:
            return jsonify({"error": f"'{field}' is required"}), 400

    # order_id must be a positive integer
    order_id = data["order_id"]
    if not isinstance(order_id, int) or isinstance(order_id, bool) or order_id < 1:
        return jsonify({"error": "'order_id' must be a positive integer"}), 400

    # Payment method whitelist
    method = data["method"]
    if method not in _VALID_PAYMENT_METHODS:
        return jsonify({"error": f"Invalid payment method. Allowed: {', '.join(sorted(_VALID_PAYMENT_METHODS))}"}), 400

    # Amount must be numeric and > 0
    try:
        amount = float(data["amount"])
    except (TypeError, ValueError):
        return jsonify({"error": "'amount' must be a valid number"}), 400
    if amount <= 0:
        return jsonify({"error": "'amount' must be greater than 0"}), 400

    # Ownership check before hitting the stored proc
    order = Order.query.filter_by(order_id=order_id, customer_id=customer_id).first()
    if not order:
        return jsonify({"error": "Order not found"}), 404

    try:
        result = db.session.execute(
            text("CALL ProcessPayment(:cid, :oid, :method, :amount)"),
            {"cid": customer_id, "oid": order_id, "method": method, "amount": amount},
        )
        row = result.fetchone()
        db.session.commit()

        # Stored proc result safety
        if not row:
            return jsonify({"error": "Payment failed: no result from database"}), 500

        # Unpack by position with clear names
        (
            resp_order_id,
            resp_method,
            resp_amount,
            resp_status,
            resp_message,
        ) = row

        return jsonify({
            "message": resp_message,
            "order_id": resp_order_id,
            "payment_method": resp_method,
            "amount_paid": float(resp_amount),
            "order_status": resp_status,
        }), 200

    except Exception as e:
        db.session.rollback()
        sp_msg = extract_sp_error(e)
        return jsonify({"error": sp_msg or "Payment failed"}), 400


# ==============================================
# GET PAYMENT - by order (ownership verified)
# ==============================================
@orders_bp.route("/payments/<int:order_id>", methods=["GET"])
@jwt_required()
@role_required("customer")
def get_payment(order_id):
    customer_id = int(get_jwt_identity())

    # Ownership check first
    order = Order.query.filter_by(order_id=order_id, customer_id=customer_id).first()
    if not order:
        return jsonify({"error": "Order not found"}), 404

    payment = Payment.query.filter_by(order_id=order_id).first()
    if not payment:
        return jsonify({"error": "No payment found for this order"}), 404

    return jsonify({"payment": payment.to_dict()}), 200


# =====================================================
# UPDATE ORDER STATUS - Vendor / Admin only
# =====================================================
@orders_bp.route("/orders/<int:order_id>/status", methods=["PUT"])
@jwt_required()
@role_required("vendor", "admin")
def update_order_status(order_id):
    user_id = int(get_jwt_identity())
    claims = get_jwt()
    role = claims.get("role")
    data = request.get_json() or {}
    new_status = data.get("status")

    if not new_status:
        return jsonify({"error": "'status' is required"}), 400

    # Validate status value
    valid_statuses = {"pending", "confirmed", "processing", "shipped", "delivered", "cancelled"}
    if new_status not in valid_statuses:
        return jsonify({"error": f"Invalid status. Allowed: {', '.join(sorted(valid_statuses))}"}), 400

    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404

    # Authorization check:
    # Admin can update any order.
    # Vendor can update if they have at least one product in the order.
    if role == "vendor":
        vendor_item = OrderItem.query.join(Product).filter(
            OrderItem.order_id == order_id,
            Product.vendor_id == user_id
        ).first()
        if not vendor_item:
            return jsonify({"error": "Unauthorized: this order does not contain your products"}), 403

    order.status = new_status
    db.session.commit()

    return jsonify({
        "message": f"Order status updated to {new_status}",
        "order_id": order_id,
        "status": new_status
    }), 200