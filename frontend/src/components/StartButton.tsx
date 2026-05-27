import React from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';

interface StartButtonProps {
  onClick: () => void;
}

export const StartButton: React.FC<StartButtonProps> = ({ onClick }) => {
  
  // High-fidelity digital sound synthesizers using browser Web Audio API
  const playSynthSound = (type: 'hover' | 'click') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (type === 'hover') {
        // High quality futuristic soft chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(380, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(760, ctx.currentTime + 0.12);
        
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.13);
      } else if (type === 'click') {
        // Futuristic system authorization sound (layered synths)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        
        // Lower tech hum
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(180, ctx.currentTime);
        osc1.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.35);
        gain1.gain.setValueAtTime(0.1, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
        
        // Higher chime chime
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(520, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(1040, ctx.currentTime + 0.2);
        gain2.gain.setValueAtTime(0.06, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
        
        // Connect lowpass filter for deep synth feel
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
        
        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(filter);
        gain2.connect(filter);
        filter.connect(ctx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.4);
        osc2.stop(ctx.currentTime + 0.25);
      }
    } catch (err) {
      console.warn('Web Audio synthesis not supported or blocked by permissions:', err);
    }
  };

  const handleStart = () => {
    playSynthSound('click');
    // Allow the sound to play for a brief split second before navigating
    setTimeout(() => {
      onClick();
    }, 150);
  };

  return (
    <motion.button
      onClick={handleStart}
      onMouseEnter={() => playSynthSound('hover')}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      className="group relative px-9 py-4 font-mono text-sm font-bold tracking-[0.25em] text-[#cbd5e1] hover:text-white uppercase transition-all duration-300 rounded-xl cursor-pointer border border-indigo-500/30 hover:border-indigo-400/80 bg-slate-950/40 hover:bg-indigo-500/10 backdrop-blur-md overflow-hidden"
      style={{
        boxShadow: '0 0 15px rgba(99, 102, 241, 0.12), inset 0 0 12px rgba(255, 255, 255, 0.02)'
      }}
    >
      {/* Absolute Neon Glow backdrops */}
      <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Glare effect */}
      <span className="absolute -inset-y-12 -inset-x-20 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-30 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-out" />
      
      {/* Button Content */}
      <span className="relative flex items-center justify-center gap-3 select-none">
        <Terminal className="w-4 h-4 text-indigo-400 group-hover:text-cyan-400 transition-colors animate-pulse" />
        START EXPERIENCE
      </span>
      
      {/* Subtly glowing neon borders */}
      <span className="absolute bottom-0 left-0 w-[2px] h-0 bg-indigo-400 group-hover:h-full transition-all duration-300" />
      <span className="absolute top-0 right-0 w-[2px] h-0 bg-purple-400 group-hover:h-full transition-all duration-300" />
    </motion.button>
  );
};

export default StartButton;
