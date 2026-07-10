'use client';
// app/benchmark/page.tsx — Insurer view (appflow.md §5)
// Bar chart comparing venue's current risk pattern against anonymized synthetic peer set.
// No per-venue raw peer data is ever shown — only aggregated anonymized stats (schema.md §7).

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Flame, Users, ArrowRightFromLine } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import NavShell from '@/components/NavShell';
import type { HazardType, UserRole } from '@/types';

const VENUE_ID = 'venue_riverside_arena';

interface BenchmarkPoint {
  hazardType: HazardType;
  peerAverage: number;
  venueAverage: number;
  percentileDistribution: { p25: number; p50: number; p75: number };
}

const HAZARD_CONFIG: Record<HazardType, { label: string; Icon: typeof Flame; color: string }> = {
  heat: { label: 'Heat Exposure', Icon: Flame, color: '#C4534F' },
  crowd: { label: 'Crowd Density', Icon: Users, color: '#B8863B' },
  egress: { label: 'Egress Utilization', Icon: ArrowRightFromLine, color: '#1F4E5F' },
};

const CHART_LABELS: Record<HazardType, string> = {
  heat: 'Heat',
  crowd: 'Crowd',
  egress: 'Egress',
};

// Custom tooltip
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
        padding: '12px 16px',
        boxShadow: 'var(--shadow-md)',
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 700, color: 'var(--ink-primary)', marginBottom: 8 }}>{label}</div>
      {payload.map((entry) => (
        <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: entry.color, flexShrink: 0 }} />
          <span style={{ color: 'var(--ink-secondary)' }}>{entry.name}:</span>
          <span style={{ fontWeight: 600, color: 'var(--ink-primary)', fontFamily: 'IBM Plex Mono, monospace' }}>
            {Math.round(entry.value * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function BenchmarkPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('insurer');
  const [data, setData] = useState<BenchmarkPoint[]>([]);
  const [activeHazard, setActiveHazard] = useState<HazardType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('vri_role') as UserRole | null;
    if (!storedRole) { router.replace('/login'); return; }
    setRole(storedRole);
  }, [router]);

  useEffect(() => {
    fetch(`/api/benchmark/${VENUE_ID}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.benchmarks ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError('Unable to load benchmark data.');
        setLoading(false);
      });
  }, []);

  // Filter or show all
  const filteredData = activeHazard === 'all'
    ? data
    : data.filter((d) => d.hazardType === activeHazard);

  // Build chart data
  const chartData = filteredData.map((b) => ({
    name: CHART_LABELS[b.hazardType],
    hazardType: b.hazardType,
    'This Venue': b.venueAverage,
    'Peer Average': b.peerAverage,
    'Peer P75': b.percentileDistribution.p75,
  }));

  const venueAvgForHazard = (type: HazardType) => data.find((d) => d.hazardType === type)?.venueAverage ?? 0;
  const peerAvgForHazard = (type: HazardType) => data.find((d) => d.hazardType === type)?.peerAverage ?? 0;

  return (
    <NavShell role={role} displayName={role === 'insurer' ? 'Priya' : 'User'}>
      <div style={{ padding: '32px 32px 48px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <BarChart3 size={22} color="var(--accent-signal)" />
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--ink-primary)', letterSpacing: '-0.03em' }}>
              Benchmark Analytics
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--ink-secondary)', fontSize: 14 }}>
            Riverside Arena vs. anonymized peer average — July 2026
          </p>
        </div>

        {/* Hazard toggle (appflow.md §5) */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
          role="group"
          aria-label="Filter by hazard type"
        >
          {(['all', 'heat', 'crowd', 'egress'] as const).map((h) => {
            const isActive = activeHazard === h;
            const config = h !== 'all' ? HAZARD_CONFIG[h] : null;
            return (
              <button
                key={h}
                id={`hazard-filter-${h}`}
                onClick={() => setActiveHazard(h)}
                aria-pressed={isActive}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: `1.5px solid ${isActive ? 'var(--accent-signal)' : 'var(--border-medium)'}`,
                  background: isActive ? 'var(--accent-signal-light)' : 'transparent',
                  color: isActive ? 'var(--accent-signal)' : 'var(--ink-secondary)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 150ms',
                  textTransform: 'capitalize',
                }}
              >
                {config && <config.Icon size={14} aria-hidden="true" />}
                {h === 'all' ? 'All hazards' : config?.label ?? h}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="error-state" role="alert" style={{ marginBottom: 24 }}>
            {error}
          </div>
        )}

        {/* Bar chart */}
        <div className="card" style={{ padding: 24, marginBottom: 28 }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: 'var(--ink-primary)' }}>
            Risk signal comparison
          </h2>
          {loading ? (
            <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="skeleton" style={{ width: '100%', height: 280 }} />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 13, fill: 'var(--ink-secondary)', fontFamily: 'Inter, sans-serif' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${Math.round(v * 100)}%`} tick={{ fontSize: 12, fill: 'var(--ink-tertiary)', fontFamily: 'IBM Plex Mono, monospace' }} axisLine={false} tickLine={false} domain={[0, 1]} />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 13, paddingTop: 16 }}
                  iconType="square"
                />
                <ReferenceLine y={0.75} stroke="var(--risk-elevated)" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Elevated threshold', fontSize: 11, fill: 'var(--risk-elevated)', position: 'right' }} />
                <Bar dataKey="This Venue" fill="var(--accent-signal)" radius={[4, 4, 0, 0]} maxBarSize={48} />
                <Bar dataKey="Peer Average" fill="var(--border-medium)" radius={[4, 4, 0, 0]} maxBarSize={48} />
                <Bar dataKey="Peer P75" fill="var(--risk-elevated-border)" radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <p style={{ margin: '16px 0 0', fontSize: 12, color: 'var(--ink-tertiary)' }}>
            Peer data is anonymized and aggregated server-side. No individual venue identifiers are exposed.
          </p>
        </div>

        {/* Summary cards */}
        {!loading && data.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {(['heat', 'crowd', 'egress'] as HazardType[]).map((type) => {
              const { label, Icon, color } = HAZARD_CONFIG[type];
              const venueVal = venueAvgForHazard(type);
              const peerVal = peerAvgForHazard(type);
              const diff = venueVal - peerVal;
              const better = diff < 0;
              return (
                <div
                  key={type}
                  className="card"
                  style={{ padding: 18 }}
                  aria-label={`${label} benchmark summary`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--accent-signal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={14} color={color} strokeWidth={2} aria-hidden="true" />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-primary)' }}>{label}</span>
                  </div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink-primary)' }}>
                      {Math.round(venueVal * 100)}%
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-secondary)', marginTop: 2 }}>
                      vs. {Math.round(peerVal * 100)}% peer avg
                    </div>
                    <div style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: better ? 'var(--risk-normal)' : 'var(--risk-elevated)',
                      marginTop: 6,
                    }}>
                      {better ? `${Math.round(Math.abs(diff) * 100)}pp below average` : `${Math.round(diff * 100)}pp above average`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </NavShell>
  );
}
