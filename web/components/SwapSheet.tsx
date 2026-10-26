"use client";

import Link from "next/link";
import { availableSwaps } from "@/lib/engine/substitute";
import { isBodyweight } from "@/lib/exercises";
import { kitLabel } from "@/lib/exercise-format";
import { savePlan, type Stored } from "@/lib/store";
import { Sheet } from "./Sheet";
import { Icon } from "./ui/Icon";

/** Swap one exercise in a planned session for one that trains the same thing. Sets, reps and rest stay the same. */
export function SwapSheet({ stored, sessionId, index, onClose }: { stored: Stored; sessionId: string; index: number | null; onClose: () => void }) {
  const session = stored.plan.sessions[sessionId];
  const current = index !== null ? session?.exercises[index] : undefined;
  const others = session ? session.exercises.map((e) => e.exerciseId) : [];
  const swaps = current ? availableSwaps(current.exerciseId, stored.profile, others).slice(0, 5) : [];

  const choose = (id: string) => {
    if (!current || index === null) return;
    const swap = swaps.find((s) => s.exercise.id === id)!.exercise;
    const exercises = session.exercises.map((e, i) =>
      i === index
        ? { ...e, exerciseId: swap.id, name: swap.name, muscles: swap.muscles, load: isBodyweight(swap) && swap.kits.length === 1 ? "Bodyweight" : undefined, swappedFrom: e.swappedFrom ?? e.name }
        : e,
    );
    savePlan({ ...stored.plan, sessions: { ...stored.plan.sessions, [sessionId]: { ...session, exercises } } });
    onClose();
  };

  return (
    <Sheet open={index !== null} onClose={onClose} title={current ? `Swap ${current.name}` : "Swap"} id="swap-title">
      {swaps.length ? (
        <>
          <p className="muted">These train the same thing with your kit and limits. Sets, reps and rest stay as planned.</p>
          <ul className="mode-list">
            {swaps.map((s) => (
              <li key={s.exercise.id}>
                <button type="button" className="mode mode-btn" onClick={() => choose(s.exercise.id)}>
                  <span className="mode-icon"><Icon name="swap" /></span>
                  <span>
                    <strong>{s.exercise.name}</strong>
                    <span className="muted">{s.reason} · {kitLabel(s.exercise)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="muted">There&rsquo;s no other exercise that trains the same thing with your current kit and limits. You can change your equipment in <Link className="text-link" href="/profile">Profile</Link>.</p>
      )}
    </Sheet>
  );
}
