"use client";

import { nextTarget, personalBests } from "@/lib/engine/progress";
import { fmtPace } from "@/lib/engine/stats";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import type { Stored } from "@/lib/store";
import { doneSets, durationMin, fmtKg, fmtSet, SESSION_EFFORT, volumeKg, type WorkoutLog } from "@/lib/workout-log";
import { Icon } from "./ui/Icon";
import { Badge, ButtonLink, StatTile } from "./ui/primitives";

/** A finished workout: what was done, any new bests, and what the rules set for next time. */
export function WorkoutSummary({ stored, log }: { stored: Stored; log: WorkoutLog }) {
  const history = stored.logs ?? [];
  const bests = personalBests(log, history);
  const sets = log.exercises.reduce((n, e) => n + doneSets(e).length, 0);
  const planned = log.exercises.reduce((n, e) => n + e.sets.length, 0);
  const volume = volumeKg(log);
  const effort = SESSION_EFFORT.find((o) => o.value === log.effort)?.label;
  const date = new Date(`${log.date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  // Targets are worked out from everything logged up to and including this workout.
  const upTo = history.filter((l) => l.startedAt <= log.startedAt);
  const next = log.exercises.filter((e) => doneSets(e).length).map((e) => {
    const p = { exerciseId: e.exerciseId, name: e.name, muscles: e.muscles, role: e.role, sets: e.sets.length, reps: e.planned, restSec: e.restSec };
    const t = nextTarget(p, upTo, stored.profile.equipment).target;
    const amount = e.unit === "sec" ? `${t.reps} s` : `${t.reps} reps`;
    return { e, t, text: t.weight ? `${fmtKg(t.weight)} × ${amount}` : amount };
  });

  return (
    <div className="screen">
      <header className="top">
        <ButtonLink href="/" variant="ghost" size="sm" icon="chevron-left">Today</ButtonLink>
        <Badge tone="done">Done</Badge>
      </header>
      <section className="stack-2">
        <p className="eyebrow">{date}{log.adaptedLabel ? ` · ${log.adaptedLabel}` : ""}</p>
        <h1 className="h-display">{log.name}</h1>
        <p className="muted">{bests.length ? "New bests today. That's what consistency buys." : "Logged. Every session counts."}</p>
      </section>

      {log.timed ? (
        <div className="grid-2">
          <StatTile label="Time" value={log.timed.minutes} unit="min" />
          {log.timed.distanceKm ? <StatTile label="Distance" value={log.timed.distanceKm} unit="km" /> : null}
          {log.timed.distanceKm ? <StatTile label="Pace" value={fmtPace(log.timed.minutes / log.timed.distanceKm)} unit="/km" /> : null}
          <StatTile label="Effort" value={effort ?? "–"} />
        </div>
      ) : (
        <div className="grid-2">
          <StatTile label="Time" value={durationMin(log)} unit="min" />
          <StatTile label="Sets" value={sets} unit={`of ${planned}`} />
          {volume ? <StatTile label="Volume" value={Math.round(volume).toLocaleString("en-GB")} unit="kg" /> : null}
          <StatTile label="Effort" value={effort ?? "–"} />
        </div>
      )}

      {bests.length ? (
        <section className="stack-2" aria-labelledby="bests">
          <h2 id="bests" className="eyebrow">New bests</h2>
          <ul className="why-list">
            {bests.map((b) => (
              <li key={b.exerciseId}><Badge tone="pr">PR</Badge><span><strong>{b.name}</strong>: {b.text}</span></li>
            ))}
          </ul>
        </section>
      ) : null}

      {log.exercises.length ? (
        <section className="stack-2" aria-labelledby="done">
          <h2 id="done" className="eyebrow">What you did</h2>
          <ul className="log-list">
            {log.exercises.map((e) => {
              const done = doneSets(e);
              return (
                <li key={e.exerciseId}>
                  <strong>{e.name}</strong>
                  <span className="muted">{done.length ? done.map((s) => fmtSet(s, e.unit)).join(", ") : "Skipped"}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {next.length ? (
        <section className="stack-2" aria-labelledby="next">
          <h2 id="next" className="eyebrow">Next time</h2>
          <ul className="log-list">
            {next.map(({ e, t, text }) => (
              <li key={e.exerciseId}>
                <span className="log-next">
                  <strong>{EXERCISE_BY_ID[e.exerciseId]?.name ?? e.name}</strong>
                  <span className={`trend trend-${t.kind}`}>
                    {t.kind === "progress" ? <Icon name="arrow-up" size={14} /> : t.kind === "reduce" ? <Icon name="arrow-down" size={14} /> : null}
                    {text}
                  </span>
                </span>
                <span className="muted">{t.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {log.notes ? (
        <section className="card stack-2">
          <p className="eyebrow">Notes</p>
          <p className="body-copy">{log.notes}</p>
        </section>
      ) : null}

      <ButtonLink href="/" variant="primary" size="lg" block>Back to Today</ButtonLink>
    </div>
  );
}
