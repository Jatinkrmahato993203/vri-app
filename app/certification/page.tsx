'use client';
// app/certification/page.tsx — Compliance Officer view (appflow.md §4)
// Fix #4: Rubric is now interactive — toggles drive live score recomputation.
// "Submit for audit" posts the actual live scores from state, not hardcoded dummies.

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck, ShieldAlert, CheckCircle2, XCircle, HelpCircle, FileText,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import NavShell from '@/components/NavShell';
import type { UserRole } from '@/types';

const VENUE_ID = 'venue_riverside_arena';

type ItemStatus = 'met' | 'not_met' | 'needs_evidence';

interface RubricItem { id: string; label: string; status: ItemStatus; notes?: string; }
interface CategoryDef { id: string; categoryKey: string; label: string; description: string; items: RubricItem[]; }

// Scoring weights: met=100, needs_evidence=50, not_met=0 — averaged over items
function computeScore(items: RubricItem[]): number {
  if (items.length === 0) return 0;
  const weights: Record<ItemStatus, number> = { met: 100, needs_evidence: 50, not_met: 0 };
  return Math.round(items.reduce((s, i) => s + weights[i.status], 0) / items.length);
}

const INITIAL_CATEGORIES: CategoryDef[] = [
  {
    id: 'crowd_flow', categoryKey: 'crowdFlowDesign',
    label: 'Crowd Flow Design',
    description: 'Physical layout, queue management, and crowd routing adequacy',
    items: [
      { id: 'cf1', label: 'Entry/exit gate counts meet occupancy ratios', status: 'met' },
      { id: 'cf2', label: 'Queue barriers and crowd routing signage installed', status: 'met' },
      { id: 'cf3', label: 'Crowd flow modeled for sold-out event scenario', status: 'needs_evidence', notes: 'Simulation report submitted; awaiting review' },
      { id: 'cf4', label: 'Annual crowd-flow audit completed by certified assessor', status: 'not_met' },
    ],
  },
  {
    id: 'heat_mitigation', categoryKey: 'heatMitigation',
    label: 'Heat Mitigation',
    description: 'Shade, cooling, hydration, and heat emergency protocols',
    items: [
      { id: 'hm1', label: 'Shade coverage ≥ 40% in all outdoor zones', status: 'not_met', notes: 'Gate A and Gate C measured at 22–28%' },
      { id: 'hm2', label: 'Free water stations at all gates', status: 'met' },
      { id: 'hm3', label: 'Heat emergency response plan documented', status: 'needs_evidence' },
      { id: 'hm4', label: 'Staff trained in heat illness recognition and response', status: 'met' },
    ],
  },
  {
    id: 'egress_capacity', categoryKey: 'egressCapacity',
    label: 'Egress Capacity',
    description: 'Exit throughput, emergency egress planning, and drill frequency',
    items: [
      { id: 'ec1', label: 'Exit throughput capacity ≥ full occupancy in 8 minutes', status: 'met' },
      { id: 'ec2', label: 'Emergency egress routes clearly marked and unobstructed', status: 'met' },
      { id: 'ec3', label: 'Evacuation drill completed within 12 months', status: 'met' },
      { id: 'ec4', label: 'Egress capacity independently verified', status: 'needs_evidence' },
    ],
  },
  {
    id: 'staff_protocol', categoryKey: 'staffProtocol',
    label: 'Staff Protocol',
    description: 'Training, communication systems, and incident response readiness',
    items: [
      { id: 'sp1', label: 'All crowd-facing staff trained on emergency protocols', status: 'needs_evidence', notes: 'Training records requested; partial documentation received' },
      { id: 'sp2', label: 'Radio/comms system tested for full venue coverage', status: 'met' },
      { id: 'sp3', label: 'Incident command structure documented and briefed', status: 'not_met' },
      { id: 'sp4', label: 'Medical station staffed at 1:1000 occupancy ratio', status: 'met' },
    ],
  },
];

const STATUS_CYCLE: ItemStatus[] = ['met', 'needs_evidence', 'not_met'];
const STATUS_CONFIG: Record<ItemStatus, { label: string; Icon: typeof CheckCircle2; color: string; bg: string }> = {
  met: { label: 'Met', Icon: CheckCircle2, color: 'var(--risk-normal)', bg: 'var(--risk-normal-bg)' },
  not_met: { label: 'Not Met', Icon: XCircle, color: 'var(--risk-high)', bg: 'var(--risk-high-bg)' },
  needs_evidence: { label: 'Needs Evidence', Icon: HelpCircle, color: 'var(--risk-elevated)', bg: 'var(--risk-elevated-bg)' },
};

// CategoryCard: receives items as state + an onToggle callback so parent holds truth
interface CategoryCardProps {
  category: CategoryDef & { items: RubricItem[] };
  onToggleItem: (categoryId: string, itemId: string) => void;
}
function CategoryCard({ category, onToggleItem }: CategoryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const score = computeScore(category.items);
  const metCount = category.items.filter((i) => i.status === 'met').length;

  return (
    <div className="card" style={{ overflow: 'hidden', marginBottom: 16 }}>
      <button
        id={`cert-category-${category.id}`}
        onClick={() => setExpanded((e) => !e)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((x) => !x); } }}
        aria-expanded={expanded}
        aria-controls={`rubric-${category.id}`}
        style={{
          display: 'flex', alignItems: 'center', width: '100%',
          padding: '20px 24px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left', gap: 16,
        }}
      >
        {/* Live score ring */}
        <div
          style={{
            width: 52, height: 52, borderRadius: '50%',
            background: `conic-gradient(var(--accent-signal) ${score}%, var(--border-subtle) 0)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background 400ms ease',
          }}
          aria-label={`Score: ${score}%`}
        >
          <div style={{
            width: 38, height: 38, borderRadius: '50%', background: 'var(--bg-panel)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'var(--ink-primary)',
            fontFamily: 'IBM Plex Mono, monospace',
          }}>
            {score}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-primary)', marginBottom: 3 }}>{category.label}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-secondary)' }}>{category.description}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--risk-normal)', fontWeight: 600 }}>{metCount} Met</span>
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

      {expanded && (
        <div id={`rubric-${category.id}`} style={{ borderTop: '1px solid var(--border-subtle)', padding: '16px 24px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: 'var(--ink-tertiary)' }}>
            Click a badge to cycle: Met → Needs Evidence → Not Met
          </p>
          {category.items.map((item, idx) => {
            const { label, Icon, color, bg } = STATUS_CONFIG[item.status];
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0',
                  borderBottom: idx < category.items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                {/* Clickable status badge — cycles through statuses */}
                <button
                  id={`rubric-item-${item.id}`}
                  onClick={() => onToggleItem(category.id, item.id)}
                  title={`Current: ${label} — click to change`}
                  aria-label={`Toggle status for: ${item.label}. Currently: ${label}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px',
                    borderRadius: 6, background: bg, color, fontSize: 11, fontWeight: 600,
                    whiteSpace: 'nowrap', flexShrink: 0, marginTop: 1,
                    border: '1px solid transparent', cursor: 'pointer',
                    transition: 'all 200ms ease',
                  }}
                >
                  <Icon size={11} strokeWidth={2.5} aria-hidden="true" />
                  {label}
                </button>
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
  // Fix #4: categories in state so toggle updates flow up and drive live scores
  const [categories, setCategories] = useState<CategoryDef[]>(INITIAL_CATEGORIES);
  const [role] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('vri_role') as UserRole | null) ?? 'compliance_officer';
    }
    return 'compliance_officer';
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem('vri_role') as UserRole | null;
    if (!storedRole) {
      router.replace('/login');
    }
  }, [router]);

  // Cycle item status in-place — mutation flows up through parent state
  const handleToggleItem = useCallback((categoryId: string, itemId: string) => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          items: cat.items.map((item) => {
            if (item.id !== itemId) return item;
            const currentIdx = STATUS_CYCLE.indexOf(item.status);
            const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];
            return { ...item, status: nextStatus };
          }),
        };
      })
    );
    setSubmitted(false); // reset submission state if user changes rubric
  }, []);

  // Fix #4: overallScore and per-category scores computed from live state
  const categoryScores = categories.map((c) => ({ key: c.categoryKey, score: computeScore(c.items) }));
  const overallScore = Math.round(categoryScores.reduce((s, c) => s + c.score, 0) / categoryScores.length);
  const allMet = categoryScores.every((c) => c.score >= 80);
  const weakCategories = categories.filter((_, idx) => categoryScores[idx].score < 80);

  const handleSubmit = async () => {
    setSubmitting(true);
    // Fix #4: submit actual computed scores from state, not hardcoded dummies
    const rubricScores = Object.fromEntries(categoryScores.map(({ key, score }) => [key, score]));
    try {
      await fetch(`/api/certification/${VENUE_ID}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rubricScores, overallScore }),
      });
      setSubmitted(true);
    } catch {
      // Fail visibly — not silently
      alert('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
            Riverside Arena · Crowd safety certification rubric — click any badge to update status
          </p>
        </div>

        {/* Overall status card — live-computed */}
        <div className="card" style={{ padding: 24, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          {/* Score gauge */}
          <div
            style={{
              width: 80, height: 80, borderRadius: '50%',
              background: `conic-gradient(var(--accent-signal) ${overallScore}%, var(--border-subtle) 0)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 400ms ease',
            }}
            role="img"
            aria-label={`Overall certification score: ${overallScore}%`}
          >
            <div style={{
              width: 58, height: 58, borderRadius: '50%', background: 'var(--bg-panel)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--ink-primary)', fontFamily: 'IBM Plex Mono, monospace', lineHeight: 1 }}>
                {overallScore}
              </span>
              <span style={{ fontSize: 10, color: 'var(--ink-tertiary)', fontWeight: 500 }}>/ 100</span>
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              {allMet
                ? <ShieldCheck size={20} color="var(--risk-normal)" aria-hidden="true" />
                : <ShieldAlert size={20} color="var(--risk-elevated)" aria-hidden="true" />}
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-primary)' }}>
                {allMet ? 'Certification Ready' : 'In Progress'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
              {allMet
                ? 'All rubric categories meet the minimum threshold. Ready to submit for certification.'
                : `${weakCategories.length} ${weakCategories.length === 1 ? 'category needs' : 'categories need'} attention: ${weakCategories.map((c) => c.label).join(', ')}.`}
            </p>
          </div>

          <div>
            {submitted ? (
              <div style={{
                padding: '10px 16px', borderRadius: 8,
                background: 'var(--risk-normal-bg)', color: 'var(--risk-normal)',
                fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <CheckCircle2 size={14} />
                Submitted — score {overallScore}%
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

        {/* Interactive category cards */}
        <div>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: 'var(--ink-primary)' }}>
            Rubric categories
          </h2>
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} onToggleItem={handleToggleItem} />
          ))}
        </div>
      </div>
    </NavShell>
  );
}
