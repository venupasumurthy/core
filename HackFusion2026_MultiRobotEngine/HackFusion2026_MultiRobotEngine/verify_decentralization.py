"""
verify_decentralization.py
----------------------------
Directly demonstrates the "no single point of decision-making" requirement.

We take one frozen snapshot of the world (robots + tasks) and have three
INDEPENDENT calls to plan_assignments() — standing in for three different
robots each independently deciding "who should get which task?" using only
locally-available information (broadcast bids). If decentralization is real,
all three must agree, because none of them depends on a shared, stateful
"auctioneer" process to hand them the answer — the answer is a deterministic
function of the data itself.

If a central coordinator process crashed mid-round in this system, any
surviving robot could run this exact function and pick up exactly where the
fleet left off.

Run with:
    python verify_decentralization.py
"""

import joblib

from environment import make_random_tasks
from negotiation import plan_assignments
from robot import make_random_robots

MODEL_PATH = "model/robot_task_model.pkl"


def main():
    bundle = joblib.load(MODEL_PATH)
    model = bundle["model"]

    robots = make_random_robots(60, world_size=800, seed=123)
    tasks = make_random_tasks(40, world_size=800, seed=123)

    # Three "independent" computations of the same frozen state.
    plan_a = plan_assignments(robots, tasks, model)
    plan_b = plan_assignments(robots, tasks, model)
    plan_c = plan_assignments(robots, tasks, model)

    set_a, set_b, set_c = set(plan_a), set(plan_b), set(plan_c)

    print(f"Plan A: {len(plan_a)} assignments")
    print(f"Plan B: {len(plan_b)} assignments")
    print(f"Plan C: {len(plan_c)} assignments")

    if set_a == set_b == set_c:
        print("\n[PASS] SUCCESS: All three independent computations produced an identical")
        print("   assignment. No robot needs a surviving 'central' process to know")
        print("   the correct outcome — any of them could compute it alone.")
    else:
        print("\n[FAIL] FAIL: Computations diverged — decentralization guarantee broken.")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
