import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Cpu, Sparkles, Server } from 'lucide-react';

interface LoaderProps {
  onComplete: () => void;
}

export const Loader: React.FC<LoaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusIndex, setStatusIndex] = useState(0);

  const statuses = [
    { text: 'Initializing NovaSQL core...', icon: <Cpu className="w-4 h-4 text-indigo-400" /> },
    { text: 'Connecting database clusters...', icon: <Server className="w-4 h-4 text-blue-400" /> },
    { text: 'Spawning AI neural engine...', icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
    { text: 'Optimizing companion vectors...', icon: <Database className="w-4 h-4 text-emerald-400" /> },
    { text: 'Neural channels online. Ready.', icon: <Database className="w-4 h-4 text-emerald-400 animate-pulse" /> }
  ];

  useEffect(() => {
    const duration = 2400; // 2.4 seconds total loading
    const intervalTime = 30;
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onComplete();
          }, 400); // Small pause at 100% for dramatic impact
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    if (progress < 25) {
      setStatusIndex(0);
    } else if (progress < 55) {
      setStatusIndex(1);
    } else if (progress < 85) {
      setStatusIndex(2);
    } else if (progress < 98) {
      setStatusIndex(3);
    } else {
      setStatusIndex(4);
    }
  }, [progress]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030712] text-slate-100 font-sans overflow-hidden">
      {/* Cinematic abstract background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse [animation-delay:1s]" />

      <div className="relative max-w-md w-full px-6 flex flex-col items-center">
        {/* Animated holographic icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.9, 1.1, 1], opacity: 1 }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
          className="relative flex items-center justify-center mb-8"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-[1px] shadow-2xl shadow-indigo-500/20">
            <div className="w-full h-full rounded-3xl bg-[#080d1a] flex items-center justify-center">
              <Database className="w-9 h-9 text-indigo-400" />
            </div>
          </div>
          {/* Ping effects around the icon */}
          <span className="absolute inset-0 rounded-3xl border border-indigo-500/30 scale-110 animate-ping opacity-25" />
        </motion.div>

        {/* Branding header */}
        <h1 className="text-3xl font-black tracking-[0.25em] text-white bg-gradient-to-r from-slate-100 via-indigo-200 to-slate-100 bg-clip-text text-transparent uppercase mb-2 select-none">
          NOVASQL
        </h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mb-12 select-none">
          AI SQL Companion
        </p>

        {/* Loading Progress Bar Container */}
        <div className="w-full bg-slate-950/80 border border-slate-900/60 rounded-full p-[3px] backdrop-blur-md mb-6 shadow-inner">
          <motion.div
            className="h-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 relative"
            style={{ width: `${progress}%` }}
            layoutId="progressBar"
          >
            {/* Glowing tail of the loader */}
            <div className="absolute top-0 right-0 h-full w-4 bg-white/40 blur-xs rounded-full" />
            <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-4 h-4 bg-indigo-400 rounded-full blur-md opacity-80" />
          </motion.div>
        </div>

        {/* Live Ticker and Percentage */}
        <div className="w-full flex items-center justify-between min-h-[32px] text-xs font-mono select-none px-1">
          <div className="flex items-center gap-2.5 text-slate-400 font-medium">
            <motion.div
              key={statusIndex}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              {statuses[statusIndex].icon}
              <span className="tracking-wide">{statuses[statusIndex].text}</span>
            </motion.div>
          </div>
          <span className="text-indigo-400 font-bold tabular-nums">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Cyberpunk terminal style decoration */}
      <div className="absolute bottom-6 left-6 font-mono text-[9px] text-slate-600 select-none hidden sm:block">
        SYS_STATUS: NEURAL_CONN_OK // SW_VER: 1.2.0
      </div>
      <div className="absolute bottom-6 right-6 font-mono text-[9px] text-slate-600 select-none hidden sm:block">
        © 2026 NOVASQL LABS INC.
      </div>
    </div>
  );
};

export default Loader;
