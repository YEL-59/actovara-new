'use client';

import React, { useState } from 'react';
import { ShieldAlert, UserCheck, UserPlus, Users, UserX } from 'lucide-react';
import { InviteMemberModal, SettingsTableSkeleton } from '@/components/settings';
import { Alert, Avatar, Badge, Button, Card, EmptyState, Select, TD, TH, Table, useToast } from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { useApi } from '@/lib/hooks/useApi';
import { roleLabel } from '@/lib/permissions';
import { useSession } from '@/lib/session-mock';
import { errorMessage, teamService } from '@/services';
import type { Role, User, UserStatus } from '@/types/domain';

const STATUS_BADGE: Record<UserStatus, { tone: 'ok' | 'info' | 'neutral'; label: string }> = {
  active: { tone: 'ok', label: 'Active' },
  invited: { tone: 'info', label: 'Invited' },
  deactivated: { tone: 'neutral', label: 'Deactivated' },
};

export default function TeamSettingsPage() {
  const { can, user: currentUser } = useSession();
  const { toast } = useToast();
  const allowed = can('team.manage');

  const { data, error, loading, reload } = useApi(() => teamService.list(), [allowed]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  if (!allowed) {
    return (
      <Alert tone="warning" title="Restricted to Organisation Admins">
        You do not have permission to view or manage team members. Switch to an Org Admin account to access Team settings.
      </Alert>
    );
  }

  if (loading) return <SettingsTableSkeleton rows={5} />;

  if (error) {
    return (
      <Alert tone="error" title="Could not load team members" onRetry={reload}>
        {error}
      </Alert>
    );
  }

  const users = data?.users ?? [];
  const seatLimit = data?.seatLimit ?? 10;
  const activeCount = data?.activeCount ?? 0;
  const seatsRemaining = Math.max(0, seatLimit - activeCount);
  const seatPercent = Math.min(100, Math.round((activeCount / seatLimit) * 100));

  const handleRoleChange = async (member: User, newRole: Exclude<Role, 'platform_admin'>) => {
    if (member.role === newRole) return;
    setBusyUserId(member._id);
    try {
      await teamService.update(member._id, { role: newRole });
      toast({ tone: 'success', title: `${member.name} is now ${roleLabel[newRole]}` });
      reload();
    } catch (err) {
      toast({ tone: 'error', title: 'Could not update role', description: errorMessage(err) });
    } finally {
      setBusyUserId(null);
    }
  };

  const handleToggleStatus = async (member: User) => {
    const nextStatus = member.status === 'deactivated' ? 'active' : 'deactivated';
    setBusyUserId(member._id);
    try {
      await teamService.update(member._id, { status: nextStatus });
      toast({
        tone: 'success',
        title: nextStatus === 'active' ? `${member.name} reactivated` : `${member.name} deactivated`,
      });
      reload();
    } catch (err) {
      toast({ tone: 'error', title: 'Could not update member status', description: errorMessage(err) });
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-card-title text-ink">Seat usage</h2>
              <Badge tone={seatsRemaining === 0 ? 'warn' : 'info'}>
                {activeCount} / {seatLimit} used
              </Badge>
            </div>
            <div className="h-2 w-full max-w-md overflow-hidden rounded-full bg-neutral-100">
              <div
                className={seatsRemaining === 0 ? 'h-full bg-warn-500 transition-all' : 'h-full bg-brand-600 transition-all'}
                style={{ width: `${seatPercent}%` }}
              />
            </div>
            <p className="text-meta text-ink-muted">
              {seatsRemaining === 0
                ? 'All seats are occupied. Deactivate a user to free up a seat.'
                : `${seatsRemaining} seat${seatsRemaining === 1 ? '' : 's'} available on your current plan.`}
            </p>
          </div>
          <Button onClick={() => setInviteOpen(true)} leftIcon={<UserPlus className="h-4 w-4" />}>
            Invite member
          </Button>
        </div>
      </Card>

      {users.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title="No team members yet"
            description="Invite colleagues to collaborate on properties, certificates, and compliance actions."
            action={
              <Button onClick={() => setInviteOpen(true)} leftIcon={<UserPlus className="h-4 w-4" />}>
                Invite member
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          {/* Mobile card view */}
          <div className="space-y-3 sm:hidden">
            {users.map((m) => {
              const st = STATUS_BADGE[m.status];
              const isSelf = m._id === currentUser?._id;
              return (
                <Card key={m._id} className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={m.name} />
                      <div>
                        <p className="font-semibold text-ink">
                          {m.name} {isSelf && <span className="text-meta font-normal text-ink-muted">(You)</span>}
                        </p>
                        <p className="text-meta text-ink-muted">{m.email}</p>
                      </div>
                    </div>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    <Select
                      label="Role"
                      value={m.role === 'platform_admin' ? 'org_admin' : m.role}
                      disabled={busyUserId === m._id || m.status === 'deactivated'}
                      onChange={(e) => handleRoleChange(m, e.target.value as Exclude<Role, 'platform_admin'>)}
                      options={[
                        { value: 'org_admin', label: 'Org Admin' },
                        { value: 'manager', label: 'Manager' },
                      ]}
                    />
                    <div className="flex items-center justify-between text-meta text-ink-muted">
                      <span>Last login: {m.lastLoginAt ? formatDateTime(m.lastLoginAt) : 'Never'}</span>
                      {m.status !== 'invited' && (
                        <Button
                          size="sm"
                          variant={m.status === 'deactivated' ? 'secondary' : 'ghost'}
                          disabled={busyUserId === m._id}
                          onClick={() => handleToggleStatus(m)}
                        >
                          {m.status === 'deactivated' ? 'Reactivate' : 'Deactivate'}
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
            <Table aria-label="Team members">
              <thead>
                <tr>
                  <TH>Member</TH>
                  <TH>Role</TH>
                  <TH>Status</TH>
                  <TH>Last login</TH>
                  <TH className="text-right">Actions</TH>
                </tr>
              </thead>
              <tbody>
                {users.map((m) => {
                  const st = STATUS_BADGE[m.status];
                  const isSelf = m._id === currentUser?._id;
                  const isBusy = busyUserId === m._id;
                  return (
                    <tr key={m._id}>
                      <TD>
                        <div className="flex items-center gap-3">
                          <Avatar name={m.name} />
                          <div>
                            <div className="font-semibold text-ink">
                              {m.name} {isSelf && <span className="text-meta font-normal text-ink-muted">(You)</span>}
                            </div>
                            <div className="text-meta text-ink-muted">{m.email}</div>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <div className="w-40">
                          <Select
                            label={`Role for ${m.name}`}
                            hideLabel
                            value={m.role === 'platform_admin' ? 'org_admin' : m.role}
                            disabled={isBusy || m.status === 'deactivated'}
                            onChange={(e) => handleRoleChange(m, e.target.value as Exclude<Role, 'platform_admin'>)}
                            options={[
                              { value: 'org_admin', label: 'Org Admin' },
                              { value: 'manager', label: 'Manager' },
                            ]}
                          />
                        </div>
                      </TD>
                      <TD>
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </TD>
                      <TD className="text-ink-muted">{m.lastLoginAt ? formatDateTime(m.lastLoginAt) : 'Not yet signed in'}</TD>
                      <TD className="text-right">
                        {m.status === 'deactivated' ? (
                          <Button
                            size="sm"
                            variant="secondary"
                            isLoading={isBusy}
                            leftIcon={<UserCheck className="h-4 w-4" />}
                            onClick={() => handleToggleStatus(m)}
                          >
                            Reactivate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            isLoading={isBusy}
                            leftIcon={isSelf ? <ShieldAlert className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                            onClick={() => handleToggleStatus(m)}
                          >
                            Deactivate
                          </Button>
                        )}
                      </TD>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </>
      )}

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        seatsRemaining={seatsRemaining}
        onInvited={reload}
      />
    </div>
  );
}
