'use client';
// app/certification/page.tsx — Compliance Officer view (appflow.md §4)
// Static certification rubric with 4 categories, Met/Not Met/Needs Evidence per item.

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, HelpCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import NavShell from '@/components/NavShell';
import type { UserRole } from '@/types';

const VENUE_ID = 'venue_riverside_arena';

type ItemStatus = 'met' | 'not_met' | 'needs_evidence';

interface RubricItem { id: string; label: string; status: ItemStatus; notes?: string; }
interface Category { id: string; label: string; description: string; score: number; items: RubricItem[]; }

const CATEGORIES: Category[] = [
  {
    id: 'crowd_flow',
    label: 'Crowd Flow Design',
    description: 'Physical layout, queue management, and crowd routing adequacy',
    score: 75,
    items: [
      { id: 'cf1', label: 'Entry/exit gate counts meet occupancy ratios', status: 'met' },
      { id: 'cf2', label: 'Queue barriers and crowd routing signage installed', status: 'met' },
      { id: 'cf3', label: 'Crowd flow modeled for sold-out event scenario', status: 'needs_evidence', notes: 'Simulation report submitted; awaiting review' },
      { id: 'cf4', label: 'Annual crowd-flow audit completed by certified assessor', status: 'not_met' },
    ],
  },
  {
    id: 'heat_mitigation',
    label: 'Heat Mitigation',
    description: 'Shade, cooling, hydration, and heat emergency protocols',
    score: 60,
    items: [
      { id: 'hm1', label: 'Shade coverage ≥ 40% in all outdoor zones', status: 'not_met', notes: 'Gate A and Gate C measured at 22–28%' },
      { id: 'hm2', label: 'Free water stations at all gates', status: 'met' },
      { id: 'hm3', label: 'Heat emergency response plan documented', status: 'needs_evidence' },
      { id: 'hm4', label: 'Staff trained in heat illness recognition and response', status: 'met' },
    ],
  },
  {
    id: 'egress_capacity',
    label: 'Egress Capacity',
    description: 'Exit throughput, emergency egress planning, and drill frequency',
    score: 80,
    items: [
      { id: 'ec1', label: 'Exit throughput capacity ≥ full occupancy in 8 minutes', status: 'met' },
      { id: 'ec2', label: 'Emergency egress routes clearly marked and unobstructed', status: 'met' },
      { id: 'ec3', label: 'Evacuation drill completed within 12 months', status: 'met' },
      { id: 'ec4', label: 'Egress capacity independently verified', status: 'needs_evidence' },
    ],
  },
  {
    id: 'staff_protocol',
    label: 'Staff Protocol',
    description: 'Training, communication systems, and incident response readiness',
    score: 55,
    items: [
      { id: 'sp1', label: 'All crowd-facing staff trained on emergency protocols', status: 'needs_evidence', notes: 'Training records requested; partial documentation received' },
      { id: 'sp2', label: 'Radio/comms system tested for full venue coverage', status: 'met' },
      { id: 'sp3', label: 'Incident command structure documented and briefed', status: 'not_met' },
      { id: 'sp4', label: 'Medical station staffed at 1:1000 occupancy ratio', status: 'met' },
    ],
  },
];

const STATUS_CONFIG: Record<ItemStatus, { label: string; Icon: typeof CheckCircle2; color: string; bg: string }> = {
  met: { label: 'Met', Icon: CheckCircle2, color: 'var(--risk-normal)', bg: 'var(--risk-normal-bg)' },
  not_met: { label: 'Not Met', Icon: XCircle, color: 'var(--risk-high)', bg: 'var(--risk-high-bg)' },
  needs_evidence: { label: 'Needs Evidence', Icon: HelpCircle, color: 'var(--risk-elevated)', bg: 'var(--risk-elevated-bg)' },
};

function CategoryCard({ category }: { category: Category }) {
  const [expanded, setExpanded] = useState(false);
  const metCount = category.items.filter((i) => i.status === 'met').length;
  const total = category.items.length;

  return (
    <div
      className="card"
      style={{ overflow: 'hidden', marginBottom: 16 }}
    >
      <button
        id={`cert-category-${category.id}`}
        onClick={() => setExpanded((e) => !e)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((x) => !x); } }}
        aria-expanded={expanded}
        aria-controls={`rubric-${category.id}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          padding: '20px 24px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 16,
        }}
      >
        {/* Score ring */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: `conic-gradient(var(--accent-signal) ${category.score}%, var(--border-subtle) 0)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
          }}
          aria-label={`Score: ${category.score}%`}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'var(--bg-panel)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--ink-primary)',
              fontFamily: 'IBM Plex Mono, monospace',
            }}
          >
            {category.score}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)', marginBottom: 3 }}>
            {category.label}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>{category.description}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--risk-normal)', fontWeight: 600 }}>
              {metCount} Met
            </span>
            <span style={{ color: 'var(--border-medium)' }}>·</span>
            <span style={{ fontSize: 12, color: 'var(--risk-high)', fontWeight: 600 }}>
              {category.items.filter((i) => i.status === 'not_met').length} Not Met
            </span>
            <span style={{ color: 'var(--border-medium)' }}>·</span>
            <span style={{ fontSize: 12, color: 'var(--risk-elevated)', fontWeight: 600 }}>
              {category.items.filter((i) => i.status === 'needs_evidence').length} Needs Evidence
            </span>
          </div>
        </div>

        {expanded ? <ChevronUp size={18} color="var(--ink-tertiary)" /> : <ChevronDown size={18} color="var(--ink-tertiary)" />}
      </button>

      {/* Rubric items */}
      {expanded && (
        <div id={`rubric-${category.id}`} style={{ borderTop: '1px solid var(--border-subtle)', padding: '16px 24px' }}>
          {category.items.map((item, idx) => {
            const { label, Icon, color, bg } = STATUS_CONFIG[item.status];
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 0',
                  borderBottom: idx < category.items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: bg,
                    color,
                    fontSize: 11,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                  aria-label={`Status: ${label}`}
                >
                  <Icon size={11} strokeWidth={2.5} aria-hidden="true" />
                  {label}
                </span>
                <div>
                  <div style={{ fontSize: 14, color: 'var(--ink-primary)', fontWeight: 500 }}>{item.label}</div>
                  {item.notes && (
                    <div style={{ fontSize: 12, color: 'var(--ink-secondary)', marginTop: 3 }}>{item.notes}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CertificationPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>('compliance_officer');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem('vri_role') as UserRole | null;
    if (!storedRole) { router.replace('/login'); return; }
    setRole(storedRole);
  }, [router]);

  const overallScore = Math.round(CATEGORIES.reduce((sum, c) => sum + c.score, 0) / CATEGORIES.length);
  const allMet = CATEGORIES.every((c) => c.score >= 80);

  const handleSubmit = async () => {
    setSubmitting(true);
    await fetch(`/api/certification/${VENUE_ID}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rubricScores: { crowdFlowDesign: 75, heatMitigation: 60, egressCapacity: 80, staffProtocol: 55 } }),
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <NavShell role={role} displayName={role === 'compliance_officer' ? 'Marcus' : 'User'}>
      <div style={{ padding: '32px 32px 48px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <ShieldCheck size={22} color="var(--accent-signal)" />
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--ink-primary)', letterSpacing: '-0.03em' }}>
              Certification Readiness
            </h1>
          </div>
          <p style={{ margin: 0, color: 'var(--ink-secondary)', fontSize: 14 }}>
            Riverside Arena · Crowd safety certification rubric
          </p>
        </div>

        {/* Overall status card */}
        <div
          className="card"
          style={{ padding: 24, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}
        >
          {/* Score gauge */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `conic-gradient(var(--accent-signal) ${overallScore}%, var(--border-subtle) 0)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            role="img"
            aria-label={`Overall certification score: ${overallScore}%`}
          >
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: 'var(--bg-panel)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink-primary)', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>{overallScore}</span>
              <span style={{ fontSize: 10, color: 'var(--ink-tertiary)', fontWeight: 500 }}>/ 100</span>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              {allMet ? (
                <ShieldCheck size={20} color="var(--risk-normal)" aria-hidden="true" />
              ) : (
                <ShieldAlert size={20} color="var(--risk-elevated)" aria-hidden="true" />
              )}
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-primary)' }}>
                {allMet ? 'Certification Ready' : 'In Progress'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
              {allMet
                ? 'All rubric categories meet the minimum threshold. Ready to submit for certification.'
                : `${CATEGORIES.filter((c) => c.score < 80).length} categories need attention before certification can be issued. Heat mitigation and staff protocol documentation require strengthening.`}
            </p>
          </div>

          {/* Submit for audit */}
          <div>
            {submitted ? (
              <div
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  background: 'var(--risk-normal-bg)',
                  color: 'var(--risk-normal)',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <CheckCircle2 size={14} />
                Submitted for review
              </div>
            ) : (
              <button
                id="submit-audit-btn"
                className="btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
                style={{ opacity: submitting ? 0.6 : 1 }}
              >
                <FileText size={14} aria-hidden="true" />
                {submitting ? 'Submitting…' : 'Submit for audit'}
              </button>
            )}
          </div>
        </div>

        {/* Category cards */}
        <div>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: 'var(--ink-primary)' }}>
            Rubric categories
          </h2>
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </div>
    </NavShell>
  );
}
