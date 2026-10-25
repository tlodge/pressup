import Link from "next/link";
import { WEEKDAY_LONG, estimateMinutes, type WeekPlan, type Weekday } from "@/lib/training";
import { Icon } from "./ui/Icon";

const FOCUS_LABEL: Record<string, string> = {
  lower: "Legs", upper: "Upper body", full: "Full body", push: "Push", pull: "Pull", calisthenics: "Bodyweight", run: "Run", conditioning: "Conditioning",
};

/** The week laid out day by day, with rest days shown. Sessions link to their detail when `linked`. */
export function PlanWeek({ plan, today, linked = false }: { plan: WeekPlan; today?: Weekday; linked?: boolean }) {
  return (
    <ol className="plan-week">
      {WEEKDAY_LONG.map((name, i) => {
        const entry = plan.days.find((d) => d.weekday === i);
        const s = entry ? plan.sessions[entry.sessionId] : null;
        const body = s ? (
          <>
            <span className="pw-main">
              <strong>{s.name}</strong>
              <span className="muted">{FOCUS_LABEL[s.focus]} · {estimateMinutes(s)} min{s.hard ? " · hard" : ""}</span>
            </span>
            {linked ? <Icon name="chevron-right" className="pw-go" /> : null}
          </>
        ) : (
          <span className="pw-main"><span className="muted">Rest</span></span>
        );
        return (
          <li key={name} className={`pw-day${s ? "" : " pw-rest"}${today === i ? " pw-today" : ""}`}>
            <span className="pw-name">{name.slice(0, 3)}{today === i ? <em>Today</em> : null}</span>
            {s && linked && entry ? <Link className="pw-card" href={`/workout?s=${entry.sessionId}`}>{body}</Link> : <span className="pw-card">{body}</span>}
          </li>
        );
      })}
    </ol>
  );
}

export function PlanNotes({ notes, title = "Why your week looks like this" }: { notes: string[]; title?: string }) {
  return (
    <section className="stack-2" aria-label={title}>
      <p className="eyebrow">{title}</p>
      <ul className="soon-list card">
        {notes.map((n) => (
          <li key={n}><Icon name="check" />{n}</li>
        ))}
      </ul>
    </section>
  );
}
