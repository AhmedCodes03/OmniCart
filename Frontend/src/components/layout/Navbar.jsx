import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, Menu, X, Search, LogOut, LayoutDashboard, Package, ChevronDown, Sun, Moon, Globe, Cpu, Zap, Activity, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';


export default function Navbar() {
  const { user, role, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Determine if nav should be transparent or glass
      setScrolled(currentScrollY > 20);

      // Show/Hide logic
      if (currentScrollY > lastScrollY && currentScrollY > 1) {
        setHidden(true);
      } else if (currentScrollY < lastScrollY - 5 || currentScrollY <= 200) {
        setHidden(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    setMobileOpen(false);
    setProfileOpen(false);
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (role === 'admin') return '/admin';
    if (role === 'vendor') return '/vendor';
    return '/dashboard';
  };

  return (
    <>
      <motion.nav
        variants={{
          visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.1 } },
          hidden: { y: -100, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }
        }}
        animate={hidden ? "hidden" : "visible"}
        className={`fixed top-0 left-0 right-0 z-[100] transition-colors duration-700 ${scrolled
          ? 'glass-strong border-b border-surface-200 dark:border-white/10 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.2)] py-3'
          : 'bg-transparent py-6'
          }`}>
        <div className="section-padding">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo - Studio Command */}
            <Link to="/" className="flex items-center gap-4 group relative">
              <div className="w-12 h-12 rounded-[18px] glass bg-primary-500/10 flex items-center justify-center border border-primary-500/30 group-hover:rotate-[15deg] transition-all duration-700 shadow-2xl shadow-primary-500/20">
                <ShoppingCart className="w-6 h-6 text-primary-500 stroke-[2.5] floating" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black text-surface-950 dark:text-white tracking-tighter leading-none">
                  OMNI<span className="gradient-text">CART</span>
                </span>
                <span className="text-[8px] font-black uppercase tracking-[0.5em] text-primary-500 mt-1">Premium Shop</span>
              </div>
            </Link>

            {/* Matrix Search */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-12">
              <div className="relative w-full group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-xl glass flex items-center justify-center text-surface-900 dark:text-white bg-white/20 dark:bg-white/10 border border-white/20">
                  <Search className="w-4 h-4 stroke-[3]" />
                </div>
                <input
                  type="text"
                  placeholder="Search products, brands, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-18 pr-6 py-4 rounded-3xl glass border border-surface-200 dark:border-white/10 text-[13px] font-bold focus:outline-none focus:border-primary-500/50 focus:ring-8 focus:ring-primary-500/[0.05] transition-all duration-500 tracking-tight"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary-500 glass px-3 py-1 rounded-lg border border-primary-500/20">ENTER</span>
                </div>
              </div>
            </form>

            {/* Core Nav Modules */}
            <div className="hidden lg:flex items-center gap-6">
              <Link to="/products" className="group flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-surface-600 dark:text-surface-400 hover:text-primary-500 transition-all">
                <Zap className="w-3 h-3 group-hover:scale-125 transition-transform" /> Shop All
              </Link>

              {/* Theme Sequencer */}


              {isAuthenticated ? (
                <>
                  {role === 'customer' && (
                    <Link to="/cart" className="relative w-12 h-12 rounded-[18px] glass border border-surface-200 dark:border-white/10 text-surface-600 dark:text-surface-300 hover:border-accent-500/50 hover:text-accent-500 transition-all duration-500 flex items-center justify-center group">
                      <ShoppingCart className="w-5 h-5 stroke-[2.5] group-hover:scale-110 transition-transform" />
                      {cartCount > 0 && (
                        <motion.span
                          initial={{ scale: 0, y: 10 }}
                          animate={{ scale: 1, y: 0 }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-accent-500 rounded-xl flex items-center justify-center text-[10px] font-black text-white shadow-xl shadow-accent-500/30 border-2 border-white dark:border-surface-950"
                        >
                          {cartCount}
                        </motion.span>
                      )}
                    </Link>
                  )}

                  {/* Profile Interface */}
                  <div className="relative">
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="flex items-center gap-4 p-2 pr-6 rounded-[24px] glass border border-surface-200 dark:border-white/10 hover:border-primary-500/40 transition-all duration-700 group shadow-lg"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="text-white text-sm font-black relative z-10">{user?.name?.[0]}</span>
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-xs font-black text-surface-950 dark:text-white tracking-tight">{user?.name?.split(' ')[0]}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-primary-500">{role}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-surface-400 transition-transform duration-700 ${profileOpen ? 'rotate-180 text-primary-500' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {profileOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
                          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
                          className="absolute right-0 top-full mt-6 w-80 glass-strong rounded-[40px] p-6 shadow-2xl border border-surface-200 dark:border-white/10 overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16" />

                          <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-xl">
                              <span className="text-white text-xl font-black">{user?.name?.[0]}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-lg font-black text-surface-950 dark:text-white tracking-tighter truncate">{user?.name}</p>
                              <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest truncate">{user?.email}</p>
                            </div>
                          </div>

                          <div className="space-y-2 relative z-10">
                            <Link to={getDashboardLink()} className="flex items-center justify-between px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-surface-600 dark:text-surface-300 hover:glass hover:text-primary-500 transition-all group">
                              <div className="flex items-center gap-4">
                                <LayoutDashboard className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Dashboard
                              </div>
                              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </Link>
                            {role === 'customer' && (
                              <Link to="/dashboard/orders" className="flex items-center justify-between px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-surface-600 dark:text-surface-300 hover:glass hover:text-primary-500 transition-all group">
                                <div className="flex items-center gap-4">
                                  <Package className="w-4 h-4 group-hover:rotate-12 transition-transform" /> My Orders
                                </div>
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                              </Link>
                            )}
                            <Link to="/profile" className="flex items-center justify-between px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-surface-600 dark:text-surface-300 hover:glass hover:text-primary-500 transition-all group">
                              <div className="flex items-center gap-4">
                                <User className="w-4 h-4 group-hover:rotate-12 transition-transform" /> Identity
                              </div>
                              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </Link>

                            <div className="pt-6 mt-4 border-t border-surface-100 dark:border-white/10">
                              <button onClick={handleLogout} className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-500/10 transition-all group">
                                <div className="flex items-center gap-4">
                                  <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Log Out
                                </div>
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to="/login" className="px-6 py-3 text-[11px] font-black uppercase tracking-[0.3em] text-surface-600 dark:text-surface-400 hover:text-primary-500 transition-all">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary !py-4 !px-8 text-[11px] !rounded-[20px] font-black uppercase tracking-[0.3em] shadow-xl shadow-primary-500/20 floating">
                    Create Account
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Interface Controls */}
            <div className="flex lg:hidden items-center gap-4">
              <button onClick={toggleDarkMode} className="w-12 h-12 rounded-[18px] glass border border-surface-200 dark:border-white/10 flex items-center justify-center">
                {darkMode ? <Sun className="w-5 h-5 text-primary-500" /> : <Moon className="w-5 h-5 text-primary-500" />}
              </button>
              <button onClick={() => setMobileOpen(!mobileOpen)} className="w-12 h-12 rounded-[18px] glass border border-surface-200 dark:border-white/10 flex items-center justify-center relative overflow-hidden">
                <div className={`absolute transition-all duration-500 ${mobileOpen ? 'rotate-90 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`}>
                  <Menu className="w-6 h-6" />
                </div>
                <div className={`absolute transition-all duration-500 ${mobileOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-90 opacity-0 scale-50'}`}>
                  <X className="w-6 h-6" />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Command Overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden glass-strong border-t border-surface-200 dark:border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="section-padding py-10 space-y-10">
                <form onSubmit={handleSearch} className="relative group">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
                  <input
                    type="text"
                    placeholder="Recalibrate database..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field glass pl-16 !rounded-[24px] !py-5 !font-black !text-xs tracking-widest"
                  />
                </form>
                <div className="grid grid-cols-1 gap-4">
                  <Link to="/products" className="flex items-center gap-6 px-6 py-6 rounded-[24px] text-surface-950 dark:text-white font-black text-xs uppercase tracking-[0.3em] hover:glass transition-all">
                    <Zap className="w-5 h-5 text-primary-500" /> Shop All
                  </Link>
                  {isAuthenticated ? (
                    <>
                      {role === 'customer' && (
                        <Link to="/cart" className="flex items-center gap-6 px-6 py-6 rounded-[24px] text-surface-950 dark:text-white font-black text-xs uppercase tracking-[0.3em] hover:glass transition-all">
                          <ShoppingCart className="w-5 h-5 text-primary-500" /> My Cart {cartCount > 0 && `[${cartCount}]`}
                        </Link>
                      )}
                      <Link to={getDashboardLink()} className="flex items-center gap-6 px-6 py-6 rounded-[24px] text-surface-950 dark:text-white font-black text-xs uppercase tracking-[0.3em] hover:glass transition-all">
                        <LayoutDashboard className="w-5 h-5 text-primary-500" /> Dashboard
                      </Link>
                      <Link to="/profile" className="flex items-center gap-6 px-6 py-6 rounded-[24px] text-surface-950 dark:text-white font-black text-xs uppercase tracking-[0.3em] hover:glass transition-all">
                        <User className="w-5 h-5 text-primary-500" /> Identity
                      </Link>
                      <button onClick={handleLogout} className="w-full flex items-center gap-6 px-6 py-6 rounded-[24px] text-rose-500 font-black text-xs uppercase tracking-[0.3em] hover:bg-rose-500/10 transition-all text-left">
                        <LogOut className="w-5 h-5" /> Log Out
                      </button>
                    </>
                  ) : (
                    <div className="grid grid-cols-2 gap-6 pt-6">
                      <Link to="/login" className="btn-secondary glass text-center !rounded-[24px] !py-5 !text-[10px] font-black uppercase tracking-widest">Sign In</Link>
                      <Link to="/register" className="btn-primary text-center !rounded-[24px] !py-5 !text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20">Sign Up</Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Global Interface Overlay for Profile */}
      <AnimatePresence>
        {profileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-surface-950/20 backdrop-blur-sm"
            onClick={() => setProfileOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
