// lib/seed/seedData.ts
// Seeds the in-memory store with one demo venue + 4 zones + initial certification data.
// All collections partitioned by venueId (rules.md rule 5).

import type {
  Venue,
  Zone,
  CertificationAudit,
  BenchmarkAggregate,
  AppUser,
} from '@/types';
import {
  upsertVenue,
  upsertZone,
  writeAudit,
  writeBenchmark,
  writeUser,
  setInitialized,
} from '@/lib/store/memoryStore';

export const DEMO_VENUE_ID = 'venue_riverside_arena';

export function seedStore(): void {
  // ── Venue ──────────────────────────────────────────────────────────────────
  const venue: Venue = {
    id: DEMO_VENUE_ID,
    name: 'Riverside Arena',
    location: { lat: 36.1627, lng: -86.7816 },
    capacity: 18500,
    hazardProfile: ['heat', 'crowd', 'egress'],
    certificationStatus: 'in_progress',
    certificationScore: 68,
    lastAuditDate: '2026-05-15T00:00:00Z',
  };
  upsertVenue(venue);

  // ── Zones (4 per appflow.md §3) ────────────────────────────────────────────
  const zones: Zone[] = [
    {
      id: 'zone_gate_a',
      venueId: DEMO_VENUE_ID,
      name: 'Gate A',
      type: 'gate',
      capacityModel: 2200,
    },
    {
      id: 'zone_gate_c',
      venueId: DEMO_VENUE_ID,
      name: 'Gate C',
      type: 'gate',
      capacityModel: 1800,
    },
    {
      id: 'zone_main_concourse',
      venueId: DEMO_VENUE_ID,
      name: 'Main Concourse',
      type: 'concourse',
      capacityModel: 4500,
    },
    {
      id: 'zone_north_concession',
      venueId: DEMO_VENUE_ID,
      name: 'North Concession',
      type: 'concession',
      capacityModel: 800,
    },
  ];
  zones.forEach(upsertZone);

  // ── Certification Audit ────────────────────────────────────────────────────
  const audit: CertificationAudit = {
    id: 'audit_001',
    venueId: DEMO_VENUE_ID,
    date: '2026-05-15T00:00:00Z',
    rubricScores: {
      crowdFlowDesign: 75,
      heatMitigation: 60,
      egressCapacity: 80,
      staffProtocol: 55,
    },
    overallScore: 68,
    auditorNotes:
      'Heat mitigation and staff protocol documentation need strengthening before certification can be issued.',
    status: 'submitted',
  };
  writeAudit(audit);

  // ── Benchmark Aggregates (synthetic peer set) ──────────────────────────────
  const benchmarks: BenchmarkAggregate[] = [
    {
      id: 'bench_heat_2026_07',
      hazardType: 'heat',
      periodId: '2026-07',
      anonymizedAverage: 0.48,
      percentileDistribution: { p25: 0.32, p50: 0.48, p75: 0.67 },
    },
    {
      id: 'bench_crowd_2026_07',
      hazardType: 'crowd',
      periodId: '2026-07',
      anonymizedAverage: 0.52,
      percentileDistribution: { p25: 0.38, p50: 0.52, p75: 0.71 },
    },
    {
      id: 'bench_egress_2026_07',
      hazardType: 'egress',
      periodId: '2026-07',
      anonymizedAverage: 0.44,
      percentileDistribution: { p25: 0.30, p50: 0.44, p75: 0.60 },
    },
  ];
  benchmarks.forEach(writeBenchmark);

  // ── Demo Users ─────────────────────────────────────────────────────────────
  const users: AppUser[] = [
    {
      id: 'user_ops',
      role: 'ops_director',
      venueAccess: [DEMO_VENUE_ID],
      displayName: 'Dana (Ops Director)',
    },
    {
      id: 'user_compliance',
      role: 'compliance_officer',
      venueAccess: [DEMO_VENUE_ID],
      displayName: 'Marcus (Compliance)',
    },
    {
      id: 'user_insurer',
      role: 'insurer',
      venueAccess: [DEMO_VENUE_ID],
      displayName: 'Priya (Insurer)',
    },
  ];
  users.forEach(writeUser);

  setInitialized(true);
  console.log('[VRI] Store seeded: 1 venue, 4 zones, 3 demo users');
}

export { DEMO_VENUE_ID as venueId };
