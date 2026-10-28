"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdaptSheet, Advice, WhyList } from "./AdaptSheet";
import { Icon } from "./ui/Icon";
import { Badge, Button, ButtonLink, ExerciseCard, ProgressRing, StatTile } from "./ui/primitives";
import { adaptationFor, clearAdaptation, doneWeekdays, loggedFor, startWorkout, useStored, weekView, type Stored } from "@/lib/store";
import { WEEKDAY_LONG, WEEKDAY_SHORT, detail, estimateMinutes, weekdayOf, type Session, type Weekday } from "@/lib/training";
import { dateKey, useToday } from "@/lib/use-today";
import { doneSets, durationMin, SESSION_EFFORT, type WorkoutLog } from "@/lib/workout-log";

export function TodayScreen() {
  const today = useToday();
  const stored = useStored();
  const [adapting, setAdapting] = useState(false);
  const router = useRouter();

  if (!today || stored === "loading") return <TodaySkeleton />;
  if (!stored) return <Welcome />;

  // This week's layout, with any moves or skips; skipped sessions count as rest.
  const view = weekView(stored, today);
  const plan = { days: view.days.filter((d) => !view.skipped.includes(d.sessionId)), sessions: view.sessions };
  const wd = weekdayOf(today);
  const date = dateKey(today);
  const todays = plan.days.find((d) => d.weekday === wd);
  const next = plan.days.find((d) => d.weekday > wd) ?? stored.plan.days[0];
  const nextSession = plan.sessions[next.sessionId];
  // On a rest day, ADAPT MY WORKOUT builds a light quick workout from the session easiest on the legs, preferring
  // one that isn't coming up soon, so the extra work doesn't eat into the next planned session's recovery.
  const daysUntil = (d: number) => (d - wd + 7) % 7;
  const restPick = [...plan.days].sort((a, b) => {
    const [x, y] = [plan.sessions[a.sessionId], plan.sessions[b.sessionId]];
    return x.legLoad - y.legLoad || Number(x.hard) - Number(y.hard) || daysUntil(b.weekday) - daysUntil(a.weekday);
  })[0];
  const sessionId = todays?.sessionId ?? restPick.sessionId;
  const adapted = adaptationFor(stored, date, sessionId);
  const planned = todays ? plan.sessions[todays.sessionId] : null;
  const session = adapted?.result.kind === "session" ? adapted.result.session : planned;
  const dateLine = today.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const logged = loggedFor(stored, date, sessionId);
  const active = stored.active;
  const start = () => {
    startWorkout(sessionId, date);
    router.push(`/workout?s=${sessionId}`);
  };

  return (
    <div className="screen">
      <header className="top">
        <Image src="/brand/pressup-wordmark-on-dark.png" alt="PressUp" width={107} height={22} priority />
        <Badge>{stored.plan.days.length} days a week</Badge>
      </header>

      {active && active.sessionId !== sessionId ? (
        <Link href={`/workout?s=${active.sessionId}`} className="checkin-cta">
          <span>
            <strong>{active.name} is in progress</strong>
            <span className="muted">Started {new Date(active.startedAt).toLocaleDateString("en-GB", { weekday: "long" })}. Pick up where you left off.</span>
          </span>
          <Icon name="chevron-right" />
        </Link>
      ) : null}

      {adapted?.result.kind === "rest" ? (
        <>
          <section className="stack-2">
            <p className="eyebrow">{dateLine} · Rest day taken</p>
            <h1 className="h-display">Recover.</h1>
            <p className="muted">Next up is {nextSession.name} on {WEEKDAY_LONG[next.weekday]}.</p>
          </section>
          <section className="card stack-3">
            <WhyList items={adapted.result.reasons} />
            <Advice items={adapted.result.advice} />
          </section>
          {/* A rest the user chose can be undone. A rest PressUp called for (pain) can only be revisited through a new check-in. */}
          {adapted.request.rest ? (
            <Button variant="ghost" block onClick={clearAdaptation}>Back to today&rsquo;s session</Button>
          ) : (
            <Button variant="ghost" block icon="adapt" onClick={() => setAdapting(true)}>Check in again</Button>
          )}
        </>
      ) : session && logged ? (
        <>
          <section className="stack-2">
            <p className="eyebrow">{dateLine} · Done</p>
            <h1 className="h-display">{session.name}</h1>
            <p className="muted">Logged. Every session counts.</p>
          </section>
          <DoneCard log={logged} />
          <p className="muted">Next up is {nextSession.name} on {WEEKDAY_LONG[next.weekday]}.</p>
        </>
      ) : session ? (
        <>
          <section className="stack-2">
            <p className="eyebrow">{dateLine} · {adapted ? adapted.label : "Today\u2019s session"}</p>
            <h1 className="h-display">{session.name}</h1>
            <p className="muted">{session.purpose}</p>
          </section>

          <SessionStats session={session} />

          <div className="stack-3">
            {active?.sessionId === sessionId ? (
              <ButtonLink href={`/workout?s=${sessionId}`} variant="primary" size="lg" block icon="play">Resume workout</ButtonLink>
            ) : (
              <Button variant="primary" size="lg" block icon="play" onClick={start}>Start workout</Button>
            )}
            <Button variant="secondary" size="lg" block icon="adapt" onClick={() => setAdapting(true)}>
              {adapted ? "Adapt again" : "Adapt my workout"}
            </Button>
          </div>

          {adapted?.result.kind === "session" ? <AdaptedCard changes={adapted.result.changes} advice={adapted.result.advice} restDay={!todays} /> : null}

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

      <WeekCard stored={stored} today={today} />
      <AdaptSheet open={adapting} onClose={() => setAdapting(false)} stored={stored} sessionId={sessionId} date={date} restDay={!todays} />
    </div>
  );
}

/** A finished session: the headline numbers, and a link to the whole workout. */
function DoneCard({ log }: { log: WorkoutLog }) {
  const sets = log.exercises.reduce((n, e) => n + doneSets(e).length, 0);
  const effort = SESSION_EFFORT.find((o) => o.value === log.effort)?.label;
  const parts = [log.timed ? `${log.timed.minutes} min${log.timed.distanceKm ? `, ${log.timed.distanceKm} km` : ""}` : `${sets} sets in ${durationMin(log)} min`, effort ? `felt ${effort.toLowerCase()}` : ""].filter(Boolean);
  return (
    <section className="card stack-3">
      <p className="week-copy"><strong><Badge tone="done">Done</Badge></strong>{parts.join(" · ")}</p>
      <ButtonLink href={`/workout?log=${log.id}`} variant="secondary" block>See the workout</ButtonLink>
    </section>
  );
}

/** What changed from the plan and why, with a way back to the planned session. */
function AdaptedCard({ changes, advice, restDay }: { changes: string[]; advice: string[]; restDay: boolean }) {
  return (
    <section className="card stack-3">
      {changes.length ? <WhyList items={changes} title="Why it changed" /> : <p className="body-copy">No changes needed: today&rsquo;s session already fits.</p>}
      <Advice items={advice} />
      <button type="button" className="text-link" onClick={clearAdaptation}>{restDay ? "Back to resting today" : "Back to the planned session"}</button>
    </section>
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

function WeekCard({ stored, today }: { stored: Stored; today: Date }) {
  const view = weekView(stored, today);
  const weekday = weekdayOf(today);
  const doneDays = doneWeekdays(stored, today);
  const days = view.days.filter((d) => !view.skipped.includes(d.sessionId));
  const total = Math.max(1, days.length, doneDays.length);
  const done = Math.min(total, doneDays.length);
  const left = total - done;
  return (
    <section className="card week" aria-label="This week">
      <ProgressRing value={done / total} size={84} stroke={8} label="done" ariaLabel={`${done} of ${total} sessions done this week`}>
        <span className="pu-ring-value">{done}/{total}</span>
      </ProgressRing>
      <div className="stack-3" style={{ flex: 1, minWidth: 0 }}>
        <p className="week-copy">
          <strong>{done === 0 ? "A fresh week" : left === 0 ? "That's the week done" : `${left} session${left > 1 ? "s" : ""} to go`}</strong>
          {left === 0 ? "Nice work. A new training week starts on Monday." : "Consistency over perfection. Every session counts."}
        </p>
        <ol className="week-strip">
          {WEEKDAY_SHORT.map((d, i) => {
            const planned = days.some((p) => p.weekday === i);
            const state = doneDays.includes(i as Weekday) ? "done" : i === weekday ? "today" : !planned ? "rest" : i < weekday ? "open" : "planned";
            const label = { done: "done", today: "today", rest: "rest", open: "not logged", planned: "planned" }[state];
            return (
              <li key={d} className={`day day-${state}`} aria-label={`${d}: ${label}`}>
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
