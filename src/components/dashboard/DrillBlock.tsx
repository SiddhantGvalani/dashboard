import { ChevronDown, Clock, AlertTriangle } from 'lucide-react';
import DrillSection from './DrillSection';
import { KpiResult } from '@/lib/dataEngine';

interface Props {
  kpis: KpiResult;
}

// Columns shown in UI table (download always includes ALL columns)
const DELAYED_DISPLAY_COLS = ['Status', 'Delivery Date', 'Customer Remarks'];
const NOT_YET_DISPLAY_COLS = ['Status', 'Customer Remarks'];
const AGING_COLS = ['Hub', 'Status', 'ETD'];

export default function DrillBlock({ kpis }: Props) {
  return (
    <div className="space-y-4 pl-4 border-l-4 border-red-300 ml-2">
      <div className="flex items-center gap-2">
        <ChevronDown className="w-4 h-4 text-red-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-red-600">
          ETD Crossed Breakdown — Click a card to expand status groups
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <DrillSection
          label="Delayed Delivered Shipments"
          rows={kpis.delayed}
          exportName="delayed_delivered_shipments"
          displayColumns={DELAYED_DISPLAY_COLS}
          icon={<Clock className="w-6 h-6" />}
        />
        <DrillSection
          label="Not Yet Delivered"
          rows={kpis.notDelivered}
          exportName="not_yet_delivered"
          displayColumns={NOT_YET_DISPLAY_COLS}
          icon={<AlertTriangle className="w-6 h-6" />}
        />
        <DrillSection
          label="Aging"
          rows={kpis.aging}
          exportName="Aging Shipments"
          displayColumns={AGING_COLS}
          icon={<AlertTriangle className="w-6 h-6" />}
        />
      </div>
    </div>
  );
}
