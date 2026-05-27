import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader } from '../components/Loader';
import { Scene3D } from '../components/Scene3D';
import { StartButton } from '../components/StartButton';
import { Sparkles, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isEntering, setIsEntering] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleStart = () => {
    setIsEntering(true);
    // Allow Framer Motion exit transition to play before navigating
    setTimeout(() => {
      if (isAuthenticated) {
        navigate('/dashboard');
      } else {
        // Safe navigation to dashboard which routes through ProtectedRoute to /login
        navigate('/dashboard');
      }
    }, 700);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans bg-[#030712] text-slate-100">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loader-container"
            exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0 z-50"
          >
            <Loader onComplete={() => setIsLoading(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="landing-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(15px)' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full h-full relative flex flex-col justify-between items-center px-6 py-8"
          >
            {/* 1. 3D Canvas Background */}
            <Scene3D />

            {/* Static Grid lines for cyber feel */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none select-none z-0" />

            {/* Ambient gradients */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-500/5 via-purple-500/3 to-transparent rounded-full blur-[100px] pointer-events-none" />

            {/* 2. Top Header / Navbar */}
            <header className="w-full max-w-7xl flex items-center justify-between z-20 relative">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
                  <Terminal className="w-4 h-4 text-white animate-pulse" />
                </div>
                <span className="font-mono text-xs font-bold tracking-[0.2em] text-[#e2e8f0] uppercase">
                  NOVA<span className="text-indigo-400">SQL</span>
                </span>
              </div>
            </header>

            {/* 3. Main Center Brand & Action */}
            <main className="flex-1 flex flex-col items-center justify-center max-w-2xl text-center z-20 relative px-4">
              <motion.div
                initial={{ y: 25, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="space-y-8"
              >
                {/* Glowing AI tag */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 shadow-sm shadow-indigo-950/20 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-300 uppercase">
                    AI SQL Companion v1.2
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Huge cinematic neon title */}
                  <h2 className="text-5xl md:text-7xl font-black tracking-[0.18em] text-slate-100 uppercase select-none leading-none filter drop-shadow-[0_0_35px_rgba(99,102,241,0.25)]">
                    NOVA<span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">SQL</span>
                  </h2>
                  
                  {/* Subtitle */}
                  <p className="text-md md:text-lg text-slate-450 font-mono tracking-widest uppercase font-medium">
                    AI-Powered SQL Companion
                  </p>
                </div>

                {/* Subtext description in glass card */}
                <div className="glass-panel p-5 rounded-2xl max-w-lg mx-auto border border-slate-800/40 shadow-xl backdrop-blur-lg">
                  <p className="text-xs md:text-sm text-[#9ca3af] font-medium leading-6">
                    Connect, query, and analyze your relational databases seamlessly. Harness generative AI to write, debug, and explain SQL in real time.
                  </p>
                </div>

                {/* Start Action Button */}
                <div className="pt-6">
                  <StartButton onClick={handleStart} />
                </div>
              </motion.div>
            </main>

            {/* 4. Bottom Footer */}
            <footer className="w-full max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 z-20 relative text-[10px] font-mono text-slate-500 select-none">
              <div>
                DESIGN SYSTEM: GLASSMORPHISM & NEON CORE
              </div>
              <div className="flex gap-6">
                <span>OPENAI / GEMINI API</span>
                <span>POSTGRES / SQLITE</span>
              </div>
            </footer>

            {/* Cinematic exit flash screen on Start button press */}
            <AnimatePresence>
              {isEntering && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="fixed inset-0 bg-[#030712] z-50 flex items-center justify-center"
                >
                  <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
                      INITIALIZING WORKSPACE...
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
