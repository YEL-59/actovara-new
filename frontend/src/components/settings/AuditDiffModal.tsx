'use client';

import { Badge, Button, Modal } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { actorRoleLabel } from '@/lib/permissions';
import type { AuditEvent } from '@/types/domain';

interface AuditDiffModalProps {
  event: AuditEvent | null;
  onClose: () => void;
}

function formatVal(v: unknown): string {
  if (v === undefined) return '—';
  if (v === null) return 'null';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

export function AuditDiffModal({ event, onClose }: AuditDiffModalProps) {
  if (!event) return null;

  const keys = Array.from(
    new Set([...Object.keys(event.before ?? {}), ...Object.keys(event.after ?? {})]),
  );

  return (
    <Modal
      open={!!event}
      onClose={onClose}
      size="lg"
      title="Audit event details"
      description={event.summary}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        <dl className="grid grid-cols-1 gap-3 rounded-xl border border-line bg-canvas p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-meta text-ink-muted">Actor</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {event.actorName}{' '}
              <span className="text-meta font-normal text-ink-muted">({actorRoleLabel(event.actorRole)})</span>
            </dd>
          </div>
          <div>
            <dt className="text-meta text-ink-muted">Timestamp</dt>
            <dd className="mt-0.5 font-medium text-ink">{formatDateTime(event.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-meta text-ink-muted">Action &amp; Entity</dt>
            <dd className="mt-0.5 flex items-center gap-2">
              <Badge tone="info">{event.action}</Badge>
              <span className="font-mono text-xs text-ink-muted">
                {event.entityType}
                {event.entityId ? ` · ${event.entityId}` : ''}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-meta text-ink-muted">IP Address</dt>
            <dd className="mt-0.5 font-mono text-xs text-ink">{event.ip}</dd>
          </div>
        </dl>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-ink">Before / After Diff</h3>
          {keys.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line p-5 text-center text-sm text-ink-muted">
              No field-level changes were recorded for this event.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-table-head text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-4 py-2.5">Field</th>
                    <th className="px-4 py-2.5">Before</th>
                    <th className="px-4 py-2.5">After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {keys.map((key) => {
                    const beforeVal = formatVal(event.before?.[key]);
                    const afterVal = formatVal(event.after?.[key]);
                    const changed = beforeVal !== afterVal;
                    return (
                      <tr key={key} className={changed ? 'bg-warn-50/40' : undefined}>
                        <td className="px-4 py-2.5 font-mono text-xs font-medium text-ink">{key}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-danger-700">{beforeVal}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-ok-700">{afterVal}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
