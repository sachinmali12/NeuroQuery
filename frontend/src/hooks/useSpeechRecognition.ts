import { useState, useEffect, useRef } from 'react';

export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: (lang?: string) => void;
  stopListening: () => void;
  resetTranscript: () => void;
  setTranscript: (text: string) => void;
  error: string | null;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let final = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      if (final) {
        setTranscript((prev) => {
          const separator = prev && !prev.endsWith(' ') ? ' ' : '';
          return prev + separator + final.trim();
        });
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error event:', event);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please enable microphone permissions in your browser.');
      } else if (event.error === 'no-speech') {
        // Safe to ignore, user just paused speaking. Keep recognition running if continuous is true.
      } else {
        setError(`Speech recognition encountered an error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.warn('Cleanup error aborting speech recognition:', e);
        }
      }
    };
  }, []);

  const startListening = (lang: string = 'en-US') => {
    if (!recognitionRef.current) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError('Speech recognition is not supported in this browser.');
        return;
      }
    }

    setError(null);
    if (recognitionRef.current) {
      recognitionRef.current.lang = lang;
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Speech recognition start exception (already running?):', e);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Speech recognition stop exception:', e);
      }
    }
  };

  const resetTranscript = () => {
    setTranscript('');
    setInterimTranscript('');
  };

  const isSupported = typeof window !== 'undefined' &&
    (!!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition);

  return {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
    error,
  };
};
