'use client';
// components/ZoneCard.tsx
// Zone card in the dashboard grid — risk badge + one-line narrative snippet.
// Clickable to expand ZoneDetail (keyboard accessible via Enter/Space — design.md §8).

import { useState } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';
import RiskBadge from './RiskBadge';
import ZoneDetail from './ZoneDetail';
import type { Zone, RiskSignal, RiskNarrative, SignalHistoryPoint } from '@/types';

interface ZoneCardProps {
  zone: Zone;
  signal: RiskSignal | null;
  narrative: RiskNarrative | null;
  history: SignalHistoryPoint[];
  isLoading?: boolean;
}

const RISK_BORDER_COLORS = {
  normal: 'var(--risk-normal-border)',
  elevated: 'var(--risk-elevated-border)',
  high: 'var(--risk-high-border)',
};

const RISK_TOP_ACCENT = {
  normal: 'var(--risk-normal)',
  elevated: 'var(--risk-elevated)',
  high: 'var(--risk-high)',
};

function truncateNarrative(text: string, maxLen = 90): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '…';
}

export default function ZoneCard({ zone, signal, narrative, history, isLoading }: ZoneCardProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const level = signal?.riskLevel ?? 'normal';

  if (isLoading) {
    return (
      <div
        className="card"
        style={{
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minHeight: 180,
        }}
      >
        <div className="skeleton" style={{ height: 14, width: '40%' }} />
        <div className="skeleton" style={{ height: 24, width: '30%', borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 14, width: '90%' }} />
        <div className="skeleton" style={{ height: 14, width: '70%' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-tertiary)' }}>
          <Loader2 size={12} className="animate-spin" />
          <span style={{ fontSize: 11 }}>Loading signals…</span>
        </div>
      </div>
    );
  }

  const snippetText =
    narrative && !narrative.generationFailed
      ? truncateNarrative(narrative.narrativeText)
      : signal
        ? `Heat: ${signal.heatIndex ?? '—'}°C · Density: ${signal.crowdDensity !== null ? Math.round(signal.crowdDensity * 100) : '—'}% · Egress: ${signal.egressUtilization !== null ? Math.round(signal.egressUtilization * 100) : '—'}%`
        : 'Loading signal data…';

  return (
    <>
      <button
        id={`zone-card-${zone.id}`}
        className="card card-interactive"
        onClick={() => setDetailOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setDetailOpen(true);
          }
        }}
        aria-label={`View details for ${zone.name}, risk level ${level}`}
        aria-expanded={detailOpen}
        style={{
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 180,
          overflow: 'hidden',
          width: '100%',
          textAlign: 'left',
          borderColor: signal ? RISK_BORDER_COLORS[level] : 'var(--border-subtle)',
          transition: 'all 250ms ease',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        {signal && (
          <div
            style={{
              height: 4,
              background: RISK_TOP_ACCENT[level],
              width: '100%',
              flexShrink: 0,
              transition: 'background 400ms ease',
            }}
            aria-hidden="true"
          />
        )}

        <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Zone name + type */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--ink-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {zone.name}
              </h3>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--ink-tertiary)',
                  marginTop: 2,
                  textTransform: 'capitalize',
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                }}
              >
                {zone.type}
              </div>
            </div>
            {signal && <RiskBadge level={level} size="sm" />}
          </div>

          {/* Narrative snippet — primary content (design.md §1 principle 4) */}
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.6,
              color: narrative && !narrative.generationFailed ? 'var(--ink-primary)' : 'var(--ink-secondary)',
              fontStyle: narrative?.generationFailed ? 'italic' : 'normal',
              flex: 1,
            }}
          >
            {snippetText}
          </p>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 'auto',
            }}
          >
            <div style={{ fontSize: 11, color: 'var(--ink-tertiary)', fontFamily: 'IBM Plex Mono, monospace' }}>
              {signal?.trend && (
                <span>
                  {signal.trend === 'rising' ? '↑' : signal.trend === 'falling' ? '↓' : '→'} {signal.trend}
                </span>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                color: 'var(--accent-signal)',
                fontWeight: 600,
              }}
            >
              View details
              <ChevronRight size={14} aria-hidden="true" />
            </div>
          </div>
        </div>
      </button>

      {/* Zone detail drawer */}
      {detailOpen && (
        <ZoneDetail
          zone={zone}
          signal={signal}
          narrative={narrative}
          history={history}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </>
  );
}
