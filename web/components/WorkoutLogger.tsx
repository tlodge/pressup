"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { areaOf, EXERCISE_BY_ID } from "@/lib/exercises";
import { GUIDES } from "@/lib/exercise-guide";
import { discardWorkout, finishWorkout, updateWorkout } from "@/lib/store";
import { EFFORT_DETAIL, EFFORT_LABEL, SESSION_EFFORT, fmtSet, fmtTarget, type Effort, type ExerciseLog, type WorkoutLog } from "@/lib/workout-log";
import { ChipChoice, Field } from "./onboarding/fields";
import { Sheet } from "./Sheet";
import { Icon } from "./ui/Icon";
import { clock, RestTimer, SetTable, Stepper } from "./ui/logging";
import { Button } from "./ui/primitives";

/** Ticks once a second while mounted. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

/** A short buzz and beep when rest is over, instead of anything flashing. */
function restOver() {
  try {
    navigator.vibrate?.(200);
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    osc.onended = () => ctx.close();
  } catch {
    // Sound and vibration are extras; the timer still shows zero.
  }
}

const firstOpen = (log: WorkoutLog) => Math.max(0, log.exercises.findIndex((e) => e.sets.some((s) => !s.done)));

/** The in-workout screen: one exercise at a time, set by set, with a rest timer between sets. Calm register: no display type. */
export function WorkoutLogger({ log }: { log: WorkoutLog }) {
  const router = useRouter();
  const now = useNow();
  const [index, setIndex] = useState(() => firstOpen(log));
  const [selected, setSelected] = useState<number | null>(null);
  const [rest, setRest] = useState<{ endAt: number; total: number; next: string } | null>(null);
  const [finishing, setFinishing] = useState(false);
  const alerted = useRef<number | null>(null);

  const restLeft = rest ? Math.max(0, Math.ceil((rest.endAt - now) / 1000)) : 0;
  useEffect(() => {
    if (rest && restLeft === 0 && alerted.current !== rest.endAt) {
      alerted.current = rest.endAt;
      restOver();
    }
  }, [rest, restLeft]);

  if (log.timed) return <TimedLogger log={log} onDone={(id) => router.replace(`/workout?log=${id}`)} />;

  const ex = log.exercises[index];
  const current = ex.sets.findIndex((s) => !s.done);
  const sel = selected ?? (current < 0 ? ex.sets.length - 1 : current);
  const set = ex.sets[sel];
  const allDone = current < 0;
  const totalSets = log.exercises.reduce((n, e) => n + e.sets.length, 0);
  const doneCount = log.exercises.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0);
  const elapsed = Math.max(0, Math.floor((now - Date.parse(log.startedAt)) / 1000));
  const meta = EXERCISE_BY_ID[ex.exerciseId];
  const cue = GUIDES[ex.exerciseId]?.cues[0];
  const last = index === log.exercises.length - 1;

  const save = (next: ExerciseLog) => updateWorkout({ ...log, exercises: log.exercises.map((e, i) => (i === index ? next : e)) });

  const change = (field: "weight" | "reps", value: number) => {
    // A new weight carries down to the sets still to come that had the same weight.
    const old = set[field];
    save({ ...ex, sets: ex.sets.map((s, i) => (i === sel || (field === "weight" && i > sel && !s.done && s.weight === old) ? { ...s, [field]: value } : s)) });
  };

  const toggle = (i: number) => {
    const done = !ex.sets[i].done;
    save({ ...ex, sets: ex.sets.map((s, j) => (j === i ? { ...s, done } : s)) });
    setSelected(null);
    if (done) {
      const more = ex.sets.some((s, j) => j !== i && !s.done);
      const next = more ? `Set ${ex.sets.findIndex((s, j) => j !== i && !s.done) + 1}` : last ? "Finish up" : `Next: ${log.exercises[index + 1].name}`;
      setRest({ endAt: Date.now() + ex.restSec * 1000, total: ex.restSec, next });
    } else {
      setRest(null);
    }
  };

  const go = (i: number) => {
    setIndex(i);
    setSelected(null);
  };

  const unit = ex.unit === "sec" ? "sec" : "reps";
  return (
    <div className="logger">
      <header className="log-bar">
        <Button variant="ghost" size="sm" onClick={() => setFinishing(true)}>End</Button>
        <span className="log-clock" aria-label={`${Math.floor(elapsed / 60)} minutes in`}>{clock(elapsed)}</span>
        <span className="eyebrow">{index + 1} of {log.exercises.length}</span>
      </header>
      <div className="log-prog" role="progressbar" aria-label="Sets done" aria-valuemin={0} aria-valuemax={totalSets} aria-valuenow={doneCount}>
        <i style={{ width: `${(doneCount / totalSets) * 100}%` }} />
      </div>

      <section className="stack-2">
        <p className="eyebrow eyebrow-accent">Exercise {index + 1}{meta ? ` · ${areaOf(meta)}` : ""}{log.adaptedLabel ? ` · ${log.adaptedLabel}` : ""}</p>
        <h1 className="log-name">{ex.name}</h1>
        <p className="log-target"><strong>Target {fmtTarget(ex)}</strong>{ex.planned.includes("each") ? " each side" : ""}</p>
        <p className="muted">{ex.target.reason}</p>
        {cue ? <p className="muted">{cue}</p> : null}
      </section>

      <SetTable
        rows={ex.sets.map((s, i) => ({ prev: prevFor(ex, i), weight: s.weight, reps: s.reps, done: s.done }))}
        selected={sel} weightLabel={ex.weighted ? "kg" : null} repsLabel={ex.unit === "sec" ? "Sec" : "Reps"}
        onSelect={setSelected} onToggle={toggle} />

      {!allDone || selected !== null ? (
        <>
          <div className="log-entry">
            {ex.weighted ? <Stepper label={`Set ${sel + 1} weight`} value={set.weight} step={ex.step} unit="kg" start={ex.step === 2.5 ? 20 : 10} onChange={(v) => change("weight", v)} /> : null}
            <Stepper label={`Set ${sel + 1} ${unit}`} value={set.reps} step={ex.unit === "sec" ? 5 : 1} unit={unit} min={0} onChange={(v) => change("reps", v)} />
          </div>
          {set.done ? (
            <Button variant="secondary" size="lg" block onClick={() => setSelected(null)}>Done editing</Button>
          ) : (
            <Button variant="primary" size="lg" block icon="check" onClick={() => toggle(sel)}>
              Log set {sel + 1}
            </Button>
          )}
        </>
      ) : (
        <section className="stack-3" aria-label="How hard was that?">
          <Field label="How hard was the last set?">
            <div className="effort-row" role="group" aria-label="Effort">
              {(Object.keys(EFFORT_LABEL) as Effort[]).map((k) => (
                <button key={k} type="button" className="effort" aria-pressed={ex.effort === k} onClick={() => save({ ...ex, effort: k })}>
                  <strong>{EFFORT_LABEL[k]}</strong>
                  <span>{EFFORT_DETAIL[k]}</span>
                </button>
              ))}
            </div>
          </Field>
          {last ? (
            <Button variant="primary" size="lg" block onClick={() => setFinishing(true)}>Finish workout</Button>
          ) : (
            <Button variant="primary" size="lg" block icon="chevron-right" onClick={() => go(index + 1)}>Next exercise</Button>
          )}
        </section>
      )}

      <nav className="log-nav" aria-label="Exercises">
        <Button variant="ghost" size="sm" icon="chevron-left" disabled={index === 0} onClick={() => go(index - 1)}>Previous</Button>
        <Button variant="ghost" size="sm" disabled={last} onClick={() => go(index + 1)}>Skip to next</Button>
      </nav>

      {rest ? (
        <div className="rest-panel" role="region" aria-label="Rest timer">
          <RestTimer left={restLeft} total={rest.total} label={restLeft > 0 ? "Rest" : "Go"} size={140}
            onAdjust={(by) => setRest({ ...rest, endAt: Math.max(Date.now(), rest.endAt + by * 1000), total: Math.max(rest.total, rest.total + by) })}
            onSkip={() => setRest(null)} />
          <p className="muted center">{rest.next}</p>
        </div>
      ) : null}

      <FinishSheet open={finishing} log={log} onClose={() => setFinishing(false)} onDone={(id) => router.replace(`/workout?log=${id}`)} onDiscard={() => router.replace("/")} />
    </div>
  );
}

/** Last time's set, lined up with this one. */
function prevFor(ex: ExerciseLog, i: number) {
  const p = ex.previous?.[i];
  return p?.done ? fmtSet(p, ex.unit) : undefined;
}

function FinishSheet({ open, log, onClose, onDone, onDiscard }: { open: boolean; log: WorkoutLog; onClose: () => void; onDone: (id: string) => void; onDiscard: () => void }) {
  const [effort, setEffort] = useState<number | undefined>(log.effort);
  const [notes, setNotes] = useState(log.notes ?? "");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const left = log.exercises.reduce((n, e) => n + e.sets.filter((s) => !s.done).length, 0);
  const finish = () => {
    const done = finishWorkout({ effort, notes: notes.trim() || undefined });
    if (done) onDone(done.id);
  };
  return (
    <Sheet open={open} onClose={() => { setConfirmDiscard(false); onClose(); }} title={confirmDiscard ? "Discard workout?" : "Finish workout"} id="finish-title">
      {confirmDiscard ? (
        <>
          <p className="body-copy">Nothing from this workout will be saved, and your targets stay where they are.</p>
          <div className="stack-2">
            <Button variant="primary" size="lg" block onClick={() => { discardWorkout(); onDiscard(); }}>Discard workout</Button>
            <Button variant="ghost" block onClick={() => setConfirmDiscard(false)}>Keep it</Button>
          </div>
        </>
      ) : (
        <>
          {left ? <p className="muted">{left} set{left > 1 ? "s" : ""} not logged. They count as missed, so those targets hold next time rather than going up.</p> : null}
          <Field label="How hard was the session overall?">
            <ChipChoice label="Session effort" options={SESSION_EFFORT.map((o) => ({ value: o.value, label: o.label }))} selected={effort ? [effort] : []} onToggle={(v) => setEffort(v)} />
          </Field>
          <label className="field">
            <span className="field-label">Notes</span>
            <textarea className="text-area" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Anything to remember for next time?" />
          </label>
          <div className="stack-2">
            <Button variant="primary" size="lg" block icon="check" onClick={finish}>Save workout</Button>
            <Button variant="ghost" block onClick={onClose}>Keep going</Button>
            <button type="button" className="text-link center-self" onClick={() => setConfirmDiscard(true)}>Discard this workout</button>
          </div>
        </>
      )}
    </Sheet>
  );
}

/** Runs and conditioning: how long, how hard, and any notes. */
function TimedLogger({ log, onDone }: { log: WorkoutLog; onDone: (id: string) => void }) {
  const router = useRouter();
  const timed = log.timed!;
  const [effort, setEffort] = useState<number | undefined>(log.effort);
  const [notes, setNotes] = useState(log.notes ?? "");
  const setMinutes = (minutes: number) => updateWorkout({ ...log, timed: { ...timed, minutes } });
  return (
    <div className="logger">
      <header className="log-bar">
        <Button variant="ghost" size="sm" onClick={() => { discardWorkout(); router.replace("/"); }}>Cancel</Button>
        <span className="eyebrow">{log.adaptedLabel ?? "Workout"}</span>
      </header>
      <section className="stack-2">
        <p className="eyebrow eyebrow-accent">{log.name}</p>
        <h1 className="log-name">{timed.name}</h1>
        <p className="log-target"><strong>{timed.detail}</strong></p>
      </section>
      <Field label="How long did you go?" hint="Add the distance if you know it, and Progress shows your pace.">
        <div className="log-entry">
          <Stepper label="Minutes" value={timed.minutes} step={1} unit="min" min={1} onChange={setMinutes} />
          <Stepper label="Distance" value={timed.distanceKm} step={0.5} start={5} unit="km" min={0} onChange={(distanceKm) => updateWorkout({ ...log, timed: { ...timed, distanceKm: distanceKm || undefined } })} />
        </div>
      </Field>
      <Field label="How hard was it?">
        <ChipChoice label="Session effort" options={SESSION_EFFORT.map((o) => ({ value: o.value, label: o.label }))} selected={effort ? [effort] : []} onToggle={(v) => setEffort(v)} />
      </Field>
      <label className="field">
        <span className="field-label">Notes</span>
        <textarea className="text-area" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Route, pace, how your legs felt…" />
      </label>
      <Button variant="primary" size="lg" block icon="check" onClick={() => {
        const done = finishWorkout({ effort, notes: notes.trim() || undefined });
        if (done) onDone(done.id);
      }}>Save</Button>
      <p className="note"><Icon name="timer" size={18} />Running pace and distance tracking arrive with the running plans in milestone 10.</p>
    </div>
  );
}
