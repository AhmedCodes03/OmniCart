import { Link } from 'react-router-dom';
import { Globe, Share2, Mail, Heart, Zap, Activity, ShieldCheck } from 'lucide-react';
import OmniCartIcon from '../common/OmniCartIcon';

export default function Footer() {
  return (
    <footer className="relative mt-40 border-t border-surface-200 dark:border-white/5 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Gradient glow line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

      <div className="section-padding py-24 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20">
          {/* Brand - Studio Info */}
          <div className="lg:col-span-1 space-y-8">
            <Link to="/" className="flex items-center gap-4 group">
              <OmniCartIcon className="w-12 h-12" />
              <div className="flex flex-col">
                <span className="text-xl font-black text-surface-950 dark:text-white tracking-tighter leading-none">
                  OMNI<span className="gradient-text">CART</span>
                </span>
                <span className="text-[8px] font-black uppercase tracking-[0.5em] text-primary-500 mt-1">Premium Shop</span>
              </div>
            </Link>
            <p className="text-surface-600 dark:text-surface-400 text-sm font-bold leading-relaxed max-w-xs">
              The ultimate multi-vendor hardware destination. Powered by premium logistics and verified sellers.
            </p>
            <div className="flex gap-4">
              {[Globe, Share2, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 rounded-[18px] glass flex items-center justify-center text-surface-400 hover:text-primary-500 hover:border-primary-500/40 hover:scale-110 transition-all duration-500 shadow-lg">
                  <Icon className="w-5 h-5 stroke-[2.5]" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Matrix */}
          <div>
            <div className="h-12 flex items-center mb-10">
              <h4 className="text-[10px] font-black text-surface-950 dark:text-white uppercase tracking-[0.4em] flex items-center gap-3">
                <Zap className="w-4 h-4 text-primary-500" /> Categories
              </h4>
            </div>
            <ul className="space-y-4">
              {['All Products', 'Computer Hardware', 'Audio Tech', 'Mobile Gadgets', 'Accessories', 'New Arrivals'].map((item) => (
                <li key={item}>
                  <Link to="/products" className="text-xs font-black text-surface-600 dark:text-surface-400 hover:text-primary-500 uppercase tracking-widest transition-all hover:translate-x-2 inline-block">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Protocol */}
          <div>
            <div className="h-12 flex items-center mb-10">
              <h4 className="text-[10px] font-black text-surface-950 dark:text-white uppercase tracking-[0.4em] flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-primary-500" /> Customer Care
              </h4>
            </div>
            <ul className="space-y-4">
              {[
                { label: 'Login', to: '/login' },
                { label: 'Register', to: '/register' },
                { label: 'My Orders', to: '/dashboard/orders' },
                { label: 'My Cart', to: '/cart' },
                { label: 'My Profile', to: '/profile' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-xs font-black text-surface-600 dark:text-surface-400 hover:text-primary-500 uppercase tracking-widest transition-all hover:translate-x-2 inline-block">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Vendor Channel */}
          <div>
            <div className="h-12 flex items-center mb-10">
              <h4 className="text-[10px] font-black text-surface-950 dark:text-white uppercase tracking-[0.4em] flex items-center gap-3">
                <Activity className="w-4 h-4 text-primary-500" /> Sell on OmniCart
              </h4>
            </div>
            <ul className="space-y-4">
              {[
                { label: 'Become a Seller', to: '/register' },
                { label: 'Seller Dashboard', to: '/vendor' },
                { label: 'Add Product', to: '/vendor/products/add' },
                { label: 'Manage Orders', to: '/vendor/orders' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-xs font-black text-surface-600 dark:text-surface-400 hover:text-primary-500 uppercase tracking-widest transition-all hover:translate-x-2 inline-block">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Studio Footer Info */}
        <div className="mt-24 pt-10 border-t border-surface-200 dark:border-white/5 flex flex-col sm:flex-row justify-between items-center gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} OMNICART PREMIER
            </p>
            <div className="h-4 w-px bg-surface-200 dark:bg-white/10 hidden sm:block" />
            <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em]">
              All Modules Online
            </p>
          </div>
          <p className="text-[10px] font-black text-surface-400 uppercase tracking-[0.3em] flex items-center gap-3 glass px-6 py-2 rounded-full border border-surface-200 dark:border-white/10">
            Engineered with <Heart className="w-4 h-4 text-rose-500 fill-rose-500 floating" /> for Pakistan
          </p>
        </div>
      </div>
    </footer>
  );
}
