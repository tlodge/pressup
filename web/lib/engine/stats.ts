/* What the logs say about progress. Trends over noise: strength is the best estimated one-rep max of each week, not
   every set; consistency counts weeks, not single days; and nothing here looks at body weight. */
import type { Goal, Profile } from "../profile";
import type { WeekPlan } from "../training";
import { weekDates } from "../use-today";
import { doneSets, type WorkoutLog } from "../workout-log";
import { personalBests } from "./progress";

export const WEEKS = 8;

const finished = (logs: WorkoutLog[]) => logs.filter((l) => l.finishedAt).sort((a, b) => a.startedAt.localeCompare(b.startedAt));

/** Mondays of the last `n` weeks, oldest first, ending with this week. */
export function weekStarts(today: Date, n = WEEKS): string[] {
  return Array.from({ length: n }, (_, i) => weekDates(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7 * (n - 1 - i)))[0]);
}
const weekOf = (date: string) => weekDates(new Date(`${date}T12:00:00`))[0];

/** Estimated one-rep max (Epley). Sets above 12 reps say little about strength, so they don't count. */
export const e1rm = (kg: number, reps: number) => (reps >= 1 && reps <= 12 ? kg * (1 + reps / 30) : 0);

export type WeekCount = { week: string; done: number; planned: number };

/** Sessions done each week against the plan, and the run of weeks with at least one workout. */
export function consistency(logs: WorkoutLog[], plan: WeekPlan, today: Date, n = WEEKS) {
  const starts = weekStarts(today, n);
  const days = new Map<string, Set<string>>();
  for (const l of finished(logs)) {
    const w = weekOf(l.date);
    days.set(w, (days.get(w) ?? new Set()).add(l.date));
  }
  const weeks: WeekCount[] = starts.map((week) => ({ week, done: days.get(week)?.size ?? 0, planned: plan.days.length }));
  // The streak counts back from last week; this week joins it once it has a workout, so a new week never breaks it.
  let streak = 0;
  const all = [...days.keys()].sort();
  const thisWeek = starts[starts.length - 1];
  let cursor = days.has(thisWeek) ? thisWeek : shiftWeek(thisWeek, -1);
  while (days.has(cursor)) {
    streak += 1;
    cursor = shiftWeek(cursor, -1);
  }
  // "Hit the plan" counts finished weeks since the first workout, so the weeks before someone started don't count against them.
  const complete = weeks.slice(0, -1).filter((w) => all.length && w.week >= all[0]);
  const hit = complete.filter((w) => w.done >= w.planned).length;
  return { weeks, streak, hit, of: complete.length, average: complete.length ? complete.reduce((n, w) => n + w.done, 0) / complete.length : 0 };
}

const shiftWeek = (monday: string, by: number) => {
  const d = new Date(`${monday}T12:00:00`);
  return weekDates(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7 * by))[0];
};

export type LiftTrend = { exerciseId: string; name: string; points: { week: string; value: number }[]; latest: number; change: number; sessions: number };

/** Weekly best estimated max for the most-trained weighted lifts, main lifts first. Needs two weeks of data to count. */
export function liftTrends(logs: WorkoutLog[], today: Date, n = WEEKS, limit = 4): LiftTrend[] {
  const starts = weekStarts(today, n);
  const byLift = new Map<string, { name: string; main: boolean; sessions: number; best: Map<string, number> }>();
  for (const l of finished(logs)) {
    const w = weekOf(l.date);
    if (!starts.includes(w)) continue;
    for (const ex of l.exercises) {
      if (!ex.weighted) continue;
      const best = Math.max(0, ...doneSets(ex).map((s) => e1rm(s.weight ?? 0, s.reps)));
      if (!best) continue;
      const entry = byLift.get(ex.exerciseId) ?? { name: ex.name, main: false, sessions: 0, best: new Map() };
      entry.main ||= ex.role === "main";
      entry.sessions += 1;
      entry.best.set(w, Math.max(entry.best.get(w) ?? 0, best));
      byLift.set(ex.exerciseId, entry);
    }
  }
  return [...byLift.entries()]
    .filter(([, v]) => v.best.size >= 2)
    .sort(([, a], [, b]) => Number(b.main) - Number(a.main) || b.sessions - a.sessions)
    .slice(0, limit)
    .map(([exerciseId, v]) => {
      const points = starts.filter((w) => v.best.has(w)).map((week) => ({ week, value: Math.round(v.best.get(week)! * 2) / 2 }));
      return { exerciseId, name: v.name, points, latest: points[points.length - 1].value, change: points[points.length - 1].value - points[0].value, sessions: v.sessions };
    });
}

/** Each exercise's latest new best, newest first. Accessories are left out: a rep more on a plank isn't news. */
export function bestsTimeline(logs: WorkoutLog[], limit = 8) {
  const all = finished(logs);
  const seen = new Set<string>();
  return all
    .flatMap((log, i) => personalBests(log, all.slice(0, i))
      .filter((b) => log.exercises.find((e) => e.exerciseId === b.exerciseId)?.role !== "accessory")
      .map((b) => ({ ...b, date: log.date, logId: log.id })))
    .reverse()
    .filter((b) => !seen.has(b.exerciseId) && seen.add(b.exerciseId))
    .slice(0, limit);
}

export type RunWeek = { week: string; minutes: number; km: number; runs: number };

/** Running by week: time, distance where it was logged, and pace from the runs that have both. */
export function running(logs: WorkoutLog[], today: Date, n = WEEKS) {
  const starts = weekStarts(today, n);
  const runs = finished(logs).filter((l) => l.timed && starts.includes(weekOf(l.date)));
  const weeks: RunWeek[] = starts.map((week) => {
    const these = runs.filter((r) => weekOf(r.date) === week);
    return { week, minutes: these.reduce((m, r) => m + r.timed!.minutes, 0), km: Math.round(these.reduce((k, r) => k + (r.timed!.distanceKm ?? 0), 0) * 10) / 10, runs: these.length };
  });
  const paced = runs.filter((r) => r.timed!.distanceKm).map((r) => ({ date: r.date, pace: r.timed!.minutes / r.timed!.distanceKm! }));
  // Pace trend: the last four weeks' average against the four before, so one slow run doesn't read as a slump.
  const half = starts[Math.floor(n / 2)];
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const recent = avg(paced.filter((p) => weekOf(p.date) >= half).map((p) => p.pace));
  const before = avg(paced.filter((p) => weekOf(p.date) < half).map((p) => p.pace));
  return {
    weeks, count: runs.length, paced,
    longest: runs.reduce((m, r) => Math.max(m, r.timed!.minutes), 0),
    pace: recent ?? before, paceChange: recent !== null && before !== null ? recent - before : null,
  };
}

/** "5:24 /km" from minutes per km. */
export const fmtPace = (minPerKm: number) => `${Math.floor(minPerKm)}:${String(Math.round((minPerKm % 1) * 60)).padStart(2, "0")}`;

type MilestoneDef = { id: string; label: string; exerciseId: string; reps: number; level?: "pushUps" | "pullUps" };
const MILESTONES: MilestoneDef[] = [
  { id: "push-10", label: "10 push-ups in a row", exerciseId: "push-up", reps: 10, level: "pushUps" },
  { id: "push-20", label: "20 push-ups in a row", exerciseId: "push-up", reps: 20, level: "pushUps" },
  { id: "pull-1", label: "Your first strict pull-up", exerciseId: "pull-up", reps: 1, level: "pullUps" },
  { id: "pull-5", label: "5 pull-ups in a row", exerciseId: "pull-up", reps: 5, level: "pullUps" },
  { id: "pull-10", label: "10 pull-ups in a row", exerciseId: "pull-up", reps: 10, level: "pullUps" },
  { id: "dip-1", label: "Your first parallel bar dip", exerciseId: "dip", reps: 1 },
  { id: "dip-10", label: "10 dips in a row", exerciseId: "dip", reps: 10 },
  { id: "pike-10", label: "10 pike push-ups", exerciseId: "pike-push-up", reps: 10 },
  { id: "plank-60", label: "A 60-second plank", exerciseId: "plank", reps: 60 },
  { id: "hollow-30", label: "A 30-second hollow hold", exerciseId: "hollow-hold", reps: 30 },
];

/** Bodyweight skill milestones: done (with the date, or "before you started" from onboarding) or still to come. */
export function milestones(logs: WorkoutLog[], profile: Profile) {
  const all = finished(logs);
  return MILESTONES.map((m) => {
    const first = all.find((l) => l.exercises.some((e) => e.exerciseId === m.exerciseId && doneSets(e).some((s) => s.reps >= m.reps)));
    const before = m.level ? (profile.level[m.level] ?? 0) >= m.reps : false;
    return { id: m.id, label: m.label, done: !!first || before, date: first?.date, before: !first && before };
  });
}

/** Whether the bodyweight milestones are worth showing: the goal is calisthenics, or the user does bodyweight work. */
export const showsMilestones = (profile: Profile, logs: WorkoutLog[]) =>
  profile.goals.includes("calisthenics") || profile.preferred.includes("calisthenics") || logs.some((l) => l.exercises.some((e) => !e.weighted && doneSets(e).length));

export type GoalProgress = { goal: Goal; value: string; unit?: string; text: string };

/** One headline number for the primary goal, in plain words. Never body weight. */
export function goalProgress(profile: Profile, logs: WorkoutLog[], plan: WeekPlan, today: Date): GoalProgress | null {
  const goal = profile.goals[0];
  if (!goal || !finished(logs).length) return null;
  const c = consistency(logs, plan, today);
  const lifts = liftTrends(logs, today);
  if (goal === "strength" || goal === "muscle") {
    const gained = lifts.reduce((n, l) => n + l.change, 0);
    if (lifts.length) {
      return { goal, value: `${gained >= 0 ? "+" : ""}${Math.round(gained)}`, unit: "kg", text: `Combined change in estimated max across ${lifts.map((l) => l.name.toLowerCase()).join(", ")} over the last ${WEEKS} weeks.` };
    }
  }
  if (goal === "running" || goal === "race") {
    const r = running(logs, today);
    const target = goal === "race" ? ({ "5k": 40, "10k": 60, half: 90 } as const)[profile.race ?? "5k"] : 0;
    if (r.count) {
      return target
        ? { goal, value: `${r.longest}`, unit: `of ${target} min`, text: `Your longest run so far, against the long run a ${profile.race === "half" ? "half marathon" : (profile.race ?? "5k").toUpperCase()} usually needs.` }
        : { goal, value: `${Math.round(r.weeks.reduce((m, w) => m + w.minutes, 0) / WEEKS)}`, unit: "min a week", text: `Average running time over the last ${WEEKS} weeks.` };
    }
  }
  if (goal === "calisthenics") {
    const m = milestones(logs, profile);
    return { goal, value: `${m.filter((x) => x.done).length}`, unit: `of ${m.length}`, text: "Bodyweight milestones reached." };
  }
  return {
    goal, value: c.streak ? `${c.streak}` : `${c.weeks[c.weeks.length - 1].done}`, unit: c.streak ? `week${c.streak === 1 ? "" : "s"}` : "this week",
    text: c.streak ? "In a row with at least one workout. That's the habit doing its job." : "Workouts logged this week.",
  };
}
