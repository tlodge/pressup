"use client";

import { useSyncExternalStore } from "react";

const subscribe = (onChange: () => void) => {
  // Re-read the date when the app comes back to the foreground, so a tab left open overnight moves on to the new day.
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
};

/** Today's date on the user's device, or null while prerendering on the server (the plan lives on the device). */
export function useToday(): Date | null {
  const key = useSyncExternalStore(subscribe, () => new Date().toDateString(), () => null);
  return key ? new Date(key) : null;
}

/** A local calendar date as YYYY-MM-DD, used to tie an adaptation to the day it was made. */
export const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
