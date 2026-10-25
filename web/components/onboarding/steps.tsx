"use client";

/* The editors for each part of the profile. Onboarding shows them one per screen; Profile reuses them for edits. */
import {
  BODY_AREAS, EQUIPMENT, EXPERIENCE, GOALS, GYM_EQUIPMENT, LOCATIONS, MINUTES, RACES, WORKOUT_TYPES, isRunGoal,
  type Location, type Profile,
} from "@/lib/profile";
import { ChipChoice, DayPicker, Field, NumberInput, OptionCards, toggle } from "./fields";

export type StepProps = { profile: Profile; set: (patch: Partial<Profile>) => void };

export function GoalsStep({ profile: p, set }: StepProps) {
  return (
    <>
      <Field label="What do you want from training?" hint="Pick as many as you like. Your first pick is your main goal.">
        <OptionCards label="Goals" options={GOALS} selected={p.goals} onToggle={(g) => set({ goals: toggle(p.goals, g) })}
          badge={(g) => (p.goals[0] === g ? "Main" : p.goals.includes(g) ? `${p.goals.indexOf(g) + 1}` : undefined)} />
      </Field>
      {p.goals.includes("race") ? (
        <Field label="Which race?">
          <ChipChoice label="Race distance" options={RACES} selected={p.race ? [p.race] : []} onToggle={(race) => set({ race })} />
        </Field>
      ) : null}
    </>
  );
}

export function ExperienceStep({ profile: p, set }: StepProps) {
  return (
    <Field label="How much training have you done?" hint="This sets where your plan starts. It moves with you as you progress.">
      <OptionCards label="Experience" options={EXPERIENCE} selected={[p.experience]} onToggle={(experience) => set({ experience })} />
    </Field>
  );
}

export function ScheduleStep({ profile: p, set }: StepProps) {
  const n = p.days.length;
  return (
    <>
      <Field label="Which days usually work?" hint="Choose 2 to 6. You can move sessions any week.">
        <DayPicker days={p.days} onChange={(days) => set({ days })} />
        <p className={n < 2 || n > 6 ? "field-error" : "muted"} role="status">
          {n < 2 ? "Pick at least 2 days." : n > 6 ? "Leave at least one rest day." : `${n} sessions a week.`}
        </p>
      </Field>
      <Field label="How long is a typical session?" hint="On busy days you can shorten any session.">
        <ChipChoice label="Time per session" options={MINUTES} selected={[p.minutes]} onToggle={(minutes) => set({ minutes })} />
      </Field>
    </>
  );
}

export function SetupStep({ profile: p, set }: StepProps) {
  const setLocations = (locations: Location[]) => {
    const hadGym = p.locations.includes("gym");
    const hasGym = locations.includes("gym");
    // A gym brings the full kit; leaving the gym clears it so the user picks what they actually have.
    const equipment = hasGym && !hadGym ? [...GYM_EQUIPMENT] : !hasGym && hadGym ? [] : p.equipment;
    set({ locations, equipment });
  };
  return (
    <>
      <Field label="Where will you train?" hint="Pick all that apply.">
        <ChipChoice label="Training location" options={LOCATIONS} selected={p.locations} onToggle={(l) => setLocations(toggle(p.locations, l))} />
      </Field>
      <Field label="What equipment do you have?" hint={p.locations.includes("gym") ? "A typical gym has all of this. Untick anything yours doesn't." : "Leave it empty for bodyweight-only training."}>
        <ChipChoice label="Equipment" options={EQUIPMENT} selected={p.equipment} onToggle={(e) => set({ equipment: toggle(p.equipment, e) })} />
      </Field>
    </>
  );
}

export function PreferencesStep({ profile: p, set }: StepProps) {
  return (
    <>
      <Field label="What do you enjoy?" hint="Optional. PressUp leans towards these when it has a choice.">
        <ChipChoice label="Preferred workout types" options={WORKOUT_TYPES} selected={p.preferred} onToggle={(w) => set({ preferred: toggle(p.preferred, w) })} />
      </Field>
      <Field label="Anything to go easy on?" hint="Optional. Exercises that load these areas are left out.">
        <ChipChoice label="Areas to avoid" options={BODY_AREAS} selected={p.avoid} onToggle={(a) => set({ avoid: toggle(p.avoid, a) })} />
      </Field>
      <Field label="Other limitations">
        <textarea id="limitations-note" className="text-input" rows={2} maxLength={280} placeholder="For example: recovering from an ankle sprain"
          value={p.limitationsNote ?? ""} onChange={(e) => set({ limitationsNote: e.target.value || undefined })} aria-label="Other limitations" />
      </Field>
      <p className="note">If something hurts during training, PressUp offers alternatives or rest. It never asks you to push through pain. For an injury, speak to a physiotherapist or GP.</p>
    </>
  );
}

/** Only shown when a goal benefits from a starting point. */
export const needsLevelStep = (p: Profile) => p.goals.some((g) => isRunGoal(g) || g === "calisthenics" || g === "general");

export function LevelStep({ profile: p, set }: StepProps) {
  const lvl = p.level;
  const runs = p.goals.some(isRunGoal);
  const bodyweight = p.goals.includes("calisthenics") || p.goals.includes("general");
  return (
    <>
      {bodyweight ? (
        <Field label="Where are you now?" hint="Optional. Best guesses are fine.">
          <div className="stack-2">
            <NumberInput id="push-ups" label="Push-ups in a row" value={lvl.pushUps} onChange={(pushUps) => set({ level: { ...lvl, pushUps } })} />
            <NumberInput id="pull-ups" label="Pull-ups in a row" value={lvl.pullUps} onChange={(pullUps) => set({ level: { ...lvl, pullUps } })} max={50} />
          </div>
        </Field>
      ) : null}
      {runs ? (
        <Field label="Can you run 5K without stopping?">
          <ChipChoice label="Can run 5K" options={[{ value: "yes" as const, label: "Yes" }, { value: "not-yet" as const, label: "Not yet" }]}
            selected={lvl.canRun5k ? [lvl.canRun5k] : []} onToggle={(canRun5k) => set({ level: { ...lvl, canRun5k } })} />
          {lvl.canRun5k === "yes" ? (
            <NumberInput id="five-k" label="Recent 5K time" unit="min" value={lvl.fiveKMinutes} onChange={(fiveKMinutes) => set({ level: { ...lvl, fiveKMinutes } })} max={90} />
          ) : null}
        </Field>
      ) : null}
      <p className="note">No need to test anything. Strength numbers are set from your first logged sessions.</p>
    </>
  );
}
