import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  Play, 
  Sparkles, 
  Copy, 
  Check, 
  AlertCircle, 
  Terminal, 
  FileCode, 
  Bookmark, 
  FileSpreadsheet, 
  Download, 
  Lightbulb, 
  BarChart2
} from 'lucide-react';
import { apiService, api } from '../api';
import type { QueryHistoryItem, TableSchema, SQLResult, SavedQueryItem } from '../api';
import toast, { Toaster } from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { UploadModal } from '../components/UploadModal';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Backend State
  const [prompt, setPrompt] = useState('');
  const [sql, setSql] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [sqlResult, setSqlResult] = useState<SQLResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [isSchemaLoading, setIsSchemaLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<'online' | 'offline'>('offline');

  // Saved Queries System State
  const [savedQueries, setSavedQueries] = useState<SavedQueryItem[]>([]);
  const [isSavedQueriesLoading, setIsSavedQueriesLoading] = useState(false);
  const [savedSearch, setSavedSearch] = useState('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveQueryTitle, setSaveQueryTitle] = useState('');

  // AI Copilot States
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [aiFixExplanation, setAiFixExplanation] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);

  // Results Tab States
  const [resultsTab, setResultsTab] = useState<'table' | 'chart'>('table');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [chartXKey, setChartXKey] = useState('');
  const [chartYKey, setChartYKey] = useState('');

  // UI Interactive State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'schema' | 'history' | 'saved'>('schema');
  const [schemaSearch, setSchemaSearch] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [copiedCode, setCopiedCode] = useState(false);

  // Query History Search & Filters
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'success' | 'failure'>('all');
  
  // Custom typing effect control
  const [isTyping, setIsTyping] = useState(false);
  const [displayedSql, setDisplayedSql] = useState('');

  // Wrapper for toast to redirect standard calls to react-hot-toast beautifully
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (type === 'success') {
      toast.success(message, {
        style: { background: '#111827', color: '#10b981', border: '1px solid rgba(16,185,129,0.15)' }
      });
    } else if (type === 'error') {
      toast.error(message, {
        style: { background: '#111827', color: '#ef4444', border: '1px solid rgba(239,68,68,0.15)' }
      });
    } else {
      toast(message, {
        icon: 'ℹ️',
        style: { background: '#111827', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.15)' }
      });
    }
  };

  // Perform initial load & server ping
  useEffect(() => {
    checkServerConnection();
    loadSchema();
    loadHistory();
    loadSavedQueries();
  }, [user]); // Re-fetch scoped metrics when user logs in

  // Check connection to FastAPI backend using Axios (which includes CORS handling)
  const checkServerConnection = async () => {
    try {
      const response = await api.get('/');
      if (response.status === 200) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch (err) {
      setServerStatus('offline');
    }
  };

  // Load database structures
  const loadSchema = async () => {
    setIsSchemaLoading(true);
    try {
      const data = await apiService.getDatabaseSchema();
      setSchema(data);
      // Auto expand all tables by default
      const expandMap: Record<string, boolean> = {};
      data.forEach(t => {
        expandMap[t.table_name] = true;
      });
      setExpandedTables(expandMap);
    } catch (err) {
      console.error("Failed to load database schema:", err);
    } finally {
      setIsSchemaLoading(false);
    }
  };

  // Load prior SQL queries from DB
  const loadHistory = async () => {
    try {
      const data = await apiService.getQueryHistory();
      setHistory(data); // Already sorted desc by backend (most recent first)
    } catch (err) {
      console.error("Failed to load queries history:", err);
    }
  };

  // Load Saved Query Templates
  const loadSavedQueries = async () => {
    setIsSavedQueriesLoading(true);
    try {
      const data = await apiService.getSavedQueries();
      setSavedQueries(data);
    } catch (err) {
      console.error("Failed to load saved queries:", err);
    } finally {
      setIsSavedQueriesLoading(false);
    }
  };

  // Toggle table node expansions in explorer tree
  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableName]: !prev[tableName]
    }));
  };

  // Click handler to load custom historical items
  const selectHistoryItem = (item: QueryHistoryItem) => {
    setPrompt(item.user_prompt || '');
    animateSQLChange(item.generated_sql);
    showToast("Loaded query from history!", "info");
  };

  // Click handler to load template item
  const selectSavedQuery = (item: SavedQueryItem) => {
    animateSQLChange(item.query);
    showToast("Loaded query template!", "info");
  };

  // Save new query template
  const handleSaveSavedQuery = async () => {
    const activeSql = isTyping ? sql : displayedSql || sql;
    if (!activeSql.trim()) {
      showToast("Cannot save empty query.", "error");
      return;
    }
    if (!saveQueryTitle.trim()) {
      showToast("Please enter a title for this template.", "error");
      return;
    }

    const toastId = toast.loading("Saving query template...");
    try {
      const newSaved = await apiService.saveSavedQuery(saveQueryTitle, activeSql);
      setSavedQueries(prev => [newSaved, ...prev]);
      setSaveQueryTitle('');
      setIsSaveModalOpen(false);
      toast.success("Query template saved successfully!", { id: toastId });
    } catch (err) {
      console.error("Failed to save template:", err);
      toast.error("Failed to save template query.", { id: toastId });
    }
  };

  // Delete saved query template
  const handleDeleteSavedQuery = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this query template?")) return;

    const toastId = toast.loading("Deleting template...");
    try {
      await apiService.deleteSavedQuery(id);
      setSavedQueries(prev => prev.filter(q => q.id !== id));
      toast.success("Saved query deleted successfully!", { id: toastId });
    } catch (err) {
      console.error("Failed to delete template:", err);
      toast.error("Failed to delete query template.", { id: toastId });
    }
  };

  // AI Explanation handler
  const handleExplainQuery = async () => {
    const activeSql = isTyping ? sql : displayedSql || sql;
    if (!activeSql.trim()) {
      showToast("Please enter or generate a query to explain.", "error");
      return;
    }

    setIsExplaining(true);
    setAiExplanation(null);
    const toastId = toast.loading("Analyzing query with AI...");
    try {
      const response = await apiService.explainQuery(activeSql);
      setAiExplanation(response.explanation);
      toast.success("Explanation ready below editor!", { id: toastId });
    } catch (err: any) {
      console.error("AI Explain error:", err);
      const errMsg = err.response?.data?.detail || "AI failed to explain query.";
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsExplaining(false);
    }
  };

  // AI SQL Error Fixing handler
  const handleFixQuery = async () => {
    const activeSql = isTyping ? sql : displayedSql || sql;
    if (!activeSql.trim()) {
      showToast("Please enter or generate a query to debug.", "error");
      return;
    }

    setIsFixing(true);
    setAiFixExplanation(null);
    const toastId = toast.loading("Debugging query with AI...");
    try {
      const response = await apiService.fixQuery(activeSql);
      if (response.fixed_sql !== activeSql) {
        animateSQLChange(response.fixed_sql);
        setAiFixExplanation(response.explanation);
        toast.success("SQL auto-corrected and mistakes annotated!", { id: toastId });
      } else {
        setAiFixExplanation("Query is already structurally sound!");
        toast.success("No syntax errors found. SQL is clean!", { id: toastId });
      }
    } catch (err: any) {
      console.error("AI Fix error:", err);
      const errMsg = err.response?.data?.detail || "AI failed to fix query.";
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsFixing(false);
    }
  };

  // Export results CSV
  const handleExportCSV = () => {
    if (!sqlResult || !sqlResult.data || sqlResult.data.length === 0) {
      showToast("No data available to export.", "error");
      return;
    }
    const cols = sqlResult.columns || Object.keys(sqlResult.data[0]);
    const csvRows = [];
    csvRows.push(cols.join(','));

    for (const row of sqlResult.data) {
      const values = cols.map(col => {
        const val = row[col];
        const valStr = val === null ? 'NULL' : String(val);
        const escaped = ('' + valStr).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `novasql_csv_${Date.now()}.csv`);
    showToast("Exported CSV successfully!", "success");
  };

  // Export results Excel
  const handleExportExcel = () => {
    if (!sqlResult || !sqlResult.data || sqlResult.data.length === 0) {
      showToast("No data available to export.", "error");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(sqlResult.data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Query Results");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, `novasql_excel_${Date.now()}.xlsx`);
    showToast("Exported Excel spreadsheet!", "success");
  };

  // Copy JSON results
  const handleCopyJSON = () => {
    if (!sqlResult || !sqlResult.data || sqlResult.data.length === 0) {
      showToast("No data available to copy.", "error");
      return;
    }
    navigator.clipboard.writeText(JSON.stringify(sqlResult.data, null, 2));
    showToast("Copied JSON results to clipboard!", "success");
  };

  // Delete a specific query from history
  const handleDeleteQuery = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering selectHistoryItem
    if (!window.confirm("Are you sure you want to delete this query?")) return;

    try {
      await apiService.deleteQuery(id);
      setHistory(prev => prev.filter(item => item.id !== id));
      showToast("Query deleted successfully!", "success");
    } catch (err) {
      console.error("Failed to delete query:", err);
      showToast("Failed to delete query.", "error");
    }
  };

  // Delete all query history
  const handleDeleteAllQueries = async () => {
    if (!window.confirm("Are you sure you want to clear your entire query history? This cannot be undone.")) return;

    try {
      await apiService.deleteAllQueries();
      setHistory([]);
      showToast("All query history cleared!", "success");
    } catch (err) {
      console.error("Failed to clear query history:", err);
      showToast("Failed to clear query history.", "error");
    }
  };

  // Play custom animated character typing effect on SQL change
  const animateSQLChange = (targetSql: string) => {
    setIsTyping(true);
    setDisplayedSql('');
    let currentIdx = 0;
    const typingInterval = 10; // milliseconds per character
    
    // Set final query immediately in main storage so run works, but display it sequentially
    setSql(targetSql);

    const timer = setInterval(() => {
      if (currentIdx < targetSql.length) {
        const char = targetSql.charAt(currentIdx);
        setDisplayedSql(prev => prev + char);
        currentIdx++;
      } else {
        clearInterval(timer);
        setIsTyping(false);
      }
    }, typingInterval);
  };

  // Run NLP prompt generation through backend
  const handleGenerateSQL = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setSqlResult(null);
    try {
      const result = await apiService.generateSQL(prompt);
      animateSQLChange(result.generated_sql);
      showToast("SQL generated successfully!", "success");
      // Reload history as the backend saved it to DB
      await loadHistory();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Could not reach Gemini service. Please check backend log.";
      setError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Execute direct SQL in query panel
  const handleExecuteSQL = async (sqlOverride?: string) => {
    const activeSql = sqlOverride || (isTyping ? sql : displayedSql || sql);
    if (!activeSql.trim()) return;

    setIsExecuting(true);
    setError(null);
    setSqlResult(null);
    try {
      const response = await apiService.executeSQL(activeSql);
      setSqlResult(response);
      
      if (response.message) {
        showToast(response.message, "success");
      } else if (response.data) {
        showToast(`Successfully returned ${response.data.length} rows!`, "success");
      }
      
      // Update tables in schema if an INSERT/CREATE occurred
      await loadSchema();
      await loadHistory(); // Reload history logs with active execution entry
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Database Execution Error. Check query syntax.";
      setError(errMsg);
      showToast(errMsg, "error");
      await loadHistory(); // Reload even on error to render red indicator in history log
    } finally {
      setIsExecuting(false);
    }
  };

  // Copy code to user system clipboard
  const handleCopyCode = () => {
    const activeSql = displayedSql || sql;
    navigator.clipboard.writeText(activeSql);
    setCopiedCode(true);
    showToast("Copied SQL query to clipboard!", "success");
    setTimeout(() => {
      setCopiedCode(false);
    }, 2000);
  };

  // Filter schema explorer entries based on search input
  const filteredSchema = schema.filter(t => {
    const tableMatches = t.table_name.toLowerCase().includes(schemaSearch.toLowerCase());
    const columnMatches = t.columns.some(c => 
      c.column_name.toLowerCase().includes(schemaSearch.toLowerCase()) || 
      c.data_type.toLowerCase().includes(schemaSearch.toLowerCase())
    );
    return tableMatches || columnMatches;
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden text-slate-100 relative bg-[#0b0f19]">
      <ResultsWatcher 
        sqlResult={sqlResult} 
        setChartXKey={setChartXKey} 
        setChartYKey={setChartYKey} 
        setResultsTab={setResultsTab} 
      />

      {/* Extracted left sidebar containing schema trees and histories */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        schemaSearch={schemaSearch}
        setSchemaSearch={setSchemaSearch}
        isSchemaLoading={isSchemaLoading}
        filteredSchema={filteredSchema}
        expandedTables={expandedTables}
        toggleTable={toggleTable}
        historySearch={historySearch}
        setHistorySearch={setHistorySearch}
        historyFilter={historyFilter}
        setHistoryFilter={setHistoryFilter}
        history={history}
        handleDeleteAllQueries={handleDeleteAllQueries}
        handleDeleteQuery={handleDeleteQuery}
        selectHistoryItem={selectHistoryItem}
        savedQueries={savedQueries}
        isSavedQueriesLoading={isSavedQueriesLoading}
        savedSearch={savedSearch}
        setSavedSearch={setSavedSearch}
        selectSavedQuery={selectSavedQuery}
        handleDeleteSavedQuery={handleDeleteSavedQuery}
        loadSchema={loadSchema}
      />

      {/* Sidebar Close indicator toggle */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-5 left-4 z-40 p-2 rounded-xl border border-slate-800 bg-[#0d1321] hover:bg-slate-800 hover:text-white transition-all shadow-xl cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* CENTER WORKSPACE SECTION: Prompt generator, Code Editor, Results console */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#070b13] relative">
        {/* Extracted Top Header Workspace */}
        <Navbar 
          serverStatus={serverStatus} 
          sidebarOpen={sidebarOpen}
          onRefresh={() => {
            checkServerConnection();
            loadSchema();
            loadHistory();
            loadSavedQueries();
            showToast("Refreshed workspace structures!", "info");
          }} 
          onImportClick={() => setIsUploadModalOpen(true)}
        />

        {/* WORKSPACE CONTENT PANELS */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-custom">

          {/* PANEL 1: AI Prompt Input (Natural Language to SQL) */}
          <section className="glass-panel rounded-2xl p-5 relative overflow-hidden scanner-effect">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold tracking-wider text-slate-200">AI SQL Prompter</h2>
            </div>
            
            <form onSubmit={handleGenerateSQL} className="space-y-4">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Find the top 5 query history entries ordered by creation date..."
                  className="w-full min-h-[90px] p-4 text-sm text-slate-200 rounded-xl glass-input placeholder-slate-650 focus:outline-none resize-y font-sans font-medium"
                  disabled={isGenerating}
                />
                
                {isGenerating && (
                  <div className="absolute inset-0 bg-slate-950/60 rounded-xl flex items-center justify-center backdrop-blur-xs">
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-8 h-8 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <Sparkles className="w-3.5 h-3.5 text-purple-400 absolute animate-pulse-slow" />
                      </div>
                      <span className="text-xs font-semibold text-indigo-300 tracking-widest animate-pulse">
                        GENERATING CODE...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5 select-none">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  Gemini-powered code generator
                </span>
                <button
                  type="submit"
                  disabled={isGenerating || !prompt.trim() || serverStatus === 'offline'}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 font-bold text-xs tracking-wider text-white shadow-xl shadow-indigo-600/10 hover:shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 shiny-hover cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate SQL
                </button>
              </div>
            </form>
          </section>

          {/* PANEL 2: Active SQL Editor Workspace */}
          <section className="glass-panel rounded-2xl p-5 flex flex-col relative">
            <div className="flex items-center justify-between mb-3.5 border-b border-slate-800/20 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold tracking-wider text-slate-200">SQL Code Editor</h2>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const activeSql = displayedSql || sql;
                    if (!activeSql.trim()) {
                      showToast("Write some SQL first before saving!", "error");
                      return;
                    }
                    setIsSaveModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800/80 bg-slate-900/10 hover:bg-slate-850 hover:text-indigo-400 transition-all text-xs font-semibold text-slate-300 cursor-pointer"
                  title="Save query as template"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  Save Template
                </button>

                <button
                  onClick={handleCopyCode}
                  disabled={!(displayedSql || sql)}
                  className="p-1.5 rounded-lg border border-slate-800/80 bg-slate-900/10 hover:bg-slate-850 hover:text-white transition-all text-slate-400 disabled:opacity-40 cursor-pointer"
                  title="Copy SQL to clipboard"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="border border-slate-850 rounded-xl overflow-hidden bg-[#070b13] p-1 h-[170px] relative z-10">
              <Editor
                height="100%"
                language="sql"
                theme="vs-dark"
                value={displayedSql || sql}
                onChange={(value) => {
                  setDisplayedSql(''); // Clear custom typed array once typing manually
                  setSql(value || '');
                }}
                loading={
                  <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                    Loading Code Workspace...
                  </div>
                }
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  fontFamily: 'JetBrains Mono, Fira Code, monospace',
                  padding: { top: 12, bottom: 12 },
                  cursorBlinking: 'smooth',
                  scrollbar: {
                    verticalScrollbarSize: 6,
                    horizontalScrollbarSize: 6
                  }
                }}
              />
            </div>

            {/* AI Copilot & Run Query Buttons Toolbar */}
            <div className="flex flex-wrap items-center justify-between mt-4 gap-3">
              <div className="flex gap-2">
                <button
                  onClick={handleExplainQuery}
                  disabled={isExplaining || isFixing || !(displayedSql || sql).trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/20 hover:bg-indigo-950/20 hover:text-indigo-300 hover:border-indigo-900/60 font-semibold text-xs tracking-wider transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  {isExplaining ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                      Explaining...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-3.5 h-3.5" />
                      Explain Query
                    </>
                  )}
                </button>

                <button
                  onClick={handleFixQuery}
                  disabled={isFixing || isExplaining || !(displayedSql || sql).trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/20 hover:bg-purple-950/20 hover:text-purple-300 hover:border-purple-900/60 font-semibold text-xs tracking-wider transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  {isFixing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                      Fixing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Fix Query
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => handleExecuteSQL()}
                disabled={isExecuting || isTyping || !(displayedSql || sql).trim() || serverStatus === 'offline'}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 font-bold text-xs tracking-wider text-white shadow-lg shadow-emerald-950/25 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 cursor-pointer"
              >
                {isExecuting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Run Query
                  </>
                )}
              </button>
            </div>

            {/* AI Response Card */}
            {(aiExplanation || aiFixExplanation) && (
              <div className="mt-4 p-4 border rounded-xl animate-row-stagger bg-indigo-950/5 border-indigo-900/40 relative">
                <button
                  onClick={() => {
                    setAiExplanation(null);
                    setAiFixExplanation(null);
                  }}
                  className="absolute top-3 right-3 text-slate-500 hover:text-slate-300 text-xs font-bold cursor-pointer bg-slate-900/20 px-2 py-0.5 rounded"
                >
                  Dismiss
                </button>

                {aiExplanation && (
                  <div>
                    <div className="flex items-center gap-2 text-indigo-400 mb-2">
                      <Lightbulb className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-widest">AI Query Explanation</h4>
                    </div>
                    <p className="text-xs text-slate-300 font-sans leading-5 whitespace-pre-line pr-10 select-text">
                      {aiExplanation}
                    </p>
                  </div>
                )}

                {aiFixExplanation && (
                  <div>
                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                      <Sparkles className="w-4 h-4" />
                      <h4 className="text-xs font-bold uppercase tracking-widest">AI Debugging Insights</h4>
                    </div>
                    <p className="text-xs text-slate-300 font-sans leading-5 whitespace-pre-line pr-10 select-text">
                      {aiFixExplanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* PANEL 3: SQL Output Console / Database Results */}
          <section className="glass-panel rounded-2xl p-5 min-h-[260px] flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-800/30 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold tracking-wider text-slate-200">Execution Results</h2>
              </div>

              {sqlResult && sqlResult.data && sqlResult.data.length > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-slate-800/50 p-0.5 bg-slate-950/40 text-[11px] font-semibold text-slate-400">
                  <button
                    onClick={() => setResultsTab('table')}
                    className={`py-1 px-3 rounded-md transition-all cursor-pointer ${
                      resultsTab === 'table'
                        ? 'bg-slate-800 text-slate-200 shadow-sm'
                        : 'hover:text-slate-200'
                    }`}
                  >
                    Data Table
                  </button>
                  <button
                    onClick={() => setResultsTab('chart')}
                    className={`py-1 px-3 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                      resultsTab === 'chart'
                        ? 'bg-indigo-950/60 text-indigo-400 border border-indigo-900/50 shadow-sm'
                        : 'hover:text-slate-200'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    Analytics Chart
                  </button>
                </div>
              )}
              
              {sqlResult && (
                <div className="flex items-center gap-2">
                  {sqlResult.data && (
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-900/60 border border-slate-800/40 px-2 py-1 rounded select-none">
                      {sqlResult.data.length} records
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-900/60 border border-slate-800/40 px-2 py-1 rounded select-none">
                    Success
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-center">
              {isExecuting ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-slate-400 font-mono tracking-widest animate-pulse">
                    EXECUTING SQL QUERY...
                  </p>
                </div>
              ) : error ? (
                <div className="p-4 border border-rose-500/25 bg-rose-500/5 rounded-xl flex items-start gap-3.5 animate-row-stagger">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-rose-300 mb-1">Execution Failure</h3>
                    <p className="text-xs text-rose-400/90 font-mono select-text leading-5">{error}</p>
                  </div>
                </div>
              ) : sqlResult ? (
                <div className="animate-row-stagger flex-1 flex flex-col">
                  {sqlResult.message ? (
                    <div className="p-4 border border-indigo-500/20 bg-indigo-600/5 rounded-xl flex items-center gap-3">
                      <Check className="w-5 h-5 text-indigo-400" />
                      <div>
                        <p className="text-xs text-slate-300 font-semibold">{sqlResult.message}</p>
                        {sqlResult.row_count !== undefined && (
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                            Affected row count: {sqlResult.row_count}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : sqlResult.columns && sqlResult.data && sqlResult.data.length > 0 ? (
                    resultsTab === 'table' ? (
                      <div className="space-y-4">
                        {/* Exports Toolbar */}
                        <div className="flex flex-wrap gap-2 justify-end bg-slate-900/10 p-2 border border-slate-800/40 rounded-xl">
                          <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-850 hover:text-emerald-400 text-[11px] font-semibold text-slate-300 transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            CSV Export
                          </button>
                          <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-850 hover:text-indigo-400 text-[11px] font-semibold text-slate-300 transition-all cursor-pointer"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            Excel Export
                          </button>
                          <button
                            onClick={handleCopyJSON}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-850 hover:text-cyan-400 text-[11px] font-semibold text-slate-300 transition-all cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy JSON
                          </button>
                        </div>

                        {/* Structured Query Tabular Output */}
                        <div className="overflow-x-auto border border-slate-800/40 rounded-xl bg-slate-950/30 max-h-[350px]">
                          <table className="w-full text-left border-collapse font-mono text-xs">
                            <thead>
                              <tr className="border-b border-slate-850 bg-slate-900/40 text-slate-400">
                                <th className="py-2.5 px-4 font-bold border-r border-slate-800/30">#</th>
                                {sqlResult.columns.map((col) => (
                                  <th key={col} className="py-2.5 px-4 font-bold tracking-wider border-r border-slate-800/30 last:border-0 uppercase text-[10px]">
                                    {col}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-850">
                              {sqlResult.data.map((row, rowIdx) => (
                                <tr 
                                  key={rowIdx} 
                                  className="hover:bg-slate-800/20 transition-colors animate-row-stagger"
                                  style={{ animationDelay: `${rowIdx * 0.02}s` }}
                                >
                                  <td className="py-2 px-4 text-slate-600 border-r border-slate-800/30 font-bold select-none">{rowIdx + 1}</td>
                                  {sqlResult.columns!.map((col) => (
                                    <td key={col} className="py-2 px-4 text-slate-300 border-r border-slate-800/30 last:border-0 truncate max-w-[200px] select-text" title={String(row[col])}>
                                      {row[col] === null ? <span className="text-slate-600 italic">null</span> : String(row[col])}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      /* Recharts Analytics Chart Tab View */
                      <div className="space-y-4 animate-row-stagger">
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/25 p-3 border border-slate-850 rounded-xl text-xs">
                          <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Chart Type</span>
                              <div className="flex rounded-lg border border-slate-850 p-0.5 bg-slate-950/45 text-[10px] font-semibold text-slate-400">
                                <button
                                  onClick={() => setChartType('bar')}
                                  className={`py-1 px-3 rounded-md transition-all cursor-pointer ${
                                    chartType === 'bar' ? 'bg-slate-800 text-slate-200 shadow-xs' : 'hover:text-slate-200'
                                  }`}
                                >
                                  Bar
                                </button>
                                <button
                                  onClick={() => setChartType('line')}
                                  className={`py-1 px-3 rounded-md transition-all cursor-pointer ${
                                    chartType === 'line' ? 'bg-slate-800 text-slate-200 shadow-xs' : 'hover:text-slate-200'
                                  }`}
                                >
                                  Line
                                </button>
                                <button
                                  onClick={() => setChartType('pie')}
                                  className={`py-1 px-3 rounded-md transition-all cursor-pointer ${
                                    chartType === 'pie' ? 'bg-slate-800 text-slate-200 shadow-xs' : 'hover:text-slate-200'
                                  }`}
                                >
                                  Pie
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">X-Axis Label</span>
                              <select
                                value={chartXKey}
                                onChange={(e) => setChartXKey(e.target.value)}
                                className="bg-slate-950 border border-slate-850 px-2 py-1 rounded text-slate-350 font-mono text-[11px] focus:outline-none"
                              >
                                {sqlResult.columns.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>

                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Y-Axis Value (Numeric)</span>
                              <select
                                value={chartYKey}
                                onChange={(e) => setChartYKey(e.target.value)}
                                className="bg-slate-950 border border-slate-850 px-2 py-1 rounded text-slate-350 font-mono text-[11px] focus:outline-none"
                              >
                                {sqlResult.columns.map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Recharts Render Container */}
                        <div className="h-[280px] w-full p-4 border border-slate-850 rounded-xl bg-slate-950/20 flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'bar' ? (
                              <BarChart data={sqlResult.data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey={chartXKey} stroke="#9ca3af" fontSize={10} tickLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0d1321', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12 }} 
                                  labelStyle={{ color: '#818cf8', fontWeight: 'bold' }} 
                                />
                                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                                <Bar dataKey={chartYKey} name={chartYKey.toUpperCase()} radius={[4, 4, 0, 0]}>
                                  {sqlResult.data.map((_, idx) => (
                                    <Cell key={`cell-${idx}`} fill={['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'][idx % 7]} />
                                  ))}
                                </Bar>
                              </BarChart>
                            ) : chartType === 'line' ? (
                              <LineChart data={sqlResult.data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey={chartXKey} stroke="#9ca3af" fontSize={10} tickLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0d1321', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12 }} 
                                />
                                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                                <Line type="monotone" dataKey={chartYKey} name={chartYKey.toUpperCase()} stroke="#6366f1" strokeWidth={2.5} activeDot={{ r: 6 }} />
                              </LineChart>
                            ) : (
                              <PieChart>
                                <Pie
                                  data={sqlResult.data}
                                  dataKey={chartYKey}
                                  nameKey={chartXKey}
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={75}
                                  label={({ name, percent }) => `${name} (${percent !== undefined ? (percent * 100).toFixed(0) : '0'}%)`}
                                  fontSize={9}
                                  stroke="rgba(255,255,255,0.05)"
                                  strokeWidth={1}
                                >
                                  {sqlResult.data.map((_, idx) => (
                                    <Cell key={`cell-${idx}`} fill={['#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'][idx % 7]} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0d1321', borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12 }} 
                                />
                              </PieChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12">
                      <Terminal className="w-8 h-8 text-slate-700 mx-auto mb-2.5" />
                      <p className="text-xs text-slate-450 font-medium">Query executed successfully, but returned 0 records.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Terminal className="w-8 h-8 text-slate-700 mx-auto mb-2.5" />
                  <p className="text-xs text-slate-500 font-medium leading-5">
                    Run an SQL query above to see execution records and data results console log.
                  </p>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>

      {/* Floating Save Query Modal Panel Overlay */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-row-stagger">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-4">
              Save Query Template
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-sans leading-relaxed">
              Provide a memorable title for this SQL query to save it to your permanent sidebar collection.
            </p>
            <input
              type="text"
              placeholder="e.g. Employee Department Salaries Count"
              value={saveQueryTitle}
              onChange={(e) => setSaveQueryTitle(e.target.value)}
              className="w-full text-xs py-2.5 px-3 rounded-lg glass-input text-slate-200 focus:outline-none mb-6 font-medium"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && saveQueryTitle.trim()) {
                  handleSaveSavedQuery();
                }
              }}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsSaveModalOpen(false);
                  setSaveQueryTitle('');
                }}
                className="px-4 py-2 rounded-xl border border-slate-800 hover:bg-slate-900 transition-all text-xs font-semibold text-slate-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSavedQuery}
                disabled={!saveQueryTitle.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* React Hot Toaster component */}
      <Toaster 
        position="top-center" 
        reverseOrder={false}
        toastOptions={{
          style: {
            fontSize: '13px',
            fontFamily: 'system-ui, sans-serif',
            padding: '12px 24px',
            borderRadius: '12px',
          }
        }}
      />

      {/* Voice AI Assistant floating widget */}
      <VoiceAssistant
        setPrompt={setPrompt}
        animateSQLChange={animateSQLChange}
        handleExecuteSQL={handleExecuteSQL}
        serverStatus={serverStatus}
      />

      {/* Smart File Import System Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onImportSuccess={() => {
          loadSchema();
        }}
      />

    </div>
  );
};

// Side Effect Hook to Auto-parse execution results and map chart candidate keys dynamically
export const ResultsWatcher = ({ sqlResult, setChartXKey, setChartYKey, setResultsTab }: any) => {
  useEffect(() => {
    if (sqlResult && sqlResult.data && sqlResult.data.length > 0 && sqlResult.columns) {
      const columns = sqlResult.columns;
      const data = sqlResult.data;

      // Filter numeric columns based on values mapping
      const numericCols = columns.filter((col: string) => {
        return data.some((row: any) => {
          const val = row[col];
          return val !== null && val !== '' && !isNaN(Number(val)) && typeof val !== 'boolean';
        });
      });

      // Filter text columns
      const textCols = columns.filter((col: string) => !numericCols.includes(col));

      if (textCols.length > 0) {
        setChartXKey(textCols[0]);
      } else if (columns.length > 0) {
        setChartXKey(columns[0]);
      }

      if (numericCols.length > 0) {
        setChartYKey(numericCols[0]);
      } else if (columns.length > 0) {
        setChartYKey(columns[columns.length - 1]);
      }

      setResultsTab('table');
    }
  }, [sqlResult]);

  return null;
};

export default Dashboard;
