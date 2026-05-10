import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Star, Sparkles, ShoppingBag, ArrowRight, TrendingUp, CreditCard, PieChart as PieIcon, Globe, ShieldCheck, Cpu, Zap, Activity } from 'lucide-react';
import API from '../../api/axios';
import ProductCard from '../../components/products/ProductCard';
import AnalyticsChart from '../../components/common/AnalyticsChart';
import BorderGlow from '../../components/ui/BorderGlow';
import { useAuth } from '../../context/AuthContext';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/orders/').catch(() => ({ data: { orders: [] } })),
      API.get('/recommendations/').catch(() => ({ data: { recommendations: [] } })),
    ]).then(([oRes, rRes]) => {
      setOrders(oRes.data.orders || []);
      setRecommendations(rRes.data.recommendations || []);
    }).finally(() => setLoading(false));
  }, []);

  const formatPrice = (p) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(p);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950"><LoadingSpinner size="lg" text="Syncing Terminal Data..." /></div>;

  const stats = [
    { label: 'Total Orders', value: orders.length, icon: Package, color: 'from-primary-500 to-indigo-600' },
    { label: 'Total Spent', value: formatPrice(orders.reduce((sum, o) => sum + o.total_amount, 0)), icon: CreditCard, color: 'from-emerald-500 to-teal-600' },
    { label: 'Pending Orders', value: orders.filter(o => o.status === 'pending').length, icon: Activity, color: 'from-amber-500 to-orange-600' },
    { label: 'Recommendations', value: recommendations.length, icon: Sparkles, color: 'from-accent-500 to-fuchsia-600' },
  ];

  const spendingData = {
    labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Spending Analysis',
        data: [15000, 8000, 22000, 18000, 25000, 30000],
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderRadius: 20,
        hoverBackgroundColor: '#6366f1',
      },
    ],
  };

  const interestData = {
    labels: ['Hardware', 'Audio', 'Mobile', 'Other'],
    datasets: [
      {
        data: [40, 30, 20, 10],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(244, 63, 94, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(148, 163, 184, 0.2)',
        ],
        hoverOffset: 25,
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="section-padding py-24 sm:py-32 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <header className="mb-20 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12">
          <div>
            <div className="flex items-center gap-5 mb-6">
              <div className="w-12 h-12 rounded-[18px] glass bg-primary-500/10 flex items-center justify-center text-primary-500 border border-primary-500/20 shadow-xl">
                <Cpu className="w-6 h-6 stroke-[2.5] floating" />
              </div>
              <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.5em] block">Account Dashboard</span>
            </div>
            <h1 className="text-6xl sm:text-8xl font-black text-surface-950 dark:text-white mb-4 tracking-tighter leading-tight">
              Welcome, <span className="text-surface-400">{user?.name?.split(' ')[0]}.</span>
            </h1>
            <p className="text-surface-600 dark:text-surface-400 font-bold uppercase tracking-widest text-[11px]">Your order history and personalized recommendations.</p>
          </div>
          <div className="flex items-center gap-8 px-10 py-5 rounded-[32px] glass border border-surface-200 dark:border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
            <div className="flex items-center gap-4 relative z-10">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-surface-950 dark:text-white leading-none mb-1">Status: Verified</span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary-500">Secure Protocol v4.2</span>
              </div>
            </div>
            <div className="w-[1px] h-10 bg-surface-200 dark:bg-white/10 relative z-10" />
            <div className="flex flex-col items-end relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-surface-600 dark:text-surface-400">Latency: 14ms</span>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500 mt-1 flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Live Sync
              </span>
            </div>
          </div>
        </header>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-20">
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="h-full">
              <BorderGlow className="h-full w-full" borderRadius={50} glowRadius={10} animated={true}>
                <div className="p-12 relative overflow-hidden group h-full flex flex-col justify-center">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-[2s]" />
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-10 shadow-2xl floating`}>
                    <s.icon className="w-8 h-8 text-white stroke-[2.5]" />
                  </div>
                  <p className="text-5xl font-black text-surface-950 dark:text-white tracking-tighter mb-2 leading-none">{s.value}</p>
                  <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.3em]">{s.label}</p>
                </div>
              </BorderGlow>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-24">
          {/* Allocation Visualization */}
          <div className="lg:col-span-2">
            <BorderGlow className="h-full w-full" borderRadius={60} glowRadius={10} animated={true}>
              <div className="p-12 relative overflow-hidden h-full">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-[140px] -mr-48 -mt-48" />
                <div className="flex items-center justify-between mb-12 relative z-10">
                  <h3 className="text-2xl font-black text-surface-950 dark:text-white flex items-center gap-5 tracking-tighter">
                    <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-primary-500">
                      <TrendingUp className="w-6 h-6 floating" />
                    </div>
                    Spending History
                  </h3>
                  <div className="glass px-6 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest text-primary-500 border border-primary-500/20">6-Month Trend</div>
                </div>
                <div className="relative h-[400px]">
                  <AnalyticsChart type="bar" data={spendingData} height={400} />
                </div>
              </div>
            </BorderGlow>
          </div>

          {/* Core Interests */}
          <div>
            <BorderGlow className="h-full w-full" borderRadius={60} glowRadius={10} animated={true}>
              <div className="p-12 relative overflow-hidden h-full">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[120px] -mr-32 -mb-32" />
                <h3 className="text-2xl font-black text-surface-950 dark:text-white mb-12 flex items-center gap-5 tracking-tighter relative z-10">
                  <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-rose-500">
                    <PieIcon className="w-6 h-6 floating" />
                  </div>
                  Shopping Interests
                </h3>
                <div className="relative h-[400px] z-10">
                  <AnalyticsChart type="doughnut" data={interestData} height={400} />
                </div>
              </div>
            </BorderGlow>
          </div>
        </div>

        {/* Transmission Log (Orders) */}
        <div className="mb-32">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-4 h-4 text-primary-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-500">Order History</span>
              </div>
              <h2 className="text-5xl font-black text-surface-950 dark:text-white tracking-tighter leading-tight">Recent <span className="text-surface-400">Orders.</span></h2>
            </div>
            <Link to="/dashboard/orders" className="btn-primary !py-5 !px-10 !rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-4 shadow-2xl shadow-primary-500/20 group">
              View All Orders <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
          
          {orders.length === 0 ? (
            <div className="glass-strong p-32 rounded-[60px] text-center border border-surface-200 dark:border-white/10 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-primary-500/5 opacity-30" />
              <div className="w-24 h-24 rounded-[32px] glass bg-surface-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-10 relative z-10">
                <ShoppingBag className="w-10 h-10 text-surface-300 dark:text-white/20" />
              </div>
              <p className="text-surface-600 dark:text-surface-400 font-black uppercase tracking-[0.4em] text-xs relative z-10">No recent orders found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {orders.slice(0, 3).map((o, idx) => (
                <motion.div key={o.order_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
                  <Link to={`/dashboard/orders/${o.order_id}`} 
                    className="glass p-12 rounded-[50px] border border-surface-200 dark:border-white/10 flex flex-col lg:flex-row items-center justify-between hover:border-primary-500/40 transition-all duration-700 group relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[100px] -mr-32 -mt-32 opacity-0 group-hover:opacity-100 transition-all duration-1000" />
                    <div className="flex items-center gap-10 relative z-10 w-full lg:w-auto mb-8 lg:mb-0">
                      <div className="w-20 h-20 rounded-[30px] glass bg-surface-50 dark:bg-white/[0.05] border border-surface-100 dark:border-white/10 flex items-center justify-center group-hover:bg-primary-500/10 group-hover:border-primary-500/30 transition-all duration-700 shadow-xl">
                        <Package className="w-10 h-10 text-primary-500 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                           <p className="text-3xl font-black text-surface-950 dark:text-white group-hover:text-primary-500 transition-colors tracking-tighter">Order #{o.order_id}</p>
                           <span className="text-[9px] font-black uppercase tracking-[0.4em] text-primary-500 glass px-3 py-1 rounded-lg">LIVE</span>
                        </div>
                        <p className="text-[11px] font-black text-surface-600 dark:text-surface-400 uppercase tracking-[0.3em]">{new Date(o.placed_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full lg:w-auto gap-12 relative z-10 border-t lg:border-t-0 pt-8 lg:pt-0 border-surface-100 dark:border-white/10">
                      <div className="text-left lg:text-right">
                        <p className="text-4xl font-black text-surface-950 dark:text-white tracking-tighter mb-3 group-hover:scale-110 transition-transform origin-right duration-700">{formatPrice(o.total_amount)}</p>
                        <span className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border ${
                          o.status === 'delivered' ? 'glass bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
                          o.status === 'cancelled' ? 'glass bg-rose-500/10 border-rose-500/30 text-rose-500' :
                          'glass bg-amber-500/10 border-amber-500/30 text-amber-500'
                        }`}>{o.status}</span>
                      </div>
                      <div className="w-12 h-12 rounded-full glass flex items-center justify-center text-surface-400 group-hover:text-primary-500 group-hover:translate-x-2 transition-all duration-700 border border-transparent group-hover:border-primary-500/30">
                        <ArrowRight className="w-6 h-6 stroke-[3]" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Predictive Synthesis (Recommendations) */}
        {recommendations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-primary-500 border border-primary-500/20">
                    <Activity className="w-5 h-5 floating" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-500 block">Personalized Picks</span>
                </div>
                <h2 className="text-5xl font-black text-surface-950 dark:text-white tracking-tighter leading-tight">Recommended <span className="text-surface-400">Products.</span></h2>
              </div>
              <Link to="/products" className="text-[11px] font-black uppercase tracking-[0.3em] text-primary-500 hover:text-primary-600 flex items-center gap-4 group transition-all glass px-8 py-4 rounded-2xl border border-primary-500/20">
                Continue Shopping <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
              {recommendations.slice(0, 4).map((r, i) => r.product && (
                <ProductCard key={r.product.product_id} product={r.product} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
