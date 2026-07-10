// app/api/seed/route.ts
// One-time seed endpoint. Also runs automatically on first request to any other endpoint.

import { NextResponse } from 'next/server';
import { isInitialized } from '@/lib/store/memoryStore';
import { seedStore } from '@/lib/seed/seedData';
import { fuseSignals } from '@/lib/signals/fusionService';
import { generateNarrative } from '@/lib/narrative/narrativeGenerator';
import { writeSignal, writeNarrative, getZonesByVenue } from '@/lib/store/memoryStore';
import { DEMO_VENUE_ID } from '@/lib/seed/seedData';

export async function ensureInitialized(): Promise<void> {
  if (!isInitialized()) {
    seedStore();
    // Generate initial signals + narratives for all zones
    const zones = getZonesByVenue(DEMO_VENUE_ID);
    await Promise.all(
      zones.map(async (zone) => {
        const signal = await fuseSignals(zone);
        writeSignal(signal);
        const narrative = await generateNarrative(signal, zone.name);
        writeNarrative(narrative);
      })
    );
  }
}

export async function GET(): Promise<NextResponse> {
  await ensureInitialized();
  return NextResponse.json({ ok: true, message: 'Store seeded and initialized' });
}
