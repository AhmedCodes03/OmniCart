import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, Search, X, ChevronDown, Filter, Box, Zap, Sparkles } from 'lucide-react';
import API from '../api/axios';
import BorderGlow from '../components/ui/BorderGlow';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [sort, setSort] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const fetchProducts = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', p);
      params.set('per_page', '12');
      
      // Map sort values to backend sort_by and order
      if (sort === 'newest') {
        params.set('sort_by', 'created_at');
        params.set('order', 'desc');
      } else if (sort === 'price_asc') {
        params.set('sort_by', 'price');
        params.set('order', 'asc');
      } else if (sort === 'price_desc') {
        params.set('sort_by', 'price');
        params.set('order', 'desc');
      }

      if (search) params.set('q', search);
      if (minPrice) params.set('min_price', minPrice);
      if (maxPrice) params.set('max_price', maxPrice);
      
      const res = await API.get(`/products?${params.toString()}`);
      setProducts(res.data.products || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.pages || 1);
      setPage(res.data.page || 1);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProducts(1); }, [sort, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(search ? { search } : {});
    fetchProducts(1);
  };

  const clearFilters = () => {
    setSearch(''); setSort('newest'); setMinPrice(''); setMaxPrice('');
    setSearchParams({});
    fetchProducts(1);
  };

  return (
    <div className="section-padding py-24 sm:py-32 relative">
      {/* Header Section */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-20 text-center lg:text-left">
        <div className="flex items-center justify-center lg:justify-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-500 glass border-primary-500/20">
            <Box className="w-6 h-6 floating" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-500">Global Marketplace</span>
        </div>
        <h1 className="text-6xl sm:text-8xl font-black text-surface-950 dark:text-white mb-6 tracking-tighter leading-tight">
          Explore <span className="text-surface-400">Products.</span>
        </h1>
        <p className="text-surface-600 dark:text-surface-400 font-bold uppercase tracking-[0.2em] text-[10px] flex items-center justify-center lg:justify-start gap-3">
          <Zap className="w-3 h-3 text-amber-500" /> {total} Verified Units Available
        </p>
      </motion.div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-8 mb-16">
        <form onSubmit={handleSearch} className="flex-1 relative group">
          <div className="absolute inset-0 bg-primary-500/5 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-surface-400 group-focus-within:text-primary-500 transition-colors z-10" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for products, brands, or tech..." 
            className="input-field glass !pl-16 !pr-40 !py-6 !rounded-3xl !text-lg !font-bold relative z-0 placeholder:text-surface-400" />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 px-8 py-3 rounded-2xl bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-500 hover:scale-105 transition-all shadow-2xl z-10">
            Search
          </button>
        </form>
        
        <div className="flex gap-4">
          <div className="relative group">
            <select value={sort} onChange={(e) => setSort(e.target.value)} 
              className="input-field glass appearance-none !pr-14 !pl-8 !py-6 !rounded-3xl !w-auto min-w-[240px] cursor-pointer font-black text-[10px] uppercase tracking-widest text-surface-950 dark:text-white">
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
          </div>
          <button onClick={() => setFiltersOpen(!filtersOpen)} 
            className={`btn-secondary glass !py-6 !px-8 !rounded-3xl flex items-center gap-4 font-black text-[10px] uppercase tracking-widest transition-all ${filtersOpen ? 'border-primary-500/50 bg-primary-500/10 text-primary-500' : 'text-surface-600 dark:text-surface-400'}`}>
            <Filter className="w-5 h-5" /> Filters
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <AnimatePresence>
        {filtersOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} 
            className="overflow-hidden mb-16">
            <BorderGlow className="w-full" borderRadius={40} glowRadius={10} animated={true}>
              <div className="p-10 relative overflow-hidden w-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-end relative z-10 w-full">
                  <div className="space-y-4 w-full">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500 dark:text-surface-400">Min Price (PKR)</label>
                    <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" className="input-field !py-4 !text-sm !rounded-2xl placeholder:text-surface-300 w-full" />
                  </div>
                  <div className="space-y-4 w-full">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-surface-500 dark:text-surface-400">Max Price (PKR)</label>
                    <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="999,999" className="input-field !py-4 !text-sm !rounded-2xl placeholder:text-surface-300 w-full" />
                  </div>
                  <div className="flex gap-4 w-full">
                    <button onClick={() => fetchProducts(1)} className="btn-primary w-full !py-4 !rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl">
                      <Sparkles className="w-4 h-4" /> Apply Filters
                    </button>
                    <button onClick={clearFilters} className="p-4 rounded-2xl bg-surface-100 dark:bg-white/5 text-surface-400 hover:text-red-500 transition-all hover:bg-red-500/10 shrink-0">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            </BorderGlow>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Display */}
      {loading ? (
        <div className="py-40 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" text="Syncing Warehouse Ledger..." />
        </div>
      ) : products.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
          className="text-center py-40 glass rounded-[60px] border-dashed border-2 border-surface-200 dark:border-white/5">
          <Box className="w-24 h-24 text-surface-200 dark:text-white/5 mx-auto mb-10 floating" />
          <h3 className="text-4xl font-black text-surface-950 dark:text-white mb-4 tracking-tighter">No products found.</h3>
          <p className="text-surface-500 dark:text-surface-400 font-bold text-lg">We couldn't find any hardware matching your search.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {products.map((p, i) => (
            <ProductCard key={p.product_id} product={p} index={i} />
          ))}
        </div>
      )}

      {/* Navigation */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-6 mt-32">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => fetchProducts(p)}
              className={`w-16 h-16 rounded-[24px] text-sm font-black transition-all border ${
                p === page 
                ? 'bg-primary-600 text-white border-primary-500 shadow-2xl shadow-primary-500/40 scale-110' 
                : 'glass text-surface-600 dark:text-surface-400 hover:text-primary-500 hover:border-primary-500/30'
              }`}>
              {p.toString().padStart(2, '0')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
