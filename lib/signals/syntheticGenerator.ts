// lib/signals/syntheticGenerator.ts
// Generates synthetic crowd density and egress utilization data.
// Seeded on real documented patterns (heat-dome conditions, Kansas City transit-gap congestion).
// Never produces riskLevel — that's computed by fusionService.ts (rules.md rule 2).

import type { Zone } from '@/types';

// Demo escalation state — global so it persists across calls in a dev session
declare global {
  // eslint-disable-next-line no-var
  var __vri_demo_tick: number | undefined;
  // eslint-disable-next-line no-var
  var __vri_demo_mode: boolean | undefined;
}

export function setDemoMode(enabled: boolean): void {
  globalThis.__vri_demo_mode = enabled;
  if (enabled) globalThis.__vri_demo_tick = 0;
}

export function getDemoTick(): number {
  return globalThis.__vri_demo_tick ?? 0;
}

export function advanceDemoTick(): void {
  globalThis.__vri_demo_tick = ((globalThis.__vri_demo_tick ?? 0) + 1) % 30;
}

function isDemoMode(): boolean {
  return globalThis.__vri_demo_mode ?? false;
}

// Base crowd characteristics by zone type (reflects real venue patterns)
const BASE_CROWD_BY_TYPE: Record<string, number> = {
  gate: 0.62,
  concourse: 0.48,
  concession: 0.55,
  section: 0.40,
};

const BASE_EGRESS_BY_TYPE: Record<string, number> = {
  gate: 0.58,
  concourse: 0.42,
  concession: 0.38,
  section: 0.30,
};

// Simulate time-of-day patterns: crowd peaks during event midpoint
function timeOfDayMultiplier(): number {
  const hour = new Date().getHours();
  // Peak at 20:00 (8pm), lower in morning
  const peak = 20;
  const diff = Math.abs(hour - peak);
  return Math.max(0.6, 1.0 - diff * 0.04);
}

// Small random walk — stays realistic, doesn't jump wildly
function randomWalk(base: number, volatility = 0.06): number {
  const delta = (Math.random() - 0.5) * 2 * volatility;
  return Math.min(1.0, Math.max(0.0, base + delta));
}

// Demo escalation pattern: ticks 0–9 = normal, 10–19 = elevated, 20–29 = high, then reset
function demoMultiplier(tick: number): number {
  if (tick < 10) return 0.7;   // normal
  if (tick < 20) return 1.15;  // elevated
  return 1.45;                  // high
}

export interface SyntheticSignalData {
  crowdDensity: number;
  egressUtilization: number;
}

export function generateSyntheticSignal(zone: Zone): SyntheticSignalData {
  const baseC = BASE_CROWD_BY_TYPE[zone.type] ?? 0.50;
  const baseE = BASE_EGRESS_BY_TYPE[zone.type] ?? 0.45;
  const todMult = timeOfDayMultiplier();

  let crowdDensity: number;
  let egressUtilization: number;

  if (isDemoMode()) {
    const tick = getDemoTick();
    const dMult = demoMultiplier(tick);
    crowdDensity = Math.min(1.0, baseC * todMult * dMult + (Math.random() - 0.5) * 0.04);
    egressUtilization = Math.min(1.0, baseE * todMult * dMult + (Math.random() - 0.5) * 0.04);
  } else {
    crowdDensity = randomWalk(baseC * todMult);
    egressUtilization = randomWalk(baseE * todMult);
  }

  return {
    crowdDensity: parseFloat(crowdDensity.toFixed(3)),
    egressUtilization: parseFloat(egressUtilization.toFixed(3)),
  };
}
