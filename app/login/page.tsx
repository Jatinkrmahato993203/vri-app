'use client';
// app/login/page.tsx
// Mock auth login — selects role, stores in localStorage.
// In production this would use Firebase Auth with email/password.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/types';

const ROLES: Array<{ role: UserRole; label: string; description: string; landing: string }> = [
  {
    role: 'ops_director',
    label: 'Ops Director',
    description: 'Live risk dashboard — zone-by-zone signal monitoring and narrative review.',
    landing: '/dashboard',
  },
  {
    role: 'compliance_officer',
    label: 'Compliance Officer',
    description: 'Certification readiness rubric, audit submission, and safety credential status.',
    landing: '/certification',
  },
  {
    role: 'insurer',
    label: 'Insurer / Risk Manager',
    description: 'Cross-venue benchmark comparison and anonymized peer risk analytics.',
    landing: '/benchmark',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!selected) return;
    setLoading(true);
    localStorage.setItem('vri_role', selected);
    const role = ROLES.find((r) => r.role === selected);
    router.push(role?.landing ?? '/select-view');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Logo / Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--accent-signal)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              V
            </div>
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--ink-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              Venue Risk Intelligence
            </span>
          </div>
          <p style={{ color: 'var(--ink-secondary)', fontSize: 14, margin: 0 }}>
            Real-time multi-hazard risk observability for large venues
          </p>
        </div>

        {/* Role selector card */}
        <div
          className="card"
          style={{ padding: 32 }}
        >
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--ink-primary)',
              marginBottom: 8,
              marginTop: 0,
            }}
          >
            Sign in
          </h1>
          <p
            style={{
              color: 'var(--ink-secondary)',
              fontSize: 13,
              marginBottom: 24,
              marginTop: 0,
            }}
          >
            Select your role to access your personalized view.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {ROLES.map(({ role, label, description }) => (
              <button
                key={role}
                id={`role-${role}`}
                onClick={() => setSelected(role)}
                aria-pressed={selected === role}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '14px 16px',
                  border: `2px solid ${selected === role ? 'var(--accent-signal)' : 'var(--border-subtle)'}`,
                  borderRadius: 10,
                  background: selected === role ? 'var(--accent-signal-light)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 150ms ease',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: selected === role ? 'var(--accent-signal)' : 'var(--ink-primary)',
                    marginBottom: 2,
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {description}
                </span>
              </button>
            ))}
          </div>

          <button
            id="login-btn"
            className="btn-primary"
            onClick={handleLogin}
            disabled={!selected || loading}
            style={{
              width: '100%',
              opacity: !selected || loading ? 0.5 : 1,
              cursor: !selected || loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </div>

        <p
          style={{
            textAlign: 'center',
            color: 'var(--ink-tertiary)',
            fontSize: 12,
            marginTop: 20,
          }}
        >
          Demo mode — no real credentials required
        </p>
      </div>
    </div>
  );
}
