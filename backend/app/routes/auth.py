"""
AUTH ROUTES
================================================
POST /api/auth/register          - register customer or vendor (role in body)
POST /api/auth/login             - login for customer, vendor, or admin (role in body)
GET  /api/auth/me                - get current user from JWT
PUT  /api/auth/profile           - update name / phone / address / store_name
PUT  /api/auth/change-password   - change password (requires old password)
"""
 
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from ..extensions import db
from ..models import Customer, Vendor, Admin
from ..services.auth_service import hash_password, verify_password
from .validations import validate_email, validate_phone, parse_dob, clean_str
from datetime import timedelta
 
auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

# ==========================
# Internal Helper Functions
# ==========================
def _make_token(user_id, role: str, name: str) -> str:
    expires = timedelta(days=365) if role == "admin" else timedelta(minutes=15)
    return create_access_token(
        identity=str(user_id),
        additional_claims={"role": role, "name": name},
        expires_delta=expires,
    )


def _get_current_user(role: str, user_id: str):
    """
    Returns the ORM object for the current JWT identity.
    Returns None if the user doesn't exist.
    """
    if role == "customer":
        return Customer.query.get(int(user_id))
    if role == "vendor":
        return Vendor.query.get(int(user_id))
    if role == "admin":
        return Admin.query.get(int(user_id))
    return None


# ====================================================================================
# POST /api/auth/register
# Body: { name, email, password, role, phone?, address?, date_of_birth?, store_name? }
# ====================================================================================
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
 
    required = ["name", "email", "password", "role"]
    missing = [f for f in required if not data.get(f)]

    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
 
    role = data["role"].strip().lower()
    name = clean_str(data.get("name"))
    email = clean_str(data.get("email"))
    password = data["password"]
    phone = clean_str(data.get("phone"))

    if not name or not email:
        return jsonify({"error": "Name and email cannot be empty"}), 400

    email = email.lower()
 
    if role not in ("customer", "vendor"):
        return jsonify({"error": "Role must be 'customer' or 'vendor'"}), 400
 
    if not validate_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    
    if phone and not validate_phone(phone):
        return jsonify({"error": "Phone must be in format 03XX-XXXXXXX"}), 400
 
    # Duplicate email check across both tables
    if Customer.query.filter_by(email=email).first() or \
       Vendor.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409
 
    if role == "customer":
        dob = data.get("date_of_birth")
        parsed_dob = parse_dob(dob)
        if dob and parsed_dob is False:
            return jsonify({"error": "Invalid date_of_birth format. Use YYYY-MM-DD"}), 400

        user = Customer(
            name=name,
            email=email,
            password_hash=hash_password(password),
            phone=phone,
            address=clean_str(data.get("address")),
            date_of_birth=parsed_dob,
            is_active=True,
        )

        db.session.add(user)
        db.session.commit()
        token = _make_token(user.customer_id, "customer", user.name)

        return jsonify({
            "message": "Customer registered successfully",
            "token": token,
            "role": "customer",
            "user": user.to_dict(),
        }), 201
 
    # role == "vendor"
    user = Vendor(
        name=name,
        email=email,
        password_hash=hash_password(password),
        phone=phone,
        store_name=clean_str(data.get("store_name")) or f"{name}'s Store",
        is_approved=False,
        is_active=True,
    )

    db.session.add(user)
    db.session.commit()
    # No token on vendor register — they must await admin approval before login
    return jsonify({
        "message": "Vendor registered successfully. Awaiting admin approval.",
        "role": "vendor",
        "user": user.to_dict(),
    }), 201


# ===================================
# POST /api/auth/login
# Body: { email, password, role }
# ===================================
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
 
    required = ["email", "password", "role"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({"error": f"Missing fields: {', '.join(missing)}"}), 400
 
    role = data["role"].strip().lower()
    email = clean_str(data.get("email"))
    password = data["password"]
 
    if role not in ("customer", "vendor", "admin"):
        return jsonify({"error": "Role must be 'customer', 'vendor', or 'admin'"}), 400

    if not email:
        return jsonify({"error": "Email is required"}), 400

    email = email.lower()

    if not validate_email(email):
        return jsonify({"error": "Invalid email format"}), 400

    # Admin login
    if role == "admin":
        user = Admin.query.filter_by(email=email).first()
        if not user or not verify_password(password, user.password_hash):
            return jsonify({"error": "Invalid email or password"}), 401
        token = _make_token(user.admin_id, "admin", user.name)
        return jsonify({
            "message": "Admin login successful",
            "token": token,
            "role": "admin",
            "user": user.to_dict(),
        }), 200
 
    # Customer login
    if role == "customer":
        user = Customer.query.filter_by(email=email).first()
        if not user or not verify_password(password, user.password_hash):
            return jsonify({"error": "Invalid email or password"}), 401
        if not user.is_active:
            return jsonify({"error": "Account is deactivated. Contact support."}), 403
        token = _make_token(user.customer_id, "customer", user.name)
        return jsonify({
            "message": "Login successful",
            "token": token,
            "role": "customer",
            "user": user.to_dict(),
        }), 200
 
    # Vendor login
    user = Vendor.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.password_hash):
        return jsonify({"error": "Invalid email or password"}), 401
    if not user.is_active:
        return jsonify({"error": "Account is deactivated. Contact support."}), 403
    if not user.is_approved:
        return jsonify({"error": "Vendor account is pending admin approval."}), 403
    token = _make_token(user.vendor_id, "vendor", user.name)
    return jsonify({
        "message": "Login successful",
        "token": token,
        "role": "vendor",
        "user": user.to_dict(),
    }), 200


# =========================================================
# GET /api/auth/me
# Returns the currently authenticated user's profile.
# =========================================================
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    claims = get_jwt()
    role = claims.get("role")
    user_id = get_jwt_identity()

    if role not in ("customer", "vendor", "admin"):
        return jsonify({"error": "Invalid token"}), 401
 
    user = _get_current_user(role, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
 
    return jsonify({"role": role, "user": user.to_dict()}), 200


# =================================================================
# PUT /api/auth/profile
# Update name / phone / address (customer) or store_name (vendor).
# =================================================================
@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    claims = get_jwt()
    role = claims.get("role")
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    if role not in ("customer", "vendor", "admin"):
        return jsonify({"error": "Invalid token"}), 401

    if role == "admin":
        return jsonify({"error": "Admin profile cannot be updated via this endpoint"}), 403

    if not data:
        return jsonify({"error": "No data provided"}), 400

    user = _get_current_user(role, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Common fields
    if "name" in data:
        cleaned_name = clean_str(data["name"])
        if cleaned_name:
            user.name = cleaned_name

    if "phone" in data:
        phone = clean_str(data["phone"])
        if phone and not validate_phone(phone):
            return jsonify({"error": "Phone must be in format 03XX-XXXXXXX"}), 400
        user.phone = phone

    # Customer-only fields
    if role == "customer" and "address" in data:
        user.address = clean_str(data.get("address"))

    # Vendor-only fields
    if role == "vendor":
        store_name = clean_str(data.get("store_name"))
        if store_name:
            user.store_name = store_name

    db.session.commit()
    return jsonify({"message": "Profile updated successfully", "user": user.to_dict()}), 200


# ==========================================
# PUT /api/auth/change-password
# Body: { old_password, new_password }
# ==========================================
@auth_bp.route("/change-password", methods=["PUT"])
@jwt_required()
def change_password():
    claims = get_jwt()
    role = claims.get("role")
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    if role not in ("customer", "vendor", "admin"):
        return jsonify({"error": "Invalid token"}), 401

    if role == "admin":
        return jsonify({"error": "Admins cannot change password via this endpoint"}), 403

    if not data:
        return jsonify({"error": "No data provided"}), 400

    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not old_password or not new_password:
        return jsonify({"error": "Both 'old_password' and 'new_password' are required"}), 400
 
    if len(new_password) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400
 
    if old_password == new_password:
        return jsonify({"error": "New password must differ from the old password"}), 400
 
    user = _get_current_user(role, user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
 
    if not verify_password(old_password, user.password_hash):
        return jsonify({"error": "Old password is incorrect"}), 401
 
    user.password_hash = hash_password(new_password)
    db.session.commit()
    return jsonify({"message": "Password changed successfully"}), 200