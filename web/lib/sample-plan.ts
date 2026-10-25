import type { WeekPlan } from "./training";

/* A sample four-day upper/lower week, used until onboarding (milestone 2) builds the user's own plan.
   Lower days sit apart so legs get 72 hours between hard sessions. */
export const SAMPLE_PLAN: WeekPlan = {
  days: [
    { weekday: 0, sessionId: "lower-a" },
    { weekday: 1, sessionId: "upper-a" },
    { weekday: 3, sessionId: "lower-b" },
    { weekday: 4, sessionId: "upper-b" },
  ],
  sessions: {
    "lower-a": {
      id: "lower-a",
      name: "Lower A",
      focus: "lower",
      purpose: "Squat strength, with hinge and single-leg work to support it.",
      exercises: [
        { exerciseId: "back-squat", name: "Back squat", muscles: ["Quads", "Glutes"], role: "main", sets: 4, reps: "6", load: "70 kg", restSec: 180 },
        { exerciseId: "romanian-deadlift", name: "Romanian deadlift", muscles: ["Hamstrings", "Glutes"], role: "secondary", sets: 3, reps: "8", load: "60 kg", restSec: 120 },
        { exerciseId: "bulgarian-split-squat", name: "Bulgarian split squat", muscles: ["Quads", "Glutes"], role: "secondary", sets: 3, reps: "10 each", load: "12 kg", restSec: 90 },
        { exerciseId: "hip-thrust", name: "Hip thrust", muscles: ["Glutes"], role: "accessory", sets: 3, reps: "8", load: "80 kg", restSec: 90 },
        { exerciseId: "standing-calf-raise", name: "Standing calf raise", muscles: ["Calves"], role: "accessory", sets: 3, reps: "12", restSec: 60 },
      ],
    },
    "upper-a": {
      id: "upper-a",
      name: "Upper A",
      focus: "upper",
      purpose: "Horizontal press and pull strength, balanced front to back.",
      exercises: [
        { exerciseId: "bench-press", name: "Barbell bench press", muscles: ["Chest", "Triceps"], role: "main", sets: 4, reps: "8", load: "60 kg", restSec: 150 },
        { exerciseId: "barbell-row", name: "Barbell row", muscles: ["Back", "Biceps"], role: "main", sets: 4, reps: "8", load: "50 kg", restSec: 120 },
        { exerciseId: "overhead-press", name: "Overhead press", muscles: ["Shoulders", "Triceps"], role: "secondary", sets: 3, reps: "8", load: "35 kg", restSec: 120 },
        { exerciseId: "lat-pulldown", name: "Lat pulldown", muscles: ["Back", "Biceps"], role: "secondary", sets: 3, reps: "10", load: "45 kg", restSec: 90 },
        { exerciseId: "dumbbell-curl", name: "Dumbbell curl", muscles: ["Biceps"], role: "accessory", sets: 2, reps: "12", load: "10 kg", restSec: 60 },
      ],
    },
    "lower-b": {
      id: "lower-b",
      name: "Lower B",
      focus: "lower",
      purpose: "Hinge strength, with quad volume and trunk work.",
      exercises: [
        { exerciseId: "deadlift", name: "Deadlift", muscles: ["Hamstrings", "Glutes", "Back"], role: "main", sets: 3, reps: "5", load: "90 kg", restSec: 180 },
        { exerciseId: "leg-press", name: "Leg press", muscles: ["Quads", "Glutes"], role: "secondary", sets: 3, reps: "10", load: "120 kg", restSec: 120 },
        { exerciseId: "walking-lunge", name: "Walking lunge", muscles: ["Quads", "Glutes"], role: "accessory", sets: 2, reps: "12 each", load: "10 kg", restSec: 90 },
        { exerciseId: "lying-leg-curl", name: "Lying leg curl", muscles: ["Hamstrings"], role: "accessory", sets: 3, reps: "12", load: "30 kg", restSec: 60 },
        { exerciseId: "plank", name: "Plank", muscles: ["Core"], role: "accessory", sets: 3, reps: "40 s", load: "Bodyweight", restSec: 45 },
      ],
    },
    "upper-b": {
      id: "upper-b",
      name: "Upper B",
      focus: "upper",
      purpose: "Vertical pull and incline press, plus shoulder health.",
      exercises: [
        { exerciseId: "pull-up", name: "Pull-up", muscles: ["Back", "Biceps"], role: "main", sets: 4, reps: "6", load: "Bodyweight", restSec: 150 },
        { exerciseId: "incline-dumbbell-press", name: "Incline dumbbell press", muscles: ["Chest", "Shoulders"], role: "main", sets: 3, reps: "10", load: "22 kg", restSec: 120 },
        { exerciseId: "seated-cable-row", name: "Seated cable row", muscles: ["Back"], role: "secondary", sets: 3, reps: "10", load: "50 kg", restSec: 90 },
        { exerciseId: "lateral-raise", name: "Lateral raise", muscles: ["Shoulders"], role: "accessory", sets: 3, reps: "15", load: "8 kg", restSec: 60 },
        { exerciseId: "push-up", name: "Push-up", muscles: ["Chest", "Triceps"], role: "accessory", sets: 2, reps: "12", load: "Bodyweight", restSec: 60 },
      ],
    },
  },
};
