'use client';

import { passwordStrength } from '@/lib/password';
import type { Tone } from '@/lib/status';
import { cn } from '@/lib/utils';

const barColor: Record<Tone, string> = {
  ok: 'bg-ok-600',
  warn: 'bg-warn-600',
  danger: 'bg-danger-600',
  info: 'bg-brand-600',
  brand: 'bg-brand-600',
  purple: 'bg-brand-600',
  neutral: 'bg-line',
};

const labelColor: Record<Tone, string> = {
  ok: 'text-ok-700',
  warn: 'text-warn-700',
  danger: 'text-danger-700',
  info: 'text-brand-700',
  brand: 'text-brand-700',
  purple: 'text-brand-700',
  neutral: 'text-ink-muted',
};

/** 4-segment password strength indicator aligned with the Actovara password policy. */
export function PasswordStrengthMeter({ password, id }: { password: string; id?: string }) {
  const { score, label, tone } = passwordStrength(password);

  return (
    <div id={id} className="space-y-1.5" aria-live="polite">
      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn(
              'h-1.5 rounded-full transition-colors',
              score >= step ? barColor[tone] : 'bg-table-head',
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 text-meta">
        <span className="text-ink-muted">12+ chars, letter &amp; number</span>
        <span className={cn('font-semibold', labelColor[tone])}>{label}</span>
      </div>
    </div>
  );
}
