'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export function SplashIntro({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide splash screen after 3.5 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900 overflow-hidden"
          >
            {/* Animated Background Elements */}
            <motion.div 
              className="absolute w-[500px] h-[500px] bg-amber-500/20 rounded-full blur-[100px]"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />

            {/* Boy Waving Animation (Emoji/CSS based for instant loading) */}
            <motion.div
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="text-8xl md:text-9xl relative mb-4">
                <Image src="/logo.png" alt="RaviClasses Logo" width={120} height={120} className="rounded-2xl shadow-2xl" />
              </div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="text-4xl md:text-6xl font-extrabold text-white mt-8 tracking-tight text-center"
              >
                Welcome to <span className="text-amber-500">RaviClasses</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8, duration: 0.8 }}
                className="text-amber-200/80 mt-4 text-lg md:text-xl font-medium tracking-wide"
              >
                Preparing you for excellence...
              </motion.p>
            </motion.div>
            
            {/* Loading Bar */}
            <motion.div 
              className="absolute bottom-20 w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <motion.div 
                className="h-full bg-amber-500 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ delay: 1, duration: 2, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showSplash ? 0 : 1 }}
        transition={{ duration: 1, delay: showSplash ? 0 : 0.2 }}
        className={showSplash ? "h-screen overflow-hidden" : ""}
      >
        {children}
      </motion.div>
    </>
  );
}
