'use client';
// app/page.tsx — root redirect based on stored role
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check stored role from mock auth
    const role = typeof window !== 'undefined' ? localStorage.getItem('vri_role') : null;
    if (!role) {
      router.replace('/login');
    } else if (role === 'ops_director') {
      router.replace('/dashboard');
    } else if (role === 'compliance_officer') {
      router.replace('/certification');
    } else if (role === 'insurer') {
      router.replace('/benchmark');
    } else {
      router.replace('/select-view');
    }
  }, [router]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-base)',
      }}
    >
      <div
        style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--accent-signal)', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
