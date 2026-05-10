import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, CreditCard, Clock, CheckCircle2, ShieldCheck, Box, Layers } from 'lucide-react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/orders/${id}`).then(res => setOrder(res.data.order)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const formatPrice = (p) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(p);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="Decrypting Allocation Data..." /></div>;
  if (!order) return (
    <div className="section-padding py-32 text-center">
      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-8 text-red-500">
        <Layers className="w-10 h-10" />
      </div>
      <p className="text-surface-500 font-black uppercase tracking-widest text-xs">Allocation Identifier Not Found</p>
    </div>
  );

  const steps = ['pending', 'confirmed', 'shipped', 'delivered'];
  const currentStep = steps.indexOf(order.status);

  return (
    <div className="section-padding py-16 sm:py-24">
      <Link to="/dashboard/orders" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 hover:text-primary-500 mb-12 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to History
      </Link>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-16 gap-10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-500 mb-4 block">Transaction Specification</span>
            <h1 className="text-5xl sm:text-6xl font-black text-surface-950 dark:text-white mb-4 tracking-tighter">Order <span className="text-surface-400">#{order.order_id}.</span></h1>
            <div className="flex flex-wrap items-center gap-6 text-[10px] font-black text-surface-400 uppercase tracking-widest">
              <span className="flex items-center gap-3"><Clock className="w-4 h-4 text-primary-500" /> {new Date(order.placed_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="flex items-center gap-3"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Protocol 256-bit</span>
            </div>
          </div>
          <div className={`px-8 py-3 rounded-full text-sm font-black uppercase tracking-[0.2em] border ${
            order.status === 'delivered' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' :
            order.status === 'cancelled' ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' :
            'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
          }`}>
            {order.status}
          </div>
        </header>

        {/* Progress Visualization */}
        {order.status !== 'cancelled' && (
          <div className="glass rounded-[48px] p-10 sm:p-16 mb-16 border border-surface-200 dark:border-white/5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
            <div className="flex justify-between relative">
              <div className="absolute top-[22px] left-8 right-8 h-[2px] bg-surface-100 dark:bg-white/5">
                <div className="h-full bg-primary-500 transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(139,92,246,0.5)]" 
                  style={{ width: `${Math.max(0, currentStep) / (steps.length - 1) * 100}%` }} />
              </div>
              {steps.map((s, i) => (
                <div key={s} className="relative flex flex-col items-center z-10 w-1/4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                    i <= currentStep 
                    ? 'bg-primary-500 border-primary-400 text-white shadow-xl shadow-primary-500/30 rotate-0' 
                    : 'bg-surface-50 dark:bg-white/[0.03] text-surface-300 dark:text-surface-600 border-surface-100 dark:border-white/5 rotate-45'
                  }`}>
                    {i < currentStep ? <CheckCircle2 className="w-6 h-6" /> : <span className={`text-xs font-black ${i <= currentStep ? '' : '-rotate-45'}`}>{i + 1}</span>}
                  </div>
                  <span className={`text-[10px] mt-6 font-black uppercase tracking-widest transition-colors ${i <= currentStep ? 'text-primary-500' : 'text-surface-400'}`}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Items Inventory */}
          <div className="lg:col-span-2 glass rounded-[48px] p-10 sm:p-12 border border-surface-200 dark:border-white/5 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-surface-950 dark:text-white mb-10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                <Package className="w-5 h-5" />
              </div>
              Module Inventory
            </h3>
            <div className="space-y-8">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-center group">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-surface-50 dark:bg-white/[0.03] border border-surface-100 dark:border-white/5 flex items-center justify-center text-surface-300 group-hover:text-primary-500 group-hover:border-primary-500/30 transition-all">
                      <Box className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-surface-950 dark:text-white tracking-tight group-hover:text-primary-500 transition-colors">{item.product_name || `Hardware Module #${item.product_id}`}</p>
                      <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em] mt-1">{item.quantity} Units × {formatPrice(item.unit_price)}</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-surface-950 dark:text-white tracking-tighter">{formatPrice(item.unit_price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Summary */}
          <div className="space-y-8">
            <div className="glass rounded-[48px] p-10 border border-surface-200 dark:border-white/5 shadow-xl">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-surface-950 dark:text-white mb-8 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <CreditCard className="w-5 h-5" />
                </div>
                Settlement
              </h3>
              {order.payment ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Protocol</span>
                    <span className="text-sm font-black text-surface-950 dark:text-white uppercase tracking-tighter">{order.payment.method?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Status</span>
                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${order.payment.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                      {order.payment.status}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-surface-400 text-xs font-medium italic">No settlement data verified.</p>
              )}
            </div>

            <div className="glass-strong rounded-[48px] p-10 border border-primary-500/20 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-8 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <Clock className="w-5 h-5" />
                </div>
                Valuation
              </h3>
              <div className="space-y-4 pt-6 border-t border-white/10">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-surface-400 uppercase tracking-[0.4em]">Total Net Value</span>
                  <span className="text-4xl font-black text-white tracking-tighter leading-none">{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
