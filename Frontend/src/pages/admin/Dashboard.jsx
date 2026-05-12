import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Store, Package, ShoppingBag, DollarSign, Star, TrendingUp, CheckCircle, XCircle, ChevronDown, Activity, PieChart as PieIcon, ArrowRight, ShieldCheck, Globe } from 'lucide-react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AnalyticsChart from '../../components/common/AnalyticsChart';
import BorderGlow from '../../components/ui/BorderGlow';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    Promise.all([
      API.get('/admin/stats'),
      API.get('/admin/users?type=customer'),
      API.get('/admin/vendors'), // Changed from /pending
      API.get('/admin/products'),
      API.get('/admin/categories'),
    ])
      .then(([sRes, cRes, vRes, pRes, catRes]) => {
        setStats(sRes.data || {});
        setCustomers(cRes.data.customers || []);
        setVendors(vRes.data.vendors || []);
        setProducts(pRes.data.products || []);
        setCategories(catRes.data.categories || []);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Failed to load dashboard');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const formatPrice = (p) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(p);

  const toggleCustomer = async (customer) => {
    const isDeactivating = customer.is_active;
    const endpoint = isDeactivating ? '/admin/deactivate' : '/admin/reactivate';
    
    try {
      const res = await API.post(endpoint, {
        user_id: customer.customer_id,
        user_type: 'customer',
        reason: isDeactivating ? 'Administrative restriction' : 'Restored access',
      });

      setCustomers(cs =>
        cs.map(c =>
          c.customer_id === customer.customer_id
            ? { ...c, is_active: !isDeactivating }
            : c
        )
      );

      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Status toggle failed');
    }
  };

  const toggleVendor = async (vendor) => {
    const isRevoking = vendor.is_approved;
    const endpoint = `/admin/vendors/${vendor.vendor_id}/${isRevoking ? 'disapprove' : 'approve'}`;
    
    try {
      const res = await API.post(endpoint);

      setVendors(vs =>
        vs.map(v =>
          v.vendor_id === vendor.vendor_id
            ? { ...v, is_approved: !isRevoking }
            : v
        )
      );

      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Vendor status change failed');
    }
  };

  const triggerWorkflow = async (type) => {
    const toastId = toast.loading(`Triggering ${type} workflow...`);
    try {
      await API.post(`/admin/trigger/${type}`);
      toast.success(`${type} workflow executed successfully`, { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to trigger ${type} workflow`, { id: toastId });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="Syncing Master Control..." /></div>;

  const summary = stats || {};
  const statCards = [
    { label: 'Platform Revenue', value: formatPrice(summary.total_revenue || 0), icon: DollarSign, color: 'from-primary-500 to-indigo-600' },
    { label: 'Active Customers', value: summary.total_customers || 0, icon: Users, color: 'from-blue-500 to-sky-600' },
    { label: 'Verified Vendors', value: summary.total_vendors || 0, icon: Store, color: 'from-emerald-500 to-teal-600' },
    { label: 'Catalog Size', value: summary.total_products || 0, icon: Package, color: 'from-violet-500 to-fuchsia-600' },
    { label: 'Executed Orders', value: summary.total_orders || 0, icon: ShoppingBag, color: 'from-amber-500 to-orange-600' },
  ];

  const revenueData = {
    labels: stats?.monthly_summary?.length > 0 
      ? stats.monthly_summary.map(m => m.month).reverse() 
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Revenue Growth',
        data: stats?.monthly_summary?.length > 0 
          ? stats.monthly_summary.map(m => m.revenue).reverse() 
          : [30000, 45000, 42000, 60000, 55000, 80000, 95000],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  };

  const categoryData = {
    labels: stats?.category_distribution?.length > 0 
      ? stats.category_distribution.map(c => c.name) 
      : ['Audio', 'Mobiles', 'Laptops', 'Accessories'],
    datasets: [
      {
        data: stats?.category_distribution?.length > 0 
          ? stats.category_distribution.map(c => c.count) 
          : [35, 45, 20, 15],
        backgroundColor: [
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
        ],
        hoverOffset: 20,
        borderWidth: 0,
      },
    ],
  };

  const addCategory = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const description = formData.get('description');

    try {
      const res = await API.post('/admin/categories', { name, description });
      setCategories(prev => [...prev, res.data.category]);
      toast.success('Category created');
      e.target.reset();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create category');
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await API.delete(`/admin/categories/${id}`);
      setCategories(prev => prev.filter(c => c.category_id !== id));
      toast.success('Category removed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Deletion restricted (products assigned)');
    }
  };

  const tabs = [
    { key: 'overview', label: 'Platform Overview', icon: Globe },
    { key: 'customers', label: 'Customer Management', icon: Users },
    { key: 'vendors', label: 'Vendor Approval', icon: Store },
    { key: 'products', label: 'Catalog Control', icon: Package },
    { key: 'categories', label: 'Taxonomy', icon: ShieldCheck },
  ];

  return (
    <div className="section-padding py-16 sm:py-24">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <header className="mb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-500 mb-4 block">OmniCart Central</span>
            <h1 className="text-5xl sm:text-6xl font-black text-surface-950 dark:text-white mb-2 tracking-tighter">Command <span className="text-surface-400">Center.</span></h1>
            <p className="text-surface-500 font-medium text-lg">Real-time platform oversight and collective management.</p>
          </div>
          <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-surface-100 dark:bg-white/5 border border-surface-200 dark:border-white/10 shadow-sm">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-xs font-black uppercase tracking-widest text-surface-600 dark:text-surface-300">Operational Integrity: 100%</span>
          </div>
        </header>

        {/* Automation Command Cluster */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Weekly Digest', icon: ShieldCheck, type: 'weekly-digest', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
            { label: 'Low Stock Alert', icon: Activity, type: 'low-stock', color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: 'Abandoned Carts', icon: ShoppingBag, type: 'abandoned-carts', color: 'text-rose-500', bg: 'bg-rose-500/10' },
          ].map(btn => (
            <button
              key={btn.type}
              onClick={() => triggerWorkflow(btn.type)}
              className="group flex items-center justify-between p-6 rounded-[32px] bg-surface-50 dark:bg-white/[0.03] border border-surface-200 dark:border-white/5 hover:border-primary-500 transition-all duration-500"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${btn.bg} flex items-center justify-center ${btn.color} group-hover:scale-110 transition-transform duration-500`}>
                  <btn.icon className="w-6 h-6 stroke-[2]" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 mb-1">Automation</p>
                  <p className="font-black text-surface-950 dark:text-white tracking-tight">{btn.label}</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-surface-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>

        {/* Studio Tabs */}
        <div className="flex gap-4 mb-12 overflow-x-auto pb-4 scrollbar-hide">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-3 px-8 py-4 rounded-[20px] text-xs font-black uppercase tracking-[0.1em] whitespace-nowrap transition-all duration-500 border ${tab === t.key
                ? 'bg-primary-500 border-primary-500 text-white shadow-2xl shadow-primary-500/20'
                : 'bg-surface-50 dark:bg-white/[0.03] border-surface-100 dark:border-white/5 text-surface-400 hover:text-surface-950 dark:hover:text-white hover:border-surface-200 dark:hover:border-white/10'
                }`}>
              <t.icon className={`w-4 h-4 ${tab === t.key ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {statCards.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="h-full">
                  <BorderGlow className="h-full" borderRadius={40} glowRadius={15} animated={true}>
                    <div className="p-10 relative overflow-hidden group h-full">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary-500/10 transition-colors" />
                      <div className="flex items-center justify-between mb-8">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-2xl`}>
                          <s.icon className="w-7 h-7 text-white stroke-[2.5]" />
                        </div>
                        <div className="text-emerald-500 flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-[10px] font-black tracking-widest">+12%</span>
                        </div>
                      </div>
                      <p className="text-4xl font-black text-surface-950 dark:text-white tracking-tighter mb-2">{s.value}</p>
                      <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em]">{s.label}</p>
                    </div>
                  </BorderGlow>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Revenue Chart */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass p-10 rounded-[48px] border border-surface-200 dark:border-white/5 shadow-xl">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="font-black text-xl text-surface-950 dark:text-white flex items-center gap-4 tracking-tight">
                    <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    Volume Trajectory
                  </h3>
                  <button className="text-[10px] font-black uppercase tracking-widest text-surface-400 hover:text-primary-500 transition-colors">Download CSV</button>
                </div>
                <AnalyticsChart type="line" data={revenueData} height={350} />
              </motion.div>

              {/* Category Chart */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass p-10 rounded-[48px] border border-surface-200 dark:border-white/5 shadow-xl">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="font-black text-xl text-surface-950 dark:text-white flex items-center gap-4 tracking-tight">
                    <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-500">
                      <PieIcon className="w-5 h-5" />
                    </div>
                    Sector Allocation
                  </h3>
                  <button className="text-[10px] font-black uppercase tracking-widest text-surface-400 hover:text-primary-500 transition-colors">View Details</button>
                </div>
                <AnalyticsChart type="doughnut" data={categoryData} height={350} />
              </motion.div>
            </div>

            {/* Performance Leaders */}
            {stats?.top_products?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-12 rounded-[48px] border border-surface-200 dark:border-white/5 shadow-xl">
                <h3 className="font-black text-2xl text-surface-950 dark:text-white mb-10 flex items-center gap-4 tracking-tighter">
                  <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                    <Package className="w-6 h-6" />
                  </div>
                  Inventory Performers
                </h3>
                <div className="space-y-10">
                  {stats.top_products.map((p, i) => (
                    <div key={i} className="flex items-center gap-8 group">
                      <span className="text-xl font-black text-surface-200 dark:text-white/5 w-10">0{i + 1}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-3 items-end">
                          <span className="text-lg font-black text-surface-950 dark:text-white tracking-tight group-hover:text-primary-500 transition-colors">{p.name}</span>
                          <span className="text-xs font-black text-surface-400 uppercase tracking-widest">{p.units_sold} units deployed</span>
                        </div>
                        <div className="h-4 rounded-full bg-surface-100 dark:bg-white/5 overflow-hidden border border-surface-200 dark:border-white/10 p-1">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${(p.units_sold / stats.top_products[0].units_sold) * 100}%` }}
                            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Customers/Vendors Tab - Table Standardization */}
        {(tab === 'customers' || tab === 'vendors') && (
          <div className="glass rounded-[48px] overflow-hidden border border-surface-200 dark:border-white/5 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-surface-50 dark:bg-white/[0.03]">
                  <th className="text-left text-[10px] font-black text-surface-400 uppercase py-8 px-10 tracking-[0.2em]">Collective ID</th>
                  <th className="text-left text-[10px] font-black text-surface-400 uppercase py-8 px-10 tracking-[0.2em] hidden sm:table-cell">Identity Access</th>
                  <th className="text-left text-[10px] font-black text-surface-400 uppercase py-8 px-10 tracking-[0.2em]">Deployment Status</th>
                  <th className="text-right text-[10px] font-black text-surface-400 uppercase py-8 px-10 tracking-[0.2em]">Actions</th>
                </tr></thead>
                <tbody>
                  {(tab === 'customers' ? customers : vendors).map(item => (
                    <tr key={tab === 'customers' ? item.customer_id : item.vendor_id} className="border-b border-surface-100 dark:border-white/5 hover:bg-primary-500/[0.02] transition-all group">
                      <td className="py-8 px-10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-white/5 flex items-center justify-center font-black text-surface-300 dark:text-white/10 group-hover:bg-primary-500 group-hover:text-white transition-all">
                            {(tab === 'customers' ? item.name : item.store_name)?.[0]}
                          </div>
                          <span className="font-black text-surface-950 dark:text-white tracking-tight">{tab === 'customers' ? item.name : item.store_name}</span>
                        </div>
                      </td>
                      <td className="py-8 px-10 text-sm font-medium text-surface-500 hidden sm:table-cell group-hover:text-surface-950 dark:group-hover:text-white transition-colors">{item.email}</td>
                      <td className="py-8 px-10">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${(tab === 'customers' ? item.is_active : item.is_approved)
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                          }`}>
                          {(tab === 'customers' ? item.is_active : item.is_approved) ? 'Verified' : 'Restricted'}
                        </span>
                      </td>
                      <td className="py-8 px-10 text-right">
                        <button
                          onClick={() => tab === 'customers' ? toggleCustomer(item) : toggleVendor(item)}
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border ${(tab === 'customers' ? item.is_active : item.is_approved)
                            ? 'text-red-500 bg-red-500/10 border-red-500/20 hover:bg-red-500 hover:text-white'
                            : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                            }`}
                        >
                          {(tab === 'customers' ? item.is_active : item.is_approved) ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Catalog Control Tab */}
        {tab === 'products' && (
          <div className="glass rounded-[48px] overflow-hidden border border-surface-200 dark:border-white/5 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-surface-50 dark:bg-white/[0.03]">
                  <th className="text-left text-[10px] font-black text-surface-400 uppercase py-8 px-10 tracking-[0.2em]">Product Identity</th>
                  <th className="text-left text-[10px] font-black text-surface-400 uppercase py-8 px-10 tracking-[0.2em]">Vendor Origin</th>
                  <th className="text-left text-[10px] font-black text-surface-400 uppercase py-8 px-10 tracking-[0.2em]">Stock Integrity</th>
                  <th className="text-right text-[10px] font-black text-surface-400 uppercase py-8 px-10 tracking-[0.2em]">Valuation</th>
                </tr></thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.product_id} className="border-b border-surface-100 dark:border-white/5 hover:bg-primary-500/[0.02] transition-all">
                      <td className="py-8 px-10 font-black text-surface-950 dark:text-white tracking-tight">{p.name}</td>
                      <td className="py-8 px-10 text-sm font-medium text-surface-500">{p.vendor_store || 'Independent'}</td>
                      <td className="py-8 px-10">
                        <span className={`text-xs font-black ${p.stock_qty < 10 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {p.stock_qty} Units
                        </span>
                      </td>
                      <td className="py-8 px-10 text-right font-black text-surface-950 dark:text-white">{formatPrice(p.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Category Control Tab */}
        {tab === 'categories' && (
          <div className="space-y-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-10 rounded-[48px] border border-surface-200 dark:border-white/5">
              <h3 className="text-2xl font-black text-surface-950 dark:text-white mb-8 tracking-tighter">Expand Platform <span className="text-primary-500">Taxonomy.</span></h3>
              <form onSubmit={addCategory} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <input name="name" placeholder="Category Name" required className="px-6 py-4 rounded-2xl bg-surface-100 dark:bg-white/5 border-none text-sm font-medium focus:ring-2 ring-primary-500 transition-all outline-none" />
                <input name="description" placeholder="Short description..." className="px-6 py-4 rounded-2xl bg-surface-100 dark:bg-white/5 border-none text-sm font-medium focus:ring-2 ring-primary-500 transition-all outline-none" />
                <button type="submit" className="bg-primary-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-500/20">Authorize New Sector</button>
              </form>
            </motion.div>

            <div className="glass rounded-[48px] overflow-hidden border border-surface-200 dark:border-white/5 shadow-2xl">
              <table className="w-full">
                <thead><tr className="bg-surface-50 dark:bg-white/[0.03]">
                  <th className="text-left text-[10px] font-black text-surface-400 uppercase py-8 px-10 tracking-[0.2em]">Sector Name</th>
                  <th className="text-left text-[10px] font-black text-surface-400 uppercase py-8 px-10 tracking-[0.2em]">Description</th>
                  <th className="text-right text-[10px] font-black text-surface-400 uppercase py-8 px-10 tracking-[0.2em]">Actions</th>
                </tr></thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.category_id} className="border-b border-surface-100 dark:border-white/5 hover:bg-primary-500/[0.02] transition-all">
                      <td className="py-8 px-10 font-black text-surface-950 dark:text-white tracking-tight">{c.name}</td>
                      <td className="py-8 px-10 text-sm font-medium text-surface-500">{c.description || 'No description provided'}</td>
                      <td className="py-8 px-10 text-right">
                        <button onClick={() => deleteCategory(c.category_id)} className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all ml-auto">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}