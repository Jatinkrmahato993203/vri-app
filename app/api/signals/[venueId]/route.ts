// app/api/signals/[venueId]/route.ts
// GET: returns fused signal state for all zones in a venue.

import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized } from '@/app/api/seed/route';
import { getZonesByVenue, getLatestSignalForZone, getSignalHistory } from '@/lib/store/memoryStore';

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

  const result = zones.map((zone) => ({
    zone,
    signal: getLatestSignalForZone(zone.id),
    history: getSignalHistory(zone.id),
  }));

  return NextResponse.json({ venueId, zones: result });
}
