'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/',          label: 'Home' },
  { href: '/platform',  label: 'Zone Coordination' },
  { href: '/dashboard', label: '500+ Mesh Engine' },
];

export default function Navbar() {
  const path = usePathname();
  return (
    <nav style={{
      background: 'rgba(8,10,16,0.78)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        maxWidth: 1400, margin: '0 auto', padding: '0 24px',
        display: 'flex', alignItems: 'center', height: 44, justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {LINKS.map(({ href, label }) => {
            const isActive = path === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  padding: '7px 20px',
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  textDecoration: 'none',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  background: isActive
                    ? 'linear-gradient(180deg, rgba(56, 189, 248, 0.35) 0%, rgba(37, 99, 235, 0.25) 100%)'
                    : 'transparent',
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.65)' : '1px solid transparent',
                  boxShadow: isActive
                    ? 'inset 0 1px 1.5px rgba(255, 255, 255, 0.5), 0 4px 14px rgba(56, 189, 248, 0.3)'
                    : 'none',
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

