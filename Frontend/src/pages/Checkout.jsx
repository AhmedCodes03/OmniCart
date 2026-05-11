import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Banknote, Building, ArrowRight, CheckCircle, Package, ShieldCheck, Globe, Cpu, Zap, Activity } from 'lucide-react';
import { useCart } from '../context/CartContext';
import API from '../api/axios';
import toast from 'react-hot-toast';
import BorderGlow from '../components/ui/BorderGlow';

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [method, setMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const formatPrice = (p) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(p);

  const methods = [
    { value: 'cash', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when you receive' },
    { value: 'card', label: 'Credit/Debit Card', icon: CreditCard, desc: 'Pay with card' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: Building, desc: 'Direct transfer' },
  ];

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return toast.error('Cart buffer is empty');
    setLoading(true);
    try {
      const items = cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity }));
      const res = await API.post('/orders', { cart_items: items });
      const newOrderId = res.data.order_id;

      // Map payment method for backend
      let mappedMethod = method;
      if (method === 'cash') mappedMethod = 'cash_on_delivery';
      else if (method === 'card') mappedMethod = 'credit_card';
      else if (method === 'bank') mappedMethod = 'bank_transfer';

      // Process payment
      await API.post('/payments', {
        order_id: newOrderId,
        method: mappedMethod,
        amount: cartTotal
      });

      setOrderId(newOrderId);
      setSuccess(true);
      clearCart();
      toast.success('Order placed and payment authorized.');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to deploy order'); }
    finally { setLoading(false); }
  };

  if (success) return (
    <div className="section-padding py-40 text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-emerald-500/[0.02] pointer-events-none" />
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="w-32 h-32 rounded-[40px] glass flex items-center justify-center mx-auto mb-10 border border-emerald-500/20 shadow-2xl">
          <CheckCircle className="w-12 h-12 text-emerald-500 floating" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500 mb-6 block">Transaction Authorized</span>
        <h1 className="text-6xl sm:text-8xl font-black text-surface-950 dark:text-white mb-8 tracking-tighter">Order Placed.</h1>
        <p className="text-surface-600 dark:text-surface-400 font-bold uppercase tracking-widest text-[10px] mb-16 max-w-lg mx-auto leading-relaxed">
          Order ID: <span className="text-primary-500">#{orderId}</span>. <br />
          Your products are being processed for delivery.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-8">
          <button onClick={() => navigate('/dashboard/orders')} className="btn-primary !px-12 !py-5 !rounded-3xl flex items-center justify-center gap-4 shadow-2xl floating">
            Monitor Shipment <Package className="w-5 h-5 stroke-[2.5]" />
          </button>
          <button onClick={() => navigate('/products')} className="btn-secondary glass !px-12 !py-5 !rounded-3xl border border-surface-200 dark:border-white/10 shadow-xl">
            Return to Shop
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="section-padding py-24 sm:py-32 relative">
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/5 rounded-full blur-[140px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-primary-500">
            <Activity className="w-5 h-5 floating" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-500 block">Complete Order</span>
        </div>
        <h1 className="text-6xl sm:text-8xl font-black text-surface-950 dark:text-white mb-20 tracking-tighter leading-tight">Secure <span className="text-surface-400">Checkout.</span></h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
          <div className="lg:col-span-2 space-y-16">
            {/* Allocation Summary */}
            <BorderGlow className="w-full" borderRadius={50} glowRadius={10} animated={true}>
              <div className="p-10 sm:p-14 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/5 rounded-full blur-[100px] -mr-24 -mt-24" />
                <h3 className="text-sm font-black text-surface-950 dark:text-white uppercase tracking-[0.4em] mb-12 flex items-center gap-4">
                  <Package className="w-6 h-6 text-primary-500" /> Order Summary
                </h3>
                <div className="space-y-8">
                  {cart.map((item) => (
                    <div key={item.product_id} className="flex justify-between items-center py-6 border-b border-surface-100 dark:border-white/5 last:border-0 group relative z-10">
                      <div className="space-y-2">
                        <p className="text-2xl font-black text-surface-950 dark:text-white group-hover:text-primary-500 transition-colors tracking-tight">{item.product_name}</p>
                        <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em]">Quantity: {item.quantity} Units</p>
                      </div>
                      <span className="font-black text-surface-950 dark:text-white tracking-tighter text-3xl">{formatPrice(item.product_price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </BorderGlow>

            {/* Payment Method */}
            <BorderGlow className="w-full" borderRadius={50} glowRadius={10} animated={true}>
              <div className="p-10 sm:p-14 relative overflow-hidden">
                <h3 className="text-sm font-black text-surface-950 dark:text-white uppercase tracking-[0.4em] mb-12 flex items-center gap-4">
                  <ShieldCheck className="w-6 h-6 text-primary-500" /> Payment Method
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  {methods.map((m) => (
                    <button key={m.value} onClick={() => setMethod(m.value)}
                      className={`flex flex-col items-center gap-6 p-10 rounded-[40px] border transition-all duration-700 relative overflow-hidden group ${method === m.value
                        ? 'glass bg-primary-500/10 border-primary-500/50 text-primary-600 dark:text-primary-400 shadow-2xl'
                        : 'border-surface-100 dark:border-white/5 text-surface-400 hover:bg-surface-50 dark:hover:bg-white/[0.05]'
                        }`}>
                      <div className={`w-16 h-16 rounded-2xl glass flex items-center justify-center transition-all duration-700 ${method === m.value ? 'scale-110 rotate-12 shadow-xl' : 'group-hover:scale-110'}`}>
                        <m.icon className={`w-8 h-8 ${method === m.value ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] block mb-1">{m.label}</span>
                        <span className="text-[8px] font-black uppercase tracking-[0.1em] text-surface-600 dark:text-surface-400">{m.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </BorderGlow>
          </div>

          {/* Repository Summary */}
          <div className="relative">
            <BorderGlow className="h-fit sticky top-32" borderRadius={50} glowRadius={10} animated={true}>
              <div className="p-12 h-fit overflow-hidden relative">
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary-500/10 rounded-full blur-[100px] -ml-20 -mb-20 pointer-events-none" />

                <h3 className="text-2xl font-black text-surface-950 dark:text-white mb-12 tracking-tighter flex items-center gap-4 relative z-10">
                  <Globe className="w-6 h-6 text-primary-500" /> Summary.
                </h3>

                <div className="space-y-6 mb-16 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-surface-600 dark:text-surface-400">Total Items</span>
                    <span className="font-black text-surface-950 dark:text-white tracking-tighter text-xl">{cart.reduce((acc, i) => acc + i.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-surface-600 dark:text-surface-400">Shipping</span>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] glass px-4 py-1 rounded-full">Free</span>
                  </div>
                  <div className="pt-10 border-t border-surface-100 dark:border-white/10 flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-surface-950 dark:text-white">Total</span>
                    <span className="text-4xl font-black gradient-text tracking-tighter">{formatPrice(cartTotal)}</span>
                  </div>
                </div>

                <button onClick={handlePlaceOrder} disabled={loading || cart.length === 0}
                  className="btn-primary w-full !py-6 !rounded-[24px] flex items-center justify-center gap-5 shadow-2xl shadow-primary-500/30 group relative z-10 floating">
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="text-[11px] font-black uppercase tracking-[0.3em]">Place Order Now</span>
                      <ArrowRight className="w-6 h-6 group-hover:translate-x-3 transition-transform stroke-[3]" />
                    </>
                  )}
                </button>

                <div className="mt-10 pt-8 border-t border-surface-100 dark:border-white/10 text-center relative z-10">
                  <p className="text-[8px] font-black uppercase tracking-[0.5em] text-surface-600 dark:text-surface-400 flex items-center justify-center gap-2">
                    <Zap className="w-3 h-3 text-amber-500" /> Secure Payment Active
                  </p>
                </div>
              </div>
            </BorderGlow>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
