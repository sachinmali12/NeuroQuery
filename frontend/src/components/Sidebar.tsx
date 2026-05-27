import React from 'react';
import { 
  Database, 
  History, 
  ChevronLeft, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  HardDrive, 
  Trash2, 
  Bookmark 
} from 'lucide-react';
import type { QueryHistoryItem, TableSchema, SavedQueryItem } from '../api';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: 'schema' | 'history' | 'saved';
  setActiveTab: (tab: 'schema' | 'history' | 'saved') => void;
  schemaSearch: string;
  setSchemaSearch: (search: string) => void;
  isSchemaLoading: boolean;
  filteredSchema: TableSchema[];
  expandedTables: Record<string, boolean>;
  toggleTable: (tableName: string) => void;
  historySearch: string;
  setHistorySearch: (search: string) => void;
  historyFilter: 'all' | 'success' | 'failure';
  setHistoryFilter: (filter: 'all' | 'success' | 'failure') => void;
  history: QueryHistoryItem[];
  handleDeleteAllQueries: () => void;
  handleDeleteQuery: (id: number, e: React.MouseEvent) => void;
  selectHistoryItem: (item: QueryHistoryItem) => void;
  savedQueries: SavedQueryItem[];
  isSavedQueriesLoading: boolean;
  savedSearch: string;
  setSavedSearch: (search: string) => void;
  selectSavedQuery: (item: SavedQueryItem) => void;
  handleDeleteSavedQuery: (id: number, e: React.MouseEvent) => void;
  loadSchema: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
  schemaSearch,
  setSchemaSearch,
  isSchemaLoading,
  filteredSchema,
  expandedTables,
  toggleTable,
  historySearch,
  setHistorySearch,
  historyFilter,
  setHistoryFilter,
  history,
  handleDeleteAllQueries,
  handleDeleteQuery,
  selectHistoryItem,
  savedQueries,
  isSavedQueriesLoading,
  savedSearch,
  setSavedSearch,
  selectSavedQuery,
  handleDeleteSavedQuery,
  loadSchema
}) => {
  if (!sidebarOpen) return null;

  return (
    <div className="glass-panel h-full flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800/40 relative z-30 w-[340px] overflow-hidden">
      {/* Header branding */}
      <div className="p-5 flex items-center justify-between border-b border-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-wider bg-gradient-to-r from-indigo-200 to-purple-300 bg-clip-text text-transparent">
              NovaSQL
            </h1>
            <span className="text-[10px] text-indigo-400 font-semibold tracking-widest uppercase">
              AI SQL Assistant
            </span>
          </div>
        </div>
        <button 
          onClick={() => setSidebarOpen(false)}
          className="p-1.5 rounded-lg border border-slate-800/80 hover:bg-slate-800/50 hover:text-white transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Tabs */}
      <div className="flex border-b border-slate-800/20 p-3 gap-1 bg-slate-950/20">
        <button
          onClick={() => setActiveTab('schema')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'schema'
              ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/25'
              : 'text-slate-500 hover:text-slate-300 border border-transparent'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          Schema
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/25'
              : 'text-slate-500 hover:text-slate-300 border border-transparent'
          }`}
        >
          <History className="w-4 h-4" />
          History
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'saved'
              ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/25'
              : 'text-slate-500 hover:text-slate-300 border border-transparent'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Saved
        </button>
      </div>

      {/* TAB CONTENT: Schema explorer tree panel */}
      {activeTab === 'schema' && (
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tables or columns..."
              value={schemaSearch}
              onChange={(e) => setSchemaSearch(e.target.value)}
              className="w-full text-xs py-2 px-9 rounded-lg glass-input text-slate-200 focus:outline-none placeholder-slate-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-custom">
            {isSchemaLoading ? (
              <div className="space-y-3 py-4">
                <div className="h-6 w-full rounded-md shimmer-loader"></div>
                <div className="h-20 w-full rounded-md shimmer-loader"></div>
              </div>
            ) : filteredSchema.length === 0 ? (
              <div className="text-center py-10">
                <Database className="w-8 h-8 text-slate-700 mx-auto mb-2.5" />
                <p className="text-xs text-slate-500 font-medium">No schemas found.</p>
                <button 
                  onClick={loadSchema}
                  className="mt-3 text-[10px] text-indigo-400 hover:text-indigo-300 underline font-semibold"
                >
                  Refresh Schema
                </button>
              </div>
            ) : (
              filteredSchema.map((t, idx) => (
                <div 
                  key={t.table_name} 
                  className="border border-slate-800/40 rounded-xl bg-slate-900/10 overflow-hidden animate-row-stagger"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <button
                    onClick={() => toggleTable(t.table_name)}
                    className="w-full py-2.5 px-3 flex items-center justify-between text-left hover:bg-slate-800/35 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="text-xs font-semibold text-slate-200 tracking-wide font-mono">
                        {t.table_name}
                      </span>
                    </div>
                    {expandedTables[t.table_name] ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>
                  
                  {expandedTables[t.table_name] && (
                    <div className="px-3 pb-2.5 pt-0.5 border-t border-slate-800/20 bg-slate-950/20 divide-y divide-slate-800/10">
                      {t.columns.map(col => (
                        <div 
                          key={col.column_name} 
                          className="py-1.5 flex items-center justify-between text-[11px] font-mono hover:text-slate-100 transition-colors"
                        >
                          <span className="text-slate-355">{col.column_name}</span>
                          <span className="text-slate-500 uppercase text-[9px] font-sans font-bold bg-slate-800/45 px-1.5 py-0.5 rounded">
                            {col.data_type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: History log list items */}
      {activeTab === 'history' && (
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search query history..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full text-xs py-2 px-9 rounded-lg glass-input text-slate-200 focus:outline-none placeholder-slate-500"
              />
            </div>
            
            <div className="flex rounded-lg border border-slate-800/50 p-0.5 bg-slate-950/40 text-[10px] font-semibold text-slate-400">
              <button
                onClick={() => setHistoryFilter('all')}
                className={`flex-1 py-1 rounded-md transition-all cursor-pointer ${
                  historyFilter === 'all'
                    ? 'bg-slate-800 text-slate-200 shadow-sm'
                    : 'hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setHistoryFilter('success')}
                className={`flex-1 py-1 rounded-md transition-all cursor-pointer ${
                  historyFilter === 'success'
                    ? 'bg-emerald-950/65 text-emerald-400 border border-emerald-900/50 shadow-sm'
                    : 'hover:text-slate-200'
                }`}
              >
                Success
              </button>
              <button
                onClick={() => setHistoryFilter('failure')}
                className={`flex-1 py-1 rounded-md transition-all cursor-pointer ${
                  historyFilter === 'failure'
                    ? 'bg-rose-950/65 text-rose-400 border border-rose-900/50 shadow-sm'
                    : 'hover:text-slate-200'
                }`}
              >
                Failed
              </button>
            </div>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleDeleteAllQueries}
              className="mb-4 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold text-rose-400 border border-rose-500/25 bg-rose-500/5 hover:bg-rose-500/10 transition-all active:scale-95 w-full shadow-lg shadow-rose-950/20 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear All History
            </button>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-custom">
            {history.length === 0 ? (
              <div className="text-center py-10">
                <History className="w-8 h-8 text-slate-700 mx-auto mb-2.5" />
                <p className="text-xs text-slate-500 font-medium">No queries found.</p>
              </div>
            ) : (
              history.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => selectHistoryItem(item)}
                  className="p-3 border border-slate-800/40 rounded-xl bg-slate-900/10 hover:bg-indigo-600/5 hover:border-indigo-500/20 cursor-pointer transition-all duration-300 animate-row-stagger group relative"
                  style={{ animationDelay: `${idx * 0.03}s` }}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2 font-mono">
                    <div className="flex items-center gap-1.5">
                      <span>#Q-{item.id}</span>
                      {item.success_status === false ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Execution Failed" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Executed Successfully" />
                      )}
                      {item.execution_time !== undefined && item.execution_time !== null && item.execution_time > 0 && (
                        <span className="text-[9px] text-slate-600 font-sans font-bold bg-slate-850 px-1 py-0.5 rounded">
                          {item.execution_time}s
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{new Date(item.created_at).toLocaleTimeString()}</span>
                      <button
                        onClick={(e) => handleDeleteQuery(item.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all focus:opacity-100 cursor-pointer"
                        title="Delete query"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs font-medium text-slate-300 line-clamp-2 mb-2 group-hover:text-indigo-200 transition-colors pr-6">
                    {item.user_prompt || <span className="italic text-slate-500">Run SQL Statement</span>}
                  </p>
                  <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/30 overflow-hidden">
                    <code className="text-[10px] text-slate-400 block truncate font-mono bg-transparent p-0">
                      {item.generated_sql}
                    </code>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Saved Queries System */}
      {activeTab === 'saved' && (
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search saved queries..."
              value={savedSearch}
              onChange={(e) => setSavedSearch(e.target.value)}
              className="w-full text-xs py-2 px-9 rounded-lg glass-input text-slate-200 focus:outline-none placeholder-slate-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-custom">
            {isSavedQueriesLoading ? (
              <div className="space-y-3 py-4">
                <div className="h-12 w-full rounded-xl shimmer-loader"></div>
                <div className="h-12 w-full rounded-xl shimmer-loader"></div>
              </div>
            ) : savedQueries.length === 0 ? (
              <div className="text-center py-10">
                <Bookmark className="w-8 h-8 text-slate-700 mx-auto mb-2.5" />
                <p className="text-xs text-slate-500 font-medium">No saved queries found.</p>
                <span className="text-[10px] text-slate-650 block mt-2 px-4 leading-normal">
                  Save custom queries template by clicking the Bookmark button in the SQL editor!
                </span>
              </div>
            ) : (
              savedQueries.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => selectSavedQuery(item)}
                  className="p-3 border border-slate-800/40 rounded-xl bg-slate-900/10 hover:bg-indigo-600/5 hover:border-indigo-500/20 cursor-pointer transition-all duration-300 animate-row-stagger group relative"
                  style={{ animationDelay: `${idx * 0.03}s` }}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2 font-mono">
                    <span>#T-{item.id}</span>
                    <div className="flex items-center gap-2">
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      <button
                        onClick={(e) => handleDeleteSavedQuery(item.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all focus:opacity-100 cursor-pointer"
                        title="Delete saved query"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors mb-2 pr-6 truncate">
                    {item.title}
                  </h4>
                  <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-800/30 overflow-hidden">
                    <code className="text-[10px] text-slate-400 block truncate font-mono bg-transparent p-0">
                      {item.query}
                    </code>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default Sidebar;
