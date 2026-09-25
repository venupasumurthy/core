# CORE — Coordination & Optimization for Robotic Execution

> A professional multi-robot fleet coordination platform built for autonomous swarm management, real-time task assignment, deadlock resolution, and Cisco-mesh AI communication.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/venupasumurthy/core)

---

## Overview

CORE is a next-generation robotic fleet coordination system that provides:

- **Mission Control** — Interactive zone canvas with drag-and-drop robot assignment
- **AI Inter-Robot Communication** — Autonomous multi-agent dialogue engine
- **Cisco Topology Network** — Real-time HaLow mesh visualization
- **Conflict & Deadlock Engine** — Tarjan WFG cycle detection with AI arbitration
- **Battery & Energy RTB** — Predictive recall-to-base with charge scheduling
- **Fault & Mesh Resilience** — P2P gossip fallback when central controller fails
- **500+ Swarm Benchmarks** — Scalable swarm simulation metrics

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Vanilla CSS (glassmorphism / Apple-inspired) |
| State | React useState / useEffect |
| Deployment | Vercel (static export) |

---

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout with cursor-reactive background
│   ├── globals.css             # Global styles — Apple glassmorphism design system
│   ├── page.tsx                # Landing / home page
│   ├── platform/
│   │   └── page.tsx            # Main CORE platform dashboard
│   └── dashboard/
│       └── page.tsx            # 500+ swarm benchmark view
├── components/
│   ├── layout/
│   │   └── Navbar.tsx          # Navigation bar
│   └── platform/
│       ├── ZoneCanvas.tsx      # Interactive drag-and-drop mission map
│       ├── FleetSidebar.tsx    # Robot fleet management panel
│       ├── FleetOverviewBar.tsx # KPI metric cards
│       ├── AICommunicationPanel.tsx  # AI inter-robot chat engine
│       ├── TopologyNetworkView.tsx   # Cisco network topology graph
│       ├── RoveraConflictsView.tsx   # Deadlock detection & resolution
│       ├── RoveraEnergyView.tsx      # Battery & RTB management
│       ├── RoveraResilienceView.tsx  # Fault injection & mesh resilience
│       ├── RoveraSwarmBenchmarkView.tsx # Swarm performance benchmarks
│       ├── CreateRobotModal.tsx      # Robot commissioning form
│       ├── ZoneFormModal.tsx         # Work zone creation form
│       ├── CoordinationPromptModal.tsx # Multi-robot coordination prompts
│       └── LowBatteryPromptModal.tsx   # Battery alert & dispatch
├── lib/
│   └── aiFleetAgent.ts         # Autonomous AI dialogue generator
├── types/
│   └── platform.ts             # TypeScript type definitions
├── vercel.json                 # Vercel deployment config
└── package.json
```

---

## Getting Started

```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view.

---

## Deploying to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repo
4. Set **Root Directory** → `frontend`
5. Click **Deploy**

No environment variables required — the app is fully client-side.

---

## Key Features

### 🗺️ Mission Control
- Draw work zones on an interactive canvas
- Drag robots from the sidebar and drop them onto zones
- Visual robot symbols with live battery/health status
- Deadlock injection and real-time resolution simulation

### 🤖 AI Communication
- Autonomous inter-robot message generation
- Cisco HaLow mesh topology visualization
- Real-time packet routing and relay node simulation

### ⚡ Deadlock Detection
- Tarjan's Wait-For-Graph cycle detection algorithm
- AI priority arbitration for lateral detour resolution
- Visual deadlock overlay on mission map

### 🔋 Battery Management
- Predictive low-battery alerts with RTB dispatch
- Charge pad alpha docking simulation
- Per-robot battery and health monitoring

---

## License

MIT — Free to use, modify, and deploy.
