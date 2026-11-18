'use client';

import { Gauge } from '@/components/ui';

export interface GaugeCardProps {
  title: string;
  value: number;
  formula: string;
}

const CAPTION = 'Operational indicator, not a legal compliance statement';

export function GaugeCard({ title, value, formula }: GaugeCardProps) {
  return (
    <Gauge
      title={title}
      value={value}
      info={`${formula}. ${CAPTION}.`}
      caption={CAPTION}
    />
  );
}
