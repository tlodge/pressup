/* Swaps that keep an exercise's training purpose.
   A swap must train the same movement pattern, or a closely related one that hits the same muscles.
   It is never a random exercise: the candidate list is closed, and anything the user can't do safely is marked unavailable. */
import { EXERCISES, EXERCISE_BY_ID, PATTERN_NAME, isBodyweight, type Exercise, type Pattern } from "../exercises";
import type { Profile } from "../profile";
import type { Prescription } from "../training";
import { blocker, type Blocker } from "./eligibility";

/** Related patterns that can stand in when the same pattern isn't possible. */
const RELATED: Record<Pattern, Pattern[]> = {
  squat: ["lunge"], lunge: ["squat"], hinge: ["glute", "ham-iso"], glute: ["hinge"], "quad-iso": ["squat", "lunge"], "ham-iso": ["hinge"], calves: [],
  "h-push": ["triceps"], "v-push": ["h-push"], "h-pull": ["v-pull"], "v-pull": ["h-pull"], shoulders: ["v-push"], biceps: ["v-pull", "h-pull"], triceps: ["h-push"], core: [],
};

export type Swap = { exercise: Exercise; reason: string; blocker: Blocker | null };

const overlap = (a: Exercise, b: Exercise) => a.muscles.filter((m) => b.muscles.includes(m));

/** Every sensible swap for an exercise, best first. Available swaps come before unavailable ones.
    `skip` holds ids already in the session, so a swap doesn't duplicate another exercise. */
export function findSwaps(exerciseId: string, profile: Profile, skip: string[] = []): Swap[] {
  const target = EXERCISE_BY_ID[exerciseId];
  if (!target) return [];
  const related = RELATED[target.pattern];
  const ranked = EXERCISES.filter((e) => e.id !== target.id && !skip.includes(e.id))
    .map((e) => {
      const same = e.pattern === target.pattern;
      const shared = overlap(e, target);
      if (!same && !(related.includes(e.pattern) && shared.length)) return null;
      const score = (same ? 100 : 0) + shared.length * 10 - Math.abs(e.level - target.level) * 3 + (profile.favourites.includes(e.id) ? 5 : 0);
      const reason = same ? `Same movement: ${PATTERN_NAME[e.pattern].toLowerCase()}` : `Also trains ${shared.join(" and ").toLowerCase()}`;
      return { exercise: e, reason, blocker: blocker(e, profile), score };
    })
    .filter((x): x is Swap & { score: number } => x !== null)
    .sort((a, b) => Number(!!a.blocker) - Number(!!b.blocker) || b.score - a.score);
  return ranked.map(({ exercise, reason, blocker: b }) => ({ exercise, reason, blocker: b }));
}

/** Only the swaps this user can do right now. */
export const availableSwaps = (exerciseId: string, profile: Profile, skip: string[] = []) =>
  findSwaps(exerciseId, profile, skip).filter((s) => !s.blocker);

/** Put a swap into a prescription. Sets, reps and rest stay as planned; the load is cleared because it belonged to the old exercise. */
export const applySwap = (p: Prescription, e: Exercise): Prescription => ({
  ...p, exerciseId: e.id, name: e.name, muscles: e.muscles, load: isBodyweight(e) && e.kits.length === 1 ? "Bodyweight" : undefined, swappedFrom: p.swappedFrom ?? p.name,
});
