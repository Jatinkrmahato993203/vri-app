// app/api/benchmark/[venueId]/route.ts
// GET: anonymized peer-comparison benchmark data.
// No per-venue raw data is ever returned — only aggregated, anonymized stats (schema.md §7).

import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized } from '@/app/api/seed/route';
import { getBenchmarkAggregates, getLatestSignalForZone, getZonesByVenue } from '@/lib/store/memoryStore';
import type { HazardType } from '@/types';

function computeVenueAverage(signalValues: (number | null)[]): number {
  const valid = signalValues.filter((v): v is number => v !== null);
  if (valid.length === 0) return 0;
  return parseFloat((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(3));
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ venueId: string }> }
): Promise<NextResponse> {
  const { venueId } = await params;
  await ensureInitialized();

  const aggregates = getBenchmarkAggregates();
  const zones = getZonesByVenue(venueId);
  const signals = zones.map((z) => getLatestSignalForZone(z.id));

  // Compute this venue's current average per hazard type
  const venueAverages: Record<HazardType, number> = {
    heat: computeVenueAverage(signals.map((s) => (s?.heatIndex ?? null) !== null ? (s!.heatIndex! / 50) : null)),
    crowd: computeVenueAverage(signals.map((s) => s?.crowdDensity ?? null)),
    egress: computeVenueAverage(signals.map((s) => s?.egressUtilization ?? null)),
  };

  const result = aggregates.map((agg) => ({
    hazardType: agg.hazardType,
    periodId: agg.periodId,
    peerAverage: agg.anonymizedAverage,
    venueAverage: venueAverages[agg.hazardType],
    percentileDistribution: agg.percentileDistribution,
  }));

  return NextResponse.json({ venueId, benchmarks: result });
}
