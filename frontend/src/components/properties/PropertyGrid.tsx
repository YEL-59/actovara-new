'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Archive, ArchiveRestore, Calendar, Eye, MapPin, Pencil } from 'lucide-react';
import { Badge, CountChip, DropdownMenu, StatusPill, TypePill, type MenuItem } from '@/components/ui';
import { formatDate } from '@/lib/format';
import type { Property } from '@/types/domain';

export interface PropertyGridProps {
  properties: Property[];
  canWrite: boolean;
  onEdit: (property: Property) => void;
  onArchive: (property: Property) => void;
  onRestore: (property: Property) => void;
}

export function PropertyGrid({ properties, canWrite, onEdit, onArchive, onRestore }: PropertyGridProps) {
  const router = useRouter();

  return (
    <div className="stagger-children grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {properties.map((p) => {
        const openActions = p.counts?.openActions ?? 0;
        const menuItems: MenuItem[] = [
          { label: 'View property', icon: <Eye className="h-4 w-4" />, onSelect: () => router.push(`/properties/${p._id}`) },
        ];
        if (canWrite) {
          menuItems.push({ label: 'Edit property', icon: <Pencil className="h-4 w-4" />, onSelect: () => onEdit(p) });
          if (p.status === 'archived') {
            menuItems.push({ label: 'Restore property', icon: <ArchiveRestore className="h-4 w-4" />, onSelect: () => onRestore(p) });
          } else {
            menuItems.push({ label: 'Archive property', icon: <Archive className="h-4 w-4" />, danger: true, onSelect: () => onArchive(p) });
          }
        }

        return (
          <div
            key={p._id}
            className="group flex flex-col justify-between rounded-xl border border-line bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <Link href={`/properties/${p._id}`} className="focus-ring flex min-w-0 items-start gap-3 rounded-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.coverImageUrl || '/images/properties/wellington-court.svg'}
                    alt=""
                    className="h-14 w-20 shrink-0 rounded-lg border border-line bg-canvas object-cover"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="truncate text-[16px] font-bold text-ink group-hover:text-brand-600">{p.name}</h3>
                      {p.status === 'archived' && <Badge tone="neutral">Archived</Badge>}
                    </div>
                    <p className="text-meta text-ink-subtle">{p.reference}</p>
                    <p className="mt-1 flex items-center gap-1 truncate text-sm text-ink-muted">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden />
                      <span className="truncate">{p.address.line1}, {p.address.city}</span>
                    </p>
                  </div>
                </Link>
                <DropdownMenu items={menuItems} label={`Actions for ${p.name}`} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <TypePill type={p.type} />
                <StatusPill kind="rag" value={p.ragStatus} variant="dot" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-line/70 pt-3 text-sm">
              <div className="min-w-0">
                {p.nextDue ? (
                  <div className="flex items-center gap-1.5 text-ink-muted">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden />
                    <span className="font-semibold text-ink">{formatDate(p.nextDue.date)}</span>
                    <span className="truncate">· {p.nextDue.complianceTypeName}</span>
                  </div>
                ) : (
                  <span className="text-ink-subtle">No upcoming due dates</span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span className="text-meta text-ink-muted">Actions</span>
                <CountChip count={openActions} label="open actions" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
