/* The exercise catalogue the plan engine picks from. Milestone 3 adds instructions, demonstrations and variations;
   the fields here are what the engine needs to choose safely: movement pattern, kit, level and joint stress. */
import type { BodyArea, Equipment } from "./profile";

export type Pattern =
  | "squat" | "hinge" | "lunge" | "glute" | "quad-iso" | "ham-iso" | "calves"
  | "h-push" | "v-push" | "h-pull" | "v-pull" | "shoulders" | "biceps" | "triceps" | "core";

export type Exercise = {
  id: string;
  name: string;
  pattern: Pattern;
  muscles: string[];
  /** Any one of these kits will do. An empty kit means no equipment. */
  kits: Equipment[][];
  /** 1 = beginner friendly, 2 = needs some practice, 3 = advanced. */
  level: 1 | 2 | 3;
  /** Joints this movement loads noticeably; left out for users avoiding that area. */
  stress: BodyArea[];
};

const BW: Equipment[][] = [[]];

export const EXERCISES: Exercise[] = [
  // Squat pattern
  { id: "back-squat", name: "Back squat", pattern: "squat", muscles: ["Quads", "Glutes"], kits: [["barbell", "rack"]], level: 2, stress: ["knees", "lower-back"] },
  { id: "front-squat", name: "Front squat", pattern: "squat", muscles: ["Quads", "Core"], kits: [["barbell", "rack"]], level: 3, stress: ["knees", "wrists"] },
  { id: "goblet-squat", name: "Goblet squat", pattern: "squat", muscles: ["Quads", "Glutes"], kits: [["dumbbells"], ["kettlebell"]], level: 1, stress: ["knees"] },
  { id: "leg-press", name: "Leg press", pattern: "squat", muscles: ["Quads", "Glutes"], kits: [["machine"]], level: 1, stress: ["knees"] },
  { id: "bodyweight-squat", name: "Bodyweight squat", pattern: "squat", muscles: ["Quads", "Glutes"], kits: BW, level: 1, stress: ["knees"] },
  // Hinge pattern
  { id: "deadlift", name: "Deadlift", pattern: "hinge", muscles: ["Hamstrings", "Glutes", "Back"], kits: [["barbell"]], level: 2, stress: ["lower-back"] },
  { id: "romanian-deadlift", name: "Romanian deadlift", pattern: "hinge", muscles: ["Hamstrings", "Glutes"], kits: [["barbell"], ["dumbbells"]], level: 2, stress: ["lower-back"] },
  { id: "kettlebell-swing", name: "Kettlebell swing", pattern: "hinge", muscles: ["Glutes", "Hamstrings"], kits: [["kettlebell"]], level: 2, stress: ["lower-back"] },
  { id: "single-leg-rdl", name: "Single-leg Romanian deadlift", pattern: "hinge", muscles: ["Hamstrings", "Glutes"], kits: [["dumbbells"], ["kettlebell"], []], level: 2, stress: [] },
  // Single leg
  { id: "bulgarian-split-squat", name: "Bulgarian split squat", pattern: "lunge", muscles: ["Quads", "Glutes"], kits: [["dumbbells", "bench"], ["bench"]], level: 2, stress: ["knees"] },
  { id: "walking-lunge", name: "Walking lunge", pattern: "lunge", muscles: ["Quads", "Glutes"], kits: [["dumbbells"], []], level: 1, stress: ["knees"] },
  { id: "reverse-lunge", name: "Reverse lunge", pattern: "lunge", muscles: ["Quads", "Glutes"], kits: [["dumbbells"], []], level: 1, stress: ["knees"] },
  { id: "step-up", name: "Step-up", pattern: "lunge", muscles: ["Quads", "Glutes"], kits: [["box"], ["bench"]], level: 1, stress: ["knees"] },
  // Glutes and isolation
  { id: "hip-thrust", name: "Hip thrust", pattern: "glute", muscles: ["Glutes"], kits: [["barbell", "bench"], ["dumbbells", "bench"]], level: 1, stress: [] },
  { id: "glute-bridge", name: "Glute bridge", pattern: "glute", muscles: ["Glutes", "Hamstrings"], kits: BW, level: 1, stress: [] },
  { id: "leg-extension", name: "Leg extension", pattern: "quad-iso", muscles: ["Quads"], kits: [["machine"]], level: 1, stress: ["knees"] },
  { id: "lying-leg-curl", name: "Lying leg curl", pattern: "ham-iso", muscles: ["Hamstrings"], kits: [["machine"]], level: 1, stress: [] },
  { id: "standing-calf-raise", name: "Standing calf raise", pattern: "calves", muscles: ["Calves"], kits: [["dumbbells"], []], level: 1, stress: [] },
  // Horizontal push
  { id: "bench-press", name: "Barbell bench press", pattern: "h-push", muscles: ["Chest", "Triceps"], kits: [["barbell", "bench"]], level: 2, stress: ["shoulders"] },
  { id: "dumbbell-bench-press", name: "Dumbbell bench press", pattern: "h-push", muscles: ["Chest", "Triceps"], kits: [["dumbbells", "bench"]], level: 1, stress: ["shoulders"] },
  { id: "incline-dumbbell-press", name: "Incline dumbbell press", pattern: "h-push", muscles: ["Chest", "Shoulders"], kits: [["dumbbells", "bench"]], level: 1, stress: ["shoulders"] },
  { id: "machine-chest-press", name: "Machine chest press", pattern: "h-push", muscles: ["Chest", "Triceps"], kits: [["machine"]], level: 1, stress: [] },
  { id: "push-up", name: "Push-up", pattern: "h-push", muscles: ["Chest", "Triceps"], kits: BW, level: 1, stress: ["wrists"] },
  { id: "dip", name: "Parallel bar dip", pattern: "h-push", muscles: ["Chest", "Triceps"], kits: [["dip-bars"]], level: 3, stress: ["shoulders"] },
  // Vertical push
  { id: "overhead-press", name: "Overhead press", pattern: "v-push", muscles: ["Shoulders", "Triceps"], kits: [["barbell"]], level: 2, stress: ["shoulders", "lower-back"] },
  { id: "dumbbell-shoulder-press", name: "Dumbbell shoulder press", pattern: "v-push", muscles: ["Shoulders", "Triceps"], kits: [["dumbbells"]], level: 1, stress: ["shoulders"] },
  { id: "pike-push-up", name: "Pike push-up", pattern: "v-push", muscles: ["Shoulders", "Triceps"], kits: BW, level: 2, stress: ["shoulders", "wrists"] },
  // Horizontal pull
  { id: "barbell-row", name: "Barbell row", pattern: "h-pull", muscles: ["Back", "Biceps"], kits: [["barbell"]], level: 2, stress: ["lower-back"] },
  { id: "dumbbell-row", name: "One-arm dumbbell row", pattern: "h-pull", muscles: ["Back", "Biceps"], kits: [["dumbbells"]], level: 1, stress: [] },
  { id: "seated-cable-row", name: "Seated cable row", pattern: "h-pull", muscles: ["Back"], kits: [["cable"]], level: 1, stress: [] },
  { id: "inverted-row", name: "Inverted row", pattern: "h-pull", muscles: ["Back", "Biceps"], kits: [["pull-up-bar"]], level: 1, stress: [] },
  { id: "band-row", name: "Band row", pattern: "h-pull", muscles: ["Back"], kits: [["bands"]], level: 1, stress: [] },
  // Vertical pull
  { id: "pull-up", name: "Pull-up", pattern: "v-pull", muscles: ["Back", "Biceps"], kits: [["pull-up-bar"]], level: 3, stress: ["shoulders"] },
  { id: "band-assisted-pull-up", name: "Band-assisted pull-up", pattern: "v-pull", muscles: ["Back", "Biceps"], kits: [["pull-up-bar", "bands"]], level: 2, stress: ["shoulders"] },
  { id: "negative-pull-up", name: "Negative pull-up", pattern: "v-pull", muscles: ["Back", "Biceps"], kits: [["pull-up-bar"]], level: 2, stress: ["shoulders"] },
  { id: "lat-pulldown", name: "Lat pulldown", pattern: "v-pull", muscles: ["Back", "Biceps"], kits: [["cable"]], level: 1, stress: [] },
  { id: "band-pulldown", name: "Band lat pulldown", pattern: "v-pull", muscles: ["Back"], kits: [["bands"]], level: 1, stress: [] },
  // Shoulders and arms
  { id: "lateral-raise", name: "Lateral raise", pattern: "shoulders", muscles: ["Shoulders"], kits: [["dumbbells"], ["cable"], ["bands"]], level: 1, stress: [] },
  { id: "face-pull", name: "Face pull", pattern: "shoulders", muscles: ["Rear delts", "Upper back"], kits: [["cable"], ["bands"]], level: 1, stress: [] },
  { id: "dumbbell-curl", name: "Dumbbell curl", pattern: "biceps", muscles: ["Biceps"], kits: [["dumbbells"]], level: 1, stress: [] },
  { id: "band-curl", name: "Band curl", pattern: "biceps", muscles: ["Biceps"], kits: [["bands"]], level: 1, stress: [] },
  { id: "chin-up", name: "Chin-up", pattern: "biceps", muscles: ["Biceps", "Back"], kits: [["pull-up-bar"]], level: 3, stress: ["shoulders"] },
  { id: "cable-pushdown", name: "Cable triceps pushdown", pattern: "triceps", muscles: ["Triceps"], kits: [["cable"]], level: 1, stress: [] },
  { id: "overhead-triceps-extension", name: "Overhead triceps extension", pattern: "triceps", muscles: ["Triceps"], kits: [["dumbbells"], ["bands"]], level: 1, stress: ["shoulders"] },
  { id: "diamond-push-up", name: "Diamond push-up", pattern: "triceps", muscles: ["Triceps", "Chest"], kits: BW, level: 2, stress: ["wrists"] },
  // Core
  { id: "plank", name: "Plank", pattern: "core", muscles: ["Core"], kits: BW, level: 1, stress: [] },
  { id: "dead-bug", name: "Dead bug", pattern: "core", muscles: ["Core"], kits: BW, level: 1, stress: [] },
  { id: "side-plank", name: "Side plank", pattern: "core", muscles: ["Obliques"], kits: BW, level: 1, stress: [] },
  { id: "hanging-knee-raise", name: "Hanging knee raise", pattern: "core", muscles: ["Core"], kits: [["pull-up-bar"]], level: 2, stress: [] },
  { id: "hollow-hold", name: "Hollow body hold", pattern: "core", muscles: ["Core"], kits: BW, level: 2, stress: [] },
];

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export const isBodyweight = (e: Exercise) => e.kits.some((k) => k.length === 0);

/** True when the user has every item in at least one of the exercise's kits. */
export function hasKit(e: Exercise, owned: readonly Equipment[]): boolean {
  return e.kits.some((kit) => kit.every((item) => owned.includes(item)));
}

/** Time-based holds are prescribed in seconds rather than reps. */
export const HOLD_EXERCISES = new Set(["plank", "side-plank", "hollow-hold"]);
