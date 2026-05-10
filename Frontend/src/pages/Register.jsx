import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Store, Phone, MapPin, Globe, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BorderGlow from '../components/ui/BorderGlow';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '', store_name: '' });

  const updateForm = (key, value) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ ...form, role });
      toast.success('Onboarding complete. Identity registered.');
      if (role === 'vendor') toast('Verification pending admin authorization.', { icon: '⏳' });
      navigate(role === 'vendor' ? '/vendor' : '/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration sequence aborted');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24 relative overflow-hidden selection:bg-primary-500 selection:text-white">
      {/* Antigravity Field */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-primary-500/10 rounded-full blur-[160px] floating" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[60%] h-[60%] bg-rose-500/10 rounded-full blur-[160px] floating" style={{ animationDelay: '-4s' }} />
        
        {/* Spatial Dividers */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-primary-500/[0.04] dark:border-white/[0.02] rounded-full floating" style={{ animationDuration: '15s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        transition={{ type: 'spring', damping: 25, stiffness: 100 }}
        className="w-full max-w-3xl relative z-10"
      >
        <BorderGlow className="w-full" borderRadius={50} glowRadius={15} animated={true}>
          <div className="p-10 sm:p-16 relative overflow-hidden w-full">
            <div className="absolute top-0 left-0 w-40 h-40 bg-primary-500/5 rounded-full blur-3xl -ml-20 -mt-20" />
            
            <div className="text-center mb-12 relative z-10">
              <Link to="/" className="inline-flex items-center gap-4 mb-10 group">
                <div className="w-16 h-16 rounded-3xl bg-primary-600 flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform duration-700">
                  <Cpu className="w-8 h-8 text-white stroke-[2.5] floating" />
                </div>
              </Link>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-500 mb-4 block">Identity Synthesis</span>
              <h1 className="text-5xl font-black text-surface-950 dark:text-white mb-4 tracking-tighter">New <span className="text-surface-400">Application.</span></h1>
              <p className="text-surface-500 font-bold uppercase tracking-widest text-[10px]">Create your secure marketplace credentials</p>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-10 relative z-10">
              {[
                { value: 'customer', label: 'Customer', icon: User }, 
                { value: 'vendor', label: 'Vendor', icon: Store }
              ].map((r) => (
                <button 
                  key={r.value} 
                  type="button" 
                  onClick={() => setRole(r.value)}
                  className={`flex items-center justify-center gap-4 p-5 rounded-3xl border transition-all duration-500 ${
                    role === r.value 
                    ? 'glass bg-primary-500/10 border-primary-500/50 text-primary-600 dark:text-primary-400 shadow-xl' 
                    : 'border-surface-100 dark:border-white/5 text-surface-400 hover:bg-surface-50 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <r.icon className={`w-5 h-5 ${role === r.value ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{r.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-surface-400 ml-4">Full Legal Identity</label>
                <div className="relative group">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300 group-focus-within:text-primary-500 transition-colors" />
                  <input type="text" value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Full Name" className="input-field glass !pl-16 !pr-8 !py-5 !rounded-2xl !font-bold w-full" required />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-surface-400 ml-4">Network Identifier (Email)</label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300 group-focus-within:text-primary-500 transition-colors" />
                  <input type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} placeholder="name@sector.com" className="input-field glass !pl-16 !pr-8 !py-5 !rounded-2xl !font-bold w-full" required />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-surface-400 ml-4">Access Key</label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300 group-focus-within:text-primary-500 transition-colors" />
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => updateForm('password', e.target.value)} placeholder="Secure Code" className="input-field glass !pl-16 !pr-16 !py-5 !rounded-2xl !font-bold w-full" required minLength={6} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-surface-400 hover:text-primary-500 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-surface-400 ml-4">Comm-Link (Phone)</label>
                <div className="relative group">
                  <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300 group-focus-within:text-primary-500 transition-colors" />
                  <input type="tel" value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder="03XX-XXXXXXX" className="input-field glass !pl-16 !pr-8 !py-5 !rounded-2xl !font-bold w-full" />
                </div>
              </div>

              {role === 'customer' && (
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-surface-400 ml-4">Geospatial Coordinates (Address)</label>
                  <div className="relative group">
                    <MapPin className="absolute left-6 top-6 w-5 h-5 text-surface-300 group-focus-within:text-primary-500 transition-colors" />
                    <textarea value={form.address} onChange={(e) => updateForm('address', e.target.value)} placeholder="Operational headquarters location" className="input-field glass !pl-16 !pr-8 !py-5 !rounded-2xl !font-bold min-h-[120px] resize-none w-full" />
                  </div>
                </div>
              )}

              {role === 'vendor' && (
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] text-surface-400 ml-4">Commercial Entity (Store Name)</label>
                  <div className="relative group">
                    <Store className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300 group-focus-within:text-primary-500 transition-colors" />
                    <input type="text" value={form.store_name} onChange={(e) => updateForm('store_name', e.target.value)} placeholder="Official Brand Designation" className="input-field glass !pl-16 !pr-8 !py-5 !rounded-2xl !font-bold w-full" />
                  </div>
                </div>
              )}

              <div className="md:col-span-2 mt-6">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn-primary w-full !py-6 !rounded-2xl flex items-center justify-center gap-4 shadow-2xl shadow-primary-500/30 group"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="text-[11px] font-black uppercase tracking-[0.3em]">Authorize Deployment</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-12 pt-8 border-t border-surface-100 dark:border-white/5 text-center relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">
                Existing identity found? <Link to="/login" className="text-primary-500 hover:text-primary-400 font-black transition-colors">Re-authenticate here</Link>
              </p>
            </div>
          </div>
        </BorderGlow>
      </motion.div>
    </div>
  );
}
