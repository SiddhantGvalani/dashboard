import { useState, Fragment } from 'react';
import { ETDRecord } from '@/lib/dataEngine';
import { getStatusGroups } from '@/lib/forecastEngine';
import { exportToCSV } from '@/lib/exportUtils';
import { Download, ChevronDown, ChevronRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { BookingDateGroup, ETDSubGroup } from './BookingFlow';
import RecordsTable from './RecordsTable';

interface Props {
  groups: BookingDateGroup[];
}

// ── Small inline download icon ──
function InlineDownload({ rows, filename }: { rows: ETDRecord[]; filename: string }) {
  if (!rows.length) return null;
  return (
    <button
      onClick={e => { e.stopPropagation(); exportToCSV(rows, filename); }}
      className="ml-1 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
      title={`Download ${filename}`}
    >
      <Download className="w-3 h-3" />
    </button>
  );
}

// ── Clickable count badge ──
function CountBadge({
  count, color, expandable, expanded, onClick, rows, filename,
}: {
  count: number;
  color: 'neutral' | 'orange' | 'green' | 'red';
  expandable?: boolean;
  expanded?: boolean;
  onClick?: () => void;
  rows: ETDRecord[];
  filename: string;
}) {
  const cls = {
    neutral: 'bg-secondary/50 text-secondary-foreground',
    orange: 'bg-orange-500/15 text-orange-500',
    green: 'bg-green-500/15 text-green-600',
    red: 'bg-destructive/15 text-destructive',
  }[color];

  return (
    <td className="px-3 py-3 text-center">
      <div className="inline-flex items-center gap-1 justify-center">
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${cls} ${expandable && count > 0 ? 'cursor-pointer hover:opacity-75 transition-opacity' : ''}`}
          onClick={expandable && count > 0 ? onClick : undefined}
        >
          {count}
          {expandable && count > 0 && (expanded
            ? <ChevronDown className="w-3.5 h-3.5" />
            : <ChevronRight className="w-3.5 h-3.5" />
          )}
        </span>
        <InlineDownload rows={rows} filename={filename} />
      </div>
    </td>
  );
}

// ── Delivered Drilldown: Within ETD + Delayed ──
function DeliveredDrilldown({ group, bookingDate, etdDate }: { group: ETDSubGroup; bookingDate: string; etdDate: string }) {
  const [withinOpen, setWithinOpen] = useState(false);
  const [delayedOpen, setDelayedOpen] = useState(false);
  const slug = `${bookingDate}-${etdDate}`.replace(/\//g, '');

  return (
    <tr className="border-b border-border">
      <td colSpan={6} className="p-0 bg-green-500/5">
        <div className="px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Delivered Breakdown — Booking: {bookingDate} / ETD: {etdDate} ({group.delivered.length} total)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Within ETD */}
            <div className="rounded-xl border-2 border-green-300/60 bg-card overflow-hidden">
              <button
                onClick={() => setWithinOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {withinOpen ? <ChevronDown className="w-4 h-4 text-green-600" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="font-bold text-sm text-foreground">Within ETD Delivered</span>
                  <span className="text-xs text-muted-foreground">Delivery ≤ ETD</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-green-600">{group.withinEtd.length}</span>
                  <InlineDownload rows={group.withinEtd} filename={`${slug}-within-etd.csv`} />
                </div>
              </button>
              {withinOpen && group.withinEtd.length > 0 && (
                <div className="border-t border-border">
                  <RecordsTable rows={group.withinEtd} label={`Within ETD – ${etdDate}`} />
                </div>
              )}
              {withinOpen && group.withinEtd.length === 0 && (
                <p className="px-4 py-3 text-sm text-muted-foreground border-t border-border">No records.</p>
              )}
            </div>

            {/* Delayed ETD */}
            <div className="rounded-xl border-2 border-yellow-300/60 bg-card overflow-hidden">
              <button
                onClick={() => setDelayedOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {delayedOpen ? <ChevronDown className="w-4 h-4 text-yellow-600" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="font-bold text-sm text-foreground">Delayed Delivered</span>
                  <span className="text-xs text-muted-foreground">Delivery &gt; ETD</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-yellow-600">{group.delayed.length}</span>
                  <InlineDownload rows={group.delayed} filename={`${slug}-delayed.csv`} />
                </div>
              </button>
              {delayedOpen && group.delayed.length > 0 && (
                <div className="border-t border-border">
                  <RecordsTable rows={group.delayed} label={`Delayed – ${etdDate}`} />
                </div>
              )}
              {delayedOpen && group.delayed.length === 0 && (
                <p className="px-4 py-3 text-sm text-muted-foreground border-t border-border">No records.</p>
              )}
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Pending Drilldown: Status → Records ──
function PendingDrilldown({ rows, bookingDate, etdDate }: { rows: ETDRecord[]; bookingDate: string; etdDate: string }) {
  const [expandedStatus, setExpandedStatus] = useState<string | null>(null);
  const statusGroups = getStatusGroups(rows);

  if (!statusGroups.length) {
    return (
      <tr className="border-b border-border">
        <td colSpan={6} className="px-6 py-4 text-sm text-muted-foreground bg-muted/10">
          No pending records.
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border">
      <td colSpan={6} className="p-0 bg-destructive/5">
        <div className="px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Pending Breakdown — Booking: {bookingDate} / ETD: {etdDate} ({rows.length} total)
          </p>
          <div className="space-y-1.5">
            {statusGroups.map(({ status, rows: sRows }) => {
              const isOpen = expandedStatus === status;
              const slug = `${bookingDate}-${etdDate}-${status}`.replace(/[\s\/]/g, '-');
              return (
                <div key={status} className="rounded-lg border border-border overflow-hidden bg-card">
                  <button
                    onClick={() => setExpandedStatus(isOpen ? null : status)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                      <Clock className="w-3.5 h-3.5 text-destructive" />
                      <span className="font-semibold text-sm text-foreground">{status}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black bg-destructive/15 text-destructive px-2.5 py-0.5 rounded-full">{sRows.length}</span>
                      <InlineDownload rows={sRows} filename={`${slug}.csv`} />
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-border bg-background/60">
                      <RecordsTable rows={sRows} label={`${status} – Pending`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Main Table ──
export default function BookingDateTable({ groups }: Props) {
  // State keys: `${bookingDate}__${etdDate}__delivered` or `pending`
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  // Collapsed booking date groups
  const [collapsedBookings, setCollapsedBookings] = useState<Set<string>>(new Set());

  const toggleBooking = (bookingDate: string) => {
    setCollapsedBookings(prev => {
      const next = new Set(prev);
      if (next.has(bookingDate)) next.delete(bookingDate);
      else next.add(bookingDate);
      return next;
    });
  };

  const toggleDrill = (key: string) => {
    setExpandedKey(prev => (prev === key ? null : key));
  };

  if (!groups.length) {
    return <div className="text-center py-12 text-muted-foreground text-sm">No data found for the selected filters.</div>;
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[750px]">
          <thead>
            <tr className="bg-muted/70 border-b border-border">
              <th className="px-4 py-3 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground">Booking Date</th>
              <th className="px-4 py-3 text-left text-[13px] font-bold uppercase tracking-wider text-muted-foreground">ETD Date</th>
              <th className="px-3 py-3 text-center text-[13px] font-bold uppercase tracking-wider text-muted-foreground">Total</th>
              <th className="px-3 py-3 text-center text-[13px] font-bold uppercase tracking-wider text-orange-500">RTO</th>
              <th className="px-3 py-3 text-center text-[13px] font-bold uppercase tracking-wider text-green-600">Delivered ↕</th>
              <th className="px-3 py-3 text-center text-[13px] font-bold uppercase tracking-wider text-destructive">Pending ↕</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((booking) => {
              const isCollapsed = collapsedBookings.has(booking.bookingDate);
              const bSlug = booking.bookingDate.replace(/\//g, '');
              return (
                <Fragment key={booking.bookingDate}>
                  {/* ── Booking Date Summary Row ── */}
                  <tr
                    className="border-b border-border bg-primary/8 hover:bg-primary/10 transition-colors cursor-pointer"
                    style={{ background: 'hsl(var(--primary) / 0.06)' }}
                  >
                    <td className="px-4 py-3" colSpan={1}>
                      <button
                        onClick={() => toggleBooking(booking.bookingDate)}
                        className="flex items-center gap-2 font-black text-sm text-foreground hover:text-primary transition-colors"
                      >
                        {isCollapsed
                          ? <ChevronRight className="w-4 h-4 text-primary" />
                          : <ChevronDown className="w-4 h-4 text-primary" />
                        }
                        {booking.bookingDate}
                        <span className="text-xs font-semibold text-muted-foreground">
                          ({booking.etdGroups.length} ETD{booking.etdGroups.length !== 1 ? 's' : ''})
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground italic">— Summary</td>
                    {/* Total */}
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-secondary/50 text-secondary-foreground">{booking.totalRows.length}</span>
                        <InlineDownload rows={booking.totalRows} filename={`booking-${bSlug}-all.csv`} />
                      </div>
                    </td>
                    {/* RTO */}
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-orange-500/15 text-orange-500">{booking.totalRto.length}</span>
                        <InlineDownload rows={booking.totalRto} filename={`booking-${bSlug}-rto.csv`} />
                      </div>
                    </td>
                    {/* Delivered */}
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-green-500/15 text-green-600">{booking.totalDelivered.length}</span>
                        <InlineDownload rows={booking.totalDelivered} filename={`booking-${bSlug}-delivered.csv`} />
                      </div>
                    </td>
                    {/* Pending */}
                    <td className="px-3 py-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <span className="px-3 py-1 rounded-full text-sm font-bold bg-destructive/15 text-destructive">{booking.totalPending.length}</span>
                        <InlineDownload rows={booking.totalPending} filename={`booking-${bSlug}-pending.csv`} />
                      </div>
                    </td>
                  </tr>

                  {/* ── ETD Sub-Rows ── */}
                  {!isCollapsed && booking.etdGroups.map((etdGrp, idx) => {
                    const drillKey = `${booking.bookingDate}__${etdGrp.etdDate}`;
                    const deliveredKey = `${drillKey}__delivered`;
                    const pendingKey = `${drillKey}__pending`;
                    const isDeliveredOpen = expandedKey === deliveredKey;
                    const isPendingOpen = expandedKey === pendingKey;
                    const rowBg = isDeliveredOpen || isPendingOpen
                      ? 'bg-primary/5'
                      : idx % 2 === 0 ? 'bg-card' : 'bg-muted/10';
                    const eSlug = `${bSlug}-${etdGrp.etdDate.replace(/\//g, '')}`;

                    return (
                      <Fragment key={etdGrp.etdDate}>
                        <tr className={`border-b border-border hover:bg-muted/30 transition-colors ${rowBg}`}>
                          {/* Booking Date (empty — already shown in summary) */}
                          <td className="px-4 py-3 pl-10 text-sm text-muted-foreground">
                            <span className="text-xs text-muted-foreground/50">└</span>
                          </td>
                          {/* ETD Date */}
                          <td className="px-4 py-3 font-semibold text-sm text-foreground">{etdGrp.etdDate}</td>
                          {/* Total */}
                          <CountBadge count={etdGrp.total.length} color="neutral" rows={etdGrp.total} filename={`${eSlug}-total.csv`} />
                          {/* RTO */}
                          <CountBadge count={etdGrp.rto.length} color="orange" rows={etdGrp.rto} filename={`${eSlug}-rto.csv`} />
                          {/* Delivered — clickable */}
                          <CountBadge
                            count={etdGrp.delivered.length}
                            color="green"
                            rows={etdGrp.delivered}
                            filename={`${eSlug}-delivered.csv`}
                            expandable
                            expanded={isDeliveredOpen}
                            onClick={() => toggleDrill(deliveredKey)}
                          />
                          {/* Pending — clickable */}
                          <CountBadge
                            count={etdGrp.pending.length}
                            color="red"
                            rows={etdGrp.pending}
                            filename={`${eSlug}-pending.csv`}
                            expandable
                            expanded={isPendingOpen}
                            onClick={() => toggleDrill(pendingKey)}
                          />
                        </tr>

                        {/* Delivered drilldown */}
                        {isDeliveredOpen && (
                          <DeliveredDrilldown
                            group={etdGrp}
                            bookingDate={booking.bookingDate}
                            etdDate={etdGrp.etdDate}
                          />
                        )}

                        {/* Pending drilldown */}
                        {isPendingOpen && (
                          <PendingDrilldown
                            rows={etdGrp.pending}
                            bookingDate={booking.bookingDate}
                            etdDate={etdGrp.etdDate}
                          />
                        )}
                      </Fragment>
                    );
                  })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
