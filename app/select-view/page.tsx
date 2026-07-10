'use client';
// app/select-view/page.tsx — Fallback for demo accounts with no role (appflow.md §2)
import { useRouter } from 'next/navigation';
import { LayoutDashboard, ShieldCheck, BarChart3 } from 'lucide-react';
import type { UserRole } from '@/types';

const VIEWS = [
  { role: 'ops_director' as UserRole, label: 'Operations Dashboard', description: 'Live zone risk monitoring and narrative review', icon: LayoutDashboard, href: '/dashboard' },
  { role: 'compliance_officer' as UserRole, label: 'Certification', description: 'Rubric checklist and audit submission', icon: ShieldCheck, href: '/certification' },
  { role: 'insurer' as UserRole, label: 'Benchmark Analytics', description: 'Cross-venue anonymized risk comparison', icon: BarChart3, href: '/benchmark' },
];

export default function SelectViewPage() {
  const router = useRouter();
  const handleSelect = (role: UserRole, href: string) => {
    localStorage.setItem('vri_role', role);
    router.push(href);
  };
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 480, width: '100%' }}>
        <h1 style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, color: 'var(--ink-primary)', marginBottom: 8 }}>Select a view</h1>
        <p style={{ textAlign: 'center', color: 'var(--ink-secondary)', fontSize: 14, marginBottom: 28 }}>Choose a perspective to explore Venue Risk Intelligence.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {VIEWS.map(({ role, label, description, icon: Icon, href }) => (
            <button
              key={role}
              id={`select-${role}`}
              className="card card-interactive"
              onClick={() => handleSelect(role, href)}
              style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 16, border: '1px solid var(--border-subtle)', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-signal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color="var(--accent-signal)" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-primary)' }}>{label}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-secondary)', marginTop: 2 }}>{description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
