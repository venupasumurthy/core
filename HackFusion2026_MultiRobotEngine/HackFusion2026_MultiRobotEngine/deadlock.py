"""
deadlock.py
-----------
Builds a "wait-for" graph each tick from collision-avoidance yields
(robot A yields to robot B => edge A -> B) and detects cycles: if A waits for
B, B waits for C, and C waits for A, none of them can ever move — a classic
distributed deadlock.

Recovery: break the cycle by forcibly granting one robot in it temporary
right-of-way (a one-tick priority override) and logging the intervention,
then also flagging it for task migration if the same robot keeps deadlocking.
"""

from typing import Dict, List

from robot import Robot

DEADLOCK_STUCK_THRESHOLD = 3  # ticks of continuous yielding before we treat it as suspicious


def _find_cycle(graph: Dict[str, str]) -> List[str]:
    """Standard cycle detection in a functional graph (each node has out-degree <= 1)."""
    visited = set()
    for start in graph:
        path = []
        node = start
        seen_this_path = {}
        while node is not None and node in graph:
            if node in seen_this_path:
                # Found a cycle: return the portion of the path that repeats.
                cycle_start_idx = seen_this_path[node]
                return path[cycle_start_idx:]
            if node in visited:
                break
            seen_this_path[node] = len(path)
            path.append(node)
            visited.add(node)
            node = graph.get(node)
    return []


def detect_and_recover(robots: List[Robot], tick: int) -> List[str]:
    events = []
    wait_for_graph = {r.id: r.yielding_to for r in robots if r.yielding_to is not None}

    cycle = _find_cycle(wait_for_graph)
    if not cycle:
        return events

    robots_by_id = {r.id: r for r in robots}
    # Only treat it as a real deadlock (not a brief, harmless yield) once
    # robots have been stuck for several consecutive ticks.
    stuck_robots = [
        rid for rid in cycle
        if robots_by_id[rid].consecutive_yield_ticks >= DEADLOCK_STUCK_THRESHOLD
    ]
    if not stuck_robots:
        return events

    # Recovery: pick one robot in the cycle and clear its yield for this
    # tick only, letting it proceed. This breaks the circular wait.
    freed_robot = robots_by_id[stuck_robots[0]]
    freed_robot.yielding_to = None
    freed_robot.consecutive_yield_ticks = 0

    events.append(
        f"[t={tick}] DEADLOCK detected among {cycle} -> "
        f"recovered by granting {freed_robot.id} temporary right-of-way"
    )
    return events
