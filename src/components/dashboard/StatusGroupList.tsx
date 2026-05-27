import { useMemo } from 'react';
import { ETDRecord, getStatusGroups } from '@/lib/dataEngine';

interface Props {
  rows: ETDRecord[];
}

export default function StatusGroupList({ rows }: Props) {
  const groups = useMemo(() => getStatusGroups(rows), [rows]);
  const total = rows.length;

  if (!groups.length) {
    return <p className="text-sm text-muted-foreground text-center py-4">No records</p>;
  }

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-5">
      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
        Not Yet Delivered — Status Breakdown ({total.toLocaleString()} records)
      </h4>
      <div className="space-y-3">
        {groups.map(({ status, count }) => {
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={status}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-foreground">{status}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{pct.toFixed(1)}%</span>
                  <span className="text-sm font-bold text-foreground w-12 text-right">
                    {count.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
