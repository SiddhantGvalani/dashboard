export type ETDRecord = Record<string, string>;

export interface KpiResult {
  total: ETDRecord[];
  closed: ETDRecord[];
  delivered: ETDRecord[];
  failed: ETDRecord[];
  delayed: ETDRecord[];
  notDelivered: ETDRecord[];
}

export function normalizeDate(dateStr: string): string {
  if (!dateStr) return '';
  const trimmed = dateStr.trim();
  // Support DD/MM/YYYY or DD-MM-YYYY → ISO YYYY-MM-DD
  const match = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (match) {
    const [, dd, mm, yyyy] = match;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return trimmed;
}

export function normalizeRows(rows: ETDRecord[]): ETDRecord[] {
  return rows.map(row => {
    const out: ETDRecord = {};
    for (const key of Object.keys(row)) {
      out[key] = row[key]?.trim() ?? '';
    }
    return out;
  });
}

// Single-pass KPI engine
export function computeKpis(rows: ETDRecord[]): KpiResult {
  const total: ETDRecord[] = [];
  const closed: ETDRecord[] = [];
  const delivered: ETDRecord[] = [];
  const failed: ETDRecord[] = [];
  const delayed: ETDRecord[] = [];
  const notDelivered: ETDRecord[] = [];

  for (const row of rows) {
    total.push(row);
    const normalizedStatus = (row['Status'] || '').toString().trim().toLowerCase();
    const etd = normalizeDate(row['ETD'] ?? '');
    const deliveryDate = normalizeDate(row['Delivery Date'] ?? '');

    if (normalizedStatus.startsWith('rto')) {
      closed.push(row);
      continue;
    }

    if (deliveryDate && deliveryDate <= etd) {
      delivered.push(row);
    } else {
      failed.push(row);
      if (deliveryDate && deliveryDate > etd) {
        delayed.push(row);
      } else {
        notDelivered.push(row);
      }
    }
  }

  return { total, closed, delivered, failed, delayed, notDelivered };
}

function toProperCase(s: string): string {
  return s.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase());
}

export function getStatusGroupsWithRows(rows: ETDRecord[]): { status: string; count: number; rows: ETDRecord[] }[] {
  const map: Record<string, { count: number; rows: ETDRecord[] }> = {};
  for (const row of rows) {
    const raw = (row['Status'] || '').toString().trim();
    const s = raw ? toProperCase(raw) : '(blank)';
    if (!map[s]) map[s] = { count: 0, rows: [] };
    map[s].count++;
    map[s].rows.push(row);
  }
  return Object.entries(map)
    .map(([status, v]) => ({ status, count: v.count, rows: v.rows }))
    .sort((a, b) => b.count - a.count);
}

export function getStatusGroups(rows: ETDRecord[]): { status: string; count: number }[] {
  return getStatusGroupsWithRows(rows).map(({ status, count }) => ({ status, count }));
}
