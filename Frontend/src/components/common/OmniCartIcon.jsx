import React from 'react';
import { motion } from 'framer-motion';

export default function OmniCartIcon({ className = "w-16 h-16" }) {
    return (
        <motion.div
            className={`relative flex items-center justify-center rounded-2xl bg-white/5 backdrop-blur-[20px] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] overflow-hidden ${className}`}
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: [0, -6, 0] }}
            whileHover={{ scale: 1.05, boxShadow: "0 15px 40px rgba(99, 102, 241, 0.2)" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], y: { duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.4 } }}
        >
            {/* Background ambient glow matching the brand colors */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-pink-500/20 blur-xl rounded-full scale-150"></div>

            {/* Premium SVG Icon */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 100 100"
                className="relative z-10 w-3/5 h-3/5 drop-shadow-lg"
            >
                <defs>
                    {/* Core Brand Gradient */}
                    <linearGradient id="omniGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" />   {/* Indigo */}
                        <stop offset="100%" stopColor="#ec4899" /> {/* Pink */}
                    </linearGradient>

                    {/* Glass Specular Highlight Gradient */}
                    <linearGradient id="glassShine" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                </defs>

                {/* The Cart Wheels (Stylized as floating dots) */}
                <circle cx="32" cy="75" r="7" fill="url(#omniGradient)" />
                <circle cx="72" cy="75" r="7" fill="url(#omniGradient)" />

                {/* The Sleek Cart Body & Omni Arc */}
                <path
                    d="M 12 20 L 24 20 L 36 60 L 78 60 L 88 32 L 30 32"
                    fill="none"
                    stroke="url(#omniGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Abstract Top Arc (The "O" loop in Omni) */}
                <path
                    d="M 45 15 C 65 15, 85 20, 88 32"
                    fill="none"
                    stroke="url(#glassShine)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    style={{ opacity: 0.6 }}
                />
            </svg>
        </motion.div>
    );
}