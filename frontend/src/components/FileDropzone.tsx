import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File, AlertCircle } from 'lucide-react';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  selectedFile,
  onClear,
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`relative group border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.25)]'
              : 'border-slate-800/80 bg-slate-900/10 hover:border-slate-700 hover:bg-slate-900/20 hover:shadow-lg'
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="relative mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-slate-950/40 border border-slate-850 group-hover:scale-110 transition-transform duration-300">
            <UploadCloud
              className={`w-6 h-6 ${
                isDragActive ? 'text-indigo-400 animate-pulse' : 'text-slate-400 group-hover:text-indigo-400'
              } transition-colors`}
            />
          </div>

          <h3 className="text-sm font-bold text-slate-200 tracking-wide mb-1 text-center">
            {isDragActive ? 'Drop your dataset here...' : 'Drag & drop your dataset here'}
          </h3>
          <p className="text-xs text-slate-500 mb-3 text-center">
            or click to browse local files
          </p>

          <div className="flex gap-2 flex-wrap justify-center select-none mt-2">
            <span className="px-2.5 py-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/5 border border-indigo-500/15 rounded-md">
              .CSV
            </span>
            <span className="px-2.5 py-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/5 border border-indigo-500/15 rounded-md">
              .XLSX
            </span>
            <span className="px-2.5 py-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/5 border border-indigo-500/15 rounded-md">
              .XLS
            </span>
          </div>
        </div>
      ) : (
        <div className="relative border border-slate-800/80 bg-slate-950/20 rounded-2xl p-5 flex items-center justify-between animate-row-stagger">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/15">
              <File className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate select-text">
                {selectedFile.name}
              </p>
              <p className="text-[10px] text-slate-500 font-medium font-mono mt-0.5 select-none">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={onClear}
            className="px-3 py-1.5 rounded-lg border border-slate-850 hover:bg-rose-500/10 hover:text-rose-400 text-[10px] font-bold text-slate-400 transition-all cursor-pointer"
          >
            Change File
          </button>
        </div>
      )}

      {fileRejections.length > 0 && (
        <div className="mt-3.5 p-3 border border-rose-500/20 bg-rose-500/5 rounded-xl flex items-start gap-2.5 animate-row-stagger">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-[11px] text-rose-400 font-medium leading-relaxed select-text">
            Unsupported file format or too many files selected. Please select a single .csv, .xlsx, or .xls file.
          </div>
        </div>
      )}
    </div>
  );
};
export default FileDropzone;
