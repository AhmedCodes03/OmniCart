"""
Step 15 — TF-IDF + Cosine Similarity Content-Based Engine
===========================================================
Builds a content-based recommendation engine using product
names, descriptions, brands and categories from OmniCart DB.
Saves model to ml/tfidf_model.pkl for Flask API use.

Run: python ml/train_tfidf.py
"""

import pickle
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from ..app import create_app
from ..app.extensions import db
from ..app.models.product import Product
from ..app.models.category import Category

# Config
MODEL_PATH = os.path.join(os.path.dirname(__file__), "tfidf_model.pkl")

print("=" * 55)
print("  OmniCart — TF-IDF Content-Based Engine Training")
print("=" * 55)

app = create_app()

with app.app_context():

    # Step 1: Load products from OmniCart DB
    print("\n📂 Loading products from database...")
    products  = Product.query.filter_by(is_active=True).all()
    print(f"   Products found: {len(products)}")

    if len(products) < 2:
        print("   ❌ Need at least 2 products. Run seed2.py first.")
        sys.exit(1)

    # Step 2: Build product dataframe
    rows = []
    for p in products:
        category_name = p.category.name if p.category else ""
        parent_name = p.category.parent.name if (p.category and p.category.parent) else ""
        rows.append({
            "product_id":  p.product_id,
            "name": p.name or "",
            "description": p.description or "",
            "brand": p.brand or "",
            "category": category_name,
            "parent_cat": parent_name,
        })

    df = pd.DataFrame(rows)
    print(f"   DataFrame shape: {df.shape}")

    # Step 3: Build content string
    # Combine all text features — repeat name/brand for higher weight
    df["content"] = (
        df["name"] + " " +
        df["name"] + " " +   # repeat for weight
        df["brand"] + " " +
        df["brand"] + " " +   # repeat for weight
        df["category"] + " " +
        df["parent_cat"] + " " +
        df["description"]
    )
    df["content"] = df["content"].str.lower().str.strip()
    print(f"\n📝 Sample content string:")
    print(f"   {df['content'].iloc[0][:100]}...")

    # Step 4: TF-IDF Vectorization
    print("\n🔢 Building TF-IDF matrix...")
    vectorizer = TfidfVectorizer(
        max_features=5000,
        stop_words="english",
        ngram_range=(1, 2),   # unigrams + bigrams
        min_df=1,
    )
    tfidf_matrix = vectorizer.fit_transform(df["content"])
    print(f"   TF-IDF matrix shape: {tfidf_matrix.shape}")

    # Step 5: Cosine Similarity
    print("\n📐 Computing cosine similarity matrix...")
    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
    print(f"   Similarity matrix shape: {cosine_sim.shape}")

    # Step 6: Build product index map
    product_id_to_idx = {row["product_id"]: idx for idx, row in df.iterrows()}
    idx_to_product_id = {idx: row["product_id"] for idx, row in df.iterrows()}

    # Step 7: Test similarity
    print("\n🧪 Testing similar products...")
    test_product = df.iloc[0]
    test_idx = 0
    sim_scores = list(enumerate(cosine_sim[test_idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:4]

    print(f"   Product: '{test_product['name']}'")
    print(f"   Top 3 similar:")
    for idx, score in sim_scores:
        print(f"     → '{df.iloc[idx]['name']}' (score: {score:.4f})")

    # Step 8: Save everything
    payload = {
        "vectorizer": vectorizer,
        "tfidf_matrix": tfidf_matrix,
        "cosine_sim": cosine_sim,
        "product_id_to_idx": product_id_to_idx,
        "idx_to_product_id": idx_to_product_id,
        "df": df,
    }
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(payload, f)

    print(f"\n💾 Model saved: {MODEL_PATH}")
    print("\n" + "=" * 55)
    print("  ✅ TF-IDF engine ready for Flask integration (Step 17)")
    print("=" * 55)