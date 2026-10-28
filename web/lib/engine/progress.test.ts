import { describe, expect, it } from "vitest";
import { GYM_EQUIPMENT } from "../profile";
import type { Prescription, Session } from "../training";
import type { Effort, WorkoutLog } from "../workout-log";
import { nextTarget, personalBests, startLog } from "./progress";

const squat: Prescription = { exerciseId: "back-squat", name: "Back squat", muscles: ["Quads"], role: "main", sets: 3, reps: "5", restSec: 180 };
const bench: Prescription = { exerciseId: "bench-press", name: "Barbell bench press", muscles: ["Chest"], role: "main", sets: 3, reps: "5", restSec: 180 };
const curl: Prescription = { exerciseId: "dumbbell-curl", name: "Dumbbell curl", muscles: ["Biceps"], role: "accessory", sets: 2, reps: "10", restSec: 60 };
const pushUp: Prescription = { exerciseId: "push-up", name: "Push-up", muscles: ["Chest"], role: "secondary", sets: 3, reps: "8", restSec: 90, load: "Bodyweight" };
const plank: Prescription = { exerciseId: "plank", name: "Plank", muscles: ["Core"], role: "accessory", sets: 2, reps: "30 s", restSec: 60, load: "Bodyweight" };
const session = (exercises: Prescription[]): Session => ({ id: "s", name: "Test", focus: "full", purpose: "", exercises, legLoad: 0, hard: false });

let day = 0;
/** Log a session where every set is done at `weight` for `reps`, unless `reps` lists each set. */
function logged(history: WorkoutLog[], p: Prescription, weight: number | undefined, reps: number | number[], effort: Effort = "hard", light = false): WorkoutLog[] {
  day += 1;
  const now = new Date(Date.UTC(2026, 9, day, 9)).toISOString();
  const log = startLog(session([p]), "s", now.slice(0, 10), history, GYM_EQUIPMENT, { now, light });
  const ex = log.exercises[0];
  const each = Array.isArray(reps) ? reps : ex.sets.map(() => reps);
  ex.sets = ex.sets.map((s, i) => ({ weight, reps: each[i] ?? 0, done: each[i] !== undefined }));
  ex.effort = effort;
  return [...history, { ...log, finishedAt: now }];
}

describe("nextTarget", () => {
  it("asks for a starting weight the first time", () => {
    const t = nextTarget(squat, [], GYM_EQUIPMENT).target;
    expect(t).toMatchObject({ kind: "start", reps: 5 });
    expect(t.weight).toBeUndefined();
    expect(t.reason).toMatch(/2 more reps/);
  });

  it("adds weight to a main lift after every rep is hit with reps to spare", () => {
    const h = logged([], bench, 60, 5);
    expect(nextTarget(bench, h, GYM_EQUIPMENT).target).toMatchObject({ kind: "progress", weight: 62.5, reps: 5 });
    const s = logged([], squat, 80, 5);
    expect(nextTarget(squat, s, GYM_EQUIPMENT).target).toMatchObject({ kind: "progress", weight: 85 });
  });

  it("holds after an all-out session, even when every rep was hit", () => {
    const h = logged([], bench, 60, 5, "max");
    expect(nextTarget(bench, h, GYM_EQUIPMENT).target).toMatchObject({ kind: "hold", weight: 60, reps: 5 });
  });

  it("adds reps before weight on smaller exercises, then adds weight and drops back", () => {
    let h = logged([], curl, 10, 10);
    expect(nextTarget(curl, h, GYM_EQUIPMENT).target).toMatchObject({ kind: "progress", weight: 10, reps: 11 });
    h = logged(h, curl, 10, 11);
    h = logged(h, curl, 10, 12);
    expect(nextTarget(curl, h, GYM_EQUIPMENT).target).toMatchObject({ kind: "progress", weight: 12, reps: 10 });
  });

  it("holds after a near miss and reduces after a big miss or two misses in a row", () => {
    const near = logged([], bench, 60, [5, 5, 4]);
    expect(nextTarget(bench, near, GYM_EQUIPMENT).target).toMatchObject({ kind: "hold", weight: 60 });
    const big = logged([], bench, 60, [5, 3, 2]);
    expect(nextTarget(bench, big, GYM_EQUIPMENT).target).toMatchObject({ kind: "reduce", weight: 55 });
    const twice = logged(logged([], bench, 60, [5, 5, 4]), bench, 60, [5, 5, 4]);
    expect(nextTarget(bench, twice, GYM_EQUIPMENT).target.kind).toBe("reduce");
  });

  it("counts skipped sets as missed", () => {
    const h = logged([], bench, 60, [5]);
    expect(nextTarget(bench, h, GYM_EQUIPMENT).target.kind).toBe("reduce");
  });

  it("adds a rep to bodyweight work and 5 seconds to holds", () => {
    const t = nextTarget(pushUp, logged([], pushUp, undefined, 8), GYM_EQUIPMENT).target;
    expect(t).toMatchObject({ kind: "progress", reps: 9 });
    expect(t.weight).toBeUndefined();
    expect(nextTarget(plank, logged([], plank, undefined, 30), GYM_EQUIPMENT).target).toMatchObject({ kind: "progress", reps: 35 });
  });

  it("never raises a target from a lighter day, or on one", () => {
    const normal = logged([], bench, 60, 5);
    const thenLight = logged(normal, bench, 50, 5, "easy", true);
    expect(nextTarget(bench, thenLight, GYM_EQUIPMENT).target).toMatchObject({ kind: "progress", weight: 62.5 });
    expect(nextTarget(bench, normal, GYM_EQUIPMENT, true).target).toMatchObject({ kind: "hold", weight: 60 });
    const onlyLight = logged([], bench, 50, 5, "easy", true);
    expect(nextTarget(bench, onlyLight, GYM_EQUIPMENT).target.kind).toBe("hold");
  });

  it("treats exercises on a bar, bands or a box as bodyweight", () => {
    const pullUp: Prescription = { exerciseId: "pull-up", name: "Pull-up", muscles: ["Back"], role: "main", sets: 3, reps: "5", restSec: 150 };
    expect(nextTarget(pullUp, [], GYM_EQUIPMENT).weighted).toBe(false);
    expect(nextTarget(bench, [], GYM_EQUIPMENT).weighted).toBe(true);
  });

  it("uses 2 kg jumps for dumbbells and 2.5 kg for barbells", () => {
    expect(nextTarget(curl, [], GYM_EQUIPMENT).step).toBe(2);
    expect(nextTarget(bench, [], GYM_EQUIPMENT).step).toBe(2.5);
  });
});

describe("startLog", () => {
  it("fills each set from the target, and logs runs as minutes", () => {
    const h = logged([], bench, 60, 5);
    const log = startLog(session([bench, curl]), "s", "2026-10-28", h, GYM_EQUIPMENT);
    expect(log.exercises[0].sets).toEqual([{ weight: 62.5, reps: 5, done: false }, { weight: 62.5, reps: 5, done: false }, { weight: 62.5, reps: 5, done: false }]);
    const run = startLog(session([{ exerciseId: "run-easy", name: "Easy run", muscles: ["Cardio"], role: "main", sets: 1, reps: "30 min easy", restSec: 0, durationMin: 30 }]), "r", "2026-10-28", [], GYM_EQUIPMENT);
    expect(run.exercises).toEqual([]);
    expect(run.timed).toMatchObject({ plannedMin: 30, minutes: 30 });
  });
});

describe("personalBests", () => {
  it("finds a heavier weight than ever before, but not on the first attempt", () => {
    const first = logged([], bench, 60, 5);
    expect(personalBests(first[0], [])).toEqual([]);
    const second = logged(first, bench, 62.5, 5);
    expect(personalBests(second[1], second)).toEqual([expect.objectContaining({ exerciseId: "bench-press", text: "62.5 kg, your heaviest yet" })]);
    const third = logged(second, bench, 62.5, 5);
    expect(personalBests(third[2], third)).toEqual([]);
  });
});
