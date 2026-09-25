"""
failure_injection.py
---------------------
Utilities to simulate robot failures and communication loss, and to verify
the fleet recovers gracefully (tasks get released and re-auctioned, the
simulation keeps running) without any central controller stepping in to fix
things manually.
"""

import random
from typing import List, Optional

from robot import Robot, RobotState


def inject_robot_failure(robots: List[Robot], tasks_by_id: dict, tick: int, robot_id: Optional[str] = None) -> str:
    """Marks a robot FAILED. Any task it held is released back to the open queue."""
    candidates = [r for r in robots if r.state != RobotState.FAILED]
    if not candidates:
        return "No robots available to fail."

    robot = next((r for r in candidates if r.id == robot_id), None) if robot_id else random.choice(candidates)

    if robot.task_id and robot.task_id in tasks_by_id:
        tasks_by_id[robot.task_id].assigned_to = None  # released back for re-auction

    robot.state = RobotState.FAILED
    robot.abandon_task()
    robot.comm_active = False

    return f"[t={tick}] FAILURE INJECTED: {robot.id} is now offline. Its task (if any) was released back to the queue."


def inject_comm_loss(robots: List[Robot], tick: int, robot_id: Optional[str] = None) -> str:
    """Knocks out communication (but not the robot itself) — it can't bid or be assigned new work."""
    candidates = [r for r in robots if r.state != RobotState.FAILED and r.comm_active]
    if not candidates:
        return "No connected robots available to disconnect."

    robot = next((r for r in candidates if r.id == robot_id), None) if robot_id else random.choice(candidates)
    robot.comm_active = False
    return f"[t={tick}] COMM LOSS INJECTED: {robot.id} can no longer send/receive bids."


def restore_all(robots: List[Robot], tick: int) -> str:
    """Recovery utility: bring failed/disconnected robots back online (for demo resets)."""
    count = 0
    for r in robots:
        if r.state == RobotState.FAILED or not r.comm_active:
            r.state = RobotState.IDLE if r.state == RobotState.FAILED else r.state
            r.comm_active = True
            r.battery = max(r.battery, 60.0)
            count += 1
    return f"[t={tick}] Restored {count} robot(s) to service."


def inject_controller_failure(tick: int) -> str:
    """Simulates complete blackout of the central coordination service."""
    return (
        f"[t={tick}] CONTROLLER FAILURE INJECTED: Central coordination service is OFFLINE! "
        "Fleet has switched to pure peer-to-peer mesh consensus mode."
    )


def restore_controller(tick: int) -> str:
    """Restores the central coordination service."""
    return f"[t={tick}] CONTROLLER RESTORED: Central telemetry and advisory service back online."

