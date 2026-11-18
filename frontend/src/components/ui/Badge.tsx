import React from 'react';
import { cn } from '@/lib/utils';
import {
  actionStatusMeta,
  countTone,
  priorityMeta,
  propertyTypeMeta,
  ragMeta,
  requirementStatusMeta,
  toneClasses,
  type StatusMeta,
  type Tone,
} from '@/lib/status';
import type { ActionStatus, Priority, PropertyType, Rag, RequirementStatus } from '@/types/domain';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: React.ReactNode;
  dot?: boolean;
  size?: 'sm' | 'md';
}

/** Generic rounded pill. Always pair colour with text (and ideally an icon/dot). */
export function Badge({ tone = 'neutral', icon, dot, size = 'sm', className, children, ...props }: BadgeProps) {
  const t = toneClasses[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold',
        size === 'sm' ? 'px-2.5 py-0.5 text-meta' : 'px-3 py-1 text-sm',
        t.pill,
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-2 w-2 shrink-0 rounded-full', t.dot)} aria-hidden />}
      {icon}
      {children}
    </span>
  );
}

type StatusPillProps =
  | { kind: 'requirement'; value: RequirementStatus }
  | { kind: 'rag'; value: Rag }
  | { kind: 'action'; value: ActionStatus }
  | { kind: 'priority'; value: Priority };

/**
 * Status pill driven by lib/status.ts. `variant="dot"` matches the Properties table,
 * `variant="icon"` matches the Dashboard property cards.
 */
export function StatusPill(props: StatusPillProps & { variant?: 'dot' | 'icon'; size?: 'sm' | 'md'; className?: string }) {
  const { variant = 'icon', size = 'sm', className } = props;
  let meta: StatusMeta;
  switch (props.kind) {
    case 'requirement':
      meta = requirementStatusMeta[props.value];
      break;
    case 'rag':
      meta = ragMeta[props.value];
      break;
    case 'action':
      meta = actionStatusMeta[props.value];
      break;
    case 'priority':
      meta = priorityMeta[props.value];
      break;
  }
  const Icon = meta.icon;
  return (
    <Badge
      tone={meta.tone}
      size={size}
      dot={variant === 'dot'}
      icon={variant === 'icon' ? <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden /> : undefined}
      className={className}
    >
      {meta.label}
    </Badge>
  );
}

/** Property type chip (Residential / HMO / Commercial / Mixed). */
export function TypePill({ type, className }: { type: PropertyType; className?: string }) {
  const meta = propertyTypeMeta[type];
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap rounded-md px-2.5 py-1 text-sm font-semibold', meta.className, className)}>
      {meta.label}
    </span>
  );
}

/** Numeric chip coloured by threshold (open actions: 0 green · 1–4 amber · ≥5 red). */
export function CountChip({ count, tone, label, className }: { count: number; tone?: Tone; label?: string; className?: string }) {
  const t = toneClasses[tone ?? countTone(count)];
  return (
    <span
      className={cn('inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-md px-2 text-[15px] font-bold tabular-nums', t.pill, className)}
      aria-label={label ? `${count} ${label}` : undefined}
    >
      {count}
    </span>
  );
}
