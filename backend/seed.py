"""
OmniCart Seed Script  (idempotent)
------------------------------------
Safe to run multiple times — skips any record that already exists.

Seeded tables:
  admins, vendors, categories, products, customers,
  orders, order_items, payments, reviews, cart, recommendations

Run from the omnicart/ root with venv active:
    python -m backend.seed
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta, date
from app import create_app
from app.extensions import db, bcrypt
from app.models import (
    Admin, Customer, Vendor, Category, Product,
    Order, OrderItem, Payment, Review, Cart, Recommendation
)

# Helper
def get_or_create(model, filter_by: dict, defaults: dict):
    """
    Look up a row matching `filter_by`.
    If found   → return (instance, False)
    If missing → create with filter_by + defaults, return (instance, True)
    """
    instance = model.query.filter_by(**filter_by).first()
    if instance:
        return instance, False
    
    instance = model(**filter_by, **defaults)
    db.session.add(instance)
    db.session.flush()
    return instance, True


# Main
def seed():
    app = create_app()

    with app.app_context():
        print("🌱 Initializing Database and Seeding (idempotent)...")
        db.create_all()
        print("=" * 50)

        # 1. Admins
        admins_raw = [
            ("Super Admin", "admin@omnicart.com", "SuperAdmin@1234"),
            ("Ops Admin", "ops.admin@omnicart.com", "OpsAdmin@1234"),
            ("Support Admin", "support.admin@omnicart.com", "SuppAdmin@1234"),
        ]
        ac = 0
        for name, email, pw in admins_raw:
            _, created = get_or_create(
                Admin,
                filter_by={"email": email},
                defaults={
                    "name": name,
                    "password_hash": bcrypt.generate_password_hash(pw).decode("utf-8"),
                },
            )
            if created:
                ac += 1
        print(f"  ✔ Admins: {ac} created, {len(admins_raw) - ac} skipped")

        # 2. Vendors
        vendors_raw = [
            ("Ali Raza", "techzone@omnicart.com", "TechZone Store", "0321-1234567"),
            ("Sara Qureshi", "audioworld@omnicart.com", "AudioWorld", "0322-2345678"),
            ("Hamza Butt", "gadgethub@omnicart.com", "GadgetHub", "0333-3456789"),
            ("Nadia Farooq", "mobilezone@omnicart.com", "MobileZone PK", "0344-4567890"),
            ("Kamran Sheikh", "laptopcity@omnicart.com", "Laptop City", "0355-5678901"),
        ]
        vendors = []
        vc = 0
        for name, email, store, phone in vendors_raw:
            v, created = get_or_create(
                Vendor,
                filter_by={"email": email},
                defaults={
                    "name": name,
                    "password_hash": bcrypt.generate_password_hash("Vendor@1234").decode("utf-8"),
                    "store_name": store,
                    "phone": phone,
                    "is_approved": True,
                    "is_active": True,
                },
            )
            vendors.append(v)
            if created:
                vc += 1
        print(f"  ✔ Vendors: {vc} created, {len(vendors) - vc} skipped")

        # 3. Categories
        electronics, _ = get_or_create(
            Category,
            filter_by={"name": "Electronics", "parent_category_id": None},
            defaults={"description": "All electronic gadgets and devices"},
        )

        cats_raw = [
            ("Audio", "Headphones, speakers, and audio gear"),
            ("Mobiles", "Smartphones and accessories"),
            ("Laptops", "Laptops and notebooks"),
            ("Accessories", "Cables, cases, and peripherals"),
        ]
        cat_objs = {}
        for cat_name, cat_desc in cats_raw:
            c, _ = get_or_create(
                Category,
                filter_by={"name": cat_name, "parent_category_id": electronics.category_id},
                defaults={"description": cat_desc},
            )
            cat_objs[cat_name] = c
        print(f"  ✔ Categories: done (skipped any that existed)")

        audio_cat = cat_objs["Audio"]
        mobiles_cat = cat_objs["Mobiles"]
        laptops_cat = cat_objs["Laptops"]
        accessories_cat = cat_objs["Accessories"]

        # 4. Products
        # (vendor_idx, category, name, price, stock, brand, description)
        products_raw = [
            # Audio
            (0, audio_cat, "Sony WH-1000XM5", 49999.00, 30, "Sony", "Industry-leading noise cancelling headphones"),
            (0, audio_cat, "JBL Tune 760NC", 18999.00, 45, "JBL", "Wireless over-ear ANC headphones"),
            (1, audio_cat, "Bose QuietComfort 45", 62999.00, 20, "Bose", "Premium wireless headphones with world-class ANC"),
            (1, audio_cat, "Sony SRS-XB43", 22999.00, 35, "Sony", "Powerful EXTRA BASS Bluetooth wireless speaker"),
            (2, audio_cat, "JBL Flip 6", 14999.00, 50, "JBL", "Portable waterproof speaker with bold JBL Pro Sound"),
            # Mobiles
            (0, mobiles_cat, "Samsung Galaxy S24", 159999.00, 25, "Samsung", "2024 flagship Android smartphone with AI features"),
            (0, mobiles_cat, "iPhone 15 Pro", 289999.00, 15, "Apple", "Apple flagship with titanium design and A17 Pro chip"),
            (3, mobiles_cat, "Xiaomi 14", 119999.00, 30, "Xiaomi", "Leica-tuned camera flagship with Snapdragon 8 Gen 3"),
            (3, mobiles_cat, "OnePlus 12", 109999.00, 20, "OnePlus", "Flagship killer with Hasselblad camera system"),
            (3, mobiles_cat, "Google Pixel 8", 129999.00, 18, "Google", "Pure Android with best-in-class AI camera"),
            # Laptops
            (4, laptops_cat, "Dell XPS 15", 249999.00, 10, "Dell", "15-inch premium laptop with OLED and Intel Core Ultra"),
            (4, laptops_cat, "Apple MacBook Pro M3", 369999.00,  8, "Apple", "16-inch MacBook Pro with M3 Pro chip"),
            (4, laptops_cat, "Lenovo ThinkPad X1 Carbon", 219999.00, 12, "Lenovo", "Business ultrabook with military-grade durability"),
            (4, laptops_cat, "ASUS ROG Zephyrus G16", 319999.00,  7, "ASUS", "Gaming laptop with RTX 4080 and 240Hz OLED display"),
            (4, laptops_cat, "HP Spectre x360", 199999.00, 10, "HP", "2-in-1 premium laptop with 4K OLED touch display"),
            # Accessories
            (2, accessories_cat, "Anker USB-C Hub 7-in-1", 3999.00,100, "Anker", "Multiport hub with HDMI, USB-A, SD card reader"),
            (0, accessories_cat, "Spigen iPhone 15 Case", 1999.00, 80, "Spigen", "Military-grade protection case for iPhone 15"),
            (1, accessories_cat, "Logitech MX Master 3S", 17999.00, 40, "Logitech", "Advanced wireless mouse with MagSpeed scrolling"),
            (2, accessories_cat, "Samsung 45W USB-C Charger", 2999.00, 60, "Samsung", "Super-fast USB-C wall charger with cable"),
            (0, accessories_cat, "Baseus 20000mAh Power Bank", 7999.00, 55, "Baseus", "High-capacity power bank with 65W fast charging"),
        ]
        products = []
        pc = 0
        for v_idx, cat, name, price, stock, brand, desc in products_raw:
            p, created = get_or_create(
                Product,
                filter_by={"name": name, "vendor_id": vendors[v_idx].vendor_id},
                defaults={
                    "category_id": cat.category_id,
                    "description": desc,
                    "price": price,
                    "stock_qty": stock,
                    "brand": brand,
                    "is_active": True,
                },
            )
            products.append(p)
            if created:
                pc += 1
        print(f"  ✔ Products: {pc} created, {len(products) - pc} skipped")

        # 5. Customers
        customers_raw = [
            ("Rayyan Aamir", "rayyan.aamir@gmail.com", "0311-1111111", "House 5, Block A, Karachi"),
            ("Ahmed Rashdi", "ahmed.rashdi@gmail.com", "0312-2222222", "Flat 3B, DHA Phase 6, Lahore"),
            ("Usaid Khan", "usaid.khan@gmail.com", "0313-3333333", "Plot 12, G-9/2, Islamabad"),
            ("Ayesha Malik", "ayesha.malik@gmail.com", "0314-4444444", "House 88, Clifton, Karachi"),
            ("Bilal Ahmed", "bilal.ahmed@gmail.com", "0315-5555555", "Street 4, Model Town, Lahore"),
            ("Zara Khan", "zara.khan@gmail.com", "0316-6666666", "Block C, Bahria Town, Rawalpindi"),
            ("Hassan Ali", "hassan.ali@gmail.com", "0317-7777777", "House 2, F-7, Islamabad"),
            ("Mahnoor Siddiqui", "mahnoor.s@gmail.com", "0318-8888888", "Flat 5A, Sea View, Karachi"),
            ("Raza Shah", "raza.shah@gmail.com", "0319-9999999", "Lane 7, Gulberg III, Lahore"),
            ("Sana Iqbal", "sana.iqbal@gmail.com", "0321-0000001", "House 45, I-8/4, Islamabad"),
        ]
        customers = []
        cc = 0
        for name, email, phone, address in customers_raw:
            c, created = get_or_create(
                Customer,
                filter_by={"email": email},
                defaults={
                    "name": name,
                    "password_hash": bcrypt.generate_password_hash("Customer@1234").decode("utf-8"),
                    "phone": phone,
                    "address": address,
                    "date_of_birth": date(1995, 1, 15),
                    "is_active": True,
                },
            )
            customers.append(c)
            if created:
                cc += 1
        print(f"  ✔ Customers: {cc} created, {len(customers) - cc} skipped")

        # 6. Orders + Order Items
        # Each order: (customer_idx, [(product_idx, qty)], status, days_ago)
        # Order items are created inside the same block — confirmed below.
        orders_raw = [
            (0, [(0, 1), (16, 1)], "delivered", 15),    # Rayyan: Sony XM5 + Spigen case
            (0, [(5, 1)], "confirmed", 14),             # Rayyan: Galaxy S24
            (1, [(2, 1), (17, 1)], "delivered", 13),    # Ahmed: Bose QC45 + Logitech mouse
            (1, [(10, 1)], "confirmed", 12),            # Ahmed: Dell XPS 15
            (2, [(3, 1), (4, 1)],  "delivered", 11),    # Usaid: Sony speaker + JBL Flip
            (2, [(13, 1)], "pending", 10),              # Usaid: ASUS ROG
            (3, [(6, 1)], "delivered", 9),              # Ayesha: iPhone 15 Pro
            (3, [(15, 2), (18, 1)],"confirmed", 8),     # Ayesha: 2x Anker hub + Samsung charger
            (4, [(7, 1), (19, 1)], "delivered", 7),     # Bilal: Xiaomi 14 + power bank
            (4, [(11, 1)], "pending", 6),               # Bilal: MacBook Pro M3
            (5, [(1, 1), (17, 1)], "delivered", 5),     # Zara: JBL Tune + Logitech mouse
            (6, [(8, 1)], "confirmed", 4),              # Hassan: OnePlus 12
            (7, [(14, 1)], "delivered", 3),             # Mahnoor: HP Spectre
            (8, [(9, 1), (15, 1)], "delivered", 2),     # Raza: Pixel 8 + Anker hub
            (9, [(12, 1)], "confirmed", 1),             # Sana: ThinkPad X1
        ]
        orders = []
        oc  = 0
        oic = 0  # order_items created counter
        for c_idx, items, status, days_ago in orders_raw:
            placed = datetime.now().replace(microsecond=0) - timedelta(days=days_ago)
            total  = sum(float(products[p_idx].price) * qty for p_idx, qty in items)

            # Idempotency check: same customer + same total = same order
            existing = Order.query.filter_by(
                customer_id=customers[c_idx].customer_id,
                total_amount=total,
                placed_at=placed,
            ).first()

            if existing:
                orders.append(existing)
                continue

            # Create order
            o = Order(
                customer_id=customers[c_idx].customer_id,
                total_amount=total,
                status=status,
                placed_at=placed,
            )
            db.session.add(o)
            db.session.flush()  # need order_id for order_items

            # Create order items for this order
            for p_idx, qty in items:
                oi = OrderItem(
                    order_id=o.order_id,
                    product_id=products[p_idx].product_id,
                    quantity=qty,
                    unit_price=float(products[p_idx].price),
                )
                db.session.add(oi)
                oic += 1

            orders.append(o)
            oc += 1

        db.session.flush()
        skipped_orders = len(orders) - oc
        print(f"  ✔ Orders: {oc} created, {skipped_orders} skipped")
        print(f"  ✔ Order Items: {oic} created  ← line items inside those orders")

        # 7. Payments
        methods = ["credit_card", "debit_card", "bank_transfer", "cash_on_delivery"]
        pay_c = 0
        for i, o in enumerate(orders):
            if o.status not in ("confirmed", "delivered"):
                continue
            if Payment.query.filter_by(order_id=o.order_id).first():
                continue
            p = Payment(
                order_id=o.order_id,
                method=methods[i % len(methods)],
                status="completed",
                amount=o.total_amount,
                paid_at=o.placed_at + timedelta(minutes=10),
            )
            db.session.add(p)
            pay_c += 1
        db.session.flush()
        print(f"  ✔ Payments: {pay_c} created")

        # 8. Reviews 
        # (customer_idx, product_idx, rating, comment, sentiment_score)
        reviews_raw = [
            (0,  0, 5, "Absolutely incredible noise cancellation, worth every rupee!", 0.92),
            (0, 16, 4, "Good case, fits perfectly and feels sturdy.",                  0.75),
            (0,  5, 5, "Samsung Galaxy S24 is a beast! Camera is outstanding.",        0.90),
            (1,  2, 5, "Bose never disappoints. Premium sound and comfort.",           0.88),
            (1, 17, 4, "Smooth scrolling, ergonomic design. Great for work.",          0.78),
            (1, 10, 5, "Dell XPS 15 OLED display is absolutely stunning.",             0.91),
            (2,  3, 4, "Sony speaker has great bass. Good for outdoor use.",           0.72),
            (2,  4, 5, "JBL Flip 6 is perfect for pool parties. Waterproof works!",   0.85),
            (3,  6, 5, "iPhone 15 Pro is gorgeous. Titanium build feels premium.",     0.93),
            (3, 15, 4, "Anker hub works flawlessly with my MacBook.",                  0.76),
            (3, 18, 3, "Charger works but cable feels a bit flimsy.",                  0.50),
            (4,  7, 5, "Xiaomi 14 camera is insane for this price. Leica magic.",      0.89),
            (4, 19, 4, "65W charging is so fast. Saved me multiple times.",            0.80),
            (5,  1, 4, "JBL Tune 760NC has decent ANC at this price.",                 0.70),
            (5, 17, 5, "Best mouse I have ever used. MagSpeed scroll is addictive.",   0.95),
            (6,  8, 4, "OnePlus 12 is incredibly fast. OxygenOS is clean.",            0.82),
            (7, 14, 5, "HP Spectre x360 is beautiful and powerful. Love the OLED.",   0.90),
            (8,  9, 4, "Pixel 8 camera AI features are genuinely impressive.",         0.83),
            (8, 15, 5, "Anker hub saved my laptop workflow completely.",                0.87),
            (9, 12, 5, "ThinkPad build quality is unmatched. Business laptop king.",   0.91),
            (0,  4, 3, "JBL Flip 6 bass is okay but expected more loudness.",          0.48),
            (1, 19, 5, "Baseus power bank charges my laptop. Incredible value.",        0.88),
            (2,  6, 4, "iPhone 15 Pro is great but very expensive for Pakistan.",      0.65),
            (3,  7, 5, "Xiaomi 14 exceeded all my expectations. Flagship killer!",     0.92),
            (4, 10, 4, "Dell XPS runs cool and silent under load.",                    0.78),
            (5,  8, 3, "OnePlus 12 gets warm during gaming. Otherwise great.",         0.52),
            (6,  0, 5, "Sony WH-1000XM5 is the gold standard of headphones.",          0.96),
            (7,  5, 4, "Galaxy S24 AI features useful but gimmicky at times.",         0.68),
            (8, 11, 5, "MacBook Pro M3 performance is otherworldly. Best laptop.",     0.94),
            (9, 13, 4, "ASUS ROG thermal performance impressive. Gaming beast.",        0.79),
        ]
        rc = 0
        for c_idx, p_idx, rating, comment, sentiment in reviews_raw:
            cid = customers[c_idx].customer_id
            pid = products[p_idx].product_id
            if Review.query.filter_by(customer_id=cid, product_id=pid).first():
                continue
            r = Review(
                customer_id=cid,
                product_id=pid,
                rating=rating,
                comment=comment,
                sentiment_score=sentiment,
            )
            db.session.add(r)
            rc += 1
        db.session.flush()
        print(f"  ✔ Reviews: {rc} created")

        # 9. Cart
        # Simulate active carts for customers who have NOT yet placed an order
        # for these products (realistic — items still sitting in cart)
        # (customer_idx, product_idx, quantity)
        cart_raw = [
            (0,  7, 1),     # Rayyan browsing Xiaomi 14
            (0, 19, 2),     # Rayyan wants 2x power banks
            (1,  4, 1),     # Ahmed eyeing JBL Flip 6
            (1, 18, 1),     # Ahmed — Samsung charger
            (2,  6, 1),     # Usaid considering iPhone 15 Pro
            (3,  9, 1),     # Ayesha — Google Pixel 8
            (4, 14, 1),     # Bilal — HP Spectre
            (5, 11, 1),     # Zara — MacBook Pro M3
            (6, 17, 1),     # Hassan — Logitech mouse
            (7,  0, 1),     # Mahnoor — Sony WH-1000XM5
            (8,  5, 1),     # Raza — Galaxy S24
            (9, 13, 1),     # Sana — ASUS ROG
        ]
        cart_c = 0
        for c_idx, p_idx, qty in cart_raw:
            _, created = get_or_create(
                Cart,
                filter_by={
                    "customer_id": customers[c_idx].customer_id,
                    "product_id": products[p_idx].product_id,
                },
                defaults={"quantity": qty},
            )
            if created:
                cart_c += 1
        db.session.flush()
        print(f"  ✔ Cart Items: {cart_c} created")

        # 10. Recommendations
        # Pre-seeded recommendations (normally generated by ML pipeline,
        # but seeded here so the UI and API have data to display from day 1)
        # (customer_idx, product_idx, score, explanation)
        recommendations_raw = [
            (0,  7, 0.9120, "Based on your Sony headphones purchase, you may love Xiaomi 14's audio features."),
            (0, 11, 0.8850, "You purchased a Dell laptop — the MacBook Pro M3 is a premium alternative worth considering."),
            (0, 19, 0.8640, "Customers who bought Sony XM5 frequently pair it with the Baseus power bank."),
            (0,  3, 0.8310, "Your interest in audio gear makes the Sony SRS-XB43 speaker a strong match."),
            (0, 15, 0.8100, "The Anker hub complements your existing tech purchases perfectly."),

            (1,  9, 0.9230, "Based on your Xiaomi 14 interest, Google Pixel 8 offers a pure Android alternative."),
            (1, 14, 0.8970, "You own a Dell XPS — the HP Spectre x360 offers a versatile 2-in-1 experience."),
            (1,  1, 0.8550, "Customers who bought Bose QC45 also enjoy JBL Tune 760NC as a portable option."),
            (1, 19, 0.8200, "The Baseus power bank is highly rated by customers who own multiple devices."),
            (1, 16, 0.7980, "A Spigen case is a popular pairing with your iPhone interest."),

            (2,  6, 0.9410, "You browsed mobiles frequently — iPhone 15 Pro is your top match."),
            (2, 10, 0.8800, "Customers in your category love the Dell XPS 15 for productivity."),
            (2, 17, 0.8620, "The Logitech MX Master 3S is top-rated by power users like you."),
            (2, 12, 0.8300, "ThinkPad X1 Carbon suits your interest in durable, professional devices."),
            (2, 19, 0.8050, "The Baseus power bank is frequently bought with mobile accessories."),

            (3,  8, 0.9300, "Based on your iPhone purchase, OnePlus 12 is a popular alternative in your price range."),
            (3, 11, 0.8760, "MacBook Pro M3 is a natural next step for iPhone 15 Pro owners."),
            (3,  0, 0.8540, "Sony WH-1000XM5 is highly recommended for iPhone users seeking premium audio."),
            (3, 17, 0.8210, "Logitech MX Master 3S pairs beautifully with your MacBook ecosystem."),
            (3, 13, 0.7990, "ASUS ROG is a popular pick among customers who own high-end mobile devices."),

            (4,  9, 0.9180, "Based on your Xiaomi 14 purchase, Google Pixel 8 is a complementary choice."),
            (4, 14, 0.8830, "HP Spectre x360 is a top pick for customers who own flagship smartphones."),
            (4,  0, 0.8610, "Sony WH-1000XM5 is frequently paired with mobile flagship purchases."),
            (4, 15, 0.8290, "Anker hub is a must-have accessory for multi-device users."),
            (4, 18, 0.8070, "Samsung charger is highly compatible with your existing devices."),

            (5,  2, 0.9050, "Customers who own JBL Tune 760NC often upgrade to Bose QuietComfort 45."),
            (5, 10, 0.8720, "Dell XPS 15 is a top recommendation for users who own wireless mice."),
            (5,  6, 0.8490, "iPhone 15 Pro is popular among customers in your browsing category."),
            (5, 19, 0.8150, "Power bank is a top buy for customers with multiple wireless accessories."),
            (5, 16, 0.7930, "Spigen case is a popular companion for mobile-focused shoppers."),

            (6,  7, 0.9270, "Based on your OnePlus 12 purchase, Xiaomi 14 is a Leica-camera alternative."),
            (6,  1, 0.8810, "JBL Tune 760NC is a popular wireless headphone choice for OnePlus users."),
            (6, 15, 0.8560, "Anker USB-C hub is highly recommended for Android phone owners."),
            (6, 18, 0.8220, "Samsung 45W charger is compatible with your OnePlus and charges faster."),
            (6, 19, 0.8010, "Power bank complements your on-the-go mobile usage perfectly."),

            (7,  5, 0.9120, "Customers who own HP Spectre often pair it with Galaxy S24 for mobile productivity."),
            (7,  2, 0.8780, "Bose QC45 is a premium audio upgrade recommended for laptop owners."),
            (7, 15, 0.8530, "Anker hub expands your HP Spectre's connectivity significantly."),
            (7, 17, 0.8190, "Logitech MX Master 3S is the top mouse choice for HP Spectre users."),
            (7, 12, 0.7980, "ThinkPad X1 Carbon is a business-oriented alternative to your HP Spectre."),

            (8, 10, 0.9340, "Based on your Pixel 8 purchase, Dell XPS 15 is a top laptop recommendation."),
            (8,  0, 0.8870, "Sony WH-1000XM5 is highly rated by Google Pixel users for audio quality."),
            (8,  7, 0.8640, "Xiaomi 14 is a popular upgrade for customers who enjoy camera-focused phones."),
            (8, 17, 0.8280, "Logitech MX Master 3S is a productivity essential for multi-device users."),
            (8, 13, 0.8020, "ASUS ROG is a popular choice among tech-savvy customers like you."),

            (9,  6, 0.9250, "Based on your ThinkPad interest, iPhone 15 Pro rounds out a premium ecosystem."),
            (9, 11, 0.8890, "MacBook Pro M3 is a natural companion to your ThinkPad for cross-platform work."),
            (9,  0, 0.8610, "Sony WH-1000XM5 is the go-to headphone for professionals who own ThinkPads."),
            (9, 17, 0.8300, "Logitech MX Master 3S is the most popular mouse among ThinkPad users."),
            (9, 15, 0.8080, "Anker hub is essential for expanding your ThinkPad's USB-C ports."),
        ]
        rec_c = 0
        for c_idx, p_idx, score, explanation in recommendations_raw:
            _, created = get_or_create(
                Recommendation,
                filter_by={
                    "customer_id": customers[c_idx].customer_id,
                    "product_id":  products[p_idx].product_id,
                },
                defaults={
                    "score":       score,
                    "explanation": explanation,
                },
            )
            if created:
                rec_c += 1
        db.session.flush()
        print(f"  ✔ Recommendations: {rec_c} created (5 per customer)")

        # Commit everything
        try:
            db.session.commit()
        except:
            db.session.rollback()
            raise

        print("=" * 50)
        print("✅ Seed complete. Safe to run again anytime.")


if __name__ == "__main__":
    seed()
