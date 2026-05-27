import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { getProjects, getCacheData, setCacheData, clearAllCache, Project } from '@/lib/indexedDB';
import { filterRows, getUniqueValues } from '@/lib/filterEngine';
import { computeKpis, normalizeRows, KpiResult, ETDRecord } from '@/lib/dataEngine';
import { fetchSheetData } from 'zite-endpoints-sdk';
import Header from '@/components/layout/Header';
import FilterBlock from '@/components/dashboard/FilterBlock';
import KpiBlock from '@/components/dashboard/KpiBlock';
import DrillBlock from '@/components/dashboard/DrillBlock';
import ChartBlock from '@/components/dashboard/ChartBlock';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Trash2, ArrowLeft, Database } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function DashboardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();


  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [allRows, setAllRows] = useState<ETDRecord[]>([]);
  const [kpis, setKpis] = useState<KpiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [failedOpen, setFailedOpen] = useState(false);



  useEffect(() => {
    if (projectId) {
      getProjects().then(list => {
        setProject(list.find(p => p.id === projectId) ?? null);
        setProjectLoading(false);
      });
    }
  }, [projectId]);

  useEffect(() => {
    if (project) autoLoad();
  }, [project]);

  const autoLoad = async () => {
    if (!project) return;
    setLoading(true);
    try {
      const key = `${project.id}_${project.sheetName}`;
      const cached = await getCacheData(key);
      if (cached) {
        setAllRows(cached.data);
        toast.success(`Loaded ${cached.data.length.toLocaleString()} rows from cache`);
      } else {
        await fetchAndStore(false);
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAndStore = async (force: boolean) => {
    if (!project) return;
    setLoading(true);
    setFetched(false);
    setKpis(null);
    setFailedOpen(false);
    try {
      const result = await fetchSheetData({
        sheetId: project.sheetId,
        sheetName: project.sheetName,
        serviceAccountJson: project.serviceAccountJson,
        startRow: project.startRow,
      });
      const normalized = normalizeRows(result.rows);
      await setCacheData(`${project.id}_${project.sheetName}`, normalized, result.columns);
      setAllRows(normalized);
      toast.success(`Fetched ${normalized.length.toLocaleString()} rows from Google Sheets`);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleFetch = (etdFrom: string, etdTo: string, origin: string, destination: string) => {
    const filtered = filterRows(allRows, etdFrom, etdTo, origin, destination);
    const computed = computeKpis(filtered);
    setKpis(computed);
    setFetched(true);
    setFailedOpen(false);
  };

  const handleClearCache = async () => {
    await clearAllCache();
    setAllRows([]);
    setKpis(null);
    setFetched(false);
    toast.success('Cache cleared');
  };

  const origins = useMemo(() => getUniqueValues(allRows, 'Origin'), [allRows]);
  const destinations = useMemo(() => getUniqueValues(allRows, 'Destination'), [allRows]);


  // Wait for project to load before showing "not found" — prevents flicker
  if (projectLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-6 py-8 max-w-7xl space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!projectLoading && !project) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-muted-foreground">Project not found.</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <Header />
      <main className="container mx-auto px-6 py-8 max-w-7xl space-y-6">
        {/* Top Bar */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/project/${projectId}/details`)} className="gap-1 -ml-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            {project && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground leading-none">{project.name}</h2>
                  <p className="text-xs text-muted-foreground">Sheet: {project.sheetName}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchAndStore(true)} disabled={loading} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearCache} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Clear Cache
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        )}

        {/* No data yet */}
        {!loading && allRows.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center space-y-4">
            <Database className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="font-bold text-foreground">No data loaded</h3>
            <p className="text-sm text-muted-foreground">Click Refresh to fetch from Google Sheets</p>
            <Button onClick={() => fetchAndStore(false)} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Load Data
            </Button>
          </div>
        )}

        {/* Main Content */}
        {!loading && allRows.length > 0 && (
          <>
            <FilterBlock origins={origins} destinations={destinations} onFetch={handleFetch} loading={loading} />

            {!fetched && (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Set your ETD date range and click <strong>Fetch Data</strong> to see analytics.
              </div>
            )}

            {fetched && kpis && (
              <>
                <KpiBlock
                  kpis={kpis}
                  onFailedClick={() => setFailedOpen(v => !v)}
                  failedActive={failedOpen}
                />
                {failedOpen && <DrillBlock kpis={kpis} />}
                <ChartBlock kpis={kpis} />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
