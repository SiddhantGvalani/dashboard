import { Calendar, Zap, Plus, Minus } from 'lucide-react';

type Flow = 'etd' | 'booking' | null;

interface Props {
  activeFlow: Flow;
  onSelect: (flow: Flow) => void;
}

export default function FlowSelector({ activeFlow, onSelect }: Props) {
  const toggle = (flow: 'etd' | 'booking') => onSelect(activeFlow === flow ? null : flow);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <FlowCard
        icon={<Calendar className="w-8 h-8 text-primary" />}
        title="FETCH DATA BASED ON ETD DATE"
        subtitle="Future Delivery Planning"
        description="Analyze upcoming shipments Filtered by ETD date."
        active={activeFlow === 'etd'}
        onClick={() => toggle('etd')}
      />
      <FlowCard
        icon={<Zap className="w-8 h-8 text-primary" />}
        title="FETCH DATA BASED ON BOOKING DATE"
        subtitle="Pipeline Analysis"
        description="Analyze upcoming shipments Filtered by Booking date"
        active={activeFlow === 'booking'}
        onClick={() => toggle('booking')}
      />
    </div>
  );
}

function FlowCard({ icon, title, subtitle, description, active, onClick }: {
  icon: React.ReactNode; title: string; subtitle: string; description: string; active: boolean; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-2xl border-2 p-8 transition-all duration-200 hover:-translate-y-0.5 select-none ${
        active ? 'border-primary bg-primary/5 shadow-xl' : 'border-border bg-card hover:border-primary/50 hover:shadow-lg'
      }`}
    >
      <div className="flex items-start justify-between mb-6">
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${active ? 'bg-primary/20' : 'bg-primary/10'}`}>
          {icon}
        </div>
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${active ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground group-hover:border-primary/50'}`}>
          {active ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </div>
      </div>
      <h2 className={`text-base font-black tracking-wide leading-snug ${active ? 'text-primary' : 'text-foreground group-hover:text-primary'} transition-colors`}>
        {title}
      </h2>
      <p className="text-sm font-semibold text-muted-foreground mt-1">({subtitle})</p>
      <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{description}</p>
      <div className="mt-5">
        <span className={`inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}>
          {active ? 'Click to collapse' : 'Click to expand'}
        </span>
      </div>
    </div>
  );
}
