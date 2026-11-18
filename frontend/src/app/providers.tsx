'use client';

import React from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { SessionProvider } from '@/lib/session-mock';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SessionProvider>{children}</SessionProvider>
    </ToastProvider>
  );
}
