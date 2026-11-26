'use client';

import React, { useEffect, useState } from 'react';
import { BellRing, Mail, Plus, Save, Trash2 } from 'lucide-react';
import { SettingsFormSkeleton, SettingsTableSkeleton } from '@/components/settings';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Pagination,
  Select,
  Switch,
  TD,
  TH,
  Table,
  useToast,
} from '@/components/ui';
import { formatDateTime } from '@/lib/format';
import { useApi } from '@/lib/hooks/useApi';
import { useSession } from '@/lib/session-mock';
import { errorMessage, notificationsService, organisationService } from '@/services';
import type { NotificationLog } from '@/types/domain';

const ORG_THRESHOLD_OPTIONS = [90, 60, 30, 14, 7];
const PERSONAL_THRESHOLD_OPTIONS = [90, 60, 30, 14, 7, 0];

const DELIVERY_STATUS_BADGE: Record<NotificationLog['status'], 'ok' | 'info' | 'warn' | 'danger' | 'neutral'> = {
  delivered: 'ok',
  sent: 'info',
  queued: 'neutral',
  bounced: 'warn',
  failed: 'danger',
};

const TYPE_LABEL: Record<NotificationLog['type'], string> = {
  cert_expiry: 'Certificate expiry',
  action_overdue: 'Action overdue',
  action_assigned: 'Action assigned',
  action_external: 'Action sent to external contact',
  invite: 'Team invite',
  password_reset: 'Password reset',
};

export default function NotificationsSettingsPage() {
  const { can } = useSession();
  const { toast } = useToast();
  const isOrgAdmin = can('org.settings');

  // Personal preferences (available to both Org Admin and Manager)
  const {
    data: myPrefs,
    error: prefsError,
    loading: prefsLoading,
    reload: reloadPrefs,
  } = useApi(() => notificationsService.getMyPreferences(), []);

  const [myThresholds, setMyThresholds] = useState<number[]>([60, 30, 7, 0]);
  const [overdueActions, setOverdueActions] = useState(true);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (!myPrefs) return;
    setMyThresholds(myPrefs.thresholds ?? [60, 30, 7, 0]);
    setOverdueActions(myPrefs.overdueActions ?? true);
    setUnsubscribed(myPrefs.unsubscribed ?? false);
  }, [myPrefs]);

  // Org settings (Org Admin only)
  const {
    data: orgSettings,
    error: orgError,
    loading: orgLoading,
    reload: reloadOrg,
  } = useApi(() => (isOrgAdmin ? organisationService.getNotificationSettings() : Promise.resolve({ success: true, statusCode: 200, data: null })), [isOrgAdmin]);

  const [orgThresholds, setOrgThresholds] = useState<number[]>([60, 30, 7]);
  const [dueSoonDays, setDueSoonDays] = useState('60');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [newRecipient, setNewRecipient] = useState('');
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [dueSoonError, setDueSoonError] = useState<string | null>(null);
  const [savingOrg, setSavingOrg] = useState(false);

  useEffect(() => {
    if (!orgSettings) return;
    setOrgThresholds(orgSettings.reminderThresholds ?? [60, 30, 7]);
    setDueSoonDays(String(orgSettings.dueSoonDays ?? 60));
    setRecipients(orgSettings.reminderRecipients ?? []);
  }, [orgSettings]);

  // Delivery log (Org Admin only)
  const [logType, setLogType] = useState<string>('');
  const [logStatus, setLogStatus] = useState<string>('');
  const [logPage, setLogPage] = useState(1);

  const {
    data: logRows,
    meta: logMeta,
    error: logError,
    loading: logLoading,
    reload: reloadLog,
  } = useApi(
    () =>
      isOrgAdmin
        ? notificationsService.log({
            type: (logType || undefined) as NotificationLog['type'] | undefined,
            status: (logStatus || undefined) as NotificationLog['status'] | undefined,
            page: logPage,
            limit: 10,
          })
        : Promise.resolve({ success: true, statusCode: 200, data: [] as NotificationLog[] }),
    [isOrgAdmin, logType, logStatus, logPage],
  );

  const toggleThreshold = (list: number[], setList: (next: number[]) => void, day: number) => {
    if (list.includes(day)) setList(list.filter((d) => d !== day));
    else setList([...list, day].sort((a, b) => b - a));
  };

  const handleSaveMyPrefs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      await notificationsService.updateMyPreferences({
        thresholds: myThresholds,
        overdueActions,
        unsubscribed,
      });
      toast({ tone: 'success', title: 'Personal notification preferences saved' });
      reloadPrefs();
    } catch (err) {
      toast({ tone: 'error', title: 'Could not save preferences', description: errorMessage(err) });
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleAddRecipient = () => {
    const email = newRecipient.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setRecipientError('Enter a valid email address.');
      return;
    }
    if (recipients.includes(email)) {
      setRecipientError('This email is already in the list.');
      return;
    }
    setRecipientError(null);
    setRecipients([...recipients, email]);
    setNewRecipient('');
  };

  const handleSaveOrgSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const days = Number(dueSoonDays);
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      setDueSoonError('Due-soon window must be between 1 and 365 days.');
      return;
    }
    setDueSoonError(null);
    setSavingOrg(true);
    try {
      await organisationService.updateNotificationSettings({
        reminderThresholds: orgThresholds,
        dueSoonDays: days,
        reminderRecipients: recipients,
      });
      toast({ tone: 'success', title: 'Organisation reminder settings saved' });
      reloadOrg();
    } catch (err) {
      toast({ tone: 'error', title: 'Could not save reminder settings', description: errorMessage(err) });
    } finally {
      setSavingOrg(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Personal Preferences */}
      {prefsLoading ? (
        <SettingsFormSkeleton />
      ) : prefsError ? (
        <Alert tone="error" title="Could not load personal preferences" onRetry={reloadPrefs}>
          {prefsError}
        </Alert>
      ) : (
        <Card>
          <CardHeader
            title="Personal Notification Preferences"
            description="Choose which compliance and action reminders are sent to your email."
          />
          <form onSubmit={handleSaveMyPrefs} className="space-y-5">
            <div className="space-y-2">
              <span className="text-sm font-medium text-ink">Certificate expiry reminders (days before due)</span>
              <div className="flex flex-wrap gap-2">
                {PERSONAL_THRESHOLD_OPTIONS.map((day) => {
                  const active = myThresholds.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={unsubscribed}
                      onClick={() => toggleThreshold(myThresholds, setMyThresholds, day)}
                      className={`focus-ring rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                        active
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-line bg-surface text-ink-muted hover:bg-table-head'
                      }`}
                    >
                      {day === 0 ? 'On expiry day' : `${day} days`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 border-t border-line pt-4">
              <Switch
                label="Overdue action alerts"
                description="Receive email alerts when actions assigned to you pass their due date."
                checked={overdueActions}
                disabled={unsubscribed}
                onChange={setOverdueActions}
              />
              <Switch
                label="Unsubscribe from all automated reminders"
                description="Pause all scheduled reminder emails (security & invite emails still send)."
                checked={unsubscribed}
                onChange={setUnsubscribed}
              />
            </div>

            <div className="flex justify-end border-t border-line pt-4">
              <Button type="submit" isLoading={savingPrefs} leftIcon={<Save className="h-4 w-4" />}>
                Save preferences
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Organisation Reminder Settings (Org Admin only) */}
      {isOrgAdmin && (
        <>
          {orgLoading ? (
            <SettingsFormSkeleton />
          ) : orgError ? (
            <Alert tone="error" title="Could not load organisation reminder settings" onRetry={reloadOrg}>
              {orgError}
            </Alert>
          ) : (
            <Card>
              <CardHeader
                title="Organisation Reminder Rules"
                description="Configure default reminder thresholds, the due-soon window, and extra CC recipients."
              />
              <form onSubmit={handleSaveOrgSettings} className="space-y-5">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-ink">Active reminder thresholds</span>
                  <p className="text-meta text-ink-muted">Default recommendation: 60, 30, and 7 days before expiry.</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {ORG_THRESHOLD_OPTIONS.map((day) => {
                      const active = orgThresholds.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleThreshold(orgThresholds, setOrgThresholds, day)}
                          className={`focus-ring rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors ${
                            active
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-line bg-surface text-ink-muted hover:bg-table-head'
                          }`}
                        >
                          {day} days
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Due-soon window (days)"
                    type="number"
                    min={1}
                    max={365}
                    value={dueSoonDays}
                    onChange={(e) => {
                      setDueSoonDays(e.target.value);
                      setDueSoonError(null);
                    }}
                    error={dueSoonError ?? undefined}
                    hint="Certificates expiring within this window are flagged as Due Soon."
                  />
                </div>

                <div className="space-y-3 border-t border-line pt-4">
                  <span className="text-sm font-medium text-ink">Extra reminder recipients</span>
                  <div className="flex flex-wrap gap-2">
                    <div className="min-w-[240px] flex-1">
                      <Input
                        label="Add recipient email"
                        hideLabel
                        type="email"
                        leftIcon={<Mail />}
                        placeholder="compliance@company.example"
                        value={newRecipient}
                        onChange={(e) => {
                          setNewRecipient(e.target.value);
                          setRecipientError(null);
                        }}
                        error={recipientError ?? undefined}
                      />
                    </div>
                    <Button type="button" variant="secondary" onClick={handleAddRecipient} leftIcon={<Plus className="h-4 w-4" />}>
                      Add recipient
                    </Button>
                  </div>
                  {recipients.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                      {recipients.map((email) => (
                        <li
                          key={email}
                          className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1 text-sm text-ink"
                        >
                          <span>{email}</span>
                          <button
                            type="button"
                            onClick={() => setRecipients(recipients.filter((r) => r !== email))}
                            aria-label={`Remove ${email}`}
                            className="focus-ring rounded-full p-0.5 text-ink-muted hover:text-danger-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex justify-end border-t border-line pt-4">
                  <Button type="submit" isLoading={savingOrg} leftIcon={<Save className="h-4 w-4" />}>
                    Save reminder rules
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Reminder Delivery Log */}
          <Card padding="none" className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
              <div>
                <h2 className="text-card-title text-ink">Reminder Delivery Log</h2>
                <p className="text-meta text-ink-muted">Recent automated compliance and action emails.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  label="Filter by type"
                  hideLabel
                  value={logType}
                  onChange={(e) => {
                    setLogType(e.target.value);
                    setLogPage(1);
                  }}
                  options={[
                    { value: '', label: 'All types' },
                    { value: 'cert_expiry', label: 'Certificate expiry' },
                    { value: 'action_overdue', label: 'Action overdue' },
                    { value: 'action_assigned', label: 'Action assigned' },
                    { value: 'action_external', label: 'Action sent to external contact' },
                    { value: 'invite', label: 'Team invite' },
                  ]}
                />
                <Select
                  label="Filter by status"
                  hideLabel
                  value={logStatus}
                  onChange={(e) => {
                    setLogStatus(e.target.value);
                    setLogPage(1);
                  }}
                  options={[
                    { value: '', label: 'All statuses' },
                    { value: 'delivered', label: 'Delivered' },
                    { value: 'sent', label: 'Sent' },
                    { value: 'queued', label: 'Queued' },
                    { value: 'bounced', label: 'Bounced' },
                    { value: 'failed', label: 'Failed' },
                  ]}
                />
              </div>
            </div>

            {logLoading ? (
              <div className="p-4">
                <SettingsTableSkeleton rows={5} />
              </div>
            ) : logError ? (
              <div className="p-6">
                <Alert tone="error" title="Could not load delivery log" onRetry={reloadLog}>
                  {logError}
                </Alert>
              </div>
            ) : !logRows || logRows.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<BellRing className="h-7 w-7" />}
                  title="No notifications logged"
                  description="No emails match the selected filters."
                />
              </div>
            ) : (
              <>
                <div className="divide-y divide-line sm:hidden">
                  {logRows.map((n) => (
                    <div key={n._id} className="space-y-1.5 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-ink-muted">{TYPE_LABEL[n.type]}</span>
                        <Badge tone={DELIVERY_STATUS_BADGE[n.status]}>{n.status}</Badge>
                      </div>
                      <p className="text-sm font-medium text-ink">{n.subject}</p>
                      <p className="text-meta text-ink-muted">
                        {n.recipientEmail} · {formatDateTime(n.sentAt ?? n.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="hidden sm:block">
                  <Table aria-label="Notification delivery log">
                    <thead>
                      <tr>
                        <TH>Recipient</TH>
                        <TH>Type</TH>
                        <TH>Subject</TH>
                        <TH>Status</TH>
                        <TH>Sent at</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {logRows.map((n) => (
                        <tr key={n._id}>
                          <TD className="font-medium text-ink">{n.recipientEmail}</TD>
                          <TD className="text-ink-muted">{TYPE_LABEL[n.type]}</TD>
                          <TD className="max-w-md truncate text-ink">{n.subject}</TD>
                          <TD>
                            <Badge tone={DELIVERY_STATUS_BADGE[n.status]}>{n.status}</Badge>
                          </TD>
                          <TD className="text-ink-muted">{formatDateTime(n.sentAt ?? n.createdAt)}</TD>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {logMeta && logMeta.totalPage > 1 && (
                  <div className="border-t border-line px-6 py-4">
                    <Pagination page={logMeta.page} totalPages={logMeta.totalPage} total={logMeta.total} limit={logMeta.limit} onPageChange={setLogPage} />
                  </div>
                )}
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
