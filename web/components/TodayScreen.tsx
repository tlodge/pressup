"use client";

import Image from "next/image";
import { useState } from "react";
import { AdaptSheet } from "./AdaptSheet";
import { Badge, Button, ButtonLink, ExerciseCard, ProgressRing, StatTile } from "./ui/primitives";
import { SAMPLE_PLAN } from "@/lib/sample-plan";
import { WEEKDAY_SHORT, detail, estimateMinutes, weekdayOf, type Session } from "@/lib/training";
import { useToday } from "@/lib/use-today";

const plan = SAMPLE_PLAN;

export function TodayScreen() {
  const today = useToday();
  const [adapting, setAdapting] = useState(false);

  if (!today) return <TodaySkeleton />;

  const wd = weekdayOf(today);
  const todays = plan.days.find((d) => d.weekday === wd);
  const next = plan.days.find((d) => d.weekday > wd) ?? plan.days[0];
  const session = todays ? plan.sessions[todays.sessionId] : null;
  const done = plan.days.filter((d) => d.weekday < wd).length; // sample: earlier sessions this week count as done
  const dateLine = today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="screen">
      <header className="top">
        <Image src="/brand/pressup-wordmark-on-dark.png" alt="PressUp" width={107} height={22} priority />
        <Badge>Sample plan</Badge>
      </header>

      {session ? (
        <>
          <section className="stack-2">
            <p className="eyebrow">{dateLine} · Today&rsquo;s session</p>
            <h1 className="h-display">{session.name}</h1>
            <p className="muted">{session.purpose}</p>
          </section>

          <SessionStats session={session} />

          <div className="stack-3">
            <ButtonLink href={`/workout/${session.id}`} variant="primary" size="lg" block icon="play">
              Start workout
            </ButtonLink>
            <Button variant="secondary" size="lg" block icon="adapt" onClick={() => setAdapting(true)}>
              Adapt my workout
            </Button>
          </div>

          <ExerciseList session={session} />
        </>
      ) : (
        <>
          <section className="stack-2">
            <p className="eyebrow">{dateLine} · Rest day</p>
            <h1 className="h-display">Recover.</h1>
            <p className="muted">Rest is part of the plan. Next up is {plan.sessions[next.sessionId].name} on {WEEKDAY_SHORT[next.weekday]}.</p>
          </section>
          <Button variant="secondary" size="lg" block icon="adapt" onClick={() => setAdapting(true)}>
            Adapt my workout
          </Button>
          <ExerciseList session={plan.sessions[next.sessionId]} title={`Next: ${plan.sessions[next.sessionId].name}`} />
        </>
      )}

      <WeekCard weekday={wd} done={done} />
      <AdaptSheet open={adapting} onClose={() => setAdapting(false)} />
    </div>
  );
}

function SessionStats({ session }: { session: Session }) {
  const main = session.exercises.filter((e) => e.role === "main").length;
  return (
    <div className="grid-2">
      <StatTile label="Est. time" value={estimateMinutes(session)} unit="min" />
      <StatTile label="Exercises" value={session.exercises.length} unit={`${main} main`} />
    </div>
  );
}

function ExerciseList({ session, title }: { session: Session; title?: string }) {
  return (
    <section className="stack-2" aria-label="Exercises">
      <p className="eyebrow">{title ?? `${session.exercises.length} exercises`}</p>
      {session.exercises.map((e, i) => (
        <ExerciseCard key={e.exerciseId} index={i + 1} name={e.name} detail={detail(e)} muscles={e.muscles} />
      ))}
    </section>
  );
}

function WeekCard({ weekday, done }: { weekday: number; done: number }) {
  const total = plan.days.length;
  const left = total - done;
  return (
    <section className="card week" aria-label="This week">
      <ProgressRing value={done / total} size={84} stroke={8} label={`${done} / ${total}`} ariaLabel={`${done} of ${total} sessions done this week`}>
        <span className="pu-ring-value">{Math.round((done / total) * 100)}%</span>
      </ProgressRing>
      <div className="stack-3" style={{ flex: 1, minWidth: 0 }}>
        <p className="week-copy">
          <strong>{done === 0 ? "A fresh week" : left === 0 ? "Week complete" : `${done} done, ${left} to go`}</strong>
          {left === 0 ? "Every planned session is in. Enjoy the rest." : "Consistency over perfection. Every session counts."}
        </p>
        <ol className="week-strip">
          {WEEKDAY_SHORT.map((d, i) => {
            const planned = plan.days.some((p) => p.weekday === i);
            const state = !planned ? "rest" : i < weekday ? "done" : i === weekday ? "today" : "planned";
            return (
              <li key={d} className={`day day-${state}`} aria-label={`${d}: ${state === "rest" ? "rest" : state}`}>
                <span className="day-dot" aria-hidden="true" />
                {d.charAt(0)}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function TodaySkeleton() {
  return (
    <div className="screen" aria-busy="true">
      <header className="top">
        <Image src="/brand/pressup-wordmark-on-dark.png" alt="PressUp" width={107} height={22} priority />
      </header>
      <div className="skeleton" style={{ height: 120 }} />
      <div className="skeleton" style={{ height: 96 }} />
      <div className="skeleton" style={{ height: 120 }} />
    </div>
  );
}
