// lib/signals/fusionService.test.ts
// Fix #13: Unit tests for classifyRiskLevel() and computeTrend()
// These are the trust-critical deterministic functions — "Gemini never classifies risk"
// is the project's core safety contract, so these tests must cover all threshold boundaries.
//
// Run with: npx jest lib/signals/fusionService.test.ts
// Or via:   npm test (if jest is configured in package.json)

import { classifyRiskLevel, computeTrend } from './fusionService';
import type { RiskSignal } from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a minimal RiskSignal stub for trend comparison */
function makeSignal(
  heatIndex: number,
  crowdDensity: number,
  egressUtilization: number
): RiskSignal {
  return {
    id: 'test',
    venueId: 'v1',
    zoneId: 'z1',
    timestamp: new Date().toISOString(),
    heatIndex,
    shadeCoverage: 0.3,
    crowdDensity,
    egressUtilization,
    trend: 'stable',
    riskLevel: 'normal',
  };
}

// ── classifyRiskLevel ────────────────────────────────────────────────────────

describe('classifyRiskLevel — heat thresholds', () => {
  test('returns "normal" when heat ≤ 35', () => {
    expect(classifyRiskLevel(35, 0, 0)).toBe('normal');
    expect(classifyRiskLevel(30, 0, 0)).toBe('normal');
    expect(classifyRiskLevel(0, 0, 0)).toBe('normal');
  });

  test('returns "elevated" when heat > 35 and ≤ 40', () => {
    expect(classifyRiskLevel(35.1, 0, 0)).toBe('elevated');
    expect(classifyRiskLevel(38, 0, 0)).toBe('elevated');
    expect(classifyRiskLevel(40, 0, 0)).toBe('elevated');
  });

  test('returns "high" when heat > 40', () => {
    expect(classifyRiskLevel(40.1, 0, 0)).toBe('high');
    expect(classifyRiskLevel(45, 0, 0)).toBe('high');
    expect(classifyRiskLevel(50, 0, 0)).toBe('high');
  });
});

describe('classifyRiskLevel — crowd density thresholds', () => {
  test('returns "normal" when crowd ≤ 0.70', () => {
    expect(classifyRiskLevel(null, 0.70, 0)).toBe('normal');
    expect(classifyRiskLevel(null, 0.50, 0)).toBe('normal');
    expect(classifyRiskLevel(null, 0, 0)).toBe('normal');
  });

  test('returns "elevated" when crowd > 0.70 and ≤ 0.85', () => {
    expect(classifyRiskLevel(null, 0.71, 0)).toBe('elevated');
    expect(classifyRiskLevel(null, 0.80, 0)).toBe('elevated');
    expect(classifyRiskLevel(null, 0.85, 0)).toBe('elevated');
  });

  test('returns "high" when crowd > 0.85', () => {
    expect(classifyRiskLevel(null, 0.851, 0)).toBe('high');
    expect(classifyRiskLevel(null, 0.95, 0)).toBe('high');
    expect(classifyRiskLevel(null, 1.0, 0)).toBe('high');
  });
});

describe('classifyRiskLevel — egress utilization thresholds', () => {
  test('returns "normal" when egress ≤ 0.75', () => {
    expect(classifyRiskLevel(null, null, 0.75)).toBe('normal');
    expect(classifyRiskLevel(null, null, 0.50)).toBe('normal');
    expect(classifyRiskLevel(null, null, 0)).toBe('normal');
  });

  test('returns "elevated" when egress > 0.75 and ≤ 0.90', () => {
    expect(classifyRiskLevel(null, null, 0.76)).toBe('elevated');
    expect(classifyRiskLevel(null, null, 0.85)).toBe('elevated');
    expect(classifyRiskLevel(null, null, 0.90)).toBe('elevated');
  });

  test('returns "high" when egress > 0.90', () => {
    expect(classifyRiskLevel(null, null, 0.901)).toBe('high');
    expect(classifyRiskLevel(null, null, 0.99)).toBe('high');
    expect(classifyRiskLevel(null, null, 1.0)).toBe('high');
  });
});

describe('classifyRiskLevel — null handling', () => {
  test('treats all-null signals as normal (null → 0)', () => {
    expect(classifyRiskLevel(null, null, null)).toBe('normal');
  });

  test('highest hazard wins — mixed levels return highest', () => {
    // heat=elevated, crowd=high → should be high
    expect(classifyRiskLevel(38, 0.90, 0)).toBe('high');
    // heat=normal, crowd=elevated, egress=high → should be high
    expect(classifyRiskLevel(20, 0.72, 0.92)).toBe('high');
    // heat=elevated, egress=elevated → should be elevated (no high trigger)
    expect(classifyRiskLevel(36, 0, 0.76)).toBe('elevated');
  });
});

// ── computeTrend ─────────────────────────────────────────────────────────────

describe('computeTrend — no previous signal', () => {
  test('returns "stable" when no previous signal exists', () => {
    const current = { heatIndex: 38, crowdDensity: 0.75, egressUtilization: 0.80 };
    expect(computeTrend(current, null)).toBe('stable');
  });
});

describe('computeTrend — rising direction', () => {
  test('returns "rising" when composite score increases by > 0.05', () => {
    const prev = makeSignal(30, 0.50, 0.60);
    // significantly higher composite
    const current = { heatIndex: 38, crowdDensity: 0.75, egressUtilization: 0.80 };
    expect(computeTrend(current, prev)).toBe('rising');
  });
});

describe('computeTrend — falling direction', () => {
  test('returns "falling" when composite score decreases by > 0.05', () => {
    const prev = makeSignal(40, 0.85, 0.88);
    const current = { heatIndex: 28, crowdDensity: 0.40, egressUtilization: 0.50 };
    expect(computeTrend(current, prev)).toBe('falling');
  });
});

describe('computeTrend — stable', () => {
  test('returns "stable" when delta is within ±0.05 of previous', () => {
    const prev = makeSignal(34, 0.60, 0.65);
    // identical values → delta = 0
    const current = { heatIndex: 34, crowdDensity: 0.60, egressUtilization: 0.65 };
    expect(computeTrend(current, prev)).toBe('stable');
  });

  test('returns "stable" for tiny delta within dead-band', () => {
    const prev = makeSignal(34, 0.60, 0.65);
    // very small change — within ±0.05 dead-band
    const current = { heatIndex: 34.5, crowdDensity: 0.605, egressUtilization: 0.655 };
    expect(computeTrend(current, prev)).toBe('stable');
  });
});
