import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ShoppingBag, TrendingUp, Plus, ArrowRight, DollarSign, Activity, AlertTriangle, Globe, Store, Cpu, Zap, ShieldCheck } from 'lucide-react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AnalyticsChart from '../../components/common/AnalyticsChart';
import BorderGlow from '../../components/ui/BorderGlow';
import { useAuth } from '../../context/AuthContext';

export default function VendorDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ sales_history: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/vendor/stats')
      .then(res => {
        setProducts(res.data.products || []);
        setOrders(res.data.recent_orders || []);
        setStats(res.data || { sales_history: [] });
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (p) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(p);

  const totalRevenue = stats.total_revenue || 0;

  // Dynamic 7-day window generation
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const salesData = {
    labels: last7Days.map(date => {
      const [y, m, d] = date.split('-');
      return `${m}/${d}`;
    }),
    datasets: [
      {
        label: 'Daily Revenue',
        data: last7Days.map(date => {
          const entry = stats.sales_history?.find(h => h.day === date);
          return entry ? entry.revenue : 0;
        }),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#7c3aed',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#7c3aed',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
      },
    ],
  };



  const stockAlerts = stats.low_stock_products || [];

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8">
      <LoadingSpinner size="lg" text="Calculating Stats & Syncing Ledger..." />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-500/50"
      >
        Accessing Global Repository
      </motion.p>
    </div>
  );

  return (
    <div className="section-padding py-24 sm:py-32 relative">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <header className="mb-20 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12">
          <div>
            <div className="flex items-center gap-5 mb-6">
              <div className="w-12 h-12 rounded-[18px] glass bg-primary-500/10 flex items-center justify-center text-primary-500 border border-primary-500/20 shadow-xl">
                <Store className="w-6 h-6 stroke-[2.5] floating" />
              </div>
              <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.5em] block">Seller Dashboard</span>
            </div>
            <h1 className="text-6xl sm:text-8xl font-black text-surface-950 dark:text-white mb-4 tracking-tighter leading-tight">My <span className="text-surface-400">Shop.</span></h1>
            <div className="flex items-center gap-4 px-6 py-2 rounded-2xl glass border border-surface-200 dark:border-white/10 w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-surface-600 dark:text-surface-300 tracking-tight">{user?.store_name || user?.name}</span>
            </div>
          </div>
          <Link to="/vendor/products/add" className="btn-primary flex items-center gap-5 !rounded-[24px] !py-5 !px-10 shadow-2xl shadow-primary-500/30 group floating">
            <Plus className="w-6 h-6 stroke-[3]" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em]">Add Product</span>
          </Link>
        </header>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-20">
          {[
            { label: 'Total Products', value: stats.product_count || 0, icon: Package, color: 'from-blue-500 to-sky-600', link: '/vendor/products', desc: 'Manage Inventory' },
            { label: 'Orders Received', value: orders.length, icon: ShoppingBag, color: 'from-emerald-500 to-teal-600', link: '/vendor/orders', desc: 'Process Sales' },
            { label: 'Total Revenue', value: formatPrice(totalRevenue), icon: DollarSign, color: 'from-primary-500 to-indigo-600' },
            { label: 'Inventory Status', value: stockAlerts.length > 0 ? `${stockAlerts.length} Low Stock` : 'Healthy', icon: Activity, color: 'from-amber-500 to-orange-600' },
          ].map((s, i) => {
            const CardContent = (
              <BorderGlow className="h-full w-full" borderRadius={50} glowRadius={10} animated={true}>
                <div className="p-12 relative overflow-visible group h-full flex flex-col justify-center">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-[2s] pointer-events-none" />
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-10 shadow-2xl floating`}>
                    <s.icon className="w-8 h-8 text-white stroke-[2.5]" />
                  </div>
                  <p className="text-4xl font-black text-surface-950 dark:text-white tracking-tighter mb-2 leading-none">{s.value}</p>
                  <p className="text-[10px] font-black text-surface-600 dark:text-surface-400 uppercase tracking-[0.3em]">{s.label}</p>

                  {s.link && (
                    <>
                      <p className="text-[9px] font-black text-primary-500 uppercase tracking-[0.2em] mt-6 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">{s.desc}</p>
                      <div className="absolute top-10 right-10 w-12 h-12 rounded-2xl glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                        <ArrowRight className="w-6 h-6 text-primary-500" />
                      </div>
                    </>
                  )}
                </div>
              </BorderGlow>
            );

            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="h-full">
                {s.link ? (
                  <Link to={s.link} className="block h-full transition-transform hover:scale-[1.02]">
                    {CardContent}
                  </Link>
                ) : CardContent}
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mb-24">
          {/* Sales Performance Visualization */}
          <div className="lg:col-span-2">
            <BorderGlow className="h-full w-full" borderRadius={60} glowRadius={10} animated={true}>
              <div className="p-8 sm:p-12 relative overflow-hidden h-full flex flex-col">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-[140px] -mr-48 -mt-48" />
                <div className="flex items-center justify-between mb-10 relative z-10 px-4">
                  <h3 className="text-2xl font-black text-surface-950 dark:text-white flex items-center gap-5 tracking-tighter">
                    <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-primary-500">
                      <TrendingUp className="w-6 h-6 floating" />
                    </div>
                    Sales Performance
                  </h3>
                  <div className="glass px-6 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest text-primary-500 border border-primary-500/20">7-Day Analysis</div>
                </div>
                <div className="relative flex-1 min-h-[500px] w-full">
                  <AnalyticsChart data={salesData} height="100%" />
                </div>
              </div>
            </BorderGlow>

          </div>

          {/* Critical Stock Matrix */}
          <div>
            <BorderGlow className="h-full w-full" borderRadius={60} glowRadius={10} animated={true}>
              <div className="p-12 relative overflow-hidden h-full">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[120px] -mr-32 -mb-32" />
                <h3 className="text-2xl font-black text-surface-950 dark:text-white mb-12 flex items-center gap-5 tracking-tighter relative z-10">
                  <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-amber-500">
                    <AlertTriangle className="w-6 h-6 floating" />
                  </div>
                  Inventory Alerts
                </h3>
                <div className="space-y-8 relative z-10">
                  {stockAlerts.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="w-20 h-20 rounded-[32px] glass bg-emerald-500/10 flex items-center justify-center mx-auto mb-8 shadow-xl">
                        <ShieldCheck className="w-10 h-10 text-emerald-500" />
                      </div>
                      <p className="text-[10px] font-black text-surface-600 dark:text-surface-400 uppercase tracking-[0.4em]">Logistics Optimized</p>
                    </div>
                  ) : (
                    stockAlerts.slice(0, 4).map(p => (
                      <div key={p.product_id} className="p-8 rounded-[32px] glass bg-surface-50 dark:bg-white/[0.03] border border-surface-100 dark:border-white/10 group hover:border-amber-500/40 transition-all duration-500">
                        <p className="font-black text-surface-950 dark:text-white text-base tracking-tighter line-clamp-1 mb-3">{p.name}</p>
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Zap className="w-3 h-3 animate-pulse" /> Low Stock
                          </p>
                          <span className="text-[10px] font-black text-surface-400 glass px-3 py-1 rounded-lg">{p.stock_qty} Units</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </BorderGlow>
          </div>
        </div>

        {/* Global Inventory Buffer */}
        <div className="mt-32">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-4 h-4 text-primary-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-500">Inventory Management</span>
              </div>
              <h2 className="text-5xl font-black text-surface-950 dark:text-white tracking-tighter leading-tight">My <span className="text-surface-400">Products.</span></h2>
            </div>
            <Link to="/vendor/products" className="btn-secondary glass !py-5 !px-10 !rounded-3xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-4 border border-surface-200 dark:border-white/10 group">
              Manage All Products <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 mb-40">
            {products.map((p, idx) => (
              <motion.div key={p.product_id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.05 }} className="h-full">
                <BorderGlow className="h-full w-full" borderRadius={50} glowRadius={10} animated={true}>
                  <div className="p-10 relative overflow-visible h-full flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary-500/5 rounded-full blur-[100px] -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-[2s] pointer-events-none" />
                    <div className="flex justify-between items-start mb-10 relative z-10">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-2xl text-surface-950 dark:text-white line-clamp-1 group-hover:text-primary-500 transition-colors tracking-tighter leading-none mb-3">{p.name}</h3>
                        <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.3em]">{p.brand || 'Studio Spec'}</p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border ${p.is_active ? 'glass bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'glass bg-rose-500/10 border-rose-500/30 text-rose-500'
                        }`}>{p.is_active ? 'Public' : 'Hidden'}</span>
                    </div>
                    <div className="flex justify-between items-end relative z-10 pt-10 border-t border-surface-100 dark:border-white/5">
                      <p className="text-3xl font-black text-surface-950 dark:text-white tracking-tighter leading-none">{formatPrice(parseFloat(p.price))}</p>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-surface-600 dark:text-surface-400 uppercase tracking-[0.2em] mb-2">Units in Stock</p>
                        <p className="text-2xl font-black text-surface-950 dark:text-white tracking-tighter leading-none">{p.stock_qty}</p>
                      </div>
                    </div>
                  </div>
                </BorderGlow>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
