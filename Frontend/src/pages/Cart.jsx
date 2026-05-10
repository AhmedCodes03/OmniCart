import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus, ShoppingCart, Box, Zap, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import BorderGlow from '../components/ui/BorderGlow';

export default function Cart() {
  const { cart, cartTotal, removeFromCart, clearCart, updateQuantity } = useCart();
  const navigate = useNavigate();

  const formatPrice = (p) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(p);

  if (cart.length === 0) return (
    <div className="section-padding py-40 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-primary-500/[0.02] pointer-events-none" />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="w-32 h-32 rounded-[40px] glass flex items-center justify-center mx-auto mb-10 border border-primary-500/20 shadow-2xl">
          <ShoppingCart className="w-12 h-12 text-primary-500 floating" />
        </div>
        <h2 className="text-5xl font-black text-surface-950 dark:text-white mb-6 tracking-tighter">Your cart is empty.</h2>
        <p className="text-surface-600 dark:text-surface-400 font-bold uppercase tracking-widest text-[10px] mb-12 max-w-md mx-auto">Looks like you haven't added any products to your cart yet.</p>
        <Link to="/products" className="btn-primary !px-12 !py-6 !rounded-3xl inline-flex items-center gap-4 shadow-2xl shadow-primary-500/30 floating">
          Start Shopping <ArrowRight className="w-6 h-6 stroke-[3]" />
        </Link>
      </motion.div>
    </div>
  );

  return (
    <div className="section-padding py-24 sm:py-32 relative">
      {/* Background Blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-[140px] pointer-events-none" />
      
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-primary-500">
            <ShoppingBag className="w-5 h-5 floating" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-500 block">Cart Summary</span>
        </div>
        <h1 className="text-6xl sm:text-8xl font-black text-surface-950 dark:text-white mb-16 tracking-tighter leading-tight">My <span className="text-surface-400">Cart.</span></h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-6">
              {cart.map((item, i) => (
                <motion.div key={item.product_id} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="w-full">
                  <BorderGlow className="w-full" borderRadius={40} glowRadius={10} animated={true}>
                    <div className="p-8 flex flex-col sm:flex-row items-center gap-8 group relative overflow-hidden w-full">
                      <div className="absolute inset-0 bg-primary-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="w-24 h-24 rounded-[30px] glass flex items-center justify-center shrink-0 overflow-hidden relative border-primary-500/20">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-transparent" />
                        <span className="text-3xl font-black text-primary-500 relative z-10">{item.product_name?.[0]}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0 relative z-10">
                        <Link to={`/products/${item.product_id}`} className="text-2xl font-black text-surface-950 dark:text-white hover:text-primary-500 transition-colors line-clamp-1 tracking-tight">{item.product_name}</Link>
                        <p className="text-[10px] font-black text-surface-500 dark:text-surface-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                          <Zap className="w-3 h-3 text-amber-500" /> Unit Price: {formatPrice(item.product_price)}
                        </p>
                      </div>
 
                      <div className="flex items-center glass rounded-2xl p-2 border border-surface-200 dark:border-white/10 relative z-10">
                        <button onClick={() => item.quantity > 1 && updateQuantity(item.product_id, item.quantity - 1)} className="w-12 h-12 flex items-center justify-center text-surface-400 hover:text-primary-500 transition-colors font-black text-xl hover:scale-125">−</button>
                        <span className="w-10 text-center text-base font-black text-surface-950 dark:text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)} className="w-12 h-12 flex items-center justify-center text-surface-400 hover:text-primary-500 transition-colors font-black text-xl hover:scale-125">+</button>
                      </div>

                      <div className="text-right min-w-[140px] relative z-10">
                        <p className="text-2xl font-black text-surface-950 dark:text-white tracking-tighter">{formatPrice(item.subtotal)}</p>
                      </div>

                      <button onClick={() => removeFromCart(item.cart_id)} className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-surface-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all relative z-10 group/trash">
                        <Trash2 className="w-5 h-5 group-hover/trash:scale-110 transition-transform" />
                      </button>
                    </div>
                  </BorderGlow>
                </motion.div>
              ))}
            </div>
            
            <button onClick={clearCart} className="text-[10px] font-black uppercase tracking-[0.3em] text-surface-500 dark:text-surface-400 hover:text-rose-500 transition-colors px-10 py-4 glass rounded-2xl hover:bg-rose-500/5">Clear Cart</button>
          </div>

          {/* Summary Matrix */}
          <div className="relative sticky top-32 h-fit">
            <BorderGlow className="w-full" borderRadius={50} glowRadius={10} animated={true}>
              <div className="p-12 shadow-2xl overflow-hidden w-full">
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/10 rounded-full blur-[100px] -mr-20 -mt-20" />
                
                <h3 className="text-2xl font-black text-surface-950 dark:text-white mb-10 tracking-tighter flex items-center gap-4">
                  <ShieldCheck className="w-6 h-6 text-primary-500" /> Order Summary.
                </h3>
                
                <div className="space-y-6 mb-12 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500 dark:text-surface-400">Subtotal</span>
                    <span className="text-lg font-black text-surface-950 dark:text-white tracking-tighter">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500 dark:text-surface-400">Shipping</span>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-[0.2em] glass px-4 py-1 rounded-full">Calculated at Checkout</span>
                  </div>
                  <div className="pt-10 border-t border-surface-200 dark:border-white/10 flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-surface-950 dark:text-white">Total</span>
                    <span className="text-4xl font-black gradient-text tracking-tighter">{formatPrice(cartTotal)}</span>
                  </div>
                </div>

                <button onClick={() => navigate('/checkout')} className="btn-primary w-full !py-6 !rounded-[24px] flex items-center justify-center gap-5 shadow-2xl shadow-primary-500/30 group relative z-10 floating">
                  <span className="text-[11px] font-black uppercase tracking-[0.3em]">Checkout Now</span>
                  <ArrowRight className="w-6 h-6 stroke-[3] group-hover:translate-x-2 transition-transform" />
                </button>
                
                <Link to="/products" className="block text-center text-[10px] font-black uppercase tracking-[0.3em] text-surface-600 dark:text-surface-400 hover:text-primary-500 mt-10 transition-colors">Continue Shopping</Link>
              </div>
            </BorderGlow>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
