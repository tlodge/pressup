import { ButtonLink } from "./ui/primitives";

/** Shown on sections that need a plan before there is one. */
export function NeedsProfile({ title }: { title: string }) {
  return (
    <div className="screen">
      <p className="eyebrow">{title}</p>
      <h1 className="h-display">No plan yet</h1>
      <p className="body-copy muted">Answer a few questions and PressUp builds your week around your goals, time and equipment.</p>
      <ButtonLink href="/onboarding" variant="primary" size="lg" block>Build my plan</ButtonLink>
    </div>
  );
}
