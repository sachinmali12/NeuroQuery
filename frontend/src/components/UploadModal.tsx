import React, { useState, useEffect } from 'react';
import { X, Database, Sparkles, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../api';
import FileDropzone from './FileDropzone';
import FilePreviewTable from './FilePreviewTable';
import ColumnSelector, { type ColumnSetting } from './ColumnSelector';
import ImportProgress, { type ImportStep } from './ImportProgress';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

type ModalPhase = 'SELECT_FILE' | 'ANALYZING' | 'CONFIG_SCHEMA' | 'IMPORTING' | 'COMPLETED';

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [phase, setPhase] = useState<ModalPhase>('SELECT_FILE');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // File details returned from backend
  const [fileId, setFileId] = useState<string>('');
  const [originalFilename, setOriginalFilename] = useState<string>('');
  
  // Table name and validation
  const [rawTableName, setRawTableName] = useState<string>('');
  const [tableName, setTableName] = useState<string>('');
  
  // Column definitions & previews
  const [columns, setColumns] = useState<ColumnSetting[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, any>[]>([]);
  
  // Conflict handling
  const [showDuplicateConflict, setShowDuplicateConflict] = useState<boolean>(false);
  const [duplicateMessage, setDuplicateMessage] = useState<string>('');
  
  // Pipeline loading states
  const [currentStep, setCurrentStep] = useState<ImportStep>('uploading');
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [importedRowCount, setImportedRowCount] = useState<number>(0);

  // Synchronize and sanitize table name as raw input changes
  useEffect(() => {
    let sanitized = rawTableName.toLowerCase()
      .replace(/\s+/g, '_')            // Spaces to underscores
      .replace(/[^a-z0-9_]/g, '')      // Strip non-alphanumeric except underscores
      .replace(/_+/g, '_');            // Multiple underscores to single
      
    // Strip leading/trailing underscores
    sanitized = sanitized.replace(/^_+|_+$/g, '');
    
    // Ensure starts with letter
    if (sanitized && /^[0-9]/.test(sanitized)) {
      sanitized = 'tbl_' + sanitized;
    }
    
    setTableName(sanitized);
  }, [rawTableName]);

  if (!isOpen) return null;

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setPhase('ANALYZING');
    setCurrentStep('uploading');
    setPipelineError(null);
    
    try {
      // Step 1: Upload multipart file
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await api.post('/upload/upload-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { file_id, original_filename } = uploadRes.data;
      setFileId(file_id);
      setOriginalFilename(original_filename);
      
      // Step 2: Analyze and retrieve preview
      setCurrentStep('reading');
      const previewRes = await api.get('/upload/preview-file', {
        params: { file_id, original_filename }
      });
      
      const { default_table_name, columns: detectedCols, preview_data } = previewRes.data;
      
      setRawTableName(default_table_name);
      setPreviewRows(preview_data || []);
      
      // Map detected columns to state settings
      const mappedCols: ColumnSetting[] = detectedCols.map((c: any) => ({
        originalName: c.original_name,
        cleanedName: c.cleaned_name,
        type: c.detected_type as ColumnSetting['type'],
        selected: true
      }));
      setColumns(mappedCols);
      
      setPhase('CONFIG_SCHEMA');
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Failed to upload or analyze the file structure.';
      setPipelineError(msg);
      setCurrentStep('error');
      toast.error(msg);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileId('');
    setOriginalFilename('');
    setRawTableName('');
    setTableName('');
    setColumns([]);
    setPreviewRows([]);
    setPhase('SELECT_FILE');
    setPipelineError(null);
    setShowDuplicateConflict(false);
  };

  const handleStartImport = async (replaceExisting = false) => {
    const selectedCols = columns.filter(c => c.selected);
    if (selectedCols.length === 0) {
      toast.error('Please select at least one column to import.');
      return;
    }
    if (!tableName) {
      toast.error('Please enter a valid table name.');
      return;
    }

    setPhase('IMPORTING');
    setCurrentStep('creating');
    setPipelineError(null);
    setShowDuplicateConflict(false);

    try {
      // Step 3: Create Table
      const columnsPayload = selectedCols.map(c => ({
        cleaned_name: c.cleanedName,
        type: c.type
      }));

      try {
        await api.post('/upload/create-table', {
          table_name: tableName,
          columns: columnsPayload,
          replace_existing: replaceExisting
        });
      } catch (tableErr: any) {
        // Intercept duplicate table conflict
        if (tableErr.response?.status === 409) {
          const detail = tableErr.response.data.detail;
          if (detail && detail.code === 'DUPLICATE_TABLE') {
            setDuplicateMessage(detail.message);
            setShowDuplicateConflict(true);
            setPhase('CONFIG_SCHEMA');
            return;
          }
        }
        throw tableErr;
      }

      // Step 4: Import Records
      setCurrentStep('importing');
      const importPayload = selectedCols.map(c => ({
        original_name: c.originalName,
        cleaned_name: c.cleanedName,
        type: c.type
      }));

      const importRes = await api.post('/upload/import-data', {
        file_id: fileId,
        original_filename: originalFilename,
        table_name: tableName,
        selected_columns: importPayload
      });

      setImportedRowCount(importRes.data.rows_imported);
      setCurrentStep('completed');
      setPhase('COMPLETED');
      toast.success(`Table "${tableName}" imported successfully!`);
      
      // Reload parent sidebar and explorer tree schemas
      onImportSuccess();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || 'An error occurred during database table creation or loading.';
      setPipelineError(msg);
      setCurrentStep('error');
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 overflow-y-auto animate-row-stagger">
      <div 
        className="glass-panel w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-800/80 bg-[#0f1422]/95 relative"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-850 select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/15">
              <Database className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-200 tracking-wider">SMART FILE DATA IMPORT</h2>
              <p className="text-[10px] text-slate-500 font-semibold tracking-wide mt-0.5">
                LOAD CSV & EXCEL FILES INSTANTLY INTO POSTGRESQL
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-850 hover:bg-slate-800 hover:text-white transition-all text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-custom">
          {/* Main Wizard Phases */}
          {phase === 'SELECT_FILE' && (
            <div className="py-6 space-y-4">
              <div className="text-center max-w-lg mx-auto space-y-2 select-none">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest bg-indigo-500/5 px-2.5 py-1 rounded-full border border-indigo-500/10">
                  Step 1: Upload Dataset
                </span>
                <h3 className="text-base font-bold text-slate-200">
                  Select a spreadsheet file to analyze
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  We will parse your spreadsheet column structures, clean and sanitize identifiers, auto-detect data types, and prepare a relational database schema dynamically.
                </p>
              </div>

              <div className="max-w-xl mx-auto">
                <FileDropzone
                  onFileSelect={handleFileSelect}
                  selectedFile={selectedFile}
                  onClear={handleClearFile}
                />
              </div>
            </div>
          )}

          {phase === 'ANALYZING' && (
            <div className="py-12 max-w-md mx-auto">
              <ImportProgress currentStep={currentStep} errorMessage={pipelineError} />
              
              {pipelineError && (
                <div className="mt-5 text-center">
                  <button
                    onClick={handleClearFile}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-xs font-bold text-slate-350 cursor-pointer"
                  >
                    Start Over
                  </button>
                </div>
              )}
            </div>
          )}

          {phase === 'CONFIG_SCHEMA' && (
            <div className="space-y-6">
              {/* Conflict Sub-Modal Overlay (Duplicate Table Prompt) */}
              {showDuplicateConflict && (
                <div className="p-4.5 border border-rose-500/20 bg-rose-950/15 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-row-stagger">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-300">Table Collision Conflict</h4>
                      <p className="text-[11px] text-rose-400/90 font-mono mt-0.5 leading-relaxed select-text">{duplicateMessage}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleStartImport(true)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-xs font-bold text-white transition-all cursor-pointer shadow-lg shadow-rose-900/10 active:scale-95"
                    >
                      Replace Existing Table
                    </button>
                    <button
                      onClick={() => setShowDuplicateConflict(false)}
                      className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-xs font-bold text-slate-350 transition-all cursor-pointer"
                    >
                      Rename Table
                    </button>
                  </div>
                </div>
              )}

              {/* Table Name Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-900/20 border border-slate-850 p-4.5 rounded-2xl">
                <div className="space-y-1 select-none">
                  <label className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">
                    Target PostgreSQL Table Name
                  </label>
                  <p className="text-[10px] text-slate-550 leading-relaxed pr-6">
                    Must start with a letter, use lowercase, and use underscores instead of spaces. E.g. <code className="text-indigo-400">employee_records</code>.
                  </p>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={rawTableName}
                    onChange={(e) => setRawTableName(e.target.value)}
                    className="w-full text-xs font-mono py-2.5 px-4 bg-slate-950/50 border border-slate-850 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 rounded-xl text-slate-200 focus:outline-none"
                    placeholder="e.g. employee_data"
                  />
                  {tableName && tableName !== rawTableName && (
                    <p className="text-[10px] font-mono text-slate-500 select-none">
                      Mapped database table: <span className="text-indigo-400 font-semibold">{tableName}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Column selector list */}
              <ColumnSelector columns={columns} onChange={setColumns} />

              {/* Data Grid Preview */}
              <FilePreviewTable
                columns={columns.filter(c => c.selected).map(c => c.originalName)}
                previewRows={previewRows}
                tableName={tableName}
              />
            </div>
          )}

          {phase === 'IMPORTING' && (
            <div className="py-10 max-w-md mx-auto">
              <ImportProgress currentStep={currentStep} errorMessage={pipelineError} />
              
              {pipelineError && (
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => setPhase('CONFIG_SCHEMA')}
                    className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 text-xs font-bold text-slate-350 cursor-pointer"
                  >
                    Adjust Settings
                  </button>
                  <button
                    onClick={handleClearFile}
                    className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-850 hover:bg-slate-900 text-xs font-bold text-slate-500 cursor-pointer"
                  >
                    Start Over
                  </button>
                </div>
              )}
            </div>
          )}

          {phase === 'COMPLETED' && (
            <div className="py-12 text-center max-w-md mx-auto space-y-6 select-none animate-row-stagger">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/15 mx-auto">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-200 tracking-wide">
                  Dataset Imported Successfully!
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Table <span className="text-indigo-400 font-semibold">{tableName}</span> has been created.
                </p>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  Bulk insert completed! A total of <span className="text-emerald-400 font-bold font-mono">{importedRowCount}</span> records were uploaded into PostgreSQL successfully.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-indigo-300 flex items-center justify-center gap-2 select-none">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Instantly query this dataset in the editor using AI SQL!</span>
              </div>

              <div className="flex justify-center gap-3.5 pt-3">
                <button
                  onClick={() => {
                    handleClearFile();
                  }}
                  className="px-5 py-2.5 rounded-xl border border-slate-850 bg-slate-950 hover:bg-slate-900 font-bold text-xs tracking-wider text-slate-400 transition-all cursor-pointer"
                >
                  Import Another Dataset
                </button>
                <button
                  onClick={() => {
                    onClose();
                    handleClearFile();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-bold text-xs tracking-wider text-white transition-all cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  Start Querying
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        {phase === 'CONFIG_SCHEMA' && (
          <div className="flex items-center justify-between p-6 border-t border-slate-850 bg-slate-950/20 select-none">
            <button
              onClick={handleClearFile}
              className="px-4 py-2 rounded-xl border border-slate-850 hover:bg-slate-900 text-xs font-bold text-slate-400 transition-all cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => handleStartImport(false)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 font-bold text-xs tracking-wider text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-xl shadow-indigo-600/10 active:scale-95"
            >
              <span>Import to PostgreSQL</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default UploadModal;
