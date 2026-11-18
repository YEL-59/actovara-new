import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoSize = 'sm' | 'md' | 'lg';
type LogoVariant = 'horizontal' | 'full';

/**
 * Brand assets in /public/images/brand, all cut from actovara-logo-full.png.
 * "-light" files have the black/grey ink turned white for dark backgrounds; orange is unchanged.
 */
const SRC = {
  horizontal: { dark: '/images/brand/actovara-logo-horizontal.png', light: '/images/brand/actovara-logo-horizontal-light.png' },
  full: { dark: '/images/brand/actovara-logo-full.png', light: '/images/brand/actovara-logo-full-light.png' },
  icon: { dark: '/images/brand/actovara-icon.png', light: '/images/brand/actovara-icon-light.png' },
} as const;

/** Display sizes. Horizontal lock-up is 823×160 (≈5.14:1); full stacked lock-up is ≈1.229:1. */
const SIZES: Record<LogoVariant, Record<LogoSize, { width: number; height: number; className: string }>> = {
  horizontal: {
    sm: { width: 144, height: 28, className: 'h-7 w-auto' },
    md: { width: 185, height: 36, className: 'h-9 w-auto' },
    lg: { width: 206, height: 40, className: 'h-10 w-auto' },
  },
  full: {
    sm: { width: 104, height: 85, className: 'h-auto w-[104px]' },
    md: { width: 150, height: 122, className: 'h-auto w-[150px]' },
    lg: { width: 188, height: 153, className: 'h-auto w-[188px]' },
  },
};

/**
 * Actovara brand logo.
 * - `variant="horizontal"` (default): A-check mark beside the wordmark, for headers and the sidebar.
 * - `variant="full"`: the stacked lock-up with tagline, for large brand areas such as the sign-in panel.
 * - `compact`: the A-check mark alone, for the collapsed sidebar rail and the mobile top bar.
 * - `tone="light"` is for dark backgrounds (white ink); `tone="dark"` is for light backgrounds (original colours).
 */
export function Logo({
  compact = false,
  variant = 'horizontal',
  tone = 'light',
  size = 'md',
  className,
}: {
  compact?: boolean;
  variant?: LogoVariant;
  tone?: 'light' | 'dark';
  size?: LogoSize;
  className?: string;
}) {
  if (compact) {
    return (
      <span className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center', className)}>
        <Image src={SRC.icon[tone]} alt="Actovara" width={36} height={36} className="h-full w-full object-contain" priority />
      </span>
    );
  }

  const dims = SIZES[variant][size];
  return (
    <span className={cn('inline-flex shrink-0 items-center', className)}>
      <Image
        src={SRC[variant][tone]}
        alt={variant === 'full' ? 'Actovara — Know. Act. Prove. Compliance management platform' : 'Actovara'}
        width={dims.width}
        height={dims.height}
        className={dims.className}
        priority
      />
    </span>
  );
}
