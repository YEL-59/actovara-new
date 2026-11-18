'use client';

import React, { useId } from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'right';
  className?: string;
}

/**
 * CSS tooltip shown on hover and keyboard focus. The trigger gets aria-describedby,
 * so screen readers announce the content too.
 */
export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const id = useId();
  const trigger = React.cloneElement(children, { 'aria-describedby': id } as React.HTMLAttributes<HTMLElement>);
  return (
    <span className="group/tt relative inline-flex">
      {trigger}
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 w-max max-w-[260px] rounded-lg bg-ink px-3 py-2 text-meta font-medium text-white opacity-0 shadow-pop transition-opacity duration-150',
          'group-hover/tt:opacity-100 group-focus-within/tt:opacity-100',
          side === 'top' && 'bottom-full left-1/2 mb-2 -translate-x-1/2',
          side === 'bottom' && 'left-1/2 top-full mt-2 -translate-x-1/2',
          side === 'right' && 'left-full top-1/2 ml-2 -translate-y-1/2',
          className,
        )}
      >
        {content}
      </span>
    </span>
  );
}
