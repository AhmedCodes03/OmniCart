import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, ArrowLeft, Store, Tag, Package, Send, ShieldCheck, Globe, Cpu, Zap, Activity, Info } from 'lucide-react';
import API from '../api/axios';
import StarRating from '../components/common/StarRating';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const { isAuthenticated, role } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [reviewStats, setReviewStats] = useState({ avg_sentiment: 0.5, total_reviews: 0 });
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  const [submitting, setSubmitting] = useState(false);

  const formatPrice = (p) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(p);

  useEffect(() => {
    setLoading(true);
    // 1. Core Data - Load this first
    API.get(`/products/${id}`)
      .then(res => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Product not found');
        setLoading(false);
      });

    // 2. Secondary Data - Load in background
    API.get(`/products/${id}/reviews`)
      .then(res => {
        setReviews(res.data.reviews || []);
        setReviewStats({
          avg_sentiment: res.data.avg_sentiment,
          total_reviews: res.data.total_reviews
        });
      })
      .catch(() => {});

    API.get(`/recommendations/similar/${id}`)
      .then(async res => {
        const similarProducts = res.data.similar || [];
        setSimilar(similarProducts);

        // Fetch AI explanations only if logged in
        if (isAuthenticated && role === 'customer' && similarProducts.length > 0) {
          similarProducts.slice(0, 3).forEach(async (p) => {
            try {
              const expRes = await API.post('/recommendations/explain', { product_id: p.product_id });
              setSimilar(prev => prev.map(item => 
                item.product_id === p.product_id ? { ...item, ai_explanation: expRes.data.explanation } : item
              ));
            } catch {}
          });
        }
      })
      .catch(() => setSimilar([]));
  }, [id, isAuthenticated, role]);



  const handleReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post('/reviews', { product_id: parseInt(id), ...reviewForm });
      toast.success('Feedback transmission successful.');
      const rRes = await API.get(`/products/${id}/reviews`);
      setReviews(rRes.data.reviews || []);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Transmission aborted'); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="Syncing unit data..." /></div>;
  if (!product) return <div className="section-padding py-24 text-center relative"><div className="absolute inset-0 bg-primary-500/[0.02] pointer-events-none" /><h2 className="text-4xl font-black text-surface-400 tracking-tighter">Unit not found in active database.</h2></div>;

  return (
    <div className="section-padding py-24 sm:py-32 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-500/5 rounded-full blur-[140px] pointer-events-none" />

      <Link to="/products" className="inline-flex items-center gap-4 text-surface-600 dark:text-surface-400 hover:text-primary-500 font-black text-[10px] uppercase tracking-[0.4em] transition-all mb-16 group">
        <div className="w-8 h-8 rounded-xl glass flex items-center justify-center group-hover:bg-primary-500/10">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        </div>
        Back to Shop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32 mb-40">
        {/* Product Visual Container */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative group">
          <div className="glass-strong rounded-[60px] p-20 flex items-center justify-center min-h-[600px] overflow-hidden border border-surface-200 dark:border-white/10 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-primary-500/[0.03] rounded-full floating" />
            
            <span className="text-[15rem] font-black text-surface-950/5 dark:text-white/5 select-none transition-transform duration-[2s] group-hover:scale-125 group-hover:rotate-6">
              {product.brand?.[0] || product.name?.[0]}
            </span>

            {product.brand && (
              <div className="absolute top-12 right-12 px-8 py-3 rounded-full glass border border-primary-500/20 shadow-xl">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-500">{product.brand}</span>
              </div>
            )}

            <div className="absolute bottom-12 left-12 flex items-center gap-4">
              <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-surface-600 dark:text-surface-400">Authentic Product Link</span>
            </div>
          </div>
        </motion.div>

        {/* Product Intelligence */}
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="flex flex-col justify-center">
          <div className="mb-12">
            {product.category && (
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 rounded-xl glass flex items-center justify-center text-primary-500">
                  <Activity className="w-4 h-4 floating" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-500 block">{product.category.name}</span>
              </div>
            )}
            <h1 className="text-6xl sm:text-7xl font-black text-surface-950 dark:text-white mb-8 tracking-tighter leading-[0.9]">{product.name}</h1>
            <div className="flex items-center gap-8">
              <StarRating rating={product.avg_rating || 0} count={product.review_count || 0} />
              <div className="h-6 w-px bg-surface-200 dark:bg-white/10" />
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black text-surface-600 dark:text-surface-400 uppercase tracking-[0.3em]">Quality Assured</span>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <p className="text-5xl font-black text-surface-950 dark:text-white tracking-tighter mb-8">{formatPrice(product.price)}</p>
            {product.description && (
              <p className="text-surface-600 dark:text-surface-400 leading-relaxed font-bold text-xl max-w-xl">{product.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-12 mb-16 py-10 border-y border-surface-100 dark:border-white/5 relative">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-surface-600 dark:text-surface-400">Merchant Entity</p>
              <p className="text-base font-black text-surface-950 dark:text-white flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg glass flex items-center justify-center">
                  <Store className="w-3 h-3 text-primary-500" />
                </div>
                {product.vendor?.store_name || 'Studio Official'}
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-surface-600 dark:text-surface-400">Stock Availability</p>
              <p className={`text-base font-black ${product.stock_qty > 0 ? 'text-emerald-500' : 'text-rose-500'} flex items-center gap-3`}>
                <div className="w-6 h-6 rounded-lg glass flex items-center justify-center">
                  <Package className={`w-3 h-3 ${product.stock_qty > 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
                </div>
                {product.stock_qty > 0 ? `${product.stock_qty} Units in Stock` : 'Out of Stock'}
              </p>
            </div>
          </div>

          {isAuthenticated && role === 'customer' && product.stock_qty > 0 && (
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="flex items-center glass rounded-2xl p-2 border border-surface-200 dark:border-white/10">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-14 h-14 flex items-center justify-center text-surface-400 hover:text-primary-500 transition-all font-black text-2xl hover:scale-125">−</button>
                <span className="w-14 text-center font-black text-xl text-surface-950 dark:text-white tracking-tighter">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock_qty, qty + 1))} className="w-14 h-14 flex items-center justify-center text-surface-400 hover:text-primary-500 transition-all font-black text-2xl hover:scale-125">+</button>
              </div>
              <button onClick={() => addToCart(product.product_id, qty)} className="btn-primary !px-16 !py-6 !rounded-[24px] flex items-center gap-5 flex-1 shadow-2xl shadow-primary-500/30 floating">
                <ShoppingCart className="w-6 h-6 stroke-[3]" /> 
                <span className="uppercase tracking-[0.3em] text-[11px] font-black">Add to Cart</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Community Matrix Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-24 relative z-10">
        <div className="lg:col-span-2 space-y-20">
          <div>
            <div className="flex items-center gap-4 mb-10">
              <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-primary-500">
                <Globe className="w-5 h-5 floating" />
              </div>
              <h2 className="text-4xl font-black text-surface-950 dark:text-white tracking-tighter">Customer Reviews.</h2>
            </div>

            {isAuthenticated && role === 'customer' && (
              <form onSubmit={handleReview} className="glass rounded-[40px] p-10 border border-surface-200 dark:border-white/10 mb-16 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -ml-16 -mt-16" />
                <h3 className="text-[10px] font-black text-surface-600 dark:text-surface-400 uppercase tracking-[0.4em] mb-8 relative z-10">Write a Review</h3>
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  {[1,2,3,4,5].map((s) => (
                    <button key={s} type="button" onClick={() => setReviewForm(p => ({ ...p, rating: s }))}>
                      <Star className={`w-8 h-8 transition-all ${s <= reviewForm.rating ? 'text-amber-400 fill-amber-400 scale-125' : 'text-surface-200 dark:text-white/10 hover:scale-110'}`} />
                    </button>
                  ))}
                </div>
                <textarea value={reviewForm.comment} onChange={(e) => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                  placeholder="Share your experience with this product..." className="input-field glass mb-8 min-h-[160px] resize-none !rounded-3xl !py-6 !px-8 !font-bold relative z-10" />
                <button type="submit" disabled={submitting} className="btn-primary !py-4 !px-10 !rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-4 relative z-10 floating">
                  {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-5 h-5 stroke-[2.5]" /> Submit Review</>}
                </button>
              </form>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {reviews.length === 0 ? (
                <div className="md:col-span-2 glass p-12 rounded-[40px] text-center border border-dashed border-surface-200 dark:border-white/10">
                  <Info className="w-10 h-10 text-surface-300 mx-auto mb-6" />
                  <p className="text-surface-600 dark:text-surface-400 font-bold uppercase tracking-widest text-[10px]">No reviews found for this product yet.</p>
                </div>
              ) : (
                reviews.map((r) => (
                  <div key={r.review_id} className="glass p-10 rounded-[40px] border border-surface-200 dark:border-white/5 group hover:border-primary-500/20 transition-all duration-700">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full glass border border-primary-500/20 flex items-center justify-center text-primary-500 font-black text-xs">
                          {r.customer_name?.[0] || 'U'}
                        </div>
                        <span className="font-black text-surface-950 dark:text-white text-base tracking-tight">{r.customer_name || 'Verified Buyer'}</span>
                      </div>
                      <span className="text-[9px] font-black text-surface-600 dark:text-surface-400 uppercase tracking-widest">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <StarRating rating={r.rating} size={14} showNumber={false} />
                    {r.comment && <p className="text-surface-600 dark:text-surface-400 text-base mt-6 font-bold leading-relaxed">{r.comment}</p>}
                    
                    {/* AI Sentiment Badge */}
                    <div className="mt-6 flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${r.sentiment_score >= 0.6 ? 'bg-emerald-500' : r.sentiment_score >= 0.4 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${r.sentiment_score >= 0.6 ? 'text-emerald-500' : r.sentiment_score >= 0.4 ? 'text-amber-500' : 'text-rose-500'}`}>
                        {r.sentiment_score >= 0.6 ? 'Positive Feedback' : r.sentiment_score >= 0.4 ? 'Neutral Stance' : 'Critical Analysis'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>


        <div className="space-y-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-8 h-8 rounded-xl glass flex items-center justify-center text-primary-500">
              <Zap className="w-4 h-4 floating" />
            </div>
            <h2 className="text-3xl font-black text-surface-950 dark:text-white tracking-tighter">You May Also Like.</h2>
          </div>
          <div className="space-y-10">
            {similar.slice(0, 4).map((p, i) => (
              <div key={p.product_id} className="relative">
                <ProductCard product={p} index={i} />
                {p.ai_explanation && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-6 rounded-2xl glass-strong border border-primary-500/20 bg-primary-500/5 relative overflow-hidden"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Cpu className="w-3 h-3 text-primary-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary-500">AI Recommendation Reason</span>
                    </div>
                    <p className="text-[11px] text-surface-600 dark:text-surface-300 font-bold leading-relaxed italic">
                      "{p.ai_explanation}"
                    </p>
                  </motion.div>
                )}
              </div>
            ))}
            {similar.length === 0 && (

              <div className="glass p-10 rounded-[30px] border border-surface-100 dark:border-white/5">
                <p className="text-surface-600 dark:text-surface-400 font-bold uppercase tracking-widest text-[10px]">No related products found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
