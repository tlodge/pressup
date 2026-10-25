import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Badge, ExerciseCard, StatTile } from "@/components/ui/primitives";
import { SAMPLE_PLAN } from "@/lib/sample-plan";
import { detail, estimateMinutes } from "@/lib/training";

export function generateStaticParams() {
  return Object.keys(SAMPLE_PLAN.sessions).map((id) => ({ id }));
}

export async function generateMetadata({ params }: PageProps<"/workout/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: SAMPLE_PLAN.sessions[id]?.name ?? "Workout" };
}

export default async function WorkoutPage({ params }: PageProps<"/workout/[id]">) {
  const { id } = await params;
  const session = SAMPLE_PLAN.sessions[id];
  if (!session) notFound();

  return (
    <div className="screen">
      <header className="top">
        <Link href="/" className="back">
          <Icon name="chevron-left" />
          Today
        </Link>
        <Badge>Milestone 5</Badge>
      </header>
      <section className="stack-2">
        <p className="eyebrow">Workout</p>
        <h1 className="h-display">{session.name}</h1>
        <p className="muted">{session.purpose}</p>
      </section>
      <div className="grid-2">
        <StatTile label="Est. time" value={estimateMinutes(session)} unit="min" />
        <StatTile label="Working sets" value={session.exercises.reduce((n, e) => n + e.sets, 0)} />
      </div>
      <p className="note">
        <Icon name="timer" size={18} />
        Logging arrives in milestone 5: set-by-set weights and reps, a rest timer, how hard it felt, and next-session targets.
      </p>
      <section className="stack-2" aria-label="Exercises">
        {session.exercises.map((e, i) => (
          <ExerciseCard key={e.exerciseId} index={i + 1} name={e.name} detail={`${detail(e)} · rest ${Math.round(e.restSec / 30) / 2} min`} muscles={e.muscles} />
        ))}
      </section>
    </div>
  );
}
