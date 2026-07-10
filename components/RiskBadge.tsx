'use client';
// components/RiskBadge.tsx
// Pill-shaped risk badge with color + icon + text label.
// NEVER color alone — accessibility requirement (design.md §8, rules.md rule 9).

import { CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';
import type { RiskLevel } from '@/types';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const CONFIG: Record<RiskLevel, { label: string; Icon: typeof CheckCircle; className: string; ariaLabel: string }> = {
  normal: {
    label: 'Normal',
    Icon: CheckCircle,
    className: 'risk-badge-normal',
    ariaLabel: 'Risk level: Normal',
  },
  elevated: {
    label: 'Elevated',
    Icon: AlertTriangle,
    className: 'risk-badge-elevated',
    ariaLabel: 'Risk level: Elevated',
  },
  high: {
    label: 'High Risk',
    Icon: AlertOctagon,
    className: 'risk-badge-high',
    ariaLabel: 'Risk level: High Risk',
  },
};

const SIZE_CONFIG = {
  sm: { fontSize: 11, iconSize: 12, padding: '3px 8px', gap: 4, borderRadius: 6 },
  md: { fontSize: 13, iconSize: 14, padding: '5px 11px', gap: 5, borderRadius: 8 },
  lg: { fontSize: 15, iconSize: 16, padding: '7px 14px', gap: 6, borderRadius: 10 },
};

export default function RiskBadge({ level, size = 'md', showLabel = true }: RiskBadgeProps) {
  const { label, Icon, className, ariaLabel } = CONFIG[level];
  const { fontSize, iconSize, padding, gap, borderRadius } = SIZE_CONFIG[size];

  return (
    <span
      className={className}
      aria-label={ariaLabel}
      role="status"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap,
        padding,
        borderRadius,
        fontSize,
        fontWeight: 600,
        letterSpacing: '0.01em',
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      <Icon size={iconSize} strokeWidth={2.5} aria-hidden="true" />
      {showLabel && <span>{label}</span>}
    </span>
  );
}
