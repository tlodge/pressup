import { describe, expect, it } from "vitest";
import { EXERCISES, EXERCISE_BY_ID, hasKit } from "../exercises";
import { GUIDES } from "../exercise-guide";
import { emptyProfile, type Profile } from "../profile";
import { availableSwaps, findSwaps } from "./substitute";

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
