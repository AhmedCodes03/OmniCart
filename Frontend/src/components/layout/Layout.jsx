import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col text-surface-900 dark:text-white selection:bg-primary-500 selection:text-white bg-transparent relative overflow-hidden">
      
      {/* Global Studio Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-primary-500/10 rounded-full blur-[160px]" 
        />
        <div className="absolute bottom-[-10%] right-[-5%] w-[60%] h-[60%] bg-rose-500/10 rounded-full blur-[140px] floating" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
      <AnimatePresence mode="wait">
        <motion.main 
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 pt-20"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
        <Footer />
      </div>
    </div>
  );
}
