"""
dashboard.py
------------
Live fleet monitoring dashboard (Streamlit). Shows robot positions, task
queue, live conflicts/deadlocks/failures, and mission performance — and lets
you inject robot failures / comm loss live to demonstrate resilience.

Run with:
    streamlit run dashboard.py
"""

import time

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from simulation import Simulation

st.set_page_config(page_title="Multi-Robot Fleet Dashboard", layout="wide")

STATE_COLORS = {
    "IDLE": "#9e9e9e",
    "MOVING": "#2196f3",
    "WORKING": "#4caf50",
    "CHARGING": "#ff9800",
    "FAILED": "#e53935",
}

# ---------------------------------------------------------------------------
# Session state setup
# ---------------------------------------------------------------------------
if "sim" not in st.session_state:
    st.session_state.sim = None
if "running" not in st.session_state:
    st.session_state.running = False

st.title("🤖 Multi-Robot Task Negotiation — Live Fleet Dashboard")
st.caption(
    "Decentralized task auction + collision/deadlock avoidance + battery-aware "
    "rerouting, running peer-to-peer with no single point of decision-making."
)

# ---------------------------------------------------------------------------
# Sidebar controls
# ---------------------------------------------------------------------------
with st.sidebar:
    st.header("Simulation Setup")

    n_robots = st.slider("Number of robots", 5, 500, 40, step=5)
    n_tasks = st.slider("Number of tasks", 5, 300, 25, step=5)
    world_size = st.slider("World size", 200, 3000, 500, step=100)

    if st.button("🔄 (Re)start Simulation", use_container_width=True):
        st.session_state.sim = Simulation(n_robots=n_robots, n_tasks=n_tasks, world_size=world_size)
        st.session_state.running = False

    st.divider()
    st.header("Playback")
    ticks_per_step = st.slider("Ticks per step", 1, 20, 3)

    col_a, col_b = st.columns(2)
    with col_a:
        if st.button("▶ Play", use_container_width=True):
            st.session_state.running = True
    with col_b:
        if st.button("⏸ Pause", use_container_width=True):
            st.session_state.running = False

    if st.button("⏭ Single Step", use_container_width=True):
        if st.session_state.sim:
            st.session_state.sim.run(ticks_per_step)

    st.divider()
    st.header("Failure Injection")
    st.caption("Demonstrates resilience without a central controller stepping in.")

    if st.button("💥 Inject Random Robot Failure", use_container_width=True):
        if st.session_state.sim:
            st.session_state.sim.inject_failure()

    if st.button("📡 Inject Comm Loss", use_container_width=True):
        if st.session_state.sim:
            st.session_state.sim.inject_comm_loss()

    if st.button("🔌 Toggle Central Controller Blackout", use_container_width=True):
        if st.session_state.sim:
            if st.session_state.sim.controller_online:
                st.session_state.sim.inject_controller_failure()
            else:
                st.session_state.sim.restore_controller()

    if st.button("✅ Restore All Systems", use_container_width=True):
        if st.session_state.sim:
            st.session_state.sim.restore_all()

# ---------------------------------------------------------------------------
# Main view
# ---------------------------------------------------------------------------
if st.session_state.sim is None:
    st.info("Configure the fleet in the sidebar and click **(Re)start Simulation** to begin.")
    st.stop()

sim = st.session_state.sim

if st.session_state.running:
    sim.run(ticks_per_step)

snap = sim.snapshot()

# Status alert for controller availability
if not snap.get("controller_online", True):
    st.error("⚠️ **CENTRAL CONTROLLER IS OFFLINE (BLACKOUT SIMULATION)**: The fleet is operating with 100% autonomy via peer-to-peer auction and distributed right-of-way consensus.")
else:
    st.success("🟢 **CENTRAL CONTROLLER ONLINE**: Normal monitoring mode active.")

# --- Metrics row ---
m = snap["metrics"]
metric_cols = st.columns(6)
metric_cols[0].metric("Tick", snap["tick"])
metric_cols[1].metric("Tasks Completed", m["tasks_completed"])
metric_cols[2].metric("Conflicts Resolved", m["conflicts_resolved"])
metric_cols[3].metric("Deadlocks Resolved", m["deadlocks_resolved"])
metric_cols[4].metric("Robots Failed", m["robots_failed"])
metric_cols[5].metric("Robots Charging", m["robots_charging"])

left, right = st.columns([2, 1])

with left:
    st.subheader("Fleet Map")
    robots_df = pd.DataFrame(snap["robots"])
    tasks_df = pd.DataFrame(snap["tasks"])
    stations_df = pd.DataFrame(snap["charging_stations"])

    fig = go.Figure()

    # Charging stations
    if not stations_df.empty:
        fig.add_trace(go.Scatter(
            x=stations_df["x"], y=stations_df["y"], mode="markers+text",
            marker=dict(symbol="square", size=14, color="#673ab7"),
            text=stations_df["id"], textposition="top center", name="Charging Station",
        ))

    # Open tasks
    if not tasks_df.empty:
        fig.add_trace(go.Scatter(
            x=tasks_df["x"], y=tasks_df["y"], mode="markers",
            marker=dict(symbol="diamond", size=9, color="#000000", opacity=0.35),
            name="Open Task", text=tasks_df["id"],
        ))

    # Robots, colored by state
    for state, color in STATE_COLORS.items():
        subset = robots_df[robots_df["state"] == state]
        if subset.empty:
            continue
        fig.add_trace(go.Scatter(
            x=subset["x"], y=subset["y"], mode="markers",
            marker=dict(size=10, color=color),
            name=state, text=subset["id"],
            hovertemplate="%{text}<br>battery: " + subset["battery"].round(0).astype(str) + "%",
        ))

    fig.update_layout(
        xaxis=dict(range=[0, sim.world_size], showgrid=False),
        yaxis=dict(range=[0, sim.world_size], showgrid=False, scaleanchor="x"),
        height=600, margin=dict(l=10, r=10, t=10, b=10),
        legend=dict(orientation="h", yanchor="bottom", y=1.02),
    )
    st.plotly_chart(fig, use_container_width=True)

with right:
    st.subheader("Event Log")
    log_text = "\n".join(reversed(snap["event_log"])) or "No events yet."
    st.text_area("Recent activity", log_text, height=560, label_visibility="collapsed")

st.subheader("Robot States")
if not robots_df.empty:
    state_counts = robots_df["state"].value_counts()
    st.bar_chart(state_counts)

# Auto-refresh loop while "running"
if st.session_state.running:
    time.sleep(0.4)
    st.rerun()
