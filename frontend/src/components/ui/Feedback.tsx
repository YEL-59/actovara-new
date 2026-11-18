import React from 'react';
import { CircleAlert, CircleCheck, Info, RotateCw, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { initials } from '@/lib/format';
import { toneClasses, type Tone } from '@/lib/status';

/* ---------------------------------- Alert --------------------------------- */
type AlertTone = 'info' | 'success' | 'warning' | 'error';
const alertStyle: Record<AlertTone, { icon: React.ElementType; box: string; icon_: string }> = {
  info: { icon: Info, box: 'border-brand-100 bg-brand-50', icon_: 'text-brand-600' },
  success: { icon: CircleCheck, box: 'border-ok-100 bg-ok-50', icon_: 'text-ok-600' },
  warning: { icon: TriangleAlert, box: 'border-warn-100 bg-warn-50', icon_: 'text-warn-600' },
  error: { icon: CircleAlert, box: 'border-danger-100 bg-danger-50', icon_: 'text-danger-600' },
};

export interface AlertProps {
  tone?: AlertTone;
  title: string;
  children?: React.ReactNode;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({ tone = 'info', title, children, onRetry, onDismiss, className }: AlertProps) {
  const s = alertStyle[tone];
  const Icon = s.icon;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex items-start gap-3 rounded-xl border p-4', s.box, className)}>
      <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', s.icon_)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        {children && <div className="mt-0.5 text-sm text-ink-muted">{children}</div>}
        {onRetry && (
          <button type="button" onClick={onRetry} className="focus-ring mt-2 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-brand-600 hover:underline">
            <RotateCw className="h-4 w-4" aria-hidden />
            Try again
          </button>
        )}
      </div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="focus-ring rounded-md p-1 text-ink-subtle hover:text-ink" aria-label="Dismiss">
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

/* --------------------------------- Skeleton ------------------------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-table-head', className)} aria-hidden />;
}

/** Wrap a loading region so screen readers hear "Loading…" once. */
export function LoadingRegion({ label = 'Loading…', children, className }: { label?: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/* -------------------------------- EmptyState ------------------------------ */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center', className)}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 [&>svg]:h-7 [&>svg]:w-7" aria-hidden>
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------------------------------- Avatar -------------------------------- */
const avatarPalette = ['bg-brand-50 text-brand-700', 'bg-ok-100 text-ok-700', 'bg-type-hmo-bg text-type-hmo-fg', 'bg-warn-100 text-warn-700', 'bg-type-mixed-bg text-type-mixed-fg'];

export function Avatar({ name, src, size = 'md', className }: { name: string; src?: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const hash = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0);
  const dims = size === 'sm' ? 'h-7 w-7 text-[11px]' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-9 w-9 text-sm';
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} className={cn('shrink-0 rounded-full object-cover', dims, className)} />
  ) : (
    <span className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-bold', dims, avatarPalette[hash % avatarPalette.length], className)} role="img" aria-label={name}>
      {initials(name)}
    </span>
  );
}

/* --------------------------------- Timeline ------------------------------- */
export interface TimelineItem {
  id: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  body?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: Tone;
}

/** Vertical activity timeline (action updates, certificate versions, audit trail). */
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  return (
    <ol className={cn('relative', className)}>
      {items.map((it, i) => {
        const t = toneClasses[it.tone ?? 'neutral'];
        return (
          <li key={it.id} className="relative flex gap-4 pb-6 last:pb-0">
            {i < items.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px bg-line" aria-hidden />}
            <span className={cn('relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-surface [&>svg]:h-4 [&>svg]:w-4', t.pill)} aria-hidden>
              {it.icon ?? <span className={cn('h-2 w-2 rounded-full', t.dot)} />}
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[15px] font-semibold text-ink">{it.title}</p>
              {it.meta && <p className="text-meta text-ink-muted">{it.meta}</p>}
              {it.body && <div className="mt-2 rounded-lg bg-canvas p-3 text-sm text-ink">{it.body}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
