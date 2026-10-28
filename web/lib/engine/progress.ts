/* Progressive overload with fixed rules. Each exercise's target comes from the last time it was done:
   - Hit every rep with reps to spare: progress. Main lifts add weight. Other weighted exercises add a rep per set,
     up to 2 above the plan, then add weight and drop back. Bodyweight exercises add a rep (or 5 seconds on holds).
   - Hit every rep but it was all-out: hold, and repeat until it feels easier.
   - Missed a few reps: hold. Missed a lot, or missed twice in a row: reduce the weight by about 10% and build back up.
   Lighter, adapted days never raise a target, and the first time an exercise is done the user picks a starting weight. */
import { EXERCISE_BY_ID, type Exercise } from "../exercises";
import { GUIDES } from "../exercise-guide";
import type { Equipment } from "../profile";
import type { Prescription, Session } from "../training";
import { doneSets, fmtKg, type ExerciseLog, type SetLog, type Target, type WorkoutLog } from "../workout-log";

/** The first number in a prescription: "8 each" → 8, "45 s" → 45. */
export const baseReps = (p: Prescription) => parseInt(p.reps, 10) || 8;
export const isHold = (p: Prescription) => /\d+\s*s\b/.test(p.reps);

/** Kit that adds load. A bar, bands, a box or a bench only make an exercise possible, so those exercises go by reps. */
const LOAD_KIT: Equipment[] = ["barbell", "dumbbells", "kettlebell", "cable", "machine"];
export const isWeighted = (e: Exercise | undefined) => !!e && e.kits.some((k) => k.some((i) => LOAD_KIT.includes(i)));

/** Kilograms per jump, from the kit the user will use: the smallest sensible plate or dumbbell jump. */
export function weightStep(e: Exercise | undefined, equipment: readonly Equipment[]): number {
  if (!e) return 2.5;
  const kit = e.kits.find((k) => k.length && k.every((i) => equipment.includes(i))) ?? e.kits.find((k) => k.length) ?? [];
  if (kit.includes("barbell")) return 2.5;
  if (kit.includes("dumbbells") || kit.includes("kettlebell")) return 2;
  return 2.5;
}

/** How much a main lift goes up after a successful session: lower-body barbell lifts move faster. */
const mainJump = (e: Exercise | undefined, step: number) => (e && step === 2.5 && (e.pattern === "squat" || e.pattern === "hinge") && e.kits.some((k) => k.includes("barbell")) ? 5 : step);

const roundTo = (kg: number, step: number) => Math.max(step, Math.round(kg / step) * step);

type Outcome = { log: WorkoutLog; ex: ExerciseLog; met: boolean; ratio: number; weight?: number };

function outcome(log: WorkoutLog, ex: ExerciseLog): Outcome {
  const done = doneSets(ex);
  const met = done.length >= ex.sets.length && done.every((s) => s.reps >= ex.target.reps);
  const ratio = done.reduce((n, s) => n + Math.min(s.reps, ex.target.reps), 0) / (ex.sets.length * ex.target.reps || 1);
  const weights = done.map((s) => s.weight ?? 0).filter((w) => w > 0);
  return { log, ex, met, ratio, weight: weights.length ? Math.max(...weights) : undefined };
}

/** Past attempts at an exercise with at least one set done, newest first. */
function attempts(exerciseId: string, history: WorkoutLog[]): Outcome[] {
  return history
    .filter((l) => l.finishedAt)
    .flatMap((l) => l.exercises.filter((e) => e.exerciseId === exerciseId && doneSets(e).length).map((e) => outcome(l, e)))
    .sort((a, b) => b.log.startedAt.localeCompare(a.log.startedAt));
}

export type Plan = { target: Target; previous?: SetLog[]; weighted: boolean; step: number; unit: "reps" | "sec" };

/** This session's target for one prescription, given everything logged before. */
export function nextTarget(p: Prescription, history: WorkoutLog[], equipment: readonly Equipment[], light = false): Plan {
  const e = EXERCISE_BY_ID[p.exerciseId];
  const weighted = isWeighted(e);
  const step = weightStep(e, equipment);
  const unit = isHold(p) ? "sec" : "reps";
  const base = baseReps(p);
  const add = unit === "sec" ? 5 : 1;
  const all = attempts(p.exerciseId, history);
  const normal = all.filter((a) => !a.log.light);
  const ref = normal[0] ?? all[0];
  const plan = (target: Target): Plan => ({ target, previous: ref?.ex.sets, weighted, step, unit });

  if (!ref) {
    return plan({
      reps: base, kind: "start",
      reason: weighted ? "First time: pick a weight you could lift for 2 more reps than the target." : "First time: stop each set with 2 reps to spare.",
    });
  }

  const last = ref.ex.target.reps;
  const w = weighted ? ref.weight : undefined;
  const done = `${ref.ex.sets.length} × ${last}${unit === "sec" ? " s" : ""}${w ? ` at ${fmtKg(w)}` : ""}`;

  if (light) {
    return plan({ weight: w, reps: Math.min(base, last), kind: "hold", reason: "A lighter day: last time's weight with reps to spare, and no new target." });
  }
  if (ref.log.light) {
    return plan({ weight: w, reps: Math.max(base, last), kind: "hold", reason: "Last time was a lighter day, so the target stays where it was." });
  }

  if (ref.met) {
    if (ref.ex.effort === "max") {
      return plan({ weight: w, reps: last, kind: "hold", reason: `You hit ${done}, but it was all-out. Same again until it feels a little easier.` });
    }
    if (w) {
      if (p.role === "main") {
        const jump = mainJump(e, step);
        return plan({ weight: w + jump, reps: base, kind: "progress", reason: `You hit ${done}, so add ${fmtKg(jump)}.` });
      }
      if (last >= base + 2) {
        return plan({ weight: w + step, reps: base, kind: "progress", reason: `You hit ${done}, so add ${fmtKg(step)} and go back to ${base} reps.` });
      }
      return plan({ weight: w, reps: last + 1, kind: "progress", reason: `You hit ${done}. Add a rep to each set before adding weight.` });
    }
    const harder = GUIDES[p.exerciseId]?.harder?.[0];
    const ready = last + add >= base + 5 * add && harder ? ` When that feels easy, try ${EXERCISE_BY_ID[harder]?.name.toLowerCase() ?? "a harder version"}.` : "";
    return plan({ reps: last + add, kind: "progress", reason: `You hit ${done}, so add ${unit === "sec" ? "5 seconds" : "a rep"}.${ready}` });
  }

  // Missed reps. Twice in a row at the same weight, or well short, means stepping back.
  const prev = normal[1];
  const twice = prev && !prev.met && prev.weight === w;
  if (ref.ratio >= 0.8 && !twice) {
    return plan({ weight: w, reps: last, kind: "hold", reason: "You got close last time. Same target again: it'll come." });
  }
  if (w) {
    const lighter = Math.max(step, Math.min(roundTo(w * 0.9, step), w - step));
    return plan({ weight: lighter, reps: base, kind: "reduce", reason: `${twice ? "Two tough sessions in a row" : "That was a tough one"}, so drop to ${fmtKg(lighter)} and build back up.` });
  }
  const achieved = Math.max(unit === "sec" ? 10 : 1, Math.floor(Math.min(...doneSets(ref.ex).map((s) => s.reps))));
  return plan({ reps: Math.min(last, achieved), kind: "reduce", reason: "Start from what you managed last time and build back up." });
}

/** New bests in a finished workout: a heavier weight than ever before, or more reps (or seconds) on bodyweight work. */
export function personalBests(log: WorkoutLog, history: WorkoutLog[]): { exerciseId: string; name: string; text: string }[] {
  const before = history.filter((l) => l.id !== log.id && l.finishedAt);
  return log.exercises.flatMap((ex) => {
    const done = doneSets(ex);
    const past = before.flatMap((l) => l.exercises.filter((e) => e.exerciseId === ex.exerciseId).flatMap(doneSets));
    if (!done.length || !past.length) return [];
    const best = (sets: SetLog[]) => (ex.weighted && sets.some((s) => s.weight) ? Math.max(...sets.map((s) => s.weight ?? 0)) : Math.max(...sets.map((s) => s.reps)));
    const now = best(done);
    if (now <= best(past)) return [];
    const byWeight = ex.weighted && done.some((s) => s.weight);
    return [{ exerciseId: ex.exerciseId, name: ex.name, text: byWeight ? `${fmtKg(now)}, your heaviest yet` : `${now}${ex.unit === "sec" ? " s" : " reps"}, your most yet` }];
  });
}


/** A new workout log for a session, with each exercise's target and its sets filled in from it. */
export function startLog(session: Session, sessionId: string, date: string, history: WorkoutLog[], equipment: readonly Equipment[], opts: { light?: boolean; adaptedLabel?: string; now?: string } = {}): WorkoutLog {
  const now = opts.now ?? new Date().toISOString();
  const timed = session.exercises.length > 0 && session.exercises.every((e) => e.durationMin);
  const first = session.exercises[0];
  return {
    id: `${date}-${sessionId}-${Date.parse(now).toString(36)}`,
    date, sessionId, name: session.name, startedAt: now, light: !!opts.light, adaptedLabel: opts.adaptedLabel,
    exercises: timed ? [] : session.exercises.map((p) => {
      const t = nextTarget(p, history, equipment, opts.light);
      const target = t.target;
      return {
        exerciseId: p.exerciseId, name: p.name, muscles: p.muscles, role: p.role, restSec: p.restSec, unit: t.unit, weighted: t.weighted, step: t.step,
        target, previous: t.previous, planned: p.reps, sets: Array.from({ length: p.sets }, () => ({ weight: target.weight, reps: target.reps, done: false })),
      };
    }),
    timed: timed ? { name: first.name, detail: first.reps, plannedMin: session.exercises.reduce((n, e) => n + (e.durationMin ?? 0), 0), minutes: session.exercises.reduce((n, e) => n + (e.durationMin ?? 0), 0) } : undefined,
  };
}
