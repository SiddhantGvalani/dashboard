import { useState } from 'react';
import { ETDRecord } from '@/lib/dataEngine';
import { getUniqueColValues, getColVal } from '@/lib/forecastEngine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, AlertCircle, BookOpen, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/exportUtils';
import BookingDateTable from './BookingDateTable';

interface Props { baseDataset: ETDRecord[]; columns: string[] }

function parseDate(dateStr: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null;
  const clean = dateStr.trim().replace(/-/g, '/');
  const parts = clean.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  return isNaN(d.getTime()) ? null : d;
}

function findBookingKey(row: ETDRecord): string | undefined {
  return Object.keys(row).find(key => {
    const k = key.trim().toLowerCase();
    return k === 'booked date' || k === 'date of booking';
  });
}

export type ETDSubGroup = {
  etdDate: string;
  total: ETDRecord[];
  rto: ETDRecord[];
  delivered: ETDRecord[];
  withinEtd: ETDRecord[];
  delayed: ETDRecord[];
  pending: ETDRecord[];
};

export type BookingDateGroup = {
  bookingDate: string;
  etdGroups: ETDSubGroup[];
  totalRows: ETDRecord[];
  totalRto: ETDRecord[];
  totalDelivered: ETDRecord[];
  totalPending: ETDRecord[];
};

function computeBookingETDGroups(rows: ETDRecord[], bookingKey: string): BookingDateGroup[] {
  // Step 1: Group by Booking Date
  const byBooking: Record<string, ETDRecord[]> = {};
  for (const row of rows) {
    const bDate = row[bookingKey]?.trim() ?? '';
    if (!bDate) continue;
    if (!byBooking[bDate]) byBooking[bDate] = [];
    byBooking[bDate].push(row);
  }

  const groups: BookingDateGroup[] = Object.entries(byBooking).map(([bookingDate, bRows]) => {
    // Step 2: For each booking date, group by ETD Date
    const byEtd: Record<string, ETDRecord[]> = {};
    for (const row of bRows) {
      const etdKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'etd');
      const etdDate = etdKey ? (row[etdKey]?.trim() ?? '(No ETD)') : '(No ETD)';
      const key = etdDate || '(No ETD)';
      if (!byEtd[key]) byEtd[key] = [];
      byEtd[key].push(row);
    }

    const etdGroups: ETDSubGroup[] = Object.entries(byEtd).map(([etdDate, etdRows]) => {
      const rto: ETDRecord[] = [];
      const delivered: ETDRecord[] = [];
      const withinEtd: ETDRecord[] = [];
      const delayed: ETDRecord[] = [];
      const pending: ETDRecord[] = [];

      for (const row of etdRows) {
        const status = getColVal(row, 'status').trim().toLowerCase();
        if (status.startsWith('rto')) { rto.push(row); continue; }

        const delKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'delivery date');
        const deliveryDateRaw = delKey ? (row[delKey]?.trim() ?? '') : '';

        if (deliveryDateRaw && deliveryDateRaw !== '') {
          delivered.push(row);
          const etdKey = Object.keys(row).find(k => k.trim().toLowerCase() === 'etd');
          const etdRaw = etdKey ? (row[etdKey]?.trim() ?? '') : '';
          const dDate = parseDate(deliveryDateRaw);
          const eDate = parseDate(etdRaw);
          if (dDate && eDate && dDate <= eDate) {
            withinEtd.push(row);
          } else {
            delayed.push(row);
          }
        } else {
          pending.push(row);
        }
      }

      return { etdDate, total: etdRows, rto, delivered, withinEtd, delayed, pending };
    }).sort((a, b) => {
      const da = parseDate(a.etdDate);
      const db = parseDate(b.etdDate);
      if (da && db) return da.getTime() - db.getTime();
      return a.etdDate.localeCompare(b.etdDate);
    });

    // Aggregate totals for booking date summary row
    const totalRto = etdGroups.flatMap(g => g.rto);
    const totalDelivered = etdGroups.flatMap(g => g.delivered);
    const totalPending = etdGroups.flatMap(g => g.pending);

    return {
      bookingDate,
      etdGroups,
      totalRows: bRows,
      totalRto,
      totalDelivered,
      totalPending,
    };
  }).sort((a, b) => {
    const da = parseDate(a.bookingDate);
    const db = parseDate(b.bookingDate);
    if (da && db) return da.getTime() - db.getTime();
    return a.bookingDate.localeCompare(b.bookingDate);
  });

  return groups;
}

export default function BookingFlow({ baseDataset }: Props) {
  const [bookingFrom, setBookingFrom] = useState('');
  const [bookingTo, setBookingTo] = useState('');
  const [origin, setOrigin] = useState('__all__');
  const [destination, setDestination] = useState('__all__');
  const [results, setResults] = useState<BookingDateGroup[] | null>(null);
  const [filteredRows, setFilteredRows] = useState<ETDRecord[]>([]);
  const [error, setError] = useState('');

  const origins = getUniqueColValues(baseDataset, 'origin');
  const destinations = getUniqueColValues(baseDataset, 'destination');

  function handleFetch() {
    setError('');
    if (!bookingFrom || !bookingTo) { setError('Please select both Booking Date From and To.'); return; }
    if (bookingFrom > bookingTo) { setError('Booking Date From must be before or equal to Booking Date To.'); return; }

    const fromDate = new Date(bookingFrom);
    const toDate = new Date(bookingTo);
    toDate.setHours(23, 59, 59, 999);

    let detectedBookingKey = '';
    for (const row of baseDataset) {
      const k = findBookingKey(row);
      if (k) { detectedBookingKey = k; break; }
    }

    if (!detectedBookingKey) {
      setError('Could not find a "Booking Date" column in the sheet. Please check your column names.');
      return;
    }

    let rows = baseDataset.filter(row => {
      const bookingDateRaw = row[detectedBookingKey] ?? '';
      if (!bookingDateRaw || bookingDateRaw.trim() === '') return false;
      const bookingDate = parseDate(bookingDateRaw);
      if (!bookingDate) return false;
      return bookingDate >= fromDate && bookingDate <= toDate;
    });

    if (origin !== '__all__') rows = rows.filter(row => getColVal(row, 'origin') === origin);
    if (destination !== '__all__') rows = rows.filter(row => getColVal(row, 'destination') === destination);

    setFilteredRows(rows);
    setResults(computeBookingETDGroups(rows, detectedBookingKey));
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-6 py-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <h3 className="text-base font-bold text-foreground">Booking Date Filter</h3>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
          Base dataset: {baseDataset.length} shipments
        </span>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs font-bold mb-1.5 block uppercase tracking-wide">
              Booking Date From <span className="text-destructive">*</span>
            </Label>
            <Input type="date" value={bookingFrom} onChange={e => setBookingFrom(e.target.value)} className="font-medium" />
          </div>
          <div>
            <Label className="text-xs font-bold mb-1.5 block uppercase tracking-wide">
              Booking Date To <span className="text-destructive">*</span>
            </Label>
            <Input type="date" value={bookingTo} onChange={e => setBookingTo(e.target.value)} className="font-medium" />
          </div>
          <div>
            <Label className="text-xs font-bold mb-1.5 block uppercase tracking-wide">Origin</Label>
            <Select value={origin} onValueChange={setOrigin}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Origins</SelectItem>
                {origins.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-bold mb-1.5 block uppercase tracking-wide">Destination</Label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Destinations</SelectItem>
                {destinations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-destructive text-sm mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5">
          <Button onClick={handleFetch} className="gap-2 font-bold">
            <Search className="w-4 h-4" /> Fetch Booking Data
          </Button>
        </div>

        {results !== null && (
          <div className="mt-8 border-t border-border pt-6">
            {/* Summary KPI Cards */}
            <BookingSummaryCards groups={results} allRows={filteredRows} />

            <div className="flex justify-end mt-4 mb-5">
              <button
                onClick={() => exportToCSV(filteredRows, 'booking-forecast-all.csv')}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                <Download className="w-3.5 h-3.5" /> Export Full Dataset
              </button>
            </div>

            <h4 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wide">
              Results — Grouped by Booking Date → ETD Date
              <span className="ml-2 text-xs font-normal text-muted-foreground normal-case">
                ({filteredRows.length} shipments across {results.length} booking date{results.length !== 1 ? 's' : ''})
              </span>
            </h4>

            <BookingDateTable groups={results} />
          </div>
        )}
      </div>
    </div>
  );
}

function BookingSummaryCards({ groups, allRows }: { groups: BookingDateGroup[]; allRows: ETDRecord[] }) {
  const totalRto = groups.flatMap(g => g.totalRto);
  const totalDelivered = groups.flatMap(g => g.totalDelivered);
  const totalPending = groups.flatMap(g => g.totalPending);

  const cards = [
    { label: 'Total Shipments', val: allRows.length, rows: allRows, file: 'booking-total.csv', valCls: 'text-foreground', borderCls: 'border-border' },
    { label: 'RTO', val: totalRto.length, rows: totalRto, file: 'booking-rto.csv', valCls: 'text-orange-500', borderCls: 'border-orange-300' },
    { label: 'Delivered', val: totalDelivered.length, rows: totalDelivered, file: 'booking-delivered.csv', valCls: 'text-green-600', borderCls: 'border-green-300' },
    { label: 'Pending', val: totalPending.length, rows: totalPending, file: 'booking-pending.csv', valCls: 'text-destructive', borderCls: 'border-destructive/40' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map(c => (
        <div
          key={c.label}
          className={`relative rounded-2xl border-2 ${c.borderCls} bg-card p-[18px] text-center`}
          style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }}
        >
          <button
            onClick={() => exportToCSV(c.rows, c.file)}
            className="absolute top-2.5 right-3 text-muted-foreground hover:text-primary transition-colors"
            title={`Download ${c.file}`}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <div className={`text-[26px] font-bold leading-none ${c.valCls}`}>{c.val}</div>
          <div className="text-[13px] font-bold text-muted-foreground mt-2 uppercase tracking-wide">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
