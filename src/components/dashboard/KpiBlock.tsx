import { Package, Archive, CheckCircle2, XCircle } from 'lucide-react';
import KpiCard from './KpiCard';
import { KpiResult } from '@/lib/dataEngine';

interface Props {
  kpis: KpiResult;
  onFailedClick: () => void;
  failedActive: boolean;
}

export default function KpiBlock({ kpis, onFailedClick, failedActive }: Props) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
        KPI Summary — {kpis.total.length.toLocaleString()} records
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="Total Shipments"
          count={kpis.total.length}
          color="default"
          icon={<Package className="w-6 h-6" />}
          data={kpis.total}
          exportName="total_shipments"
        />
        <KpiCard
          label="RTO"
          count={kpis.closed.length}
          color="orange"
          icon={<Archive className="w-6 h-6" />}
          data={kpis.closed}
          exportName="rto"
        />
        <KpiCard
          label="ETD Delivered Shipments"
          count={kpis.delivered.length}
          color="green"
          icon={<CheckCircle2 className="w-6 h-6" />}
          data={kpis.delivered}
          exportName="etd_delivered_shipments"
        />
        <KpiCard
          label="ETD Crossed Shipments"
          count={kpis.failed.length}
          color="red"
          icon={<XCircle className="w-6 h-6" />}
          data={kpis.failed}
          exportName="etd_crossed_shipments"
          onClick={onFailedClick}
          active={failedActive}
          clickable
        />
        <KpiCard
          label="Aging Shipments"
          count={kpis.aging.length}
          color="red"
          icon={<XCircle className="w-6 h-6" />}
          data={kpis.aging}
          exportName="aging_shipments"
          onClick={onFailedClick}
          active={failedActive}
          clickable
        />
      </div>
    </div>
  );
}
