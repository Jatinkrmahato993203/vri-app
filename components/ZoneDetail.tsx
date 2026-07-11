'use client';
// components/ZoneDetail.tsx
// Expanded zone view: full narrative paragraph, 3 signal readouts with sparklines,
// and the "Mark reviewed" acknowledge button (read-receipt only — NEVER accept/reject).

import { useState, useCallback } from 'react';
import { X, CheckCheck } from 'lucide-react';
import RiskBadge from './RiskBadge';
import NarrativePanel from './NarrativePanel';
import SignalReadout from './SignalReadout';
import type { Zone, RiskSignal, RiskNarrative, SignalHistoryPoint } from '@/types';

interface ZoneDetailProps {
  zone: Zone;
  signal: RiskSignal | null;
  narrative: RiskNarrative | null;
  history: SignalHistoryPoint[];
  onClose: () => void;
}

export default function ZoneDetail({ zone, signal, narrative, history, onClose }: ZoneDetailProps) {
  // Track acknowledge state locally — it's a read-receipt, not a recommendation response
  const [acknowledged, setAcknowledged] = useState(false);
  const [ackPending, setAckPending] = useState(false);

  // Fix #5: persist acknowledgement to /api/acknowledgements, not just local state
  const handleAcknowledge = useCallback(async () => {
    setAckPending(true);
    try {
      await fetch('/api/acknowledgements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: zone.id,
          venueId: zone.venueId,
          signalSnapshotId: signal?.id ?? 'unknown',
          riskLevelAtAck: signal?.riskLevel ?? 'normal',
        }),
      });
    } catch {
      // Best-effort — local state still updates so UI isn't broken offline
    } finally {
      setAcknowledged(true);
      setAckPending(false);
    }
  }, [zone.id, zone.venueId, signal]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`zone-detail-title-${zone.id}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: 0,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(28,27,25,0.5)',
          backdropFilter: 'blur(4px)',
        }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          background: 'var(--bg-panel)',
          borderRadius: '16px 16px 0 0',
          overflow: 'auto',
          boxShadow: 'var(--shadow-lg)',
          animation: 'slideUp 250ms cubic-bezier(0.16,1,0.3,1)',
          marginLeft: 220, // account for nav sidebar
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 24px 0',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              <h2
                id={`zone-detail-title-${zone.id}`}
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'var(--ink-primary)',
                  letterSpacing: '-0.02em',
                }}
              >
                {zone.name}
              </h2>
              <div style={{ fontSize: 13, color: 'var(--ink-secondary)', marginTop: 2, textTransform: 'capitalize' }}>
                {zone.type} · capacity model {zone.capacityModel.toLocaleString()}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {signal && <RiskBadge level={signal.riskLevel} size="md" />}
            <button
              id={`close-detail-${zone.id}`}
              onClick={onClose}
              aria-label="Close zone detail"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ink-secondary)',
                transition: 'all 150ms ease',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ padding: '0 24px 24px' }}>
          {/* Narrative panel — primary UI element (design.md §4: narrative is the product) */}
          <div style={{ marginBottom: 24 }}>
            <NarrativePanel narrative={narrative} signal={signal} />
          </div>

          {/* Signal readouts with sparklines */}
          <div
            style={{
              background: 'var(--bg-base)',
              borderRadius: 10,
              padding: '4px 16px',
              marginBottom: 20,
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ paddingTop: 4 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', paddingBottom: 8, paddingTop: 8 }}>
                Signal Readouts · Last 2 hours
              </div>
            </div>
            {signal && (
              <>
                <SignalReadout
                  label="heat"
                  value={signal.heatIndex}
                  unit="°C"
                  trend={signal.trend}
                  history={history}
                />
                <SignalReadout
                  label="crowd"
                  value={signal.crowdDensity}
                  unit="%"
                  trend={signal.trend}
                  history={history}
                />
                <SignalReadout
                  label="egress"
                  value={signal.egressUtilization}
                  unit="%"
                  trend={signal.trend}
                  history={history}
                />
              </>
            )}
            {!signal && (
              <div style={{ padding: '12px 0', color: 'var(--ink-tertiary)', fontSize: 13 }}>
                No signal data available — loading…
              </div>
            )}
          </div>

          {/* Acknowledge — read-receipt ONLY. Never implies agreement with a recommendation. (rules.md rule 1) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: 'var(--ink-tertiary)' }}>
              Marking this as reviewed records that you have seen this risk state.
            </div>
            <button
              id={`acknowledge-${zone.id}`}
              className={`btn-acknowledge${acknowledged ? ' acknowledged' : ''}`}
              onClick={handleAcknowledge}
              disabled={acknowledged || ackPending}
              aria-label={acknowledged ? 'Already marked as reviewed' : 'Mark this risk narrative as reviewed'}
            >
              <CheckCheck size={14} aria-hidden="true" />
              {ackPending ? 'Saving…' : acknowledged ? 'Marked reviewed' : 'Mark reviewed'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @media (max-width: 768px) {
          [style*="marginLeft: 220"] { margin-left: 0 !important; }
        }
      `}</style>
    </div>
  );
}
