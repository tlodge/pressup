/* Fit a session into a time limit while keeping its purpose.
   Order of cuts: accessory sets, then accessory exercises, then secondary sets and exercises, then shorter
   (but still realistic) rest on main lifts, then a main set. Main lifts are never removed. */
import { estimateSeconds, type Prescription, type Session } from "../training";

const MIN_REST = { main: 120, secondary: 60, accessory: 45 } as const;
const MIN_SETS = { main: 3, secondary: 2, accessory: 2 } as const;

export type FitResult = { session: Session; changes: string[]; fits: boolean };

export function fitToTime(session: Session, minutes: number): FitResult {
  const limit = minutes * 60;
  let exercises: Prescription[] = session.exercises.map((e) => ({ ...e }));
  const changes: string[] = [];
  const over = () => estimateSeconds({ ...session, exercises }) > limit;
  const lastIndex = (pred: (e: Prescription) => boolean) => exercises.findLastIndex(pred);

  for (const role of ["accessory", "secondary"] as const) {
    while (over()) {
      const i = lastIndex((e) => e.role === role && !e.durationMin && e.sets > MIN_SETS[role]);
      if (i < 0) break;
      exercises[i].sets -= 1;
    }
    while (over()) {
      const i = lastIndex((e) => e.role === role);
      if (i < 0) break;
      changes.push(`Left out ${exercises[i].name} to fit ${minutes} minutes.`);
      exercises = exercises.filter((_, j) => j !== i);
    }
  }

  let restCut = false;
  while (over()) {
    const i = exercises.findIndex((e) => e.role === "main" && !e.durationMin && e.restSec - 30 >= MIN_REST.main);
    if (i < 0) break;
    exercises[i].restSec -= 30;
    restCut = true;
  }
  if (restCut) changes.push("Rest on the main lifts is a little shorter, but never under 2 minutes.");

  while (over()) {
    const i = lastIndex((e) => e.role === "main" && !e.durationMin && e.sets > MIN_SETS.main);
    if (i < 0) break;
    exercises[i].sets -= 1;
  }

  // Report set reductions once per exercise, comparing with the original.
  for (const e of exercises) {
    const before = session.exercises.find((o) => o.exerciseId === e.exerciseId);
    if (before && before.sets > e.sets) changes.push(`${e.name}: ${e.sets} sets instead of ${before.sets}.`);
  }

  const fitted = { ...session, exercises };
  return { session: fitted, changes, fits: estimateSeconds(fitted) <= limit };
}
