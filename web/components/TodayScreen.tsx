"use client";

import Image from "next/image";
import { useState } from "react";
import { AdaptSheet } from "./AdaptSheet";
import { Badge, Button, ButtonLink, ExerciseCard, ProgressRing, StatTile } from "./ui/primitives";
import { useStored } from "@/lib/store";
import { WEEKDAY_LONG, WEEKDAY_SHORT, detail, estimateMinutes, weekdayOf, type Session, type WeekPlan } from "@/lib/training";
import { useToday } from "@/lib/use-today";

export function TodayScreen() {
  const today = useToday();
  const stored = useStored();
  const [adapting, setAdapting] = useState(false);

  if (!today || stored === "loading") return <TodaySkeleton />;
  if (!stored) return <Welcome />;

  const { plan } = stored;
  const wd = weekdayOf(today);
  const todays = plan.days.find((d) => d.weekday === wd);
  const next = plan.days.find((d) => d.weekday > wd) ?? plan.days[0];
  const session = todays ? plan.sessions[todays.sessionId] : null;
  const nextSession = plan.sessions[next.sessionId];
  const dateLine = today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="screen">
      <header className="top">
        <Image src="/brand/pressup-wordmark-on-dark.png" alt="PressUp" width={107} height={22} priority />
        <Badge>{plan.days.length} days a week</Badge>
      </header>

      {session && todays ? (
        <>
          <section className="stack-2">
            <p className="eyebrow">{dateLine} · Today&rsquo;s session</p>
            <h1 className="h-display">{session.name}</h1>
            <p className="muted">{session.purpose}</p>
          </section>

          <SessionStats session={session} />

          <div className="stack-3">
            <ButtonLink href={`/workout?s=${todays.sessionId}`} variant="primary" size="lg" block icon="play">
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
            <p className="muted">Rest is part of the plan. Next up is {nextSession.name} on {WEEKDAY_LONG[next.weekday]}.</p>
          </section>
          <Button variant="secondary" size="lg" block icon="adapt" onClick={() => setAdapting(true)}>
            Adapt my workout
          </Button>
          <ExerciseList session={nextSession} title={`Next: ${nextSession.name}`} />
        </>
      )}

      <WeekCard plan={plan} weekday={wd} />
      <AdaptSheet open={adapting} onClose={() => setAdapting(false)} />
    </div>
  );
}

function Welcome() {
  return (
    <div className="screen welcome">
      <header className="top">
        <Image src="/brand/pressup-wordmark-on-dark.png" alt="PressUp" width={107} height={22} priority />
      </header>
      <section className="stack-3">
        <h1 className="h-hero">Fitness that fits <span>real life.</span></h1>
        <p className="body-copy muted">A plan that adapts to your time, energy and week, so a busy day doesn&rsquo;t mean a missed one. Less pressure. More progress.</p>
      </section>
      <ul className="soon-list">
        <li><span className="welcome-num">1</span>Tell PressUp your goals, schedule and kit.</li>
        <li><span className="welcome-num">2</span>Get a weekly plan built around recovery.</li>
        <li><span className="welcome-num">3</span>Adapt any session when life gets in the way.</li>
      </ul>
      <div className="stack-2">
        <ButtonLink href="/onboarding" variant="primary" size="lg" block>Build my plan</ButtonLink>
        <p className="muted center">Takes about 2 minutes. Your answers stay on this device.</p>
      </div>
      <Image className="figures" src="/brand/pressup-figures-yellow.png" alt="" width={240} height={40} />
    </div>
  );
}

function SessionStats({ session }: { session: Session }) {
  const timed = session.exercises.every((e) => e.durationMin);
  const main = session.exercises.filter((e) => e.role === "main").length;
  return (
    <div className="grid-2">
      <StatTile label="Est. time" value={estimateMinutes(session)} unit="min" />
      {timed ? (
        <StatTile label="Effort" value={session.hard ? "Hard" : "Easy"} />
      ) : (
        <StatTile label="Exercises" value={session.exercises.length} unit={`${main} main`} />
      )}
    </div>
  );
}

function ExerciseList({ session, title }: { session: Session; title?: string }) {
  const timed = session.exercises.every((e) => e.durationMin);
  return (
    <section className="stack-2" aria-label="Exercises">
      <p className="eyebrow">{title ?? (timed ? "The session" : `${session.exercises.length} exercises`)}</p>
      {session.exercises.map((e, i) => (
        <ExerciseCard key={e.exerciseId} index={i + 1} name={e.name} detail={detail(e)} cue={e.cue} muscles={e.cue ? undefined : e.muscles} />
      ))}
    </section>
  );
}

function WeekCard({ plan, weekday }: { plan: WeekPlan; weekday: number }) {
  // Session logging arrives in milestone 5; until then the card shows where you are in the week.
  const total = plan.days.length;
  const passed = plan.days.filter((d) => d.weekday < weekday).length;
  const left = total - passed;
  return (
    <section className="card week" aria-label="This week">
      <ProgressRing value={passed / total} size={84} stroke={8} label="to go" ariaLabel={`${left} of ${total} planned sessions still to come this week`}>
        <span className="pu-ring-value">{left}</span>
      </ProgressRing>
      <div className="stack-3" style={{ flex: 1, minWidth: 0 }}>
        <p className="week-copy">
          <strong>{left === total ? "A fresh week" : left === 0 ? "That's the week" : `${left} session${left > 1 ? "s" : ""} to go`}</strong>
          {left === 0 ? "A new training week starts on Monday." : "Consistency over perfection. Every session counts."}
        </p>
        <ol className="week-strip">
          {WEEKDAY_SHORT.map((d, i) => {
            const planned = plan.days.some((p) => p.weekday === i);
            const state = !planned ? "rest" : i < weekday ? "done" : i === weekday ? "today" : "planned";
            return (
              <li key={d} className={`day day-${state}`} aria-label={`${d}: ${state === "rest" ? "rest" : state === "done" ? "earlier this week" : state}`}>
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
