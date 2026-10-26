import { describe, expect, it } from "vitest";
import { EXERCISE_BY_ID, hasKit } from "../exercises";
import { emptyProfile, type Profile } from "../profile";
import { estimateSeconds, type Session } from "../training";
import { adaptSession, NO_DOUBLING, PAIN_ADVICE } from "./adapt";
import { generatePlan } from "./plan";

const NOW = "2026-10-26T09:00:00.000Z";
const profile = (over: Partial<Profile> = {}): Profile => ({ ...emptyProfile(), goals: ["strength"], experience: "intermediate", minutes: 60, days: [0, 1, 3, 4], ...over });
const planFor = (p: Profile) => generatePlan(p, NOW);
const find = (p: Profile, pred: (s: Session) => boolean) => Object.values(planFor(p).sessions).find(pred)!;
const lowerDay = (p: Profile) => find(p, (s) => s.focus === "lower");
const mainCount = (s: Session) => s.exercises.filter((e) => e.role === "main").length;

describe("adaptSession", () => {
  it("leaves the session alone when nothing is wrong, and says so", () => {
    const p = profile();
    const s = lowerDay(p);
    const a = adaptSession(s, p, { energy: "high", sleep: "good", soreness: "none" });
    expect(a.kind).toBe("session");
    if (a.kind !== "session") return;
    expect(a.session.exercises).toEqual(s.exercises);
    expect(a.changes).toEqual([]);
    expect(a.advice.join(" ")).toMatch(/stick to the plan/);
  });

  it("fits a shorter time by trimming accessories first and keeping main lifts", () => {
    const p = profile();
    const s = lowerDay(p);
    const a = adaptSession(s, p, { minutes: 30 });
    if (a.kind !== "session") throw new Error("expected a session");
    expect(estimateSeconds(a.session)).toBeLessThanOrEqual(30 * 60);
    expect(mainCount(a.session)).toBe(mainCount(s));
    expect(a.session.exercises.some((e) => e.role === "accessory")).toBe(false);
    expect(a.changes.length).toBeGreaterThan(0);
  });

  it("keeps rest on main lifts at 2 minutes or more", () => {
    const p = profile();
    for (const s of Object.values(planFor(p).sessions)) {
      const a = adaptSession(s, p, { minutes: 20, quick: true });
      if (a.kind !== "session") continue;
      for (const e of a.session.exercises) if (e.role === "main" && !e.durationMin) expect(e.restSec).toBeGreaterThanOrEqual(120);
    }
  });

  it("builds a quick workout of 15 minutes around one main lift", () => {
    const p = profile();
    const s = find(p, (x) => x.focus === "upper");
    const a = adaptSession(s, p, { quick: true, minutes: 15 });
    if (a.kind !== "session") throw new Error("expected a session");
    expect(mainCount(a.session)).toBeGreaterThanOrEqual(1);
    expect(a.changes.join(" ")).toMatch(/main lift/);
  });

  it("uses only the kit available at home, with swaps that keep the movement", () => {
    const p = profile();
    const s = lowerDay(p);
    const kit = ["dumbbells" as const];
    const a = adaptSession(s, p, { kit });
    if (a.kind !== "session") throw new Error("expected a session");
    for (const e of a.session.exercises) expect(hasKit(EXERCISE_BY_ID[e.exerciseId], kit), e.name).toBe(true);
    const squat = a.session.exercises.find((e) => e.role === "main")!;
    expect(EXERCISE_BY_ID[squat.exerciseId].pattern).toBe("squat");
    expect(a.changes.join(" ")).toMatch(/instead of/);
  });

  it("works with no equipment at all, leaving out what can't be done and saying why", () => {
    const p = profile();
    const s = find(p, (x) => x.focus === "upper");
    const a = adaptSession(s, p, { kit: [] });
    if (a.kind !== "session") throw new Error("expected a session");
    for (const e of a.session.exercises) expect(hasKit(EXERCISE_BY_ID[e.exerciseId], []), e.name).toBe(true);
    expect(mainCount(a.session)).toBeGreaterThanOrEqual(1);
    expect(a.changes.some((c) => c.startsWith("Left out"))).toBe(true);
  });

  it("lowers volume when energy is low, keeping every exercise and at least 2 sets", () => {
    const p = profile();
    const s = lowerDay(p);
    const a = adaptSession(s, p, { energy: "low" });
    if (a.kind !== "session") throw new Error("expected a session");
    expect(a.session.exercises.map((e) => e.exerciseId)).toEqual(s.exercises.map((e) => e.exerciseId));
    a.session.exercises.forEach((e, i) => {
      expect(e.sets).toBeLessThanOrEqual(s.exercises[i].sets);
      expect(e.sets).toBeGreaterThanOrEqual(2);
    });
    expect(a.changes[0]).toMatch(/low on energy/);
  });

  it("turns intervals into an easy run when tired", () => {
    const p = profile({ goals: ["running"], days: [0, 2, 4, 6] });
    const s = find(p, (x) => x.name === "Intervals");
    const a = adaptSession(s, p, { sleep: "poor" });
    if (a.kind !== "session") throw new Error("expected a session");
    expect(a.session.hard).toBe(false);
    expect(a.session.exercises[0].exerciseId).toBe("run-easy");
  });

  it("eases back in after time away", () => {
    const p = profile();
    const s = lowerDay(p);
    const a = adaptSession(s, p, { away: "month" });
    if (a.kind !== "session") throw new Error("expected a session");
    expect(a.session.exercises.some((e) => e.role === "accessory")).toBe(false);
    expect(a.session.exercises.reduce((n, e) => n + e.sets, 0)).toBeLessThan(s.exercises.reduce((n, e) => n + e.sets, 0) * 0.6);
  });

  it("swaps exercises away from a painful area and always gives the advice", () => {
    const p = profile();
    const s = find(p, (x) => x.focus === "lower" && x.exercises[0].exerciseId === "deadlift");
    const a = adaptSession(s, p, { pain: ["lower-back"] });
    expect(a.advice).toContain(PAIN_ADVICE);
    if (a.kind !== "session") throw new Error("expected a session");
    for (const e of a.session.exercises) expect(EXERCISE_BY_ID[e.exerciseId].stress).not.toContain("lower-back");
  });

  it("only reports swaps that stay in the session, and around pain only swaps the same movement", () => {
    const p = profile();
    const s = find(p, (x) => x.focus === "upper");
    const a = adaptSession(s, p, { pain: ["shoulders"], energy: "low", minutes: 30 });
    if (a.kind !== "session") throw new Error("expected a session");
    const names = a.session.exercises.map((e) => e.name);
    for (const c of a.changes.filter((x) => x.includes(" instead of "))) expect(names.some((n) => c.startsWith(n)), c).toBe(true);
    for (const e of a.session.exercises.filter((x) => x.swappedFrom)) {
      const from = s.exercises.find((x) => x.name === e.swappedFrom)!;
      expect(EXERCISE_BY_ID[e.exerciseId].pattern).toBe(EXERCISE_BY_ID[from.exerciseId].pattern);
    }
  });

  it("never trains through sharp or unexplained pain", () => {
    const p = profile();
    const s = lowerDay(p);
    for (const req of [{ pain: ["knees" as const], painSharp: true }, { painElsewhere: true }]) {
      const a = adaptSession(s, p, req);
      expect(a.kind).toBe("rest");
      expect(a.advice).toContain(PAIN_ADVICE);
    }
  });

  it("keeps a knee-friendly lower session when the knees hurt", () => {
    const p = profile();
    const a = adaptSession(lowerDay(p), p, { pain: ["knees"] });
    if (a.kind !== "session") throw new Error("expected a session");
    expect(mainCount(a.session)).toBe(1);
    for (const e of a.session.exercises) expect(EXERCISE_BY_ID[e.exerciseId].stress).not.toContain("knees");
    expect(a.session.purpose).toMatch(/knees/);
  });

  it("rests rather than runs on painful knees", () => {
    const p = profile({ goals: ["running"], days: [0, 2, 4, 6] });
    const s = find(p, (x) => x.focus === "run");
    expect(adaptSession(s, p, { pain: ["knees"] }).kind).toBe("rest");
  });

  it("never doubles up: a rest day promises the next session stays as planned", () => {
    const p = profile();
    const a = adaptSession(lowerDay(p), p, { rest: true });
    expect(a.kind).toBe("rest");
    expect(a.advice).toContain(NO_DOUBLING);
  });

  it("never adds work: an adapted session has no more sets or minutes than planned", () => {
    const requests = [{ energy: "low" as const }, { minutes: 30 }, { kit: [] }, { away: "1-2w" as const }, { pain: ["shoulders" as const] }, { quick: true }];
    for (const p of [profile(), profile({ goals: ["muscle", "race"], race: "10k" as const, days: [0, 1, 2, 4, 5] })]) {
      for (const s of Object.values(planFor(p).sessions)) {
        for (const req of requests) {
          const a = adaptSession(s, p, req);
          if (a.kind !== "session") continue;
          expect(estimateSeconds(a.session), `${s.name} ${JSON.stringify(req)}`).toBeLessThanOrEqual(estimateSeconds(s));
          expect(a.session.exercises.length).toBeLessThanOrEqual(s.exercises.length);
        }
      }
    }
  });
});
