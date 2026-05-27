import React, { useState, useEffect } from 'react';
import { Sparkles, X, Mic, Volume2, Play, RefreshCw, VolumeX, ShieldAlert } from 'lucide-react';
import { api } from '../api';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { MicButton } from './MicButton';
import { VoiceWave } from './VoiceWave';
import { TranscriptPanel } from './TranscriptPanel';
import toast from 'react-hot-toast';

interface VoiceAssistantProps {
  setPrompt: (prompt: string) => void;
  animateSQLChange: (sql: string) => void;
  handleExecuteSQL: (sqlOverride?: string) => Promise<any>;
  serverStatus: string;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  setPrompt,
  animateSQLChange,
  handleExecuteSQL,
  serverStatus,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const [autoExecute, setAutoExecute] = useState(true);
  const [voiceResponse, setVoiceResponse] = useState(true);
  const [isCompiling, setIsCompiling] = useState(false);

  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
    error: speechError,
  } = useSpeechRecognition();

  // Watch for speech recognition errors and display a toast
  useEffect(() => {
    if (speechError) {
      toast.error(speechError, {
        style: { background: '#111827', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }
      });
    }
  }, [speechError]);

  // Voice player helper using SpeechSynthesis API
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    try {
      window.speechSynthesis.cancel(); // Stop current speech before playing
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Locate standard neural or English/Hindi/Marathi voices
      const voices = window.speechSynthesis.getVoices();
      
      let voiceLang = 'en';
      if (language === 'hi-IN') voiceLang = 'hi';
      if (language === 'mr-IN') voiceLang = 'mr';

      const selectedVoice = voices.find(v => v.lang.startsWith(voiceLang)) || 
                            voices.find(v => v.lang.startsWith('en')) || 
                            voices[0];

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Pre-load voices on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const handleMicToggle = () => {
    if (!isSupported) {
      toast.error('Voice Assistant is not supported in this browser. Please use Chrome, Edge, or Safari.', {
        style: { background: '#111827', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }
      });
      return;
    }

    if (isListening) {
      stopListening();
      speakText('Processing spoken command.');
    } else {
      resetTranscript();
      startListening(language);
      speakText('Voice channel open. I am listening.');
    }
  };

  const handleCompileVoiceQuery = async () => {
    const queryText = transcript.trim();
    if (!queryText) {
      toast.error('Speak first to record a query transcript!', {
        style: { background: '#111827', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }
      });
      return;
    }

    setIsCompiling(true);
    const toastId = toast.loading('Compiling voice prompt into SQL...', {
      style: { background: '#111827', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.15)' }
    });

    try {
      // Execute route with authenticated token handling via api axios interceptor
      const response = await api.post('/voice-query', {
        voice_text: queryText,
      });

      const { processed_prompt, generated_sql, explanation } = response.data;

      // 1. Populate the UI prompt card
      setPrompt(processed_prompt);
      
      // 2. Animate typing inside Monaco
      animateSQLChange(generated_sql);
      
      toast.success('SQL compiled successfully!', {
        id: toastId,
        style: { background: '#111827', color: '#10b981', border: '1px solid rgba(16,185,129,0.15)' }
      });

      // 3. Hands-free execution if configured
      if (autoExecute) {
        setTimeout(async () => {
          try {
            await handleExecuteSQL(generated_sql);
            if (voiceResponse) {
              speakText(`SQL compiled and executed successfully! Here is the explanation: ${explanation}`);
            } else {
              speakText('SQL executed successfully.');
            }
          } catch (execErr: any) {
            console.error('Hands free execution error:', execErr);
            speakText('SQL generation completed, but database execution failed. Please verify syntax.');
          }
        }, 800);
      } else {
        if (voiceResponse) {
          speakText(`SQL generated inside workspace. Here is the explanation: ${explanation}`);
        } else {
          speakText('SQL query loaded into workspace editor.');
        }
      }

      resetTranscript();
    } catch (err: any) {
      console.error('Voice Assistant compilation error:', err);
      const errMsg = err.response?.data?.detail || 'Voice generation failed. Please check network quota.';
      toast.error(errMsg, {
        id: toastId,
        style: { background: '#111827', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }
      });
      speakText('Failed to compile your voice query into SQL.');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLang = e.target.value;
    setLanguage(selectedLang);
    resetTranscript();
    if (isListening) {
      stopListening();
      setTimeout(() => startListening(selectedLang), 300);
    }
    speakText(`Language changed.`);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            speakText('Nova SQL Voice Copilot active.');
          }}
          className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 border border-indigo-400 text-white shadow-xl shadow-indigo-500/25 transition-all duration-300 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-cyan-400 to-indigo-500 opacity-20 blur group-hover:opacity-40 transition duration-300"></span>
          <Mic className="h-6 w-6 relative z-10 animate-pulse-slow" />
          <span className="absolute bottom-12 right-0 whitespace-nowrap rounded-md bg-slate-900 border border-slate-800 px-2 py-1 text-[10px] uppercase font-bold tracking-widest text-indigo-400 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none select-none">
            Voice Copilot
          </span>
        </button>
      )}

      {/* Futuristic Glassmorphic Panel Drawer */}
      {isOpen && (
        <div className="w-[340px] glass-panel border border-indigo-500/20 rounded-2xl shadow-2xl overflow-hidden bg-[#0a0f1d]/90 backdrop-blur-xl animate-fade-in p-4 relative space-y-4">
          
          {/* Panel Header */}
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-ping"></div>
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase text-slate-200">Voice SQL Copilot</span>
            </div>
            
            <button
              onClick={() => {
                if (isListening) stopListening();
                setIsOpen(false);
                if (typeof window !== 'undefined' && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
              }}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-350 hover:bg-slate-900/60 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Offline Indicator Alert */}
          {serverStatus === 'offline' && (
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-red-950 bg-red-950/20 text-red-400 text-[11px]">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold uppercase tracking-wider block mb-0.5">Backend Offline</span>
                Voice SQL processing will be disabled. Check your local API server.
              </div>
            </div>
          )}

          {/* Browser Unsupport Banner */}
          {!isSupported && (
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-amber-950 bg-amber-950/20 text-amber-400 text-[11px]">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold uppercase tracking-wider block mb-0.5">Browser Unsupported</span>
                SpeechRecognition APIs are unavailable. Please open in Google Chrome or Microsoft Edge.
              </div>
            </div>
          )}

          {/* Voice Wave Visualizer */}
          <VoiceWave isListening={isListening} />

          {/* Central Controls Ring */}
          <div className="flex items-center justify-center py-2 relative">
            <MicButton
              isListening={isListening}
              onClick={handleMicToggle}
              disabled={serverStatus === 'offline' || !isSupported}
            />
          </div>

          {/* Real-time Transcription Board */}
          <TranscriptPanel
            transcript={transcript}
            interimTranscript={interimTranscript}
            setTranscript={setTranscript}
            isListening={isListening}
          />

          {/* Control Options Deck */}
          <div className="border-t border-slate-900 pt-3 space-y-3">
            
            {/* Language Selector */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold">Voice Input Locale</span>
              <select
                value={language}
                onChange={handleLanguageChange}
                disabled={!isSupported}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 focus:outline-none text-[11px] font-semibold"
              >
                <option value="en-US">English (US)</option>
                <option value="hi-IN">Hindi (हिन्दी)</option>
                <option value="mr-IN">Marathi (मराठी)</option>
              </select>
            </div>

            {/* Auto Execute Switch */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                Hands-Free Execution
              </span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoExecute}
                  onChange={(e) => setAutoExecute(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-slate-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-slate-100"></div>
              </label>
            </div>

            {/* Voice Response Switch */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold flex items-center gap-1.5">
                {voiceResponse ? <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                Voice Confirmation (TTS)
              </span>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={voiceResponse}
                  onChange={(e) => setVoiceResponse(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-slate-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-slate-100"></div>
              </label>
            </div>

          </div>

          {/* Direct Compilation Trigger deck */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
            <button
              onClick={() => {
                resetTranscript();
                speakText('Transcript cleared.');
              }}
              disabled={isCompiling || !transcript.trim()}
              className="flex-1 py-2 text-[10px] font-bold tracking-widest uppercase border border-slate-800 bg-slate-900/40 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl transition-all disabled:opacity-40 cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={handleCompileVoiceQuery}
              disabled={isCompiling || !transcript.trim() || serverStatus === 'offline'}
              className="flex-2 py-2 text-[10px] font-bold tracking-widest uppercase bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isCompiling ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Compile SQL
                </>
              )}
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
