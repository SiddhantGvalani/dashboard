import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, Project } from '@/lib/indexedDB';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Plus, BarChart3, ArrowRight, Database } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const load = () => getProjects().then(p => { setProjects(p); setLoadingProjects(false); });

  useEffect(() => {
    load();
    const onFocus = () => getProjects().then(setProjects);
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-10 max-w-4xl">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-black text-foreground">Logistics Projects</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Select a project to view insights and analytics
            </p>
          </div>
          <Button onClick={() => navigate('/admin')} className="gap-2">
            <Plus className="w-4 h-4" /> Add Project
          </Button>
        </div>

        {loadingProjects ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24 space-y-5">
            <div className="inline-flex w-20 h-20 rounded-2xl bg-muted items-center justify-center">
              <BarChart3 className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">No projects yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first project by connecting a Google Sheet
              </p>
            </div>
            <Button onClick={() => navigate('/admin')} className="gap-2">
              <Plus className="w-4 h-4" /> Add Your First Project
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/project/${p.id}/details`)}
                className="group cursor-pointer w-full rounded-2xl border-2 border-border bg-card p-5 hover:border-primary hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Database className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground group-hover:text-primary transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">Sheet: {p.sheetName}</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
