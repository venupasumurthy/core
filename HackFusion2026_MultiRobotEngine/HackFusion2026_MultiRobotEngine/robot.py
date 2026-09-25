"""
robot.py
--------
Defines the Robot entity: its physical state (position, battery, speed) and
its logical state machine (IDLE -> MOVING -> WORKING -> IDLE, or -> CHARGING,
or -> FAILED). Every robot only knows about itself and what it can sense
locally (its own position/battery, and messages broadcast by others) —
there is no robot with special "central" authority.
"""

import math
import random
from dataclasses import dataclass, field
from typing import Optional


class RobotState:
    IDLE = "IDLE"
    MOVING = "MOVING"
    WORKING = "WORKING"
    CHARGING = "CHARGING"
    FAILED = "FAILED"


class RobotType:
    SCOUT = "SCOUT"
    TRANSPORTER = "TRANSPORTER"
    HEAVY_LIFTER = "HEAVY_LIFTER"


@dataclass
class Robot:
    id: str
    x: float
    y: float
    speed: float
    load_capacity: float
    battery: float = 100.0
    state: str = RobotState.IDLE
    robot_type: str = RobotType.TRANSPORTER

    # Task the robot currently owns (None if idle)
    task_id: Optional[str] = None
    target_x: Optional[float] = None
    target_y: Optional[float] = None
    work_ticks_remaining: int = 0

    # Workload: a rolling 0-100 measure of how busy this robot has been
    # recently. Feeds into the ML suitability model as a bidding feature.
    workload: float = 0.0

    # Communication: can be knocked out independently to simulate comm loss
    # without killing the robot outright.
    comm_active: bool = True

    # Collision-avoidance bookkeeping (used by collision.py / deadlock.py)
    yielding_to: Optional[str] = None
    consecutive_yield_ticks: int = 0
    evasion_vx: float = 0.0
    evasion_vy: float = 0.0

    # Diagnostics
    tasks_completed: int = 0

    BATTERY_DRAIN_PER_MOVE_TICK: float = 0.35
    BATTERY_DRAIN_PER_WORK_TICK: float = 0.15
    BATTERY_CHARGE_PER_TICK: float = 4.0
    LOW_BATTERY_THRESHOLD: float = 20.0

    def distance_to(self, x: float, y: float) -> float:
        return math.hypot(self.x - x, self.y - y)

    def is_available_for_bidding(self) -> bool:
        """A robot can only take on new work if it's idle, alive, and reachable."""
        return self.state == RobotState.IDLE and self.comm_active

    def needs_charging(self) -> bool:
        return self.battery <= self.LOW_BATTERY_THRESHOLD and self.state != RobotState.CHARGING

    def assign_task(self, task_id: str, target_x: float, target_y: float, work_ticks: int):
        self.task_id = task_id
        self.target_x = target_x
        self.target_y = target_y
        self.work_ticks_remaining = work_ticks
        self.state = RobotState.MOVING

    def abandon_task(self):
        """Release the current task back to the queue (used for battery/failure recovery)."""
        self.task_id = None
        self.target_x = None
        self.target_y = None
        self.work_ticks_remaining = 0

    def step_toward_target(self):
        """Move one tick closer to the current target, draining battery."""
        if self.target_x is None or self.target_y is None:
            return
        dx = self.target_x - self.x
        dy = self.target_y - self.y
        dist = math.hypot(dx, dy)

        if dist <= self.speed:
            self.x, self.y = self.target_x, self.target_y
            self.state = RobotState.WORKING
        else:
            self.x += self.speed * dx / dist
            self.y += self.speed * dy / dist
            self.battery = max(0.0, self.battery - self.BATTERY_DRAIN_PER_MOVE_TICK)
            self.workload = min(100.0, self.workload + 1.5)

    def step_work(self):
        """Progress on-site work for the current task."""
        self.work_ticks_remaining -= 1
        self.battery = max(0.0, self.battery - self.BATTERY_DRAIN_PER_WORK_TICK)
        if self.work_ticks_remaining <= 0:
            self.tasks_completed += 1
            self.task_id = None
            self.target_x = None
            self.target_y = None
            self.state = RobotState.IDLE

    def step_charge(self):
        self.battery = min(100.0, self.battery + self.BATTERY_CHARGE_PER_TICK)
        if self.battery >= 99.9:
            self.state = RobotState.IDLE

    def cool_down_workload(self):
        if self.state == RobotState.IDLE:
            self.workload = max(0.0, self.workload - 1.0)


def make_random_robots(n: int, world_size: float, seed: int = 42) -> list:
    rng = random.Random(seed)
    robots = []
    for i in range(n):
        # 25% SCOUT, 55% TRANSPORTER, 20% HEAVY_LIFTER
        r_choice = rng.random()
        if r_choice < 0.25:
            rtype = RobotType.SCOUT
            speed = rng.uniform(4.5, 6.0)
            capacity = rng.uniform(30.0, 50.0)
            drain_move = 0.25
        elif r_choice < 0.80:
            rtype = RobotType.TRANSPORTER
            speed = rng.uniform(3.0, 4.2)
            capacity = rng.uniform(55.0, 90.0)
            drain_move = 0.35
        else:
            rtype = RobotType.HEAVY_LIFTER
            speed = rng.uniform(1.8, 2.6)
            capacity = rng.uniform(95.0, 160.0)
            drain_move = 0.52

        robot = Robot(
            id=f"R{i:04d}",
            x=rng.uniform(0, world_size),
            y=rng.uniform(0, world_size),
            speed=speed,
            load_capacity=capacity,
            battery=rng.uniform(60, 100),
            robot_type=rtype,
        )
        robot.BATTERY_DRAIN_PER_MOVE_TICK = drain_move
        robots.append(robot)
    return robots
