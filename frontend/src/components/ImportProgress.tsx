import React from 'react';
import { Loader2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

export type ImportStep = 'uploading' | 'reading' | 'creating' | 'importing' | 'completed' | 'error';

interface ImportProgressProps {
  currentStep: ImportStep;
  errorMessage: string | null;
}

export const ImportProgress: React.FC<ImportProgressProps> = ({ currentStep, errorMessage }) => {
  const steps = [
    { key: 'uploading', label: 'Uploading Dataset File...' },
    { key: 'reading', label: 'Analyzing & Reading Data...' },
    { key: 'creating', label: 'Generating & Creating SQL Table...' },
    { key: 'importing', label: 'Bulk Importing Records into PostgreSQL...' },
    { key: 'completed', label: 'Import Completed ✅' },
  ];

  const getStepState = (stepKey: string, idx: number) => {
    const activeIdx = steps.findIndex(s => s.key === currentStep);
    
    if (currentStep === 'completed') {
      return 'completed';
    }
    
    if (stepKey === 'completed') {
      return 'pending';
    }
    
    if (currentStep === 'error') {
      // Find the step that failed
      // Let's assume the step that is currently executing is the one that got marked as error.
      // We will track the error in the active index.
      if (idx === activeIdx - 1 || (currentStep === 'error' && idx === 3)) { // fallback
        return 'error';
      }
      return idx < 3 ? 'completed' : 'pending';
    }
    
    if (idx < activeIdx) {
      return 'completed';
    } else if (idx === activeIdx) {
      return 'active';
    } else {
      return 'pending';
    }
  };

  return (
    <div className="space-y-4 p-5 border border-indigo-500/20 bg-indigo-950/5 rounded-2xl animate-row-stagger">
      <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase select-none">
        Database Loading Pipeline
      </h3>
      
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const state = getStepState(step.key, idx);
          
          return (
            <div
              key={step.key}
              className={`flex items-center gap-3 transition-opacity duration-300 ${
                state === 'pending' ? 'opacity-35' : 'opacity-100'
              }`}
            >
              <div className="flex-shrink-0">
                {state === 'completed' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                {state === 'active' && (
                  <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                )}
                {state === 'pending' && (
                  <Circle className="w-4 h-4 text-slate-700" />
                )}
                {state === 'error' && (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
              </div>
              
              <span
                className={`text-xs font-medium font-sans ${
                  state === 'active'
                    ? 'text-indigo-300 font-semibold animate-pulse'
                    : state === 'completed'
                    ? 'text-slate-350'
                    : state === 'error'
                    ? 'text-rose-400 font-bold'
                    : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 border border-rose-500/20 bg-rose-500/5 rounded-xl flex items-start gap-2.5 animate-row-stagger">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h4 className="text-[11px] font-bold text-rose-300 uppercase tracking-wider mb-0.5">Pipeline Failure</h4>
            <p className="text-[11px] text-rose-400/90 font-mono select-text leading-relaxed break-words">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
export default ImportProgress;
