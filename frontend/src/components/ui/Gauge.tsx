'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { gaugeBand } from '@/lib/status';
import { cn } from '@/lib/utils';
import { Badge } from './Badge';
import { Tooltip } from './Tooltip';

export interface GaugeProps {
  title: string;
  /** 0–100 */
  value: number;
  /** Override the band label (defaults to PRD §5.3 bands). */
  statusLabel?: string;
  /** Formula / explanation shown in a tooltip next to the title. */
  info?: string;
  caption?: string;
  className?: string;
}

const R = 80;
const CX = 100;
const CY = 100;
const STROKE = 16;
const ARC_LENGTH = Math.PI * R;
const ANIMATION_MS = 950;

function polar(percent: number) {
  // 0% = left (180°), 100% = right (0°)
  const angle = Math.PI * (1 - percent / 100);
  return { x: CX + R * Math.cos(angle), y: CY - R * Math.sin(angle) };
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/** Semicircle gauge with muted remaining track, vibrant filled arc, and smooth load animation. */
export function Gauge({ title, value, statusLabel, info, caption, className }: GaugeProps) {
  const gid = useId().replace(/:/g, '');
  const targetPct = Math.max(0, Math.min(100, Math.round(Number.isFinite(value) ? value : 0)));
  const band = gaugeBand(targetPct);
  const label = statusLabel ?? band.label;

  const [animatedPct, setAnimatedPct] = useState(0);
  const currentRef = useRef(0);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      currentRef.current = targetPct;
      setAnimatedPct(targetPct);
      return;
    }

    const from = currentRef.current;
    const to = targetPct;
    if (from === to) return;

    let rafId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / ANIMATION_MS);
      const next = from + (to - from) * easeOutCubic(progress);
      currentRef.current = next;
      setAnimatedPct(next);
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [targetPct]);

  const displayPct = Math.round(animatedPct);
  const marker = polar(animatedPct);
  const dashOffset = ARC_LENGTH * (1 - animatedPct / 100);
  const arcPath = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`;

  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-2xl border border-line bg-surface p-5 shadow-card transition-shadow duration-300 hover:shadow-md sm:p-6',
        className,
      )}
    >
      <div className="flex items-center gap-1.5">
        <h3 className="text-center text-card-title text-ink">{title}</h3>
        {info && (
          <Tooltip content={info}>
            <button
              type="button"
              className="focus-ring rounded-full text-ink-subtle hover:text-ink-muted"
              aria-label={`How ${title} is calculated`}
            >
              <Info className="h-4 w-4" aria-hidden />
            </button>
          </Tooltip>
        )}
      </div>

      <div className="relative mt-3 w-full max-w-[260px]">
        <svg viewBox="0 0 200 112" className="w-full overflow-visible" role="img" aria-label={`${title}: ${targetPct}%, ${label}`}>
          <defs>
            <linearGradient id={`g-${gid}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--gauge-red)" />
              <stop offset="50%" stopColor="var(--gauge-amber)" />
              <stop offset="100%" stopColor="var(--gauge-green)" />
            </linearGradient>
          </defs>

          {/* Muted base track for the remaining unfilled portion */}
          <path
            d={arcPath}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
          <path
            d={arcPath}
            fill="none"
            stroke={`url(#g-${gid})`}
            strokeOpacity={0.16}
            strokeWidth={STROKE}
            strokeLinecap="round"
          />

          {/* Vibrant filled arc up to animatedPct */}
          {animatedPct > 0.2 && (
            <path
              d={arcPath}
              fill="none"
              stroke={`url(#g-${gid})`}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={ARC_LENGTH}
              strokeDashoffset={dashOffset}
            />
          )}

          {/* Marker thumb */}
          <circle
            cx={marker.x}
            cy={marker.y}
            r={9}
            fill="#fff"
            stroke="var(--text)"
            strokeWidth={3}
            style={{ filter: 'drop-shadow(0 1px 3px rgba(15, 34, 61, 0.25))' }}
          />
        </svg>
        <p className="absolute inset-x-0 bottom-1 text-center text-gauge tabular-nums text-ink" aria-hidden>
          {displayPct}%
        </p>
      </div>

      <Badge tone={band.tone} size="md" className="mt-3 px-4 text-[15px]">
        {label}
      </Badge>
      {caption && <p className="mt-2 text-center text-meta text-ink-muted">{caption}</p>}
    </div>
  );
}
