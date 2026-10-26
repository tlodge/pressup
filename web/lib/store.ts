"use client";

/* The user's profile and plan, kept in this browser until accounts arrive in milestone 8. */
import { useSyncExternalStore } from "react";
import type { Adaptation, AdaptRequest } from "./engine/adapt";
import { generatePlan } from "./engine/plan";
import type { Profile } from "./profile";
import type { WeekPlan } from "./training";

/** Today's adapted session (or rest), from the check-in or ADAPT MY WORKOUT. It only counts on the day it was made. */
export type DayAdaptation = { date: string; sessionId: string; label: string; request: AdaptRequest; result: Adaptation };

export type Stored = { profile: Profile; plan: WeekPlan; today?: DayAdaptation };

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

/** Save the profile and rebuild the plan from it. A rebuilt plan drops today's adaptation, which belonged to the old one. */
export function saveProfile(profile: Profile): Stored {
  const now = new Date().toISOString();
  const stored = { profile: { ...profile, updatedAt: now }, plan: generatePlan(profile, now) };
  write(stored);
  return stored;
}

/** Save an edited plan (for example a swapped exercise) without rebuilding it. */
export function savePlan(plan: WeekPlan) {
  const current = read();
  if (current) write({ ...current, plan });
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
  if (current) write({ profile: current.profile, plan: current.plan });
}

/** Today's adaptation, if one was made today for this session. */
export const adaptationFor = (stored: Stored, date: string, sessionId?: string) =>
  stored.today?.date === date && (!sessionId || stored.today.sessionId === sessionId) ? stored.today : null;

export function clearAll() {
  write(null);
}
