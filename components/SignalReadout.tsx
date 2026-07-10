'use client';
// components/SignalReadout.tsx
// Monospace signal value + inline mini sparkline for last 2h trend (design.md §5).
// Deliberately neutral ink color — this is trend context, not another alarm signal.

import { Flame, Users, ArrowRightFromLine, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { SignalHistoryPoint, Trend } from '@/types';

interface SignalReadoutProps {
  label: 'heat' | 'crowd' | 'egress';
  value: number | null;
  unit: string;
  trend: Trend;
  history: SignalHistoryPoint[];
}

const ICONS = {
  heat: Flame,
  crowd: Users,
  egress: ArrowRightFromLine,
};

const TREND_ICONS = {
  rising: TrendingUp,
  falling: TrendingDown,
  stable: Minus,
};

const TREND_COLORS = {
  rising: '#B8863B',
  falling: '#2F6B4F',
  stable: '#5C5A55',
};

function MiniSparkline({ history, field }: { history: SignalHistoryPoint[]; field: keyof Pick<SignalHistoryPoint, 'heatIndex' | 'crowdDensity' | 'egressUtilization'> }) {
  if (history.length < 2) {
    return <div style={{ width: 60, height: 28 }} />;
  }

  const raw = history.map((h) => h[field] as number | null);
  const values = raw.filter((v): v is number => v !== null);
  if (values.length < 2) return <div style={{ width: 60, height: 28 }} />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const w = 60;
  const h = 28;
  const step = w / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });

  const polyline = points.join(' ');

  return (
    <svg width={w} height={h} aria-hidden="true" style={{ overflow: 'visible' }}>
      <polyline
        points={polyline}
        fill="none"
        stroke="var(--accent-signal)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
      {/* Current value dot */}
      <circle
        cx={points[points.length - 1]?.split(',')[0]}
        cy={points[points.length - 1]?.split(',')[1]}
        r="2.5"
        fill="var(--accent-signal)"
      />
    </svg>
  );
}

export default function SignalReadout({ label, value, unit, trend, history }: SignalReadoutProps) {
  const Icon = ICONS[label];
  const TrendIcon = TREND_ICONS[trend];
  const historyField: keyof Pick<SignalHistoryPoint, 'heatIndex' | 'crowdDensity' | 'egressUtilization'> =
    label === 'heat' ? 'heatIndex' : label === 'crowd' ? 'crowdDensity' : 'egressUtilization';

  const displayValue = value !== null ? (label === 'heat' ? `${value}${unit}` : `${Math.round(value * 100)}${unit}`) : '—';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Icon + label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: 130,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'var(--accent-signal-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={14} color="var(--accent-signal)" strokeWidth={2} aria-hidden="true" />
        </div>
        <span
          style={{
            fontSize: 13,
            color: 'var(--ink-secondary)',
            textTransform: 'capitalize',
            fontWeight: 500,
          }}
        >
          {label === 'heat' ? 'Heat Index' : label === 'crowd' ? 'Crowd Density' : 'Egress Util.'}
        </span>
      </div>

      {/* Value (monospace) */}
      <span
        className="signal-value"
        aria-label={`${label} value: ${displayValue}`}
        style={{ minWidth: 64, textAlign: 'right' }}
      >
        {displayValue}
      </span>

      {/* Sparkline */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <MiniSparkline history={history} field={historyField} />
      </div>

      {/* Trend indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          color: TREND_COLORS[trend],
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'capitalize',
          minWidth: 64,
          justifyContent: 'flex-end',
        }}
        aria-label={`Trend: ${trend}`}
      >
        <TrendIcon size={13} strokeWidth={2.5} aria-hidden="true" />
        {trend}
      </div>
    </div>
  );
}
