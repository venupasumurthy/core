"""
negotiation.py
--------------
Implements peer-to-peer task negotiation via a Contract Net-style auction:

1. Every idle, reachable robot independently computes a BID for every open
   task, using the trained ML suitability model (robot_task_model.pkl) as
   its local bidding policy. No robot needs permission from a central
   authority to compute or broadcast a bid.
2. Bids are broadcast (represented here as a shared list every robot could
   equally well compute from the same local information — the assignment
   step is a deterministic function of the bid list, so any robot, or all
   of them redundantly, can compute the same winners without relying on one
   "auctioneer" being alive).
3. Highest bid wins each task; a robot can win at most one task per round.

This is what satisfies the "no single point of decision-making" requirement:
if the process coordinating this auction crashes, any surviving robot has
enough information (its own bid + broadcast bids) to recompute the same
winners independently.
"""

from typing import Dict, List

import numpy as np
import pandas as pd

from environment import Task
from robot import Robot

# Cap how many open tasks each idle robot considers bidding on. Without this,
# a full idle-robots x open-tasks cross join can spike badly the first time
# many robots and tasks are idle simultaneously (e.g. 500 robots x 300 tasks
# = 150,000 rows scored in one shot). Realistically a robot also has no
# business bidding on a task on the far side of the facility anyway.
MAX_CANDIDATE_TASKS_PER_ROBOT = 15

FEATURE_ORDER = [
    "distance", "battery", "speed", "workload", "task_priority",
    "task_distance", "load_capacity", "required_capacity",
    "estimated_time", "energy_required",
]


def build_bid_features(robot: Robot, task: Task) -> dict:
    distance = robot.distance_to(task.x, task.y)
    speed = max(robot.speed, 0.01)
    row = {
        "distance": distance,
        "battery": robot.battery,
        "speed": speed,
        "workload": robot.workload,
        "task_priority": task.priority,
        "task_distance": task.task_distance,
        "load_capacity": robot.load_capacity,
        "required_capacity": task.required_capacity,
    }
    row["estimated_time"] = distance / speed
    row["energy_required"] = task.task_distance * 0.02 + task.required_capacity * 0.1
    return row


def compute_all_bids(robots: List[Robot], tasks: List[Task], model) -> pd.DataFrame:
    """
    Vectorized bid computation: build one big feature table for every
    (idle robot, open task) pair and score it in a single model call.
    This is what makes the auction viable at 500+ robots — we avoid calling
    the model hundreds of thousands of times individually.
    """
    idle_robots = [r for r in robots if r.is_available_for_bidding()]
    open_tasks = [t for t in tasks if t.assigned_to is None and not t.completed]

    if not idle_robots or not open_tasks:
        return pd.DataFrame(columns=["robot_id", "task_id", "bid"])

    # Pre-filter: each robot only considers its nearest-K open tasks.
    # Vectorized distance computation keeps this cheap even at 500+ robots.
    robot_pos = np.array([[r.x, r.y] for r in idle_robots])
    task_pos = np.array([[t.x, t.y] for t in open_tasks])
    dist_matrix = np.sqrt(((robot_pos[:, None, :] - task_pos[None, :, :]) ** 2).sum(axis=-1))

    k = min(MAX_CANDIDATE_TASKS_PER_ROBOT, len(open_tasks))
    nearest_task_idx = np.argpartition(dist_matrix, k - 1, axis=1)[:, :k]

    rows = []
    pairs = []
    for ri, robot in enumerate(idle_robots):
        for ti in nearest_task_idx[ri]:
            task = open_tasks[ti]
            # Skip clearly infeasible pairs early (capacity) to keep the
            # candidate set manageable at scale.
            if robot.load_capacity < task.required_capacity * 0.5:
                continue
            rows.append(build_bid_features(robot, task))
            pairs.append((robot.id, task.id))

    if not rows:
        return pd.DataFrame(columns=["robot_id", "task_id", "bid"])

    feature_df = pd.DataFrame(rows)[FEATURE_ORDER]
    bids = model.predict_proba(feature_df)[:, 1]

    result = pd.DataFrame(pairs, columns=["robot_id", "task_id"])
    result["bid"] = bids
    return result


def plan_assignments(robots: List[Robot], tasks: List[Task], model) -> List[tuple]:
    """
    PURE function: given the current world state, returns the list of
    (robot_id, task_id, bid) winners. Makes no changes to any object.

    This is the piece that matters for the "no single point of decision-
    making" requirement: because it is a pure, deterministic function of
    shared state (positions, battery, task list), ANY robot — or several of
    them redundantly — can call this and always get the identical answer.
    There is nothing here that depends on one particular process's memory
    surviving. See verify_decentralization.py for a direct demonstration.
    """
    bids_df = compute_all_bids(robots, tasks, model)
    if bids_df.empty:
        return []

    bids_df = bids_df.sort_values(["bid", "robot_id", "task_id"], ascending=[False, True, True])
    assigned_robots = set()
    assigned_tasks = set()
    winners = []

    for _, row in bids_df.iterrows():
        robot_id, task_id, bid = row["robot_id"], row["task_id"], row["bid"]
        if robot_id in assigned_robots or task_id in assigned_tasks:
            continue
        if bid < 0.35:
            # Below this confidence, the robot doesn't consider itself a
            # reasonable match — leave the task open for a future round.
            continue
        winners.append((robot_id, task_id, round(float(bid), 6)))
        assigned_robots.add(robot_id)
        assigned_tasks.add(task_id)

    return winners


def apply_assignments(winners: List[tuple], robots: List[Robot], tasks: List[Task], tick: int) -> List[str]:
    """Mutates robots/tasks according to a plan produced by plan_assignments."""
    robots_by_id: Dict[str, Robot] = {r.id: r for r in robots}
    tasks_by_id: Dict[str, Task] = {t.id: t for t in tasks}
    events = []

    for robot_id, task_id, bid in winners:
        robot = robots_by_id[robot_id]
        task = tasks_by_id[task_id]
        robot.assign_task(task.id, task.x, task.y, task.work_ticks)
        task.assigned_to = robot.id
        events.append(f"[t={tick}] {robot_id} won task {task_id} (bid={bid:.2f})")

    return events


def run_auction(robots: List[Robot], tasks: List[Task], model, tick: int) -> List[str]:
    """Runs one round of the auction: plan, then apply. See plan_assignments docstring."""
    winners = plan_assignments(robots, tasks, model)
    return apply_assignments(winners, robots, tasks, tick)
