/**
 * Password policy (working default, Q-021): at least 12 characters, a letter and a number,
 * not a common password and not the email address. The backend applies the same rules (TASK-018).
 */
import type { Tone } from '@/lib/status';

export const PASSWORD_MIN = 12;

const COMMON = ['password', 'password123', 'qwerty', '123456789', '1234567890', 'letmein', 'welcome', 'iloveyou', 'admin', 'actovara'];

/** First problem with the password, or null when it meets the policy. */
export function passwordIssue(password: string, email?: string): string | null {
  if (!password) return 'Enter a password.';
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (!/[a-z]/i.test(password) || !/\d/.test(password)) return 'Include at least one letter and one number.';
  const lower = password.toLowerCase();
  if (COMMON.some((c) => lower.replace(/[^a-z0-9]/g, '').startsWith(c) && lower.length < c.length + 4)) return 'That password is too easy to guess.';
  if (email && lower.includes(email.toLowerCase().split('@')[0]!)) return 'Do not include your email name in the password.';
  return null;
}

export interface Strength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  tone: Tone;
}

/** Simple, explainable strength estimate for the meter (length + character variety). */
export function passwordStrength(password: string): Strength {
  if (!password) return { score: 0, label: 'Enter a password', tone: 'neutral' };
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((r) => r.test(password)).length;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= PASSWORD_MIN) score++;
  if (password.length >= 16) score++;
  if (variety >= 3) score++;
  if (password.length < PASSWORD_MIN) score = Math.min(score, 1);
  const s = Math.min(4, score) as Strength['score'];
  const labels: Record<Strength['score'], [string, Tone]> = {
    0: ['Too short', 'danger'],
    1: ['Weak', 'danger'],
    2: ['Fair', 'warn'],
    3: ['Good', 'ok'],
    4: ['Strong', 'ok'],
  };
  const [label, tone] = labels[s];
  return { score: s, label, tone };
}

/** Only allow internal redirect targets ("/path"), never "//host" or absolute URLs. */
export function safeNext(next: string | null | undefined, fallback: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  if (next.startsWith('/login') || next.startsWith('/reset-password') || next.startsWith('/accept-invite')) return fallback;
  return next;
}
