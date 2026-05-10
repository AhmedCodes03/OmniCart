from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from .extensions import db, jwt, bcrypt

load_dotenv()


def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Config
    # Use 'or' instead of default to handle empty strings "", and strip whitespace
    db_url = (os.getenv("DATABASE_URL") or "mysql+pymysql://root:omnicart@localhost/omnicart_db").strip()
    
    # Fix driver for Railway/Heroku if necessary
    if db_url.startswith("mysql://"):
        db_url = db_url.replace("mysql://", "mysql+pymysql://", 1)
    
    print(f"Connecting to: {db_url.split('@')[-1]}") # Log host only for safety
    
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "fallback-dev-secret")

    # Init extensions
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # Import models (must come after db.init_app)
    from . import models

    # JWT error handlers
    @jwt.unauthorized_loader
    def missing_token(reason):
        """Fires when no Authorization header is present at all."""
        return jsonify({"error": "Missing token", "detail": reason}), 401

    @jwt.invalid_token_loader
    def invalid_token(reason):
        """Fires when the token is present but malformed or has a bad signature."""
        return jsonify({"error": "Invalid token", "detail": reason}), 401

    @jwt.expired_token_loader
    def expired_token(jwt_header, jwt_payload):
        """Fires when a valid token has passed its expiry time."""
        return jsonify({"error": "Token has expired. Please log in again."}), 401

    @jwt.revoked_token_loader
    def revoked_token(jwt_header, jwt_payload):
        """Fires when a token has been explicitly revoked (if blocklist is enabled)."""
        return jsonify({"error": "Token has been revoked. Please log in again."}), 401

    # Register Blueprints
    from .routes.auth import auth_bp
    from .routes.customer import customer_bp
    from .routes.orders import orders_bp
    from .routes.vendors import vendor_bp
    from .routes.admin import admin_bp
    from .routes.reviews import reviews_bp
    from .routes.queries import queries_bp
    from .routes.recommendations import recommendations_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(customer_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(vendor_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(queries_bp)
    app.register_blueprint(recommendations_bp)

    @app.route("/")
    def index():
        return jsonify({"message": "OmniCart API is running ✅", "version": "1.0"})

    return app