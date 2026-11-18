'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { Alert, Badge, Button, Drawer, Textarea, useToast } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { complianceTypesService, errorMessage } from '@/services';
import type { ComplianceType } from '@/types/domain';

interface LegislationHistoryDrawerProps {
  complianceType: ComplianceType | null;
  onClose: () => void;
  canEdit: boolean;
  onUpdated: () => void;
}

export function LegislationHistoryDrawer({ complianceType, onClose, canEdit, onUpdated }: LegislationHistoryDrawerProps) {
  const { toast } = useToast();
  const [newText, setNewText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (complianceType) {
      const latest = complianceType.legislationRefs[complianceType.legislationRefs.length - 1];
      setNewText(latest?.text ?? '');
      setError(null);
    }
  }, [complianceType]);

  if (!complianceType) return null;

  const versions = [...complianceType.legislationRefs].sort((a, b) => b.version - a.version);
  const latestText = versions[0]?.text ?? '';

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) {
      setError('Enter the legislation reference text.');
      return;
    }
    if (newText.trim() === latestText) {
      setError('Update the text to publish a new version.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await complianceTypesService.update(complianceType._id, { legislation: newText.trim() });
      toast({ tone: 'success', title: `Published legislation v${(versions[0]?.version ?? 0) + 1}` });
      onUpdated();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={!!complianceType}
      onClose={onClose}
      width="max-w-lg"
      title={`Legislation history — ${complianceType.code}`}
      description={complianceType.name}
    >
      <div className="space-y-6">
        {canEdit && (
          <form onSubmit={handlePublish} className="space-y-3 rounded-xl border border-line bg-canvas p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink">Publish new version</span>
              <Badge tone="neutral">Next: v{(versions[0]?.version ?? 0) + 1}</Badge>
            </div>
            {error && <Alert tone="error" title={error} />}
            <Textarea
              label="Reference text"
              hideLabel
              rows={3}
              value={newText}
              onChange={(e) => {
                setNewText(e.target.value);
                setError(null);
              }}
              placeholder="Enter statutory regulation or guidance reference..."
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" isLoading={saving} leftIcon={<Plus className="h-4 w-4" />}>
                Publish version
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-ink">Version history ({versions.length})</h3>
          {versions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line p-6 text-center text-sm text-ink-muted">
              <BookOpen className="mx-auto mb-2 h-6 w-6 text-ink-subtle" />
              No legislation reference recorded yet.
            </div>
          ) : (
            <ol className="space-y-3">
              {versions.map((ref, idx) => (
                <li key={ref.version} className="rounded-xl border border-line bg-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge tone={idx === 0 ? 'info' : 'neutral'}>v{ref.version}</Badge>
                      {idx === 0 && <Badge tone="ok">Current</Badge>}
                    </div>
                    <span className="text-meta text-ink-muted">{formatDateTime(ref.effectiveFrom)}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink">{ref.text}</p>
                  <p className="mt-2 text-meta text-ink-muted">Edited by {ref.editedBy}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Drawer>
  );
}
