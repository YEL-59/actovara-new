/**
 * Authentication (PRD §7 Auth). Mock mode simulates the Express rules: generic wrong-credential
 * message, lockout after 10 failures, single-use expiring tokens, audit + notification entries.
 */
import { authMock, LOCK_MINUTES, type TokenKind } from '@/mocks/auth';
import { writeAudit } from '@/mocks/helpers';
import { mockStore } from '@/mocks/store';
import { newId } from '@/mocks/time';
import { passwordIssue } from '@/lib/password';
import type { Organisation, User } from '@/types/domain';
import { http } from './api';
import { USE_MOCKS } from './config';
import { ApiError } from './errors';
import { currentMockState, invalid, mockCall } from './mock-adapter';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WRONG_CREDENTIALS = 'The email or password is incorrect.';

export interface LoginInput {
  email: string;
  password: string;
  remember: boolean;
}

export interface AuthPayload {
  user: User;
  org: Organisation | null;
}

export type TokenStatus = 'valid' | 'expired' | 'used' | 'invalid';

export interface TokenCheck {
  status: TokenStatus;
  email?: string;
  name?: string;
  orgName?: string;
  role?: User['role'];
  expiresAt?: string;
}

/** `?mockState=error` also fails form submissions, so the "server unreachable" alert can be reviewed. */
function forcedError() {
  if (currentMockState() === 'error') throw new ApiError(500, 'The server could not be reached (simulated by ?mockState=error).');
}

/** Run an audit write as a specific user, then restore the current actor. */
function auditAs(user: User, fn: () => void) {
  const prev = mockStore.actor()._id;
  mockStore.setActor(user._id);
  try {
    fn();
  } finally {
    mockStore.setActor(prev);
  }
}

function minutesUntil(iso: string) {
  return Math.max(1, Math.ceil((Date.parse(iso) - Date.now()) / 60_000));
}

function lockedError(until: string): never {
  const mins = minutesUntil(until);
  throw new ApiError(423, `Too many failed sign-in attempts. This account is locked for ${mins} more minute${mins === 1 ? '' : 's'}.`);
}

function inspect(kind: TokenKind, token: string): TokenCheck & { user?: User } {
  const rec = authMock.getToken(token);
  const db = mockStore.get();
  const user = rec ? db.users.find((u) => u._id === rec.userId) : undefined;
  if (!rec || rec.kind !== kind || !user) return { status: 'invalid' };
  const base = { email: user.email, name: user.name, role: user.role, orgName: user.orgId ? db.organisation.name : undefined, expiresAt: rec.expiresAt, user };
  if (rec.usedAt || (kind === 'invite' && user.status !== 'invited')) return { ...base, status: 'used' };
  if (Date.parse(rec.expiresAt) <= Date.now()) return { ...base, status: 'expired' };
  return { ...base, status: 'valid' };
}

function tokenError(status: TokenStatus): never {
  if (status === 'expired') throw new ApiError(410, 'This link has expired.');
  if (status === 'used') throw new ApiError(410, 'This link has already been used.');
  throw new ApiError(404, 'This link is not valid.');
}

export const authService = {
  login(input: LoginInput) {
    if (!USE_MOCKS) return http.post<AuthPayload>('/auth/login', input);
    return mockCall<AuthPayload>(
      () => {
        forcedError();
        const email = input.email.trim().toLowerCase();
        if (!EMAIL_RE.test(email)) invalid('Enter a valid email address.', 'email');
        if (!input.password) invalid('Enter your password.', 'password');

        const locked = authMock.lockedUntil(email);
        if (locked) lockedError(locked);

        const db = mockStore.get();
        const user = db.users.find((u) => u.email.toLowerCase() === email);
        const ok = !!user && user.status === 'active' && authMock.passwordMatches(user._id, input.password);
        if (!ok) {
          const { remaining, lockedUntil } = authMock.recordFailure(email);
          if (user) auditAs(user, () => mockStore.mutate((d) => writeAudit(d, 'login_failed', 'session', undefined, 'Failed sign-in attempt (wrong password)')));
          if (lockedUntil) lockedError(lockedUntil);
          const warn = remaining <= 3 ? ` ${remaining} attempt${remaining === 1 ? '' : 's'} left before sign-in is locked for ${LOCK_MINUTES} minutes.` : '';
          throw new ApiError(401, WRONG_CREDENTIALS + warn);
        }

        if (user.orgId && db.organisation.status === 'suspended') throw new ApiError(403, 'Your organisation’s access is suspended. Contact Actovara support.');

        authMock.clearFailures(email);
        auditAs(user, () =>
          mockStore.mutate((d) => {
            const u = d.users.find((x) => x._id === user._id)!;
            u.lastLoginAt = new Date().toISOString();
            writeAudit(d, 'login', 'session', undefined, `${u.name} signed in`);
          }),
        );
        const fresh = mockStore.get().users.find((u) => u._id === user._id)!;
        return { data: { user: fresh, org: fresh.orgId ? db.organisation : null }, message: 'Signed in', statusCode: 200 };
      },
      { kind: 'write' },
    );
  },

  logout() {
    if (!USE_MOCKS) return http.post<null>('/auth/logout');
    return mockCall<null>(
      () => {
        mockStore.mutate((d) => writeAudit(d, 'logout', 'session', undefined, `${mockStore.actor().name} signed out`));
        return { data: null, message: 'Signed out', statusCode: 200 };
      },
      { kind: 'write' },
    );
  },

  /** Always succeeds for a well-formed email, so the response never reveals whether an account exists. */
  forgotPassword(email: string) {
    if (!USE_MOCKS) return http.post<null>('/auth/forgot-password', { email });
    return mockCall<null>(
      () => {
        forcedError();
        const value = email.trim().toLowerCase();
        if (!EMAIL_RE.test(value)) invalid('Enter a valid email address.', 'email');
        const user = mockStore.get().users.find((u) => u.email.toLowerCase() === value && u.status === 'active');
        if (user) {
          authMock.issueToken('password_reset', user._id);
          const now = new Date().toISOString();
          mockStore.mutate((d) => {
            d.notifications.unshift({ _id: newId('ntf'), userId: user._id, recipientEmail: user.email, type: 'password_reset', subject: 'Reset your Actovara password', entityType: 'user', entityId: user._id, status: 'sent', sentAt: now, createdAt: now });
          });
        }
        return { data: null, message: 'If an account exists for that email, a reset link is on its way.', statusCode: 200 };
      },
      { kind: 'write' },
    );
  },

  /** Read call: lets the reset / invite pages show the expired or used state before the form. */
  checkToken(kind: TokenKind, token: string) {
    if (!USE_MOCKS) return http.get<TokenCheck>(`/auth/tokens/${encodeURIComponent(token)}`, { type: kind });
    return mockCall<TokenCheck>(
      () => {
        const { user: _user, ...check } = inspect(kind, token);
        return { data: check };
      },
      { empty: () => ({ status: 'invalid' }) },
    );
  },

  resetPassword(token: string, password: string) {
    if (!USE_MOCKS) return http.post<null>('/auth/reset-password', { token, password });
    return mockCall<null>(
      () => {
        forcedError();
        const check = inspect('password_reset', token);
        if (check.status !== 'valid' || !check.user) tokenError(check.status);
        const issue = passwordIssue(password, check.user.email);
        if (issue) invalid(issue, 'password');
        const user = check.user;
        authMock.setPassword(user._id, password);
        authMock.markUsed(token);
        authMock.clearFailures(user.email);
        auditAs(user, () => mockStore.mutate((d) => writeAudit(d, 'update', 'user', user._id, `${user.name} reset their password`)));
        return { data: null, message: 'Password updated. You can now sign in.', statusCode: 200 };
      },
      { kind: 'write' },
    );
  },

  acceptInvite(token: string, input: { name: string; password: string }) {
    if (!USE_MOCKS) return http.post<{ user: User }>('/auth/accept-invite', { token, ...input });
    return mockCall<{ user: User }>(
      () => {
        forcedError();
        const check = inspect('invite', token);
        if (check.status !== 'valid' || !check.user) tokenError(check.status);
        if (!input.name.trim()) invalid('Enter your full name.', 'name');
        const issue = passwordIssue(input.password, check.user.email);
        if (issue) invalid(issue, 'password');
        const id = check.user._id;
        authMock.setPassword(id, input.password);
        authMock.markUsed(token);
        auditAs(check.user, () =>
          mockStore.mutate((d) => {
            const u = d.users.find((x) => x._id === id)!;
            u.name = input.name.trim();
            u.status = 'active';
            u.lastLoginAt = new Date().toISOString();
            writeAudit(d, 'update', 'user', id, `${u.name} accepted their invitation`);
            writeAudit(d, 'login', 'session', undefined, `${u.name} signed in`);
          }),
        );
        return { data: { user: mockStore.get().users.find((u) => u._id === id)! }, message: 'Welcome to Actovara', statusCode: 200 };
      },
      { kind: 'write' },
    );
  },
};
