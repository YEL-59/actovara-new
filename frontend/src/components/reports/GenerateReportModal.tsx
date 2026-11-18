'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { Alert, Button, Modal, Select, StatusPill, useToast } from '@/components/ui';
import { errorMessage, reportsService } from '@/services';
import type { Property, Report } from '@/types/domain';

interface Props {
  open: boolean;
  onClose: () => void;
  properties: Property[];
  defaultPropertyId?: string;
  onGenerated: (report: Report) => void;
}

export function GenerateReportModal({ open, onClose, properties, defaultPropertyId, onGenerated }: Props) {
  const toast = useToast();
  const activeProps = properties.filter((p) => p.status === 'active');
  const [propertyId, setPropertyId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    const initial = defaultPropertyId && properties.some((p) => p._id === defaultPropertyId)
      ? defaultPropertyId
      : activeProps[0]?._id ?? properties[0]?._id ?? '';
    setPropertyId(initial);
  }, [open, defaultPropertyId, properties]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = properties.find((p) => p._id === propertyId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!propertyId) {
      setError('Select a property to generate a report.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await reportsService.generate(propertyId);
      toast.success('Compliance report generated', res.data.reference);
      onGenerated(res.data);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Generate compliance report" description="Captures a point-in-time snapshot of requirements, documents, and actions for one property.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert tone="error" title="Could not generate report">{error}</Alert>}

        <Select
          id="rpt-property"
          label="Property"
          required
          value={propertyId}
          onChange={(e) => setPropertyId(e.target.value)}
          options={[
            { value: '', label: 'Select a property…' },
            ...properties.map((p) => ({
              value: p._id,
              label: `${p.name} (${p.reference})${p.status === 'archived' ? ' [Archived]' : ''}`,
            })),
          ]}
        />

        {selected && (
          <div className="rounded-xl border border-line bg-canvas p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <FileText className="h-4 w-4 text-brand-600" aria-hidden />
                <span>Current property status</span>
              </div>
              <StatusPill kind="rag" value={selected.ragStatus} />
            </div>
            <dl className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
              {[
                ['Overdue', selected.counts?.overdue ?? 0],
                ['Due soon', selected.counts?.dueSoon ?? 0],
                ['Missing', selected.counts?.missing ?? 0],
                ['Open actions', selected.counts?.openActions ?? 0],
              ].map(([label, val]) => (
                <div key={label} className="rounded-lg bg-surface px-2 py-2 shadow-card">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="mt-0.5 text-base font-bold tabular-nums text-ink">{val}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <p className="text-xs text-ink-muted">
          The generated report freezes these figures at the exact time of creation. Subsequent updates will not alter historical reports.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saving} disabled={!propertyId}>
            Generate report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
