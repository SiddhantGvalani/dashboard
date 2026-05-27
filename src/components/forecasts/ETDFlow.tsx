import { useState } from 'react';
import { ETDRecord } from '@/lib/dataEngine';
import { computeGroups, getUniqueColValues, getColVal, normalizeDateFE, ForecastKpi } from '@/lib/forecastEngine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, AlertCircle, CalendarRange } from 'lucide-react';
import DateGroupTable from './DateGroupTable';

interface Props { baseDataset: ETDRecord[]; columns: string[] }

export default function ETDFlow({ baseDataset }: Props) {
  const [etdFrom, setEtdFrom] = useState('');
  const [etdTo, setEtdTo] = useState('');
  const [origin, setOrigin] = useState('__all__');
  const [destination, setDestination] = useState('__all__');
  const [results, setResults] = useState<ForecastKpi[] | null>(null);
  const [filteredRows, setFilteredRows] = useState<ETDRecord[]>([]);
  const [error, setError] = useState('');

  const origins = getUniqueColValues(baseDataset, 'origin');
  const destinations = getUniqueColValues(baseDataset, 'destination');
  const today = new Date().toISOString().split('T')[0];

  function handleFetch() {
    setError('');
    if (!etdFrom || !etdTo) { setError('Please select both ETD From and ETD To dates.'); return; }
    if (etdFrom < today || etdTo < today) { setError('Only current or future ETD dates are allowed. Please select dates from today onwards.'); return; }
    if (etdFrom > etdTo) { setError('ETD From must be before or equal to ETD To.'); return; }

    let rows = baseDataset.filter(row => getColVal(row, 'etd').trim() !== '');
    rows = rows.filter(row => {
      const etd = normalizeDateFE(getColVal(row, 'etd'));
      return etd >= etdFrom && etd <= etdTo;
    });
    if (origin !== '__all__') rows = rows.filter(row => getColVal(row, 'origin') === origin);
    if (destination !== '__all__') rows = rows.filter(row => getColVal(row, 'destination') === destination);
    setFilteredRows(rows);
    setResults(computeGroups(rows, 'ETD'));
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-6 py-4 flex items-center gap-2">
        <CalendarRange className="w-5 h-5 text-primary" />
        <h3 className="text-base font-bold text-foreground">ETD Date Filter</h3>
        <span className="ml-auto text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">Base dataset: {baseDataset.length} shipments</span>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs font-bold mb-1.5 block uppercase tracking-wide">ETD From <span className="text-red-500">*</span></Label>
            <Input type="date" value={etdFrom} min={today} onChange={e => setEtdFrom(e.target.value)} className="font-medium" />
          </div>
          <div>
            <Label className="text-xs font-bold mb-1.5 block uppercase tracking-wide">ETD To <span className="text-red-500">*</span></Label>
            <Input type="date" value={etdTo} min={today} onChange={e => setEtdTo(e.target.value)} className="font-medium" />
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
            <Search className="w-4 h-4" /> Fetch ETD Data
          </Button>
        </div>

        {results !== null && (
          <div className="mt-8 border-t border-border pt-6">
            <h4 className="text-sm font-bold text-foreground mb-5 uppercase tracking-wide">
              Results — Grouped by ETD Date
              <span className="ml-2 text-xs font-normal text-muted-foreground normal-case">({filteredRows.length} shipments across {results.length} ETD date{results.length !== 1 ? 's' : ''})</span>
            </h4>
            <DateGroupTable groups={results} allRows={filteredRows} drilldownType="etd" groupLabel="ETD DATE" />
          </div>
        )}
      </div>
    </div>
  );
}
