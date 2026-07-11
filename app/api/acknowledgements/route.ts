// app/api/acknowledgements/route.ts
// Fix #5/#19: POST persists an acknowledgement read-receipt to the store.
// GET retrieves all acknowledgements for a given zone/venue.
// Acknowledgement = read-receipt ONLY — never a recommendation response (rules.md rule 1).

import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized } from '@/app/api/seed/route';
import { writeAcknowledgement, getAcknowledgements } from '@/lib/store/memoryStore';
import type { Acknowledgement } from '@/types';

export async function POST(req: NextRequest): Promise<NextResponse> {
  await ensureInitialized();

  const body = await req.json().catch(() => null);
  if (!body || !body.zoneId || !body.venueId || !body.signalSnapshotId) {
    return NextResponse.json(
      { error: 'Missing required fields: zoneId, venueId, signalSnapshotId' },
      { status: 400 }
    );
  }

  const ack: Acknowledgement = {
    id: `ack_${body.zoneId}_${Date.now()}`,
    venueId: body.venueId,
    zoneId: body.zoneId,
    userId: body.userId ?? 'demo_user', // auth placeholder — fix #3 would supply real user
    narrativeId: body.narrativeId ?? 'unknown', // which narrative was on screen
    signalSnapshotId: body.signalSnapshotId,
    riskLevelAtAck: body.riskLevelAtAck ?? 'normal',
    timestamp: new Date().toISOString(),
  };

  writeAcknowledgement(ack);
  return NextResponse.json({ ok: true, ack });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  await ensureInitialized();

  const { searchParams } = new URL(req.url);
  const zoneId = searchParams.get('zoneId');
  const venueId = searchParams.get('venueId');

  if (!venueId) {
    return NextResponse.json({ error: 'venueId required' }, { status: 400 });
  }

  const acks = getAcknowledgements(venueId, zoneId ?? undefined);
  return NextResponse.json({ acknowledgements: acks });
}
