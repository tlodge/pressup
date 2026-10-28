/* This week's schedule: moving a session, sorting out a missed one, and planning around the week's commitments.
   The rules:
   - One session a day at most, and never on a day that's already gone. Nothing is ever doubled up.
   - A change can't put two hard leg days back to back, a heavy leg day before a hard run, or two hard runs together.
   - A missed session can move to a free, suitable day, have its main lifts folded into a later session (which is
     trimmed to keep its length), or be skipped.
   - With commitments entered, the remaining sessions are laid out on the free days with the least recovery cost.
     If there are more sessions than free days, the least important are skipped, never squeezed in.
   Every option comes with its reason, and nothing changes until the user accepts it. */
import { EXERCISE_BY_ID, type Pattern } from "../exercises";
import { estimateMinutes, WEEKDAY_LONG, WEEKDAY_SHORT, type Prescription, type Session, type Weekday, type WeekPlan } from "../training";
import { fitToTime } from "./fit";
import { adjacent, layoutPenalty } from "./plan";

/** How much time a day has: busy days take no session, short days take one fitted to SHORT_DAY_MIN minutes. */
export type Availability = "free" | "short" | "busy";
export const SHORT_DAY_MIN = 30;
export const AVAILABILITY: { value: Availability; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "short", label: `About ${SHORT_DAY_MIN} min` },
  { value: "busy", label: "Busy" },
];

/** The week as it stands: the plan's layout with this week's changes applied. */
export type Week = {
  days: WeekPlan["days"];
  sessions: Record<string, Session>;
  skipped: string[];
  busy: Partial<Record<Weekday, Availability>>;
};

/** A proposed change to this week, with the reason and the week it would produce. */
export type Change = { summary: string; reasons: string[]; week: Week };

export type DayOption = { weekday: Weekday; ok: boolean; reason: string; change?: Change };

const isLegHeavy = (s: Session) => s.legLoad === 2 && s.focus !== "run";
const isHardRun = (s: Session) => s.focus === "run" && s.hard;
const isStrength = (s: Session) => s.focus !== "run" && s.focus !== "conditioning";
const LEG_PATTERNS: Pattern[] = ["squat", "hinge", "lunge", "glute", "quad-iso", "ham-iso", "calves"];

const sessionOn = (week: Week, d: number) => {
  const entry = week.days.find((x) => x.weekday === d);
  return entry && !week.skipped.includes(entry.sessionId) ? { id: entry.sessionId, s: week.sessions[entry.sessionId] } : null;
};

/** Why two sessions on neighbouring days slow recovery, or null when they're fine together. `a` comes first. */
function clash(a: Session, b: Session): string | null {
  if (isLegHeavy(a) && isLegHeavy(b)) return "two hard leg days back to back slow recovery";
  if (isLegHeavy(a) && isHardRun(b)) return "a hard run straight after a heavy leg day risks injury";
  if (isHardRun(a) && isLegHeavy(b)) return "heavy legs straight after a hard run won't go well";
  if (isHardRun(a) && isHardRun(b)) return "two hard runs back to back leave no time to recover";
  return null;
}

/** The first recovery problem with `s` on day `d`, ignoring the session being moved. */
function recoveryProblem(week: Week, s: Session, d: Weekday, ignore: string): string | null {
  for (const other of [((d + 6) % 7) as Weekday, ((d + 1) % 7) as Weekday]) {
    if ((other === 6 && d === 0) || (other === 0 && d === 6)) continue; // a week doesn't wrap round
    const o = sessionOn(week, other);
    if (!o || o.id === ignore) continue;
    const why = other < d ? clash(o.s, s) : clash(s, o.s);
    if (why) return `${o.s.name} is on ${WEEKDAY_LONG[other]}, and ${why}.`;
  }
  return null;
}

const withSession = (week: Week, id: string, s: Session): Week => ({ ...week, sessions: { ...week.sessions, [id]: s } });

/** Fit a session to a short day, saying what changed. */
function fitShort(s: Session): { session: Session; note?: string } {
  if (estimateMinutes(s) <= SHORT_DAY_MIN) return { session: s };
  if (s.exercises.every((e) => e.durationMin)) {
    const e = s.exercises[0];
    const cut = { ...e, durationMin: SHORT_DAY_MIN, reps: e.reps.replace(/^\d+ min/, `${SHORT_DAY_MIN} min`) };
    return { session: { ...s, exercises: [cut] }, note: `${s.name} is cut to ${SHORT_DAY_MIN} minutes to fit a short day.` };
  }
  const fit = fitToTime(s, SHORT_DAY_MIN);
  return { session: fit.session, note: `${s.name} is trimmed to about ${estimateMinutes(fit.session)} minutes for a short day: main lifts kept, extras cut.` };
}

/** Every day this session could move to this week, marked suitable or not with the reason. */
export function moveOptions(week: Week, sessionId: string, today: Weekday, doneDays: Weekday[]): DayOption[] {
  const from = week.days.find((d) => d.sessionId === sessionId);
  const s = week.sessions[sessionId];
  if (!from || !s) return [];
  return (WEEKDAY_SHORT.map((_, i) => i as Weekday)).filter((d) => d >= today && d !== from.weekday).map((d) => {
    const taken = sessionOn(week, d);
    if (doneDays.includes(d)) return { weekday: d, ok: false, reason: "You've already trained that day." };
    if (taken) return { weekday: d, ok: false, reason: `${taken.s.name} is already on ${WEEKDAY_LONG[d]}. One session a day.` };
    if (week.busy[d] === "busy") return { weekday: d, ok: false, reason: "You're busy that day." };
    const problem = recoveryProblem(week, s, d, sessionId);
    if (problem) return { weekday: d, ok: false, reason: problem };
    const short = week.busy[d] === "short" ? fitShort(s) : { session: s };
    const days = week.days.map((x) => (x.sessionId === sessionId ? { ...x, weekday: d } : x)).sort((a, b) => a.weekday - b.weekday);
    const next: Week = { ...withSession(week, sessionId, short.session), days, skipped: week.skipped.filter((x) => x !== sessionId) };
    const reason = neighboursNote(next, d, sessionId);
    return {
      weekday: d, ok: true, reason,
      change: { summary: `${s.name} moves from ${WEEKDAY_LONG[from.weekday]} to ${WEEKDAY_LONG[d]}.`, reasons: [reason, ...(short.note ? [short.note] : [])], week: next },
    };
  });
}

function neighboursNote(week: Week, d: Weekday, id: string): string {
  const around = [d - 1, d + 1].filter((x) => x >= 0 && x <= 6).map((x) => sessionOn(week, x)).filter((x) => x && x.id !== id);
  if (!around.length) return "Rest days either side, so it's well recovered.";
  return `No recovery clash with ${around.map((x) => x!.s.name).join(" or ")} next to it.`;
}

/** Planned sessions on days already gone this week with nothing logged and not skipped. */
export function missedSessions(week: Week, today: Weekday, doneDays: Weekday[]): { weekday: Weekday; sessionId: string }[] {
  return week.days.filter((d) => d.weekday < today && !doneDays.includes(d.weekday) && !week.skipped.includes(d.sessionId));
}

/** Ways to handle a missed session: move it, fold its main lifts into a later session, or skip it. */
export function missedOptions(week: Week, sessionId: string, today: Weekday, doneDays: Weekday[], minutes: number) {
  const missed = week.sessions[sessionId];
  const moves = moveOptions(week, sessionId, today, doneDays).map((o) => (o.change ? { ...o, change: { ...o.change, summary: `${missed.name} moves to ${WEEKDAY_LONG[o.weekday]}.` } } : o));
  const folds = isStrength(missed) ? foldOptions(week, sessionId, today, doneDays, minutes) : [];
  const skip: Change = {
    summary: `${missed.name} is skipped this week.`,
    reasons: ["Your next sessions stay as planned. Nothing is doubled up to make up for it.", "One missed session makes no real difference over a few weeks. Consistency is what counts."],
    week: { ...week, skipped: [...week.skipped, sessionId] },
  };
  return { moves, folds, skip };
}

/** Fold a missed session's main lifts into each later strength session, trimming it so it keeps its usual length. */
function foldOptions(week: Week, sessionId: string, today: Weekday, doneDays: Weekday[], minutes: number): DayOption[] {
  const missed = week.sessions[sessionId];
  const mains = missed.exercises.filter((e) => e.role === "main");
  return week.days.filter((d) => d.weekday >= today && !doneDays.includes(d.weekday) && d.sessionId !== sessionId && !week.skipped.includes(d.sessionId)).flatMap((d): DayOption[] => {
    const target = week.sessions[d.sessionId];
    if (!isStrength(target)) return [];
    const patterns = new Set(target.exercises.map((e) => EXERCISE_BY_ID[e.exerciseId]?.pattern));
    const ids = new Set(target.exercises.map((e) => e.exerciseId));
    const add: Prescription[] = mains
      .filter((e) => !ids.has(e.exerciseId) && !patterns.has(EXERCISE_BY_ID[e.exerciseId]?.pattern))
      .map((e) => ({ ...e, sets: Math.min(e.sets, 3), cue: `From ${missed.name}` }));
    if (!add.length) return [{ weekday: d.weekday, ok: false, reason: `${target.name} already trains the same movements.` }];
    const legs = add.some((e) => LEG_PATTERNS.includes(EXERCISE_BY_ID[e.exerciseId]?.pattern));
    // Main lifts first, then the folded lifts, then the rest, so trimming for time takes the extras and keeps both.
    const ordered = [...target.exercises.filter((e) => e.role === "main"), ...add.map((e) => ({ ...e, role: "main" as const })), ...target.exercises.filter((e) => e.role !== "main")];
    const combined: Session = { ...target, exercises: ordered, legLoad: legs ? 2 : target.legLoad, hard: target.hard || legs };
    const fit = fitToTime(combined, Math.max(minutes, estimateMinutes(target)));
    if (!fit.fits) return [{ weekday: d.weekday, ok: false, reason: `There isn't room in ${target.name} for ${list(add.map((e) => e.name))} without making it longer.` }];
    const problem = recoveryProblem(week, fit.session, d.weekday, d.sessionId);
    if (problem) return [{ weekday: d.weekday, ok: false, reason: `With the leg work added: ${problem}` }];
    const cut = target.exercises.filter((e) => !fit.session.exercises.some((x) => x.exerciseId === e.exerciseId)).map((e) => e.name);
    const reasons = [
      `${list(add.map((e) => e.name))} join${add.length === 1 ? "s" : ""} ${target.name} with ${add.every((e) => e.sets <= 3) ? "fewer sets" : "the planned sets"}, so the key work still gets done.`,
      cut.length ? `${list(cut)} ${cut.length === 1 ? "is" : "are"} left out so the session doesn't get longer.` : "It still fits your usual session length.",
      "The rest of the missed session is skipped. Nothing is doubled up.",
    ];
    return [{
      weekday: d.weekday, ok: true, reason: `Into ${target.name} on ${WEEKDAY_LONG[d.weekday]}`,
      change: {
        summary: `${list(add.map((e) => e.name))} folded into ${target.name} on ${WEEKDAY_LONG[d.weekday]}.`,
        reasons,
        week: { ...withSession(week, d.sessionId, { ...fit.session, purpose: `${target.purpose} Plus the key lifts from ${missed.name}.` }), skipped: [...week.skipped, sessionId] },
      },
    }];
  });
}

const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

function combinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (items.length < k) return [];
  const [first, ...rest] = items;
  return [...combinations(rest, k - 1).map((c) => [first, ...c]), ...combinations(rest, k)];
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((x, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((r) => [x, ...r]));
}

/** Lower is less important: easy runs and conditioning give way first, then sessions that aren't hard. */
const priority = (s: Session) => (s.focus === "conditioning" || (s.focus === "run" && !s.hard) ? 0 : s.hard ? 2 : 1);

/** Lay out the rest of the week around the days the user is busy or short of time. */
export function planAroundWeek(week: Week, busy: Week["busy"], today: Weekday, doneDays: Weekday[]): Change {
  const base: Week = { ...week, busy };
  const fixed = week.days.filter((d) => d.weekday < today || doneDays.includes(d.weekday));
  const remaining = week.days.filter((d) => !fixed.includes(d) && !week.skipped.includes(d.sessionId));
  const free = (WEEKDAY_SHORT.map((_, i) => i as Weekday)).filter((d) => d >= today && !doneDays.includes(d) && busy[d] !== "busy" && !fixed.some((f) => f.weekday === d));

  // Too many sessions for the free days: skip the least important, latest first.
  const keep = [...remaining];
  const dropped: string[] = [];
  while (keep.length > free.length) {
    const victim = [...keep].sort((a, b) => priority(week.sessions[a.sessionId]) - priority(week.sessions[b.sessionId]) || b.weekday - a.weekday)[0];
    keep.splice(keep.indexOf(victim), 1);
    dropped.push(victim.sessionId);
  }

  const fixedS = fixed.filter((d) => !week.skipped.includes(d.sessionId)).map((d) => week.sessions[d.sessionId]);
  const fixedD = fixed.filter((d) => !week.skipped.includes(d.sessionId)).map((d) => d.weekday);
  let best: { days: Weekday[]; order: typeof keep; cost: number } | null = null;
  for (const days of combinations(free, keep.length)) {
    for (const order of permutations(keep)) {
      const sessions = order.map((d) => week.sessions[d.sessionId]);
      let cost = layoutPenalty([...fixedS, ...sessions], [...fixedD, ...days]) * 10;
      order.forEach((d, i) => {
        if (busy[days[i]] === "short" && estimateMinutes(week.sessions[d.sessionId]) > SHORT_DAY_MIN) cost += 3 + priority(week.sessions[d.sessionId]) * 2;
        if (days[i] !== d.weekday) cost += 1; // prefer the planned day when it's free
      });
      if (!best || cost < best.cost) best = { days, order, cost };
    }
  }

  let next: Week = { ...base, skipped: [...week.skipped, ...dropped] };
  const reasons: string[] = [];
  const placed = (best?.order ?? []).map((d, i) => ({ from: d.weekday, weekday: best!.days[i], sessionId: d.sessionId }));
  next.days = [...fixed, ...placed.map(({ weekday, sessionId }) => ({ weekday, sessionId })), ...week.days.filter((d) => dropped.includes(d.sessionId))]
    .sort((a, b) => a.weekday - b.weekday);
  for (const p of placed) {
    const s = week.sessions[p.sessionId];
    if (p.weekday !== p.from) reasons.push(`${s.name} moves from ${WEEKDAY_LONG[p.from]} to ${WEEKDAY_LONG[p.weekday]}.`);
    if (busy[p.weekday] === "short") {
      const short = fitShort(s);
      next = withSession(next, p.sessionId, short.session);
      if (short.note) reasons.push(short.note);
    }
  }
  for (const id of dropped) reasons.push(`${week.sessions[id].name} is skipped: there aren't enough free days, and squeezing it in would mean doubling up.`);
  const clashes = placed.some((a) => placed.some((b) => a !== b && adjacent(a.weekday, b.weekday) && a.weekday < b.weekday && clash(week.sessions[a.sessionId], week.sessions[b.sessionId])));
  if (clashes) reasons.push("With these free days, two demanding sessions end up back to back. Adapt the second one to a lighter session if you need to.");
  if (!reasons.length) reasons.push("Your sessions already fit around your week. Nothing needs to move.");
  return { summary: placed.some((p) => p.weekday !== p.from) || dropped.length ? "A new layout for the rest of your week." : "No changes needed.", reasons, week: next };
}
