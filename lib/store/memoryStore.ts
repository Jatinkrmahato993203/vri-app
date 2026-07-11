// lib/store/memoryStore.ts
// In-memory store replacing Firestore for local dev.
// Partitioned by venueId throughout (rules.md rule 5).
// This module is a singleton — Next.js API routes share the same process in dev.

import type {
  Venue,
  Zone,
  RiskSignal,
  RiskNarrative,
  CertificationAudit,
  BenchmarkAggregate,
  AppUser,
  Acknowledgement,
  SignalHistoryPoint,
} from '@/types';

interface Store {
  venues: Map<string, Venue>;
  zones: Map<string, Zone>;                           // key: zoneId
  riskSignals: Map<string, RiskSignal>;               // key: signalId
  riskNarratives: Map<string, RiskNarrative>;         // key: narrativeId
  certificationAudits: Map<string, CertificationAudit>;
  benchmarkAggregates: Map<string, BenchmarkAggregate>;
  users: Map<string, AppUser>;
  acknowledgements: Map<string, Acknowledgement>;
  signalHistory: Map<string, SignalHistoryPoint[]>;   // key: zoneId
  // latest signal/narrative per zone for fast lookup
  latestSignalByZone: Map<string, string>;            // zoneId → signalId
  latestNarrativeByZone: Map<string, string>;         // zoneId → narrativeId
  initialized: boolean;
}

// Global singleton — survives hot reloads in dev via globalThis
declare global {
  var __vri_store: Store | undefined;
}

function createStore(): Store {
  return {
    venues: new Map(),
    zones: new Map(),
    riskSignals: new Map(),
    riskNarratives: new Map(),
    certificationAudits: new Map(),
    benchmarkAggregates: new Map(),
    users: new Map(),
    acknowledgements: new Map(),
    signalHistory: new Map(),
    latestSignalByZone: new Map(),
    latestNarrativeByZone: new Map(),
    initialized: false,
  };
}

export function getStore(): Store {
  if (!globalThis.__vri_store) {
    globalThis.__vri_store = createStore();
  }
  return globalThis.__vri_store;
}

// ── Write helpers ─────────────────────────────────────────────────────────────

export function upsertVenue(venue: Venue): void {
  getStore().venues.set(venue.id, venue);
}

export function upsertZone(zone: Zone): void {
  getStore().zones.set(zone.id, zone);
}

export function writeSignal(signal: RiskSignal): void {
  const store = getStore();
  store.riskSignals.set(signal.id, signal);
  store.latestSignalByZone.set(signal.zoneId, signal.id);

  // Append to history ring buffer (max 24 points ≈ 2 hours at 5-min intervals)
  const hist = store.signalHistory.get(signal.zoneId) ?? [];
  hist.push({
    timestamp: signal.timestamp,
    heatIndex: signal.heatIndex,
    crowdDensity: signal.crowdDensity,
    egressUtilization: signal.egressUtilization,
    riskLevel: signal.riskLevel,
  });
  if (hist.length > 24) hist.shift();
  store.signalHistory.set(signal.zoneId, hist);
}

export function writeNarrative(narrative: RiskNarrative): void {
  const store = getStore();
  store.riskNarratives.set(narrative.id, narrative);
  store.latestNarrativeByZone.set(narrative.zoneId, narrative.id);
}

export function writeAudit(audit: CertificationAudit): void {
  getStore().certificationAudits.set(audit.id, audit);
}

export function writeBenchmark(agg: BenchmarkAggregate): void {
  getStore().benchmarkAggregates.set(agg.id, agg);
}

export function writeUser(user: AppUser): void {
  getStore().users.set(user.id, user);
}

export function writeAcknowledgement(ack: Acknowledgement): void {
  getStore().acknowledgements.set(ack.id, ack);
}

// ── Read helpers ──────────────────────────────────────────────────────────────

export function getVenue(venueId: string): Venue | undefined {
  return getStore().venues.get(venueId);
}

export function getZonesByVenue(venueId: string): Zone[] {
  return [...getStore().zones.values()].filter((z) => z.venueId === venueId);
}

export function getLatestSignalForZone(zoneId: string): RiskSignal | null {
  const store = getStore();
  const id = store.latestSignalByZone.get(zoneId);
  return id ? (store.riskSignals.get(id) ?? null) : null;
}

export function getLatestNarrativeForZone(zoneId: string): RiskNarrative | null {
  const store = getStore();
  const id = store.latestNarrativeByZone.get(zoneId);
  return id ? (store.riskNarratives.get(id) ?? null) : null;
}

export function getSignalHistory(zoneId: string): SignalHistoryPoint[] {
  return getStore().signalHistory.get(zoneId) ?? [];
}

export function getLatestAuditForVenue(venueId: string): CertificationAudit | undefined {
  const audits = [...getStore().certificationAudits.values()]
    .filter((a) => a.venueId === venueId)
    .sort((a, b) => b.date.localeCompare(a.date));
  return audits[0];
}

export function getBenchmarkAggregates(): BenchmarkAggregate[] {
  return [...getStore().benchmarkAggregates.values()];
}

// Fix #5: retrieve acknowledgements for a venue (optionally filtered by zone)
export function getAcknowledgements(venueId: string, zoneId?: string): Acknowledgement[] {
  return [...getStore().acknowledgements.values()].filter(
    (a) => a.venueId === venueId && (!zoneId || a.zoneId === zoneId)
  );
}

export function isInitialized(): boolean {
  return getStore().initialized;
}

export function setInitialized(val: boolean): void {
  getStore().initialized = val;
}
