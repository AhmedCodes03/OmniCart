import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, Eye, Sparkles, Zap, Package, ShieldCheck } from 'lucide-react';
import StarRating from '../common/StarRating';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import BorderGlow from '../ui/BorderGlow';

export default function ProductCard({ product, index = 0 }) {
  const { isAuthenticated, role } = useAuth();
  const { addToCart } = useCart();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const gradients = [
    'from-primary-500/10 to-indigo-600/5',
    'from-rose-500/10 to-pink-600/5',
    'from-emerald-500/10 to-teal-600/5',
    'from-amber-500/10 to-orange-600/5',
    'from-cyan-500/10 to-blue-600/5',
    'from-violet-500/10 to-fuchsia-600/5',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.03 }}
      className="group relative"
    >
      <BorderGlow className="h-full w-full" borderRadius={40} glowRadius={10} animated={true}>
        <div className="flex flex-col relative h-full w-full p-5 z-10 group-hover:shadow-primary-500/10 transition-all duration-700">
          {/* Background Ambient Orb */}
          <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${gradients[index % gradients.length]} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

          {/* Visual Terminal Area */}
          <div className={`relative h-56 sm:h-64 rounded-[30px] bg-gradient-to-br ${gradients[index % gradients.length]} mb-6 flex items-center justify-center overflow-hidden border border-surface-100 dark:border-white/5`}>
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="text-7xl font-black text-surface-950/5 dark:text-white/5 group-hover:scale-150 group-hover:rotate-12 transition-all duration-[1.5s] ease-out select-none">
                {product.brand?.[0] || product.name?.[0] || 'O'}
              </div>
            )}

            {/* Rapid Action Interface */}
            <div className="absolute inset-0 bg-surface-950/0 group-hover:bg-surface-950/60 backdrop-blur-[2px] transition-all duration-700 flex items-center justify-center gap-5 opacity-0 group-hover:opacity-100">
              <Link
                to={`/products/${product.product_id}`}
                className="w-14 h-14 rounded-2xl glass-strong border border-white/20 flex items-center justify-center text-white hover:bg-primary-500 hover:border-primary-500 transition-all transform translate-y-10 group-hover:translate-y-0 duration-700"
              >
                <Eye className="w-6 h-6 stroke-[2.5]" />
              </Link>
              {isAuthenticated && role === 'customer' && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    addToCart(product.product_id);
                  }}
                  className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center text-white hover:bg-primary-600 transition-all transform translate-y-10 group-hover:translate-y-0 duration-700 delay-75 shadow-2xl shadow-primary-500/40"
                >
                  <ShoppingCart className="w-6 h-6 stroke-[2.5]" />
                </button>
              )}
            </div>

            {/* Allocation Badges */}
            <div className="absolute top-5 left-5 flex flex-col gap-3">
              {product.stock_qty <= 5 && product.stock_qty > 0 && (
                <span className="glass !px-4 !py-1.5 !rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-amber-500 border border-amber-500/30 flex items-center gap-2">
                  <Zap className="w-3 h-3" /> Critical Stock
                </span>
              )}
              {product.stock_qty === 0 && (
                <span className="glass !px-4 !py-1.5 !rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-rose-500 border border-rose-500/30 flex items-center gap-2">
                  <Package className="w-3 h-3" /> Depleted
                </span>
              )}
              {product.is_trending && (
                <span className="bg-primary-500 text-white text-[9px] px-4 py-1.5 rounded-full font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-lg shadow-primary-500/20 floating">
                  <Sparkles className="w-3 h-3" /> Trending
                </span>
              )}
            </div>
          </div>

          {/* Intelligence Module */}
          <div className="flex-1 flex flex-col px-1 relative z-10">
            <div className="mb-4">
              <Link to={`/products/${product.product_id}`}>
                <h3 className="text-xl font-black text-surface-950 dark:text-white group-hover:text-primary-500 transition-colors line-clamp-1 tracking-tighter leading-none mb-2">
                  {product.name}
                </h3>
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.3em]">{product.brand || 'Studio Spec'}</span>
                <div className="h-1 w-1 rounded-full bg-surface-200 dark:bg-white/20" />
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span className="text-[8px] font-black text-surface-500 dark:text-surface-400 uppercase tracking-widest">Verified Unit</span>
                </div>
              </div>
            </div>

            {product.description && (
              <p className="text-[11px] text-surface-600 dark:text-surface-400 font-bold line-clamp-2 mb-6 leading-relaxed uppercase tracking-widest">{product.description}</p>
            )}

            <div className="mt-auto pt-6 border-t border-surface-100 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-surface-950 dark:text-white tracking-tighter">{formatPrice(product.price)}</span>
                  <div className="mt-2 opacity-80">
                    <StarRating rating={product.avg_rating || 0} size={11} count={product.review_count || 0} />
                  </div>
                </div>

                {isAuthenticated && role === 'customer' && (
                  <button
                    onClick={() => addToCart(product.product_id)}
                    className="sm:hidden w-12 h-12 rounded-2xl glass border border-primary-500/20 text-primary-500 hover:bg-primary-500 hover:text-white transition-all shadow-xl shadow-primary-500/5 flex items-center justify-center"
                  >
                    <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </BorderGlow>
    </motion.div>
  );
}