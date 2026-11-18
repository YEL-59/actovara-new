'use client';

import Link from 'next/link';
import { ArrowRight, CircleCheck } from 'lucide-react';
import { Card, CardHeader, EmptyState, StatusPill, Table, TBody, TD, TH, THead, TR } from '@/components/ui';
import { formatDate, formatRelativeDue } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { DashboardSummary } from '@/types/domain';

export interface UrgentRequirementsTableProps {
  requirements: DashboardSummary['urgentRequirements'];
  propertyId?: string;
}

export function UrgentRequirementsTable({ requirements, propertyId }: UrgentRequirementsTableProps) {
  const rows = requirements.slice(0, 6);
  const viewAllHref = propertyId ? `/certificates?propertyId=${encodeURIComponent(propertyId)}` : '/certificates';

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Urgent Certificates & Requirements"
        description="Overdue, missing, and due-soon items requiring attention"
        actions={
          <Link
            href={viewAllHref}
            className="focus-ring inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-brand-600 hover:bg-brand-50"
          >
            View all
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<CircleCheck />}
          title="All requirements are in date"
          description="No overdue, missing, or due-soon certificates for this selection."
          className="flex-1 py-8"
        />
      ) : (
        <Table label="Urgent compliance requirements" className="min-w-[460px]">
          <THead>
            <TR>
              <TH>Requirement</TH>
              <TH>Property</TH>
              <TH>Status</TH>
              <TH className="text-right">Due</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((req) => (
              <TR key={req._id} interactive>
                <TD className="font-semibold text-ink">{req.complianceTypeName}</TD>
                <TD>
                  <Link
                    href={`/properties/${req.propertyId}`}
                    className="focus-ring rounded text-sm font-medium text-ink-muted hover:text-brand-600 hover:underline"
                  >
                    {req.propertyName}
                  </Link>
                </TD>
                <TD>
                  <StatusPill kind="requirement" value={req.status} />
                </TD>
                <TD className="text-right">
                  <span
                    className={cn(
                      'block text-sm font-semibold tabular-nums',
                      req.status === 'overdue' ? 'text-danger-700' : req.status === 'due_soon' ? 'text-warn-700' : 'text-ink-muted',
                    )}
                  >
                    {req.nextDueDate ? formatRelativeDue(req.nextDueDate) : 'Missing'}
                  </span>
                  {req.nextDueDate && (
                    <span className="text-meta text-ink-muted">{formatDate(req.nextDueDate)}</span>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </Card>
  );
}
