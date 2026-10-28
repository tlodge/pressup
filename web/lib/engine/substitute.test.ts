import { describe, expect, it } from "vitest";
import { EXERCISES, EXERCISE_BY_ID, hasKit } from "../exercises";
import { GUIDES } from "../exercise-guide";
import { emptyProfile, type Profile } from "../profile";
import type { Weekday } from "../training";
import { generatePlan } from "./plan";
import { applySwap, availableSwaps, carrySwaps, findSwaps } from "./substitute";

const profile = (over: Partial<Profile>): Profile => ({ ...emptyProfile(), goals: ["muscle"], ...over });

describe("findSwaps", () => {
  it("puts same-pattern swaps first", () => {
    const swaps = availableSwaps("back-squat", profile({ experience: "advanced" }));
    expect(swaps.length).toBeGreaterThan(0);
    const firstOther = swaps.findIndex((s) => s.exercise.pattern !== "squat");
    const lastSame = swaps.map((s) => s.exercise.pattern).lastIndexOf("squat");
    if (firstOther >= 0) expect(lastSame).toBeLessThan(firstOther);
  });

  it("only suggests movements with the same or a related purpose", () => {
    for (const s of findSwaps("bench-press", profile({}))) expect(["h-push", "triceps"]).toContain(s.exercise.pattern);
    for (const s of findSwaps("pull-up", profile({}))) expect(["v-pull", "h-pull"]).toContain(s.exercise.pattern);
  });

  it("never offers an unavailable swap as available", () => {
    const p = profile({ locations: ["home"], equipment: ["dumbbells"], avoid: ["wrists"], excluded: ["goblet-squat"] });
    for (const s of availableSwaps("back-squat", p)) {
      expect(hasKit(s.exercise, p.equipment)).toBe(true);
      expect(s.exercise.stress).not.toContain("wrists");
      expect(s.exercise.id).not.toBe("goblet-squat");
    }
  });

  it("explains why a swap is unavailable", () => {
    const p = profile({ locations: ["home"], equipment: [] });
    const legPress = findSwaps("back-squat", p).find((s) => s.exercise.id === "leg-press");
    expect(legPress?.blocker?.kind).toBe("kit");
    expect(legPress?.blocker?.text).toMatch(/resistance machines/);
  });

  it("skips exercises already in the session", () => {
    const ids = availableSwaps("barbell-row", profile({}), ["dumbbell-row"]).map((s) => s.exercise.id);
    expect(ids).not.toContain("dumbbell-row");
  });
});

describe("exercise guide", () => {
  it("covers every exercise in the catalogue", () => {
    for (const e of EXERCISES) {
      expect(GUIDES[e.id], e.id).toBeDefined();
      expect(GUIDES[e.id].steps.length, e.id).toBeGreaterThanOrEqual(3);
    }
  });

  it("only links variations that exist", () => {
    for (const [id, g] of Object.entries(GUIDES)) {
      expect(EXERCISE_BY_ID[id], id).toBeDefined();
      for (const v of [...(g.easier ?? []), ...(g.harder ?? [])]) expect(EXERCISE_BY_ID[v], `${id} → ${v}`).toBeDefined();
    }
  });
});

describe("carrySwaps", () => {
  const NOW = "2026-10-26T09:00:00.000Z";
  const base = { ...emptyProfile(), goals: ["strength" as const], experience: "intermediate" as const, minutes: 60 as const, days: [0, 1, 3, 4] as Weekday[] };

  it("keeps a swap through a rebuild, even when the session moves day", () => {
    const old = generatePlan(base, NOW);
    const id = Object.keys(old.sessions).find((k) => old.sessions[k].name === "Lower A")!;
    const i = old.sessions[id].exercises.findIndex((e) => e.exerciseId === "back-squat");
    old.sessions[id].exercises[i] = applySwap(old.sessions[id].exercises[i], EXERCISE_BY_ID["goblet-squat"]);
    const rebuilt = generatePlan({ ...base, days: [1, 2, 4, 5] }, NOW);
    const { plan, kept } = carrySwaps(old, rebuilt, { ...base, days: [1, 2, 4, 5] });
    expect(kept).toBe(1);
    const lowerA = Object.values(plan.sessions).find((s) => s.name === "Lower A")!;
    expect(lowerA.exercises.map((e) => e.exerciseId)).toContain("goblet-squat");
    expect(lowerA.exercises.map((e) => e.exerciseId)).not.toContain("back-squat");
  });

  it("drops a swap the user can no longer do", () => {
    const old = generatePlan(base, NOW);
    const id = Object.keys(old.sessions).find((k) => old.sessions[k].name === "Lower A")!;
    const i = old.sessions[id].exercises.findIndex((e) => e.exerciseId === "back-squat");
    old.sessions[id].exercises[i] = applySwap(old.sessions[id].exercises[i], EXERCISE_BY_ID["leg-press"]);
    const noMachine = { ...base, equipment: base.equipment.filter((e) => e !== "machine") };
    expect(carrySwaps(old, generatePlan(noMachine, NOW), noMachine).kept).toBe(0);
  });
});
