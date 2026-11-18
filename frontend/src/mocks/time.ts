/** Date helpers for fixtures. Every fixture date is relative to "now" (PRD §8.6 / S2). */
const DAY = 86_400_000;

/** ISO string `n` days from `now` (negative = past), pinned to 09:00 UTC for stable display. */
export function daysFrom(now: Date, n: number, hour = 9): string {
  const d = new Date(now.getTime() + n * DAY);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

/** Add calendar months to an ISO date (end-of-month safe). */
export function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString();
}

export function yyyymmdd(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '');
}

/** Deterministic PRNG so the seed looks varied but is identical on every reset. */
export function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
