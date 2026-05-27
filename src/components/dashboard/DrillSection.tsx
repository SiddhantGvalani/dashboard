import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ETDRecord, getStatusGroupsWithRows } from '@/lib/dataEngine';
import { exportToCSV } from '@/lib/exportUtils';
import KpiCard from './KpiCard';

interface Props {
  label: string;
  rows: ETDRecord[];
  exportName: string;
  displayColumns: string[];
  icon: React.ReactNode;
}

export default function DrillSection({ label, rows, exportName, displayColumns, icon }: Props) {
  const [open, setOpen] = useState(false);
  const [expandedStatus, setExpandedStatus] = useState<string | null>(null);

  const groups = useMemo(() => getStatusGroupsWithRows(rows), [rows]);

  const toggleStatus = (status: string) =>
    setExpandedStatus(prev => (prev === status ? null : status));

  // Dynamic case-insensitive remarks resolver
  const getCellValue = (row: ETDRecord, col: string): string => {
    const colNorm = col.trim().toLowerCase();
    if (colNorm === 'remarks' || colNorm === 'customer remarks') {
      const remarkKey = Object.keys(row).find(
        key => key.trim().toLowerCase() === 'remarks' || key.trim().toLowerCase() === 'customer remarks'
      );
      return remarkKey ? (row[remarkKey] ?? '') : '';
    }
    return row[col] ?? '';
  };

  return (
    <div className="flex-1 min-w-0">
      <KpiCard
        label={label}
        count={rows.length}
        color="red"
        icon={icon}
        data={rows}
        exportName={exportName}
        onClick={() => { setOpen(v => !v); setExpandedStatus(null); }}
        active={open}
        clickable
      />

      {open && (
        <div className="mt-3 rounded-xl border-2 border-red-200 bg-card overflow-hidden">
          <div className="px-4 py-2.5 bg-red-50 border-b border-red-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-red-600">
              Status Breakdown — {rows.length.toLocaleString()} records
            </span>
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs opacity-70"
              onClick={() => exportToCSV(rows, `${exportName}_all.csv`)}>
              <Download className="w-3 h-3" /> Download All
            </Button>
          </div>

          {groups.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No records</p>
          )}

          {groups.map(({ status, count, rows: statusRows }) => (
            <div key={status} className="border-b border-border last:border-0">
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors select-none"
                onClick={() => toggleStatus(status)}
              >
                <div className="flex items-center gap-2">
                  {expandedStatus === status
                    ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                  <span className="text-sm font-semibold text-foreground">{status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-red-600">{count.toLocaleString()}</span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-50 hover:opacity-100"
                    title="Download this status" onClick={e => {
                      e.stopPropagation();
                      exportToCSV(statusRows, `${exportName}_${status.toLowerCase().replace(/\s+/g, '_')}.csv`);
                    }}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {expandedStatus === status && (
                <div className="px-4 pb-4 bg-muted/20">
                  <div className="overflow-x-auto rounded border border-border">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          <th className="text-left px-3 py-2 font-bold text-muted-foreground border-b border-border w-10">#</th>
                          {displayColumns.map(col => (
                            <th key={col} className="text-left px-3 py-2 font-bold text-muted-foreground border-b border-border whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {statusRows.slice(0, 100).map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? 'bg-card' : 'bg-muted/30'}>
                            <td className="px-3 py-2 text-muted-foreground border-b border-border/50">{i + 1}</td>
                            {displayColumns.map(col => (
                              <td key={col} className="px-3 py-2 border-b border-border/50 text-foreground max-w-[220px] truncate" title={getCellValue(row, col)}>
                                {getCellValue(row, col) || '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {statusRows.length > 100 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Showing first 100 of {statusRows.length.toLocaleString()} records
                    </p>
                  )}
                  <div className="mt-3 flex justify-end">
                    <Button variant="outline" size="sm" className="gap-2 text-xs"
                      onClick={() => exportToCSV(statusRows, `${exportName}_${status.toLowerCase().replace(/\s+/g, '_')}_full.csv`)}>
                      <Download className="w-3.5 h-3.5" />
                      Download Full Data ({count.toLocaleString()} rows, all columns)
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
