import React from 'react';
import { Terminal } from 'lucide-react';

interface TranscriptPanelProps {
  transcript: string;
  interimTranscript: string;
  setTranscript: (text: string) => void;
  isListening: boolean;
}

export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  transcript,
  interimTranscript,
  setTranscript,
  isListening,
}) => {
  const hasText = transcript.trim() || interimTranscript.trim();

  return (
    <div className="flex flex-col w-full border border-slate-800 bg-slate-950/40 rounded-xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
        <div className="flex items-center gap-1.5 text-indigo-400">
          <Terminal className="w-3.5 h-3.5" />
          <span className="text-[11px] font-bold uppercase tracking-wider">Live Voice Stream</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${isListening ? 'bg-cyan-500 animate-pulse' : 'bg-slate-700'}`}></span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest select-none">
            {isListening ? 'Listening' : 'Ready'}
          </span>
        </div>
      </div>

      <div className="relative min-h-[90px] flex flex-col justify-between">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={isListening ? 'Start speaking to record queries...' : 'Click the microphone above to speak database queries...'}
          className="w-full text-slate-200 text-xs rounded-lg bg-transparent border-0 placeholder-slate-600 focus:ring-0 focus:outline-none resize-none font-sans font-medium min-h-[70px] leading-relaxed pr-2"
        />

        {/* Interim (unfinalized) text representation overlay */}
        {isListening && interimTranscript && (
          <p className="text-slate-500 italic text-xs leading-relaxed mt-1 select-none pointer-events-none pb-2 pl-1 border-t border-slate-900/50 pt-1.5">
            {interimTranscript}
          </p>
        )}

        {!hasText && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span className="text-[11px] text-slate-650 font-semibold tracking-wider italic">
              {isListening ? 'Listening for input...' : 'No transcript recorded yet.'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
