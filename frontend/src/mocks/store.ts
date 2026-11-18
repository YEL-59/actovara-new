/**
 * In-memory demo database. Create/update flows mutate it so the demo behaves like
 * the real app. It is kept in localStorage, so a refresh keeps the client's edits.
 * "Reset demo data" restores the seed.
 *
 * When the stored copy was saved on an earlier day, every date in it is moved forward
 * by the gap. That keeps the "relative to today" scenario: overdue stays overdue and
 * due soon stays due soon.
 */
import { recompute } from './engine';
import { buildSeed, MOCK_DB_VERSION } from './seed';
import type { MockDb } from './types';

const STORAGE_KEY = 'actovara.demo.db';
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
const DAY = 86_400_000;

let db: MockDb | null = null;
let actorId = 'usr_admin';
const listeners = new Set<() => void>();

function canPersist() {
  return typeof window !== 'undefined';
}

function shiftDates<T>(value: T, deltaMs: number): T {
  if (typeof value === 'string') return (ISO_RE.test(value) ? new Date(Date.parse(value) + deltaMs).toISOString() : value) as T;
  if (Array.isArray(value)) return value.map((v) => shiftDates(v, deltaMs)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = shiftDates(v, deltaMs);
    return out as T;
  }
  return value;
}

function load(): MockDb {
  const now = new Date();
  if (canPersist()) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as MockDb;
        if (saved.version === MOCK_DB_VERSION) {
          const days = Math.floor((now.getTime() - Date.parse(saved.seededAt)) / DAY);
          const shifted = days > 0 ? shiftDates(saved, days * DAY) : saved;
          return recompute(shifted, now);
        }
      }
    } catch {
      /* storage unavailable or corrupt → fall back to a fresh seed */
    }
  }
  return buildSeed(now);
}

function persist() {
  if (!canPersist() || !db) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* quota or private mode — the demo still works in memory */
  }
}

export const mockStore = {
  get(): MockDb {
    if (!db) {
      db = load();
      persist();
    }
    return db;
  },

  /** Apply a change, recompute derived status, persist and notify subscribers. */
  mutate<R>(fn: (db: MockDb) => R): R {
    const current = mockStore.get();
    const result = fn(current);
    recompute(current);
    persist();
    listeners.forEach((l) => l());
    return result;
  },

  reset(): void {
    db = buildSeed(new Date());
    persist();
    listeners.forEach((l) => l());
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  /** The demo user performing mutations (set by the session mock). Used for audit + ownership. */
  setActor(id: string) {
    actorId = id;
  },
  actor() {
    const d = mockStore.get();
    return d.users.find((u) => u._id === actorId) ?? d.users[0]!;
  },
};
