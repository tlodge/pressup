/* Builds a weekly programme from a profile using fixed training rules:
   1. Decide how many strength, running and conditioning sessions the goals call for.
   2. Choose a split for the strength days (full body, upper/lower, push/pull/legs or calisthenics).
   3. Fill each session's movement slots with exercises the user has kit for, can do safely and hasn't excluded.
   4. Place sessions on the chosen days so hard leg days and hard runs don't land back to back.
   5. Fit every session to the user's time per session.
   Every step is deterministic, so the same profile always gives the same plan. */
import { EXERCISES, HOLD_EXERCISES, isBodyweight, type Exercise, type Pattern } from "../exercises";
import { BODY_AREAS, isRunGoal, labelOf, type Goal, type Profile } from "../profile";
import { WEEKDAY_SHORT, type Focus, type Prescription, type Role, type Session, type WeekPlan, type Weekday } from "../training";
import { blocker } from "./eligibility";
import { fitToTime } from "./fit";

type Slot = { pattern: Pattern; role: Role; alt?: Pattern[] };
type Template = { key: string; name: string; focus: Focus; purpose: string; slots: Slot[]; legLoad: 0 | 1 | 2; hard: boolean };

const TEMPLATES = {
  lowerA: { key: "lower-a", name: "Lower A", focus: "lower", legLoad: 2, hard: true, purpose: "Squat strength, with hinge and single-leg work to support it.", slots: [
    { pattern: "squat", role: "main", alt: ["lunge"] }, { pattern: "hinge", role: "secondary", alt: ["glute"] }, { pattern: "lunge", role: "secondary" },
    { pattern: "glute", role: "accessory" }, { pattern: "calves", role: "accessory" }] },
  lowerB: { key: "lower-b", name: "Lower B", focus: "lower", legLoad: 2, hard: true, purpose: "Hinge strength, with quad volume and trunk work.", slots: [
    { pattern: "hinge", role: "main", alt: ["glute"] }, { pattern: "squat", role: "secondary", alt: ["lunge"] }, { pattern: "lunge", role: "accessory" },
    { pattern: "ham-iso", role: "accessory", alt: ["glute"] }, { pattern: "core", role: "accessory" }] },
  upperA: { key: "upper-a", name: "Upper A", focus: "upper", legLoad: 0, hard: false, purpose: "Horizontal press and pull strength, balanced front to back.", slots: [
    { pattern: "h-push", role: "main" }, { pattern: "h-pull", role: "main" }, { pattern: "v-push", role: "secondary", alt: ["h-push"] },
    { pattern: "v-pull", role: "secondary", alt: ["h-pull"] }, { pattern: "biceps", role: "accessory", alt: ["triceps"] }] },
  upperB: { key: "upper-b", name: "Upper B", focus: "upper", legLoad: 0, hard: false, purpose: "Vertical pull and press, plus shoulder health.", slots: [
    { pattern: "v-pull", role: "main", alt: ["h-pull"] }, { pattern: "h-push", role: "main" }, { pattern: "h-pull", role: "secondary" },
    { pattern: "shoulders", role: "accessory" }, { pattern: "triceps", role: "accessory", alt: ["biceps"] }] },
  fullA: { key: "full-a", name: "Full body A", focus: "full", legLoad: 2, hard: false, purpose: "Squat, press and pull: the whole body in one session.", slots: [
    { pattern: "squat", role: "main", alt: ["lunge"] }, { pattern: "h-push", role: "main" }, { pattern: "h-pull", role: "secondary" },
    { pattern: "hinge", role: "secondary", alt: ["glute"] }, { pattern: "core", role: "accessory" }] },
  fullB: { key: "full-b", name: "Full body B", focus: "full", legLoad: 2, hard: false, purpose: "Hinge and vertical pull, with single-leg and overhead work.", slots: [
    { pattern: "hinge", role: "main", alt: ["glute"] }, { pattern: "v-pull", role: "main", alt: ["h-pull"] }, { pattern: "lunge", role: "secondary", alt: ["squat"] },
    { pattern: "v-push", role: "secondary", alt: ["h-push"] }, { pattern: "core", role: "accessory" }] },
  fullC: { key: "full-c", name: "Full body C", focus: "full", legLoad: 2, hard: false, purpose: "A second squat and row day, with glutes and shoulders.", slots: [
    { pattern: "squat", role: "main", alt: ["lunge"] }, { pattern: "h-pull", role: "main" }, { pattern: "h-push", role: "secondary" },
    { pattern: "glute", role: "secondary" }, { pattern: "shoulders", role: "accessory" }] },
  push: { key: "push", name: "Push", focus: "push", legLoad: 0, hard: false, purpose: "Chest, shoulders and triceps.", slots: [
    { pattern: "h-push", role: "main" }, { pattern: "v-push", role: "main", alt: ["h-push"] }, { pattern: "h-push", role: "secondary" },
    { pattern: "shoulders", role: "accessory" }, { pattern: "triceps", role: "accessory" }] },
  pull: { key: "pull", name: "Pull", focus: "pull", legLoad: 0, hard: false, purpose: "Back, rear shoulders and biceps.", slots: [
    { pattern: "v-pull", role: "main", alt: ["h-pull"] }, { pattern: "h-pull", role: "main" }, { pattern: "h-pull", role: "secondary" },
    { pattern: "shoulders", role: "accessory" }, { pattern: "biceps", role: "accessory" }] },
  caliA: { key: "cali-a", name: "Calisthenics A", focus: "calisthenics", legLoad: 1, hard: false, purpose: "Pull-up and push-up strength, with legs and trunk.", slots: [
    { pattern: "v-pull", role: "main", alt: ["h-pull"] }, { pattern: "h-push", role: "main" }, { pattern: "squat", role: "secondary", alt: ["lunge"] },
    { pattern: "h-pull", role: "secondary" }, { pattern: "core", role: "accessory" }] },
  caliB: { key: "cali-b", name: "Calisthenics B", focus: "calisthenics", legLoad: 1, hard: false, purpose: "Dips and pressing, rows and single-leg work.", slots: [
    { pattern: "h-push", role: "main" }, { pattern: "h-pull", role: "main" }, { pattern: "lunge", role: "secondary", alt: ["squat"] },
    { pattern: "v-push", role: "secondary", alt: ["h-push"] }, { pattern: "core", role: "accessory" }] },
} satisfies Record<string, Template>;

const PATTERN_LABEL: Record<Pattern, string> = {
  squat: "squat", hinge: "hinge", lunge: "single-leg", glute: "glute", "quad-iso": "quad", "ham-iso": "hamstring", calves: "calf",
  "h-push": "press", "v-push": "overhead press", "h-pull": "row", "v-pull": "pull-down", shoulders: "shoulder", biceps: "biceps", triceps: "triceps", core: "core",
};

type Dose = { sets: number; reps: string; restSec: number };
const DOSES: Record<"strength" | "muscle" | "fat-loss" | "calisthenics" | "general", Record<Role, Dose>> = {
  strength: { main: { sets: 4, reps: "5", restSec: 180 }, secondary: { sets: 3, reps: "8", restSec: 120 }, accessory: { sets: 2, reps: "12", restSec: 60 } },
  muscle: { main: { sets: 4, reps: "8", restSec: 120 }, secondary: { sets: 3, reps: "10", restSec: 90 }, accessory: { sets: 3, reps: "12", restSec: 60 } },
  "fat-loss": { main: { sets: 3, reps: "8", restSec: 120 }, secondary: { sets: 3, reps: "10", restSec: 60 }, accessory: { sets: 2, reps: "15", restSec: 45 } },
  calisthenics: { main: { sets: 4, reps: "5", restSec: 150 }, secondary: { sets: 3, reps: "8", restSec: 90 }, accessory: { sets: 3, reps: "10", restSec: 60 } },
  general: { main: { sets: 3, reps: "8", restSec: 120 }, secondary: { sets: 3, reps: "10", restSec: 90 }, accessory: { sets: 2, reps: "12", restSec: 60 } },
};

/** The big barbell lifts belong in the main slot, never as secondary or accessory work. */
const MAIN_LIFTS = new Set(["back-squat", "front-squat", "deadlift", "bench-press", "overhead-press"]);

const UNILATERAL = new Set(["bulgarian-split-squat", "walking-lunge", "reverse-lunge", "step-up", "single-leg-rdl", "dumbbell-row", "side-plank"]);

type PickContext = {
  profile: Profile;
  primary: Goal;
  sessionUsed: Set<string>;
  weekUsed: Map<string, number>;
};

function dosingGoal(goals: Goal[]): keyof typeof DOSES {
  for (const g of goals) {
    if (g === "strength" || g === "muscle" || g === "fat-loss" || g === "calisthenics") return g;
  }
  return "general";
}

function allowed(e: Exercise, ctx: PickContext): boolean {
  return !ctx.sessionUsed.has(e.id) && !blocker(e, ctx.profile);
}

function score(e: Exercise, role: Role, ctx: PickContext): number {
  const p = ctx.profile;
  let s = 0;
  if (p.favourites.includes(e.id)) s += 5;
  if (ctx.primary === "calisthenics" || p.preferred.includes("calisthenics")) s += isBodyweight(e) ? 3 : 0;
  if (p.experience === "beginner") s += e.level === 1 ? 2 : 0;
  else if (role === "main") s += e.level === 2 ? 2 : e.level === 3 ? 1 : 0; // experienced lifters get the classic compound lifts first
  if (role !== "main" && MAIN_LIFTS.has(e.id)) s -= 4;
  if (role === "main" && ctx.primary === "strength" && e.kits.some((k) => k.includes("barbell"))) s += 2;
  s -= 2 * (ctx.weekUsed.get(e.id) ?? 0); // variety across the week
  return s;
}

function pickExercise(slot: Slot, ctx: PickContext): Exercise | undefined {
  for (const pattern of [slot.pattern, ...(slot.alt ?? [])]) {
    const options = EXERCISES.filter((e) => e.pattern === pattern && allowed(e, ctx));
    if (!options.length) continue;
    // Highest score wins; ties keep catalogue order, so the result is stable.
    return options.reduce((best, e) => (score(e, slot.role, ctx) > score(best, slot.role, ctx) ? e : best));
  }
  return undefined;
}

function prescribe(e: Exercise, role: Role, ctx: PickContext): Prescription {
  const dose = { ...DOSES[dosingGoal(ctx.profile.goals)][role] };
  if (ctx.profile.experience === "beginner" && role === "main") dose.sets = Math.max(3, dose.sets - 1);
  let reps = dose.reps;
  if (HOLD_EXERCISES.has(e.id)) reps = ctx.profile.experience === "beginner" ? "30 s" : "45 s";
  else if (UNILATERAL.has(e.id)) reps = `${reps} each`;
  return {
    exerciseId: e.id, name: e.name, muscles: e.muscles, role, sets: dose.sets, reps, restSec: dose.restSec,
    load: isBodyweight(e) && e.kits.length === 1 ? "Bodyweight" : undefined,
  };
}

type Built = { session: Omit<Session, "id">; key: string; missing: Pattern[] };

function buildStrength(t: Template, ctx: PickContext): Built {
  ctx.sessionUsed = new Set();
  const exercises: Prescription[] = [];
  const missing: Pattern[] = [];
  for (const slot of t.slots) {
    const e = pickExercise(slot, ctx);
    if (!e) {
      missing.push(slot.pattern);
      continue;
    }
    ctx.sessionUsed.add(e.id);
    ctx.weekUsed.set(e.id, (ctx.weekUsed.get(e.id) ?? 0) + 1);
    exercises.push(prescribe(e, slot.role, ctx));
  }
  // If a slot left a session without a main lift, promote the first remaining exercise.
  if (exercises.length && !exercises.some((x) => x.role === "main")) exercises[0].role = "main";
  // When the session's lead movement had to change, describe what it is now built around instead.
  const leadKept = exercises[0] && EXERCISES.find((e) => e.id === exercises[0].exerciseId)?.pattern === t.slots[0].pattern;
  const mains = exercises.filter((x) => x.role === "main").map((x) => x.name.toLowerCase());
  const purpose = leadKept || !mains.length ? t.purpose : `Built around the ${list(mains)}, with supporting work.`;
  return { key: t.key, missing, session: { name: t.name, focus: t.focus, purpose, exercises, legLoad: t.legLoad, hard: t.hard } };
}

type RunKind = "easy" | "intervals" | "long";

function newToRunning(p: Profile) {
  return p.level.canRun5k === "not-yet" || (p.experience === "beginner" && p.level.canRun5k !== "yes");
}

function buildRun(kind: RunKind, p: Profile): Built {
  const novice = newToRunning(p);
  const run = (name: string, reps: string, durationMin: number, cue: string): Prescription => ({
    exerciseId: `run-${kind}`, name, muscles: ["Cardio"], role: "main", sets: 1, reps, restSec: 0, durationMin, cue,
  });
  if (kind === "easy") {
    const d = Math.max(20, Math.min(p.minutes, novice ? 30 : 45));
    return { key: "easy-run", missing: [], session: {
      name: "Easy run", focus: "run", legLoad: 1, hard: false, purpose: "Aerobic base: the easy miles that make the hard ones possible.",
      exercises: [run(novice ? "Run/walk" : "Easy run", novice ? `${d} min: run 1 min, walk 1 min` : `${d} min easy`, d, "Conversational pace: you can talk in full sentences.")] } };
  }
  if (kind === "intervals") {
    const work = novice ? 1 : p.experience === "advanced" ? 3 : 2;
    const rest = 2;
    const [warm, cool] = p.minutes <= 30 ? [5, 3] : [10, 5];
    let reps = novice ? 5 : 6;
    while (reps > 3 && warm + cool + reps * (work + rest) > p.minutes) reps -= 1;
    const d = warm + cool + reps * (work + rest);
    return { key: "intervals", missing: [], session: {
      name: "Intervals", focus: "run", legLoad: 2, hard: true, purpose: "Speed and fitness: short, hard efforts with easy recoveries.",
      exercises: [run("Intervals", `${warm} min warm-up, ${reps} × ${work} min hard / ${rest} min easy, ${cool} min cool-down`, d, "Hard but controlled: about 8 out of 10.")] } };
  }
  const target = { "5k": 40, "10k": 60, half: 90 }[p.race ?? "5k"] ?? 50;
  const goal = p.goals.includes("race") ? target : 50;
  const d = Math.max(20, Math.min(Math.round((novice ? goal * 0.7 : goal) / 5) * 5, p.minutes));
  return { key: "long-run", missing: [], session: {
    name: "Long run", focus: "run", legLoad: 2, hard: true, purpose: "Endurance: the week's longest run, at an easy pace.",
    exercises: [run("Long run", `${d} min easy`, d, "Slower than you think. Walk breaks are fine.")] } };
}

function buildConditioning(p: Profile): Built {
  const machine = p.equipment.includes("machine");
  const outdoors = p.locations.includes("outdoors");
  const how = machine ? "on a bike or rower" : outdoors ? "running, with walking recoveries" : "with jumping jacks or fast marching";
  const d = Math.min(p.minutes, 25);
  return { key: "conditioning", missing: [], session: {
    name: "Conditioning", focus: "conditioning", legLoad: 1, hard: true, purpose: "Heart and lungs: short bursts that burn energy without long sessions.",
    exercises: [{ exerciseId: "conditioning-intervals", name: "Conditioning intervals", muscles: ["Cardio"], role: "main", sets: 1, restSec: 0, durationMin: d,
      reps: `5 min warm-up, 8 × 30 s hard / 90 s easy ${how}, cool down`, cue: "Hard efforts, easy recoveries. Stop if you feel unwell." }] } };
}

function runKinds(r: number, p: Profile): RunKind[] {
  const raceOrRunner = p.goals.includes("race") || p.goals.includes("running");
  if (r === 1) return [p.goals.includes("race") ? "long" : "easy"];
  if (r === 2) return ["easy", raceOrRunner && p.goals.includes("race") ? "long" : "intervals"];
  if (r === 3) return ["easy", "intervals", "long"];
  return ["easy", "intervals", "easy", "long"].slice(0, r) as RunKind[];
}

function strengthTemplates(k: number, p: Profile): Template[] {
  if (k <= 0) return [];
  if (p.goals[0] === "calisthenics") return Array.from({ length: k }, (_, i) => (i % 2 ? TEMPLATES.caliB : TEMPLATES.caliA));
  const t = TEMPLATES;
  switch (k) {
    case 1: return [t.fullA];
    case 2: return [t.fullA, t.fullB];
    case 3: return p.experience === "beginner" ? [t.fullA, t.fullB, t.fullC] : [t.upperA, t.lowerA, t.fullC];
    case 4: return [t.upperA, t.lowerA, t.upperB, t.lowerB];
    case 5: return [t.upperA, t.lowerA, t.push, t.pull, t.lowerB];
    default: return [t.push, t.pull, t.lowerA, t.push, t.pull, t.lowerB];
  }
}

export const adjacent = (a: Weekday, b: Weekday) => (b - a + 7) % 7 === 1;
const isHardRun = (s: Session) => s.focus === "run" && s.hard;

/** Recovery cost of a layout: lower is better. */
export function layoutPenalty(order: Session[], days: Weekday[]): number {
  let pen = 0;
  const weekendChosen = days.some((d) => d >= 5);
  order.forEach((a, i) => {
    order.forEach((b, j) => {
      if (i === j || !adjacent(days[i], days[j])) return;
      if (a.legLoad === 2 && b.legLoad === 2 && a.focus !== "run" && b.focus !== "run") pen += 10;
      if (a.legLoad === 2 && a.focus !== "run" && isHardRun(b)) pen += 8;
      if (isHardRun(a) && b.legLoad === 2 && b.focus !== "run") pen += 5;
      if (isHardRun(a) && isHardRun(b)) pen += 6;
      if (a.focus === b.focus && a.focus !== "run") pen += 2;
      if (a.legLoad >= 1 && b.legLoad >= 1) pen += 1;
    });
    if (a.name === "Long run" && weekendChosen && days[i] < 5) pen += 3;
  });
  return pen;
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((x, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [x, ...rest]));
}

const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

export function generatePlan(profile: Profile, now: string = new Date().toISOString()): WeekPlan {
  const days = [...profile.days].sort((a, b) => a - b) as Weekday[];
  const goals = profile.goals.length ? profile.goals : (["general"] as Goal[]);
  const p = { ...profile, goals };
  const n = days.length;
  const strengthGoals = goals.filter((g) => !isRunGoal(g));
  const runGoals = goals.filter(isRunGoal);

  let runs = 0;
  if (isRunGoal(goals[0])) runs = strengthGoals.length ? Math.min(3, n - 1) : Math.min(4, n);
  else if (runGoals.length) runs = n >= 4 ? 2 : 1;
  let strength = n - runs;
  let conditioning = 0;
  if (goals.includes("fat-loss") && runs === 0 && strength >= 3) {
    conditioning = 1;
    strength -= 1;
  }

  const ctx: PickContext = {
    profile: p, primary: goals[0], sessionUsed: new Set(), weekUsed: new Map(),
  };
  const templates = strengthTemplates(strength, p);
  const seen = new Map<string, number>();
  const built: Built[] = [
    ...templates.map((t) => {
      const count = (seen.get(t.key) ?? 0) + 1;
      seen.set(t.key, count);
      const repeated = templates.filter((x) => x.key === t.key).length > 1;
      const b = buildStrength(t, ctx);
      if (!repeated) return b;
      // "Push" twice becomes Push A and Push B; names that already carry a letter stay as they are.
      const name = /\s[A-C]$/.test(t.name) ? t.name : `${t.name} ${count === 1 ? "A" : "B"}`;
      return { ...b, key: `${t.key}-${count}`, session: { ...b.session, name } };
    }),
    ...runKinds(runs, p).map((k, i) => {
      const b = buildRun(k, p);
      return { ...b, key: `${b.key}-${i}` };
    }),
    ...(conditioning ? [buildConditioning(p)] : []),
  ];

  // Place sessions on days with the lowest recovery cost.
  const asSessions = built.map((b) => ({ ...b.session, id: b.key }) as Session);
  let best = asSessions;
  let bestPen = Infinity;
  for (const order of permutations(asSessions)) {
    const pen = layoutPenalty(order, days);
    if (pen < bestPen) {
      best = order;
      bestPen = pen;
    }
  }

  const notes: string[] = [];
  const sessions: Record<string, Session> = {};
  const planDays: WeekPlan["days"] = [];
  const trimmed: string[] = [];
  best.forEach((s, i) => {
    const id = `${WEEKDAY_SHORT[days[i]].toLowerCase()}-${s.id}`;
    const fit = fitToTime({ ...s, id }, p.minutes);
    if (fit.changes.length) trimmed.push(s.name);
    sessions[id] = fit.session;
    planDays.push({ weekday: days[i], sessionId: id });
  });

  // Why the week looks like this.
  const parts = [`${strength} strength`, runs ? `${runs} run${runs > 1 ? "s" : ""}` : "", conditioning ? "1 conditioning" : ""].filter(Boolean);
  notes.push(`${n} sessions a week: ${list(parts)}, built around ${labelOfGoal(goals[0])}${goals.length > 1 ? ` with ${list(goals.slice(1).map(labelOfGoal))} alongside` : ""}.`);
  if (goals[0] === "calisthenics") notes.push("Bodyweight sessions build towards strict pull-ups, dips and push-ups.");
  else if (templates.some((t) => t.focus === "full") && templates.some((t) => t.focus === "upper")) notes.push("Upper, lower and full-body days spread the work, so each area is trained twice a week with time to recover.");
  else if (templates.some((t) => t.focus === "full")) notes.push("Full-body sessions hit every muscle more than once a week, the quickest way to build strength when time is short.");
  else if (templates.some((t) => t.focus === "upper")) notes.push("Splitting upper and lower body lets each area recover while you train the other.");

  const legDays = best.map((s, i) => ({ s, d: days[i] })).filter(({ s }) => s.legLoad === 2);
  const clash = best.some((a, i) => best.some((b, j) => i !== j && adjacent(days[i], days[j]) && a.legLoad === 2 && b.legLoad === 2));
  if (legDays.length >= 2 && !clash) notes.push(`Hard leg days (${list(legDays.map(({ s, d }) => `${s.name} on ${WEEKDAY_SHORT[d]}`))}) have at least a day between them.`);
  if (clash) notes.push("With these days, two leg-heavy sessions fall back to back. If your legs are still tired on the second day, adapt it to a lighter session.");
  const longIdx = best.findIndex((s) => s.name === "Long run");
  if (longIdx >= 0) {
    const before = best.find((_, j) => adjacent(days[j], days[longIdx]));
    if (!before || before.legLoad < 2 || before.focus === "run") notes.push(`Your long run is on ${WEEKDAY_SHORT[days[longIdx]]}, with no heavy leg session the day before.`);
    const target = p.goals.includes("race") ? { "5k": 40, "10k": 60, half: 90 }[p.race ?? "5k"] : 0;
    if (target && target > p.minutes) notes.push(`Training for a ${labelRace(p)} usually needs a long run of about ${target} minutes. It's capped at ${p.minutes} for now; give it a day with more time when you can.`);
  }

  for (const area of p.avoid) notes.push(`Exercises that load your ${labelOf(BODY_AREAS, area).toLowerCase()} are left out.`);
  const missing = [...new Set(built.flatMap((b) => b.missing))];
  if (missing.length) notes.push(`No ${list(missing.map((m) => PATTERN_LABEL[m]))} exercise suits your equipment and limits, so those slots are skipped.`);
  if (trimmed.length) notes.push(`To fit ${p.minutes}-minute sessions, extra sets were trimmed from ${list([...new Set(trimmed)])}. Main lifts are kept.`);
  if (strength + conditioning > 0) notes.push("Weights start blank: pick a load you could lift for 2 more reps than prescribed. Your first logged sessions set the numbers.");

  return { days: planDays, sessions, notes, generatedAt: now };
}

function labelOfGoal(g: Goal): string {
  return {
    muscle: "building muscle", strength: "getting stronger", "fat-loss": "losing fat while keeping muscle", general: "general fitness",
    running: "running", race: "race training", calisthenics: "calisthenics", consistency: "building a routine",
  }[g];
}

function labelRace(p: Profile) {
  return { "5k": "5K", "10k": "10K", half: "half marathon" }[p.race ?? "5k"];
}
