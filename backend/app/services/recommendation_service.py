import pickle
import os
import numpy as np

# Path logic: app/services -> app -> root -> ml
ML_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "ml")
SVD_PATH = os.path.join(ML_DIR, "svd_model.pkl")
TFIDF_PATH = os.path.join(ML_DIR, "tfidf_model.pkl")
SENTIMENT_PATH = os.path.join(ML_DIR, "sentiment_model.pkl")

# Debug path log (will show in Railway logs)
print(f"ML Models Directory: {os.path.abspath(ML_DIR)}")

_svd_model = None
_tfidf_data = None

def _load_svd():
    global _svd_model
    if _svd_model is None:
        if not os.path.exists(SVD_PATH): return None
        with open(SVD_PATH, "rb") as f:
            _svd_model = pickle.load(f)
    return _svd_model

def _load_tfidf():
    global _tfidf_data
    if _tfidf_data is None:
        if not os.path.exists(TFIDF_PATH): return None
        with open(TFIDF_PATH, "rb") as f:
            _tfidf_data = pickle.load(f)
    return _tfidf_data


def get_similar_products(product_id: int, top_n: int = 5) -> list:
    try:
        data = _load_tfidf()
        if data:
            cosine_sim = data["cosine_sim"]
            id_to_idx = data["product_id_to_idx"]
            idx_to_id = data["idx_to_product_id"]
            if product_id in id_to_idx:
                idx = id_to_idx[product_id]
                sim_scores = list(enumerate(cosine_sim[idx]))
                sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
                sim_scores = [(idx_to_id[i], round(s, 4)) for i, s in sim_scores
                            if idx_to_id[i] != product_id]
                return sim_scores[:top_n]
        
        # Fallback: Simple category-based similarity if ML fails
        from ..models import Product
        current_p = Product.query.get(product_id)
        if current_p:
            similar = Product.query.filter(
                Product.category_id == current_p.category_id,
                Product.product_id != product_id,
                Product.is_active == True
            ).limit(top_n).all()
            return [(p.product_id, 0.5) for p in similar]
            
        return []
    except Exception as e:
        print(f"Similarity error: {e}")
        return []


def analyze_review_sentiment(text: str) -> dict:
    try:
        from textblob import TextBlob
        if not text or not str(text).strip():
            score = 0.5
        else:
            polarity = TextBlob(str(text)).sentiment.polarity
            score = round((polarity + 1) / 2, 3)
        if score >= 0.6: label = "positive"
        elif score >= 0.4: label = "neutral"
        else: label = "negative"
        return {"score": score, "label": label}
    except Exception as e:
        print(f"Sentiment error: {e}")
        return {"score": 0.5, "label": "neutral"}


def get_svd_recommendations(user_id: str, product_ids: list, top_n: int = 5) -> list:
    try:
        model = _load_svd()
        tfidf = _load_tfidf()
        if not model or not tfidf:
            return [(pid, 3.0) for pid in product_ids[:top_n]]
            
        id_to_idx = tfidf["product_id_to_idx"]
        scores = []
        for pid in product_ids:
            # SVD model was trained on idx-based pseudo IDs for speed
            idx = id_to_idx.get(pid, 0)
            amazon_pid = f"B{str(idx).zfill(9)}"
            pred = model.predict(str(user_id), amazon_pid)
            scores.append((pid, round(pred.est, 4)))
        scores.sort(key=lambda x: x[1], reverse=True)
        return scores[:top_n]
    except Exception as e:
        print(f"SVD error: {e}")
        return [(pid, 3.0) for pid in product_ids[:top_n]]


def get_hybrid_recommendations(customer_id: int, product_ids: list, recently_viewed_id: int = None, top_n: int = 5) -> list:
    try:
        svd_scores = dict(get_svd_recommendations(str(customer_id), product_ids, top_n=len(product_ids)))
        tfidf_scores = {}
        if recently_viewed_id:
            similar = get_similar_products(recently_viewed_id, top_n=len(product_ids))
            tfidf_scores = dict(similar)
        if svd_scores:
            min_s = min(svd_scores.values())
            max_s = max(svd_scores.values())
            rng = max_s - min_s if max_s != min_s else 1
            svd_scores = {k: (v - min_s) / rng for k, v in svd_scores.items()}
        hybrid = []
        for pid in product_ids:
            svd_s = svd_scores.get(pid, 0.5)
            tfidf_s = tfidf_scores.get(pid, 0.0)
            combined = (0.6 * svd_s) + (0.4 * tfidf_s) if tfidf_scores else svd_s
            hybrid.append((pid, round(combined, 4)))
        hybrid.sort(key=lambda x: x[1], reverse=True)
        return hybrid[:top_n]
    except Exception as e:
        print(f"Hybrid error: {e}")
        return [(pid, 0.5) for pid in product_ids[:top_n]]