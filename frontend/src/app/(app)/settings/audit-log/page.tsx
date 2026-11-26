'use client';

import React, { useState } from 'react';
import { Eye, History, RotateCcw, Search } from 'lucide-react';
import { AuditDiffModal, SettingsTableSkeleton } from '@/components/settings';
import { Alert, Badge, Button, Card, DatePicker, EmptyState, Input, Pagination, Select, TD, TH, Table } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { useApi } from '@/lib/hooks/useApi';
import { actorRoleLabel } from '@/lib/permissions';
import { useSession } from '@/lib/session-mock';
import { auditService, teamService } from '@/services';
import type { AuditActionVerb, AuditEvent } from '@/types/domain';

const ACTION_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'archive', label: 'Archive' },
  { value: 'verify', label: 'Verify' },
  { value: 'reopen', label: 'Reopen' },
  { value: 'export', label: 'Export' },
  { value: 'share', label: 'Share' },
  { value: 'revoke', label: 'Revoke' },
  { value: 'login', label: 'Login' },
  { value: 'login_failed', label: 'Login failed' },
];

const ENTITY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All entities' },
  { value: 'property', label: 'Property' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'action', label: 'Action' },
  { value: 'report', label: 'Report' },
  { value: 'share_link', label: 'Share link' },
  { value: 'user', label: 'User' },
  { value: 'organisation', label: 'Organisation' },
  { value: 'compliance_type', label: 'Compliance type' },
  { value: 'session', label: 'Session' },
];

export default function AuditLogSettingsPage() {
  const { can } = useSession();
  const allowed = can('audit.view');

  const [search, setSearch] = useState('');
  const [actorId, setActorId] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const { data: team } = useApi(() => (allowed ? teamService.list() : Promise.resolve({ success: true, statusCode: 200, data: null })), [allowed]);

  const {
    data: events,
    meta,
    error,
    loading,
    reload,
  } = useApi(
    () =>
      allowed
        ? auditService.list({
            search: search.trim() || undefined,
            actorId: actorId || undefined,
            action: (action || undefined) as AuditActionVerb | undefined,
            entityType: (entityType || undefined) as AuditEvent['entityType'] | undefined,
            from: from || undefined,
            to: to || undefined,
            page,
            limit: 15,
          })
        : Promise.resolve({ success: true, statusCode: 200, data: [] as AuditEvent[] }),
    [allowed, search, actorId, action, entityType, from, to, page],
  );

  if (!allowed) {
    return (
      <Alert tone="warning" title="Restricted to Organisation Admins">
        You do not have permission to view the organisation audit log.
      </Alert>
    );
  }

  const userOptions = [
    { value: '', label: 'All users' },
    ...(team?.users ?? []).map((u) => ({ value: u._id, label: u.name })),
  ];

  const clearFilters = () => {
    setSearch('');
    setActorId('');
    setAction('');
    setEntityType('');
    setFrom('');
    setTo('');
    setPage(1);
  };

  const hasFilters = !!(search || actorId || action || entityType || from || to);

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Search summary or actor"
            leftIcon={<Search />}
            placeholder="Search audit events..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            label="User"
            value={actorId}
            onChange={(e) => {
              setActorId(e.target.value);
              setPage(1);
            }}
            options={userOptions}
          />
          <Select
            label="Action"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            options={ACTION_OPTIONS}
          />
          <Select
            label="Entity"
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            options={ENTITY_OPTIONS}
          />
          <DatePicker
            label="From date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
          />
          <DatePicker
            label="To date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {hasFilters && (
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="ghost" leftIcon={<RotateCcw className="h-3.5 w-3.5" />} onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </Card>

      {loading ? (
        <SettingsTableSkeleton rows={6} />
      ) : error ? (
        <Alert tone="error" title="Could not load audit log" onRetry={reload}>
          {error}
        </Alert>
      ) : !events || events.length === 0 ? (
        <Card>
          <EmptyState
            icon={<History className="h-7 w-7" />}
            title="No audit events found"
            description={hasFilters ? 'Try widening your date range or clearing filters.' : 'Activity will appear here as your team works.'}
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          {/* Mobile cards */}
          <div className="divide-y divide-line sm:hidden">
            {events.map((ev) => (
              <div key={ev._id} className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone={ev.action === 'login_failed' ? 'danger' : 'info'}>{ev.action}</Badge>
                  <span className="text-meta text-ink-muted">{formatDateTime(ev.createdAt)}</span>
                </div>
                <p className="text-sm font-medium text-ink">{ev.summary}</p>
                <div className="flex items-center justify-between text-meta text-ink-muted">
                  <span>
                    {ev.actorName} ({actorRoleLabel(ev.actorRole)})
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedEvent(ev)}>
                    View diff
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop/Tablet table */}
          <div className="hidden sm:block">
            <Table aria-label="Organisation audit log">
              <thead>
                <tr>
                  <TH>Timestamp</TH>
                  <TH>User</TH>
                  <TH>Action</TH>
                  <TH>Entity</TH>
                  <TH>Summary</TH>
                  <TH className="text-right">Details</TH>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev._id}>
                    <TD className="whitespace-nowrap text-ink-muted">{formatDateTime(ev.createdAt)}</TD>
                    <TD>
                      <div className="font-medium text-ink">{ev.actorName}</div>
                      <div className="text-meta text-ink-muted">{actorRoleLabel(ev.actorRole)}</div>
                    </TD>
                    <TD>
                      <Badge tone={ev.action === 'login_failed' ? 'danger' : 'info'}>{ev.action}</Badge>
                    </TD>
                    <TD className="font-mono text-xs text-ink-muted">{ev.entityType}</TD>
                    <TD className="max-w-md text-ink">{ev.summary}</TD>
                    <TD className="text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                        onClick={() => setSelectedEvent(ev)}
                      >
                        View
                      </Button>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {meta && meta.totalPage > 1 && (
            <div className="border-t border-line px-6 py-4">
              <Pagination page={meta.page} totalPages={meta.totalPage} total={meta.total} limit={meta.limit} onPageChange={setPage} />
            </div>
          )}
        </Card>
      )}

      <AuditDiffModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
