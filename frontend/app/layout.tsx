import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'HackFusion 2026 — Multi-Robot Task Negotiation Engine',
  description:
    'Decentralized coordination for 500+ autonomous robots. ' +
    'ML-powered peer-to-peer task auction, collision avoidance, deadlock recovery.',
  keywords: ['robotics', 'multi-agent', 'HackFusion 2026', 'IEEE RAS', 'decentralized'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}
