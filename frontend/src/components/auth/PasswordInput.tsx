'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input, type InputProps } from '@/components/ui';

export interface PasswordInputProps extends Omit<InputProps, 'type' | 'rightSlot'> {
  showLockIcon?: boolean;
}

/** Password input with an accessible show/hide toggle button. */
export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { showLockIcon = false, leftIcon, ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      ref={ref}
      type={visible ? 'text' : 'password'}
      leftIcon={leftIcon ?? (showLockIcon ? <Lock aria-hidden /> : undefined)}
      rightSlot={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="focus-ring flex h-8 w-8 items-center justify-center rounded-md text-ink-subtle hover:bg-table-head hover:text-ink"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
        </button>
      }
      {...props}
    />
  );
});
