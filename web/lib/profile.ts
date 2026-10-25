/* The user's training profile: everything onboarding collects, and the options shown for each answer. */
import type { Weekday } from "./training";

export type Goal = "muscle" | "strength" | "fat-loss" | "general" | "running" | "race" | "calisthenics" | "consistency";
export type RaceDistance = "5k" | "10k" | "half";
export type Experience = "beginner" | "intermediate" | "advanced";
export type Location = "gym" | "home" | "outdoors";
export type Equipment = "barbell" | "rack" | "bench" | "dumbbells" | "kettlebell" | "cable" | "machine" | "pull-up-bar" | "dip-bars" | "bands" | "box";
export type WorkoutType = "strength" | "hypertrophy" | "running" | "conditioning" | "calisthenics" | "mobility";
export type BodyArea = "knees" | "lower-back" | "shoulders" | "wrists";
export type SessionMinutes = 20 | 30 | 45 | 60 | 75;

export type Profile = {
  version: 1;
  /** goals[0] is the primary goal; the rest are secondary. */
  goals: Goal[];
  race?: RaceDistance;
  experience: Experience;
  days: Weekday[];
  minutes: SessionMinutes;
  locations: Location[];
  equipment: Equipment[];
  preferred: WorkoutType[];
  /** Areas to keep load off. Exercises that stress them are left out of the plan. */
  avoid: BodyArea[];
  limitationsNote?: string;
  /** Exercise ids the user likes or wants left out (picked from the library in milestone 3). */
  favourites: string[];
  excluded: string[];
  level: { pushUps?: number; pullUps?: number; canRun5k?: "yes" | "not-yet"; fiveKMinutes?: number };
  updatedAt: string;
};

type Option<T> = { value: T; label: string; detail?: string };

export const GOALS: Option<Goal>[] = [
  { value: "muscle", label: "Build muscle", detail: "Add size and shape" },
  { value: "strength", label: "Get stronger", detail: "Lift more on the big moves" },
  { value: "fat-loss", label: "Lose fat, keep muscle", detail: "Strength plus conditioning" },
  { value: "general", label: "General fitness", detail: "Feel fitter all round" },
  { value: "running", label: "Run better", detail: "Faster, further, easier" },
  { value: "race", label: "Train for a race", detail: "5K, 10K or half marathon" },
  { value: "calisthenics", label: "Calisthenics skills", detail: "Pull-ups, dips, push-ups" },
  { value: "consistency", label: "Build a routine", detail: "Stay active, week in, week out" },
];

export const RACES: Option<RaceDistance>[] = [
  { value: "5k", label: "5K" },
  { value: "10k", label: "10K" },
  { value: "half", label: "Half marathon" },
];

export const EXPERIENCE: Option<Experience>[] = [
  { value: "beginner", label: "Beginner", detail: "New to training, or back after a long break" },
  { value: "intermediate", label: "Intermediate", detail: "Training regularly for 6 months or more" },
  { value: "advanced", label: "Advanced", detail: "Years of structured training" },
];

export const MINUTES: Option<SessionMinutes>[] = [
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
  { value: 75, label: "75+ min" },
];

export const LOCATIONS: Option<Location>[] = [
  { value: "gym", label: "Gym" },
  { value: "home", label: "Home" },
  { value: "outdoors", label: "Outdoors" },
];

export const EQUIPMENT: Option<Equipment>[] = [
  { value: "dumbbells", label: "Dumbbells" },
  { value: "barbell", label: "Barbell and plates" },
  { value: "rack", label: "Squat rack" },
  { value: "bench", label: "Bench" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "cable", label: "Cable machine" },
  { value: "machine", label: "Resistance machines" },
  { value: "pull-up-bar", label: "Pull-up bar" },
  { value: "dip-bars", label: "Dip bars" },
  { value: "bands", label: "Resistance bands" },
  { value: "box", label: "Box or step" },
];

/** A typical commercial gym has everything on the list. */
export const GYM_EQUIPMENT: Equipment[] = EQUIPMENT.map((e) => e.value);

export const WORKOUT_TYPES: Option<WorkoutType>[] = [
  { value: "strength", label: "Heavy lifting" },
  { value: "hypertrophy", label: "Muscle building" },
  { value: "running", label: "Running" },
  { value: "conditioning", label: "Conditioning" },
  { value: "calisthenics", label: "Bodyweight" },
  { value: "mobility", label: "Mobility" },
];

export const BODY_AREAS: Option<BodyArea>[] = [
  { value: "knees", label: "Knees" },
  { value: "lower-back", label: "Lower back" },
  { value: "shoulders", label: "Shoulders" },
  { value: "wrists", label: "Wrists" },
];

export const isRunGoal = (g: Goal) => g === "running" || g === "race";

export const labelOf = <T,>(options: Option<T>[], value: T) => options.find((o) => o.value === value)?.label ?? String(value);

export function emptyProfile(): Profile {
  return {
    version: 1,
    goals: [],
    experience: "beginner",
    days: [0, 2, 4],
    minutes: 45,
    locations: ["gym"],
    equipment: [...GYM_EQUIPMENT],
    preferred: [],
    avoid: [],
    favourites: [],
    excluded: [],
    level: {},
    updatedAt: new Date(0).toISOString(),
  };
}

/** What each onboarding step needs before the user can continue. */
export const VALID = {
  goals: (p: Profile) => p.goals.length > 0 && (!p.goals.includes("race") || !!p.race),
  schedule: (p: Profile) => p.days.length >= 2 && p.days.length <= 6,
  setup: (p: Profile) => p.locations.length > 0,
};
