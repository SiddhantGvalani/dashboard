import { useState, Fragment } from 'react';
import { ETDRecord } from '@/lib/dataEngine';
import { ForecastKpi } from '@/lib/forecastEngine';
import { exportToCSV } from '@/lib/exportUtils';
import { Download, ChevronDown, ChevronRight } from 'lucide-react';
import ETDPendingDrilldown from './ETDPendingDrilldown';
import BookingPendingDrilldown from './BookingPendingDrilldown';

interface Props {
  groups: ForecastKpi[];
  allRows: ETDRecord[];
  drilldownType: 'etd' | 'booking';
  groupLabel: string;
}

// Download icon pinned to top-right — no text
function CornerDownload({ rows, filename }: { rows: ETDRecord[]; filename: string }) {
  if (!rows.length) return null;
  return (
    <button
      onClick={e => { e.stopPropagation(); exportToCSV(rows, filename); }}
      className="absolute top-2.5 right-3 text-muted-foreground hover:text-primary transition-colors"
      title={`Download ${filename}`}
    >
      <Download className="w-3.5 h-3.5" />
    </button>
  );
}

// Inline download inside table cell
function InlineDownload({ rows, filename }: { rows: ETDRecord[]; filename: string }) {
  if (!rows.length) return null;
  return (
    <button
      onClick={e => { e.stopPropagation(); exportToCSV(rows, filename); }}
      className="ml-1.5 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
      title={`Download ${filename}`}
    >
      <Download className="w-3 h-3" />
    </button>
  );
}

function KpiCell({ rows, color, filename, expandable, expanded, onExpand }: {
  rows: ETDRecord[];
  color: 'neutral' | 'orange' | 'green' | 'red';
  filename: string;
  expandable?: boolean;
  expanded?: boolean;
  onExpand?: () => void;
}) {
  const colorMap = {
    neutral: 'bg-secondary/60 text-secondary-foreground',
    orange: 'bg-orange-100 text-orange-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
  };
  return (
    <td className="px-3 py-3.5 text-center">
      <div className="inline-flex items-center gap-1 justify-center">
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${colorMap[color]} ${expandable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          onClick={expandable ? onExpand : undefined}
        >
          {rows.length}
          {expandable && (expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
        </span>
        <InlineDownload rows={rows} filename={filename} />
      </div>
    </td>
  );
}

// Premium KPI summary card with corner download icon
function KpiSummaryCard({ label, val, rows, file, valCls, borderCls }: {
  label: string; val: number; rows: ETDRecord[]; file: string; valCls: string; borderCls: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border-2 ${borderCls} bg-card p-[18px] text-center transition-all duration-200 hover:-translate-y-1 cursor-default`}
      style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
    >
      <CornerDownload rows={rows} filename={file} />
      <div className={`text-[26px] font-bold leading-none ${valCls}`}>{val}</div>
      <div className="text-[13px] font-bold text-muted-foreground mt-2 uppercase tracking-wide">{label}</div>
    </div>
  );
}

export default function DateGroupTable({ groups, allRows, drilldownType, groupLabel }: Props) {
  const [expandedPendingDate, setExpandedPendingDate] = useState<string | null>(null);
  const [expandedDeliveredDate, setExpandedDeliveredDate] = useState<string | null>(null);

  if (!groups.length) {
    return <div className="text-center py-12 text-muted-foreground text-sm">No data found for the selected filters.</div>;
  }

  const allDelivered = groups.flatMap(g => g.delivered);
  const allWithin = groups.flatMap(g => g.withinEtdDelivered);
  const allDelayed = groups.flatMap(g => g.delayedEtdDelivered);
  const allPending = groups.flatMap(g => g.pending);
  const allRto = groups.flatMap(g => g.rto);

  const totals = {
    total: allRows.length,
    rto: allRto.length,
    delivered: allDelivered.length,
    withinEtd: allWithin.length,
    delayedEtd: allDelayed.length,
    pending: allPending.length,
  };

  return (
    <div className="space-y-5">
      {/* ── Summary KPI Cards (premium, corner download, no duplicate sub-blocks) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiSummaryCard label="Total Shipments" val={totals.total} rows={allRows}       file={`${drilldownType}-total.csv`}     valCls="text-foreground"  borderCls="border-border" />
        <KpiSummaryCard label="RTO"             val={totals.rto}   rows={allRto}        file={`${drilldownType}-rto.csv`}       valCls="text-orange-600" borderCls="border-orange-200" />
        <KpiSummaryCard label="Delivered"       val={totals.delivered} rows={allDelivered} file={`${drilldownType}-delivered.csv`} valCls="text-green-600"  borderCls="border-green-200" />
        <KpiSummaryCard label="Pending"         val={totals.pending}   rows={allPending}   file={`${drilldownType}-pending.csv`}   valCls="text-red-600"    borderCls="border-red-200" />
      </div>

      {/* ── Export Full Dataset ── */}
      <div className="flex justify-end">
        <button
          onClick={() => exportToCSV(allRows, `${drilldownType}-forecast-all.csv`)}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <Download className="w-3.5 h-3.5" /> Export Full Dataset
        </button>
      </div>

      {/* ── Grouped Table ── */}
      <div className="rounded-xl border border-border overflow-hidden" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-muted/70 border-b border-border">
                <th className="px-4 py-3 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground">{groupLabel}</th>
                <th className="px-3 py-3 text-center text-[13px] font-bold uppercase tracking-wider text-muted-foreground">Total</th>
                <th className="px-3 py-3 text-center text-[13px] font-bold uppercase tracking-wider text-orange-600">RTO</th>
                <th className="px-3 py-3 text-center text-[13px] font-bold uppercase tracking-wider text-green-600">Delivered ↕</th>
                <th className="px-3 py-3 text-center text-[13px] font-bold uppercase tracking-wider text-red-600">Pending ↕</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g, i) => {
                const isPendingOpen = expandedPendingDate === g.date;
                const isDeliveredOpen = expandedDeliveredDate === g.date;
                const rowBg = isPendingOpen || isDeliveredOpen ? 'bg-primary/5' : i % 2 === 0 ? 'bg-card' : 'bg-muted/10';
                return (
                  <Fragment key={g.date}>
                    <tr className={`border-b border-border hover:bg-muted/30 transition-colors ${rowBg}`}>
                      <td className="px-4 py-3.5 font-bold text-sm text-foreground">{g.date}</td>
                      <KpiCell rows={g.total}      color="neutral" filename={`${drilldownType}-${g.date}-total.csv`} />
                      <KpiCell rows={g.rto}        color="orange"  filename={`${drilldownType}-${g.date}-rto.csv`} />
                      <KpiCell
                        rows={g.delivered} color="green"
                        filename={`${drilldownType}-${g.date}-delivered.csv`}
                        expandable={drilldownType === 'etd' && g.delivered.length > 0}
                        expanded={isDeliveredOpen}
                        onExpand={() => setExpandedDeliveredDate(isDeliveredOpen ? null : g.date)}
                      />
                      <KpiCell
                        rows={g.pending} color="red"
                        filename={`${drilldownType}-${g.date}-pending.csv`}
                        expandable={g.pending.length > 0}
                        expanded={isPendingOpen}
                        onExpand={() => setExpandedPendingDate(isPendingOpen ? null : g.date)}
                      />
                    </tr>

                    {/* Delivered Sub-KPI Drilldown (ETD flow only) */}
                    {isDeliveredOpen && drilldownType === 'etd' && (
                      <tr className="border-b border-border">
                        <td colSpan={5} className="p-0 bg-green-50/30">
                          <div className="px-6 py-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                              Delivered Breakdown — {g.date} ({g.delivered.length} total)
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="relative rounded-xl border-2 border-green-200 bg-card p-4 text-center transition-all duration-200 hover:-translate-y-0.5" style={{ boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
                                <CornerDownload rows={g.withinEtdDelivered} filename={`etd-${g.date}-within-etd.csv`} />
                                <div className="text-[26px] font-bold text-green-700">{g.withinEtdDelivered.length}</div>
                                <div className="text-[13px] font-bold text-muted-foreground mt-1 uppercase tracking-wide">Within ETD Delivered</div>
                                <div className="text-xs text-muted-foreground mt-0.5">Delivery Date ≤ ETD</div>
                              </div>
                              <div className="relative rounded-xl border-2 border-yellow-200 bg-card p-4 text-center transition-all duration-200 hover:-translate-y-0.5" style={{ boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
                                <CornerDownload rows={g.delayedEtdDelivered} filename={`etd-${g.date}-delayed-etd.csv`} />
                                <div className="text-[26px] font-bold text-yellow-700">{g.delayedEtdDelivered.length}</div>
                                <div className="text-[13px] font-bold text-muted-foreground mt-1 uppercase tracking-wide">Delayed ETD Delivered</div>
                                <div className="text-xs text-muted-foreground mt-0.5">Delivery Date &gt; ETD</div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}

                    {/* Pending Drilldown */}
                    {isPendingOpen && (
                      <tr className="border-b border-border">
                        <td colSpan={5} className="p-0 bg-muted/20">
                          {drilldownType === 'etd'
                            ? <ETDPendingDrilldown rows={g.pending} />
                            : <BookingPendingDrilldown rows={g.pending} />
                          }
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
