import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { getProjects, getCacheData, setCacheData, Project } from '@/lib/indexedDB';
import { applyCustomerFilter } from '@/lib/forecastEngine';
import { fetchForecastData } from 'zite-endpoints-sdk';
import { ETDRecord } from '@/lib/dataEngine';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import FlowSelector from '@/components/forecasts/FlowSelector';
import ETDFlow from '@/components/forecasts/ETDFlow';
import BookingFlow from '@/components/forecasts/BookingFlow';

type ActiveFlow = 'etd' | 'booking' | null;

export default function ActiveForecastsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [baseDataset, setBaseDataset] = useState<ETDRecord[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');
  const [activeFlow, setActiveFlow] = useState<ActiveFlow>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  useEffect(() => {
    if (projectId) {
      getProjects().then(list => {
        const p = list.find(pr => pr.id === projectId) ?? null;
        setProject(p);
        setProjectLoading(false);
        if (p) loadData(p);
      });
    }
  }, [projectId]);

  async function loadData(p: Project, forceRefresh = false) {
    const cacheKey = `forecast_${p.id}`;
    if (!forceRefresh) {
      const cached = await getCacheData(cacheKey);
      if (cached) {
        setBaseDataset(applyCustomerFilter(cached.data));
        setColumns(cached.columns);
        setLastFetched(new Date());
        return;
      }
    }
    setFetching(true);
    setError('');
    try {
      const result = await fetchForecastData({
        sheetId: p.sheetId,
        sheetName: p.sheetName,
        serviceAccountJson: p.serviceAccountJson,
        startRow: p.startRow,
      });
      await setCacheData(cacheKey, result.rows, result.columns);
      setBaseDataset(applyCustomerFilter(result.rows));
      setColumns(result.columns);
      setLastFetched(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch data');
    } finally {
      setFetching(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/project/${projectId}/details`)} className="gap-1.5 -ml-2">
            <ArrowLeft className="w-4 h-4" /> Back to Project
          </Button>
          {project && (
            <Button variant="outline" size="sm" onClick={() => loadData(project, true)} disabled={fetching} className="gap-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${fetching ? 'animate-spin' : ''}`} />
              {fetching ? 'Refreshing…' : 'Refresh Data'}
            </Button>
          )}
        </div>

        {/* Page header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-foreground leading-tight">ETD Active Forecasts</h1>
            {project && <p className="text-muted-foreground mt-0.5 text-sm">{project.name} · {project.sheetName}</p>}
            {lastFetched && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Base dataset: <strong>{baseDataset.length}</strong> shipments with customer ·{' '}
                Last fetched {lastFetched.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
        )}

        {/* Project loading skeleton — prevents "not found" flicker */}
        {projectLoading && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-muted animate-pulse" />
              <div className="space-y-2">
                <div className="h-8 w-64 bg-muted rounded animate-pulse" />
                <div className="h-4 w-40 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {!projectLoading && fetching && !baseDataset.length ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <Skeleton className="h-52 rounded-2xl" />
              <Skeleton className="h-52 rounded-2xl" />
            </div>
          </div>
        ) : !projectLoading && (
          <div className="space-y-6">
            <FlowSelector activeFlow={activeFlow} onSelect={setActiveFlow} />
            {activeFlow === 'etd' && <ETDFlow baseDataset={baseDataset} columns={columns} />}
            {activeFlow === 'booking' && <BookingFlow baseDataset={baseDataset} columns={columns} />}
          </div>
        )}
      </main>
    </div>
  );
}
