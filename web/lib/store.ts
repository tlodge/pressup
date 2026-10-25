"use client";

/* The user's profile and plan, kept in this browser until accounts arrive in milestone 8. */
import { useSyncExternalStore } from "react";
import { generatePlan } from "./engine/plan";
import type { Profile } from "./profile";
import type { WeekPlan } from "./training";

export type Stored = { profile: Profile; plan: WeekPlan };

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

/** Save the profile and rebuild the plan from it. */
export function saveProfile(profile: Profile): Stored {
  const now = new Date().toISOString();
  const stored = { profile: { ...profile, updatedAt: now }, plan: generatePlan(profile, now) };
  write(stored);
  return stored;
}

export function clearAll() {
  write(null);
}
