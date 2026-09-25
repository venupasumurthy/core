"""
environment.py
--------------
Defines the world: its bounds, the task queue, and fixed charging stations
that battery-depleted robots route to.
"""

import random
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class Task:
    id: str
    x: float
    y: float
    priority: int          # 1 (low) - 10 (high)
    required_capacity: float
    task_distance: float   # internal work distance once the robot arrives
    work_ticks: int
    assigned_to: Optional[str] = None
    completed: bool = False
    created_tick: int = 0


@dataclass
class ChargingStation:
    id: str
    x: float
    y: float
    capacity: int = 4  # physical charging bays
    occupied: int = 0


def make_random_tasks(n: int, world_size: float, start_id: int = 0, seed: int = 7) -> List[Task]:
    rng = random.Random(seed + start_id)  # vary seed so repeated calls don't repeat tasks
    tasks = []
    for i in range(n):
        tasks.append(
            Task(
                id=f"T{start_id + i:05d}",
                x=rng.uniform(0, world_size),
                y=rng.uniform(0, world_size),
                priority=rng.randint(1, 10),
                required_capacity=rng.uniform(10, 90),
                task_distance=rng.uniform(50, 500),
                work_ticks=rng.randint(2, 6),
            )
        )
    return tasks


def make_charging_stations(world_size: float, count: int = 4) -> List[ChargingStation]:
    """Evenly spread charging stations near the corners of the world."""
    margin = world_size * 0.1
    corners = [
        (margin, margin),
        (world_size - margin, margin),
        (margin, world_size - margin),
        (world_size - margin, world_size - margin),
    ]
    stations = [ChargingStation(id=f"CS{i}", x=cx, y=cy, capacity=4, occupied=0) for i, (cx, cy) in enumerate(corners[:count])]
    return stations


def nearest_station(x: float, y: float, stations: List[ChargingStation], prefer_available: bool = True) -> ChargingStation:
    """Finds nearest charging station. If prefer_available is True, prioritizes stations with open bays."""
    if prefer_available:
        avail = [s for s in stations if s.occupied < s.capacity]
        if avail:
            return min(avail, key=lambda s: (s.x - x) ** 2 + (s.y - y) ** 2)
    return min(stations, key=lambda s: (s.x - x) ** 2 + (s.y - y) ** 2)
