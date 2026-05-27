import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, AlertCircle } from 'lucide-react';

interface Props {
  origins: string[];
  destinations: string[];
  onFetch: (etdFrom: string, etdTo: string, origin: string, destination: string) => void;
  loading: boolean;
}

export default function FilterBlock({ origins, destinations, onFetch, loading }: Props) {
  const [etdFrom, setEtdFrom] = useState('');
  const [etdTo, setEtdTo] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');

  const reset = () => { setEtdFrom(''); setEtdTo(''); setOrigin(''); setDestination(''); setError(''); };

  const handleFetch = () => {
    const today = new Date().toISOString().split('T')[0];

    if (etdTo && etdTo >= today) {
      setError('For Current / Future ETD Insights kindly use ETD ACTIVE FORECASTS Section');
      return;
    }
    if (etdFrom && etdTo && etdTo < etdFrom) {
      setError('ETD TO cannot be less than ETD FROM');
      return;
    }
    setError('');
    onFetch(etdFrom, etdTo, origin, destination);
  };

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Filters</h3>
        <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <X className="w-3 h-3" /> Reset
        </button>
      </div>
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[140px] space-y-1.5">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">ETD From</Label>
          <Input type="date" value={etdFrom} onChange={e => { setEtdFrom(e.target.value); setError(''); }} />
        </div>
        <div className="flex-1 min-w-[140px] space-y-1.5">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">ETD To</Label>
          <Input type="date" value={etdTo} onChange={e => { setEtdTo(e.target.value); setError(''); }} />
        </div>
        <div className="flex-1 min-w-[180px] space-y-1.5">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Origin</Label>
          <Select value={origin || '__all__'} onValueChange={v => setOrigin(v === '__all__' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="All Origins" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Origins</SelectItem>
              {origins.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 min-w-[180px] space-y-1.5">
          <Label className="text-xs font-semibold uppercase text-muted-foreground">Destination</Label>
          <Select value={destination || '__all__'} onValueChange={v => setDestination(v === '__all__' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="All Destinations" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Destinations</SelectItem>
              {destinations.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleFetch} disabled={loading} size="lg" className="gap-2 px-8">
          <Search className="w-4 h-4" />
          {loading ? 'Loading…' : 'Fetch Data'}
        </Button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
