"use client";

import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { Button, ProgressRing } from "./primitives";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/** Weight and rep entry with big targets for sweaty thumbs. An empty value shows a dash until the first press. */
export function Stepper({ value, step, unit, label, min = 0, start, onChange }: {
  value?: number;
  step: number;
  unit: string;
  label: string;
  min?: number;
  /** Where + starts from when the value is empty. */
  start?: number;
  onChange: (value: number) => void;
}) {
  const set = (n: number) => onChange(Math.max(min, Math.round(n * 100) / 100));
  return (
    <div className="pu-stepper" role="group" aria-label={label}>
      <button type="button" aria-label={`${label}: decrease by ${step}`} disabled={value === undefined} onClick={() => value !== undefined && set(value - step)}>
        <Icon name="minus" />
      </button>
      <div className="pu-stepper-value" aria-live="polite">
        {value ?? "–"}
        <span className="pu-stepper-unit">{unit}</span>
      </div>
      <button type="button" aria-label={`${label}: increase by ${step}`} onClick={() => set(value === undefined ? (start ?? step) : value + step)}>
        <Icon name="plus" />
      </button>
    </div>
  );
}

export type SetRow = { prev?: string; weight?: ReactNode; reps: ReactNode; done: boolean };

/** The set logger: set number, last time, weight, reps and a done toggle. Tapping a row selects it for the steppers. */
export function SetTable({ rows, selected, weightLabel, repsLabel, onSelect, onToggle }: {
  rows: SetRow[];
  selected: number;
  /** Null hides the weight column, for bodyweight exercises. */
  weightLabel: string | null;
  repsLabel: string;
  onSelect: (i: number) => void;
  onToggle: (i: number) => void;
}) {
  return (
    <table className="pu-sets">
      <thead>
        <tr>
          <th scope="col">Set</th>
          <th scope="col">Last time</th>
          {weightLabel ? <th scope="col">{weightLabel}</th> : null}
          <th scope="col">{repsLabel}</th>
          <th scope="col"><span className="sr-only">Done</span></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={cx(r.done ? "is-done" : i === selected && "is-current", "set-row")} onClick={() => onSelect(i)} aria-current={i === selected ? "true" : undefined}>
            <td>{i + 1}</td>
            <td className="pu-prev">{r.prev ?? "–"}</td>
            {weightLabel ? <td>{r.weight ?? "–"}</td> : null}
            <td>{r.reps}</td>
            <td>
              <button type="button" className={cx("pu-check", r.done && "is-on")} aria-pressed={r.done} aria-label={`Set ${i + 1} done`}
                onClick={(e) => { e.stopPropagation(); onToggle(i); }}>
                <Icon name="check" />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** The between-sets countdown. Ticking is the caller's job; this shows the time left and the controls. */
export function RestTimer({ left, total, label, size = 160, onAdjust, onSkip }: { left: number; total: number; label: string; size?: number; onAdjust: (by: number) => void; onSkip: () => void }) {
  return (
    <div className="pu-timer">
      <ProgressRing size={size} stroke={10} value={total ? left / total : 0} ariaLabel={`${fmt(left)} rest remaining`} label={label}>
        <span className="pu-ring-value">{fmt(left)}</span>
      </ProgressRing>
      <div className="pu-timer-actions">
        <Button variant="secondary" size="sm" onClick={() => onAdjust(-15)}>−15s</Button>
        <Button variant="secondary" size="sm" onClick={() => onAdjust(15)}>+15s</Button>
        <Button variant="primary" size="sm" onClick={onSkip}>{left > 0 ? "Skip" : "Done"}</Button>
      </div>
    </div>
  );
}

export const clock = (sec: number) => (sec >= 3600 ? `${Math.floor(sec / 3600)}:${fmt(sec % 3600).padStart(5, "0")}` : fmt(sec));
