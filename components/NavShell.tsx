'use client';
// components/NavShell.tsx
// Persistent navigation shell — left sidebar on desktop, bottom bar on mobile.
// All three nav items visible to every role for demo purposes (appflow.md §7).

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ShieldCheck, BarChart3, LogOut, Activity } from 'lucide-react';
import type { UserRole } from '@/types';

interface NavShellProps {
  children: React.ReactNode;
  role?: UserRole;
  displayName?: string;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, id: 'nav-dashboard' },
  { href: '/certification', label: 'Certification', icon: ShieldCheck, id: 'nav-certification' },
  { href: '/benchmark', label: 'Benchmark', icon: BarChart3, id: 'nav-benchmark' },
];

const ROLE_LABELS: Record<UserRole, string> = {
  ops_director: 'Ops Director',
  compliance_officer: 'Compliance',
  insurer: 'Insurer',
  admin: 'Admin',
};

export default function NavShell({ children, role, displayName }: NavShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('vri_role');
    localStorage.removeItem('vri_user');
    router.push('/login');
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg-base)',
      }}
    >
      {/* ── Left sidebar (desktop) ──────────────────────────────────────────── */}
      <nav
        aria-label="Main navigation"
        style={{
          width: 220,
          flexShrink: 0,
          background: 'var(--bg-panel)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 12px',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 50,
          boxShadow: 'var(--shadow-sm)',
        }}
        className="hidden-mobile"
      >
        {/* Logo */}
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 32,
            textDecoration: 'none',
            padding: '0 4px',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 7,
              background: 'var(--accent-signal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0,
            }}
          >
            <Activity size={16} strokeWidth={2.5} />
          </div>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--ink-primary)',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
              }}
            >
              Venue Risk
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--ink-tertiary)',
                fontWeight: 500,
              }}
            >
              Intelligence
            </div>
          </div>
        </Link>

        {/* Nav items */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV_ITEMS.map(({ href, label, icon: Icon, id }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                id={id}
                href={href}
                className={`nav-link${isActive ? ' active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* User info + logout */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 16,
            marginTop: 16,
          }}
        >
          {displayName && (
            <div style={{ padding: '4px 14px', marginBottom: 8 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--ink-primary)',
                  marginBottom: 2,
                }}
              >
                {displayName}
              </div>
              {role && (
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 500,
                  }}
                >
                  {ROLE_LABELS[role]}
                </div>
              )}
            </div>
          )}
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="nav-link"
            style={{ width: '100%', border: 'none', cursor: 'pointer', background: 'none' }}
            aria-label="Sign out"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </nav>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          marginLeft: 220,
          minHeight: '100vh',
          overflow: 'auto',
        }}
        className="main-content"
      >
        {children}
      </main>

      {/* ── Bottom nav (mobile) ────────────────────────────────────────────── */}
      <nav
        aria-label="Mobile navigation"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg-panel)',
          borderTop: '1px solid var(--border-subtle)',
          padding: '8px 0',
          zIndex: 50,
        }}
        className="mobile-nav"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon, id }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              id={`mobile-${id}`}
              href={href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                color: isActive ? 'var(--accent-signal)' : 'var(--ink-secondary)',
                textDecoration: 'none',
                fontSize: 11,
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .mobile-nav { display: flex !important; }
          .main-content { margin-left: 0 !important; padding-bottom: 72px; }
        }
      `}</style>
    </div>
  );
}
