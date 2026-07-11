// app/api/simulate/route.ts
// POST: triggers one signal update cycle for all zones — refreshes signals and narratives.
// Also accepts { demoMode: true } to enable the escalating-risk demo scenario.
// Fix #12: in-memory token bucket rate limit (10 req/min per IP) prevents abuse.

import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized } from '@/app/api/seed/route';
import { getZonesByVenue, writeSignal, writeNarrative } from '@/lib/store/memoryStore';
import { fuseSignals } from '@/lib/signals/fusionService';
import { generateNarrative } from '@/lib/narrative/narrativeGenerator';
import { setDemoMode, advanceDemoTick } from '@/lib/signals/syntheticGenerator';
import { DEMO_VENUE_ID } from '@/lib/seed/seedData';

// Fix #12: Simple in-memory token bucket rate limiter (per-IP, 10 req/min)
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

interface BucketEntry { count: number; windowStart: number; }
declare global { var __vri_simulate_rl: Map<string, BucketEntry> | undefined; }

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function checkRateLimit(ip: string): boolean {
  if (!globalThis.__vri_simulate_rl) globalThis.__vri_simulate_rl = new Map();
  const rl = globalThis.__vri_simulate_rl;
  const now = Date.now();
  const entry = rl.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rl.set(ip, { count: 1, windowStart: now });
    return true; // allowed
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false; // throttled
  }
  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Fix #12: reject excess requests before doing any work
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 10 requests per minute.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  await ensureInitialized();

  const body = await req.json().catch(() => ({}));
  const { demoMode } = body as { demoMode?: boolean };

  if (typeof demoMode === 'boolean') {
    setDemoMode(demoMode);
  }

  // Advance demo tick before generating new signals
  advanceDemoTick();

  const zones = getZonesByVenue(DEMO_VENUE_ID);
  const results = await Promise.all(
    zones.map(async (zone) => {
      const signal = await fuseSignals(zone);
      writeSignal(signal);
      const narrative = await generateNarrative(signal, zone.name);
      writeNarrative(narrative);
      return { zoneId: zone.id, riskLevel: signal.riskLevel };
    })
  );

  return NextResponse.json({ ok: true, updated: results, timestamp: new Date().toISOString() });
}
