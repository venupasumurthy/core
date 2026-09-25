import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'CORE | Coordination & Optimization for Robotic Execution',
  description:
    'Decentralized coordination for 500+ autonomous mobile robots and interactive zone assignment platform. ' +
    'Peer-to-peer task auction, collision avoidance, deadlock recovery, and multi-robot coordination.',
  keywords: ['robotics', 'multi-agent', 'CORE', 'decentralized', 'fleet-coordination', 'autonomous-systems'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {/* Cursor-reactive glow tracker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                document.addEventListener('mousemove', function(e) {
                  document.documentElement.style.setProperty('--cursor-x', e.clientX + 'px');
                  document.documentElement.style.setProperty('--cursor-y', e.clientY + 'px');
                }, { passive: true });
              })();
            `,
          }}
        />
        <main>{children}</main>
      </body>
    </html>
  );
}
