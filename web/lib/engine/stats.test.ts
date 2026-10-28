import { describe, expect, it } from "vitest";
import { emptyProfile } from "../profile";
import type { WeekPlan } from "../training";
import type { ExerciseLog, WorkoutLog } from "../workout-log";
import { bestsTimeline, consistency, e1rm, fmtPace, goalProgress, liftTrends, milestones, running, weekStarts } from "./stats";

const TODAY = new Date(2026, 9, 28, 12); // Wednesday 28 October 2026
const plan = { days: [{ weekday: 0, sessionId: "a" }, { weekday: 2, sessionId: "b" }, { weekday: 4, sessionId: "c" }], sessions: {}, notes: [], generatedAt: "" } as unknown as WeekPlan;

const ex = (exerciseId: string, sets: [number | undefined, number][], over: Partial<ExerciseLog> = {}): ExerciseLog => ({
  exerciseId, name: exerciseId, muscles: [], role: "main", restSec: 120, unit: "reps", weighted: sets.some(([w]) => w), step: 2.5,
  target: { reps: 5, kind: "start", reason: "" }, planned: "5", sets: sets.map(([weight, reps]) => ({ weight, reps, done: true })), ...over,
});
let n = 0;
const log = (date: string, exercises: ExerciseLog[], over: Partial<WorkoutLog> = {}): WorkoutLog => {
  n += 1;
  return { id: `l${n}`, date, sessionId: "a", name: "S", startedAt: `${date}T18:${String(n % 60).padStart(2, "0")}:00.000Z`, finishedAt: `${date}T19:00:00.000Z`, light: false, exercises, ...over };
};
const run = (date: string, minutes: number, km?: number) => log(date, [], { timed: { name: "Easy run", detail: "", plannedMin: minutes, minutes, distanceKm: km } });

describe("weekStarts", () => {
  it("lists the Mondays of the last weeks, ending with this one", () => {
    const w = weekStarts(TODAY, 3);
    expect(w).toEqual(["2026-10-12", "2026-10-19", "2026-10-26"]);
  });
});

describe("consistency", () => {
  it("counts training days per week and a streak that this week can't break before it starts", () => {
    const logs = [log("2026-10-12", []), log("2026-10-14", []), log("2026-10-14", []), log("2026-10-20", []), log("2026-10-21", []), log("2026-10-23", [])];
    const c = consistency(logs, plan, TODAY);
    expect(c.weeks.slice(-3).map((w) => w.done)).toEqual([2, 3, 0]);
    expect(c.streak).toBe(2);
    expect(c.hit).toBe(1);
    expect(c.of).toBe(2);
  });
});

describe("liftTrends", () => {
  it("uses each week's best estimated max and ignores high-rep sets", () => {
    expect(e1rm(100, 5)).toBeCloseTo(116.67, 1);
    expect(e1rm(40, 20)).toBe(0);
    const logs = [
      log("2026-10-12", [ex("bench-press", [[60, 5], [60, 5]])]),
      log("2026-10-14", [ex("bench-press", [[62.5, 5]])]),
      log("2026-10-21", [ex("bench-press", [[65, 5]])]),
      log("2026-10-21", [ex("curl", [[10, 20]], { role: "accessory" })]),
    ];
    const t = liftTrends(logs, TODAY);
    expect(t).toHaveLength(1);
    expect(t[0].points.map((p) => p.week)).toEqual(["2026-10-12", "2026-10-19"]);
    expect(t[0].change).toBeCloseTo(e1rm(65, 5) - e1rm(62.5, 5), 0);
  });
});

describe("bestsTimeline", () => {
  it("lists each exercise's latest best, newest first, leaving out accessories", () => {
    const logs = [
      log("2026-10-12", [ex("bench-press", [[60, 5]]), ex("squat", [[80, 5]]), ex("plank", [[undefined, 30]], { role: "accessory" })]),
      log("2026-10-19", [ex("bench-press", [[62.5, 5]]), ex("squat", [[85, 5]]), ex("plank", [[undefined, 35]], { role: "accessory" })]),
      log("2026-10-26", [ex("bench-press", [[65, 5]])]),
    ];
    expect(bestsTimeline(logs).map((b) => `${b.exerciseId} ${b.date}`)).toEqual(["bench-press 2026-10-26", "squat 2026-10-19"]);
  });
});

describe("running", () => {
  it("sums time and distance by week and compares recent pace with earlier pace", () => {
    const logs = [run("2026-09-08", 30, 5), run("2026-09-10", 30, 5), run("2026-10-20", 27, 5), run("2026-10-26", 40)];
    const r = running(logs, TODAY);
    expect(r.weeks.at(-1)).toMatchObject({ minutes: 40, km: 0, runs: 1 });
    expect(r.longest).toBe(40);
    expect(r.pace).toBeCloseTo(5.4, 2);
    expect(r.paceChange).toBeCloseTo(-0.6, 2);
    expect(fmtPace(5.4)).toBe("5:24");
  });
});

describe("milestones", () => {
  it("marks milestones reached in the log, or before starting from onboarding", () => {
    const logs = [log("2026-10-20", [ex("push-up", [[undefined, 12]])])];
    const m = milestones(logs, { ...emptyProfile(), level: { pullUps: 6 } });
    expect(m.find((x) => x.id === "push-10")).toMatchObject({ done: true, date: "2026-10-20" });
    expect(m.find((x) => x.id === "push-20")?.done).toBe(false);
    expect(m.find((x) => x.id === "pull-5")).toMatchObject({ done: true, before: true });
    expect(m.find((x) => x.id === "pull-10")?.done).toBe(false);
  });
});

describe("goalProgress", () => {
  it("never reports body weight, and falls back to consistency", () => {
    const logs = [log("2026-10-26", [])];
    const g = goalProgress({ ...emptyProfile(), goals: ["fat-loss"] }, logs, plan, TODAY)!;
    expect(g.unit).toMatch(/week/);
    expect(JSON.stringify(g)).not.toMatch(/weight|kg/i);
    expect(goalProgress({ ...emptyProfile(), goals: ["strength"] }, [], plan, TODAY)).toBeNull();
  });
});
