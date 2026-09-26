# CORE — Decentralized Multi-Robot Coordination & Swarm Intelligence

<div align="center">
  
🌐 *Live Project:* [CORE - Coordination & Optimization for Robotic Execution](https://main.d1a3hk8x2zl4bw.amplifyapp.com/)  

[![Static Badge](https://img.shields.io/badge/Project-CORE-blue?style=flat-square&logo=github)](https://core-6gz5.onrender.com/)
[![Static Badge](https://img.shields.io/badge/Status-Active-success?style=flat-square)](https://core-6gz5.onrender.com/platform)
[![Static Badge](https://img.shields.io/badge/Version-1.2.0-orange?style=flat-square)](https://core-6gz5.onrender.com/platform)


**A high-density autonomous multi-agent coordination platform engineered for real-time warehouse logistics, dynamic task allocation, conflict-free path planning, and decentralized mesh resilience.**

[Key Pillars](#-recommended-technologies--algorithmic-pillars) •
[Mission Control](#-interactive-tactical-command-center) •
[Architecture](#-system-architecture) •
[Firebase Setup](#-firebase-firestore-cloud-backend) •
[REST APIs](#-rest-api-endpoints) •
[Team Profile](#-developed-by) •
[Quickstart](#-getting-started)

</div>

---

## 📌 Executive Summary

**CORE** (Coordination & Optimization for Robotic Execution) is an industrial-grade, decentralized multi-robot fleet coordination engine capable of orchestrating **500 to 1,000+ heterogeneous autonomous mobile robots (AMRs)** in dynamic, high-density environments. 

Traditional centralized warehouse execution systems suffer from single points of failure (SPOF), exponential latency bottlenecks as swarm density increases, and complete operational paralysis when central network communication drops. CORE eliminates these constraints by pairing **peer-to-peer Wi-Fi HaLow mesh networking** with advanced distributed decision algorithms:

- **Decentralized Operation**: Continues mission execution and conflict resolution even if the central supervisor completely fails.
- **Microsecond Conflict Resolution**: $O(N)$ spatial hashing paired with game-theoretic right-of-way yielding.
- **Failover Dual-Contracting**: Primary and secondary task contracts ensure automated reassignment upon agent degradation or fault injection.
- **Real-Time Cloud Synchronization**: Sub-50ms synchronization across operator terminals backed by **Firebase Firestore**.

---

## 🧠 Recommended Technologies & Algorithmic Pillars

CORE implements 6 computational and algorithmic paradigms to achieve decentralized autonomy at scale:

```
                               ┌─────────────────────────────────────────────────────────┐
                               │                 CORE ALGORITHMIC MATRIX                 │
                               └────────────────────────────┬────────────────────────────┘
               ┌───────────────────────────────┬────────────┴────────────────┬───────────────────────────────┐
               ▼                               ▼                             ▼                               ▼
     ┌───────────────────┐           ┌───────────────────┐         ┌───────────────────┐           ┌───────────────────┐
     │ Multi-Agent RL    │           │ Game Theory & RoW │         │ Consensus & P2P   │           │ Auction Bidding   │
     │ Decentralized Q   │           │ Nash Equilibrium  │         │ HaLow Quorum      │           │ Contract Net (CNP)│
     │ Speed/Detour Pol. │           │ 2x2 Payoff Matrix │         │ Gossip Fallback   │           │ Primary + Backup  │
     └───────────────────┘           └───────────────────┘         └───────────────────┘           └───────────────────┘
               │                                                                                             │
               └───────────────────────────────┬─────────────────────────────┬───────────────────────────────┘
                                               ▼                             ▼
                                     ┌───────────────────┐         ┌───────────────────┐
                                     │ Distributed Opt.  │         │ Conflict Search   │
                                     │ ADMM Energy Alloc │         │ Space-Time CBS    │
                                     │ Dual Decomp RTB   │         │ Tarjan WFG Cycles │
                                     └───────────────────┘         └───────────────────┘
```

### 1. Multi-Agent Reinforcement Learning (MARL)
* **Decentralized Policy Tuning**: Autonomous speed profile adaptation and spatial density-aware routing.
* **Reward Formulation**: Rewards prioritize task completion velocity while penalizing sudden deceleration, battery depletion curves, and proximity to spatial bottlenecks.
* **Observation Space**: Local sensor range ($r = 120\text{px}$), neighbor velocity vectors, and work zone queue lengths.

### 2. Game Theory & Right-of-Way Arbitration
* **Non-Zero-Sum Payoffs**: Resolves head-on conflicts in narrow single-lane warehouse corridors without centralized stop commands.
* **Payoff Matrix**:
  $$\begin{pmatrix} (\text{Yield}, \text{Yield}) & (\text{Yield}, \text{Proceed}) \\ (\text{Proceed}, \text{Yield}) & (\text{Proceed}, \text{Proceed}) \end{pmatrix} = \begin{pmatrix} (-1, -1) & (-1, +2) \\ (+2, -1) & (-10, -10) \end{pmatrix}$$
* **Nash Equilibrium Selection**: Robots negotiate right-of-way using dynamic utility scoring:
  $$U_i = \omega_1 \cdot \text{SOC}_i + \omega_2 \cdot \text{Priority}_i + \omega_3 \cdot \text{PayloadWeight}_i$$
  The agent with higher utility proceeds; the peer computes a lateral passing maneuver.

### 3. Distributed Consensus Algorithms
* **Leaderless Quorum**: In the event of central server isolation or network partitioning, localized robot clusters elect transient cluster heads using a lightweight Raft-inspired quorum protocol.
* **Anti-Entropy Epidemic Gossip**: Robots broadcast state digests and work order reservations over Wi-Fi HaLow (802.11ah) mesh hops with monotonic Lamport timestamps.
* **Central Controller Kill Resilience**: Full platform functionality remains operational when the central supervisor is severed, with peer-to-peer state propagation taking over automatically.

### 4. Auction-Based Allocation (Contract Net Protocol)
* **Risk-Aware Multi-Factor Bidding**: Open tasks in active zones trigger an autonomous bidding round where eligible AMRs compute bid scores:
  $$\text{Bid} = \alpha \cdot \text{Dist}(r, z) + \beta \cdot (100 - \text{Battery}) + \gamma \cdot \text{PayloadRisk} + \delta \cdot \text{Reputation}$$
* **Primary + Backup Dual Contracts**: Each mission award establishes a **Primary Winner** and a pre-designated **Secondary Escrow**. If telemetry from the primary robot misses 3 heartbeat intervals or battery dips below critical threshold, the backup robot seamlessly assumes the contract without latency spikes.

### 5. Distributed Optimization (ADMM & Dual Decomposition)
* **Alternating Direction Method of Multipliers**: Solves optimal power draw and charging bay allocation across 500+ robots under total warehouse power grid constraints:
  $$\min \sum_{i=1}^N f_i(x_i) \quad \text{subject to} \quad \sum_{i=1}^N x_i \le P_{\max}$$
* **Dual Decomposition Scheduling**: Robots individually calculate Return-To-Base (RTB) urgency based on remaining energy, discharge rate, and distance to induction bays, preventing depot queue starvation.

### 6. Conflict-Based Search (CBS) & Tarjan WFG Deadlock Resolution
* **Two-Level CBS**:
  - **High-Level Search**: Explores a Constraint Tree (CT) where conflict nodes mandate space-time constraints $(v, t)$ or edge constraints $(u, v, t)$.
  - **Low-Level Search**: Individual space-time $A^*$ generates minimal-cost collision-free trajectories respecting dynamic constraints.
* **Wait-For-Graph (WFG) Analysis**: Constructs a directed dependency graph $G = (V, E)$ of robots waiting on shared sector occupancy.
* **Tarjan's Strongly Connected Components (SCC)**: Detects circular dependency cycles in $O(|V| + |E|)$ time and triggers asymmetric lateral detours to resolve warehouse gridlocks in milliseconds.

---

## 🖥️ Interactive Tactical Command Center

CORE features an Apple visionOS-inspired dark glassmorphism dashboard organized into 6 mission-critical modules accessible at `/platform`:

| View | Focus Area | Key Metrics & Visualizations |
|---|---|---|
| **Mission Control & Zones** | Real-time Canvas Grid | Drag-and-drop zone boundaries, robot waypoints, payload tracking, live telemetry sidebar. |
| **Cisco Mesh & AI Comms** | Network Topology | 802.11ah packet routes, mesh hop latency, cognitive inter-robot natural language negotiation logs. |
| **Conflicts & Deadlocks** | Collision Arbitration | Active spatial conflicts, CBS constraint trees, Tarjan cycle diagnostics, lateral detour paths. |
| **Battery & Energy RTB** | Power Orchestration | Fleet battery status, ADMM power budgeting, predictive RTB triggers, charge pad queue slots. |
| **Faults & Resilience** | Chaos Engineering | Central controller kill switch, comms drop injection, degraded sensor state, quorum fallback status. |
| **500+ Swarm Benchmarks** | Scalability Engine | Real-time FPS, $O(N)$ spatial grid cell distribution, microsecond collision check latency counters. |

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT WORKSTATION (BROWSER)                           │
│                                                                                        │
│  ┌────────────────────────┐  ┌─────────────────────────┐  ┌────────────────────────┐  │
│  │  Tactical Mission UI   │  │    Cisco Mesh Graph     │  │   AI Comms & Bidding   │  │
│  │ (Canvas / Glassmorphic)│  │ (SVG Topology & Hops)   │  │ (Multi-Agent Dialogue) │  │
│  └───────────┬────────────┘  └────────────┬────────────┘  └───────────┬────────────┘  │
│              │                            │                           │               │
│              └────────────────────────────┼───────────────────────────┘               │
│                                           ▼                                           │
│                       ┌───────────────────────────────────────┐                       │
│                       │    Decentralized Simulation Engine    │                       │
│                       │  - Spatial Hashing Grid (O(N))        │                       │
│                       │  - Primary/Backup Contract Broker     │                       │
│                       │  - Tarjan WFG Cycle Resolver          │                       │
│                       │  - MARL / Nash Policy Exec            │                       │
│                       └───────────────────┬───────────────────┘                       │
└───────────────────────────────────────────┼────────────────────────────────────────────┘
                                            │ REST / Serverless Handlers
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               NEXT.JS SERVERLESS RUNTIME                               │
│                                                                                        │
│     /api/health            /api/robots            /api/zones            /api/sync      │
│  (DB Connection Test)   (Fleet CRUD & State)   (Work Zones CRUD)   (Bulk Swarm Sync)  │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Firebase Admin / Web SDK
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                            FIREBASE FIRESTORE CLOUD DATABASE                           │
│                                                                                        │
│   📁 `robots` collection          📁 `zones` collection         📁 `messages` stream   │
│   Live snapshot synchronization across multi-operator command desks with zero polling │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Repository File Tree

```
Hackfusion 2026/
├── app/
│   ├── api/                           # Backend Serverless Route Handlers
│   │   ├── health/route.ts            # Firebase connectivity & latency health check
│   │   ├── robots/route.ts            # Robot fleet CRUD & persistence API
│   │   ├── zones/route.ts             # Work zones management API
│   │   └── sync/route.ts              # Full fleet batch synchronizer
│   ├── dashboard/page.tsx             # Swarm mesh & benchmark analytics view
│   ├── platform/page.tsx              # Tactical Command Center (Primary Mission Control)
│   ├── layout.tsx                     # VisionOS glassmorphism layout & reactive cursor glow
│   ├── globals.css                    # Design tokens, gradients, and micro-animations
│   └── page.tsx                       # Landing page redirector
├── components/
│   ├── dashboard/MetricsBar.tsx       # Swarm KPI throughput & active robot status bar
│   └── platform/                      # Mission Control Subsystems
│       ├── ZoneCanvas.tsx             # Interactive mission grid & drag-and-drop assigner
│       ├── FleetSidebar.tsx           # Robot roster, commissioning & real-time telemetry
│       ├── FleetOverviewBar.tsx       # Fleet stats, active contracts & energy bar
│       ├── AICommunicationPanel.tsx   # Autonomous inter-agent negotiation logs
│       ├── TopologyNetworkView.tsx    # Cisco HaLow mesh graph & packet route visualizer
│       ├── RoveraConflictsView.tsx    # CBS conflict visualizer & Tarjan cycle resolver
│       ├── RoveraEnergyView.tsx       # Battery health, ADMM power curve & RTB scheduler
│       ├── RoveraResilienceView.tsx   # Fault injector & central controller kill switch
│       ├── RoveraSwarmBenchmarkView.tsx # 500+ AMR spatial hashing scalability benchmark
│       ├── CreateRobotModal.tsx       # Robot provisioning & payload setup modal
│       ├── ZoneFormModal.tsx          # Work zone configuration modal
│       ├── CoordinationPromptModal.tsx# Inter-robot arbitration dialogue modal
│       └── LowBatteryPromptModal.tsx  # Low-power emergency RTB modal
├── hooks/
│   └── useSimulation.ts               # React hook binding SimulationEngine to UI state
├── lib/
│   ├── firebaseClient.ts              # Firebase Firestore Web Client initialization
│   ├── firebaseBackend.ts             # Firestore server-side queries, batch ops & health
│   ├── aiFleetAgent.ts                # Autonomous dialogue generator & contract broker
│   └── simulation/
│       └── SimulationEngine.ts        # 500-1000+ AMR high-throughput physics & logic engine
├── types/
│   ├── platform.ts                    # Mission control domain interfaces
│   └── simulation.ts                  # Swarm, robot, collision & contract type definitions
├── firestore.rules                    # Production security rules for Firebase Firestore
├── vercel.json                        # Vercel deployment configuration
├── package.json                       # Dependencies (Next.js 16, TypeScript, Firebase)
└── README.md                          # Platform documentation & technical specification
```

## 🧑‍💻 Developed By

### Ensemble 4
> Empowering autonomous robotics and swarm intelligence through innovation and collaboration.

| Name | Role | Profile |
|---|---|---|
| **Venu Munendra Kumar Pasumurthy** | Team Lead & ML Developer | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/venupasumurthy) |
| **Sai Charan Pasupuleti** | AI Developer | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/saicharanpasupuleti) |
| **Chandana Palamanda** | Full-Stack Developer | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/chandana-palamanda-a16675360) |
| **Aishwarya Natesan** | Full-Stack Developer | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](http://www.linkedin.com/in/aishwarya-natesan-bb48a1360) |

---

📬 **Team Contact**:
- `venupasumurthy0509@gmail.com`
- `psai73873@gmail.com`
- `chandanapalamanda13@gmail.com`
- `natesanaishwarya@gmail.com`

---

Open [https://core-6gz5.onrender.com/](https://core-6gz5.onrender.com/platform) in your browser to launch the Tactical Command Center.

## 📄 License

This project is licensed under the **MIT License** — free for academic, commercial, and open-source multi-agent robotics research.
