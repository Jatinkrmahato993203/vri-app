// app/api/simulate/route.ts
// POST: triggers one signal update cycle for all zones — refreshes signals and narratives.
// Also accepts { demoMode: true } to enable the escalating-risk demo scenario.

import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized } from '@/app/api/seed/route';
import { getZonesByVenue, writeSignal, writeNarrative } from '@/lib/store/memoryStore';
import { fuseSignals } from '@/lib/signals/fusionService';
import { generateNarrative } from '@/lib/narrative/narrativeGenerator';
import { setDemoMode, advanceDemoTick } from '@/lib/signals/syntheticGenerator';
import { DEMO_VENUE_ID } from '@/lib/seed/seedData';

export async function POST(req: NextRequest): Promise<NextResponse> {
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
