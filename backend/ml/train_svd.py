import pandas as pd
import numpy as np
import pickle
import os
import sys
from sklearn.decomposition import TruncatedSVD

# Add backend to path for app imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app import create_app

# Config
DATA_PATH = os.path.join(os.path.dirname(__file__), "Reviews.csv")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "svd_model.pkl")

print("=" * 55)
print("  OmniCart — SVD (via Scikit-Learn) Training")
print("=" * 55)

# Step 1: Load & Clean Data
print("\n📂 Loading dataset...")
if not os.path.exists(DATA_PATH):
    print(f"❌ ERROR: {DATA_PATH} not found.")
    sys.exit(1)

# Loading a subset for stability; increase if you have >16GB RAM
df = pd.read_csv(DATA_PATH, usecols=["UserId", "ProductId", "Score"], nrows=200000)
df.dropna(inplace=True)
df.drop_duplicates(subset=["UserId", "ProductId"], keep="last", inplace=True)
print(f"   Rows loaded: {len(df):,}")

# Step 2: Filter for active users/products to reduce sparsity
user_counts = df["UserId"].value_counts()
prod_counts = df["ProductId"].value_counts()
df = df[df["UserId"].isin(user_counts[user_counts >= 3].index)]
df = df[df["ProductId"].isin(prod_counts[prod_counts >= 3].index)]
print(f"   Filtered to {len(df):,} high-quality interactions.")

# Step 3: Create Pivot Table
print("🔢 Building User-Product Matrix...")
user_item_matrix = df.pivot_table(index='UserId', columns='ProductId', values='Score').fillna(0)
user_ids = user_item_matrix.index.tolist()
product_ids = user_item_matrix.columns.tolist()

# Step 4: Train SVD
print("🤖 Decomposing Matrix (SVD)...")
n_factors = min(50, user_item_matrix.shape[1] - 1)
svd = TruncatedSVD(n_components=n_factors, random_state=42)
user_factors = svd.fit_transform(user_item_matrix)
item_factors = svd.components_.T

# Step 5: Save Model
# We save the factors and maps so the API can calculate scores instantly
payload = {
    "user_factors": user_factors,
    "item_factors": item_factors,
    "user_id_map": {uid: i for i, uid in enumerate(user_ids)},
    "product_id_map": {pid: i for i, pid in enumerate(product_ids)},
    "global_mean": df["Score"].mean()
}

with open(MODEL_PATH, "wb") as f:
    pickle.dump(payload, f)

print(f"\n✅ Model saved: {MODEL_PATH}")
print("=" * 55)