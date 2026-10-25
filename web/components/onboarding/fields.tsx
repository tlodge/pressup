"use client";

import type { ReactNode } from "react";
import { WEEKDAY_SHORT, type Weekday } from "@/lib/training";
import { Icon } from "../ui/Icon";

type Option<T> = { value: T; label: string; detail?: string };

/** Large tappable cards for choosing one or several answers. */
export function OptionCards<T extends string>({ options, selected, onToggle, badge, label }: {
  options: Option<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  badge?: (value: T) => string | undefined;
  label: string;
}) {
  return (
    <div className="opt-grid" role="group" aria-label={label}>
      {options.map((o) => {
        const on = selected.includes(o.value);
        const b = badge?.(o.value);
        return (
          <button key={o.value} type="button" className="opt" aria-pressed={on} onClick={() => onToggle(o.value)}>
            <span className="opt-text">
              <strong>{o.label}</strong>
              {o.detail ? <span>{o.detail}</span> : null}
            </span>
            {b ? <span className="opt-badge">{b}</span> : <span className="opt-check" aria-hidden="true">{on ? <Icon name="check" size={16} /> : null}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Compact pills for short answers. */
export function ChipChoice<T extends string | number>({ options, selected, onToggle, label }: {
  options: Option<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  label: string;
}) {
  return (
    <div className="chip-row" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" className="pu-chip" aria-pressed={selected.includes(o.value)} onClick={() => onToggle(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function DayPicker({ days, onChange }: { days: Weekday[]; onChange: (days: Weekday[]) => void }) {
  return (
    <div className="day-picker" role="group" aria-label="Training days">
      {WEEKDAY_SHORT.map((d, i) => {
        const on = days.includes(i as Weekday);
        return (
          <button key={d} type="button" className="day-btn" aria-pressed={on} aria-label={d}
            onClick={() => onChange(on ? days.filter((x) => x !== i) : ([...days, i].sort() as Weekday[]))}>
            {d.slice(0, 2)}
          </button>
        );
      })}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="field">
      <p className="field-label">{label}</p>
      {hint ? <p className="muted">{hint}</p> : null}
      {children}
    </div>
  );
}

export function NumberInput({ id, label, value, onChange, unit, max = 100 }: { id: string; label: string; value?: number; onChange: (v?: number) => void; unit?: string; max?: number }) {
  return (
    <label className="num-field" htmlFor={id}>
      <span>{label}</span>
      <span className="num-wrap">
        <input id={id} type="number" inputMode="numeric" min={0} max={max} value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Math.max(0, Math.min(max, Number(e.target.value))))} />
        {unit ? <span className="num-unit">{unit}</span> : null}
      </span>
    </label>
  );
}

export const toggle = <T,>(list: T[], value: T): T[] => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
