"use client";

import Link from "next/link";
import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { missedSessions, moveOptions } from "@/lib/engine/schedule";
import { doneWeekdays, resetWeek, useStored, weekView, type Stored, type WeekView } from "@/lib/store";
import { WEEKDAY_LONG, estimateMinutes, weekdayOf, type Weekday } from "@/lib/training";
import { useToday } from "@/lib/use-today";
import { NeedsProfile } from "./NeedsProfile";
import { PlanNotes } from "./PlanWeek";
import { MissedSheet, MoveSheet, WeekSheet } from "./ScheduleSheets";
import { Icon } from "./ui/Icon";
import { Badge, Button } from "./ui/primitives";

const FOCUS_LABEL: Record<string, string> = {
  lower: "Legs", upper: "Upper body", full: "Full body", push: "Push", pull: "Pull", calisthenics: "Bodyweight", run: "Run", conditioning: "Conditioning",
};

export function PlanScreen() {
  const stored = useStored();
  const today = useToday();
  if (stored === "loading" || !today) return <div className="screen" aria-busy="true"><div className="skeleton" style={{ height: 420 }} /></div>;
  if (!stored) return <NeedsProfile title="Plan" />;
  return <Plan stored={stored} today={today} />;
}

function Plan({ stored, today }: { stored: Stored; today: Date }) {
  const view = weekView(stored, today);
  const wd = weekdayOf(today);
  const done = doneWeekdays(stored, today);
  const missed = missedSessions(view, wd, done);
  const [moving, setMoving] = useState<{ id: string; to?: Weekday } | null>(null);
  const [missedId, setMissedId] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const range = `${fmtDay(view.dates[0])} – ${fmtDay(view.dates[6])}`;

  return (
    <div className="screen">
      <header className="top">
        <p className="eyebrow">This week · {range}</p>
      </header>
      <h1 className="h-display">Plan</h1>

      {missed.map((m) => (
        <section key={m.sessionId} className="card stack-3">
          <p className="week-copy">
            <strong>{view.sessions[m.sessionId].name} wasn&rsquo;t logged</strong>
            It was planned for {WEEKDAY_LONG[m.weekday]}. Move it, fold its key lifts into another session, or let it go.
          </p>
          <Button variant="secondary" block onClick={() => setMissedId(m.sessionId)}>Sort it out</Button>
        </section>
      ))}

      <WeekBoard stored={stored} view={view} weekday={wd} done={done} missed={missed.map((m) => m.sessionId)} onMove={(id, to) => setMoving({ id, to })} onMissed={setMissedId} />

      <section className="card stack-3">
        <p className="week-copy">
          <strong>Busy week?</strong>
          Mark the days you&rsquo;re busy or short of time and PressUp suggests where your sessions fit. You see every change before it happens.
        </p>
        <Button variant="secondary" block icon="calendar" onClick={() => setPlanning(true)}>Plan around my week</Button>
      </section>

      {view.edited ? (
        <section className="stack-2" aria-labelledby="changes">
          <p id="changes" className="eyebrow">Changed this week</p>
          <ul className="soon-list card">
            {view.changes.map((c, i) => <li key={i}><Icon name="adapt" />{c}</li>)}
          </ul>
          {confirmReset ? (
            <div className="action-row">
              <Button variant="primary" size="sm" onClick={() => { resetWeek(); setConfirmReset(false); }}>Yes, undo this week&rsquo;s changes</Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>Cancel</Button>
            </div>
          ) : (
            <button type="button" className="text-link" onClick={() => setConfirmReset(true)}>Put this week back to the plan</button>
          )}
          <p className="muted">Next week starts from your plan again.</p>
        </section>
      ) : null}

      <PlanNotes notes={stored.plan.notes} />

      <MoveSheet key={moving ? `move-${moving.id}-${moving.to}` : "move"} view={view} sessionId={moving?.id ?? null} today={today} doneDays={done} initial={moving?.to} onClose={() => setMoving(null)} />
      <MissedSheet key={`missed-${missedId}`} view={view} sessionId={missedId} today={today} doneDays={done} minutes={stored.profile.minutes} onClose={() => setMissedId(null)} />
      <WeekSheet key={planning ? "week-open" : "week"} view={view} open={planning} today={today} doneDays={done} onClose={() => setPlanning(false)} />
    </div>
  );
}

const fmtDay = (key: string) => new Date(`${key}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

/** The week day by day. Sessions still to come can be dragged by their handle to another day, or moved with a tap on it. */
function WeekBoard({ stored, view, weekday, done, missed, onMove, onMissed }: {
  stored: Stored; view: WeekView; weekday: Weekday; done: Weekday[]; missed: string[];
  onMove: (id: string, to?: Weekday) => void; onMissed: (id: string) => void;
}) {
  const [drag, setDrag] = useState<{ id: string; from: Weekday; over: Weekday | null; ok: Weekday[]; moved: boolean } | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const dayAt = (x: number, y: number) => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-weekday]");
    return el ? (Number(el.dataset.weekday) as Weekday) : null;
  };
  const down = (e: ReactPointerEvent, id: string, from: Weekday) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
    setDrag({ id, from, over: null, ok: moveOptions(view, id, weekday, done).filter((o) => o.ok).map((o) => o.weekday), moved: false });
  };
  const move = (e: ReactPointerEvent) => {
    if (!drag || !start.current) return;
    const moved = drag.moved || Math.abs(e.clientY - start.current.y) > 8;
    setDrag({ ...drag, moved, over: moved ? dayAt(e.clientX, e.clientY) : null });
  };
  const up = () => {
    if (!drag) return;
    // A tap opens the day list; a drag onto another day jumps to that day's confirm step (or its reason if it doesn't fit).
    onMove(drag.id, drag.moved && drag.over !== null && drag.over !== drag.from ? drag.over : undefined);
    setDrag(null);
    start.current = null;
  };

  const logFor = (i: number) => [...(stored.logs ?? [])].reverse().find((l) => l.date === view.dates[i] && l.finishedAt);

  return (
    <ol className={`plan-week${drag?.moved ? " is-dragging" : ""}`} aria-label="This week">
      {WEEKDAY_LONG.map((name, i) => {
        const d = i as Weekday;
        const entry = view.days.find((x) => x.weekday === d);
        const s = entry ? view.sessions[entry.sessionId] : null;
        const log = done.includes(d) ? logFor(i) : undefined;
        const skipped = !!entry && view.skipped.includes(entry.sessionId);
        const isMissed = !!entry && missed.includes(entry.sessionId);
        const movable = !!entry && !skipped && !log && d >= weekday;
        const busy = view.busy[d];
        const target = drag?.moved ? (drag.ok.includes(d) ? " pw-drop-ok" : d !== drag.from ? " pw-drop-no" : "") : "";
        const over = drag?.moved && drag.over === d ? " pw-over" : "";

        let card;
        if (log) {
          card = (
            <Link className="pw-card" href={`/workout?log=${log.id}`}>
              <span className="pw-main"><strong>{log.name}</strong><span className="muted">Done</span></span>
              <Badge tone="done">Done</Badge>
            </Link>
          );
        } else if (s && skipped) {
          card = <span className="pw-card pw-skipped"><span className="pw-main"><strong>{s.name}</strong><span className="muted">Skipped this week</span></span></span>;
        } else if (s && isMissed) {
          card = (
            <button type="button" className="pw-card pw-missed" onClick={() => onMissed(entry!.sessionId)}>
              <span className="pw-main"><strong>{s.name}</strong><span className="muted">Not logged · sort it out</span></span>
              <Icon name="chevron-right" className="pw-go" />
            </button>
          );
        } else if (s && entry) {
          card = (
            <span className="pw-card pw-session">
              <Link className="pw-main" href={`/workout?s=${entry.sessionId}`}>
                <strong>{s.name}</strong>
                <span className="muted">{FOCUS_LABEL[s.focus]} · {estimateMinutes(s)} min{s.hard ? " · hard" : ""}{busy === "short" ? " · short day" : ""}</span>
              </Link>
              {movable ? (
                <button type="button" className="pw-handle" aria-label={`Move ${s.name}`}
                  onPointerDown={(e) => down(e, entry.sessionId, d)} onPointerMove={move} onPointerUp={up} onPointerCancel={() => setDrag(null)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onMove(entry.sessionId))}>
                  <span aria-hidden="true" className="grip" />
                </button>
              ) : null}
            </span>
          );
        } else {
          card = <span className="pw-card"><span className="pw-main"><span className="muted">{busy === "busy" ? "Rest · busy" : busy === "short" ? "Rest · short day" : "Rest"}</span></span></span>;
        }

        return (
          <li key={name} data-weekday={d} className={`pw-day${s && !skipped ? "" : " pw-rest"}${weekday === d ? " pw-today" : ""}${d < weekday ? " pw-past" : ""}${target}${over}`}>
            <span className="pw-name">{name.slice(0, 3)}{weekday === d ? <em>Today</em> : null}</span>
            {card}
          </li>
        );
      })}
    </ol>
  );
}
