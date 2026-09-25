"""
simulation.py
-------------
Ties robot, environment, negotiation, collision, deadlock, and failure
modules together into a single tick-based simulation. This file has no
"central decision-maker" logic of its own — it only calls each robot's own
local behavior (movement, charging) and the shared, recomputable protocols
(auction, collision rule, deadlock rule). Removing this loop and running it
from any other process would produce the same results, since every decision
is a deterministic function of the current shared state, not of this loop's
internal memory.
"""

import time
from pathlib import Path
from typing import List

import joblib

from environment import Task, ChargingStation, make_random_tasks, make_charging_stations, nearest_station
from robot import Robot, RobotState, make_random_robots
from negotiation import run_auction
from collision import detect_and_resolve, apply_yield
from deadlock import detect_and_recover
import failure_injection as fi

MODEL_PATH = Path(__file__).parent / "model" / "robot_task_model.pkl"


class Simulation:
    def __init__(self, n_robots: int = 50, n_tasks: int = 40, world_size: float = 500.0, seed: int = 42):
        self.world_size = world_size
        self.tick = 0
        self.robots: List[Robot] = make_random_robots(n_robots, world_size, seed=seed)
        self.tasks: List[Task] = make_random_tasks(n_tasks, world_size, start_id=0, seed=seed)
        self.charging_stations: List[ChargingStation] = make_charging_stations(world_size)
        self._task_id_counter = n_tasks
        self.controller_online: bool = True

        bundle = joblib.load(MODEL_PATH)
        self.model = bundle["model"]

        self.event_log: List[str] = []
        self.metrics = {
            "tasks_completed": 0,
            "conflicts_resolved": 0,
            "deadlocks_resolved": 0,
            "robots_failed": 0,
            "robots_charging": 0,
        }

    # ------------------------------------------------------------------
    def _log(self, events: List[str]):
        self.event_log.extend(events)
        self.event_log = self.event_log[-200:]  # keep the log bounded

    def _tasks_by_id(self) -> dict:
        return {t.id: t for t in self.tasks}

    def _replenish_tasks_if_needed(self, min_open: int = 10):
        open_tasks = [t for t in self.tasks if t.assigned_to is None and not t.completed]
        if len(open_tasks) < min_open:
            new_tasks = make_random_tasks(min_open, self.world_size, start_id=self._task_id_counter, seed=self.tick)
            for t in new_tasks:
                t.created_tick = self.tick
            self.tasks.extend(new_tasks)
            self._task_id_counter += len(new_tasks)

    # ------------------------------------------------------------------
    def step(self):
        self.tick += 1
        tasks_by_id = self._tasks_by_id()

        # 1. Battery check -> route depleted robots to the nearest charger,
        #    releasing whatever task they were doing back to the pool.
        for r in self.robots:
            if r.state == RobotState.FAILED:
                continue
            if r.needs_charging() and r.state != RobotState.CHARGING:
                if r.task_id and r.task_id in tasks_by_id:
                    tasks_by_id[r.task_id].assigned_to = None
                station = nearest_station(r.x, r.y, self.charging_stations, prefer_available=True)
                r.abandon_task()
                r.target_x, r.target_y = station.x, station.y
                r.state = RobotState.CHARGING if r.distance_to(station.x, station.y) < r.speed else RobotState.MOVING
                self.event_log.append(f"[t={self.tick}] {r.id} battery low ({r.battery:.0f}%) -> heading to {station.id}")

        # 2. Decentralized negotiation for any open tasks.
        self._replenish_tasks_if_needed()
        auction_events = run_auction(self.robots, self.tasks, self.model, self.tick)
        self._log(auction_events)

        # 3. Collision prediction + right-of-way resolution.
        collision_events = detect_and_resolve(self.robots, tasks_by_id, self.tick)
        self.metrics["conflicts_resolved"] += len(collision_events)
        self._log(collision_events)

        # 4. Deadlock detection + recovery on top of this tick's yields.
        deadlock_events = detect_and_recover(self.robots, self.tick)
        self.metrics["deadlocks_resolved"] += len(deadlock_events)
        self._log(deadlock_events)
        apply_yield(self.robots, self.world_size)

        # 5. Advance every robot's own local state machine.
        for r in self.robots:
            if r.state == RobotState.FAILED:
                continue
            if r.state == RobotState.MOVING:
                if r.yielding_to is not None:
                    continue  # holding position this tick due to right-of-way
                # Charging-bound robots share the same movement code path.
                if r.target_x is not None and r.task_id is None:
                    r.step_toward_target()
                    if r.x == r.target_x and r.y == r.target_y:
                        r.state = RobotState.CHARGING
                else:
                    r.step_toward_target()
            elif r.state == RobotState.WORKING:
                r.step_work()
                if r.task_id is None:  # just completed
                    self.metrics["tasks_completed"] += 1
            elif r.state == RobotState.CHARGING:
                r.step_charge()
            r.cool_down_workload()

        for t in self.tasks:
            if t.assigned_to is None and not t.completed:
                continue

        # Mark tasks completed when their owning robot finished working them.
        active_task_ids = {r.task_id for r in self.robots if r.task_id}
        for t in self.tasks:
            if t.assigned_to and t.assigned_to not in active_task_ids and not t.completed:
                owner = next((r for r in self.robots if r.id == t.assigned_to), None)
                if owner is None or owner.state == RobotState.IDLE:
                    t.completed = True

        # Update charging station bay occupancy
        for s in self.charging_stations:
            s.occupied = 0
        for r in self.robots:
            if r.state == RobotState.CHARGING:
                st = nearest_station(r.x, r.y, self.charging_stations, prefer_available=False)
                st.occupied = min(st.capacity, st.occupied + 1)

        self.metrics["robots_failed"] = sum(1 for r in self.robots if r.state == RobotState.FAILED)
        self.metrics["robots_charging"] = sum(1 for r in self.robots if r.state == RobotState.CHARGING)

    def run(self, n_ticks: int):
        for _ in range(n_ticks):
            self.step()

    # ------------------------------------------------------------------
    # Demo / dashboard helpers
    def inject_failure(self, robot_id: str = None):
        msg = fi.inject_robot_failure(self.robots, self._tasks_by_id(), self.tick, robot_id)
        self.event_log.append(msg)

    def inject_comm_loss(self, robot_id: str = None):
        msg = fi.inject_comm_loss(self.robots, self.tick, robot_id)
        self.event_log.append(msg)

    def inject_controller_failure(self):
        self.controller_online = False
        msg = fi.inject_controller_failure(self.tick)
        self.event_log.append(msg)

    def restore_controller(self):
        self.controller_online = True
        msg = fi.restore_controller(self.tick)
        self.event_log.append(msg)

    def restore_all(self):
        self.controller_online = True
        msg = fi.restore_all(self.robots, self.tick)
        self.event_log.append(msg)

    def snapshot(self) -> dict:
        """A plain-dict view of the current state, easy to feed into a dashboard."""
        return {
            "tick": self.tick,
            "controller_online": self.controller_online,
            "robots": [
                {
                    "id": r.id, "x": r.x, "y": r.y, "state": r.state,
                    "battery": r.battery, "task_id": r.task_id,
                    "robot_type": getattr(r, "robot_type", "TRANSPORTER"),
                    "speed": round(r.speed, 2), "load_capacity": round(r.load_capacity, 1),
                    "target_x": r.target_x, "target_y": r.target_y,
                    "comm_active": r.comm_active, "tasks_completed": r.tasks_completed,
                    "yielding_to": r.yielding_to,
                }
                for r in self.robots
            ],
            "tasks": [
                {
                    "id": t.id, "x": t.x, "y": t.y, "priority": t.priority,
                    "required_capacity": getattr(t, "required_capacity", 50.0),
                    "assigned_to": t.assigned_to, "completed": t.completed,
                }
                for t in self.tasks if not t.completed
            ],
            "charging_stations": [
                {
                    "id": s.id, "x": s.x, "y": s.y,
                    "capacity": getattr(s, "capacity", 4),
                    "occupied": getattr(s, "occupied", 0)
                }
                for s in self.charging_stations
            ],
            "metrics": {
                **dict(self.metrics),
                "controller_online": 1 if self.controller_online else 0,
            },
            "event_log": list(self.event_log[-30:]),
        }


if __name__ == "__main__":
    sim = Simulation(n_robots=20, n_tasks=15)
    start = time.time()
    sim.run(30)
    elapsed = time.time() - start
    print(f"Ran 30 ticks with 20 robots in {elapsed:.2f}s")
    print(sim.metrics)
    print("\nLast 10 events:")
    for e in sim.event_log[-10:]:
        print(" ", e)
