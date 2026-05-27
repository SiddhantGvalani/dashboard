import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LabelList, ResponsiveContainer, Cell,
} from 'recharts';
import { KpiResult, normalizeDate } from '@/lib/dataEngine';

interface Props { kpis: KpiResult }

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 8,
  fontSize: 12,
};

function ChartCard({ title, children, fullWidth }: { title: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={`rounded-2xl border-2 border-border bg-card p-5 ${fullWidth ? 'col-span-1 md:col-span-2' : ''}`}>
      <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-5">{title}</h4>
      {children}
    </div>
  );
}

// Custom tooltip for Chart 1
function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const rto = payload.find((p: any) => p.dataKey === 'rto')?.value ?? 0;
  const delivered = payload.find((p: any) => p.dataKey === 'delivered')?.value ?? 0;
  const failed = payload.find((p: any) => p.dataKey === 'failed')?.value ?? 0;
  const total = rto + delivered + failed;
  return (
    <div style={tooltipStyle} className="p-3 space-y-1">
      <p className="font-bold text-foreground">Date: {label}</p>
      <p className="text-foreground">Total: <span className="font-semibold">{total}</span></p>
      <p className="text-orange-500">RTO: <span className="font-semibold">{rto}</span></p>
      <p className="text-green-500">ETD Delivered: <span className="font-semibold">{delivered}</span></p>
      <p className="text-red-500">ETD Crossed: <span className="font-semibold">{failed}</span></p>
    </div>
  );
}

export default function ChartBlock({ kpis }: Props) {

  // Chart 1 — Shipment Trend by ETD Date (grouped columns)
  const trendData = useMemo(() => {
    const map: Record<string, { date: string; rto: number; delivered: number; failed: number }> = {};

    const addRow = (rows: typeof kpis.closed, key: 'rto' | 'delivered' | 'failed') => {
      for (const row of rows) {
        const date = normalizeDate(row['ETD'] ?? '') || 'Unknown';
        if (!map[date]) map[date] = { date, rto: 0, delivered: 0, failed: 0 };
        map[date][key]++;
      }
    };

    addRow(kpis.closed, 'rto');
    addRow(kpis.delivered, 'delivered');
    addRow(kpis.failed, 'failed');

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [kpis]);

  // Chart 2 — Destination-wise Delivered (green)
  const deliveredByDest = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of kpis.delivered) {
      const d = row['Destination']?.trim() || 'Unknown';
      counts[d] = (counts[d] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [kpis.delivered]);

  // Chart 3 — Destination-wise Failed (red)
  const failedByDest = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of kpis.failed) {
      const d = row['Destination']?.trim() || 'Unknown';
      counts[d] = (counts[d] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [kpis.failed]);

  const chartHeight = (count: number) => Math.max(280, count * 32 + 40);

  return (
    <div className="space-y-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Analytics Charts</h3>

      {/* Chart 1 — Full Width: Shipment Trend by Date */}
      <div className="rounded-2xl border-2 border-border bg-card p-5">
        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-5">
          Shipment Trend by Date
        </h4>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={trendData} barSize={14} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip content={<TrendTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
            <Bar dataKey="rto" name="RTO" fill="hsl(var(--chart-4))" radius={[3, 3, 0, 0]} />
            <Bar dataKey="delivered" name="ETD Delivered" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} />
            <Bar dataKey="failed" name="ETD Crossed" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex items-center gap-5 mt-3 justify-center flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-sm bg-[hsl(var(--chart-4))]" /> RTO
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-sm bg-[hsl(var(--chart-2))]" /> ETD Delivered
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-3 h-3 rounded-sm bg-[hsl(var(--destructive))]" /> ETD Crossed
          </div>
        </div>
      </div>

      {/* Row: Chart 2 + Chart 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Chart 2 — Destination-wise Delivered */}
        <div className="rounded-2xl border-2 border-border bg-card p-5">
          <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-5">
            Top Destinations — Delivered
          </h4>
          <ResponsiveContainer width="100%" height={chartHeight(deliveredByDest.length)}>
            <BarChart data={deliveredByDest} layout="vertical" barSize={18} margin={{ right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, _: string, entry: any) => [value, entry.payload.name]}
              />
              <Bar dataKey="value" fill="#22c55e" radius={[0, 5, 5, 0]}>
                <LabelList dataKey="value" position="right" style={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} />
                {deliveredByDest.map((_, i) => (
                  <Cell key={i} fill={`hsl(142 ${70 - i * 2}% ${40 + i * 1}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3 — Destination-wise Failed */}
        <div className="rounded-2xl border-2 border-border bg-card p-5">
          <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-5">
            Top Destinations — Failed
          </h4>
          <ResponsiveContainer width="100%" height={chartHeight(failedByDest.length)}>
            <BarChart data={failedByDest} layout="vertical" barSize={18} margin={{ right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, _: string, entry: any) => [value, entry.payload.name]}
              />
              <Bar dataKey="value" fill="#ef4444" radius={[0, 5, 5, 0]}>
                <LabelList dataKey="value" position="right" style={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} />
                {failedByDest.map((_, i) => (
                  <Cell key={i} fill={`hsl(0 ${70 - i * 2}% ${50 + i * 1}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
