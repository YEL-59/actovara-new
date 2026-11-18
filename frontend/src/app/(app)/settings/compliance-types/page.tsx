'use client';

import React, { useMemo, useState } from 'react';
import { BookOpen, ClipboardList, Pencil, Plus, Search } from 'lucide-react';
import { ComplianceTypeModal, LegislationHistoryDrawer, SettingsTableSkeleton } from '@/components/settings';
import { Alert, Badge, Button, Card, EmptyState, Input, Select, TD, TH, Table, TypePill } from '@/components/ui';
import { useApi } from '@/lib/hooks/useApi';
import { useSession } from '@/lib/session-mock';
import { complianceTypesService } from '@/services';
import type { ComplianceType } from '@/types/domain';

export default function ComplianceTypesSettingsPage() {
  const { can } = useSession();
  const canManage = can('catalogue.manage');

  const { data: types, error, loading, reload } = useApi(() => complianceTypesService.list(), []);

  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<'all' | 'global' | 'org'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ComplianceType | null>(null);
  const [historyType, setHistoryType] = useState<ComplianceType | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (types ?? []).filter((t) => {
      if (scope === 'global' && t.orgId !== null) return false;
      if (scope === 'org' && t.orgId === null) return false;
      if (statusFilter === 'active' && !t.active) return false;
      if (statusFilter === 'inactive' && t.active) return false;
      if (q && !t.name.toLowerCase().includes(q) && !t.code.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [types, search, scope, statusFilter]);

  if (loading) return <SettingsTableSkeleton rows={7} />;

  if (error) {
    return (
      <Alert tone="error" title="Could not load compliance catalogue" onRetry={reload}>
        {error}
      </Alert>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (t: ComplianceType) => {
    setEditing(t);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {!canManage && (
        <Alert tone="info" title="Read-only catalogue">
          You can view compliance types and legislation references. Only Organisation Admins can add or edit catalogue entries.
        </Alert>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid w-full flex-1 gap-3 sm:grid-cols-3 lg:max-w-2xl">
          <Input
            label="Search catalogue"
            hideLabel
            leftIcon={<Search />}
            placeholder="Search name, code or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select
            label="Scope"
            hideLabel
            value={scope}
            onChange={(e) => setScope(e.target.value as 'all' | 'global' | 'org')}
            options={[
              { value: 'all', label: 'All scopes (Global & Org)' },
              { value: 'global', label: 'Global defaults' },
              { value: 'org', label: 'Organisation custom' },
            ]}
          />
          <Select
            label="Status"
            hideLabel
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'active', label: 'Active only' },
              { value: 'inactive', label: 'Inactive only' },
            ]}
          />
        </div>
        {canManage && (
          <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
            Add compliance type
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList className="h-7 w-7" />}
            title="No compliance types match"
            description="Adjust your search or filters, or add a custom compliance type for your organisation."
            action={
              canManage ? (
                <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />}>
                  Add compliance type
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 sm:hidden">
            {filtered.map((t) => {
              const latest = t.legislationRefs[t.legislationRefs.length - 1];
              return (
                <Card key={t._id} className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-brand-700">{t.code}</span>
                        <Badge tone={t.orgId === null ? 'neutral' : 'info'}>
                          {t.orgId === null ? 'Global' : 'Org'}
                        </Badge>
                      </div>
                      <h3 className="mt-1 font-semibold text-ink">{t.name}</h3>
                      <p className="text-meta text-ink-muted">{t.category}</p>
                    </div>
                    <Badge tone={t.active ? 'ok' : 'neutral'}>{t.active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {t.applicableTo.map((pt) => (
                      <TypePill key={pt} type={pt} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-line pt-3 text-meta text-ink-muted">
                    <span>{t.storeOnly ? 'Store only' : `${t.defaultRenewalMonths} mo renewal`}</span>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => setHistoryType(t)}>
                        {latest ? `v${latest.version} ref` : 'Legislation'}
                      </Button>
                      {canManage && (
                        <Button size="sm" variant="secondary" onClick={() => openEdit(t)}>
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Desktop/Tablet table */}
          <div className="hidden sm:block">
            <Table aria-label="Compliance types catalogue">
              <thead>
                <tr>
                  <TH>Order</TH>
                  <TH>Compliance type</TH>
                  <TH>Scope</TH>
                  <TH>Applicable to</TH>
                  <TH>Renewal</TH>
                  <TH>Legislation</TH>
                  <TH>Status</TH>
                  {canManage && <TH className="text-right">Actions</TH>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const latest = t.legislationRefs[t.legislationRefs.length - 1];
                  return (
                    <tr key={t._id}>
                      <TD className="font-mono text-xs text-ink-muted">{t.sortOrder}</TD>
                      <TD>
                        <div className="font-semibold text-ink">{t.name}</div>
                        <div className="text-meta text-ink-muted">
                          <span className="font-mono">{t.code}</span> · {t.category}
                        </div>
                      </TD>
                      <TD>
                        <Badge tone={t.orgId === null ? 'neutral' : 'info'}>
                          {t.orgId === null ? 'Global' : 'Org'}
                        </Badge>
                      </TD>
                      <TD>
                        <div className="flex flex-wrap gap-1">
                          {t.applicableTo.map((pt) => (
                            <TypePill key={pt} type={pt} />
                          ))}
                        </div>
                      </TD>
                      <TD className="text-ink-muted">
                        {t.storeOnly ? <Badge tone="neutral">Store only</Badge> : `${t.defaultRenewalMonths} months`}
                      </TD>
                      <TD>
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<BookOpen className="h-3.5 w-3.5" />}
                          onClick={() => setHistoryType(t)}
                        >
                          {latest ? `v${latest.version}` : 'None'}
                        </Button>
                      </TD>
                      <TD>
                        <Badge tone={t.active ? 'ok' : 'neutral'}>{t.active ? 'Active' : 'Inactive'}</Badge>
                      </TD>
                      {canManage && (
                        <TD className="text-right">
                          <Button
                            size="sm"
                            variant="secondary"
                            leftIcon={<Pencil className="h-3.5 w-3.5" />}
                            onClick={() => openEdit(t)}
                          >
                            Edit
                          </Button>
                        </TD>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </>
      )}

      <ComplianceTypeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
        onSaved={reload}
      />

      <LegislationHistoryDrawer
        complianceType={historyType}
        onClose={() => setHistoryType(null)}
        canEdit={canManage}
        onUpdated={reload}
      />
    </div>
  );
}
