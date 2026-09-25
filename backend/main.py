import asyncio
import sys
import threading
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

SIM_PATH = (
    Path(__file__).parent.parent
    / "HackFusion2026_MultiRobotEngine"
    / "HackFusion2026_MultiRobotEngine"
)
sys.path.insert(0, str(SIM_PATH))

from simulation import Simulation  # noqa: E402

app = FastAPI(
    title="HackFusion 2026 - Multi-Robot Engine API",
    description="Decentralized multi-robot task negotiation engine",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sim_instance = None
sim_running = False
sim_lock = threading.Lock()


def _get_snap():
    if sim_instance is None:
        return {"error": "No simulation initialised - POST /api/simulation/start first"}
    snap = sim_instance.snapshot()
    snap["running"] = sim_running
    return snap


@app.get("/api/health")
def health():
    return {"status": "ok", "sim_active": sim_instance is not None, "running": sim_running}


@app.post("/api/simulation/start")
def start_simulation(n_robots: int = 40, n_tasks: int = 25, world_size: float = 500.0):
    global sim_instance, sim_running
    with sim_lock:
        sim_instance = Simulation(n_robots=n_robots, n_tasks=n_tasks, world_size=world_size)
        sim_running = False
    return {"status": "created", "n_robots": n_robots, "n_tasks": n_tasks}


@app.post("/api/simulation/pause")
def pause():
    global sim_running
    sim_running = False
    return {"status": "paused"}


@app.post("/api/simulation/resume")
def resume():
    global sim_running
    if sim_instance is None:
        return {"error": "No simulation"}
    sim_running = True
    return {"status": "running"}


@app.post("/api/simulation/step")
def step(ticks: int = 3):
    if sim_instance is None:
        return {"error": "No simulation"}
    with sim_lock:
        sim_instance.run(ticks)
    return _get_snap()


@app.post("/api/simulation/reset")
def reset(n_robots: int = 40, n_tasks: int = 25, world_size: float = 500.0):
    global sim_instance, sim_running
    with sim_lock:
        sim_running = False
        sim_instance = Simulation(n_robots=n_robots, n_tasks=n_tasks, world_size=world_size)
    return {"status": "reset"}


@app.get("/api/simulation/snapshot")
def snapshot():
    return _get_snap()


@app.post("/api/simulation/inject/failure")
def inject_failure():
    if sim_instance is None:
        return {"error": "No simulation"}
    with sim_lock:
        sim_instance.inject_failure()
    return {"status": "failure_injected"}


@app.post("/api/simulation/inject/comm-loss")
def inject_comm_loss():
    if sim_instance is None:
        return {"error": "No simulation"}
    with sim_lock:
        sim_instance.inject_comm_loss()
    return {"status": "comm_loss_injected"}


@app.post("/api/simulation/inject/controller-blackout")
def inject_controller_blackout():
    if sim_instance is None:
        return {"error": "No simulation"}
    with sim_lock:
        sim_instance.inject_controller_failure()
    return {"status": "controller_blackout_injected"}


@app.post("/api/simulation/restore")
def restore():
    if sim_instance is None:
        return {"error": "No simulation"}
    with sim_lock:
        sim_instance.restore_all()
    return {"status": "restored"}


class ConnectionManager:
    def __init__(self):
        self.active = []

    async def connect(self, ws):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws):
        if ws in self.active:
            self.active.remove(ws)


manager = ConnectionManager()


@app.websocket("/ws/simulation")
async def websocket_endpoint(websocket: WebSocket):
    global sim_instance, sim_running
    await manager.connect(websocket)
    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_json(), timeout=0.05)
                action = data.get("action", "")
                if action == "reset":
                    n_robots = int(data.get("n_robots", 40))
                    n_tasks = int(data.get("n_tasks", 25))
                    world_size = float(data.get("world_size", 500.0))
                    with sim_lock:
                        sim_running = False
                        sim_instance = Simulation(n_robots=n_robots, n_tasks=n_tasks, world_size=world_size)
                elif action == "resume":
                    sim_running = True
                elif action == "pause":
                    sim_running = False
                elif action == "step" and sim_instance:
                    ticks = int(data.get("ticks", 3))
                    with sim_lock:
                        sim_instance.run(ticks)
                elif action == "inject_failure" and sim_instance:
                    with sim_lock:
                        sim_instance.inject_failure()
                elif action == "inject_comm_loss" and sim_instance:
                    with sim_lock:
                        sim_instance.inject_comm_loss()
                elif action == "inject_controller_failure" and sim_instance:
                    with sim_lock:
                        sim_instance.inject_controller_failure()
                elif action == "restore_controller" and sim_instance:
                    with sim_lock:
                        sim_instance.restore_controller()
                elif action == "toggle_controller" and sim_instance:
                    with sim_lock:
                        if sim_instance.controller_online:
                            sim_instance.inject_controller_failure()
                        else:
                            sim_instance.restore_controller()
                elif action == "restore_all" and sim_instance:
                    with sim_lock:
                        sim_instance.restore_all()
            except asyncio.TimeoutError:
                pass
            except Exception:
                pass

            if sim_instance is not None:
                if sim_running:
                    with sim_lock:
                        sim_instance.run(3)
                snap = _get_snap()
                try:
                    await websocket.send_json(snap)
                except Exception:
                    break  # client disconnected mid-send

            await asyncio.sleep(0.4)
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket)
