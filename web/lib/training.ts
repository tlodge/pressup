/* Core training types and the session-length estimate the plan and adaptive engines build on. */

/** How much an exercise matters to the session's purpose. The engine trims accessories first, then secondary work, and keeps main lifts. */
export type Role = "main" | "secondary" | "accessory";

export type Prescription = {
  exerciseId: string;
  name: string;
  muscles: string[];
  role: Role;
  sets: number;
  /** Reps per set as written for people: "8", "8–10", "30 s", "25 min". */
  reps: string;
  /** Working load as written: "82.5 kg", "Bodyweight". Left empty until the first logged session sets it. */
  load?: string;
  restSec: number;
  /** For timed work such as runs: the whole block's length, used instead of the set-by-set estimate. */
  durationMin?: number;
  /** A short coaching cue, for example the pace of a run. */
  cue?: string;
  /** The planned exercise this one replaced, when the user swapped it. */
  swappedFrom?: string;
};

export type Focus = "lower" | "upper" | "full" | "push" | "pull" | "calisthenics" | "run" | "conditioning";

export type Session = {
  id: string;
  name: string;
  focus: Focus;
  /** One line on what the session is for, kept when the session is shortened. */
  purpose: string;
  exercises: Prescription[];
  /** 0 = little leg load, 1 = moderate, 2 = hard on the legs. Used to keep hard leg days apart. */
  legLoad: 0 | 1 | 2;
  /** Hard sessions (heavy lifting, intervals, long runs) need easier days around them. */
  hard: boolean;
};

/** Monday = 0 … Sunday = 6, matching a UK week. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type WeekPlan = {
  days: { weekday: Weekday; sessionId: string }[];
  sessions: Record<string, Session>;
  /** Plain-English reasons for how the week is laid out. */
  notes: string[];
  generatedAt: string;
};

const WARM_UP_SEC = 5 * 60;
const WORK_PER_SET_SEC = 45;
const CHANGEOVER_SEC = 60;

/** Estimated minutes for a session: warm-up, working sets, rest between sets and changeovers, rounded to 5 minutes.
    Timed blocks (runs) count their own length instead. */
export function estimateMinutes(session: Session): number {
  const timed = session.exercises.filter((e) => e.durationMin);
  const sets = session.exercises.filter((e) => !e.durationMin);
  const timedMin = timed.reduce((sum, e) => sum + (e.durationMin ?? 0), 0);
  if (!sets.length) return Math.max(5, Math.round(timedMin / 5) * 5);
  const work = sets.reduce((sum, e) => sum + e.sets * WORK_PER_SET_SEC + (e.sets - 1) * e.restSec, 0);
  const changeovers = Math.max(0, sets.length - 1) * CHANGEOVER_SEC;
  return Math.max(5, Math.round((WARM_UP_SEC + work + changeovers) / 300) * 5 + timedMin);
}

/** Exact estimate in seconds, used when fitting a session to a time limit. */
export function estimateSeconds(session: Session): number {
  const timed = session.exercises.reduce((sum, e) => sum + (e.durationMin ?? 0) * 60, 0);
  const sets = session.exercises.filter((e) => !e.durationMin);
  if (!sets.length) return timed;
  const work = sets.reduce((sum, e) => sum + e.sets * WORK_PER_SET_SEC + (e.sets - 1) * e.restSec, 0);
  return WARM_UP_SEC + work + Math.max(0, sets.length - 1) * CHANGEOVER_SEC + timed;
}

export function detail(p: Prescription): string {
  if (p.durationMin) return p.reps;
  return [`${p.sets} × ${p.reps}`, p.load].filter(Boolean).join(" · ");
}

/** Monday-based weekday for a date. */
export function weekdayOf(date: Date): Weekday {
  return ((date.getDay() + 6) % 7) as Weekday;
}

export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const WEEKDAY_LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;
