"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { adaptationFor, clearAdaptation, useStored } from "@/lib/store";
import { detail, estimateMinutes } from "@/lib/training";
import { dateKey, useToday } from "@/lib/use-today";
import { NeedsProfile } from "./NeedsProfile";
import { SwapSheet } from "./SwapSheet";
import { Badge, ExerciseCard, StatTile } from "./ui/primitives";
import { Icon } from "./ui/Icon";

const restLabel = (sec: number) => (sec >= 60 ? `rest ${Math.round(sec / 30) / 2} min` : `rest ${sec} s`);

export function WorkoutPreview() {
  const id = useSearchParams().get("s");
  const stored = useStored();
  const router = useRouter();
  const today = useToday();
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  if (stored === "loading") return <div className="screen" aria-busy="true"><div className="skeleton" style={{ height: 420 }} /></div>;
  if (!stored) return <NeedsProfile title="Workout" />;
  // Today's adapted version replaces the planned one. Swaps edit the plan, so they're offered on the planned version only.
  const adapted = id && today ? adaptationFor(stored, dateKey(today), id) : null;
  const session = adapted?.result.kind === "session" ? adapted.result.session : id ? stored.plan.sessions[id] : undefined;

  const back = (
    <button type="button" className="back" onClick={() => router.back()}>
      <Icon name="chevron-left" />
      Back
    </button>
  );

  if (!session) {
    return (
      <div className="screen">
        <header className="top">{back}</header>
        <h1 className="h-display">Session not found</h1>
        <p className="body-copy muted">Your plan may have been rebuilt since this link was made.</p>
        <Link href="/plan" className="pu-btn pu-btn-secondary pu-btn-lg pu-btn-block">See this week&rsquo;s plan</Link>
      </div>
    );
  }

  const timed = session.exercises.every((e) => e.durationMin);
  return (
    <div className="screen">
      <header className="top">
        {back}
        <Badge>{adapted ? "Adapted" : "Milestone 5"}</Badge>
      </header>
      <section className="stack-2">
        <p className="eyebrow">{adapted ? adapted.label : "Workout"}</p>
        <h1 className="h-display">{session.name}</h1>
        <p className="muted">{session.purpose}</p>
      </section>
      <div className="grid-2">
        <StatTile label="Est. time" value={estimateMinutes(session)} unit="min" />
        {timed ? <StatTile label="Effort" value={session.hard ? "Hard" : "Easy"} /> : <StatTile label="Working sets" value={session.exercises.reduce((n, e) => n + e.sets, 0)} />}
      </div>
      {adapted ? (
        <p className="note">
          <Icon name="adapt" size={18} />
          <span>Adapted for today. <button type="button" className="text-link" onClick={clearAdaptation}>Back to the planned session</button></span>
        </p>
      ) : null}
      <p className="note">
        <Icon name="timer" size={18} />
        Logging arrives in milestone 5: set-by-set weights and reps, a rest timer, how hard it felt, and next-session targets.
      </p>
      <section className="stack-2" aria-label="Exercises">
        {session.exercises.map((e, i) => (
          <ExerciseCard key={e.exerciseId} index={i + 1} name={e.name}
            detail={e.durationMin ? detail(e) : `${detail(e)} · ${restLabel(e.restSec)}`}
            cue={e.cue ?? (e.swappedFrom ? `Swapped in for ${e.swappedFrom}` : undefined)} muscles={e.cue ? undefined : e.muscles}
            action={e.durationMin || adapted ? null : (
              <button type="button" className="icon-btn" aria-label={`Swap ${e.name}`} onClick={() => setSwapIndex(i)}><Icon name="swap" size={20} /></button>
            )} />
        ))}
      </section>
      <SwapSheet stored={stored} sessionId={id!} index={swapIndex} onClose={() => setSwapIndex(null)} />
    </div>
  );
}
