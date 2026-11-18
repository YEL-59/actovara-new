'use client';

import Link from 'next/link';
import { FilePlus2, FileText, Scale, SquareCheck } from 'lucide-react';
import { CertificateVersionTimeline } from '@/components/certificates/CertificateVersionTimeline';
import { Alert, Button, Drawer, Skeleton, StatusPill } from '@/components/ui';
import { useApi } from '@/lib/hooks/useApi';
import { formatDate, formatRelativeDue } from '@/lib/format';
import { actionsService, certificatesService } from '@/services';
import type { ActionView, CertificateView, RequirementView } from '@/types/domain';

interface DrawerData {
  history: CertificateView[];
  actions: ActionView[];
}

async function load(r: RequirementView): Promise<{ data: DrawerData; success: boolean; statusCode: number }> {
  const [history, actions] = await Promise.all([
    r.currentCertificateId ? certificatesService.history(r.currentCertificateId).then((x) => x.data) : Promise.resolve([] as CertificateView[]),
    actionsService.list({ propertyId: r.propertyId, limit: 500 }).then((x) => x.data),
  ]);
  const certIds = new Set(history.map((c) => c._id));
  return { success: true, statusCode: 200, data: { history, actions: actions.filter((a) => a.certificateId && certIds.has(a.certificateId)) } };
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-[15px] font-bold text-ink [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-ink-muted">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

export function RequirementDrawer({
  requirement: r,
  canUpload,
  onClose,
  onUpload,
}: {
  requirement: RequirementView | null;
  canUpload: boolean;
  onClose: () => void;
  onUpload: (r: RequirementView) => void;
}) {
  const state = useApi(() => (r ? load(r) : Promise.resolve({ success: true, statusCode: 200, data: { history: [], actions: [] } })), [r?._id, r?.currentCertificateId]);
  if (!r) return null;
  const t = r.complianceType;
  const legislation = t.legislationRefs[t.legislationRefs.length - 1];


  return (
    <Drawer
      open
      onClose={onClose}
      title={t.name}
      description={`${t.code} · ${t.category}`}
      width="max-w-lg"
      footer={
        canUpload && r.applicability === 'applicable' ? (
          <Button leftIcon={<FilePlus2 className="h-4 w-4" />} onClick={() => onUpload(r)}>
            Upload new version
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-7">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill kind="requirement" value={r.status} size="md" />
          {r.nextDueDate && <span className="text-sm text-ink-muted">{formatRelativeDue(r.nextDueDate)}</span>}
        </div>
        {r.applicability === 'not_applicable' && r.naReason && (
          <Alert tone="info" title="Marked not applicable">
            {r.naReason}
          </Alert>
        )}

        <Section icon={<Scale />} title="Legislation reference">
          {legislation ? (
            <div className="rounded-lg border border-line bg-canvas p-4">
              <p className="whitespace-pre-line text-sm text-ink">{legislation.text}</p>
              <p className="mt-2 text-meta text-ink-muted">
                Version {legislation.version} · effective {formatDate(legislation.effectiveFrom)} · edited by {legislation.editedBy}
              </p>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">No legislation text recorded for this type.</p>
          )}
          <p className="text-meta text-ink-muted">Reference text for guidance only — not legal advice. Edited in Settings → Compliance types.</p>
        </Section>

        <Section icon={<FileText />} title="Certificate history">
          {state.loading && !state.data ? (
            <div className="space-y-3" aria-hidden>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : state.error ? (
            <Alert tone="error" title="Could not load history" onRetry={state.reload}>
              {state.error}
            </Alert>
          ) : (state.data?.history.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No certificate uploaded yet.</p>
          ) : (
            <CertificateVersionTimeline versions={state.data?.history ?? []} />
          )}
        </Section>

        <Section icon={<SquareCheck />} title="Linked actions">
          {state.loading && !state.data ? (
            <Skeleton className="h-12 w-full" />
          ) : (state.data?.actions.length ?? 0) === 0 ? (
            <p className="text-sm text-ink-muted">No actions linked to these certificates.</p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {state.data!.actions.map((a) => (
                <li key={a._id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div className="min-w-0">
                    <Link href={`/actions/${a._id}`} className="focus-ring rounded font-semibold text-ink hover:text-brand-600">
                      {a.reference} · {a.title}
                    </Link>
                    <p className={a.isOverdue ? 'text-meta font-semibold text-danger-700' : 'text-meta text-ink-muted'}>
                      {a.ownerName} · {a.status === 'closed' ? 'Closed' : formatRelativeDue(a.dueDate)}
                    </p>
                  </div>
                  <StatusPill kind="action" value={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </Drawer>
  );
}
