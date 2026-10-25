"use client";

import { useRouter } from "next/navigation";
import { useState, type ComponentType } from "react";
import { generatePlan } from "@/lib/engine/plan";
import { VALID, emptyProfile, type Profile } from "@/lib/profile";
import { saveProfile, useStored } from "@/lib/store";
import { PlanNotes, PlanWeek } from "../PlanWeek";
import { Button } from "../ui/primitives";
import { Icon } from "../ui/Icon";
import { ExperienceStep, GoalsStep, LevelStep, PreferencesStep, ScheduleStep, SetupStep, needsLevelStep, type StepProps } from "./steps";

type Step = { id: string; title: string; Component?: ComponentType<StepProps>; valid?: (p: Profile) => boolean; optional?: boolean };

const ALL_STEPS: Step[] = [
  { id: "goals", title: "Your goals", Component: GoalsStep, valid: VALID.goals },
  { id: "experience", title: "Experience", Component: ExperienceStep },
  { id: "schedule", title: "Your week", Component: ScheduleStep, valid: VALID.schedule },
  { id: "setup", title: "Where and with what", Component: SetupStep, valid: VALID.setup },
  { id: "preferences", title: "Likes and limits", Component: PreferencesStep, optional: true },
  { id: "level", title: "Starting point", Component: LevelStep, optional: true },
  { id: "review", title: "Your plan" },
];

export function OnboardingFlow() {
  const router = useRouter();
  const stored = useStored();
  const [draft, setDraft] = useState<Profile | null>(null);
  const [index, setIndex] = useState(0);

  // Start from the saved profile if there is one, so "Redo onboarding" keeps earlier answers.
  const profile = draft ?? (stored && stored !== "loading" ? stored.profile : emptyProfile());
  const set = (patch: Partial<Profile>) => setDraft({ ...profile, ...patch });

  const steps = ALL_STEPS.filter((s) => s.id !== "level" || needsLevelStep(profile));
  const step = steps[Math.min(index, steps.length - 1)];
  const isReview = step.id === "review";
  const canContinue = !step.valid || step.valid(profile);
  const preview = isReview ? generatePlan(profile, "preview") : null;

  const next = () => {
    if (isReview) {
      saveProfile(profile);
      router.replace("/");
      return;
    }
    setIndex((i) => Math.min(i + 1, steps.length - 1));
    window.scrollTo({ top: 0 });
  };
  const back = () => (index === 0 ? router.back() : setIndex((i) => i - 1));

  return (
    <div className="flow">
      <header className="flow-head">
        <button type="button" className="icon-btn" onClick={back} aria-label={index === 0 ? "Leave setup" : "Back"}>
          <Icon name="chevron-left" />
        </button>
        <div className="flow-progress" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={index + 1}>
          {steps.map((s, i) => <span key={s.id} className={i <= index ? "on" : undefined} />)}
        </div>
        <span className="eyebrow">{index + 1}/{steps.length}</span>
      </header>

      <section className="flow-body" aria-labelledby="step-title">
        <h1 id="step-title" className="h-display">{step.title}</h1>
        {step.Component ? <step.Component profile={profile} set={set} /> : null}
        {preview ? (
          <>
            <p className="body-copy muted">Here&rsquo;s your first week. It adapts as you go: shorten a session, move a day or take a rest, and the plan adjusts.</p>
            <PlanWeek plan={preview} />
            <PlanNotes notes={preview.notes} />
          </>
        ) : null}
      </section>

      <footer className="flow-foot">
        {step.optional ? <Button variant="ghost" onClick={next}>Skip</Button> : <span />}
        <Button variant="primary" size="lg" onClick={next} disabled={!canContinue} icon={isReview ? "play" : undefined}>
          {isReview ? "Start training" : "Continue"}
        </Button>
      </footer>
    </div>
  );
}
