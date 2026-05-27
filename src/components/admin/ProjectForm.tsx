import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Project } from '@/lib/indexedDB';
import { Info } from 'lucide-react';

type ProjectData = Omit<Project, 'id' | 'createdAt'>;

interface Props {
  initial?: Project;
  onSave: (data: ProjectData) => void;
  onCancel: () => void;
}

function extractSheetId(value: string): string {
  const match = value.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : value.trim();
}

export default function ProjectForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [sheetId, setSheetId] = useState(initial?.sheetId ?? '');
  const [sheetName, setSheetName] = useState(initial?.sheetName ?? '');
  const [startRowRaw, setStartRowRaw] = useState(
    initial?.startRow != null ? String(initial.startRow) : ''
  );
  const [serviceAccountJson, setServiceAccountJson] = useState(initial?.serviceAccountJson ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate & clamp startRow: must be >= 2, default to 2 if empty/invalid
    let startRow = parseInt(startRowRaw, 10);
    if (isNaN(startRow) || startRow < 2) startRow = 2;
    onSave({ name, sheetId: extractSheetId(sheetId), sheetName, serviceAccountJson, startRow });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Project Name</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q1 2024 Deliveries" required />
      </div>
      <div className="space-y-1.5">
        <Label>Sheet ID or Full URL</Label>
        <Input value={sheetId} onChange={e => setSheetId(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." required />
        <p className="text-xs text-muted-foreground">Paste the full URL or just the Sheet ID</p>
      </div>
      <div className="space-y-1.5">
        <Label>Sheet Tab Name</Label>
        <Input value={sheetName} onChange={e => setSheetName(e.target.value)} placeholder="e.g. Sheet1" required />
      </div>

      {/* ── Reference Start Row ── */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          Reference Start Row
          <span className="text-xs text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          type="number"
          min={2}
          value={startRowRaw}
          onChange={e => setStartRowRaw(e.target.value)}
          placeholder="e.g. 7851 (default: 2)"
          className="font-mono"
        />
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-accent/30 border border-border rounded-lg px-3 py-2.5">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-primary" />
          <span>
            Data will be fetched from this row onwards to the end of the sheet.
            Header is always read from <strong>Row 1</strong>.
            Leave blank to fetch all data (starts from row 2).
            Minimum allowed value is <strong>2</strong>.
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Service Account JSON</Label>
        <Textarea
          value={serviceAccountJson}
          onChange={e => setServiceAccountJson(e.target.value)}
          placeholder={'{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key": "...",\n  "client_email": "..."\n}'}
          rows={7}
          required
          className="font-mono text-xs"
        />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initial ? 'Update Project' : 'Add Project'}</Button>
      </div>
    </form>
  );
}
