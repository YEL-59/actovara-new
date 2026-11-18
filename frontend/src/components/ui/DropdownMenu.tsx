'use client';

import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownMenuProps {
  items: MenuItem[];
  /** Accessible name of the trigger, e.g. "Actions for Brookfield House". */
  label: string;
  /** Custom trigger content; defaults to a kebab (⋯) icon. */
  trigger?: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

/** Menu button pattern: Enter/Space/↓ opens, arrows move, Esc closes, click-outside closes. */
export function DropdownMenu({ items, label, trigger, align = 'right', className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number; placeAbove: boolean } | null>(null);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const enabled = items.map((it, i) => (it.disabled ? -1 : i)).filter((i) => i >= 0);

  const updatePosition = useCallback(() => {
    const btn = triggerRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const menuWidth = menuRef.current?.offsetWidth || 192;
    const menuHeight = menuRef.current?.offsetHeight || items.length * 38 + 16;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < menuHeight + 12 && rect.top > menuHeight + 12;

    const rawLeft = align === 'right' ? rect.right - menuWidth : rect.left;
    const left = Math.max(8, Math.min(rawLeft, window.innerWidth - menuWidth - 8));
    const top = placeAbove ? rect.top - menuHeight - 6 : rect.bottom + 6;
    setPos({ top, left, placeAbove });
  }, [align, items.length]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    itemRefs.current[active]?.focus();
  }, [open, active, pos]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const onViewportChange = () => updatePosition();
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
    };
  }, [open, updatePosition]);

  const openMenu = (index = enabled[0] ?? 0) => {
    setActive(index);
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const onMenuKey = (e: React.KeyboardEvent) => {
    const posIdx = enabled.indexOf(active);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(enabled[(posIdx + 1) % enabled.length]!);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(enabled[(posIdx - 1 + enabled.length) % enabled.length]!);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(enabled[0]!);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(enabled[enabled.length - 1]!);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      close(false);
    }
  };

  return (
    <div ref={rootRef} className={cn('relative inline-block', className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        aria-label={trigger ? undefined : label}
        title={trigger ? undefined : label}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            openMenu();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            openMenu(enabled[enabled.length - 1]);
          }
        }}
        className={cn(
          'focus-ring inline-flex items-center justify-center rounded-lg transition-colors',
          trigger ? '' : 'h-9 w-9 text-ink hover:bg-table-head',
          open && !trigger && 'bg-table-head',
        )}
      >
        {trigger ?? <MoreHorizontal className="h-5 w-5" aria-hidden />}
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            id={`${id}-menu`}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKey}
            style={{
              position: 'fixed',
              top: pos?.top ?? -9999,
              left: pos?.left ?? -9999,
              visibility: pos ? 'visible' : 'hidden',
            }}
            className={cn(
              'z-[70] min-w-[13.5rem] animate-scale-in rounded-xl border border-line bg-surface p-1.5 shadow-pop ring-1 ring-ink/5',
              pos?.placeAbove
                ? align === 'right'
                  ? 'origin-bottom-right'
                  : 'origin-bottom-left'
                : align === 'right'
                  ? 'origin-top-right'
                  : 'origin-top-left',
            )}
          >
            {items.map((it, i) => (
              <React.Fragment key={it.label}>
                {i > 0 && it.danger && !items[i - 1]?.danger && (
                  <div role="separator" className="my-1 border-t border-line/70" />
                )}
                <button
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  type="button"
                  role="menuitem"
                  tabIndex={i === active ? 0 : -1}
                  disabled={it.disabled}
                  onClick={() => {
                    close();
                    it.onSelect();
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium outline-none transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0',
                    it.danger
                      ? 'text-danger-700 hover:bg-danger-50 focus:bg-danger-50 [&>svg]:text-danger-600'
                      : 'text-ink hover:bg-table-head focus:bg-table-head [&>svg]:text-ink-muted',
                  )}
                >
                  {it.icon}
                  <span>{it.label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
