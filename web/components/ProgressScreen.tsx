"use client";

import Link from "next/link";
import { useState } from "react";
import { bestsTimeline, consistency, fmtPace, goalProgress, liftTrends, milestones, running, showsMilestones, WEEKS } from "@/lib/engine/stats";
import { labelOf, GOALS } from "@/lib/profile";
import { useStored, type Stored } from "@/lib/store";
import { useToday } from "@/lib/use-today";
import { doneSets, durationMin, type WorkoutLog } from "@/lib/workout-log";
import { NeedsProfile } from "./NeedsProfile";
import { ChartTable, ColumnChart, LineChart } from "./ui/charts";
import { Icon } from "./ui/Icon";
import { Badge, ButtonLink, StatTile } from "./ui/primitives";

const short = (key: string) => new Date(`${key}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const kg = (v: number) => `${Math.round(v * 2) / 2}`;

export function ProgressScreen() {
  const stored = useStored();
  const today = useToday();
  if (stored === "loading" || !today) return <div className="screen" aria-busy="true"><div className="skeleton" style={{ height: 420 }} /></div>;
  if (!stored) return <NeedsProfile title="Progress" />;
  const logs = (stored.logs ?? []).filter((l) => l.finishedAt);
  if (!logs.length) return <FirstWorkout />;
  return <Dashboard stored={stored} logs={logs} today={today} />;
}

function FirstWorkout() {
  return (
    <div className="screen">
      <header className="top"><p className="eyebrow">Progress</p></header>
      <h1 className="h-display">Your story starts with one session.</h1>
      <p className="body-copy muted">Log a workout and this is where you&rsquo;ll see your strength trends, new bests, consistency and runs. Trends over weeks, not single days.</p>
      <ButtonLink href="/" variant="primary" size="lg" block icon="play">Go to today&rsquo;s session</ButtonLink>
    </div>
  );
}

function Dashboard({ stored, logs, today }: { stored: Stored; logs: WorkoutLog[]; today: Date }) {
  const goal = goalProgress(stored.profile, logs, stored.plan, today);
  const c = consistency(logs, stored.plan, today);
  const lifts = liftTrends(logs, today);
  const bests = bestsTimeline(logs);
  const r = running(logs, today);
  const ms = showsMilestones(stored.profile, logs) ? milestones(logs, stored.profile) : [];
  const thisWeek = c.weeks[c.weeks.length - 1];

  return (
    <div className="screen">
      <header className="top"><p className="eyebrow">Last {WEEKS} weeks</p></header>
      <h1 className="h-display">Progress</h1>

      {goal ? (
        <section className="card stack-2 goal-card" aria-labelledby="goal">
          <p id="goal" className="eyebrow">Your goal · {labelOf(GOALS, goal.goal)}</p>
          <p className="hero-figure">{goal.value}{goal.unit ? <span>{goal.unit}</span> : null}</p>
          <p className="muted">{goal.text}</p>
        </section>
      ) : null}

      <section className="stack-3" aria-labelledby="consistency">
        <h2 id="consistency" className="eyebrow">Consistency</h2>
        <div className="grid-2">
          <StatTile label="Streak" value={c.streak} unit={c.streak === 1 ? "week" : "weeks"} />
          <StatTile label="This week" value={thisWeek.done} unit={`of ${thisWeek.planned}`} />
        </div>
        <div className="card stack-2">
          <ColumnChart title={`Workouts per week for the last ${WEEKS} weeks, against your plan of ${thisWeek.planned}`} format={(v) => `${v}`}
            legend={<p className="chart-legend"><span className="key-bar" aria-hidden="true" />Workouts <span className="key-rule" aria-hidden="true" />Planned</p>}
            data={c.weeks.map((w, i) => ({ label: i === c.weeks.length - 1 ? "This week" : short(w.week), value: w.done, target: w.planned, tip: `Week of ${short(w.week)}: ${w.done} of ${w.planned}` }))} />
          <p className="muted">{c.of ? `You hit your plan in ${c.hit} of the last ${c.of} full week${c.of === 1 ? "" : "s"}. ` : ""}Consistency over perfection: a streak counts weeks with at least one workout.</p>
          <ChartTable caption="Workouts per week" head={["Week of", "Workouts"]} rows={c.weeks.map((w) => [short(w.week), `${w.done} of ${w.planned}`])} />
        </div>
      </section>

      {lifts.length ? (
        <section className="stack-3" aria-labelledby="strength">
          <h2 id="strength" className="eyebrow">Strength trends</h2>
          <p className="muted">Each week&rsquo;s best estimated one-rep max, worked out from your heaviest sets. One off day won&rsquo;t move the line much.</p>
          {lifts.map((l) => (
            <div key={l.exerciseId} className="card stack-2">
              <div className="trend-head">
                <strong>{l.name}</strong>
                <span className={`trend ${l.change > 0 ? "trend-progress" : ""}`}>
                  {l.change > 0 ? <Icon name="arrow-up" size={14} /> : l.change < 0 ? <Icon name="arrow-down" size={14} /> : null}
                  {l.change === 0 ? "Holding steady" : `${l.change > 0 ? "+" : "−"}${kg(Math.abs(l.change))} kg`}
                </span>
              </div>
              <LineChart title={`${l.name}: estimated max by week, now ${kg(l.latest)} kg`} format={(v) => `${kg(v)} kg`}
                data={l.points.map((p) => ({ label: short(p.week), value: p.value, tip: `Week of ${short(p.week)}` }))} />
              <ChartTable caption={`${l.name} estimated max`} head={["Week of", "Estimated max"]} rows={l.points.map((p) => [short(p.week), `${kg(p.value)} kg`])} />
            </div>
          ))}
        </section>
      ) : null}

      {bests.length ? (
        <section className="stack-2" aria-labelledby="bests">
          <h2 id="bests" className="eyebrow">Personal bests</h2>
          <ul className="log-list">
            {bests.map((b) => (
              <li key={`${b.logId}-${b.exerciseId}`}>
                <Link href={`/workout?log=${b.logId}`} className="best-row">
                  <Badge tone="pr">PR</Badge>
                  <span><strong>{b.name}</strong><span className="muted"> {b.text} · {short(b.date)}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {r.count ? <Running r={r} /> : null}

      {ms.length ? (
        <section className="stack-2" aria-labelledby="skills">
          <h2 id="skills" className="eyebrow">Bodyweight milestones · {ms.filter((m) => m.done).length} of {ms.length}</h2>
          <ul className="milestones">
            {ms.map((m) => (
              <li key={m.id} className={m.done ? "is-done" : undefined}>
                <span className="ms-mark" aria-hidden="true">{m.done ? <Icon name="check" size={14} /> : null}</span>
                <span>
                  {m.label}
                  <span className="muted">{m.done ? (m.date ? ` · ${short(m.date)}` : " · before you started") : " · still to come"}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <History logs={logs} />
    </div>
  );
}

function Running({ r }: { r: ReturnType<typeof running> }) {
  const hasKm = r.weeks.some((w) => w.km > 0);
  return (
    <section className="stack-3" aria-labelledby="running">
      <h2 id="running" className="eyebrow">Running</h2>
      <div className="grid-2">
        <StatTile label="Longest run" value={r.longest} unit="min" />
        {r.pace ? (
          <StatTile label="Average pace" value={fmtPace(r.pace)} unit="/km"
            delta={r.paceChange !== null && Math.abs(r.paceChange) >= 0.05 ? `${fmtPace(Math.abs(r.paceChange))} ${r.paceChange < 0 ? "faster" : "slower"}` : undefined}
            trend={r.paceChange !== null && r.paceChange < 0 ? "up" : "down"} />
        ) : (
          <StatTile label="Runs" value={r.count} unit={`in ${WEEKS} weeks`} />
        )}
      </div>
      <div className="card stack-2">
        <ColumnChart title={`${hasKm ? "Distance" : "Running time"} per week for the last ${WEEKS} weeks`} format={(v) => (hasKm ? `${v}` : `${Math.round(v)}`)}
          data={r.weeks.map((w, i) => ({ label: i === r.weeks.length - 1 ? "This week" : short(w.week), value: hasKm ? w.km : w.minutes, tip: `Week of ${short(w.week)}: ${hasKm ? `${w.km} km, ` : ""}${w.minutes} min, ${w.runs} run${w.runs === 1 ? "" : "s"}` }))} />
        <p className="muted">{hasKm ? "Kilometres per week." : "Minutes per week. Log distance with your runs to see kilometres and pace."}{r.paceChange !== null ? " Pace compares the last four weeks with the four before." : ""}</p>
        <ChartTable caption="Running per week" head={["Week of", hasKm ? "Distance" : "Time"]} rows={r.weeks.map((w) => [short(w.week), hasKm ? `${w.km} km` : `${w.minutes} min`])} />
      </div>
    </section>
  );
}

function History({ logs }: { logs: WorkoutLog[] }) {
  const [shown, setShown] = useState(10);
  const all = [...logs].reverse();
  return (
    <section className="stack-2" aria-labelledby="history">
      <h2 id="history" className="eyebrow">History</h2>
      <ul className="log-list">
        {all.slice(0, shown).map((l) => {
          const sets = l.exercises.reduce((n, e) => n + doneSets(e).length, 0);
          return (
            <li key={l.id}>
              <Link href={`/workout?log=${l.id}`} className="history-row">
                <span>
                  <strong>{l.name}</strong>
                  <span className="muted">
                    {new Date(`${l.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })} · {l.timed ? `${l.timed.minutes} min${l.timed.distanceKm ? `, ${l.timed.distanceKm} km` : ""}` : `${sets} sets, ${durationMin(l)} min`}
                  </span>
                </span>
                <Icon name="chevron-right" className="pw-go" />
              </Link>
            </li>
          );
        })}
      </ul>
      {all.length > shown ? <button type="button" className="text-link" onClick={() => setShown(shown + 10)}>Show more</button> : null}
    </section>
  );
}
