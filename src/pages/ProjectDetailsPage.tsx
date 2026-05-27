import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { getProjects, Project } from '@/lib/indexedDB';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, History, Zap, ArrowRight, Database } from 'lucide-react';

export default function ProjectDetailsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      getProjects().then(list => {
        setProject(list.find(p => p.id === projectId) ?? null);
        setIsLoading(false);
      });
    }
  }, [projectId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-6 py-10 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-1 -ml-2 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Button>

        {/* Loading state — no flicker */}
        {isLoading && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-10">
              <Skeleton className="w-16 h-16 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-52 rounded-2xl" />
              <Skeleton className="h-52 rounded-2xl" />
            </div>
          </div>
        )}

        {/* Only show "not found" after loading completes */}
        {!isLoading && !project && (
          <p className="text-muted-foreground">Project not found.</p>
        )}

        {!isLoading && project && (
          <>
            {/* Project Header */}
            <div className="flex items-center gap-4 mb-10">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Database className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-foreground leading-tight">{project.name}</h1>
                <p className="text-muted-foreground mt-1">Sheet: {project.sheetName}</p>
              </div>
            </div>

            {/* Insight Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ETD Historical Insights */}
              <div
                className="group cursor-pointer rounded-2xl border-2 border-border bg-card p-8 hover:border-primary hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
                onClick={() => navigate(`/project/${projectId}/dashboard`)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <History className="w-7 h-7 text-primary" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-1" />
                </div>
                <h2 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">
                  ETD Historical Insights
                </h2>
                <p className="text-sm text-muted-foreground mt-1 font-medium">Past ETD Dates</p>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  Analyse past ETD KPI and Failure pattern.
                </p>
                <div className="mt-6">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                    Open Dashboard <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* ETD Active Forecasts */}
              <div
                className="group cursor-pointer rounded-2xl border-2 border-border bg-card p-8 hover:border-primary hover:shadow-xl transition-all duration-200 hover:-translate-y-1"
                onClick={() => navigate(`/project/${projectId}/forecasts`)}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Zap className="w-7 h-7 text-primary" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all mt-1" />
                </div>
                <h2 className="text-xl font-black text-foreground group-hover:text-primary transition-colors">
                  ETD Active Forecasts
                </h2>
                <p className="text-sm text-muted-foreground mt-1 font-medium">Current / Future ETD Dates</p>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  Live view of Upcoming ETD Forecasts.
                </p>
                <div className="mt-6">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                    Open Forecasts <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
}
