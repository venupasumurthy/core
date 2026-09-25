"""
collision.py
------------
Predicts near-term spatial conflicts between moving robots and resolves
right-of-way without any central traffic controller: each conflicting pair
resolves locally using a deterministic, symmetric rule (higher task priority
wins; ties broken by robot id) that both robots can compute independently
and always agree on.

Distance checks are vectorized with NumPy so this stays cheap at 500+ robots
(O(n^2) pairwise distances via broadcasting, which is fine up to a few
thousand agents per tick; a production system would use a spatial index
such as a grid or k-d tree to go further).
"""

import math
from typing import List

import numpy as np

from robot import Robot, RobotState

SAFETY_RADIUS = 8.0  # world units; pairs closer than this are a conflict


def detect_and_resolve(robots: List[Robot], tasks_by_id: dict, tick: int) -> List[str]:
    events = []
    moving = [r for r in robots if r.state == RobotState.MOVING]

    # Reset per-tick yield bookkeeping before recomputing conflicts.
    for r in robots:
        r.yielding_to = None

    if len(moving) < 2:
        for r in robots:
            r.consecutive_yield_ticks = 0
        return events

    positions = np.array([[r.x, r.y] for r in moving])
    diff = positions[:, None, :] - positions[None, :, :]
    dist_matrix = np.sqrt((diff ** 2).sum(axis=-1))
    np.fill_diagonal(dist_matrix, np.inf)

    conflict_pairs = np.argwhere(dist_matrix < SAFETY_RADIUS)

    resolved_pairs = set()
    for i, j in conflict_pairs:
        if i >= j:
            continue  # each unordered pair appears twice in argwhere; skip the duplicate
        pair_key = (i, j)
        if pair_key in resolved_pairs:
            continue
        resolved_pairs.add(pair_key)

        robot_a, robot_b = moving[i], moving[j]
        task_a = tasks_by_id.get(robot_a.task_id)
        task_b = tasks_by_id.get(robot_b.task_id)
        priority_a = task_a.priority if task_a else 0
        priority_b = task_b.priority if task_b else 0

        # Deterministic, symmetric right-of-way rule both robots agree on
        # without negotiation overhead: higher task priority proceeds;
        # ties broken by robot id so the outcome is always consistent.
        if priority_a > priority_b or (priority_a == priority_b and robot_a.id < robot_b.id):
            winner, loser = robot_a, robot_b
        else:
            winner, loser = robot_b, robot_a

        # Safe alternative trajectory generation:
        # Compute perpendicular evasion detour to guide the yielding robot around the priority robot
        dx = loser.x - winner.x
        dy = loser.y - winner.y
        dist_val = max(math.hypot(dx, dy), 0.001)
        perp_x = -dy / dist_val
        perp_y = dx / dist_val
        evasion_speed = min(loser.speed * 0.45, 1.2)
        loser.evasion_vx = perp_x * evasion_speed
        loser.evasion_vy = perp_y * evasion_speed

        loser.yielding_to = winner.id
        loser.consecutive_yield_ticks += 1
        events.append(
            f"[t={tick}] Conflict: {loser.id} yields to {winner.id} "
            f"(dist={dist_matrix[i][j]:.1f}, detour generated)"
        )

    # Robots not currently yielding reset their streak (used by deadlock.py
    # to distinguish a brief yield from a stuck cycle).
    for r in moving:
        if r.yielding_to is None:
            r.consecutive_yield_ticks = 0

    return events


def apply_yield(robots: List[Robot], world_size: float = 500.0):
    """
    Robots that lost right-of-way this tick apply their safe alternative detour
    trajectory (lateral evasion) to stay clear of the priority robot while
    preventing static gridlock in high-density corridors.
    """
    for r in robots:
        if r.state == RobotState.MOVING and r.yielding_to is not None:
            if getattr(r, "evasion_vx", 0.0) != 0.0 or getattr(r, "evasion_vy", 0.0) != 0.0:
                r.x = max(2.0, min(world_size - 2.0, r.x + r.evasion_vx))
                r.y = max(2.0, min(world_size - 2.0, r.y + r.evasion_vy))
                r.evasion_vx = 0.0
                r.evasion_vy = 0.0

