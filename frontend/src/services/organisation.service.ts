import { includesText, requirePermission, writeAudit } from '@/mocks/helpers';
import { mockStore } from '@/mocks/store';
import { newId } from '@/mocks/time';
import type {
  AdminOrganisationView,
  AuditEvent,
  CreateOrganisationInput,
  NotificationLog,
  Organisation,
  Role,
  TeamPayload,
  User,
} from '@/types/domain';
import { UK_POSTCODE_RE } from './properties.service';
import { http } from './api';
import { USE_MOCKS } from './config';
import { conflict, invalid, mockCall, notFound, paginate } from './mock-adapter';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type OrgProfile = Pick<Organisation, 'name' | 'legalName' | 'email' | 'phone' | 'address'> & { timezone?: string };
type NotificationSettings = Organisation['settings'];

export const organisationService = {
  get() {
    if (!USE_MOCKS) return http.get<Organisation>('/settings/organisation');
    return mockCall(() => ({ data: mockStore.get().organisation }));
  },

  update(input: Partial<OrgProfile>) {
    if (!USE_MOCKS) return http.patch<Organisation>('/settings/organisation', input);
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('org.settings');
          if (input.name !== undefined && !input.name.trim()) invalid('Enter the organisation name.', 'name');
          if (input.email !== undefined && !EMAIL_RE.test(input.email)) invalid('Enter a valid email address.', 'email');
          if (input.address) {
            if (!input.address.line1?.trim()) invalid('Enter the street address.', 'address.line1');
            if (!input.address.city?.trim()) invalid('Enter the city.', 'address.city');
            if (!input.address.postcode?.trim()) invalid('Enter the postcode.', 'address.postcode');
          }
          const before = {
            name: db.organisation.name,
            legalName: db.organisation.legalName,
            email: db.organisation.email,
            phone: db.organisation.phone,
            timezone: db.organisation.settings.timezone,
          };
          const { timezone, ...profile } = input;
          Object.assign(db.organisation, profile);
          if (timezone) db.organisation.settings.timezone = timezone;
          const after = {
            name: db.organisation.name,
            legalName: db.organisation.legalName,
            email: db.organisation.email,
            phone: db.organisation.phone,
            timezone: db.organisation.settings.timezone,
          };
          writeAudit(db, 'update', 'organisation', db.organisation._id, 'Updated the organisation profile', { before, after });
          return { data: db.organisation, message: 'Organisation saved', statusCode: 200 };
        }),
      { kind: 'write' },
    );
  },

  getNotificationSettings() {
    if (!USE_MOCKS) return http.get<NotificationSettings>('/settings/notifications');
    return mockCall(() => ({ data: mockStore.get().organisation.settings }));
  },

  updateNotificationSettings(input: Partial<NotificationSettings>) {
    if (!USE_MOCKS) return http.patch<NotificationSettings>('/settings/notifications', input);
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('org.settings');
          if (input.dueSoonDays !== undefined && (input.dueSoonDays < 1 || input.dueSoonDays > 365)) invalid('“Due soon” must be between 1 and 365 days.', 'dueSoonDays');
          if (input.reminderRecipients?.some((e) => !EMAIL_RE.test(e))) invalid('One of the recipient emails is not valid.', 'reminderRecipients');
          const before = {
            reminderThresholds: [...db.organisation.settings.reminderThresholds],
            dueSoonDays: db.organisation.settings.dueSoonDays,
            reminderRecipients: [...db.organisation.settings.reminderRecipients],
          };
          Object.assign(db.organisation.settings, input);
          if (input.reminderThresholds) db.organisation.settings.reminderThresholds = input.reminderThresholds.filter((v, i, arr) => arr.indexOf(v) === i).sort((a, b) => b - a);
          const after = {
            reminderThresholds: [...db.organisation.settings.reminderThresholds],
            dueSoonDays: db.organisation.settings.dueSoonDays,
            reminderRecipients: [...db.organisation.settings.reminderRecipients],
          };
          writeAudit(db, 'update', 'organisation', db.organisation._id, 'Updated reminder settings', { before, after });
          return { data: db.organisation.settings, message: 'Reminder settings saved', statusCode: 200 };
        }),
      { kind: 'write' },
    );
  },
};

export const teamService = {
  list() {
    if (!USE_MOCKS) return http.get<TeamPayload>('/team');
    return mockCall<TeamPayload>(
      () => {
        requirePermission('team.manage');
        const db = mockStore.get();
        const users = db.users.filter((u) => u.orgId === db.organisation._id);
        return { data: { users, seatLimit: db.organisation.seatLimit, activeCount: users.filter((u) => u.status !== 'deactivated').length } };
      },
      { empty: () => ({ users: [], seatLimit: 10, activeCount: 0 }) },
    );
  },

  invite(input: { name: string; email: string; role: Exclude<Role, 'platform_admin'> }) {
    if (!USE_MOCKS) return http.post<User>('/team/invite', input);
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('team.manage');
          if (!input.name?.trim()) invalid('Enter their name.', 'name');
          if (!EMAIL_RE.test(input.email ?? '')) invalid('Enter a valid email address.', 'email');
          if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) invalid('Someone with that email is already on the team.', 'email');
          const seats = db.users.filter((u) => u.orgId === db.organisation._id && u.status !== 'deactivated').length;
          if (seats >= db.organisation.seatLimit) conflict(`All ${db.organisation.seatLimit} seats are in use. Deactivate a user first.`);
          const now = new Date().toISOString();
          const user: User = {
            _id: newId('usr'),
            orgId: db.organisation._id,
            name: input.name.trim(),
            email: input.email.trim().toLowerCase(),
            role: input.role,
            status: 'invited',
            notificationPrefs: { thresholds: [60, 30, 7, 0], overdueActions: true, unsubscribed: false },
            createdAt: now,
          };
          db.users.push(user);
          db.notifications.unshift({ _id: newId('ntf'), userId: user._id, recipientEmail: user.email, type: 'invite', subject: `You have been invited to ${db.organisation.name} on Actovara`, entityType: 'user', entityId: user._id, status: 'sent', sentAt: now, createdAt: now });
          writeAudit(db, 'create', 'user', user._id, `Invited ${user.name} as ${input.role === 'org_admin' ? 'Org Admin' : 'Manager'}`);
          return { data: user, message: `Invitation sent to ${user.email}`, statusCode: 201 };
        }),
      { kind: 'write' },
    );
  },

  update(userId: string, input: { role?: Exclude<Role, 'platform_admin'>; status?: 'active' | 'deactivated' }) {
    if (!USE_MOCKS) return http.patch<User>(`/team/${userId}`, input);
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('team.manage');
          const u = db.users.find((x) => x._id === userId && x.orgId === db.organisation._id) ?? notFound('User');
          const admins = db.users.filter((x) => x.orgId === db.organisation._id && x.role === 'org_admin' && x.status === 'active');
          const losesAdmin = u.role === 'org_admin' && (input.role === 'manager' || input.status === 'deactivated');
          if (losesAdmin && admins.length <= 1) conflict('The organisation needs at least one active Org Admin.');
          const before = { role: u.role, status: u.status };
          if (input.role) u.role = input.role;
          if (input.status) u.status = input.status;
          const after = { role: u.role, status: u.status };
          writeAudit(db, 'update', 'user', u._id, `Updated ${u.name}${input.role ? `: role ${input.role}` : ''}${input.status ? `: ${input.status}` : ''}`, { before, after });
          return { data: u, message: 'Team member updated', statusCode: 200 };
        }),
      { kind: 'write' },
    );
  },

  /** Active org users, e.g. for the action owner picker (any authenticated org user). */
  assignees() {
    if (!USE_MOCKS) return http.get<User[]>('/team', { status: 'active' });
    return mockCall(() => {
      const db = mockStore.get();
      return { data: db.users.filter((u) => u.orgId === db.organisation._id && u.status === 'active') };
    });
  },
};

export const notificationsService = {
  getMyPreferences() {
    if (!USE_MOCKS) return http.get<User['notificationPrefs']>('/notifications/preferences');
    return mockCall(() => {
      const db = mockStore.get();
      const actor = mockStore.actor();
      const user = db.users.find((u) => u._id === actor._id) ?? actor;
      return { data: user.notificationPrefs };
    });
  },

  updateMyPreferences(input: Partial<User['notificationPrefs']>) {
    if (!USE_MOCKS) return http.patch<User['notificationPrefs']>('/notifications/preferences', input);
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          const actor = mockStore.actor();
          const user = db.users.find((u) => u._id === actor._id);
          if (!user) notFound('User');
          const before = { ...user.notificationPrefs };
          Object.assign(user.notificationPrefs, input);
          if (input.thresholds) {
            user.notificationPrefs.thresholds = input.thresholds.filter((v, i, arr) => arr.indexOf(v) === i).sort((a, b) => b - a);
          }
          writeAudit(db, 'update', 'user', user._id, `Updated personal notification preferences for ${user.name}`, {
            before,
            after: { ...user.notificationPrefs },
          });
          return { data: user.notificationPrefs, message: 'Notification preferences saved', statusCode: 200 };
        }),
      { kind: 'write' },
    );
  },

  log(q: { type?: NotificationLog['type']; status?: NotificationLog['status']; page?: number; limit?: number } = {}) {
    if (!USE_MOCKS) return http.get<NotificationLog[]>('/notifications/log', q);
    return mockCall(
      () => {
        requirePermission('org.settings');
        const rows = mockStore.get().notifications.filter((n) => (!q.type || n.type === q.type) && (!q.status || n.status === q.status));
        return paginate(rows, q.page, q.limit ?? 25);
      },
      { empty: () => [] },
    );
  },
};

export interface AuditQuery {
  entityType?: AuditEvent['entityType'];
  entityId?: string;
  actorId?: string;
  action?: AuditEvent['action'];
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const auditService = {
  list(q: AuditQuery = {}) {
    if (!USE_MOCKS) return http.get<AuditEvent[]>('/audit-events', q);
    return mockCall(
      () => {
        requirePermission('audit.view');
        const toBound = q.to && q.to.length === 10 ? `${q.to}T23:59:59.999Z` : q.to;
        const rows = mockStore
          .get()
          .auditEvents.filter(
            (e) =>
              (!q.entityType || e.entityType === q.entityType) &&
              (!q.entityId || e.entityId === q.entityId) &&
              (!q.actorId || e.actorId === q.actorId) &&
              (!q.action || e.action === q.action) &&
              (!q.from || e.createdAt >= q.from) &&
              (!toBound || e.createdAt <= toBound) &&
              includesText([e.summary, e.actorName], q.search),
          );
        return paginate(rows, q.page, q.limit ?? 25);
      },
      { empty: () => [] },
    );
  },
};

function toAdminOrgView(
  org: Organisation,
  users: User[],
  propertyCount: number,
): AdminOrganisationView {
  const orgUsers = users.filter((u) => u.orgId === org._id && u.status !== 'deactivated');
  const primaryAdmin = orgUsers.find((u) => u.role === 'org_admin');
  return {
    ...org,
    activeUsers: orgUsers.length || (org._id === 'org_demo' ? 0 : 1),
    propertyCount,
    adminEmail: primaryAdmin?.email ?? org.email,
  };
}

/** Platform console (platform_admin only). */
export const adminService = {
  organisations(q: { search?: string; status?: Organisation['status'] } = {}) {
    if (!USE_MOCKS) return http.get<AdminOrganisationView[]>('/admin/organisations', q);
    return mockCall(
      () => {
        requirePermission('org.manage');
        const db = mockStore.get();
        const all = [db.organisation, ...db.otherOrganisations].map((org) =>
          toAdminOrgView(
            org,
            db.users,
            org._id === db.organisation._id ? db.properties.filter((p) => p.status === 'active').length : 0,
          ),
        );
        const filtered = all.filter(
          (o) =>
            (!q.status || o.status === q.status) &&
            includesText([o.name, o.legalName, o.email, o.address.city, o.address.postcode], q.search),
        );
        return { data: filtered };
      },
      { empty: () => [] },
    );
  },

  createOrganisation(input: CreateOrganisationInput) {
    if (!USE_MOCKS) {
      return http.post<{ organisation: AdminOrganisationView; adminUser: User; inviteSent: boolean }>(
        '/admin/organisations',
        input,
      );
    }
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('org.manage');
          const name = input.name?.trim() ?? '';
          const email = input.email?.trim().toLowerCase() ?? '';
          const adminName = input.adminName?.trim() ?? '';
          const adminEmail = input.adminEmail?.trim().toLowerCase() ?? '';
          const line1 = input.address?.line1?.trim() ?? '';
          const city = input.address?.city?.trim() ?? '';
          const postcode = input.address?.postcode?.trim().toUpperCase() ?? '';
          const seatLimit = Number(input.seatLimit ?? 15);

          if (!name) invalid('Enter the organisation name.', 'name');
          if (!EMAIL_RE.test(email)) invalid('Enter a valid organisation email address.', 'email');
          if (!line1) invalid('Enter the street address.', 'address.line1');
          if (!city) invalid('Enter the city.', 'address.city');
          if (!UK_POSTCODE_RE.test(postcode)) invalid('Enter a valid UK postcode (e.g. SW1A 1AA).', 'address.postcode');
          if (!Number.isInteger(seatLimit) || seatLimit < 1 || seatLimit > 500) {
            invalid('Seat limit must be between 1 and 500.', 'seatLimit');
          }
          if (!adminName) invalid('Enter the first admin’s name.', 'adminName');
          if (!EMAIL_RE.test(adminEmail)) invalid('Enter a valid admin email address.', 'adminEmail');
          if (db.users.some((u) => u.email.toLowerCase() === adminEmail)) {
            invalid('A user with that email already exists.', 'adminEmail');
          }

          const now = new Date().toISOString();
          const orgId = newId('org');
          const org: Organisation = {
            _id: orgId,
            name,
            legalName: input.legalName?.trim() || name,
            email,
            phone: input.phone?.trim() || undefined,
            address: {
              line1,
              line2: input.address?.line2?.trim() || undefined,
              city,
              postcode,
            },
            settings: {
              reminderThresholds: [60, 30, 7, 0],
              dueSoonDays: 60,
              reminderRecipients: [],
              timezone: 'Europe/London',
            },
            seatLimit,
            status: 'active',
            createdAt: now,
          };
          const adminUser: User = {
            _id: newId('usr'),
            orgId,
            name: adminName,
            email: adminEmail,
            role: 'org_admin',
            status: 'invited',
            jobTitle: 'Organisation Admin',
            notificationPrefs: { thresholds: [60, 30, 7, 0], overdueActions: true, unsubscribed: false },
            createdAt: now,
          };

          db.otherOrganisations.unshift(org);
          db.users.push(adminUser);
          db.notifications.unshift({
            _id: newId('ntf'),
            userId: adminUser._id,
            recipientEmail: adminUser.email,
            type: 'invite',
            subject: `You have been invited to ${org.name} on Actovara`,
            entityType: 'user',
            entityId: adminUser._id,
            status: 'sent',
            sentAt: now,
            createdAt: now,
          });
          writeAudit(db, 'create', 'organisation', org._id, `Created organisation ${org.name} and invited ${adminUser.email}`, {
            after: { name: org.name, seatLimit: org.seatLimit, adminEmail: adminUser.email },
          });

          return {
            data: { organisation: toAdminOrgView(org, db.users, 0), adminUser, inviteSent: true },
            message: `${org.name} created and invite sent to ${adminUser.email}`,
            statusCode: 201,
          };
        }),
      { kind: 'write' },
    );
  },

  setStatus(orgId: string, status: Organisation['status']) {
    if (!USE_MOCKS) return http.patch<Organisation>(`/admin/organisations/${orgId}`, { status });
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('org.manage');
          const org = [db.organisation, ...db.otherOrganisations].find((o) => o._id === orgId) ?? notFound('Organisation');
          const before = { status: org.status };
          org.status = status;
          writeAudit(db, 'update', 'organisation', orgId, `${status === 'suspended' ? 'Suspended' : 'Reactivated'} ${org.name}`, {
            before,
            after: { status },
          });
          return { data: org, message: `${org.name} ${status === 'suspended' ? 'suspended' : 'reactivated'}`, statusCode: 200 };
        }),
      { kind: 'write' },
    );
  },

  updateSeatLimit(orgId: string, seatLimit: number) {
    if (!USE_MOCKS) return http.patch<Organisation>(`/admin/organisations/${orgId}`, { seatLimit });
    return mockCall(
      () =>
        mockStore.mutate((db) => {
          requirePermission('org.manage');
          if (!Number.isInteger(seatLimit) || seatLimit < 1 || seatLimit > 500) {
            invalid('Seat limit must be between 1 and 500.', 'seatLimit');
          }
          const org = [db.organisation, ...db.otherOrganisations].find((o) => o._id === orgId) ?? notFound('Organisation');
          const before = { seatLimit: org.seatLimit };
          org.seatLimit = seatLimit;
          writeAudit(db, 'update', 'organisation', orgId, `Updated seat limit for ${org.name} to ${seatLimit}`, {
            before,
            after: { seatLimit },
          });
          return { data: org, message: `Seat limit updated to ${seatLimit}`, statusCode: 200 };
        }),
      { kind: 'write' },
    );
  },
};
