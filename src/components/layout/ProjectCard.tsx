import { ArrowRight, Database } from 'lucide-react';
import { Project } from '@/lib/indexedDB';

interface Props {
  project: Project;
  onClick: () => void;
}

export default function ProjectCard({ project, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-2xl border-2 border-border bg-card p-6 hover:border-primary hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Database className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Sheet: {project.sheetName}</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate max-w-[160px]">
              {project.sheetId}
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
      </div>
    </div>
  );
}
