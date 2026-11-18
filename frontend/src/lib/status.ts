/**
 * Single source of truth for status labels, colours and icons.
 * Labels marked (Q-003/Q-004) are working defaults awaiting client sign-off.
 */
import {
  Archive,
  CircleCheck,
  CircleDot,
  CircleMinus,
  Clock,
  FileX,
  Hourglass,
  LoaderCircle,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import type { ActionStatus, Priority, PropertyType, Rag, RequirementStatus } from '@/types/domain';

export type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'brand' | 'purple';

export interface StatusMeta {
  label: string;
  tone: Tone;
  icon: LucideIcon;
}

/** Pill background + text + dot classes per tone (text colours meet WCAG AA on their tint). */
export const toneClasses: Record<Tone, { pill: string; dot: string; tile: string; icon: string }> = {
  ok: { pill: 'bg-ok-100 text-ok-700', dot: 'bg-ok-600', tile: 'bg-ok-50 border-ok-100', icon: 'text-ok-600' },
  warn: { pill: 'bg-warn-100 text-warn-700', dot: 'bg-warn-600', tile: 'bg-warn-50 border-warn-100', icon: 'text-warn-600' },
  danger: { pill: 'bg-danger-100 text-danger-700', dot: 'bg-danger-600', tile: 'bg-danger-50 border-danger-100', icon: 'text-danger-600' },
  info: { pill: 'bg-brand-50 text-brand-700', dot: 'bg-brand-600', tile: 'bg-brand-50 border-brand-100', icon: 'text-brand-600' },
  brand: { pill: 'bg-brand-600 text-white', dot: 'bg-white', tile: 'bg-brand-50 border-brand-100', icon: 'text-brand-600' },
  neutral: { pill: 'bg-neutral-100 text-neutral-700', dot: 'bg-neutral-600', tile: 'bg-neutral-50 border-line', icon: 'text-neutral-700' },
  purple: { pill: 'bg-type-hmo-bg text-type-hmo-fg', dot: 'bg-type-hmo-fg', tile: 'bg-type-hmo-bg/40 border-type-hmo-bg', icon: 'text-type-hmo-fg' },
};

export const requirementStatusMeta: Record<RequirementStatus, StatusMeta> = {
  valid: { label: 'Valid', tone: 'ok', icon: CircleCheck },
  due_soon: { label: 'Due soon', tone: 'warn', icon: Clock },
  overdue: { label: 'Overdue', tone: 'danger', icon: TriangleAlert },
  missing: { label: 'Missing', tone: 'danger', icon: FileX },
  not_applicable: { label: 'Not applicable', tone: 'neutral', icon: CircleMinus },
  store_only: { label: 'Stored', tone: 'info', icon: Archive },
};

/** Property RAG: operational attention status (avoids implying legal compliance). */
export const ragMeta: Record<Rag, StatusMeta> = {
  green: { label: 'On track', tone: 'ok', icon: CircleCheck },
  amber: { label: 'Needs attention', tone: 'warn', icon: TriangleAlert },
  red: { label: 'Action required', tone: 'danger', icon: TriangleAlert },
};

export const actionStatusMeta: Record<ActionStatus, StatusMeta> = {
  open: { label: 'Open', tone: 'info', icon: CircleDot },
  in_progress: { label: 'In progress', tone: 'purple', icon: LoaderCircle },
  awaiting_verification: { label: 'Awaiting verification', tone: 'warn', icon: Hourglass },
  closed: { label: 'Closed', tone: 'ok', icon: CircleCheck },
};

export const priorityMeta: Record<Priority, StatusMeta> = {
  low: { label: 'Low', tone: 'neutral', icon: CircleDot },
  medium: { label: 'Medium', tone: 'info', icon: CircleDot },
  high: { label: 'High', tone: 'warn', icon: TriangleAlert },
  urgent: { label: 'Urgent', tone: 'danger', icon: TriangleAlert },
};

export const propertyTypeMeta: Record<PropertyType, { label: string; className: string }> = {
  residential: { label: 'Residential', className: 'bg-type-residential-bg text-type-residential-fg' },
  hmo: { label: 'HMO', className: 'bg-type-hmo-bg text-type-hmo-fg' },
  commercial: { label: 'Commercial', className: 'bg-type-commercial-bg text-type-commercial-fg' },
  mixed: { label: 'Mixed use', className: 'bg-type-mixed-bg text-type-mixed-fg' },
};

/** Gauge bands (PRD §5.3): ≥85 on track · 70–84 needs attention · <70 action required. */
export function gaugeBand(percent: number): { label: string; tone: Tone } {
  if (percent >= 85) return { label: 'On track', tone: 'ok' };
  if (percent >= 70) return { label: 'Needs attention', tone: 'warn' };
  return { label: 'Action required', tone: 'danger' };
}

/** Open-actions count chip (Q-016): 0 green · 1–4 amber · ≥5 red. */
export function countTone(count: number): Tone {
  if (count <= 0) return 'ok';
  if (count < 5) return 'warn';
  return 'danger';
}
