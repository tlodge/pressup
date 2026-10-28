/* Adapts one planned session to the day, using fixed rules applied in this order:
   1. Pain: exercises that load a sore area are swapped for ones that don't, or left out. Sharp or unexplained pain
      means rest. Pain is never trained through, and the advice to see a professional always comes with it.
   2. Kit: at home or with no equipment, exercises are swapped for ones that train the same movement with what's there.
   3. Volume: low energy, poor sleep, heavy soreness or time away mean fewer sets and lighter loads. Hard runs become easy.
   4. Time: the session is fitted to the time available. Accessories go first, then secondary work; main lifts stay.
   Every change carries a one-line reason. A missed or rested session is never added to another day. */
import { EXERCISE_BY_ID } from "../exercises";
import { BODY_AREAS, EQUIPMENT, labelOf, type BodyArea, type Equipment, type Profile } from "../profile";
import { estimateMinutes, type Prescription, type Session } from "../training";
import { blocker } from "./eligibility";
import { fitToTime } from "./fit";
import { applySwap, availableSwaps } from "./substitute";

export type Energy = "low" | "ok" | "high";
export type Sleep = "poor" | "ok" | "good";
export type Soreness = "none" | "some" | "very";
export type TimeAway = "1-2w" | "3-4w" | "month";

/** What the user told PressUp about today, from the check-in or an ADAPT MY WORKOUT option. Every field is optional. */
export type AdaptRequest = {
  minutes?: number;
  energy?: Energy;
  sleep?: Sleep;
  soreness?: Soreness;
  pain?: BodyArea[];
  /** Pain somewhere the engine can't plan around. */
  painElsewhere?: boolean;
  /** The pain is sharp or getting worse. */
  painSharp?: boolean;
  /** The equipment available today, for home or no-equipment sessions. */
  kit?: Equipment[];
  /** Keep only the core of the session, for a quick workout. */
  quick?: boolean;
  away?: TimeAway;
  /** An extra, light session on a planned rest day. */
  extra?: boolean;
  rest?: boolean;
};

/** A lighter day: logs from it are not used to raise next session's targets. */
export const isLight = (req: AdaptRequest) => !!(req.energy === "low" || req.sleep === "poor" || req.soreness === "very" || req.away || req.extra);

export type Adaptation =
  | { kind: "session"; session: Session; changes: string[]; advice: string[] }
  | { kind: "rest"; reasons: string[]; advice: string[] };

export const PAIN_ADVICE = "Pain is a signal to change something, not to push through. If it's sharp, getting worse or still there in a few days, see a GP or physiotherapist.";
export const REST_OK = "Taking today as a rest day is a good call too. Rest is part of the plan.";
export const NO_DOUBLING = "Your next session stays as planned. Nothing is added to another day to make up for today.";

export const AWAY_LABEL: Record<TimeAway, string> = { "1-2w": "1 to 2 weeks", "3-4w": "3 to 4 weeks", month: "over a month" };
const AWAY_FACTOR: Record<TimeAway, number> = { "1-2w": 0.75, "3-4w": 0.6, month: 0.5 };

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const areaList = (areas: BodyArea[]) => list(areas.map((a) => labelOf(BODY_AREAS, a).toLowerCase()));
const isTimed = (s: Session) => s.exercises.length > 0 && s.exercises.every((e) => e.durationMin);
const floor5 = (n: number) => Math.max(10, Math.floor(n / 5) * 5);

const rest = (reasons: string[], advice: string[] = []): Adaptation => ({ kind: "rest", reasons, advice: [...advice, NO_DOUBLING] });

export function adaptSession(planned: Session, profile: Profile, req: AdaptRequest): Adaptation {
  const pain = req.pain ?? [];
  const advice: string[] = [];
  const changes: string[] = [];
  let swaps: { from: string; to: string; line: string }[] = [];
  let session: Session = { ...planned, exercises: planned.exercises.map((e) => ({ ...e })) };

  // 1. Pain
  const anyPain = pain.length > 0 || req.painElsewhere || req.painSharp;
  if (anyPain) advice.push(PAIN_ADVICE);
  if (req.rest) return rest(["You chose to rest today. Rest is part of the plan."], advice);
  if (req.painSharp) return rest(["You said the pain is sharp or getting worse, so today is a rest day."], advice);
  if (req.painElsewhere) return rest(["PressUp can't plan around pain in that area, so today is a rest day."], advice);
  if (pain.includes("knees") && isTimed(session)) {
    return rest([`${session.name} loads your knees, so today is a rest day. A gentle walk is fine if it doesn't hurt.`], advice);
  }

  // 1 and 2. Swap anything the user can't do safely with today's body and kit.
  const today: Profile = { ...profile, avoid: [...new Set([...profile.avoid, ...pain])], equipment: req.kit ?? profile.equipment };
  if (!isTimed(session)) {
    const swapped = swapBlocked(session, profile, today);
    session = swapped.session;
    swaps = swapped.swaps;
    changes.push(...swapped.changes);
    if (!session.exercises.some((e) => e.role === "main")) {
      // Without its main lifts, a session is only worth doing if a couple of exercises remain.
      if (session.exercises.length < 2) {
        if (pain.some((a) => swapped.blockedBy.has(a))) {
          return rest([`With pain in your ${areaList(pain)}, there's no safe way to do this session, so today is a rest day.`], advice);
        }
        return rest(["Too little of this session can be done with the kit you have today, so it's a rest day."]);
      }
      const lead = session.exercises[0];
      session.exercises[0] = { ...lead, role: "main" };
      if (pain.length) session.purpose = `Built around the ${lead.name.toLowerCase()} today, keeping load off your ${areaList(pain)}.`;
      changes.push(`${lead.name} leads the session today.`);
    }
  } else if (req.kit) {
    advice.push("This session needs no equipment, so it works anywhere.");
  }

  // 3. Volume
  if (req.away) {
    const result = isTimed(session) ? easeRun(session, AWAY_FACTOR[req.away]) : cutVolume(session, AWAY_FACTOR[req.away], req.away === "month");
    session = result.session;
    changes.push(`Back after ${AWAY_LABEL[req.away]} away, so about ${Math.round(AWAY_FACTOR[req.away] * 100)}% of the usual work. Start lighter than last time; it comes back quickly.`, ...result.changes);
  } else {
    const why = [
      req.energy === "low" && "you're low on energy",
      req.sleep === "poor" && "you slept badly",
      req.soreness === "very" && "you're very sore",
      req.extra && "it's an extra session on a rest day",
    ].filter((x): x is string => !!x);
    if (why.length) {
      const result = isTimed(session) ? easeRun(session, 0.7) : cutVolume(session, 0.75, false);
      session = result.session;
      changes.push(`${isTimed(session) ? "An easier session" : "One set fewer and a lighter load"}, because ${list(why)}.`, ...result.changes);
      if (why.length >= 2 && !req.extra) advice.push(REST_OK);
    }
    if (req.soreness === "some" && !why.length) advice.push("A bit of soreness is normal. The warm-up usually loosens it off.");
  }

  // 4. Time
  const minutes = req.minutes ?? (req.quick ? 20 : undefined);
  if (minutes) {
    const result = fitTime(session, minutes);
    session = result.session;
    changes.push(...result.changes);
    if (!result.fits) advice.push(`It's a tight fit: plan on about ${estimateMinutes(session)} minutes.`);
  }

  // A swap that was then cut for time is reported as the planned exercise being left out.
  const kept = new Set(session.exercises.map((e) => e.name));
  for (const s of swaps.filter((x) => !kept.has(x.to))) {
    changes.splice(changes.indexOf(s.line), 1);
    changes.forEach((c, i) => (changes[i] = c.replace(`Left out ${s.to} `, `Left out ${s.from} `)));
  }

  if (req.energy === "high" && !changes.length) advice.push("Feeling good: stick to the plan. Extra sets today would only cost you later in the week.");
  return { kind: "session", session, changes: [...new Set(changes)], advice };
}

/** Replace exercises that are blocked for `today` with swaps that train the same thing; leave them out when nothing fits. */
function swapBlocked(session: Session, profile: Profile, today: Profile) {
  const changes: string[] = [];
  const blockedBy = new Set<string>();
  const swaps: { from: string; to: string; line: string }[] = [];
  const exercises: Prescription[] = [];
  const used = () => [...exercises, ...session.exercises].map((e) => e.exerciseId);
  for (const p of session.exercises) {
    const e = EXERCISE_BY_ID[p.exerciseId];
    const b = e ? blocker(e, today) : null;
    if (!e || !b) {
      exercises.push(p);
      continue;
    }
    if (b.kind === "avoid") e.stress.filter((a) => today.avoid.includes(a) && !profile.avoid.includes(a)).forEach((a) => blockedBy.add(a));
    // Around pain, only the same movement will do: a related one may load the same area in a different way.
    const swap = availableSwaps(e.id, today, used()).find((x) => b.kind !== "avoid" || x.exercise.pattern === e.pattern);
    if (swap) {
      exercises.push(applySwap(p, swap.exercise));
      const line = `${swap.exercise.name} instead of ${p.name}, which ${lower(b.text)}. ${swap.reason}.`;
      changes.push(line);
      swaps.push({ from: p.name, to: swap.exercise.name, line });
    } else {
      changes.push(`Left out ${p.name}: it ${lower(b.text)}, and nothing that trains the same thing works today.`);
    }
  }
  return { session: { ...session, exercises }, changes, blockedBy, swaps };
}

/** Fewer sets on set-based work. `dropAccessories` removes accessory work entirely. */
function cutVolume(session: Session, factor: number, dropAccessories: boolean) {
  const changes: string[] = [];
  let exercises = session.exercises;
  if (dropAccessories) {
    const gone = exercises.filter((e) => e.role === "accessory");
    if (gone.length) changes.push(`Left out ${list(gone.map((e) => e.name))} to keep the first session back short.`);
    exercises = exercises.filter((e) => e.role !== "accessory");
  }
  exercises = exercises.map((e) => {
    if (e.durationMin) return e;
    const sets = Math.max(2, Math.min(e.sets - 1, Math.round(e.sets * factor)));
    return { ...e, sets: Math.min(e.sets, sets), cue: e.role === "main" ? "Lighter today: finish each set with 3 reps to spare." : e.cue };
  });
  return { session: { ...session, exercises }, changes };
}

const EASY_CUE = "Conversational pace: you can talk in full sentences.";

/** Easier timed work: intervals become an easy run, other runs and conditioning get shorter. */
function easeRun(session: Session, factor: number) {
  const p = session.exercises[0];
  const changes: string[] = [];
  if (p.exerciseId === "run-intervals") {
    const d = floor5(Math.min(p.durationMin ?? 30, 30));
    changes.push("Intervals become an easy run: hard efforts can wait for a better day.");
    return {
      session: { ...session, name: "Easy run", hard: false, legLoad: 1 as const, purpose: "Aerobic base: easy running that keeps the habit going.",
        exercises: [{ ...p, exerciseId: "run-easy", name: "Easy run", reps: `${d} min easy`, durationMin: d, cue: EASY_CUE }] },
      changes,
    };
  }
  const d = floor5((p.durationMin ?? 30) * factor);
  return { session: { ...session, hard: false, exercises: [withMinutes(p, d)] }, changes };
}

/** Rewrite a timed block for a new length. The plan engine writes these descriptions, so their shape is known. */
function withMinutes(p: Prescription, d: number): Prescription {
  if (p.exerciseId === "run-intervals") {
    const m = p.reps.match(/(\d+) × (\d+) min hard \/ (\d+) min easy/);
    if (!m) return { ...p, durationMin: d, reps: `${d} min easy` };
    const [work, easy] = [Number(m[2]), Number(m[3])];
    const [warm, cool] = d <= 30 ? [5, 3] : [10, 5];
    const reps = Math.max(2, Math.floor((d - warm - cool) / (work + easy)));
    const total = warm + cool + reps * (work + easy);
    return { ...p, durationMin: total, reps: `${warm} min warm-up, ${reps} × ${work} min hard / ${easy} min easy, ${cool} min cool-down` };
  }
  if (p.exerciseId === "conditioning-intervals") {
    const how = p.reps.match(/90 s easy (.*), cool down/)?.[1] ?? "";
    const efforts = Math.max(3, Math.min(8, Math.floor((d - 8) / 2)));
    return { ...p, durationMin: d, reps: `5 min warm-up, ${efforts} × 30 s hard / 90 s easy ${how}, cool down`.replace("  ", " ") };
  }
  if (p.reps.includes("run 1 min, walk 1 min")) return { ...p, durationMin: d, reps: `${d} min: run 1 min, walk 1 min` };
  return { ...p, durationMin: d, reps: `${d} min easy` };
}

/** Fit to the time available. Set-based sessions use fitToTime; if that isn't enough, only the first main lift stays. */
function fitTime(session: Session, minutes: number) {
  if (isTimed(session)) {
    const p = session.exercises[0];
    if ((p.durationMin ?? 0) <= minutes) return { session, changes: [], fits: true };
    const next = withMinutes(p, floor5(minutes));
    return { session: { ...session, exercises: [next] }, changes: [`${p.name} cut to ${next.durationMin} minutes to fit your time.`], fits: (next.durationMin ?? 0) <= minutes };
  }
  const fit = fitToTime(session, minutes);
  const mains = session.exercises.filter((e) => e.role === "main");
  if (fit.fits || mains.length < 2) return fit;
  // Not enough time for every main lift: start again from the session with only the first one.
  const keep = mains[0];
  const refit = fitToTime({ ...session, exercises: session.exercises.filter((e) => e.role !== "main" || e === keep) }, minutes);
  const changes = [`Only ${keep.name} as the main lift: there isn't time for ${list(mains.slice(1).map((e) => e.name))} as well.`, ...refit.changes];
  return { session: refit.session, changes, fits: refit.fits };
}

/** The kit someone is likely to have at home: the portable items from their equipment list. */
export const HOME_KIT: Equipment[] = ["dumbbells", "kettlebell", "bands", "pull-up-bar", "box", "bench"];
export const homeKit = (p: Profile): Equipment[] => p.equipment.filter((e) => HOME_KIT.includes(e));
export const kitOptions = EQUIPMENT.filter((o) => HOME_KIT.includes(o.value));
