'use client';

import Link from 'next/link';
import { Archive, ArchiveRestore, ChevronLeft, FilePlus2, FileText, MapPin, Pencil, SquarePlus, UserRound } from 'lucide-react';
import { Alert, Button, DropdownMenu, StatusPill, TypePill, type MenuItem } from '@/components/ui';
import type { Property } from '@/types/domain';

export function fullAddress(p: Property) {
  return [p.address.line1, p.address.line2, p.address.city, p.address.postcode].filter(Boolean).join(', ');
}

export interface PropertyHeaderProps {
  property: Property;
  managerName?: string;
  can: { property: boolean; certificate: boolean; action: boolean; report: boolean };
  generating: boolean;
  onUpload: () => void;
  onNewAction: () => void;
  onGenerateReport: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
}

export function PropertyHeader({ property: p, managerName, can, generating, onUpload, onNewAction, onGenerateReport, onEdit, onArchive, onRestore }: PropertyHeaderProps) {
  const archived = p.status === 'archived';
  const menu: MenuItem[] = [];
  if (can.property && !archived) menu.push({ label: 'Edit property', icon: <Pencil className="h-4 w-4" />, onSelect: onEdit });
  if (can.property && !archived) menu.push({ label: 'Archive property', icon: <Archive className="h-4 w-4" />, danger: true, onSelect: onArchive });
  if (can.property && archived) menu.push({ label: 'Restore property', icon: <ArchiveRestore className="h-4 w-4" />, onSelect: onRestore });

  return (
    <div className="space-y-4">
      <Link href="/properties" className="focus-ring inline-flex items-center gap-1 rounded-md text-sm font-semibold text-brand-600 hover:underline">
        <ChevronLeft className="h-4 w-4" aria-hidden />
        All properties
      </Link>

      {archived && (
        <Alert tone="warning" title="This property is archived">
          It is read-only and excluded from the dashboard and reminders.
          {can.property && (
            <>
              {' '}
              <button type="button" onClick={onRestore} className="focus-ring rounded font-semibold text-brand-600 hover:underline">
                Restore property
              </button>{' '}
              to make changes.
            </>
          )}
        </Alert>
      )}

      <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-4 shadow-card sm:flex-row sm:p-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={p.coverImageUrl || '/images/properties/wellington-court.svg'}
          alt={`${p.name} exterior`}
          className="aspect-[16/10] w-full shrink-0 rounded-lg border border-line object-cover sm:w-48 lg:w-56"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[1.6rem] font-bold leading-tight text-ink sm:text-h1">{p.name}</h1>
                <StatusPill kind="rag" value={p.ragStatus} size="md" />
              </div>
              <p className="mt-1 text-sm font-medium text-ink-muted">{p.reference}</p>
            </div>
            {menu.length > 0 && <DropdownMenu items={menu} label={`More options for ${p.name}`} />}
          </div>
          <dl className="grid gap-2 text-[15px] text-ink sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <dt>
                <MapPin className="mt-0.5 h-4 w-4 text-ink-muted" aria-hidden />
                <span className="sr-only">Address</span>
              </dt>
              <dd>{fullAddress(p)}</dd>
            </div>
            <div className="flex items-start gap-2">
              <dt>
                <UserRound className="mt-0.5 h-4 w-4 text-ink-muted" aria-hidden />
                <span className="sr-only">Property manager</span>
              </dt>
              <dd>{managerName ?? 'No manager assigned'}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap items-center gap-2">
            <TypePill type={p.type} />
            {archived && (
              <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-sm font-semibold text-neutral-700">
                <Archive className="h-3.5 w-3.5" aria-hidden />
                Archived
              </span>
            )}
          </div>
          {!archived && (can.certificate || can.action || can.report) && (
            <div className="mt-auto flex flex-wrap gap-2 pt-1">
              {can.certificate && (
                <Button size="sm" leftIcon={<FilePlus2 className="h-4 w-4" />} onClick={onUpload}>
                  Upload certificate
                </Button>
              )}
              {can.action && (
                <Button size="sm" variant="secondary" leftIcon={<SquarePlus className="h-4 w-4" />} onClick={onNewAction}>
                  New action
                </Button>
              )}
              {can.report && (
                <Button size="sm" variant="secondary" leftIcon={<FileText className="h-4 w-4" />} onClick={onGenerateReport} isLoading={generating}>
                  Generate report
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
