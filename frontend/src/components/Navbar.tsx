import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Terminal, RefreshCw, LogOut, User as UserIcon, UploadCloud } from 'lucide-react';

interface NavbarProps {
  serverStatus: 'online' | 'offline';
  onRefresh: () => void;
  sidebarOpen: boolean;
  onImportClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ serverStatus, onRefresh, sidebarOpen, onImportClick }) => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="h-16 px-6 border-b border-slate-800/40 flex items-center justify-between bg-slate-950/20">
      <div className="flex items-center gap-4">
        {!sidebarOpen && <div className="w-10" />}
        <div className="flex items-center gap-2">
          <Terminal className="text-indigo-400 w-4 h-4" />
          <span className="font-mono text-sm font-semibold text-slate-200 tracking-wider">Console Workspace</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Connection status indicator */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/40 border border-slate-800/40 text-xs">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              serverStatus === 'online' ? 'bg-emerald-400' : 'bg-rose-400'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              serverStatus === 'online' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}></span>
          </span>
          <span className="text-[11px] text-slate-400 font-semibold tracking-wide">
            Server: <span className={serverStatus === 'online' ? 'text-emerald-400' : 'text-rose-400'}>{serverStatus.toUpperCase()}</span>
          </span>
        </div>

        {/* Import file button */}
        <button
          onClick={onImportClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-indigo-500/25 bg-indigo-500/5 hover:bg-indigo-500/15 hover:border-indigo-500/55 hover:text-white transition-all text-xs font-bold text-indigo-300 shadow-lg shadow-indigo-950/20 active:scale-95 cursor-pointer shiny-hover h-9"
          title="Import CSV or Excel Spreadsheets"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Import File</span>
        </button>

        {/* Sync action button */}
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg border border-slate-800/80 bg-slate-900/20 hover:bg-slate-800/60 hover:text-slate-100 transition-all cursor-pointer w-9 h-9 flex items-center justify-center"
          title="Sync Schema and Logs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        {/* User profile dropdown/display */}
        {user && (
          <div className="relative border-l border-slate-800/60 pl-4" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/15 hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all text-xs font-semibold text-slate-200 cursor-pointer select-none"
            >
              <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>{user.username}</span>
              <svg
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-250 ${dropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-800/85 bg-slate-950 p-2 shadow-2xl z-50 animate-row-stagger"
                style={{
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.8)'
                }}
              >
                <div className="px-3 py-2 border-b border-slate-800/40 mb-1.5 select-none">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Signed in as</p>
                  <p className="text-xs font-bold text-slate-350 truncate mt-0.5">{user.username}</p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition-all text-xs font-semibold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
export default Navbar;

