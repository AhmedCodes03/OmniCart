import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingBag, Package, Calendar, User, ChevronRight } from 'lucide-react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/orders/vendor').then(r => setOrders(r.data.orders || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const formatPrice = (p) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(p);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="Retrieving Ledger..." /></div>;

  return (
    <div className="section-padding py-16 sm:py-24">
      <Link to="/vendor" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 hover:text-primary-500 mb-12 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Studio
      </Link>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <header className="mb-16">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-500 mb-4 block">Sales Repository</span>
          <h1 className="text-5xl sm:text-6xl font-black text-surface-950 dark:text-white mb-4 tracking-tighter">Order <span className="text-surface-400">History.</span></h1>
          <p className="text-surface-500 font-medium text-lg">Comprehensive log of all fulfilled and pending transactions.</p>
        </header>

        {orders.length === 0 ? (
          <div className="glass p-20 rounded-[48px] border border-surface-200 dark:border-white/5 text-center shadow-xl">
            <div className="w-20 h-20 rounded-full bg-surface-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-8">
              <ShoppingBag className="w-10 h-10 text-surface-300 dark:text-white/10" />
            </div>
            <p className="text-surface-500 font-black uppercase tracking-widest text-xs">No active allocations found in the repository.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {orders.map((o, i) => (
              <motion.div key={o.order_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} 
                className="glass p-10 rounded-[40px] border border-surface-200 dark:border-white/5 hover:border-primary-500/30 transition-all group relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex flex-col lg:flex-row justify-between gap-12 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-6 mb-6">
                      <h3 className="font-black text-2xl text-surface-950 dark:text-white tracking-tighter">Allocation #{o.order_id}</h3>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        o.status === 'delivered' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' :
                        o.status === 'cancelled' ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' :
                        'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                      }`}>{o.status}</span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-8 text-[10px] font-black text-surface-400 uppercase tracking-widest">
                      <span className="flex items-center gap-3"><Calendar className="w-4 h-4 text-primary-500" /> {new Date(o.placed_at).toLocaleDateString()}</span>
                      <span className="flex items-center gap-3"><User className="w-4 h-4 text-primary-500" /> System ID: {o.customer_name || 'Anonymous'}</span>
                    </div>
                  </div>

                  <div className="lg:text-right">
                    <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em] mb-2">Total Unit Value</p>
                    <p className="text-3xl font-black text-surface-950 dark:text-white tracking-tighter">{formatPrice(o.items.reduce((s, item) => s + (item.subtotal || 0), 0))}</p>
                  </div>
                </div>

                <div className="mt-10 pt-10 border-t border-surface-100 dark:border-white/5 space-y-6 relative z-10">
                  {o.items.map((item, j) => (
                    <div key={j} className="flex justify-between items-center group/item">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-2xl bg-surface-50 dark:bg-white/[0.03] border border-surface-100 dark:border-white/5 flex items-center justify-center text-surface-300 group-hover/item:text-primary-500 group-hover/item:border-primary-500/30 transition-all">
                          <Package className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-lg font-black text-surface-950 dark:text-white tracking-tight group-hover/item:text-primary-500 transition-colors">{item.product_name}</p>
                          <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em] mt-1">{item.quantity} Units × {formatPrice(item.unit_price)}</p>
                        </div>
                      </div>
                      <span className="font-black text-surface-950 dark:text-white tracking-tighter text-xl">{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
