'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/',          label: 'Home' },
  { href: '/platform',  label: '📍 Zone Coordination' },
  { href: '/dashboard', label: '⚡ 500+ Mesh Engine' },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(10,10,15,0.82)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      <div style={{
        maxWidth: 1400, margin: '0 auto', padding: '0 24px',
        display: 'flex', alignItems: 'center', height: 60, justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg,#6366f1,#a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: 'white', fontWeight: 800,
          }}>R</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2 }}>
              Multi-Robot Engine
            </div>
            <div style={{ fontSize: 9, color: '#6366f1', fontWeight: 700, letterSpacing: 1 }}>
              HACKFUSION 2026
            </div>
          </div>
        </Link>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {LINKS.map(({ href, label }) => (
            <Link key={href} href={href} style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              textDecoration: 'none',
              color:      path === href ? '#818cf8' : '#94a3b8',
              background: path === href ? 'rgba(99,102,241,0.12)' : 'transparent',
              transition: 'all 0.2s',
            }}>{label}</Link>
          ))}
          <a
            href="https://github.com" target="_blank" rel="noopener noreferrer"
            style={{
              marginLeft: 8, padding: '6px 16px', borderRadius: 8,
              fontSize: 13, fontWeight: 600, textDecoration: 'none', color: 'white',
              background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
            }}
          >GitHub</a>
        </div>
      </div>
    </nav>
  );
}
