import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ETDRecord } from '@/lib/dataEngine';
import { exportToCSV } from '@/lib/exportUtils';

type CardColor = 'default' | 'orange' | 'green' | 'red' | 'yellow' | 'blue';

interface Props {
  label: string;
  count: number;
  color: CardColor;
  icon: React.ReactNode;
  data: ETDRecord[];
  exportName: string;
  onClick?: () => void;
  active?: boolean;
  clickable?: boolean;
}

const styles: Record<CardColor, string> = {
  default: 'bg-card border-border',
  orange: 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800',
  green: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800',
  red: 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800',
  yellow: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800',
  blue: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800',
};

const textStyles: Record<CardColor, string> = {
  default: 'text-foreground',
  orange: 'text-orange-700 dark:text-orange-400',
  green: 'text-green-700 dark:text-green-400',
  red: 'text-red-700 dark:text-red-400',
  yellow: 'text-yellow-700 dark:text-yellow-400',
  blue: 'text-blue-700 dark:text-blue-400',
};

export default function KpiCard({ label, count, color, icon, data, exportName, onClick, active, clickable }: Props) {
  return (
    <div
      className={`relative rounded-2xl border-2 p-5 transition-all duration-200 select-none
        ${styles[color]}
        ${clickable ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg' : ''}
        ${active ? 'ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-lg' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`${textStyles[color]} opacity-70`}>{icon}</div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 opacity-50 hover:opacity-100 -mt-1 -mr-1"
          title={`Download ${label} CSV`}
          onClick={e => { e.stopPropagation(); exportToCSV(data, `${exportName}.csv`); }}
        >
          <Download className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className={`text-4xl font-black ${textStyles[color]}`}>{count.toLocaleString()}</div>
      <div className={`text-xs font-bold uppercase tracking-widest mt-1.5 ${textStyles[color]} opacity-70`}>
        {label}
      </div>
      {clickable && (
        <div className={`text-xs mt-2 ${textStyles[color]} opacity-50`}>Click to drill down ↓</div>
      )}
    </div>
  );
}
