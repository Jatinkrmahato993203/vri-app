// lib/signals/fusionService.ts
// Signal Fusion Service: normalizes three signal types into one RiskSignal document per zone.
// Computes `riskLevel` and `trend` DETERMINISTICALLY from threshold values.
// Gemini NEVER classifies risk — it only narrates a pre-classified state (rules.md rule 2).

import type { RiskSignal, RiskLevel, Trend, Zone } from '@/types';
import { generateSyntheticSignal } from './syntheticGenerator';
import { fetchHeatData, syntheticHeatData } from './heatIndexFetcher';
import { getLatestSignalForZone } from '@/lib/store/memoryStore';

// ── Thresholds (deterministic classification — not LLM) ───────────────────────
// rules.md rule 2: risk classification must be auditable and reproducible.

// Fix #13: exported for direct unit testing — these are the core trust-critical functions
export function classifyRiskLevel(
  heatIndex: number | null,
  crowdDensity: number | null,
  egressUtilization: number | null
): RiskLevel {
  const heat = heatIndex ?? 0;
  const crowd = crowdDensity ?? 0;
  const egress = egressUtilization ?? 0;

  if (heat > 40 || crowd > 0.85 || egress > 0.90) return 'high';
  if (heat > 35 || crowd > 0.70 || egress > 0.75) return 'elevated';
  return 'normal';
}

export function computeTrend(
  current: { heatIndex: number | null; crowdDensity: number | null; egressUtilization: number | null },
  previous: RiskSignal | null
): Trend {
  if (!previous) return 'stable';

  // Compare composite risk magnitude to determine direction
  const nowScore = (current.heatIndex ?? 0) / 50 + (current.crowdDensity ?? 0) + (current.egressUtilization ?? 0);
  const prevScore =
    (previous.heatIndex ?? 0) / 50 + (previous.crowdDensity ?? 0) + (previous.egressUtilization ?? 0);

  const delta = nowScore - prevScore;
  if (delta > 0.05) return 'rising';
  if (delta < -0.05) return 'falling';
  return 'stable';
}

// ── Main fusion function ───────────────────────────────────────────────────────

export async function fuseSignals(zone: Zone): Promise<RiskSignal> {
  // 1. Fetch heat data (real API with synthetic fallback)
  const heatData = (await fetchHeatData()) ?? syntheticHeatData();

  // 2. Generate synthetic crowd + egress
  const synthetic = generateSyntheticSignal(zone);

  // 3. Get previous signal for trend computation
  const previous = getLatestSignalForZone(zone.id);

  // 4. Merge signals
  const signals = {
    heatIndex: heatData.heatIndex,
    shadeCoverage: heatData.shadeCoverage,
    crowdDensity: synthetic.crowdDensity,
    egressUtilization: synthetic.egressUtilization,
  };

  // 5. Classify deterministically (rules.md rule 2 — never LLM)
  const riskLevel = classifyRiskLevel(signals.heatIndex, signals.crowdDensity, signals.egressUtilization);
  const trend = computeTrend(signals, previous);

  const id = `sig_${zone.id}_${Date.now()}`;
  const signal: RiskSignal = {
    id,
    venueId: zone.venueId,
    zoneId: zone.id,
    timestamp: new Date().toISOString(),
    heatIndex: signals.heatIndex,
    shadeCoverage: signals.shadeCoverage,
    crowdDensity: signals.crowdDensity,
    egressUtilization: signals.egressUtilization,
    trend,
    riskLevel,
  };

  return signal;
}
