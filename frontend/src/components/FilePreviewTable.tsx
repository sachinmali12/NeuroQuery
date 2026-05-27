import React from 'react';
import { Table } from 'lucide-react';

interface FilePreviewTableProps {
  columns: string[];
  previewRows: Record<string, any>[];
  tableName: string;
}

export const FilePreviewTable: React.FC<FilePreviewTableProps> = ({
  columns,
  previewRows,
  tableName,
}) => {
  if (columns.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5 px-1.5 select-none">
        <Table className="w-3.5 h-3.5 text-indigo-400" />
        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
          Data Preview (Top {previewRows.length} Rows) for <span className="text-indigo-400 font-mono font-semibold">{tableName || 'table_name'}</span>
        </span>
      </div>

      <div className="overflow-x-auto border border-slate-850 rounded-xl bg-slate-950/20 max-h-[220px] scrollbar-custom">
        <table className="w-full text-left border-collapse font-mono text-[11px]">
          <thead>
            <tr className="border-b border-slate-850 bg-slate-900/35 text-slate-400 select-none">
              <th className="py-2 px-3 font-bold border-r border-slate-850 w-8 text-center bg-slate-950/40">#</th>
              {columns.map((col) => (
                <th key={col} className="py-2 px-3.5 font-semibold border-r border-slate-850 last:border-r-0 truncate max-w-[150px] text-slate-350">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850/80">
            {previewRows.length > 0 ? (
              previewRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/10 transition-colors">
                  <td className="py-1.5 px-2 text-slate-650 border-r border-slate-850 font-bold text-center select-none bg-slate-950/20">
                    {idx + 1}
                  </td>
                  {columns.map((col) => (
                    <td key={col} className="py-1.5 px-3.5 text-slate-300 border-r border-slate-850 last:border-r-0 truncate max-w-[150px] select-text">
                      {row[col] === null || row[col] === undefined ? (
                        <span className="text-slate-600 italic">null</span>
                      ) : (
                        String(row[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="py-6 text-center text-slate-500 font-semibold italic">
                  No preview records available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default FilePreviewTable;
