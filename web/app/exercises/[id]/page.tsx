import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { ExerciseActions, ExerciseSwaps } from "@/components/ExerciseDetailClient";
import { Icon } from "@/components/ui/Icon";
import { GUIDES, GUIDE_REVIEWED } from "@/lib/exercise-guide";
import { kitLabel } from "@/lib/exercise-format";
import { EXERCISES, EXERCISE_BY_ID, LEVEL_LABEL, PATTERN_NAME, areaOf } from "@/lib/exercises";
import { BODY_AREAS, labelOf } from "@/lib/profile";

export function generateStaticParams() {
  return EXERCISES.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: PageProps<"/exercises/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: EXERCISE_BY_ID[id]?.name ?? "Exercise" };
}

export default async function ExercisePage({ params }: PageProps<"/exercises/[id]">) {
  const { id } = await params;
  const e = EXERCISE_BY_ID[id];
  const guide = GUIDES[id];
  if (!e || !guide) notFound();

  const variations = [
    { title: "Easier", ids: guide.easier ?? [] },
    { title: "Harder", ids: guide.harder ?? [] },
  ].filter((v) => v.ids.length);

  return (
    <div className="screen">
      <header className="top">
        <BackButton fallback="/exercises" />
        <span className="eyebrow">{areaOf(e)}</span>
      </header>

      <section className="stack-2">
        <p className="eyebrow">{PATTERN_NAME[e.pattern]}</p>
        <h1 className="h-display">{e.name}</h1>
        <div className="chip-row">
          <span className="pu-chip pu-chip-static">{LEVEL_LABEL[e.level]}</span>
          <span className="pu-chip pu-chip-static">{kitLabel(e)}</span>
        </div>
      </section>

      <ExerciseActions id={e.id} name={e.name} />

      <div className="demo" role="img" aria-label="Demonstration video coming soon">
        <Image src="/brand/pressup-figures-yellow.png" alt="" width={240} height={40} />
        <p className="muted">Demonstration video coming soon</p>
      </div>

      <section className="stack-2" aria-labelledby="how">
        <h2 id="how" className="eyebrow">How to do it</h2>
        <ol className="steps card">
          {guide.steps.map((s, i) => (
            <li key={i}><span className="step-num" aria-hidden="true">{i + 1}</span><span>{s}</span></li>
          ))}
        </ol>
      </section>

      <section className="stack-2" aria-labelledby="cues">
        <h2 id="cues" className="eyebrow">Coaching cues</h2>
        <ul className="soon-list card">
          {guide.cues.map((c) => <li key={c}><Icon name="check" />{c}</li>)}
        </ul>
      </section>

      <section className="stack-2" aria-labelledby="muscles">
        <h2 id="muscles" className="eyebrow">What it trains</h2>
        <div className="card stack-2">
          <div className="chip-row">{e.muscles.map((m) => <span key={m} className="pu-chip pu-chip-static">{m}</span>)}</div>
          {e.stress.length ? <p className="muted">Puts noticeable load on your {e.stress.map((a) => labelOf(BODY_AREAS, a).toLowerCase()).join(" and ")}.</p> : null}
        </div>
      </section>

      {variations.length ? (
        <section className="stack-2" aria-labelledby="variations">
          <h2 id="variations" className="eyebrow">Variations</h2>
          <div className="card stack-3">
            {variations.map((v) => (
              <div key={v.title} className="stack-2">
                <p className="field-label">{v.title}</p>
                <div className="chip-row">
                  {v.ids.map((vid) => (
                    <Link key={vid} href={`/exercises/${vid}`} className="pu-chip">{EXERCISE_BY_ID[vid].name}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <ExerciseSwaps id={e.id} />

      {!GUIDE_REVIEWED ? (
        <p className="note">
          <Icon name="timer" size={18} />
          These instructions follow standard coaching practice and are awaiting review by a qualified coach. Stop if anything hurts.
        </p>
      ) : null}
    </div>
  );
}
