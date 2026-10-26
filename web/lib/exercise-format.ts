import type { Exercise } from "./exercises";
import { EQUIPMENT, labelOf } from "./profile";

/** The kit an exercise needs, in words: "Dumbbells and bench", "Dumbbells or kettlebell", "No equipment". */
export function kitLabel(e: Exercise): string {
  const kits = e.kits.map((k) => (k.length ? k.map((x) => labelOf(EQUIPMENT, x).toLowerCase()).join(" and ") : "no equipment"));
  const text = kits.join(" or ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
