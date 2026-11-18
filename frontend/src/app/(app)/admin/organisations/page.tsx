'use client';

import React, { useMemo, useState } from 'react';
import {
  Building,
  CircleCheck,
  CirclePause,
  History,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import {
  AdminOrganisationsSkeleton,
  CreateOrganisationModal,
  OrgAuditDrawer,
  OrgStatusModal,
  SeatLimitModal,
} from '@/components/admin';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Alert,
  Badge,
  Button,
  Card,
  DropdownMenu,
  EmptyState,
  Input,
  KpiTile,
  Select,
  TD,
  TH,
  Table,
} from '@/components/ui';
import { formatDate } from '@/lib/format';
import { useApi } from '@/lib/hooks/useApi';
import { useSession } from '@/lib/session-mock';
import { adminService, errorMessage } from '@/services';
import type { AdminOrganisationView } from '@/types/domain';

export default function OrganisationsPage() {
  const { can } = useSession();
  const allowed = can('org.manage');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<AdminOrganisationView | null>(null);
  const [seatTarget, setSeatTarget] = useState<AdminOrganisationView | null>(null);
  const [auditTarget, setAuditTarget] = useState<AdminOrganisationView | null>(null);

  const {
    data: orgs,
    error,
    loading,
    reload,
  } = useApi(
    () => (allowed ? adminService.organisations() : Promise.resolve({ success: true, statusCode: 200, data: [] as AdminOrganisationView[] })),
    [allowed],
  );

  const filtered = useMemo(() => {
    const list = orgs ?? [];
    const q = search.trim().toLowerCase();
    return list.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false;
      if (!q) return true;
      return [o.name, o.legalName, o.email, o.address.city, o.address.postcode]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [orgs, search, statusFilter]);

  const summary = useMemo(() => {
    const list = orgs ?? [];
    return {
      total: list.length,
      active: list.filter((o) => o.status === 'active').length,
      suspended: list.filter((o) => o.status === 'suspended').length,
      seats: list.reduce((sum, o) => sum + o.seatLimit, 0),
    };
  }, [orgs]);

  if (!allowed) {
    return (
      <div className="space-y-6">
        <PageHeader title="Organisations" description="Platform administrator console" />
        <Alert tone="warning" title="Restricted to Platform Administrators">
          You do not have permission to manage customer organisations.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organisations"
        description="Platform console: provision customer workspaces, manage seat limits, and review support audit trails."
        actions={
          <Button type="button" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            New organisation
          </Button>
        }
      />

      {loading ? (
        <AdminOrganisationsSkeleton />
      ) : error ? (
        <Alert tone="error" title="Could not load organisations" onRetry={reload}>
          {errorMessage(error)}
        </Alert>
      ) : !orgs || orgs.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Building className="h-6 w-6" />}
            title="No customer organisations yet"
            description="Create the first organisation to invite its Organisation Admin."
            action={
              <Button type="button" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                New organisation
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="stagger-children grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiTile label="Organisations" value={summary.total} icon={<Building />} tone="info" />
            <KpiTile label="Active" value={summary.active} icon={<CircleCheck />} tone="ok" />
            <KpiTile label="Suspended" value={summary.suspended} icon={<CirclePause />} tone="warn" />
            <KpiTile label="Seats licensed" value={summary.seats} icon={<Users />} tone="neutral" />
          </div>

          <Card>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Input
                  aria-label="Search organisations"
                  placeholder="Search name, email, city…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>
              <div className="w-full sm:w-44">
                <Select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: '', label: 'All statuses' },
                    { value: 'active', label: 'Active' },
                    { value: 'suspended', label: 'Suspended' },
                  ]}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                icon={<Search className="h-6 w-6" />}
                title="No matching organisations"
                description="Try clearing your search or status filter."
                action={
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('');
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <Table>
                    <thead>
                      <tr>
                        <TH>Organisation</TH>
                        <TH>Location & Contact</TH>
                        <TH>Seats</TH>
                        <TH>Status</TH>
                        <TH>Created</TH>
                        <TH className="text-right">Actions</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((org) => (
                        <tr key={org._id}>
                          <TD>
                            <div className="font-semibold text-ink">{org.name}</div>
                            {org.legalName && org.legalName !== org.name && (
                              <div className="text-[12px] text-ink-muted">{org.legalName}</div>
                            )}
                          </TD>
                          <TD>
                            <div className="text-[13px] text-ink">{org.email}</div>
                            <div className="text-[12px] text-ink-muted">
                              {org.address.city}, {org.address.postcode}
                            </div>
                          </TD>
                          <TD>
                            <span className="font-medium text-ink">{org.activeUsers}</span>
                            <span className="text-ink-muted"> / {org.seatLimit}</span>
                          </TD>
                          <TD>
                            <Badge tone={org.status === 'active' ? 'ok' : 'warn'} className="capitalize">
                              {org.status}
                            </Badge>
                          </TD>
                          <TD className="whitespace-nowrap text-[13px] text-ink-muted">
                            {formatDate(org.createdAt)}
                          </TD>
                          <TD className="text-right">
                            <DropdownMenu
                              label={`Actions for ${org.name}`}
                              trigger={
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-line bg-surface text-ink-muted hover:bg-surface-subtle hover:text-ink">
                                  <MoreHorizontal className="h-4 w-4" aria-hidden />
                                </span>
                              }
                              items={[
                                {
                                  label: 'Edit seat limit',
                                  icon: <SlidersHorizontal className="h-4 w-4" />,
                                  onSelect: () => setSeatTarget(org),
                                },
                                {
                                  label: 'Support audit trail',
                                  icon: <History className="h-4 w-4" />,
                                  onSelect: () => setAuditTarget(org),
                                },
                                {
                                  label: org.status === 'active' ? 'Suspend organisation' : 'Reactivate organisation',
                                  icon: org.status === 'active' ? <CirclePause className="h-4 w-4" /> : <CircleCheck className="h-4 w-4" />,
                                  danger: org.status === 'active',
                                  onSelect: () => setStatusTarget(org),
                                },
                              ]}
                            />
                          </TD>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="space-y-3 md:hidden">
                  {filtered.map((org) => (
                    <div key={org._id} className="rounded-lg border border-line p-4 text-[13px]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-ink">{org.name}</p>
                          <p className="text-[12px] text-ink-muted">{org.email}</p>
                        </div>
                        <Badge tone={org.status === 'active' ? 'ok' : 'warn'} className="capitalize">
                          {org.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-[12.5px] text-ink-muted">
                        {org.address.city}, {org.address.postcode} · Seats {org.activeUsers}/{org.seatLimit}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setSeatTarget(org)}>
                          Seats
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => setAuditTarget(org)}>
                          Audit
                        </Button>
                        <Button
                          size="sm"
                          variant={org.status === 'active' ? 'danger' : 'primary'}
                          onClick={() => setStatusTarget(org)}
                        >
                          {org.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </>
      )}

      <CreateOrganisationModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={reload}
      />
      <OrgStatusModal
        org={statusTarget}
        onClose={() => setStatusTarget(null)}
        onUpdated={reload}
      />
      <SeatLimitModal
        org={seatTarget}
        onClose={() => setSeatTarget(null)}
        onUpdated={reload}
      />
      <OrgAuditDrawer
        org={auditTarget}
        onClose={() => setAuditTarget(null)}
      />
    </div>
  );
}
