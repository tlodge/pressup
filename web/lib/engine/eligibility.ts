/* Whether a user can safely be given an exercise. Shared by plan generation and substitutions so both apply the same rules. */
import { hasKit, type Exercise } from "../exercises";
import { BODY_AREAS, EQUIPMENT, labelOf, type Profile } from "../profile";

export type Blocker = { kind: "kit" | "avoid" | "excluded" | "level"; text: string };

export const maxLevel = (p: Profile) => (p.experience === "beginner" ? 2 : 3);

/** Null when the exercise is fine for this user, otherwise the first reason it isn't. */
export function blocker(e: Exercise, p: Profile): Blocker | null {
  if (p.excluded.includes(e.id)) return { kind: "excluded", text: "You've left this out" };
  const area = e.stress.find((a) => p.avoid.includes(a));
  if (area) return { kind: "avoid", text: `Loads your ${labelOf(BODY_AREAS, area).toLowerCase()}` };
  if (!hasKit(e, p.equipment)) {
    const kit = [...e.kits].sort((a, b) => a.length - b.length)[0] ?? [];
    const missing = kit.filter((k) => !p.equipment.includes(k)).map((k) => labelOf(EQUIPMENT, k).toLowerCase());
    return { kind: "kit", text: `Needs ${missing.join(" and ")}` };
  }
  // A beginner who can already do 5 pull-ups is ready for them.
  const ready = e.id === "pull-up" && (p.level.pullUps ?? 0) >= 5;
  if (!ready && e.level > maxLevel(p)) return { kind: "level", text: "Advanced: build up to it first" };
  return null;
}
