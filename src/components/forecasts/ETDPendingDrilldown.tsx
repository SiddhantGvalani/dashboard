import { useState } from 'react';
import { ETDRecord } from '@/lib/dataEngine';
import { getStatusGroups } from '@/lib/forecastEngine';
import { ChevronDown, ChevronRight } from 'lucide-react';
import RecordsTable from './RecordsTable';

interface Props {
  rows: ETDRecord[];
}

export default function ETDPendingDrilldown({ rows }: Props) {
  const [expandedStatus, setExpandedStatus] = useState<string | null>(null);
  const groups = getStatusGroups(rows);

  if (!groups.length) return <p className="px-6 py-4 text-sm text-muted-foreground">No pending records.</p>;

  return (
    <div className="px-6 py-4">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
        Pending Drilldown — By Status ({rows.length} total)
      </p>
      <div className="space-y-2">
        {groups.map(({ status, rows: sRows }) => {
          const isExpanded = expandedStatus === status;
          return (
            <div key={status} className="rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setExpandedStatus(isExpanded ? null : status)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors bg-card"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  <span className="font-semibold text-sm text-foreground">{status}</span>
                </div>
                <span className="text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">{sRows.length}</span>
              </button>
              {isExpanded && (
                <div className="border-t border-border bg-background/50">
                  <RecordsTable rows={sRows} label={status} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
