import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toneClasses, type Tone } from '@/lib/status';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  padding?: 'none' | 'sm' | 'md';
}

export function Card({ children, className, hoverEffect = false, padding = 'md', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-line bg-surface shadow-card',
        padding === 'md' && 'p-5 sm:p-6',
        padding === 'sm' && 'p-4',
        hoverEffect && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="text-card-title text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export interface KpiTileProps {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  tone?: Tone;
  /** e.g. { value: 12, direction: 'down' } — tone of the trend pill follows `trendTone` or the tile tone. */
  trend?: { value: number; direction: 'up' | 'down'; tone?: Tone; srLabel?: string };
  className?: string;
}

/** Tinted KPI tile from the dashboard mock-up (icon, label, big value, trend pill). */
export function KpiTile({ label, value, icon, tone = 'neutral', trend, className }: KpiTileProps) {
  const t = toneClasses[tone];
  const trendTone = toneClasses[trend?.tone ?? tone];
  const TrendIcon = trend?.direction === 'up' ? TrendingUp : TrendingDown;
  return (
    <div className={cn('flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover sm:p-5', t.tile, className)}>
      <span className={cn('shrink-0 [&>svg]:h-9 [&>svg]:w-9 [&>svg]:stroke-[1.75]', t.icon)} aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium text-ink">{label}</p>
        <div className="mt-0.5 flex flex-wrap items-end justify-between gap-2">
          <p className="text-[1.75rem] font-bold leading-none tabular-nums text-ink">{value}</p>
          {trend && (
            <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-meta font-bold', trendTone.pill)}>
              <TrendIcon className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">{trend.srLabel ?? (trend.direction === 'up' ? 'Up' : 'Down')}</span>
              {trend.value}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
