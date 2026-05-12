import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, TrendingUp, Shield, Cpu, ShoppingBag, Star, Zap, Headphones, Smartphone, Laptop, Cable, Globe, Zap as FastZap, ShieldCheck, CreditCard, Activity } from 'lucide-react';
import API from '../api/axios';
import ProductCard from '../components/products/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import BorderGlow from '../components/ui/BorderGlow';

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      <div className="section-padding relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-center gap-24">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass border border-primary-500/20 mb-10"
            >
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-500">Premium E-Commerce Experience</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-7xl sm:text-8xl lg:text-[9rem] font-black leading-[0.85] mb-10 tracking-tighter text-surface-900 dark:text-white"
            >
              The Next <br />
              <span className="text-surface-400">Generation.</span> <br />
              <span className="gradient-text">Shop.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl sm:text-2xl text-surface-500 dark:text-surface-300 max-w-xl mb-14 leading-relaxed font-bold tracking-tight mx-auto lg:mx-0"
            >
              Experience a seamless blend of high-end hardware and intuitive design.
              Curated, authenticated, and delivered with precision.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-8"
            >
              <Link to="/products" className="btn-primary !px-14 !py-7 !rounded-3xl text-lg shadow-2xl shadow-primary-500/30 floating">
                Shop Collection
              </Link>
              <Link to="/register" className="group flex items-center gap-4 text-surface-900 dark:text-white font-black uppercase tracking-[0.4em] text-[10px] hover:text-primary-500 transition-all">
                Become a Seller <ArrowRight className="w-5 h-5 group-hover:translate-x-3 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* iPhone Glass Showcase */}
          <div className="flex-1 relative hidden lg:block">
            <motion.div
              initial={{ opacity: 0, rotateY: 30 }}
              animate={{ opacity: 1, rotateY: 0 }}
              transition={{ duration: 1.5 }}
              className="perspective-1000"
            >
              <div className="glass-strong p-1 rounded-[60px] border border-surface-200 dark:border-white/10 shadow-[0_100px_200px_-50px_rgba(0,0,0,0.3)] dark:shadow-[0_100px_200px_-50px_rgba(0,0,0,0.8)] overflow-hidden floating">
                <div className="bg-surface-50 dark:bg-[#08080c] rounded-[59px] overflow-hidden">
                  {/* Studio OS Interface */}
                  <div className="flex items-center justify-between px-10 py-8 border-b border-surface-200 dark:border-white/5">
                    <div className="flex gap-3">
                      <div className="w-4 h-4 rounded-full bg-rose-500 shadow-lg shadow-rose-500/20" />
                      <div className="w-4 h-4 rounded-full bg-amber-500 shadow-lg shadow-amber-500/20" />
                      <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20" />
                    </div>
                    <div className="px-8 py-2 rounded-2xl glass border border-surface-200 dark:border-white/10 text-[10px] font-black text-surface-600 dark:text-surface-400 tracking-[0.4em] uppercase">
                      OMNICART.PREMIER
                    </div>
                    <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-primary-500 floating" />
                    </div>
                  </div>

                  <div className="p-12 space-y-12">
                    <div className="flex items-center justify-between">
                      <div className="space-y-4">
                        <div className="h-5 w-48 bg-primary-500/10 rounded-full" />
                        <div className="h-10 w-80 bg-gradient-to-r from-surface-200 dark:from-white/10 to-transparent rounded-2xl" />
                      </div>
                      <div className="w-24 h-24 rounded-[32px] bg-primary-500/20 border border-primary-500/30 flex items-center justify-center shadow-2xl">
                        <FastZap className="w-10 h-10 text-primary-500 floating" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                      {[Smartphone, Headphones].map((Icon, idx) => (
                        <div key={idx} className="p-10 rounded-[40px] glass border border-surface-200 dark:border-white/5 space-y-6">
                          <div className="w-16 h-16 rounded-[24px] bg-primary-500/10 flex items-center justify-center">
                            <Icon className="w-8 h-8 text-primary-500" />
                          </div>
                          <div className="h-4 w-full bg-surface-200 dark:bg-white/5 rounded-full" />
                          <div className="h-4 w-2/3 bg-surface-200 dark:bg-white/5 rounded-full" />
                        </div>
                      ))}
                    </div>

                    <div className="h-24 w-full rounded-[32px] bg-gradient-to-r from-primary-600 to-indigo-600 shadow-2xl flex items-center justify-center relative overflow-hidden group">
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity shimmer" />
                      <span className="text-white text-xs font-black uppercase tracking-[0.5em] relative z-10">Add to Cart</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Categories ─── */
function CategoryShowcase() {
  const [categories, setCategories] = useState([
    { category_id: 2, name: 'Audio', icon: Headphones, color: 'text-violet-500', bg: 'bg-violet-500/10', desc: 'Acoustic Core' },
    { category_id: 3, name: 'Mobiles', icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-500/10', desc: 'Spatial Neural' },
    { category_id: 4, name: 'Laptops', icon: Laptop, color: 'text-emerald-500', bg: 'bg-emerald-500/10', desc: 'Compute Matrix' },
    { category_id: 5, name: 'Accessories', icon: Cable, color: 'text-amber-500', bg: 'bg-amber-500/10', desc: 'Modular Links' },
  ]);

  useEffect(() => {
    API.get('/categories')
      .then(res => {
        if (res.data.categories?.length > 0) {
          const iconMap = {
            'Audio': { icon: Headphones, color: 'text-violet-500', bg: 'bg-violet-500/10', desc: 'Acoustic Core' },
            'Mobiles': { icon: Smartphone, color: 'text-blue-500', bg: 'bg-blue-500/10', desc: 'Spatial Neural' },
            'Laptops': { icon: Laptop, color: 'text-emerald-500', bg: 'bg-emerald-500/10', desc: 'Compute Matrix' },
            'Accessories': { icon: Cable, color: 'text-amber-500', bg: 'bg-amber-500/10', desc: 'Modular Links' },
          };
          const fetched = res.data.categories.map(cat => ({
            ...cat,
            ...(iconMap[cat.name] || { icon: Box, color: 'text-primary-500', bg: 'bg-primary-500/10', desc: 'Market Expansion' })
          }));
          setCategories(fetched);
        }
      })
      .catch(() => { });
  }, []);

  return (
    <section className="section-padding py-20 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-500 mb-8 block">Product Categories</span>
          <h2 className="text-6xl sm:text-7xl font-black text-surface-900 dark:text-white mb-10 tracking-tighter leading-tight">
            Shop by <span className="text-surface-400">Category.</span>
          </h2>
          <p className="text-surface-500 dark:text-surface-300 text-xl leading-relaxed max-w-2xl font-bold">
            Explore our hand-picked selection of top-tier electronics,
            backed by our quality assurance and authentication protocols.
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <BorderGlow className="h-full w-full" borderRadius={50} glowRadius={10} animated={true}>
              <Link
                to={`/products?category=${cat.category_id}`}
                className="p-12 block group relative overflow-hidden h-full transition-all duration-700 hover:scale-[1.03]"
              >
                <div className={`w-24 h-24 mb-12 rounded-[32px] ${cat.bg} flex items-center justify-center transition-all duration-700 group-hover:scale-110 group-hover:rotate-12 shadow-2xl`}>
                  <cat.icon className={`w-10 h-10 ${cat.color} stroke-[2.5]`} />
                </div>
                <h3 className="font-black text-surface-900 dark:text-white text-3xl mb-4 tracking-tighter">{cat.name}</h3>
                <p className="text-surface-400 font-black text-[10px] uppercase tracking-[0.3em]">{cat.desc}</p>

                <div className="absolute top-10 right-10 w-12 h-12 rounded-2xl glass flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                  <ArrowRight className="w-6 h-6 text-primary-500" />
                </div>
              </Link>
            </BorderGlow>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── Trending ─── */
function TrendingProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/recommendations/trending')
      .then((res) => setProducts(res.data.trending || []))
      .catch(() => {
        API.get('/products?per_page=8&sort_by=created_at&order=desc')
          .then((res) => setProducts(res.data.products || []))
          .catch(() => { });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-40 text-center"><LoadingSpinner text="Querying trends..." /></div>;
  if (products.length === 0) return null;

  return (
    <section className="section-padding py-20 relative">
      <div className="flex flex-col sm:flex-row justify-between items-end mb-20 gap-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500 mb-8 block">Trending Now</span>
          <h2 className="text-6xl sm:text-7xl font-black text-surface-900 dark:text-white tracking-tighter">
            Most <span className="gradient-text">Popular.</span>
          </h2>
        </motion.div>
        <Link to="/products" className="btn-secondary glass !py-5 !px-10 !rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:text-primary-500 shadow-xl transition-all">
          View Repository
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 relative z-10">
        {products.slice(0, 8).map((product, i) => (
          <ProductCard key={product.product_id} product={product} index={i} />
        ))}
      </div>
    </section>
  );
}

/* ─── Features ─── */
function FeaturesSection() {
  const features = [
    {
      icon: Cpu,
      title: 'Neural Engine',
      desc: 'Our proprietary logic analyzes hardware integrity to ensure absolute authenticity.',
      color: 'text-primary-500',
    },
    {
      icon: ShieldCheck,
      title: 'Zero Trust',
      desc: 'End-to-end encrypted transactions with role-validated merchant credentials.',
      color: 'text-emerald-500',
    },
    {
      icon: CreditCard,
      title: 'Fluid Settlement',
      desc: 'Instant financial processing supporting all regional and global protocols.',
      color: 'text-rose-500',
    },
    {
      icon: Globe,
      title: 'Sovereign Network',
      desc: 'Optimized logistics infrastructure for high-speed inter-sector deliveries.',
      color: 'text-blue-500',
    },
  ];

  return (
    <section className="section-padding py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-500 mb-8 block">Why Choose Us</span>
          <h2 className="text-7xl sm:text-8xl font-black text-surface-900 dark:text-white mb-12 tracking-tighter leading-none">
            Simply <br /> <span className="text-surface-400">Premium.</span>
          </h2>
          <p className="text-xl text-surface-500 dark:text-surface-300 leading-relaxed font-bold mb-16 max-w-2xl">
            OmniCart Studio is not a simple marketplace; it is a high-performance
            ecosystem designed for the next generation of commerce.
          </p>
          <div className="flex items-center gap-16">
            <div>
              <p className="text-6xl font-black text-surface-900 dark:text-white tracking-tighter">99.9<span className="text-primary-500">%</span></p>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-surface-400 mt-4">Uptime Protocol</p>
            </div>
            <div className="h-16 w-px bg-surface-200 dark:bg-white/10" />
            <div>
              <p className="text-6xl font-black text-surface-900 dark:text-white tracking-tighter">20<span className="text-primary-500">ms</span></p>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-surface-400 mt-4">Latency Index</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="transition-all duration-700 hover:translate-y-[-10px] shadow-2xl"
            >
              <BorderGlow className="h-full w-full" borderRadius={50} glowRadius={10} animated={true}>
                <div className="p-12 relative overflow-hidden h-full flex flex-col justify-center">
                  <div className="w-16 h-16 mb-10 rounded-[20px] glass flex items-center justify-center shadow-xl">
                    <f.icon className={`w-8 h-8 ${f.color} floating`} />
                  </div>
                  <h3 className="font-black text-surface-900 dark:text-white text-2xl mb-4 tracking-tighter">{f.title}</h3>
                  <p className="text-sm text-surface-500 dark:text-surface-300 leading-relaxed font-bold">{f.desc}</p>
                </div>
              </BorderGlow>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Home Page ─── */
export default function Home() {
  return (
    <div className="overflow-x-hidden selection:bg-primary-500 selection:text-white relative">
      <Hero />
      <CategoryShowcase />
      <TrendingProducts />
      <FeaturesSection />

      {/* Studio Final CTA */}
      <section className="section-padding py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="shadow-2xl"
        >
          <BorderGlow className="w-full" borderRadius={80} glowRadius={10} animated={true}>
            <div className="relative overflow-hidden p-16 sm:p-32 text-center w-full">
              <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 to-transparent pointer-events-none" />
              <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[140px] floating" />

              <h2 className="text-7xl sm:text-[9rem] font-black text-surface-900 dark:text-white mb-16 tracking-tighter leading-[0.85] relative z-10">
                Start <br /> <span className="gradient-text">Selling.</span>
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-10 relative z-10">
                <Link to="/register" className="btn-primary !px-16 !py-8 !rounded-3xl shadow-2xl shadow-primary-500/30 floating">
                  Create Seller Account
                </Link>
                <Link to="/login" className="text-surface-900 dark:text-white font-black uppercase tracking-[0.5em] text-[11px] hover:text-primary-500 transition-all">
                  Sign In to Your Hub
                </Link>
              </div>
            </div>
          </BorderGlow>
        </motion.div>
      </section>
    </div>
  );
}
