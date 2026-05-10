import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Store, Save, Lock, ShieldCheck, KeyRound, UserCircle, Cpu, Zap, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, role, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '', store_name: user?.store_name || '' });
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await API.put('/auth/profile', form);
      updateUser(res.data.user);
      toast.success('Identity synchronized.');
    } catch (err) { toast.error(err.response?.data?.error || 'Synchronization failed.'); }
    finally { setSaving(false); }
  };

  const handlePwChange = async (e) => {
    e.preventDefault();
    setChangingPw(true);
    try {
      await API.put('/auth/change-password', pwForm);
      toast.success('Access keys updated.');
      setPwForm({ old_password: '', new_password: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Security update failed.'); }
    finally { setChangingPw(false); }
  };

  return (
    <div className="section-padding py-24 sm:py-32 max-w-5xl mx-auto relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <header className="mb-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center text-primary-500">
              <Cpu className="w-5 h-5 floating" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-primary-500 block">Identity Terminal</span>
          </div>
          <h1 className="text-6xl sm:text-8xl font-black text-surface-950 dark:text-white mb-6 tracking-tighter leading-tight">User <span className="text-surface-400">Settings.</span></h1>
          <p className="text-surface-500 font-bold uppercase tracking-widest text-[10px]">Manage your secure marketplace credentials</p>
        </header>

        {/* User Identity Matrix */}
        <div className="glass-strong rounded-[60px] p-12 sm:p-16 border border-surface-200 dark:border-white/10 mb-16 flex flex-col sm:flex-row items-center gap-12 relative overflow-hidden shadow-2xl group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary-500/10 rounded-full blur-[100px] -mr-24 -mt-24 group-hover:scale-125 transition-transform duration-[2s]" />
          <div className="w-40 h-40 rounded-[50px] bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center shadow-2xl relative z-10 border-4 border-white/20 floating">
            <span className="text-6xl font-black text-white tracking-tighter select-none">{user?.name?.[0] || 'U'}</span>
          </div>
          <div className="text-center sm:text-left relative z-10">
            <h2 className="text-5xl font-black text-surface-950 dark:text-white tracking-tighter mb-4">{user?.name}</h2>
            <p className="text-surface-500 font-bold uppercase tracking-widest text-[11px] flex items-center justify-center sm:justify-start gap-4 mb-8">
              <Mail className="w-4 h-4 text-primary-500" /> {user?.email}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
              <span className="px-6 py-2 rounded-2xl glass border border-primary-500/20 text-primary-500 text-[10px] font-black uppercase tracking-[0.3em]">{role}</span>
              <span className="px-6 py-2 rounded-2xl glass border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                <ShieldCheck className="w-4 h-4" /> Identity Verified
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
          {/* Profile Core Data */}
          <div className="lg:col-span-3 space-y-16">
            <form onSubmit={handleSave} className="glass rounded-[50px] p-12 sm:p-16 border border-surface-200 dark:border-white/5 shadow-2xl relative overflow-hidden">
              <h3 className="text-sm font-black uppercase tracking-[0.4em] text-surface-950 dark:text-white mb-12 flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-primary-500">
                  <UserCircle className="w-6 h-6 floating" />
                </div>
                Core Identity
              </h3>
              
              <div className="space-y-10">
                <div className="space-y-4 group">
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-surface-400 ml-4 group-focus-within:text-primary-500 transition-colors">Legal Designation</label>
                  <div className="relative">
                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300" />
                    <input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} 
                      className="input-field glass !py-6 !pl-16 !pr-8 !rounded-2xl !font-bold" />
                  </div>
                </div>

                <div className="space-y-4 group">
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-surface-400 ml-4 group-focus-within:text-primary-500 transition-colors">Comm-Link Channel</label>
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300" />
                    <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} 
                      placeholder="+92 XXX XXXXXXX"
                      className="input-field glass !py-6 !pl-16 !pr-8 !rounded-2xl !font-bold" />
                  </div>
                </div>

                {role === 'customer' && (
                  <div className="space-y-4 group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-surface-400 ml-4 group-focus-within:text-primary-500 transition-colors">Logistics Endpoint (Address)</label>
                    <div className="relative">
                      <MapPin className="absolute left-6 top-8 w-5 h-5 text-surface-300" />
                      <textarea value={form.address} onChange={(e) => update('address', e.target.value)} 
                        placeholder="Residential coordinates..."
                        className="input-field glass !py-8 !pl-16 !pr-8 !rounded-2xl !font-bold min-h-[160px] resize-none" />
                    </div>
                  </div>
                )}

                {role === 'vendor' && (
                  <div className="space-y-4 group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-surface-400 ml-4 group-focus-within:text-primary-500 transition-colors">Commercial Designation</label>
                    <div className="relative">
                      <Store className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-300" />
                      <input type="text" value={form.store_name} onChange={(e) => update('store_name', e.target.value)} 
                        className="input-field glass !py-6 !pl-16 !pr-8 !rounded-2xl !font-bold" />
                    </div>
                  </div>
                )}

                <button type="submit" disabled={saving} 
                  className="btn-primary w-full !py-6 !rounded-[24px] flex items-center justify-center gap-5 shadow-2xl shadow-primary-500/30 group floating">
                  {saving ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-6 h-6 group-hover:scale-110 transition-transform" /> 
                      <span className="text-[11px] font-black uppercase tracking-[0.3em]">Authorize Sync</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Security & System */}
          <div className="lg:col-span-2 space-y-16">
            {role !== 'admin' && (
              <form onSubmit={handlePwChange} className="glass rounded-[50px] p-12 border border-surface-200 dark:border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-[100px] -mr-20 -mt-20" />
                <h3 className="text-sm font-black uppercase tracking-[0.4em] text-surface-950 dark:text-white mb-12 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-amber-500">
                    <KeyRound className="w-6 h-6 floating" />
                  </div>
                  Security Protocol
                </h3>
                
                <div className="space-y-10">
                  <div className="space-y-4 group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-surface-400 ml-4 group-focus-within:text-amber-500 transition-colors">Active Access Key</label>
                    <input type="password" value={pwForm.old_password} onChange={(e) => setPwForm(p => ({ ...p, old_password: e.target.value }))} 
                      className="input-field glass !py-6 !px-10 !rounded-2xl !font-bold" required />
                  </div>

                  <div className="space-y-4 group">
                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-surface-400 ml-4 group-focus-within:text-amber-500 transition-colors">New Key Specification</label>
                    <input type="password" value={pwForm.new_password} onChange={(e) => setPwForm(p => ({ ...p, new_password: e.target.value }))} 
                      placeholder="Min. 6 chars"
                      className="input-field glass !py-6 !px-10 !rounded-2xl !font-bold" required minLength={6} />
                  </div>

                  <button type="submit" disabled={changingPw} 
                    className="w-full !py-6 !rounded-[24px] flex items-center justify-center gap-5 glass bg-surface-950 dark:bg-white/10 text-white font-black text-[11px] uppercase tracking-[0.3em] hover:bg-surface-900 dark:hover:bg-white/20 transition-all border border-transparent dark:border-white/10">
                    {changingPw ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Lock className="w-5 h-5" /> Update Access
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="glass rounded-[50px] p-12 border border-surface-200 dark:border-white/10 shadow-2xl bg-gradient-to-br from-primary-500/10 to-transparent relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-primary-500/20 rounded-full blur-3xl -mr-12 -mb-12" />
              <div className="flex items-center gap-4 mb-6">
                <Zap className="w-5 h-5 text-primary-500 animate-pulse" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-surface-400">System Link</h3>
              </div>
              <p className="text-sm font-bold text-surface-500 dark:text-surface-400 leading-relaxed">
                Your identity is synchronized across the global Omni-Studio network. 
                All authentication modules are currently active.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
