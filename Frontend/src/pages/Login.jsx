import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User, Store, Shield, Globe, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BorderGlow from '../components/ui/BorderGlow';
import toast from 'react-hot-toast';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const roles = [
    { value: 'customer', label: 'Customer', icon: User },
    { value: 'vendor', label: 'Vendor', icon: Store },
    { value: 'admin', label: 'Admin', icon: Shield },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password, role);
      toast.success('Access keys validated. Welcome.');
      if (role === 'admin') navigate('/admin');
      else if (role === 'vendor') navigate('/vendor');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication sequence failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 relative overflow-hidden selection:bg-primary-500 selection:text-white">
      {/* Antigravity Field */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-primary-500/10 rounded-full blur-[160px] floating" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-indigo-500/10 rounded-full blur-[160px] floating" style={{ animationDelay: '-3s' }} />
        
        {/* Hardware Accents */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] border border-primary-500/[0.05] dark:border-white/[0.03] rounded-full floating" style={{ animationDuration: '12s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary-500/[0.03] dark:border-white/[0.02] rounded-full floating" style={{ animationDuration: '8s', animationDelay: '-2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        transition={{ type: 'spring', damping: 25, stiffness: 100 }}
        className="w-full max-w-lg relative z-10"
      >
        <BorderGlow className="w-full" borderRadius={50} glowRadius={15} animated={true}>
          <div className="p-10 sm:p-16 relative overflow-hidden w-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="text-center mb-12 relative z-10">
              <Link to="/" className="inline-flex items-center gap-4 mb-10 group">
                <div className="w-16 h-16 rounded-3xl bg-primary-600 flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform duration-700">
                  <Cpu className="w-8 h-8 text-white stroke-[2.5] floating" />
                </div>
              </Link>
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-500 mb-4 block">Security Protocol</span>
              <h1 className="text-5xl font-black text-surface-950 dark:text-white mb-4 tracking-tighter">Access <span className="text-surface-400">Hub.</span></h1>
              <p className="text-surface-500 font-bold uppercase tracking-widest text-[10px]">Initialize authentication sequence</p>
            </div>

            <div className="grid grid-cols-3 gap-5 mb-10 relative z-10">
              {roles.map((r) => (
                <button 
                  key={r.value} 
                  type="button" 
                  onClick={() => setRole(r.value)}
                  className={`flex flex-col items-center gap-3 p-5 rounded-3xl border transition-all duration-500 ${
                    role === r.value 
                    ? 'glass bg-primary-500/10 border-primary-500/50 text-primary-600 dark:text-primary-400 shadow-xl' 
                    : 'border-surface-100 dark:border-white/5 text-surface-400 hover:bg-surface-50 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <r.icon className={`w-5 h-5 ${role === r.value ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest">{r.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-surface-400 ml-4">Credential Identifier</label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300 group-focus-within:text-primary-500 transition-colors" />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="name@sector.com" 
                    className="input-field glass !pl-16 !pr-8 !py-5 !rounded-2xl !font-bold w-full" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-surface-400 ml-4">Access Key</label>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300 group-focus-within:text-primary-500 transition-colors" />
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="input-field glass !pl-16 !pr-16 !py-5 !rounded-2xl !font-bold w-full" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-surface-400 hover:text-primary-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="btn-primary w-full !py-6 !rounded-2xl flex items-center justify-center gap-4 shadow-2xl shadow-primary-500/30 group mt-10"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">Initialize Link</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-12 pt-8 border-t border-surface-100 dark:border-white/5 text-center relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest text-surface-400">
                New identity? <Link to="/register" className="text-primary-500 hover:text-primary-400 transition-colors">Request Protocol</Link>
              </p>
            </div>
          </div>
        </BorderGlow>
      </motion.div>
    </div>
  );
}
