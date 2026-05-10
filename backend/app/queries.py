"""
queries.py - 5 complex SQL queries for the DB course.
Each function returns a list of dicts ready to be jsonified.

Queries use:
  - JOINs (multi-table)
  - Aggregate functions (SUM, COUNT, AVG, ROUND, COALESCE)
  - GROUP BY (strict-mode safe - all non-aggregated columns listed)
  - HAVING
  - Correlated subqueries
  - Built-in SQL functions (DATE_FORMAT, COALESCE)
"""

from .extensions import db
from sqlalchemy import text


# =============================================================
# Query 1: Customer Full Order History
# JOIN: customers => orders => order_items => products
# Used by: Customer portal order history page
# =============================================================
def customer_order_history(customer_id: int):
    """
    Returns every order item a customer has ever placed,
    with product details and subtotals.
    """
    sql = text("""
        SELECT
            o.order_id,
            o.status,
            o.placed_at,
            p.name AS product_name,
            p.brand,
            oi.quantity,
            oi.unit_price,
            (oi.quantity * oi.unit_price) AS subtotal,
            o.total_amount
        FROM customers c
        JOIN orders o ON c.customer_id = o.customer_id
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN products p ON oi.product_id = p.product_id
        WHERE c.customer_id = :cid
        ORDER BY o.placed_at DESC
    """)
    rows = db.session.execute(sql, {"cid": customer_id}).mappings().all()
    return [dict(r) for r in rows]


# =============================================================
# Query 2: Platform Revenue Report by Month
# Aggregates: SUM, COUNT, AVG, DATE_FORMAT (built-in)
# =============================================================
def monthly_revenue_report():
    """
    Returns total orders and revenue grouped by month.
    Uses DATE_FORMAT built-in function and GROUP BY.
    """
    sql = text("""
        SELECT
            DATE_FORMAT(o.placed_at, '%Y-%m') AS month,
            COUNT(o.order_id) AS total_orders,
            ROUND(SUM(o.total_amount), 2) AS total_revenue,
            ROUND(AVG(o.total_amount), 2) AS avg_order_value
        FROM orders o
        WHERE o.status != 'cancelled'
        GROUP BY DATE_FORMAT(o.placed_at, '%Y-%m')
        ORDER BY DATE_FORMAT(o.placed_at, '%Y-%m') DESC
        LIMIT 12
    """)
    rows = db.session.execute(sql).mappings().all()
    return [dict(r) for r in rows]


# =============================================================
# Query 3: Top Customers by Spend
# JOIN + Aggregate + HAVING + correlated subquery
# =============================================================
def top_customers_by_spend(min_orders: int = 1):
    """
    Returns customers ranked by total spend.
    Uses HAVING to filter by minimum order count.
    Uses a correlated subquery for review count.
    """
    sql = text("""
        SELECT
            c.customer_id,
            c.name,
            c.email,
            COUNT(DISTINCT o.order_id) AS total_orders,
            ROUND(SUM(o.total_amount), 2) AS total_spent,
            ROUND(AVG(o.total_amount), 2) AS avg_order_value,
            (
                SELECT COUNT(*)
                FROM reviews r
                WHERE r.customer_id = c.customer_id
            ) AS review_count
        FROM customers c
        JOIN orders o ON c.customer_id = o.customer_id
        WHERE o.status != 'cancelled'
        GROUP BY c.customer_id, c.name, c.email
        HAVING COUNT(DISTINCT o.order_id) >= :min_orders
        ORDER BY total_spent DESC
        LIMIT 20
    """)
    rows = db.session.execute(sql, {"min_orders": min_orders}).mappings().all()
    return [dict(r) for r in rows]


# =============================================================
# Query 4: Vendor Sales Performance
# Multi-table LEFT JOIN + aggregates + COALESCE
# =============================================================
def vendor_sales_performance():
    """
    Returns sales summary for each vendor.
    Uses COALESCE to handle vendors with no sales or no reviews,
    LEFT JOINs, and multiple aggregate functions.
    """
    sql = text("""
        SELECT
            v.vendor_id,
            v.store_name,
            v.name AS vendor_name,
            v.is_approved,
            COUNT(DISTINCT p.product_id) AS product_count,
            COALESCE(SUM(oi.quantity), 0) AS total_units_sold,
            COALESCE(ROUND(SUM(oi.quantity * oi.unit_price), 2), 0) AS total_revenue,
            COALESCE(ROUND(AVG(r.rating), 1), 0.0) AS avg_rating,
            COALESCE(COUNT(DISTINCT r.review_id), 0) AS total_reviews
        FROM vendors v
        LEFT JOIN products p ON v.vendor_id = p.vendor_id
        LEFT JOIN order_items oi ON p.product_id = oi.product_id
        LEFT JOIN reviews r ON p.product_id = r.product_id
        WHERE v.is_active = TRUE
        GROUP BY v.vendor_id, v.store_name, v.name, v.is_approved
        ORDER BY total_revenue DESC
    """)
    rows = db.session.execute(sql).mappings().all()
    return [dict(r) for r in rows]


# ====================================================================
# Query 5: Category Sentiment & Rating Analysis
# Multi-level JOIN + AVG aggregate + correlated subquery + GROUP BY
# ====================================================================
def category_sentiment_analysis():
    """
    Returns average sentiment score and average rating per category.
    Uses a nested JOIN chain + correlated subquery to count
    positively-reviewed products.
    """
    sql = text("""
        SELECT
            c.category_id,
            c.name AS category_name,
            COUNT(DISTINCT p.product_id) AS product_count,
            COUNT(DISTINCT r.review_id) AS total_reviews,
            COALESCE(ROUND(AVG(r.rating), 2), 0.0) AS avg_rating,
            COALESCE(ROUND(AVG(r.sentiment_score), 2), 0.0) AS avg_sentiment,
            (
                SELECT COUNT(DISTINCT p2.product_id)
                FROM products p2
                JOIN reviews r2 ON p2.product_id = r2.product_id
                WHERE p2.category_id = c.category_id
                  AND r2.sentiment_score >= 0.7
            ) AS positive_products
        FROM categories c
        JOIN products p ON c.category_id = p.category_id
        JOIN reviews r ON p.product_id = r.product_id
        WHERE p.is_active = TRUE
        GROUP BY c.category_id, c.name
        ORDER BY avg_sentiment DESC
    """)
    rows = db.session.execute(sql).mappings().all()
    return [dict(r) for r in rows]