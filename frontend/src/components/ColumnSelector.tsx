import React from 'react';
import { Settings, CheckSquare, Square } from 'lucide-react';

export interface ColumnSetting {
  originalName: string;
  cleanedName: string;
  type: 'INTEGER' | 'FLOAT' | 'DATE' | 'BOOLEAN' | 'TEXT';
  selected: boolean;
}

interface ColumnSelectorProps {
  columns: ColumnSetting[];
  onChange: (columns: ColumnSetting[]) => void;
}

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({ columns, onChange }) => {
  const toggleSelect = (index: number) => {
    const next = [...columns];
    next[index].selected = !next[index].selected;
    onChange(next);
  };

  const changeType = (index: number, newType: ColumnSetting['type']) => {
    const next = [...columns];
    next[index].type = newType;
    onChange(next);
  };

  const changeCleanedName = (index: number, newCleanedName: string) => {
    const next = [...columns];
    // Strip illegal characters just in case
    const sanitized = newCleanedName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    next[index].cleanedName = sanitized;
    onChange(next);
  };

  const selectAll = () => {
    onChange(columns.map(c => ({ ...c, selected: true })));
  };

  const deselectAll = () => {
    onChange(columns.map(c => ({ ...c, selected: false })));
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1 select-none">
        <div className="flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            Configure Schema Columns
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
          >
            Select All
          </button>
          <span className="text-slate-700 text-[10px]">|</span>
          <button
            type="button"
            onClick={deselectAll}
            className="text-[10px] font-bold text-slate-500 hover:text-slate-400 transition-colors cursor-pointer"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="border border-slate-850 rounded-xl bg-slate-950/15 overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-slate-850 bg-slate-900/30 text-[10px] text-slate-500 font-bold uppercase tracking-wider select-none">
          <div className="col-span-1">Import</div>
          <div className="col-span-4">Source Header</div>
          <div className="col-span-4">Cleaned SQL Header</div>
          <div className="col-span-3 text-right">Data Type</div>
        </div>

        <div className="max-h-[190px] overflow-y-auto divide-y divide-slate-850/60 scrollbar-custom">
          {columns.map((col, idx) => (
            <div
              key={col.originalName}
              className={`grid grid-cols-12 gap-2 px-4 py-2.5 items-center transition-colors ${
                col.selected ? 'bg-indigo-500/[0.01] hover:bg-indigo-500/[0.03]' : 'opacity-55 hover:bg-slate-900/10'
              }`}
            >
              {/* Checkbox selector */}
              <div className="col-span-1">
                <button
                  type="button"
                  onClick={() => toggleSelect(idx)}
                  className="text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer flex items-center justify-center"
                >
                  {col.selected ? (
                    <CheckSquare className="w-4 h-4 text-indigo-500 fill-indigo-500/10" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-650" />
                  )}
                </button>
              </div>

              {/* Source Header */}
              <div className="col-span-4 min-w-0">
                <p className="text-xs font-semibold text-slate-350 truncate font-mono select-text" title={col.originalName}>
                  {col.originalName}
                </p>
              </div>

              {/* Mapped SQL Header (Editable) */}
              <div className="col-span-4">
                <input
                  type="text"
                  value={col.cleanedName}
                  onChange={(e) => changeCleanedName(idx, e.target.value)}
                  disabled={!col.selected}
                  className="w-full text-xs font-mono py-0.5 px-2 bg-slate-950/40 border border-slate-850 focus:border-indigo-500/50 rounded-md text-slate-200 focus:outline-none placeholder-slate-700 disabled:opacity-50 disabled:pointer-events-none"
                  placeholder="column_name"
                />
              </div>

              {/* Type selector */}
              <div className="col-span-3 text-right">
                <select
                  value={col.type}
                  onChange={(e) => changeType(idx, e.target.value as ColumnSetting['type'])}
                  disabled={!col.selected}
                  className="text-xs font-mono font-semibold py-0.5 px-2 bg-slate-950 border border-slate-800 focus:border-indigo-500/50 rounded-md text-indigo-400 hover:text-indigo-300 focus:outline-none cursor-pointer disabled:opacity-50 disabled:pointer-events-none max-w-full"
                >
                  <option value="TEXT">TEXT</option>
                  <option value="INTEGER">INTEGER</option>
                  <option value="FLOAT">FLOAT</option>
                  <option value="DATE">DATE</option>
                  <option value="BOOLEAN">BOOLEAN</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default ColumnSelector;
