"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useStored } from "@/lib/store";
import { detail, estimateMinutes } from "@/lib/training";
import { NeedsProfile } from "./NeedsProfile";
import { Badge, ExerciseCard, StatTile } from "./ui/primitives";
import { Icon } from "./ui/Icon";

const restLabel = (sec: number) => (sec >= 60 ? `rest ${Math.round(sec / 30) / 2} min` : `rest ${sec} s`);

export function WorkoutPreview() {
  const id = useSearchParams().get("s");
  const stored = useStored();
  const router = useRouter();
  if (stored === "loading") return <div className="screen" aria-busy="true"><div className="skeleton" style={{ height: 420 }} /></div>;
  if (!stored) return <NeedsProfile title="Workout" />;
  const session = id ? stored.plan.sessions[id] : undefined;

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
        <Badge>Milestone 5</Badge>
      </header>
      <section className="stack-2">
        <p className="eyebrow">Workout</p>
        <h1 className="h-display">{session.name}</h1>
        <p className="muted">{session.purpose}</p>
      </section>
      <div className="grid-2">
        <StatTile label="Est. time" value={estimateMinutes(session)} unit="min" />
        {timed ? <StatTile label="Effort" value={session.hard ? "Hard" : "Easy"} /> : <StatTile label="Working sets" value={session.exercises.reduce((n, e) => n + e.sets, 0)} />}
      </div>
      <p className="note">
        <Icon name="timer" size={18} />
        Logging arrives in milestone 5: set-by-set weights and reps, a rest timer, how hard it felt, and next-session targets.
      </p>
      <section className="stack-2" aria-label="Exercises">
        {session.exercises.map((e, i) => (
          <ExerciseCard key={e.exerciseId} index={i + 1} name={e.name}
            detail={e.durationMin ? detail(e) : `${detail(e)} · ${restLabel(e.restSec)}`} cue={e.cue} muscles={e.cue ? undefined : e.muscles} />
        ))}
      </section>
    </div>
  );
}
