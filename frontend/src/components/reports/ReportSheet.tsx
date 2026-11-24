'use client';

import { AlertTriangle, Building2, CheckCircle2, FileText } from 'lucide-react';
import { Logo } from '@/components/layout/Logo';
import { Badge, StatusPill } from '@/components/ui';
import { formatDate, formatDateTime, formatFileSize } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ReportView } from '@/types/domain';

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  residential: 'Residential',
  hmo: 'HMO',
  commercial: 'Commercial',
  mixed: 'Mixed / Multi-site',
};

export function ReportSheet({ report }: { report: ReportView }) {
  const snap = report.snapshotData;
  const openActions = snap?.actions.filter((a) => a.status !== 'closed') ?? [];
  const closedActions = snap?.actions.filter((a) => a.status === 'closed') ?? [];

  return (
    <article
      aria-label={`Compliance report ${report.reference}`}
      className={cn(
        'mx-auto w-full max-w-[210mm] rounded-xl border border-line bg-white p-6 text-ink shadow-card sm:p-10',
        'print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none',
      )}
    >
      {/* Header: Brand, Organisation, Reference & RAG */}
      <header className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <Logo tone="dark" size="sm" className="mb-2" />
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700">Compliance Snapshot</p>
          <h1 className="text-2xl font-bold tracking-tight text-ink">{snap?.property.name ?? report.propertyName}</h1>
          <p className="text-sm text-ink-muted">
            {snap?.organisation.name ?? 'Organisation'}
            {snap?.organisation.address ? ` · ${snap.organisation.address}` : ''}
          </p>
          {snap?.organisation.primaryContactEmail && (
            <p className="text-xs text-ink-muted">{snap.organisation.primaryContactEmail}</p>
          )}
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <StatusPill kind="rag" value={report.snapshot.rag} />
          <div className="text-left text-xs text-ink-muted sm:text-right">
            <p className="font-semibold text-ink">Ref: {report.reference}</p>
            <p>Generated: {formatDateTime(report.generatedAt)}</p>
            <p>Prepared by: {report.generatedBy.name}</p>
            <p>PDF size: {formatFileSize(report.file.sizeBytes)}</p>
          </div>
        </div>
      </header>

      {/* Property Details */}
      <section className="mt-6 break-inside-avoid rounded-xl border border-line bg-canvas p-4 print:bg-white">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
          <Building2 className="h-4 w-4" aria-hidden />
          <span>Property Details</span>
        </div>
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs text-ink-muted">Property Reference</dt>
            <dd className="font-semibold text-ink">{snap?.property.reference ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Property Type</dt>
            <dd className="font-semibold text-ink">{snap ? PROPERTY_TYPE_LABEL[snap.property.propertyType] ?? snap.property.propertyType : '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Assigned Manager</dt>
            <dd className="font-semibold text-ink">{snap?.property.managerName ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted">Address</dt>
            <dd className="font-semibold text-ink">
              {snap ? `${snap.property.address}, ${snap.property.postcode}` : '—'}
            </dd>
          </div>
        </dl>
      </section>

      {/* Executive Summary Counts */}
      <section className="mt-6 break-inside-avoid">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-muted">Executive Summary (At Generation Time)</h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {[
            ['Total Req.', report.snapshot.requirements, 'text-ink'],
            ['Valid', snap?.counts.valid ?? 0, 'text-ok-700'],
            ['Due Soon', report.snapshot.dueSoon, 'text-warn-700'],
            ['Overdue', report.snapshot.overdue, 'text-danger-700'],
            ['Missing', report.snapshot.missing, 'text-danger-700'],
            ['Store Only', snap?.counts.storeOnly ?? 0, 'text-ink-muted'],
            ['Open Actions', report.snapshot.openActions, 'text-brand-700'],
            ['Closed Actions', snap?.counts.closedActions ?? 0, 'text-ok-700'],
          ].map(([label, val, tone]) => (
            <div key={String(label)} className="rounded-lg border border-line bg-surface p-3 text-center">
              <dt className="text-[11px] font-medium text-ink-muted">{label}</dt>
              <dd className={cn('mt-1 text-xl font-bold tabular-nums', tone)}>{val}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Compliance Requirements Table */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-muted">
          <FileText className="h-4 w-4" aria-hidden />
          <span>Compliance Requirements Register</span>
        </h2>
        {!snap || snap.requirements.length === 0 ? (
          <p className="rounded-lg border border-line p-4 text-sm text-ink-muted">No requirements recorded in this snapshot.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead className="bg-table-head text-xs uppercase text-ink-muted">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Requirement</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Expiry Date</th>
                  <th className="px-3 py-2.5 font-semibold">Current Document</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {snap.requirements.map((r) => (
                  <tr key={r._id} className="break-inside-avoid">
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-ink">{r.complianceTypeName}</p>
                      <p className="text-xs capitalize text-ink-muted">
                        {r.category.replace('_', ' ')}
                        {r.affectsRag === false && <span className="normal-case"> · Stored only, not counted in RAG</span>}
                      </p>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusPill kind="requirement" value={r.status} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-ink">
                      {r.expiryDate ? formatDate(r.expiryDate) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-ink-muted">
                      {r.currentCertificateName ? `${r.currentCertificateName} (v${r.currentCertificateVersion ?? 1})` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Current Documents Table */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-muted">Current Certificates &amp; Documents</h2>
        {!snap || snap.certificates.length === 0 ? (
          <p className="rounded-lg border border-line p-4 text-sm text-ink-muted">No current certificates recorded in this snapshot.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead className="bg-table-head text-xs uppercase text-ink-muted">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Compliance Type</th>
                  <th className="px-3 py-2.5 font-semibold">File Name</th>
                  <th className="px-3 py-2.5 font-semibold">Ver.</th>
                  <th className="px-3 py-2.5 font-semibold">Issued</th>
                  <th className="px-3 py-2.5 font-semibold">Expires</th>
                  <th className="px-3 py-2.5 font-semibold">Uploaded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {snap.certificates.map((c) => (
                  <tr key={c._id} className="break-inside-avoid">
                    <td className="px-3 py-2.5 font-semibold text-ink">{c.complianceTypeName}</td>
                    <td className="px-3 py-2.5 text-ink">{c.fileName}</td>
                    <td className="px-3 py-2.5 tabular-nums">v{c.version}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{formatDate(c.issueDate)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">{c.expiryDate ? formatDate(c.expiryDate) : 'No expiry'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-ink-muted">{c.uploadedByName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Open Actions & Evidence */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-muted">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          <span>Open Actions ({openActions.length})</span>
        </h2>
        {openActions.length === 0 ? (
          <p className="rounded-lg border border-line p-4 text-sm text-ink-muted">No open remedial actions at generation time.</p>
        ) : (
          <div className="space-y-2.5">
            {openActions.map((a) => (
              <div key={a._id} className="break-inside-avoid rounded-lg border border-line p-3.5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink">
                    {a.reference} · {a.title}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <StatusPill kind="priority" value={a.priority} />
                    <StatusPill kind="action" value={a.status} />
                  </div>
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  Owner: {a.ownerName} · Due: {formatDate(a.dueDate)}
                </p>
                <p className="mt-1.5 text-xs text-ink">
                  <span className="font-semibold">Evidence references:</span>{' '}
                  {a.evidenceRefs.length > 0 ? a.evidenceRefs.join(', ') : 'None attached'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Closed Actions & Evidence */}
      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink-muted">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          <span>Closed Actions ({closedActions.length})</span>
        </h2>
        {closedActions.length === 0 ? (
          <p className="rounded-lg border border-line p-4 text-sm text-ink-muted">No closed actions recorded in this snapshot.</p>
        ) : (
          <div className="space-y-2.5">
            {closedActions.map((a) => (
              <div key={a._id} className="break-inside-avoid rounded-lg border border-line bg-canvas/60 p-3.5 text-sm print:bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-ink">
                    {a.reference} · {a.title}
                  </p>
                  <StatusPill kind="action" value={a.status} />
                </div>
                <p className="mt-1 text-xs text-ink-muted">
                  Owner: {a.ownerName} · Closed: {a.closedAt ? formatDate(a.closedAt) : '—'}
                </p>
                {a.completionMethod && (
                  <p className="mt-1 text-xs text-ink">
                    Completed {a.completionMethod === 'confirmation' ? 'by written confirmation' : 'with evidence'}
                    {a.completedByName ? ` by ${a.completedByName}` : ''}
                    {a.completionNote ? `: ${a.completionNote}` : ''}
                  </p>
                )}
                {a.closureSummary && <p className="mt-1 text-xs text-ink">Verification note: {a.closureSummary}</p>}
                <p className="mt-1 text-xs text-ink-muted">
                  <span className="font-semibold text-ink">Evidence references:</span>{' '}
                  {a.evidenceRefs.length > 0
                    ? a.evidenceRefs.join(', ')
                    : a.completionMethod === 'confirmation'
                      ? 'None (closed by written confirmation)'
                      : 'None attached'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Disclaimer Block (Placeholder until Q-011 is answered) */}
      <footer className="mt-8 break-inside-avoid rounded-xl border border-warn-200 bg-warn-50 p-4 text-xs text-ink">
        <div className="mb-1 flex items-center gap-2">
          <Badge tone="warn">Placeholder Disclaimer · Q-011</Badge>
          <span className="font-semibold text-ink-muted">Disclaimer version {report.disclaimerVersion}</span>
        </div>
        <p className="leading-relaxed text-ink">
          {snap?.disclaimerText ?? 'Placeholder disclaimer: awaiting final legal wording from client (Q-011).'}
        </p>
      </footer>
    </article>
  );
}
