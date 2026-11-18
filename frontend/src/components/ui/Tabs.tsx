'use client';

import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem<V extends string = string> {
  value: V;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

function useArrowKeys<V extends string>(items: TabItem<V>[], value: V, onChange: (v: V) => void) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = items.findIndex((t) => t.value === value);
    let next = -1;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % items.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(items[next]!.value);
    refs.current[next]?.focus();
  };
  return { refs, onKeyDown };
}

/** Underlined tabs (property detail, settings). Pair with <TabPanel>. */
export function Tabs<V extends string>({
  items,
  value,
  onChange,
  idBase,
  label,
  className,
}: {
  items: TabItem<V>[];
  value: V;
  onChange: (v: V) => void;
  /** Used to link tabs and panels: tab id = `${idBase}-tab-${value}`. */
  idBase: string;
  label: string;
  className?: string;
}) {
  const { refs, onKeyDown } = useArrowKeys(items, value, onChange);
  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className={cn('flex gap-1 overflow-x-auto border-b border-line', className)}>
      {items.map((t, i) => {
        const selected = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${idBase}-tab-${t.value}`}
            aria-selected={selected}
            aria-controls={`${idBase}-panel-${t.value}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.value)}
            className={cn(
              'focus-ring -mb-px inline-flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-4 py-2.5 text-[15px] font-semibold transition-colors',
              selected ? 'border-brand-600 text-brand-600' : 'border-transparent text-ink-muted hover:border-line hover:text-ink',
            )}
          >
            {t.icon}
            {t.label}
            {t.count != null && (
              <span className={cn('rounded-full px-2 text-meta', selected ? 'bg-brand-50 text-brand-700' : 'bg-table-head text-ink-muted')}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ idBase, value, active, children, className }: { idBase: string; value: string; active: boolean; children: React.ReactNode; className?: string }) {
  if (!active) return null;
  return (
    <div role="tabpanel" id={`${idBase}-panel-${value}`} aria-labelledby={`${idBase}-tab-${value}`} tabIndex={0} className={cn('focus-ring rounded-lg pt-5', className)}>
      {children}
    </div>
  );
}

/** Segmented toggle (Grid view / List view). Implemented as a radio group. */
export function SegmentedControl<V extends string>({
  items,
  value,
  onChange,
  label,
  variant = 'solid',
  className,
}: {
  items: TabItem<V>[];
  value: V;
  onChange: (v: V) => void;
  label: string;
  /** `solid` = dashboard (filled blue), `soft` = properties page (tinted). */
  variant?: 'solid' | 'soft';
  className?: string;
}) {
  const { refs, onKeyDown } = useArrowKeys(items, value, onChange);
  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(variant === 'solid' ? 'inline-flex rounded-lg border border-line bg-surface p-0.5 shadow-card' : 'inline-flex gap-3', className)}
    >
      {items.map((t, i) => {
        const selected = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.value)}
            className={cn(
              'focus-ring inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-[15px] font-semibold transition-colors [&>svg]:h-[18px] [&>svg]:w-[18px]',
              variant === 'solid'
                ? selected
                  ? 'bg-brand-600 text-white'
                  : 'text-ink hover:bg-canvas'
                : selected
                  ? 'border border-brand-200 bg-brand-50 text-brand-700'
                  : 'border border-line bg-surface text-ink hover:bg-canvas',
            )}
          >
            {t.icon}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
