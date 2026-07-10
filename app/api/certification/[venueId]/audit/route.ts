// app/api/certification/[venueId]/audit/route.ts
// POST: stub audit submission — writes a draft record (appflow.md §4).
// GET: returns the latest certification audit + rubric scores for a venue.

import { NextRequest, NextResponse } from 'next/server';
import { ensureInitialized } from '@/app/api/seed/route';
import { getLatestAuditForVenue, writeAudit } from '@/lib/store/memoryStore';
import type { CertificationAudit } from '@/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ venueId: string }> }
): Promise<NextResponse> {
  const { venueId } = await params;
  await ensureInitialized();

  const audit = getLatestAuditForVenue(venueId);
  if (!audit) {
    return NextResponse.json({ venueId, audit: null, certificationStatus: 'not_started' });
  }

  return NextResponse.json({ venueId, audit, certificationStatus: audit.status });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ venueId: string }> }
): Promise<NextResponse> {
  const { venueId } = await params;
  await ensureInitialized();

  const body = await req.json().catch(() => ({}));

  // Stub: create a draft audit record
  const audit: CertificationAudit = {
    id: `audit_${Date.now()}`,
    venueId,
    date: new Date().toISOString(),
    rubricScores: body.rubricScores ?? {
      crowdFlowDesign: 0,
      heatMitigation: 0,
      egressCapacity: 0,
      staffProtocol: 0,
    },
    overallScore: 0,
    auditorNotes: body.auditorNotes ?? 'Submitted for review.',
    status: 'submitted',
  };

  writeAudit(audit);
  return NextResponse.json({ ok: true, auditId: audit.id, status: 'submitted' }, { status: 201 });
}
