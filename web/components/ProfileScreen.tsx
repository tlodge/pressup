"use client";

import { useRouter } from "next/navigation";
import { useState, type ComponentType } from "react";
import {
  BODY_AREAS, EQUIPMENT, EXPERIENCE, GOALS, LOCATIONS, RACES, VALID, WORKOUT_TYPES, labelOf, type Profile,
} from "@/lib/profile";
import { clearAll, saveProfile, useStored } from "@/lib/store";
import { WEEKDAY_SHORT } from "@/lib/training";
import { NeedsProfile } from "./NeedsProfile";
import { ExperienceStep, GoalsStep, LevelStep, PreferencesStep, ScheduleStep, SetupStep, type StepProps } from "./onboarding/steps";
import { Button } from "./ui/primitives";

type Section = { id: string; title: string; Editor: ComponentType<StepProps>; summary: (p: Profile) => string; valid?: (p: Profile) => boolean };

const list = (xs: string[], empty = "None") => (xs.length ? xs.join(", ") : empty);

const SECTIONS: Section[] = [
  { id: "goals", title: "Goals", Editor: GoalsStep, valid: VALID.goals,
    summary: (p) => list(p.goals.map((g, i) => `${labelOf(GOALS, g)}${g === "race" && p.race ? ` (${labelOf(RACES, p.race)})` : ""}${i === 0 ? " (main)" : ""}`)) },
  { id: "experience", title: "Experience", Editor: ExperienceStep, summary: (p) => labelOf(EXPERIENCE, p.experience) },
  { id: "schedule", title: "Training days", Editor: ScheduleStep, valid: VALID.schedule,
    summary: (p) => `${list(p.days.map((d) => WEEKDAY_SHORT[d]))} · ${p.minutes} min` },
  { id: "setup", title: "Location and equipment", Editor: SetupStep, valid: VALID.setup,
    summary: (p) => `${list(p.locations.map((l) => labelOf(LOCATIONS, l)))} · ${p.equipment.length ? `${p.equipment.length} of ${EQUIPMENT.length} kit items` : "Bodyweight only"}` },
  { id: "preferences", title: "Likes and limits", Editor: PreferencesStep,
    summary: (p) => `Enjoys: ${list(p.preferred.map((w) => labelOf(WORKOUT_TYPES, w)), "anything")} · Avoids: ${list(p.avoid.map((a) => labelOf(BODY_AREAS, a)), "nothing")}` },
  { id: "level", title: "Starting point", Editor: LevelStep,
    summary: (p) => list([
      p.level.pushUps !== undefined ? `${p.level.pushUps} push-ups` : "",
      p.level.pullUps !== undefined ? `${p.level.pullUps} pull-ups` : "",
      p.level.canRun5k ? (p.level.canRun5k === "yes" ? `Runs 5K${p.level.fiveKMinutes ? ` in ${p.level.fiveKMinutes} min` : ""}` : "Building up to 5K") : "",
    ].filter(Boolean), "Not set") },
];

export function ProfileScreen() {
  const stored = useStored();
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  if (stored === "loading") return <div className="screen" aria-busy="true"><div className="skeleton" style={{ height: 420 }} /></div>;
  if (!stored) return <NeedsProfile title="Profile" />;

  const open = (id: string) => {
    setEditing(id);
    setDraft(stored.profile);
    setSaved(false);
  };
  const cancel = () => {
    setEditing(null);
    setDraft(null);
  };
  const save = () => {
    if (!draft) return;
    saveProfile(draft);
    setEditing(null);
    setDraft(null);
    setSaved(true);
  };

  return (
    <div className="screen">
      <header className="top"><p className="eyebrow">Your settings</p></header>
      <h1 className="h-display">Profile</h1>
      {saved ? <p className="toast" role="status">Saved. Your plan has been rebuilt to match.</p> : null}

      <section className="stack-2" aria-label="Training preferences">
        {SECTIONS.map((s) => {
          const isOpen = editing === s.id && draft;
          return (
            <div key={s.id} className="card setting">
              <div className="setting-head">
                <div className="setting-text">
                  <p className="field-label">{s.title}</p>
                  {!isOpen ? <p className="muted">{s.summary(stored.profile)}</p> : null}
                </div>
                {!isOpen ? <Button variant="ghost" size="sm" onClick={() => open(s.id)} aria-label={`Edit ${s.title.toLowerCase()}`}>Edit</Button> : null}
              </div>
              {isOpen ? (
                <div className="setting-edit">
                  <s.Editor profile={draft} set={(patch) => setDraft({ ...draft, ...patch })} />
                  <div className="setting-actions">
                    <Button variant="ghost" onClick={cancel}>Cancel</Button>
                    <Button variant="primary" onClick={save} disabled={s.valid ? !s.valid(draft) : false}>Save and rebuild plan</Button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      <section className="stack-2" aria-label="Account and privacy">
        <p className="eyebrow">Account and privacy</p>
        <div className="card stack-2">
          <p className="muted">Your profile and plan are stored only in this browser. Accounts, sync across devices and privacy settings arrive in milestone 8.</p>
          {confirmReset ? (
            <div className="stack-2">
              <p><strong>Delete your profile and plan from this device?</strong> You&rsquo;ll start again from the welcome screen.</p>
              <div className="setting-actions">
                <Button variant="ghost" onClick={() => setConfirmReset(false)}>Keep my data</Button>
                <Button variant="secondary" className="danger" onClick={() => { clearAll(); router.replace("/"); }}>Delete and start again</Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setConfirmReset(true)}>Start again</Button>
          )}
        </div>
      </section>
    </div>
  );
}
