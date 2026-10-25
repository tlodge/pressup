/* Core training types and the session-length estimate the adaptive engine will build on. */

/** How much an exercise matters to the session's purpose. The engine trims accessories first, then secondary work, and keeps main lifts. */
export type Role = "main" | "secondary" | "accessory";

export type Prescription = {
  exerciseId: string;
  name: string;
  muscles: string[];
  role: Role;
  sets: number;
  /** Reps per set as written for people: "8", "8–10", "30 s". */
  reps: string;
  /** Working load as written: "82.5 kg", "Bodyweight". */
  load?: string;
  restSec: number;
};

export type Session = {
  id: string;
  name: string;
  focus: "lower" | "upper" | "full" | "run" | "mobility";
  /** One line on what the session is for, kept when the session is shortened. */
  purpose: string;
  exercises: Prescription[];
};

/** Monday = 0 … Sunday = 6, matching a UK week. */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type WeekPlan = { days: { weekday: Weekday; sessionId: string }[]; sessions: Record<string, Session> };

const WARM_UP_SEC = 5 * 60;
const WORK_PER_SET_SEC = 45;
const CHANGEOVER_SEC = 60;

/** Estimated minutes for a session: warm-up, working sets, rest between sets and changeovers, rounded to 5 minutes. */
export function estimateMinutes(session: Session): number {
  const work = session.exercises.reduce((sum, e) => sum + e.sets * WORK_PER_SET_SEC + (e.sets - 1) * e.restSec, 0);
  const changeovers = Math.max(0, session.exercises.length - 1) * CHANGEOVER_SEC;
  return Math.max(5, Math.round((WARM_UP_SEC + work + changeovers) / 300) * 5);
}

export function detail(p: Prescription): string {
  return [`${p.sets} × ${p.reps}`, p.load].filter(Boolean).join(" · ");
}

/** Monday-based weekday for a date. */
export function weekdayOf(date: Date): Weekday {
  return ((date.getDay() + 6) % 7) as Weekday;
}

export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
