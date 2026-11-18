'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastApi {
  toast: (t: Omit<ToastItem, 'id'> & { durationMs?: number }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const toneStyle: Record<ToastTone, { icon: React.ElementType; className: string }> = {
  success: { icon: CircleCheck, className: 'text-ok-600' },
  error: { icon: CircleAlert, className: 'text-danger-600' },
  warning: { icon: TriangleAlert, className: 'text-warn-600' },
  info: { icon: Info, className: 'text-brand-600' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setItems((list) => list.filter((t) => t.id !== id)), []);

  const toast = useCallback<ToastApi['toast']>(
    ({ durationMs = 4500, ...t }) => {
      const id = ++seq.current;
      setItems((list) => [...list.slice(-3), { ...t, id }]);
      window.setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      toast,
      success: (title, description) => toast({ tone: 'success', title, description }),
      error: (title, description) => toast({ tone: 'error', title, description }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div aria-live="polite" aria-relevant="additions" className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:w-96">
        {items.map((t) => {
          const { icon: Icon, className } = toneStyle[t.tone];
          return (
            <div key={t.id} role={t.tone === 'error' ? 'alert' : 'status'} className="pointer-events-auto flex w-full animate-toast-in items-start gap-3 rounded-xl border border-line bg-surface p-4 shadow-pop">
              <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', className)} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{t.title}</p>
                {t.description && <p className="mt-0.5 text-sm text-ink-muted">{t.description}</p>}
              </div>
              <button type="button" onClick={() => dismiss(t.id)} className="focus-ring rounded-md p-1 text-ink-subtle hover:bg-table-head hover:text-ink" aria-label="Dismiss notification">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
