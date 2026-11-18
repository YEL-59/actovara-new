'use client';

import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/lib/hooks/useFocusTrap';

function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}

interface OverlayBaseProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/* ---------------------------------- Modal --------------------------------- */
export interface ModalProps extends OverlayBaseProps {
  size?: 'sm' | 'md' | 'lg';
}

/** Accessible dialog: focus trap, Esc to close, backdrop click to close, focus restore. */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  const ref = useFocusTrap<HTMLDivElement>(open, onClose);
  const id = useId();
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
        <div className="absolute inset-0 animate-fade-in bg-ink/50" onClick={onClose} aria-hidden />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          aria-describedby={description ? `${id}-desc` : undefined}
          tabIndex={-1}
          className={cn(
            'relative flex max-h-[92vh] w-full animate-scale-in flex-col rounded-t-2xl bg-surface shadow-pop outline-none sm:rounded-2xl',
            size === 'sm' && 'sm:max-w-md',
            size === 'md' && 'sm:max-w-xl',
            size === 'lg' && 'sm:max-w-3xl',
          )}
        >
          <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
            <div>
              <h2 id={`${id}-title`} className="text-card-title text-ink">
                {title}
              </h2>
              {description && (
                <p id={`${id}-desc`} className="mt-0.5 text-sm text-ink-muted">
                  {description}
                </p>
              )}
            </div>
            <button type="button" onClick={onClose} className="focus-ring -mr-2 rounded-lg p-2 text-ink-muted hover:bg-table-head hover:text-ink" aria-label="Close dialog">
              <X className="h-5 w-5" aria-hidden />
            </button>
          </header>
          <div className="overflow-y-auto px-6 py-5">{children}</div>
          {footer && <footer className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">{footer}</footer>}
        </div>
      </div>
    </Portal>
  );
}

/* ---------------------------------- Drawer -------------------------------- */
export interface DrawerProps extends OverlayBaseProps {
  side?: 'left' | 'right';
  width?: string;
  /** Hide the header (e.g. mobile navigation drawer supplies its own). */
  bare?: boolean;
}

export function Drawer({ open, onClose, title, description, children, footer, side = 'right', width = 'max-w-md', bare }: DrawerProps) {
  const ref = useFocusTrap<HTMLDivElement>(open, onClose);
  const id = useId();
  if (!open) return null;
  return (
    <Portal>
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 animate-fade-in bg-ink/50" onClick={onClose} aria-hidden />
        <div
          ref={ref}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          tabIndex={-1}
          className={cn(
            'absolute inset-y-0 flex w-full flex-col bg-surface shadow-pop outline-none',
            width,
            side === 'right' ? 'right-0 animate-slide-in-right' : 'left-0 animate-slide-in-left',
          )}
        >
          {bare ? (
            <h2 id={`${id}-title`} className="sr-only">
              {title}
            </h2>
          ) : (
            <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-4">
              <div>
                <h2 id={`${id}-title`} className="text-card-title text-ink">
                  {title}
                </h2>
                {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
              </div>
              <button type="button" onClick={onClose} className="focus-ring -mr-2 rounded-lg p-2 text-ink-muted hover:bg-table-head hover:text-ink" aria-label="Close panel">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </header>
          )}
          <div className={cn('flex-1 overflow-y-auto', !bare && 'px-6 py-5')}>{children}</div>
          {footer && <footer className="flex flex-wrap justify-end gap-3 border-t border-line px-6 py-4">{footer}</footer>}
        </div>
      </div>
    </Portal>
  );
}
