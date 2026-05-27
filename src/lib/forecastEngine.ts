import { ETDRecord } from './dataEngine';

export function normalizeDateFE(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  const match = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return trimmed;
}

export function getColVal(row: ETDRecord, colName: string): string {
  const key = Object.keys(row).find(k => k.trim().toLowerCase() === colName.toLowerCase());
  return key ? (row[key] ?? '').trim() : '';
}

export function findColByPartial(row: ETDRecord, partial: string): string {
  const key = Object.keys(row).find(k => k.trim().toLowerCase().includes(partial.toLowerCase()));
  return key ? (row[key] ?? '').trim() : '';
}

export function applyCustomerFilter(rows: ETDRecord[]): ETDRecord[] {
  return rows.filter(row => {
    const key = Object.keys(row).find(k => k.trim().toLowerCase() === 'customer');
    return key && row[key].trim() !== '';
  });
}

export type ForecastKpi = {
  date: string;
  total: ETDRecord[];
  rto: ETDRecord[];
  delivered: ETDRecord[];
  withinEtdDelivered: ETDRecord[];
  delayedEtdDelivered: ETDRecord[];
  pending: ETDRecord[];
};

export function computeGroups(rows: ETDRecord[], groupCol: string): ForecastKpi[] {
  const map: Record<string, ETDRecord[]> = {};
  for (const row of rows) {
    const date = getColVal(row, groupCol);
    if (!date) continue;
    if (!map[date]) map[date] = [];
    map[date].push(row);
  }
  return Object.entries(map).map(([date, dateRows]) => {
    const rto: ETDRecord[] = [];
    const delivered: ETDRecord[] = [];
    const withinEtdDelivered: ETDRecord[] = [];
    const delayedEtdDelivered: ETDRecord[] = [];
    const pending: ETDRecord[] = [];
    for (const row of dateRows) {
      const status = getColVal(row, 'status').toLowerCase();
      if (status.startsWith('rto')) { rto.push(row); continue; }
      const deliveryDate = getColVal(row, 'delivery date');
      if (deliveryDate && deliveryDate.trim() !== '') {
        // DELIVERED: any row where Delivery Date exists
        delivered.push(row);
        // Sub-KPIs: Within ETD vs Delayed ETD
        const etd = normalizeDateFE(getColVal(row, 'etd'));
        const del = normalizeDateFE(deliveryDate);
        if (del && etd && del <= etd) {
          withinEtdDelivered.push(row);
        } else {
          delayedEtdDelivered.push(row);
        }
      } else {
        // PENDING: only rows with no Delivery Date
        pending.push(row);
      }
    }
    return { date, total: dateRows, rto, delivered, withinEtdDelivered, delayedEtdDelivered, pending };
  }).sort((a, b) => a.date.localeCompare(b.date));
}

export function getUniqueColValues(rows: ETDRecord[], colName: string): string[] {
  const vals = new Set<string>();
  for (const row of rows) {
    const v = getColVal(row, colName);
    if (v) vals.add(v);
  }
  return Array.from(vals).sort();
}

export function toProperCase(s: string): string {
  return s.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
}

export function getStatusGroups(rows: ETDRecord[]): { status: string; rows: ETDRecord[] }[] {
  const map: Record<string, ETDRecord[]> = {};
  for (const row of rows) {
    const raw = getColVal(row, 'status');
    const s = raw ? toProperCase(raw) : '(blank)';
    if (!map[s]) map[s] = [];
    map[s].push(row);
  }
  return Object.entries(map)
    .map(([status, r]) => ({ status, rows: r }))
    .sort((a, b) => b.rows.length - a.rows.length);
}

export function getEtdGroups(rows: ETDRecord[]): { etd: string; rows: ETDRecord[] }[] {
  const map: Record<string, ETDRecord[]> = {};
  for (const row of rows) {
    const etd = getColVal(row, 'etd') || '(no ETD)';
    if (!map[etd]) map[etd] = [];
    map[etd].push(row);
  }
  return Object.entries(map)
    .map(([etd, r]) => ({ etd, rows: r }))
    .sort((a, b) => a.etd.localeCompare(b.etd));
}
