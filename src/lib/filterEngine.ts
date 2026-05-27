import { ETDRecord, normalizeDate } from './dataEngine';

export function filterRows(
  rows: ETDRecord[],
  etdFrom: string,
  etdTo: string,
  origin: string,
  destination: string
): ETDRecord[] {
  return rows.filter(row => {
    const etd = normalizeDate(row['ETD'] ?? '');
    if (!etd) return false;
    if (etdFrom && etd < etdFrom) return false;
    if (etdTo && etd > etdTo) return false;
    if (origin && row['Origin']?.trim() !== origin) return false;
    if (destination && row['Destination']?.trim() !== destination) return false;
    return true;
  });
}

export function getUniqueValues(rows: ETDRecord[], column: string): string[] {
  const values = new Set<string>();
  for (const row of rows) {
    const val = row[column]?.trim();
    if (val) values.add(val);
  }
  return Array.from(values).sort();
}
