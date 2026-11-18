'use client';

/**
 * Demo session (FRONTEND_FIRST). /login signs in through authService (mock credentials); the
 * top-bar role switcher lets the client jump between Org Admin, Manager and Platform Admin.
 * TASK-027 swaps this for GET /auth/me + the httpOnly session cookie.
 *
 * "Remember me" keeps the session in localStorage; otherwise it lives in sessionStorage
 * and ends when the browser tab closes.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { mockStore } from '@/mocks/store';
import { can as canRole, type Permission } from '@/lib/permissions';
import type { Organisation, Role, User } from '@/types/domain';

const STORAGE_KEY = 'actovara.demo.session';
const SIGNED_OUT = 'signed_out';

/** The demo persona used for each role. */
export const DEMO_PERSONAS: Record<Role, string> = {
  org_admin: 'usr_admin',
  manager: 'usr_james',
  platform_admin: 'usr_platform',
};

export interface SessionValue {
  /** False until the stored session has been read on the client (avoids hydration mismatch). */
  ready: boolean;
  user: User | null;
  org: Organisation | null;
  role: Role | null;
  can: (permission: Permission) => boolean;
  switchRole: (role: Role) => void;
  /** Start a session for a user who has just authenticated (login or accepted invite). */
  signInAs: (userId: string, remember?: boolean) => void;
  signOut: () => void;
  /** True after the user chose "Sign out" in this page session (vs. arriving unauthenticated). */
  signedOutByUser: boolean;
}

const SessionContext = createContext<SessionValue | null>(null);

function readStored(): string {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(STORAGE_KEY) || SIGNED_OUT;
  } catch {
    return SIGNED_OUT;
  }
}

function store(value: string, remember: boolean) {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
    if (value !== SIGNED_OUT) (remember ? window.localStorage : window.sessionStorage).setItem(STORAGE_KEY, value);
  } catch {
    /* private mode — session lasts for this page only */
  }
}

function isRemembered(): boolean {
  try {
    return !!window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string>(SIGNED_OUT);
  const [signedOutByUser, setSignedOutByUser] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    setUserId(readStored());
    setReady(true);
    // Re-render when the demo data is reset or changed (e.g. the org is renamed).
    return mockStore.subscribe(() => setTick((t) => t + 1));
  }, []);

  const db = ready ? mockStore.get() : null;
  const found = userId !== SIGNED_OUT ? db?.users.find((u) => u._id === userId) : undefined;
  // A deactivated (or not yet accepted) account has no session.
  const user = found && found.status === 'active' ? found : null;
  const org = user && db ? (user.orgId ? db.organisation : null) : null;

  // Set synchronously (idempotent) so the first data request after mount already runs as this user.
  if (user) mockStore.setActor(user._id);

  const signInAs = useCallback((id: string, remember = true) => {
    store(id, remember);
    mockStore.setActor(id);
    setSignedOutByUser(false);
    setUserId(id);
  }, []);

  const switchRole = useCallback((role: Role) => signInAs(DEMO_PERSONAS[role], isRemembered()), [signInAs]);

  const signOut = useCallback(() => {
    store(SIGNED_OUT, false);
    setSignedOutByUser(true);
    setUserId(SIGNED_OUT);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      ready,
      user,
      org,
      role: user?.role ?? null,
      can: (p) => canRole(user?.role, p),
      switchRole,
      signInAs,
      signOut,
      signedOutByUser,
    }),
    [ready, user, org, switchRole, signInAs, signOut, signedOutByUser],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
