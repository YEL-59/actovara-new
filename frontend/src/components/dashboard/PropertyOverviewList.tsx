'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { CountChip, StatusPill, Table, TBody, TD, TH, THead, TR, TypePill } from '@/components/ui';
import type { Property } from '@/types/domain';

export function PropertyOverviewList({ properties }: { properties: Property[] }) {
  return (
    <Table label="Property overview">
      <THead>
        <TR>
          <TH>Property</TH>
          <TH>Type</TH>
          <TH>Location</TH>
          <TH>Status</TH>
          <TH className="text-right">Certificates</TH>
          <TH className="text-right">Overdue</TH>
          <TH className="text-right">Open Actions</TH>
          <TH className="w-10">
            <span className="sr-only">Open</span>
          </TH>
        </TR>
      </THead>
      <TBody>
        {properties.map((p) => {
          const certs = p.counts?.certificates ?? 0;
          const overdue = p.counts?.overdue ?? 0;
          const openActions = p.counts?.openActions ?? 0;
          return (
            <TR key={p._id} interactive>
              <TD>
                <Link href={`/properties/${p._id}`} className="focus-ring flex items-center gap-3 rounded-md font-semibold text-ink hover:text-brand-600">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.coverImageUrl || '/images/properties/wellington-court.svg'}
                    alt=""
                    className="h-10 w-12 shrink-0 rounded-md border border-line bg-canvas object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{p.name}</p>
                    <p className="text-meta font-normal text-ink-muted">{p.reference}</p>
                  </div>
                </Link>
              </TD>
              <TD>
                <TypePill type={p.type} />
              </TD>
              <TD className="text-ink-muted">
                {p.address.city}, {p.address.postcode}
              </TD>
              <TD>
                <StatusPill kind="rag" value={p.ragStatus} variant="dot" />
              </TD>
              <TD className="text-right font-semibold tabular-nums">{certs}</TD>
              <TD className="text-right">
                <span className={overdue > 0 ? 'font-bold tabular-nums text-danger-700' : 'tabular-nums text-ink-muted'}>
                  {overdue}
                </span>
              </TD>
              <TD className="text-right">
                <CountChip count={openActions} label="open actions" />
              </TD>
              <TD className="text-right">
                <Link
                  href={`/properties/${p._id}`}
                  aria-label={`View ${p.name}`}
                  className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-table-head hover:text-brand-600"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}
