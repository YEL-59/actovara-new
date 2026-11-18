'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Archive, ArchiveRestore, Calendar, Eye, Pencil } from 'lucide-react';
import {
  Badge,
  CountChip,
  DropdownMenu,
  StatusPill,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  TypePill,
  type MenuItem,
  type SortDirection,
} from '@/components/ui';
import { formatDate } from '@/lib/format';
import type { Property } from '@/types/domain';

export interface PropertyTableProps {
  properties: Property[];
  canWrite: boolean;
  sortDirection: SortDirection;
  onSortProperty: () => void;
  onEdit: (property: Property) => void;
  onArchive: (property: Property) => void;
  onRestore: (property: Property) => void;
}

function buildMenuItems(
  p: Property,
  canWrite: boolean,
  onView: () => void,
  onEdit: () => void,
  onArchive: () => void,
  onRestore: () => void,
): MenuItem[] {
  const items: MenuItem[] = [
    { label: 'View property', icon: <Eye className="h-4 w-4" />, onSelect: onView },
  ];
  if (canWrite) {
    items.push({ label: 'Edit property', icon: <Pencil className="h-4 w-4" />, onSelect: onEdit });
    if (p.status === 'archived') {
      items.push({ label: 'Restore property', icon: <ArchiveRestore className="h-4 w-4" />, onSelect: onRestore });
    } else {
      items.push({ label: 'Archive property', icon: <Archive className="h-4 w-4" />, danger: true, onSelect: onArchive });
    }
  }
  return items;
}

function fullAddress(p: Property): string {
  return [p.address.line1, p.address.line2, p.address.city, p.address.postcode].filter(Boolean).join(', ');
}

export function PropertyTable({
  properties,
  canWrite,
  sortDirection,
  onSortProperty,
  onEdit,
  onArchive,
  onRestore,
}: PropertyTableProps) {
  const router = useRouter();

  return (
    <>
      {/* Mobile stacked cards (<640px) */}
      <div className="space-y-3 sm:hidden">
        {properties.map((p) => {
          const openActions = p.counts?.openActions ?? 0;
          const menuItems = buildMenuItems(
            p,
            canWrite,
            () => router.push(`/properties/${p._id}`),
            () => onEdit(p),
            () => onArchive(p),
            () => onRestore(p),
          );
          return (
            <div key={p._id} className="rounded-xl border border-line bg-surface p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/properties/${p._id}`} className="focus-ring flex min-w-0 items-start gap-3 rounded-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.coverImageUrl || '/images/properties/wellington-court.svg'}
                    alt=""
                    className="h-12 w-16 shrink-0 rounded-md border border-line bg-canvas object-cover"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-[15px] font-bold text-ink">{p.name}</p>
                      {p.status === 'archived' && <Badge tone="neutral">Archived</Badge>}
                    </div>
                    <p className="line-clamp-1 text-sm text-ink-muted">{fullAddress(p)}</p>
                    <p className="text-meta text-ink-subtle">{p.reference}</p>
                  </div>
                </Link>
                <DropdownMenu items={menuItems} label={`Actions for ${p.name}`} />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/70 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <TypePill type={p.type} />
                  <StatusPill kind="rag" value={p.ragStatus} variant="dot" />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-meta text-ink-muted">Actions:</span>
                  <CountChip count={openActions} label="open actions" />
                </div>
              </div>

              {p.nextDue && (
                <div className="mt-2.5 flex items-center gap-2 text-meta text-ink-muted">
                  <Calendar className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden />
                  <span className="font-semibold text-ink">{formatDate(p.nextDue.date)}</span>
                  <span className="truncate">· {p.nextDue.complianceTypeName}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop & tablet table (>=640px) */}
      <div className="hidden sm:block">
        <Table label="Properties">
          <THead>
            <TR>
              <TH sortDirection={sortDirection} onSort={onSortProperty}>
                Property
              </TH>
              <TH>Property Type</TH>
              <TH>Compliance Status</TH>
              <TH>Upcoming Certificates</TH>
              <TH className="text-center">Open Actions</TH>
              <TH className="w-14">
                <span className="sr-only">Actions</span>
              </TH>
            </TR>
          </THead>
          <TBody>
            {properties.map((p) => {
              const openActions = p.counts?.openActions ?? 0;
              const menuItems = buildMenuItems(
                p,
                canWrite,
                () => router.push(`/properties/${p._id}`),
                () => onEdit(p),
                () => onArchive(p),
                () => onRestore(p),
              );

              return (
                <TR key={p._id} interactive>
                  <TD>
                    <Link
                      href={`/properties/${p._id}`}
                      className="focus-ring group flex items-center gap-3.5 rounded-md"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.coverImageUrl || '/images/properties/wellington-court.svg'}
                        alt=""
                        className="h-11 w-16 shrink-0 rounded-md border border-line bg-canvas object-cover"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-bold text-ink group-hover:text-brand-600">
                            {p.name}
                          </span>
                          {p.status === 'archived' && <Badge tone="neutral">Archived</Badge>}
                        </div>
                        <p className="truncate text-sm text-ink-muted">{fullAddress(p)}</p>
                        <p className="text-meta text-ink-subtle">{p.reference}</p>
                      </div>
                    </Link>
                  </TD>
                  <TD>
                    <TypePill type={p.type} />
                  </TD>
                  <TD>
                    <StatusPill kind="rag" value={p.ragStatus} variant="dot" />
                  </TD>
                  <TD>
                    {p.nextDue ? (
                      <div className="flex items-start gap-2.5">
                        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" aria-hidden />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{formatDate(p.nextDue.date)}</p>
                          <p className="truncate text-sm text-ink-muted">{p.nextDue.complianceTypeName}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-ink-subtle">No upcoming due dates</span>
                    )}
                  </TD>
                  <TD className="text-center">
                    <CountChip count={openActions} label="open actions" />
                  </TD>
                  <TD className="text-right">
                    <DropdownMenu items={menuItems} label={`Actions for ${p.name}`} />
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </div>
    </>
  );
}
