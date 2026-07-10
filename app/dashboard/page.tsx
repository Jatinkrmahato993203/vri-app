'use client';
// app/dashboard/page.tsx — Primary view for Ops Director (appflow.md §3)
// Realtime-simulated zone card grid with auto-refresh every 60s.
// No prescriptive recommendations anywhere on this page (rules.md rule 1).

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Play, Pause, Activity } from 'lucide-react';
import NavShell from '@/components/NavShell';
import ZoneCard from '@/components/ZoneCard';
import type { Zone, RiskSignal, RiskNarrative, SignalHistoryPoint, UserRole } from '@/types';

const VENUE_ID = 'venue_riverside_arena';
const REFRESH_INTERVAL_MS = 60_000; // 60s per rules.md rule 8

interface ZoneData {
  zone: Zone;
  signal: RiskSignal | null;
  history: SignalHistoryPoint[];
  narrative: RiskNarrative | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [role, setRole] = useState<UserRole>('ops_director');
  const [demoMode, setDemoMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem('vri_role') as UserRole | null;
    if (!storedRole) {
      router.replace('/login');
      return;
    }
    setRole(storedRole);
  }, [router]);

  const fetchData = useCallback(async (forceSimulate = false) => {
    try {
      setRefreshing(true);

      // Trigger signal + narrative update first
      if (forceSimulate || zones.length > 0) {
        await fetch('/api/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ demoMode }),
        });
      }

      // Fetch signals
      const [signalsRes, narrativesRes] = await Promise.all([
        fetch(`/api/signals/${VENUE_ID}`),
        fetch(`/api/narrative/${VENUE_ID}`),
      ]);

      if (!signalsRes.ok || !narrativesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const signalsData = await signalsRes.json();
      const narrativesData = await narrativesRes.json();

      // Build narrative map by zoneId
      const narrativeMap = new Map<string, RiskNarrative>();
      for (const { zoneId, narrative } of narrativesData.narratives) {
        if (narrative) narrativeMap.set(zoneId, narrative);
      }

      setZones(
        signalsData.zones.map(({ zone, signal, history }: { zone: Zone; signal: RiskSignal | null; history: SignalHistoryPoint[] }) => ({
          zone,
          signal,
          history: history ?? [],
          narrative: narrativeMap.get(zone.id) ?? null,
        }))
      );
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Unable to reach signal service. Displaying last known state.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [demoMode, zones.length]);

  // Initial load
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 60s (rules.md rule 8 — not per-tick, not per page load)
  useEffect(() => {
    const timer = setInterval(() => fetchData(), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchData]);

  const overallRisk = zones.reduce<'normal' | 'elevated' | 'high'>((worst, z) => {
    const level = z.signal?.riskLevel ?? 'normal';
    if (level === 'high') return 'high';
    if (level === 'elevated' && worst !== 'high') return 'elevated';
    return worst;
  }, 'normal');

  const riskColors = {
    normal: 'var(--risk-normal)',
    elevated: 'var(--risk-elevated)',
    high: 'var(--risk-high)',
  };

  return (
    <NavShell role={role} displayName={role === 'ops_director' ? 'Dana' : 'User'}>
      <div style={{ padding: '32px 32px 48px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 32,
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <Activity size={22} color="var(--accent-signal)" />
              <h1
                style={{
                  margin: 0,
                  fontSize: 26,
                  fontWeight: 700,
                  color: 'var(--ink-primary)',
                  letterSpacing: '-0.03em',
                }}
              >
                Riverside Arena
              </h1>
            </div>
            <p style={{ margin: 0, color: 'var(--ink-secondary)', fontSize: 14 }}>
              Real-time risk state · {zones.length} zones monitored
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Demo mode toggle */}
            <button
              id="demo-mode-btn"
              onClick={() => {
                setDemoMode((d) => !d);
                fetchData(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                border: '1.5px solid var(--border-medium)',
                background: demoMode ? 'var(--accent-signal-light)' : 'transparent',
                color: demoMode ? 'var(--accent-signal)' : 'var(--ink-secondary)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
              aria-pressed={demoMode}
              aria-label={demoMode ? 'Disable escalating demo mode' : 'Enable escalating demo mode'}
            >
              {demoMode ? <Pause size={14} /> : <Play size={14} />}
              Demo mode
            </button>

            {/* Manual refresh */}
            <button
              id="refresh-btn"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="btn-primary"
              aria-label="Refresh signals now"
              style={{ padding: '8px 16px' }}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Overall risk strip */}
        {!loading && zones.length > 0 && (
          <div
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 10,
              padding: '14px 20px',
              marginBottom: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: riskColors[overallRisk],
                  animation: overallRisk === 'high' ? 'pulse-high 2s infinite' : 'none',
                }}
                aria-hidden="true"
              />
              <span
                style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-primary)' }}
                role="status"
                aria-live="polite"
              >
                Venue-wide status:{' '}
                <span style={{ color: riskColors[overallRisk], textTransform: 'capitalize' }}>
                  {overallRisk}
                </span>
              </span>
            </div>
            {lastUpdated && (
              <span style={{ fontSize: 12, color: 'var(--ink-tertiary)', fontFamily: 'IBM Plex Mono, monospace' }}>
                Updated {lastUpdated.toLocaleTimeString()}
                {demoMode && (
                  <span
                    style={{
                      marginLeft: 10,
                      padding: '2px 8px',
                      background: 'var(--accent-signal-light)',
                      color: 'var(--accent-signal)',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    DEMO MODE
                  </span>
                )}
              </span>
            )}
          </div>
        )}

        {/* Error state — calm, not red (design.md §6, appflow.md §6) */}
        {error && (
          <div
            className="error-state"
            role="alert"
            style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <span style={{ color: 'var(--ink-secondary)', fontSize: 14 }}>{error}</span>
            <button
              onClick={() => fetchData(true)}
              style={{
                marginLeft: 'auto',
                fontSize: 13,
                color: 'var(--accent-signal)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontWeight: 600,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Zone card grid (3-4 columns desktop, 1 column mobile — design.md §4) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <ZoneCard
                  key={i}
                  zone={{ id: `placeholder-${i}`, venueId: VENUE_ID, name: '', type: 'gate', capacityModel: 0 }}
                  signal={null}
                  narrative={null}
                  history={[]}
                  isLoading
                />
              ))
            : zones.map((z) => (
                <ZoneCard
                  key={z.zone.id}
                  zone={z.zone}
                  signal={z.signal}
                  narrative={z.narrative}
                  history={z.history}
                />
              ))}
        </div>

        {/* Empty state (appflow.md §6) */}
        {!loading && zones.length === 0 && !error && (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 24px',
              color: 'var(--ink-secondary)',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>📍</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, color: 'var(--ink-primary)' }}>
              No zones configured
            </h2>
            <p style={{ margin: 0, fontSize: 14 }}>
              Set up venue zones to begin risk monitoring.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </NavShell>
  );
}
