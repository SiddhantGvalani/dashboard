import { ETDRecord } from '@/lib/dataEngine';
import { exportToCSV } from '@/lib/exportUtils';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface Props {
  rows: ETDRecord[];
  label?: string;
}

export default function RecordsTable({ rows, label = 'records' }: Props) {
  if (!rows.length) return <p className="text-xs text-muted-foreground px-4 py-3">No records found.</p>;

  const headers = Object.keys(rows[0]);

  const isBombax = (h: string) => h.toLowerCase().includes('bombax');
  const isRemarks = (h: string) => h.toLowerCase().includes('remark');
  const isStatus = (h: string) => h.toLowerCase() === 'status';

  return (
    <div>
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{rows.length} {label}</span>
        <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs" onClick={() => exportToCSV(rows, `${label}.csv`)}>
          <Download className="w-3 h-3" /> Export CSV
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[600px]">
          <thead>
            <tr className="bg-muted/60 border-y border-border">
              {headers.map(h => (
                <th key={h} className={`px-3 py-2 text-left font-bold uppercase tracking-wide whitespace-nowrap ${
                  isStatus(h) ? 'text-primary' : isBombax(h) ? 'text-orange-600' : isRemarks(h) ? 'text-blue-600' : 'text-muted-foreground'
                }`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={`border-b border-border hover:bg-muted/30 transition-colors ${i % 2 === 0 ? 'bg-card' : 'bg-muted/10'}`}>
                {headers.map(h => (
                  <td key={h} className={`px-3 py-2 whitespace-nowrap ${
                    isStatus(h) ? 'font-semibold text-foreground' : isBombax(h) ? 'text-orange-700 font-medium' : isRemarks(h) ? 'text-blue-700' : 'text-muted-foreground'
                  }`}>{row[h] || '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
