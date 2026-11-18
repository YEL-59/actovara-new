/** Formatting helpers. All dates are shown in UK time (Europe/London). */
const TZ = 'Europe/London';

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: TZ });
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: TZ,
});
const londonDay = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: TZ });

const toDate = (value: string | Date) => (value instanceof Date ? value : new Date(value));

/** "15 Feb 2027" */
export function formatDate(value?: string | Date | null): string {
  if (!value) return '—';
  const d = toDate(value);
  return Number.isNaN(d.getTime()) ? '—' : dateFmt.format(d);
}

/** "11 Nov 2026, 09:24" */
export function formatDateTime(value?: string | Date | null): string {
  if (!value) return '—';
  const d = toDate(value);
  return Number.isNaN(d.getTime()) ? '—' : dateTimeFmt.format(d);
}

/** Whole calendar days from today (London) to the given date; negative = in the past. */
export function daysUntil(value: string | Date, now: Date = new Date()): number {
  const a = Date.parse(londonDay.format(now));
  const b = Date.parse(londonDay.format(toDate(value)));
  return Math.round((b - a) / 86_400_000);
}

/** "Due today", "Due in 12 days", "3 days overdue" */
export function formatRelativeDue(value?: string | Date | null, now: Date = new Date()): string {
  if (!value) return 'No due date';
  const n = daysUntil(value, now);
  if (n === 0) return 'Due today';
  if (n === 1) return 'Due tomorrow';
  if (n > 0) return `Due in ${n} days`;
  return `${Math.abs(n)} day${n === -1 ? '' : 's'} overdue`;
}

/** "1.4 MB" */
export function formatFileSize(bytes?: number | null): string {
  if (bytes == null || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(Math.max(0, Math.min(100, value)))}%`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}
