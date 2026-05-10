"""
Step 14 — SVD Collaborative Filtering
======================================
Trains on Amazon Reviews dataset (UserId, ProductId, Score)
Saves model to ml/svd_model.pkl for Flask API use.

Run: python ml/train_svd.py
"""

import pandas as pd
import numpy as np
import pickle
import os
import sys
from surprise import Dataset, Reader, SVD
from surprise.model_selection import cross_validate
from surprise import accuracy

# Add backend to path for app imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import create_app

# Config
DATA_PATH = os.path.join(os.path.dirname(__file__), "Reviews.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "svd_model.pkl")
MAP_PATH = os.path.join(os.path.dirname(__file__), "product_map.pkl")

print("=" * 55)
print("  OmniCart — SVD Collaborative Filtering Training")
print("=" * 55)

# Step 1: Load & Clean Data
print("\n📂 Loading dataset...")
if not os.path.exists(DATA_PATH):
    print(f"❌ ERROR: {DATA_PATH} not found. Please provide a Reviews.csv file to train SVD.")
    sys.exit(1)

df = pd.read_csv(DATA_PATH, usecols=["UserId", "ProductId", "Score"])
print(f"   Raw rows     : {len(df):,}")

df.dropna(inplace=True)
df.drop_duplicates(subset=["UserId", "ProductId"], keep="last", inplace=True)
print(f"   After clean  : {len(df):,}")

# Step 2: Sample for speed
if len(df) > 200000:
    df = df.sample(n=200000, random_state=42)
    print(f"   Sampled to   : {len(df):,} rows")

# Step 3: Filter active users & products
user_counts = df["UserId"].value_counts()
product_counts = df["ProductId"].value_counts()

df = df[
    df["UserId"].isin(user_counts[user_counts >= 3].index) &
    df["ProductId"].isin(product_counts[product_counts >= 3].index)
]
print(f"   After filter : {len(df):,} rows")
print(f"   Unique users : {df['UserId'].nunique():,}")
print(f"   Unique prods : {df['ProductId'].nunique():,}")

# Step 4: Build product map
product_ids = df["ProductId"].unique().tolist()
product_map = {pid: idx for idx, pid in enumerate(product_ids)}
print(f"\n🗺️  Product map  : {len(product_map):,} products indexed")

# Step 5: Train SVD
print("\n🤖 Training SVD model...")
reader = Reader(rating_scale=(1, 5))
data = Dataset.load_from_df(df[["UserId", "ProductId", "Score"]], reader)

print("   Running 3-fold cross-validation...")
results = cross_validate(
    SVD(n_factors=50, n_epochs=20, random_state=42),
    data,
    measures=["RMSE", "MAE"],
    cv=3,
    verbose=False
)
print(f"   RMSE: {results['test_rmse'].mean():.4f} ± {results['test_rmse'].std():.4f}")
print(f"   MAE : {results['test_mae'].mean():.4f} ± {results['test_mae'].std():.4f}")

print("\n   Training final model on full data...")
trainset = data.build_full_trainset()
model = SVD(n_factors=50, n_epochs=20, random_state=42)
model.fit(trainset)
print("   ✅ Training complete!")

# Step 6: Save model
with open(MODEL_PATH, "wb") as f:
    pickle.dump(model, f)
with open(MAP_PATH, "wb") as f:
    pickle.dump({"product_ids": product_ids, "product_map": product_map}, f)

print(f"\n💾 Model saved  : {MODEL_PATH}")
print(f"💾 Map saved    : {MAP_PATH}")

# Step 7: Quick test
print("\n🧪 Quick prediction test...")
sample_user = df["UserId"].iloc[0]
sample_product = df["ProductId"].iloc[0]
pred = model.predict(sample_user, sample_product)
print(f"   User    : {sample_user}")
print(f"   Product : {sample_product}")
print(f"   Predicted rating: {pred.est:.2f} (actual: {pred.r_ui})")

print("\n" + "=" * 55)
print("  ✅ SVD model ready for Flask integration (Step 17)")
print("=" * 55)