/* What the user actually did: one log per workout, set by set. Kept on the device with the plan until milestone 8. */
import type { Role } from "./training";

/** How the last set of an exercise felt, as reps left in the tank: easy (3 or more), hard (1 or 2), all-out (none). */
export type Effort = "easy" | "hard" | "max";

export const EFFORT_LABEL: Record<Effort, string> = { easy: "Easy", hard: "Hard", max: "All-out" };
export const EFFORT_DETAIL: Record<Effort, string> = { easy: "3 or more reps left", hard: "1 or 2 reps left", max: "Nothing left" };

/** How hard the whole session felt, on the 1–10 effort scale. */
export const SESSION_EFFORT = [
  { value: 4, label: "Easy" },
  { value: 6, label: "Moderate" },
  { value: 8, label: "Hard" },
  { value: 9, label: "Very hard" },
  { value: 10, label: "All-out" },
] as const;

/** What the progression rules ask for this time, and why. */
export type Target = {
  /** Kilograms. Empty for bodyweight work, or the first time an exercise is done. */
  weight?: number;
  /** Reps per set, or seconds for holds. */
  reps: number;
  kind: "start" | "progress" | "hold" | "reduce";
  reason: string;
};

export type SetLog = { weight?: number; reps: number; done: boolean };

export type ExerciseLog = {
  exerciseId: string;
  name: string;
  muscles: string[];
  role: Role;
  restSec: number;
  /** Holds are logged in seconds. */
  unit: "reps" | "sec";
  /** False for bodyweight-only exercises, which have no weight column. */
  weighted: boolean;
  /** Kilograms the weight stepper moves by. */
  step: number;
  target: Target;
  /** The sets from the attempt the target was based on, shown as "Last time". */
  previous?: SetLog[];
  sets: SetLog[];
  effort?: Effort;
  /** The prescription as planned, for example "8 each", shown next to the target. */
  planned: string;
};

export type WorkoutLog = {
  id: string;
  /** Local date, YYYY-MM-DD. */
  date: string;
  sessionId: string;
  name: string;
  startedAt: string;
  finishedAt?: string;
  /** An adapted, lighter day (low energy, back after time away and so on). Its numbers don't raise targets. */
  light: boolean;
  adaptedLabel?: string;
  exercises: ExerciseLog[];
  /** Runs and conditioning: minutes planned and done, and the distance when the user logs it. */
  timed?: { name: string; detail: string; plannedMin: number; minutes: number; distanceKm?: number };
  effort?: number;
  notes?: string;
};

export const fmtKg = (kg: number) => `${Math.round(kg * 100) / 100} kg`;

/** "60 × 5", "12 reps", "45 s". */
export function fmtSet(s: SetLog, unit: ExerciseLog["unit"]) {
  const amount = unit === "sec" ? `${s.reps} s` : `${s.reps}`;
  return s.weight ? `${s.weight} × ${amount}` : unit === "sec" ? amount : `${amount} reps`;
}

export function fmtTarget(e: Pick<ExerciseLog, "sets" | "target" | "unit">) {
  const amount = e.unit === "sec" ? `${e.target.reps} s` : `${e.target.reps}`;
  return `${e.sets.length} × ${amount}${e.target.weight ? ` at ${fmtKg(e.target.weight)}` : ""}`;
}

export const doneSets = (e: ExerciseLog) => e.sets.filter((s) => s.done);
export const volumeKg = (log: WorkoutLog) => log.exercises.reduce((v, e) => v + doneSets(e).reduce((n, s) => n + (s.weight ?? 0) * s.reps, 0), 0);
export const durationMin = (log: WorkoutLog) => (log.finishedAt ? Math.max(1, Math.round((Date.parse(log.finishedAt) - Date.parse(log.startedAt)) / 60000)) : 0);
