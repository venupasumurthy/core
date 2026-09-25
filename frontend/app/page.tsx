import Link from 'next/link';

const FEATURES = [
  {
    icon: '🤖', color: '#6366f1',
    title: 'ML-Powered Task Auction',
    desc: 'Contract Net auction scored by a trained scikit-learn classifier (ROC-AUC 0.78). ' +
          'Features: distance, battery, workload, capacity, priority. ' +
          'Any robot computes the identical winner list from shared state.',
  },
  {
    icon: '🤝', color: '#a855f7',
    title: 'Peer-to-Peer Negotiation',
    desc: 'plan_assignments() is a pure deterministic function. ' +
          'Verified: calling it 3\u00d7 independently yields identical results. ' +
          'No auctioneer process or shared lock required.',
  },
  {
    icon: '⚡', color: '#06b6d4',
    title: 'Collision Avoidance',
    desc: 'Vectorised NumPy O(n\u00b2) pairwise distance matrix each tick. ' +
          'Right-of-way by task priority + robot ID. ' +
          'Both robots compute the same winner \u2014 no overhead negotiation.',
  },
  {
    icon: '🔒', color: '#f59e0b',
    title: 'Deadlock Detection',
    desc: 'Wait-for graph built from yield links each tick. ' +
          'DFS cycle detection. Robots stuck \u22653 consecutive ticks trigger ' +
          'a priority override that breaks the circular wait.',
  },
  {
    icon: '🔋', color: '#10b981',
    title: 'Battery-Aware Routing',
    desc: 'Low-battery robots autonomously abandon tasks and route to ' +
          'the nearest of 4 corner charging stations \u2014 zero central authority needed.',
  },
  {
    icon: '💥', color: '#e53935',
    title: 'Fault Injection & Recovery',
    desc: 'Kill any robot or cut its comms live. Abandoned tasks are ' +
          'immediately re-auctioned. The fleet keeps operating with ' +
          'no manual intervention.',
  },
];

const STATS = [
  { value: '500+',  label: 'Robots Supported',      icon: '🤖' },
  { value: '<50ms', label: 'Per-Tick Average',       icon: '⚡' },
  { value: '0.78',  label: 'ML ROC-AUC',             icon: '🧠' },
  { value: '0',     label: 'Central Controllers',    icon: '🌐' },
];

const STEPS = [
  { n: '1', c: '#ff9800', label: 'Battery Check',
    desc: 'Depleted robots abandon tasks and autonomously route to nearest charger.' },
  { n: '2', c: '#6366f1', label: 'Auction Round',
    desc: 'ML-scored bids from all idle robots. plan_assignments() is pure and reproducible.' },
  { n: '3', c: '#06b6d4', label: 'Collision Detection',
    desc: 'NumPy vectorised O(n²) distance check. Loser of right-of-way holds 1 tick.' },
  { n: '4', c: '#a855f7', label: 'Deadlock Recovery',
    desc: 'DFS on wait-for graph. Stuck ≥3 ticks → priority override breaks cycle.' },
  { n: '5', c: '#10b981', label: 'State Advance',
    desc: 'Each robot independently moves, works, or charges. Done tasks return to pool.' },
];

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="animated-bg" style={{
        minHeight: '88vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px', position: 'relative', textAlign: 'center', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '12%', left: '8%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.10) 0%,transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '8%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.08) 0%,transparent 70%)', pointerEvents: 'none' }} />

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 100, padding: '6px 18px', marginBottom: 36 }}>
          <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#38bdf8', display: 'inline-block' }} />
          <span style={{ fontSize: 13, color: '#38bdf8', fontWeight: 700 }}>CORE · Coordination & Optimization for Robotic Execution</span>
        </div>

        <h1 style={{ fontSize: 'clamp(36px,7vw,78px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 28, maxWidth: 920 }}>
          <span className="gradient-text">CORE Decentralized Fleet Engine</span><br />
          <span style={{ color: '#e2e8f0' }}>for 500+ Autonomous Mobile Robots</span>
        </h1>

        <p style={{ fontSize: 'clamp(14px,1.8vw,19px)', color: '#94a3b8', maxWidth: 660, lineHeight: 1.8, marginBottom: 52 }}>
          Decentralized Contract Net task allocation, spatial conflict prediction & detour routes,
          Wait-For Graph deadlock recovery, and multi-robot zone assignment coordination —
          all operating with zero central single-point-of-failure.
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/platform" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ padding: '14px 34px', fontSize: 15, borderRadius: 12, width: 'auto', background: 'linear-gradient(135deg,#06b6d4,#3b82f6)' }}>
              Launch Tactical Command Center
            </button>
          </Link>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <button className="btn" style={{ padding: '14px 34px', fontSize: 15, borderRadius: 12, width: 'auto', background: 'rgba(56,189,248,0.15)', border: '1px solid #38bdf8', color: '#bae6fd' }}>
              500+ AMR Mesh Engine
            </button>
          </Link>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ padding: '56px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, textAlign: 'center' }}>
          {STATS.map(({ value, label, icon }) => (
            <div key={label}>
              <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
              <div style={{ fontSize: 'clamp(28px,4vw,46px)', fontWeight: 800, color: '#6366f1', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginTop: 8, fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(24px,4vw,40px)', fontWeight: 700, marginBottom: 14 }}>
            <span className="gradient-text">Every Deliverable Covered</span>
          </h2>
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 15, maxWidth: 580, margin: '0 auto 56px', lineHeight: 1.7 }}>
            Six core capabilities, all running peer-to-peer with zero central authority.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20 }}>
            {FEATURES.map(({ icon, title, desc, color }) => (
              <div key={title} className="glass feature-card" style={{ padding: 28 }}>
                <div style={{ width: 50, height: 50, borderRadius: 14, background: color + '1a', border: '1px solid ' + color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }}>
                  {icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.75 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(24px,4vw,40px)', fontWeight: 700, marginBottom: 14 }}>
            How It Works
          </h2>
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 15, maxWidth: 560, margin: '0 auto 48px', lineHeight: 1.7 }}>
            Five deterministic stages per tick. Any robot can compute them independently.
          </p>
          <div className="glass" style={{ padding: '36px 32px' }}>
            {STEPS.map(({ n, c, label, desc }, i) => (
              <div key={n} style={{
                display: 'flex', gap: 20, alignItems: 'flex-start',
                paddingBottom: i < STEPS.length - 1 ? 28 : 0,
                marginBottom:  i < STEPS.length - 1 ? 28 : 0,
                borderBottom:  i < STEPS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: c + '20', border: '2px solid ' + c + '60', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: c }}>
                  {n}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#e2e8f0', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.75 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div className="glass glow" style={{ maxWidth: 680, margin: '0 auto', padding: '60px 40px' }}>
          <h2 style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 700, marginBottom: 16 }}>
            Ready to see it live?
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 36, lineHeight: 1.75 }}>
            Watch 500 robots negotiate tasks, dodge each other, recover from deadlocks,
            and self-route for charging — in real-time in your browser.
          </p>
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ padding: '15px 44px', fontSize: 16, borderRadius: 14, width: 'auto' }}>
              Open Live Dashboard
            </button>
          </Link>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '28px 24px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
        <div style={{ marginBottom: 6 }}>CORE · Coordination & Optimization for Robotic Execution</div>
        <div>FastAPI + Next.js · Decentralized by design</div>
      </footer>
    </div>
  );
}
