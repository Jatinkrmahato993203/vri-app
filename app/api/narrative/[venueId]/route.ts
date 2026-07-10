// app/api/narrative/[venueId]/route.ts
// GET: latest generated risk narratives for all zones in a venue.

import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized } from '@/app/api/seed/route';
import { getZonesByVenue, getLatestNarrativeForZone } from '@/lib/store/memoryStore';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ venueId: string }> }
): Promise<NextResponse> {
  const { venueId } = await params;
  await ensureInitialized();

  const zones = getZonesByVenue(venueId);
  if (zones.length === 0) {
    return NextResponse.json({ error: 'Venue not found' }, { status: 404 });
  }

  const narratives = zones.map((zone) => ({
    zoneId: zone.id,
    zoneName: zone.name,
    narrative: getLatestNarrativeForZone(zone.id),
  }));

  return NextResponse.json({ venueId, narratives });
}
