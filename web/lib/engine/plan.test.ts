import { describe, expect, it } from "vitest";
import { EXERCISE_BY_ID, hasKit } from "../exercises";
import { emptyProfile, type Profile } from "../profile";
import { estimateSeconds, type Session, type WeekPlan, type Weekday } from "../training";
import { fitToTime } from "./fit";
import { generatePlan } from "./plan";

const NOW = "2026-10-26T09:00:00.000Z";
const profile = (over: Partial<Profile>): Profile => ({ ...emptyProfile(), goals: ["muscle"], ...over });
const allExercises = (plan: WeekPlan) => Object.values(plan.sessions).flatMap((s) => s.exercises).filter((e) => !e.durationMin);
const byDay = (plan: WeekPlan) => plan.days.map((d) => ({ day: d.weekday, s: plan.sessions[d.sessionId] }));
const adjacent = (a: number, b: number) => (b - a + 7) % 7 === 1;

describe("generatePlan", () => {
  it("only uses exercises the user has equipment for", () => {
    const plan = generatePlan(profile({ locations: ["home"], equipment: ["dumbbells", "bench"], days: [0, 2, 4] }), NOW);
    for (const e of allExercises(plan)) expect(hasKit(EXERCISE_BY_ID[e.exerciseId], ["dumbbells", "bench"])).toBe(true);
  });

  it("fits every session into the time per session", () => {
    for (const minutes of [20, 30, 45, 60] as const) {
      for (const goals of [["muscle"], ["strength"], ["fat-loss"], ["race", "muscle"]] as Profile["goals"][]) {
        const plan = generatePlan(profile({ goals, race: "10k", minutes, days: [0, 1, 3, 4, 5] }), NOW);
        for (const s of Object.values(plan.sessions)) expect(estimateSeconds(s), `${s.name} at ${minutes} min`).toBeLessThanOrEqual(minutes * 60);
      }
    }
  });

  it("keeps hard leg days apart when the chosen days allow it", () => {
    const plan = generatePlan(profile({ experience: "intermediate", days: [0, 1, 3, 4] }), NOW);
    const legs = byDay(plan).filter(({ s }) => s.legLoad === 2);
    expect(legs).toHaveLength(2);
    expect(adjacent(legs[0].day, legs[1].day) || adjacent(legs[1].day, legs[0].day)).toBe(false);
  });

  it("does not put a heavy leg session the day before a hard run", () => {
    const plan = generatePlan(profile({ goals: ["race", "muscle"], race: "10k", experience: "intermediate", days: [0, 1, 2, 3, 5] as Weekday[] }), NOW);
    const week = byDay(plan);
    for (const a of week) {
      for (const b of week) {
        if (adjacent(a.day, b.day) && a.s.focus !== "run" && a.s.legLoad === 2) expect(b.s.focus === "run" && b.s.hard).toBe(false);
      }
    }
  });

  it("puts the long run at the weekend when a weekend day is chosen", () => {
    const plan = generatePlan(profile({ goals: ["race"], race: "5k", days: [1, 3, 6] }), NOW);
    const long = byDay(plan).find(({ s }) => s.name === "Long run");
    expect(long?.day).toBe(6);
  });

  it("leaves out exercises that load an area the user is avoiding", () => {
    const plan = generatePlan(profile({ avoid: ["knees", "shoulders"], days: [0, 2, 4] }), NOW);
    for (const e of allExercises(plan)) {
      expect(EXERCISE_BY_ID[e.exerciseId].stress).not.toContain("knees");
      expect(EXERCISE_BY_ID[e.exerciseId].stress).not.toContain("shoulders");
    }
    expect(plan.notes.some((n) => n.includes("knees"))).toBe(true);
  });

  it("never includes an excluded exercise", () => {
    const plan = generatePlan(profile({ excluded: ["back-squat", "goblet-squat", "bench-press"], experience: "advanced", days: [0, 1, 3, 4] }), NOW);
    const ids = allExercises(plan).map((e) => e.exerciseId);
    expect(ids).not.toContain("back-squat");
    expect(ids).not.toContain("goblet-squat");
    expect(ids).not.toContain("bench-press");
  });

  it("keeps advanced movements away from beginners", () => {
    const plan = generatePlan(profile({ experience: "beginner", days: [0, 2, 4] }), NOW);
    for (const e of allExercises(plan)) expect(EXERCISE_BY_ID[e.exerciseId].level).toBeLessThan(3);
  });

  it("gives every strength session at least one main lift and no duplicates within a session", () => {
    const plan = generatePlan(profile({ experience: "intermediate", days: [0, 1, 2, 3, 4, 5] }), NOW);
    for (const s of Object.values(plan.sessions)) {
      expect(s.exercises.some((e) => e.role === "main")).toBe(true);
      const ids = s.exercises.map((e) => e.exerciseId);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("is deterministic", () => {
    const p = profile({ goals: ["strength", "running"], experience: "intermediate", days: [0, 2, 3, 5] });
    expect(generatePlan(p, NOW)).toEqual(generatePlan(p, NOW));
  });
});

describe("fitToTime", () => {
  const session: Session = {
    id: "s", name: "Upper", focus: "upper", purpose: "", legLoad: 0, hard: false,
    exercises: [
      { exerciseId: "bench-press", name: "Bench", muscles: [], role: "main", sets: 4, reps: "8", restSec: 150 },
      { exerciseId: "barbell-row", name: "Row", muscles: [], role: "main", sets: 4, reps: "8", restSec: 120 },
      { exerciseId: "overhead-press", name: "Press", muscles: [], role: "secondary", sets: 3, reps: "8", restSec: 120 },
      { exerciseId: "lateral-raise", name: "Raise", muscles: [], role: "accessory", sets: 3, reps: "12", restSec: 60 },
    ],
  };

  it("cuts accessories before secondary work and never drops a main lift", () => {
    const { session: out, fits } = fitToTime(session, 20);
    expect(fits).toBe(true);
    expect(out.exercises.filter((e) => e.role === "main")).toHaveLength(2);
    expect(out.exercises.find((e) => e.role === "accessory")).toBeUndefined();
  });

  it("leaves a session alone when it already fits", () => {
    const { session: out, changes } = fitToTime(session, 75);
    expect(out.exercises).toEqual(session.exercises);
    expect(changes).toEqual([]);
  });

  it("keeps rest on main lifts at 2 minutes or more", () => {
    const { session: out } = fitToTime(session, 15);
    for (const e of out.exercises.filter((x) => x.role === "main")) expect(e.restSec).toBeGreaterThanOrEqual(120);
  });
});
