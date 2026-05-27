import React from 'react';

interface VoiceWaveProps {
  isListening: boolean;
}

export const VoiceWave: React.FC<VoiceWaveProps> = ({ isListening }) => {
  return (
    <div className="flex flex-col items-center justify-center py-2 space-y-2 select-none w-full">
      <style>{`
        @keyframes wave-bounce {
          0%, 100% {
            transform: scaleY(0.3);
          }
          50% {
            transform: scaleY(1.0);
          }
        }
        .voice-bar {
          transform-origin: center;
          transition: all 0.3s ease-in-out;
        }
        .voice-bar-active-1 { animation: wave-bounce 0.8s ease-in-out infinite; animation-delay: 0.1s; }
        .voice-bar-active-2 { animation: wave-bounce 0.8s ease-in-out infinite; animation-delay: 0.3s; }
        .voice-bar-active-3 { animation: wave-bounce 0.8s ease-in-out infinite; animation-delay: 0.5s; }
        .voice-bar-active-4 { animation: wave-bounce 0.8s ease-in-out infinite; animation-delay: 0.2s; }
        .voice-bar-active-5 { animation: wave-bounce 0.8s ease-in-out infinite; animation-delay: 0.4s; }
      `}</style>

      <div className="flex items-center justify-center gap-1.5 h-10 w-full">
        {isListening ? (
          <>
            <div className="w-1.5 h-8 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full voice-bar voice-bar-active-1 shadow-md shadow-cyan-500/20"></div>
            <div className="w-1.5 h-8 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full voice-bar voice-bar-active-2 shadow-md shadow-cyan-500/20"></div>
            <div className="w-1.5 h-8 bg-gradient-to-t from-indigo-600 to-purple-500 rounded-full voice-bar voice-bar-active-3 shadow-md shadow-purple-500/20"></div>
            <div className="w-1.5 h-8 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full voice-bar voice-bar-active-4 shadow-md shadow-cyan-500/20"></div>
            <div className="w-1.5 h-8 bg-gradient-to-t from-indigo-500 to-cyan-400 rounded-full voice-bar voice-bar-active-5 shadow-md shadow-cyan-500/20"></div>
          </>
        ) : (
          <>
            <div className="w-1.5 h-1.5 bg-slate-800 rounded-full transition-all duration-300"></div>
            <div className="w-1.5 h-1.5 bg-slate-800 rounded-full transition-all duration-300"></div>
            <div className="w-1.5 h-1.5 bg-slate-800 rounded-full transition-all duration-300"></div>
            <div className="w-1.5 h-1.5 bg-slate-800 rounded-full transition-all duration-300"></div>
            <div className="w-1.5 h-1.5 bg-slate-800 rounded-full transition-all duration-300"></div>
          </>
        )}
      </div>

      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 select-none">
        {isListening ? 'Voice Channel Open' : 'Voice Assistant Idle'}
      </span>
    </div>
  );
};
