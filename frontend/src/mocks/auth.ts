/**
 * Mock authentication state (FRONTEND_FIRST demo only). Kept apart from the demo DB so the
 * fixture shape (MOCK_DB_VERSION) does not change. Real auth lives in Express (TASK-018):
 * bcrypt hashes, hashed single-use tokens and lockout counters in MongoDB.
 *
 * Passwords set during the demo are kept as a non-reversible hash (FNV-1a), never as plain text.
 */
const KEY = 'actovara.demo.auth';
const MINUTE = 60_000;

/** Every demo persona signs in with this password until it is changed via reset / invite. */
export const DEMO_PASSWORD = 'Demo-Actovara-2026';
/** PRD §9: lock after 10 failed attempts. Lock duration is a working default (Q-021). */
export const MAX_FAILED_LOGINS = 10;
export const LOCK_MINUTES = 15;
/** Working defaults (Q-021): reset links last 60 minutes, invites 7 days. */
export const RESET_TTL_MINUTES = 60;
export const INVITE_TTL_DAYS = 7;
/** Demo fixture: this account is always shown as locked so the lockout screen can be reviewed. */
export const LOCKED_DEMO_EMAIL = 'olivia.bennett@demolettings.example';

export type TokenKind = 'invite' | 'password_reset';

export interface TokenRecord {
  kind: TokenKind;
  userId: string;
  expiresAt: string;
  usedAt?: string;
}

interface AuthState {
  failures: Record<string, { count: number; lockedUntil?: string }>;
  passwordHashes: Record<string, string>;
  tokens: Record<string, TokenRecord>;
}

/** Fixed links for the demo, rebuilt relative to "now" on every read. */
export const DEMO_TOKENS = {
  resetValid: 'demo-reset-valid',
  resetExpired: 'demo-reset-expired',
  resetUsed: 'demo-reset-used',
  inviteValid: 'demo-invite',
  inviteExpired: 'demo-invite-expired',
} as const;

function fixedTokens(now: number): Record<string, TokenRecord> {
  const iso = (ms: number) => new Date(ms).toISOString();
  return {
    [DEMO_TOKENS.resetValid]: { kind: 'password_reset', userId: 'usr_james', expiresAt: iso(now + RESET_TTL_MINUTES * MINUTE) },
    [DEMO_TOKENS.resetExpired]: { kind: 'password_reset', userId: 'usr_james', expiresAt: iso(now - 30 * MINUTE) },
    [DEMO_TOKENS.resetUsed]: { kind: 'password_reset', userId: 'usr_james', expiresAt: iso(now + 40 * MINUTE), usedAt: iso(now - 15 * MINUTE) },
    [DEMO_TOKENS.inviteValid]: { kind: 'invite', userId: 'usr_priya', expiresAt: iso(now + INVITE_TTL_DAYS * 1440 * MINUTE) },
    [DEMO_TOKENS.inviteExpired]: { kind: 'invite', userId: 'usr_priya', expiresAt: iso(now - 1440 * MINUTE) },
  };
}

let state: AuthState | null = null;

function empty(): AuthState {
  return { failures: {}, passwordHashes: {}, tokens: {} };
}

function load(): AuthState {
  if (state) return state;
  state = empty();
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) state = { ...empty(), ...(JSON.parse(raw) as Partial<AuthState>) };
    } catch {
      /* corrupt or blocked storage → start clean */
    }
  }
  return state;
}

function save() {
  if (typeof window === 'undefined' || !state) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* in-memory only */
  }
}

export function hashPassword(password: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < password.length; i++) {
    h ^= password.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export const authMock = {
  passwordMatches(userId: string, password: string): boolean {
    const stored = load().passwordHashes[userId];
    return stored ? stored === hashPassword(password) : password === DEMO_PASSWORD;
  },

  setPassword(userId: string, password: string) {
    load().passwordHashes[userId] = hashPassword(password);
    save();
  },

  /** ISO time the account is locked until, or null. */
  lockedUntil(email: string, now = Date.now()): string | null {
    const key = email.toLowerCase();
    if (key === LOCKED_DEMO_EMAIL) return new Date(now + (LOCK_MINUTES - 1) * MINUTE).toISOString();
    const f = load().failures[key];
    return f?.lockedUntil && Date.parse(f.lockedUntil) > now ? f.lockedUntil : null;
  },

  /** Count a failed attempt (for any email, so the response never reveals whether an account exists). */
  recordFailure(email: string, now = Date.now()): { remaining: number; lockedUntil: string | null } {
    const key = email.toLowerCase();
    const s = load();
    const prev = s.failures[key];
    const expired = prev?.lockedUntil && Date.parse(prev.lockedUntil) <= now;
    const count = (expired ? 0 : prev?.count ?? 0) + 1;
    const lockedUntil = count >= MAX_FAILED_LOGINS ? new Date(now + LOCK_MINUTES * MINUTE).toISOString() : undefined;
    s.failures[key] = { count, lockedUntil };
    save();
    return { remaining: Math.max(0, MAX_FAILED_LOGINS - count), lockedUntil: lockedUntil ?? null };
  },

  clearFailures(email: string) {
    delete load().failures[email.toLowerCase()];
    save();
  },

  issueToken(kind: TokenKind, userId: string, now = Date.now()): string {
    const token = `${kind === 'invite' ? 'inv' : 'rst'}-${now.toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    const ttl = kind === 'invite' ? INVITE_TTL_DAYS * 1440 : RESET_TTL_MINUTES;
    load().tokens[token] = { kind, userId, expiresAt: new Date(now + ttl * MINUTE).toISOString() };
    save();
    return token;
  },

  getToken(token: string, now = Date.now()): TokenRecord | null {
    const stored = load().tokens[token];
    return stored ?? fixedTokens(now)[token] ?? null;
  },

  markUsed(token: string, now = Date.now()) {
    const rec = authMock.getToken(token, now);
    if (!rec) return;
    load().tokens[token] = { ...rec, usedAt: new Date(now).toISOString() };
    save();
  },

  /** Called by "Reset demo data". */
  reset() {
    state = empty();
    save();
  },
};
