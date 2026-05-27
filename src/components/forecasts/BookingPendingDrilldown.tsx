// This component is superseded by the inline PendingDrilldown inside BookingDateTable.tsx
// Kept as a stub to avoid any stale imports
import { ETDRecord } from '@/lib/dataEngine';

interface Props { rows: ETDRecord[] }

export default function BookingPendingDrilldown({ rows: _ }: Props) {
  return null;
}
