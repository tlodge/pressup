import { describe, expect, it } from "vitest";
import { emptyProfile, type Profile } from "../profile";
import { estimateMinutes, type Weekday } from "../training";
import { generatePlan } from "./plan";
import { missedOptions, missedSessions, moveOptions, planAroundWeek, type Week } from "./schedule";

const NOW = "2026-10-26T09:00:00.000Z";
const weekFor = (over: Partial<Profile>): Week => {
  const plan = generatePlan({ ...emptyProfile(), goals: ["strength"], experience: "intermediate", minutes: 60, ...over }, NOW);
  return { days: plan.days, sessions: plan.sessions, skipped: [], busy: {} };
};
const nameOn = (w: Week, d: number) => {
  const e = w.days.find((x) => x.weekday === d && !w.skipped.includes(x.sessionId));
  return e ? w.sessions[e.sessionId].name : null;
};
const idOf = (w: Week, name: string) => Object.keys(w.sessions).find((k) => w.sessions[k].name === name)!;
const legDays = (w: Week) => w.days.filter((d) => !w.skipped.includes(d.sessionId) && w.sessions[d.sessionId].legLoad === 2 && w.sessions[d.sessionId].focus !== "run").map((d) => d.weekday);
const noBackToBackLegs = (w: Week) => legDays(w).every((d) => !legDays(w).includes((d + 1) as Weekday));

describe("moveOptions", () => {
  // Upper A Mon, Lower A Tue, Upper B Thu, Lower B Fri
  const week = weekFor({ days: [0, 1, 3, 4] });

  it("never offers a day that's gone, a day with a session, or a day already trained", () => {
    const opts = moveOptions(week, idOf(week, "Upper B"), 2, [2]);
    expect(opts.map((o) => o.weekday)).toEqual([2, 4, 5, 6]);
    expect(opts.find((o) => o.weekday === 2)?.ok).toBe(false);
    expect(opts.find((o) => o.weekday === 4)?.ok).toBe(false);
  });

  it("refuses to put two hard leg days back to back, and says why", () => {
    const opts = moveOptions(week, idOf(week, "Lower B"), 0, []);
    const wed = opts.find((o) => o.weekday === 2)!;
    expect(wed.ok).toBe(false);
    expect(wed.reason).toMatch(/Lower A is on Tuesday.*back to back/);
    const sat = opts.find((o) => o.weekday === 5)!;
    expect(sat.ok).toBe(true);
    expect(sat.change?.summary).toBe("Lower B moves from Friday to Saturday.");
    expect(noBackToBackLegs(sat.change!.week)).toBe(true);
  });

  it("fits a session to a short day and refuses a busy one", () => {
    const busy: Week = { ...week, busy: { 5: "short", 6: "busy" } };
    const opts = moveOptions(busy, idOf(week, "Upper B"), 0, []);
    expect(opts.find((o) => o.weekday === 6)?.ok).toBe(false);
    const sat = opts.find((o) => o.weekday === 5)!;
    expect(estimateMinutes(sat.change!.week.sessions[idOf(week, "Upper B")])).toBeLessThanOrEqual(30);
  });
});

describe("missed sessions", () => {
  const week = weekFor({ days: [0, 1, 3, 4] });

  it("finds planned days that have gone without a workout", () => {
    expect(missedSessions(week, 3, [0])).toEqual([{ weekday: 1, sessionId: idOf(week, "Lower A") }]);
  });

  it("offers to move, fold or skip, and skipping never adds work elsewhere", () => {
    const { moves, folds, skip } = missedOptions(week, idOf(week, "Lower A"), 2, [0], 60);
    expect(moves.some((m) => m.ok)).toBe(true);
    expect(skip.week.skipped).toContain(idOf(week, "Lower A"));
    expect(skip.week.sessions).toEqual(week.sessions);
    expect(skip.reasons.join(" ")).toMatch(/Nothing is doubled up/);
    // Lower A's squat can't go into Lower B (already squats or hinges) without a back-to-back clash or overlap
    for (const f of folds.filter((x) => x.ok)) expect(noBackToBackLegs(f.change!.week)).toBe(true);
  });

  it("folds main lifts into a later session without making it longer", () => {
    const w = weekFor({ days: [0, 2, 4] }); // full-body days are beginner only, so use upper/lower/full for intermediates
    const missedId = w.days[0].sessionId;
    const { folds } = missedOptions(w, missedId, 2, [], 60);
    const ok = folds.find((f) => f.ok);
    expect(ok).toBeDefined();
    const target = ok!.change!.week.sessions[w.days.find((d) => d.weekday === ok!.weekday)!.sessionId];
    expect(estimateMinutes(target)).toBeLessThanOrEqual(Math.max(60, estimateMinutes(w.sessions[w.days.find((d) => d.weekday === ok!.weekday)!.sessionId])));
    expect(target.exercises.some((e) => e.cue?.startsWith("From "))).toBe(true);
    expect(ok!.change!.week.skipped).toContain(missedId);
  });
});

describe("planAroundWeek", () => {
  const week = weekFor({ days: [0, 1, 3, 4] });

  it("moves sessions off busy days onto free ones, keeping hard leg days apart", () => {
    const c = planAroundWeek(week, { 3: "busy", 4: "busy" }, 2, []);
    expect(nameOn(c.week, 3)).toBeNull();
    expect(nameOn(c.week, 4)).toBeNull();
    expect(c.week.days.filter((d) => !c.week.skipped.includes(d.sessionId))).toHaveLength(4);
    expect(noBackToBackLegs(c.week)).toBe(true);
    expect(c.reasons.length).toBeGreaterThan(0);
  });

  it("skips the least important sessions when there aren't enough free days, never doubling up", () => {
    const c = planAroundWeek(week, { 2: "busy", 3: "busy", 4: "busy", 5: "busy" }, 2, []);
    const used = c.week.days.filter((d) => !c.week.skipped.includes(d.sessionId)).map((d) => d.weekday);
    expect(new Set(used).size).toBe(used.length);
    expect(c.week.skipped.length).toBe(1);
    expect(c.reasons.join(" ")).toMatch(/doubling up/);
  });

  it("leaves the week alone when nothing clashes", () => {
    const c = planAroundWeek(week, { 2: "busy" }, 0, []);
    expect(c.summary).toBe("No changes needed.");
    expect(c.week.days).toEqual(week.days);
  });

  it("fits sessions on short days", () => {
    const c = planAroundWeek(week, { 2: "busy", 3: "short", 5: "busy", 6: "busy" }, 2, []);
    const thu = c.week.days.find((d) => d.weekday === 3);
    if (thu) expect(estimateMinutes(c.week.sessions[thu.sessionId])).toBeLessThanOrEqual(30);
  });
});
