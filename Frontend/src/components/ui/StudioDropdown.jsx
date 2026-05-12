import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export default function StudioDropdown({ value, onChange, options, label, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && <label className="text-[10px] font-black uppercase tracking-[0.3em] text-surface-400 mb-3 block">{label}</label>}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-14 px-6 rounded-2xl glass border transition-all duration-500 flex items-center justify-between group ${
          isOpen ? 'border-primary-500 shadow-2xl shadow-primary-500/10' : 'border-surface-200 dark:border-white/5 hover:border-surface-400 dark:hover:border-white/20'
        }`}
      >
        <span className="text-xs font-black uppercase tracking-widest text-surface-900 dark:text-white">
          {selectedOption?.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-surface-400 transition-transform duration-500 ${isOpen ? 'rotate-180 text-primary-500' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="absolute z-[100] w-full mt-2 rounded-[32px] glass-strong border border-surface-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden backdrop-blur-3xl"
          >
            <div className="p-2 max-h-64 overflow-y-auto studio-scrollbar">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-6 py-4 rounded-2xl text-left transition-all duration-300 flex items-center justify-between group/opt ${
                    value === opt.value 
                      ? 'bg-primary-500 text-white shadow-xl shadow-primary-500/20' 
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-white/5 hover:text-surface-950 dark:hover:text-white'
                  }`}
                >
                  <span className="text-[11px] font-black uppercase tracking-widest">{opt.label}</span>
                  {value === opt.value && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
