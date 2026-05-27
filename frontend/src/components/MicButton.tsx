import React from 'react';
import { Mic } from 'lucide-react';

interface MicButtonProps {
  isListening: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const MicButton: React.FC<MicButtonProps> = ({ isListening, onClick, disabled = false }) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Pulse 1 */}
      {isListening && (
        <span className="absolute inline-flex h-20 w-20 animate-ping rounded-full bg-cyan-500/20 opacity-75"></span>
      )}
      
      {/* Outer Pulse 2 */}
      {isListening && (
        <span className="absolute inline-flex h-16 w-16 animate-pulse rounded-full bg-indigo-500/30"></span>
      )}

      {/* Main Button */}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full transition-all duration-300 shadow-xl border cursor-pointer active:scale-95 ${
          isListening
            ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 border-cyan-400 text-white shadow-cyan-500/30'
            : 'bg-[#0f172a] hover:bg-[#1e293b] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 shadow-black/40'
        } ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
      >
        {isListening ? (
          <Mic className="h-6 w-6 animate-pulse" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </button>
    </div>
  );
};
