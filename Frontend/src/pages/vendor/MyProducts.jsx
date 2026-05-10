import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit3, Trash2, ArrowLeft, Package, Boxes, Layers } from 'lucide-react';
import API from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function MyProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => { API.get('/products/my').then(r => setProducts(r.data.products || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(fetch, []);

  const formatPrice = (p) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(p);

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this product from the master catalog?')) return;
    try { await API.delete(`/products/${id}`); toast.success('Product status updated to inactive'); fetch(); } catch { toast.error('Failed to update product status'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" text="Accessing Inventory Database..." /></div>;

  return (
    <div className="section-padding py-16 sm:py-24">
      <Link to="/vendor" className="inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-surface-400 hover:text-primary-500 mb-12 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Studio
      </Link>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-16 gap-8">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-500 mb-4 block">Hardware Repository</span>
            <h1 className="text-5xl sm:text-6xl font-black text-surface-950 dark:text-white mb-2 tracking-tighter">My <span className="text-surface-400">Inventory.</span></h1>
            <p className="text-surface-500 font-medium text-lg">Managing {products.length} unique items across the marketplace.</p>
          </div>
          <Link to="/vendor/products/add" className="btn-primary flex items-center gap-4 !rounded-2xl !py-4 !px-8 shadow-2xl shadow-primary-500/20 group">
            <Plus className="w-5 h-5 stroke-[2.5]" /> 
            <span className="text-xs font-black uppercase tracking-widest">Deploy New Item</span>
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="glass p-20 rounded-[48px] border border-surface-200 dark:border-white/5 text-center shadow-xl">
            <div className="w-20 h-20 rounded-full bg-surface-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-8">
              <Boxes className="w-10 h-10 text-surface-300 dark:text-white/10" />
            </div>
            <p className="text-surface-500 font-black uppercase tracking-widest text-xs">Repository currently empty. Begin deployment.</p>
          </div>
        ) : (
          <div className="glass rounded-[48px] overflow-hidden border border-surface-200 dark:border-white/5 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-surface-50 dark:bg-white/[0.03]">
                  <th className="text-left text-[10px] font-black text-surface-400 uppercase py-8 px-10 tracking-[0.2em]">Product Identity</th>
                  <th className="text-left text-[10px] font-black text-surface-400 uppercase py-8 px-10 tracking-[0.2em] hidden sm:table-cell">Brand Specification</th>
                  <th className="text-left text-[10px] font-black text-surface-400 uppercase py-8 px-10 tracking-[0.2em]">Unit Value</th>
                  <th className="text-left text-[10px] font-black text-surface-400 uppercase py-8 px-10 tracking-[0.2em] hidden md:table-cell">Stock Level</th>
                  <th className="text-left text-[10px] font-black text-surface-400 uppercase py-8 px-10 tracking-[0.2em]">Availability</th>
                  <th className="text-right text-[10px] font-black text-surface-400 uppercase py-8 px-10 tracking-[0.2em]">Protocol</th>
                </tr></thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.product_id} className="border-b border-surface-100 dark:border-white/5 hover:bg-primary-500/[0.02] transition-all group">
                      <td className="py-8 px-10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-white/5 flex items-center justify-center text-surface-300 group-hover:text-primary-500 group-hover:bg-primary-500/10 transition-all">
                            <Package className="w-6 h-6" />
                          </div>
                          <span className="font-black text-surface-950 dark:text-white tracking-tight text-lg">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-8 px-10 text-sm font-black text-surface-500 uppercase tracking-widest hidden sm:table-cell">{p.brand}</td>
                      <td className="py-8 px-10 font-black text-surface-950 dark:text-white tracking-tighter text-xl">{formatPrice(p.price)}</td>
                      <td className="py-8 px-10 hidden md:table-cell">
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-black tracking-tighter ${p.stock_qty < 10 ? 'text-amber-500' : 'text-surface-950 dark:text-white'}`}>{p.stock_qty}</span>
                          <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Units</span>
                        </div>
                      </td>
                      <td className="py-8 px-10">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          p.is_active 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                          : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                        }`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-8 px-10 text-right">
                        <div className="flex justify-end gap-3">
                          <Link to={`/vendor/products/edit/${p.product_id}`} className="w-12 h-12 rounded-2xl flex items-center justify-center text-surface-400 bg-surface-50 dark:bg-white/5 border border-surface-100 dark:border-white/5 hover:text-primary-500 hover:border-primary-500/30 transition-all">
                            <Edit3 className="w-5 h-5" />
                          </Link>
                          <button onClick={() => handleDelete(p.product_id)} className="w-12 h-12 rounded-2xl flex items-center justify-center text-surface-400 bg-surface-50 dark:bg-white/5 border border-surface-100 dark:border-white/5 hover:text-red-500 hover:border-red-500/30 transition-all">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
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
