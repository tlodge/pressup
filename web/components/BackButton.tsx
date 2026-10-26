"use client";

import { useRouter } from "next/navigation";
import { Icon } from "./ui/Icon";

/** Goes back in history, or to `fallback` when the page was opened directly. */
export function BackButton({ fallback, label = "Back" }: { fallback: string; label?: string }) {
  const router = useRouter();
  return (
    <button type="button" className="back" onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}>
      <Icon name="chevron-left" />
      {label}
    </button>
  );
}
