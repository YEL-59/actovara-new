'use client';

import { useMemo, useState } from 'react';
import { Calculator, CalendarClock, Eye, FilePlus2, ListChecks, Search, Timer } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  EmptyState,
  Input,
  Select,
  StatusPill,
  Table,
  TBody,
  TD,
  TH,
  THead,
  Tooltip,
  TR,
  useToast,
  type MenuItem,
} from '@/components/ui';
import { affectsRag, expiryMode } from '@/lib/documents';
import { formatDate } from '@/lib/format';
import { requirementStatusMeta } from '@/lib/status';
import { cn } from '@/lib/utils';
import { errorMessage, propertiesService } from '@/services';
import type { RequirementStatus, RequirementView } from '@/types/domain';
import { NotApplicableModal, RenewalOverrideModal } from './RequirementModals';

export const STATUS_FILTERS: { value: RequirementStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  ...(Object.keys(requirementStatusMeta) as RequirementStatus[]).map((s) => ({ value: s, label: requirementStatusMeta[s].label })),
];

export interface RegisterTabProps {
  requirements: RequirementView[];
  editable: boolean;
  canUpload: boolean;
  statusFilter: RequirementStatus | '';
  onStatusFilter: (s: RequirementStatus | '') => void;
  onOpen: (r: RequirementView) => void;
  onUpload: (r: RequirementView) => void;
}

/** Toggle shown in each row. Off → asks for a reason; On → applies immediately. */
function ApplicabilityToggle({ r, disabled, busy, onToggle }: { r: RequirementView; disabled: boolean; busy: boolean; onToggle: () => void }) {
  const on = r.applicability === 'applicable';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${r.complianceType.name} applies to this property`}
      disabled={disabled || busy}
      onClick={onToggle}
      className={cn(
        'focus-ring relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        on ? 'bg-brand-600' : 'bg-neutral-100 ring-1 ring-inset ring-line',
        busy && 'animate-pulse',
      )}
    >
      <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', on ? 'translate-x-[22px]' : 'translate-x-0.5')} />
    </button>
  );
}

/** Small tag for document types that are stored against the property without affecting its RAG status. */
function NotInRag({ r }: { r: RequirementView }) {
  if (affectsRag(r.complianceType)) return null;
  return (
    <Tooltip content="Stored and tracked for this property, but it never changes the RAG status.">
      <span className="ml-1.5 inline-flex rounded bg-neutral-100 px-1.5 py-0.5 align-middle text-[11px] font-bold uppercase tracking-wide text-ink-muted">
        Not in RAG
      </span>
    </Tooltip>
  );
}

function Renewal({ r }: { r: RequirementView }) {
  const t = r.complianceType;
  if (t.storeOnly) return <span className="text-ink-muted">Store only</span>;
  if (r.renewalMonthsOverride == null && expiryMode(t) === 'on_upload') return <span className="text-ink-muted">Set on upload</span>;
  if (r.renewalMonthsOverride != null) {
    return (
      <span className="inline-flex items-center gap-1.5">
        {r.renewalMonthsOverride} mo
        <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-700">Override</span>
      </span>
    );
  }
  return t.defaultRenewalMonths ? <span>{t.defaultRenewalMonths} mo</span> : <span className="text-ink-muted">—</span>;
}

function Expiry({ r }: { r: RequirementView }) {
  const c = r.currentCertificate;
  if (!c?.expiryDate) return <span className="text-ink-muted">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      {formatDate(c.expiryDate)}
      {c.expiryCalculated && (
        <Tooltip content="Calculated from the issue date and the renewal interval (no expiry on the certificate).">
          <span tabIndex={0} className="focus-ring inline-flex items-center gap-1 rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-neutral-700">
            <Calculator className="h-3 w-3" aria-hidden />
            Calculated
          </span>
        </Tooltip>
      )}
    </span>
  );
}

export function RegisterTab({ requirements, editable, canUpload, statusFilter, onStatusFilter, onOpen, onUpload }: RegisterTabProps) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [naTarget, setNaTarget] = useState<RequirementView | null>(null);
  const [renewalTarget, setRenewalTarget] = useState<RequirementView | null>(null);

  const categories = useMemo(() => Array.from(new Set(requirements.map((r) => r.complianceType.category))).sort(), [requirements]);
  const rows = requirements.filter(
    (r) =>
      (!statusFilter || r.status === statusFilter) &&
      (!category || r.complianceType.category === category) &&
      (!search.trim() || `${r.complianceType.name} ${r.complianceType.code}`.toLowerCase().includes(search.trim().toLowerCase())),
  );
  const filtered = Boolean(statusFilter || category || search.trim());

  const toggle = async (r: RequirementView) => {
    if (r.applicability === 'applicable') {
      setNaTarget(r);
      return;
    }
    setBusyId(r._id);
    try {
      await propertiesService.updateRequirement(r._id, { applicability: 'applicable', renewalMonthsOverride: r.renewalMonthsOverride ?? null });
      toast.success(`${r.complianceType.name} marked applicable`, 'Status and property RAG recalculated.');
    } catch (err) {
      toast.error('Could not update requirement', errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const menu = (r: RequirementView): MenuItem[] => {
    const items: MenuItem[] = [{ label: 'View details', icon: <Eye className="h-4 w-4" />, onSelect: () => onOpen(r) }];
    if (canUpload && r.applicability === 'applicable') items.push({ label: 'Upload certificate', icon: <FilePlus2 className="h-4 w-4" />, onSelect: () => onUpload(r) });
    if (editable && !r.complianceType.storeOnly) items.push({ label: 'Renewal interval', icon: <Timer className="h-4 w-4" />, onSelect: () => setRenewalTarget(r) });
    return items;
  };

  const clear = () => {
    setSearch('');
    setCategory('');
    onStatusFilter('');
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px_200px_auto] lg:items-end">
        <Input label="Search requirements" hideLabel leftIcon={<Search />} placeholder="Search compliance types" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select label="Category" hideLabel value={category} onChange={(e) => setCategory(e.target.value)} options={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))]} />
        <Select label="Status" hideLabel value={statusFilter} onChange={(e) => onStatusFilter(e.target.value as RequirementStatus | '')} options={STATUS_FILTERS} />
        <Button variant="ghost" size="sm" onClick={clear} disabled={!filtered} className="justify-self-start text-brand-600">
          Clear
        </Button>
      </div>

      {requirements.length === 0 ? (
        <EmptyState
          icon={<ListChecks />}
          title="No requirements yet"
          description="Requirements are created from the compliance catalogue for this property type. Add types under Settings → Compliance types."
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Search />}
          title="No requirements match"
          description="Try another status, category or search term."
          action={
            <Button variant="secondary" onClick={clear}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <>
          {/* Mobile cards (<640px) */}
          <ul className="space-y-3 sm:hidden">
            {rows.map((r) => (
              <li key={r._id} className={cn('rounded-xl border border-line bg-surface p-4 shadow-card', r.applicability === 'not_applicable' && 'bg-canvas')}>
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => onOpen(r)} className="focus-ring min-w-0 rounded text-left">
                    <p className="font-semibold text-ink hover:text-brand-600">{r.complianceType.name}</p>
                    <p className="text-meta text-ink-muted">
                      {r.complianceType.category}
                      <NotInRag r={r} />
                    </p>
                  </button>
                  <DropdownMenu items={menu(r)} label={`Options for ${r.complianceType.name}`} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusPill kind="requirement" value={r.status} />
                  {r.currentCertificate && <span className="text-sm text-ink-muted">v{r.currentCertificate.version}</span>}
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <dt className="text-ink-muted">Expiry</dt>
                  <dd>
                    <Expiry r={r} />
                  </dd>
                  <dt className="text-ink-muted">Renewal</dt>
                  <dd>
                    <Renewal r={r} />
                  </dd>
                </dl>
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
                  <span className="text-sm font-medium text-ink">Applies</span>
                  <ApplicabilityToggle r={r} disabled={!editable} busy={busyId === r._id} onToggle={() => void toggle(r)} />
                </div>
                {r.naReason && <p className="mt-2 text-sm text-ink-muted">Reason: {r.naReason}</p>}
              </li>
            ))}
          </ul>

          {/* Table (≥640px; scrolls horizontally on tablet with a sticky first column) */}
          <div className="hidden sm:block">
            <Table label="Compliance register">
              <THead>
                <tr>
                  <TH className="sticky left-0 z-10 bg-table-head">Compliance type</TH>
                  <TH>Category</TH>
                  <TH>Applies</TH>
                  <TH>Renewal</TH>
                  <TH>Current certificate</TH>
                  <TH>Expiry</TH>
                  <TH>Status</TH>
                  <TH className="w-12">
                    <span className="sr-only">Options</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {rows.map((r) => {
                  const na = r.applicability === 'not_applicable';
                  return (
                    <TR key={r._id} interactive className={cn('group', na && 'bg-canvas/60')}>
                      <TD className="sticky left-0 z-10 bg-surface group-hover:bg-canvas">
                        <button type="button" onClick={() => onOpen(r)} className="focus-ring rounded text-left font-semibold text-ink hover:text-brand-600">
                          {r.complianceType.name}
                        </button>
                        <p className="text-meta text-ink-muted">
                          {r.complianceType.code}
                          <NotInRag r={r} />
                        </p>
                      </TD>
                      <TD className="whitespace-nowrap text-ink-muted">{r.complianceType.category}</TD>
                      <TD>
                        <div className="flex flex-col items-start gap-1">
                          <ApplicabilityToggle r={r} disabled={!editable} busy={busyId === r._id} onToggle={() => void toggle(r)} />
                          {na && r.naReason && (
                            <Tooltip content={r.naReason}>
                              <span tabIndex={0} className="focus-ring max-w-[9rem] truncate rounded text-meta text-ink-muted underline decoration-dotted">
                                {r.naReason}
                              </span>
                            </Tooltip>
                          )}
                        </div>
                      </TD>
                      <TD className="whitespace-nowrap">
                        <Renewal r={r} />
                      </TD>
                      <TD>
                        {r.currentCertificate ? (
                          <div className="min-w-0">
                            <p className="max-w-[14rem] truncate text-sm font-medium text-ink" title={r.currentCertificate.file.name}>
                              {r.currentCertificate.file.name}
                            </p>
                            <p className="text-meta text-ink-muted">
                              v{r.currentCertificate.version} · issued {formatDate(r.currentCertificate.issueDate)}
                            </p>
                          </div>
                        ) : na ? (
                          <span className="text-ink-muted">—</span>
                        ) : canUpload ? (
                          <Button variant="link" size="sm" onClick={() => onUpload(r)} leftIcon={<FilePlus2 className="h-4 w-4" />}>
                            Upload
                          </Button>
                        ) : (
                          <span className="text-ink-muted">None</span>
                        )}
                      </TD>
                      <TD>
                        <Expiry r={r} />
                      </TD>
                      <TD>
                        <StatusPill kind="requirement" value={r.status} variant="dot" />
                      </TD>
                      <TD className="pr-4">
                        <DropdownMenu items={menu(r)} label={`Options for ${r.complianceType.name}`} />
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>
          <p className="flex items-center gap-1.5 text-meta text-ink-muted">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden />
            Status rules: overdue after expiry; due soon within the organisation&apos;s reminder window; missing when no current certificate.
          </p>
        </>
      )}

      <NotApplicableModal requirement={naTarget} onClose={() => setNaTarget(null)} />
      <RenewalOverrideModal requirement={renewalTarget} onClose={() => setRenewalTarget(null)} />
    </div>
  );
}
