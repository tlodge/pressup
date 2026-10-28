"use client";

/* The user's profile and plan, kept in this browser until accounts arrive in milestone 8. */
import { useSyncExternalStore } from "react";
import { isLight, type Adaptation, type AdaptRequest } from "./engine/adapt";
import { generatePlan } from "./engine/plan";
import { startLog } from "./engine/progress";
import type { Week } from "./engine/schedule";
import { carrySwaps } from "./engine/substitute";
import type { Profile } from "./profile";
import type { Session, Weekday, WeekPlan } from "./training";
import { weekDates } from "./use-today";
import type { WorkoutLog } from "./workout-log";

/** Today's adapted session (or rest), from the check-in or ADAPT MY WORKOUT. It only counts on the day it was made. */
export type DayAdaptation = { date: string; sessionId: string; label: string; request: AdaptRequest; result: Adaptation };

/** Changes to one week only: moved sessions, skips, folded lifts and the week's busy days. `sessions` holds only the
    sessions that differ from the plan. The plan itself is untouched, so next week starts fresh. */
export type WeekEdit = Week & { start: string; changes: string[] };

export type Stored = {
  profile: Profile;
  plan: WeekPlan;
  today?: DayAdaptation;
  /** Finished workouts, oldest first. */
  logs?: WorkoutLog[];
  /** The workout in progress, saved after every change so a reload or a phone call doesn't lose it. */
  active?: WorkoutLog;
  week?: WeekEdit;
};

const KEY = "pressup.v1";
const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedValue: Stored | null = null;

function read(): Stored | null {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    raw = null; // storage blocked (private mode, strict settings): behave as a new user
  }
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    const parsed = raw ? (JSON.parse(raw) as Stored) : null;
    cachedValue = parsed?.profile?.version === 1 && parsed.plan ? parsed : null;
  } catch {
    cachedValue = null;
  }
  return cachedValue;
}

function write(value: Stored | null) {
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage full or blocked: keep the in-memory copy so the session still works.
    cachedRaw = value ? JSON.stringify(value) : null;
    cachedValue = value;
  }
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => e.key === KEY && onChange();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** "loading" while prerendering on the server, null for a new user, otherwise the saved profile and plan. */
export function useStored(): Stored | null | "loading" {
  return useSyncExternalStore<Stored | null | "loading">(subscribe, read, () => "loading");
}

/** Save the profile and rebuild the plan from it, keeping the user's swaps where they still apply. A rebuilt plan drops
    today's adaptation and this week's changes, which belonged to the old one; logged workouts and one in progress are kept. */
export function saveProfile(profile: Profile): Stored {
  const now = new Date().toISOString();
  const current = read();
  let plan = generatePlan(profile, now);
  if (current) {
    const carried = carrySwaps(current.plan, plan, profile);
    plan = carried.plan;
    if (carried.kept) plan.notes = [...plan.notes, `${carried.kept === 1 ? "A swap you made is" : `${carried.kept} swaps you made are`} kept.`];
  }
  // This week's moves belong to the old plan's sessions, so a rebuilt plan starts the week afresh.
  const stored: Stored = { profile: { ...profile, updatedAt: now }, plan, logs: current?.logs, active: current?.active };
  write(stored);
  return stored;
}

/** Favourite or un-favourite an exercise. Favourites steer exercise choice, so the plan is rebuilt. */
export function toggleFavourite(id: string) {
  const current = read();
  if (!current) return;
  const p = current.profile;
  const favourites = p.favourites.includes(id) ? p.favourites.filter((x) => x !== id) : [...p.favourites, id];
  saveProfile({ ...p, favourites });
}

/** Leave an exercise out of plans, or bring it back. The plan is rebuilt so it takes effect straight away. */
export function toggleExcluded(id: string) {
  const current = read();
  if (!current) return;
  const p = current.profile;
  const excluded = p.excluded.includes(id) ? p.excluded.filter((x) => x !== id) : [...p.excluded, id];
  saveProfile({ ...p, excluded, favourites: p.favourites.filter((x) => x !== id || !excluded.includes(id)) });
}

/** Use an adapted session (or a rest day) for today. */
export function saveAdaptation(today: DayAdaptation) {
  const current = read();
  if (current) write({ ...current, today });
}

/** Go back to the planned session. */
export function clearAdaptation() {
  const current = read();
  if (current) write({ ...current, today: undefined });
}

/** Today's adaptation, if one was made today for this session. */
export const adaptationFor = (stored: Stored, date: string, sessionId?: string) =>
  stored.today?.date === date && (!sessionId || stored.today.sessionId === sessionId) ? stored.today : null;

/** Begin logging a session on a date: today's adapted version if there is one, otherwise the plan's.
    Targets come from the logs so far. Starting another replaces any workout left in progress. */
export function startWorkout(sessionId: string, date: string) {
  const current = read();
  if (!current) return;
  const adapted = adaptationFor(current, date, sessionId);
  const session = adapted?.result.kind === "session" ? adapted.result.session : sessionFor(current, sessionId, new Date(`${date}T12:00:00`));
  if (!session) return;
  const log = startLog(session, sessionId, date, current.logs ?? [], current.profile.equipment, {
    light: adapted ? isLight(adapted.request) : false, adaptedLabel: adapted?.label,
  });
  write({ ...current, active: log });
}

/** Save a change to the workout in progress. */
export function updateWorkout(log: WorkoutLog) {
  const current = read();
  if (current?.active?.id === log.id) write({ ...current, active: log });
}

/** Finish the workout in progress and add it to the log. Returns the finished log. */
export function finishWorkout(extra: Pick<WorkoutLog, "effort" | "notes">): WorkoutLog | null {
  const current = read();
  if (!current?.active) return null;
  const done: WorkoutLog = { ...current.active, ...extra, finishedAt: new Date().toISOString() };
  write({ ...current, active: undefined, logs: [...(current.logs ?? []), done] });
  return done;
}

export function discardWorkout() {
  const current = read();
  if (current) write({ ...current, active: undefined });
}

/** The finished workout for a session on a date, if there is one. */
export const loggedFor = (stored: Stored, date: string, sessionId?: string) =>
  [...(stored.logs ?? [])].reverse().find((l) => l.date === date && (!sessionId || l.sessionId === sessionId)) ?? null;

export function clearAll() {
  write(null);
}

/** Monday of the week a date falls in, as YYYY-MM-DD. */
export const mondayOf = (d: Date) => weekDates(d)[0];

export type WeekView = Week & { start: string; changes: string[]; edited: boolean; dates: string[] };

/** The week a date falls in: the plan's layout with any changes made for that week. */
export function weekView(stored: Stored, d: Date): WeekView {
  const dates = weekDates(d);
  const edit = stored.week?.start === dates[0] ? stored.week : null;
  return {
    start: dates[0], dates, edited: !!edit,
    days: edit?.days ?? stored.plan.days,
    sessions: { ...stored.plan.sessions, ...edit?.sessions },
    skipped: edit?.skipped ?? [], busy: edit?.busy ?? {}, changes: edit?.changes ?? [],
  };
}

/** A session as it stands for the week of `d`: this week's version if it was changed, otherwise the plan's. */
export const sessionFor = (stored: Stored, id: string, d: Date): Session | undefined => weekView(stored, d).sessions[id];

/** Weekdays of this week with a finished workout. */
export function doneWeekdays(stored: Stored, d: Date): Weekday[] {
  const dates = weekDates(d);
  return [...new Set((stored.logs ?? []).filter((l) => l.finishedAt && dates.includes(l.date)).map((l) => dates.indexOf(l.date) as Weekday))];
}

/** Accept a change to this week. Only sessions that differ from the plan are stored. */
export function saveWeek(week: Week, d: Date, change: string) {
  const current = read();
  if (!current) return;
  const view = weekView(current, d);
  const sessions = Object.fromEntries(Object.entries(week.sessions).filter(([id, s]) => JSON.stringify(s) !== JSON.stringify(current.plan.sessions[id])));
  write({ ...current, week: { days: week.days, skipped: week.skipped, busy: week.busy, sessions, start: view.start, changes: [...view.changes, change] } });
}

/** Put this week back to the plan. Logged workouts are untouched. */
export function resetWeek() {
  const current = read();
  if (current) write({ ...current, week: undefined });
}

/** Save an edited session (a swap): this week's version if the week changed it, otherwise the plan's. */
export function saveSession(id: string, session: Session, d: Date) {
  const current = read();
  if (!current) return;
  const view = weekView(current, d);
  if (current.week && view.edited && current.week.sessions[id]) {
    write({ ...current, week: { ...current.week, sessions: { ...current.week.sessions, [id]: session } } });
  } else {
    write({ ...current, plan: { ...current.plan, sessions: { ...current.plan.sessions, [id]: session } } });
  }
}
