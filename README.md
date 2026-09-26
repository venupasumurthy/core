# CORE — Coordination & Optimization for Robotic Execution

> A multi-robot fleet coordination platform built for autonomous swarm management, real-time task assignment, deadlock resolution, Cisco-mesh AI communication, and Supabase cloud backend synchronization.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/venupasumurthy/core)

---

## Overview

CORE is a next-generation robotic fleet coordination system that provides:

- **Mission Control** — Interactive zone canvas with drag-and-drop robot assignment
- **Supabase Cloud Backend** — Real-time PostgreSQL database with live cross-device synchronisation
- **Autonomous AI Inter-Robot Communication** — Cognitive multi-agent dialogue & negotiation engine
- **Cisco Topology Network** — Real-time HaLow mesh graph and packet routing simulation
- **Conflict & Deadlock Engine** — Tarjan WFG cycle detection with AI arbitration & lateral detours
- **Battery & Energy RTB** — Predictive recall-to-base with alpha charge pad scheduling
- **Fault & Mesh Resilience** — P2P gossip fallback when central controller drops
- **500+ Swarm Benchmarks** — Scalable swarm simulation metrics

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Vanilla CSS (Apple visionOS / macOS glassmorphism) |
| Cloud Database | Supabase (PostgreSQL + Realtime WebSocket) |
| Server API | Next.js Serverless Route Handlers (`/api/health`, `/api/robots`, `/api/zones`, `/api/sync`) |
| Deployment | Vercel |

---

## 🗄️ Supabase Backend Setup

CORE is connected to Supabase for live multi-operator fleet synchronisation and state persistence.

### 1. Database Schema
Execute [`supabase_schema.sql`](supabase_schema.sql) in your [Supabase SQL Editor](https://supabase.com/dashboard/project/izpaaeynqhvurjtzfaxk/sql/new). It creates:
- `robots` — Fleet state, coordinates, battery, health, payload, and assignments
- `zones` — Work zone coordinates, dimensions, tasks, difficulties, and resource levels
- `messages` — Inter-robot autonomous communications and telemetry
- `coordination_alerts` — Inter-zone dependency and transport coordination alerts
- **RLS Policies** — Full anonymous read/write access for fleet operations
- **Realtime Publications** — Live WebSocket broadcast for instant cross-device updates
- **Initial Seed Data** — Pre-configured seed robots and work sectors

### 2. Environment Variables
Add to `frontend/.env.local` (and in your Vercel Project Settings):
```env
NEXT_PUBLIC_SUPABASE_URL=https://izpaaeynqhvurjtzfaxk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable__vWU2_GoPlyZO3GtDJg0aQ_FUHdUOyt
```

---

## 📡 REST API Endpoints

CORE includes built-in backend API routes running on Next.js:

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Health check, Supabase connectivity, latency, and table status |
| `/api/robots` | `GET` | List all robots from Supabase |
| `/api/robots` | `POST` | Upsert (create or update) a robot in the cloud database |
| `/api/robots?id=R0001` | `DELETE` | Decommission / delete a robot from Supabase |
| `/api/zones` | `GET` | List all work zones from Supabase |
| `/api/zones` | `POST` | Upsert (create or update) a work zone in the cloud database |
| `/api/zones?id=Z0001` | `DELETE` | Delete a work zone from Supabase |
| `/api/sync` | `POST` | Bulk push complete fleet and zone state to Supabase |

---

## Project Structure

```
Hackfusion 2026/
├── supabase_schema.sql         # Supabase PostgreSQL schema & seed migration
├── README.md                   # Documentation & API specifications
└── frontend/
    ├── app/
    │   ├── api/                # Backend API Routes
    │   │   ├── health/route.ts # Health check & Supabase connection test
    │   │   ├── robots/route.ts # Robots CRUD API
    │   │   ├── zones/route.ts  # Zones CRUD API
    │   │   └── sync/route.ts   # Bulk fleet sync API
    │   ├── layout.tsx          # Root layout with cursor-reactive dynamic glow
    │   ├── globals.css         # Apple-inspired glassmorphism design system
    │   ├── page.tsx            # Landing page
    │   ├── platform/
    │   │   └── page.tsx        # Tactical Command Center with Supabase Realtime
    │   └── dashboard/
    │       └── page.tsx        # 500+ AMR Mesh Engine view
    ├── components/
    │   └── platform/           # Mission Control & Swarm Modules
    │       ├── ZoneCanvas.tsx              # Interactive drag-and-drop mission grid
    │       ├── FleetSidebar.tsx            # Fleet list & robot deployment
    │       ├── FleetOverviewBar.tsx        # KPI metrics & quick stats
    │       ├── AICommunicationPanel.tsx    # Autonomous inter-robot dialogue
    │       ├── TopologyNetworkView.tsx     # Cisco HaLow mesh network topology
    │       ├── RoveraConflictsView.tsx     # Spatial conflict prediction & detours
    │       ├── RoveraEnergyView.tsx        # Battery management & RTB scheduling
    │       ├── RoveraResilienceView.tsx    # Mesh fault injection & recovery
    │       ├── RoveraSwarmBenchmarkView.tsx# Swarm performance benchmarks
    │       ├── CreateRobotModal.tsx        # Robot commissioning modal
    │       ├── ZoneFormModal.tsx           # Work zone configuration modal
    │       ├── CoordinationPromptModal.tsx # Multi-robot arbitration modal
    │       └── LowBatteryPromptModal.tsx   # Battery alert & RTB modal
    ├── lib/
    │   ├── supabaseClient.ts   # Supabase JS client configuration
    │   ├── supabaseBackend.ts  # Supabase CRUD, health checks & Realtime sync
    │   └── aiFleetAgent.ts     # Autonomous dialogue & negotiation logic
    ├── types/
    │   ├── platform.ts         # Mission control TypeScript definitions
    │   └── simulation.ts       # Swarm simulation TypeScript definitions
    ├── supabase_schema.sql     # Database schema copy
    ├── vercel.json             # Vercel deployment configuration
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

# Run linting
npm run lint

# Build for production
npm run build
```

Open [http://localhost:3000/platform](http://localhost:3000/platform) to view the Mission Control command center.

---

## Deploying to Vercel

1. Push this repository to GitHub: `git push origin main`
2. Go to [vercel.com/new](https://vercel.com/new)
3. Select your repository
4. Set **Root Directory** to `frontend`
5. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://izpaaeynqhvurjtzfaxk.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable__vWU2_GoPlyZO3GtDJg0aQ_FUHdUOyt`
6. Click **Deploy**

---

## 🧑‍💻 Developed By

###  Ensemble 4
> Empowering smart education through innovation and collaboration.

| Name | Role | LinkedIn |
|------|------|-----------|
| Venu Munendra Kumar Pasumurthy | Team Lead , ML Developer | [LinkedIn](https://www.linkedin.com/in/venupasumurthy) |
| Sai Charan Pasupuleti | AI Developer | [LinkedIn](https://www.linkedin.com/in/saicharanpasupuleti) |
| Chandana Palamanda | Developer | [LinkedIn](https://www.linkedin.com/in/chandana-palamanda-a16675360) |
| Aishwarya Natesan | Developer | [LinkedIn](http://www.linkedin.com/in/aishwarya-natesan-bb48a1360) |
---
📧 Contact:
- chandanapalamanda13@gmail.com
- venupasumurthy0509@gmail.com
- natesanaishwarya@gmail.com
- psai73873@gmail.com

## License

MIT — Free to use, modify, and deploy.
