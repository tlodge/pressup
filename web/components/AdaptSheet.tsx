"use client";

import { useState, type ReactNode } from "react";
import { adaptSession, AWAY_LABEL, REST_OK, homeKit, kitOptions, type AdaptRequest, type Energy, type Sleep, type Soreness, type TimeAway } from "@/lib/engine/adapt";
import { BODY_AREAS, type BodyArea, type Equipment } from "@/lib/profile";
import { saveAdaptation, type Stored } from "@/lib/store";
import { estimateMinutes } from "@/lib/training";
import { ChipChoice, Field, toggle } from "./onboarding/fields";
import { Sheet } from "./Sheet";
import { Icon, type IconName } from "./ui/Icon";
import { Button, StatTile } from "./ui/primitives";

type View =
  | { name: "menu" }
  | { name: "checkin" }
  | { name: "minutes"; quick: boolean }
  | { name: "kit" }
  | { name: "away" }
  | { name: "result"; label: string; request: AdaptRequest };

type Mode = { icon: IconName; title: string; detail: string; go: View };

/** ADAPT MY WORKOUT: a quick check-in, or a direct choice of mode. The rules engine builds the result; nothing is saved until the user accepts it. */
export function AdaptSheet({ open, onClose, stored, sessionId, date, restDay }: {
  open: boolean;
  onClose: () => void;
  stored: Stored;
  /** The session to adapt: today's, or on a rest day the next one, which a quick workout is built from. */
  sessionId: string;
  date: string;
  restDay: boolean;
}) {
  const [view, setView] = useState<View>({ name: "menu" });
  const close = () => {
    onClose();
    setView({ name: "menu" });
  };
  const planned = stored.plan.sessions[sessionId];
  if (!planned) return null;
  const plannedMin = estimateMinutes(planned);
  const result = (label: string, request: AdaptRequest) => setView({ name: "result", label, request });

  const modes: Mode[] = restDay
    ? [{ icon: "bolt", title: "Quick workout", detail: `15 to 30 minutes, built from ${planned.name}, the session easiest on your legs, and kept light.`, go: { name: "minutes", quick: true } }]
    : [
        { icon: "timer", title: "Shorter version of today", detail: "Keeps the main lifts and trims the extras to fit your time.", go: { name: "minutes", quick: false } },
        { icon: "bolt", title: "Quick workout", detail: "15 to 30 minutes: just the core of today's session.", go: { name: "minutes", quick: true } },
        { icon: "moon", title: "Low-energy session", detail: "Same purpose, lighter load, fewer sets.", go: { name: "result", label: "Low-energy session", request: { energy: "low" } } },
        { icon: "home", title: "Home workout", detail: "Swaps in moves that train the same thing with the kit you have there.", go: { name: "kit" } },
        { icon: "dumbbell", title: "No equipment", detail: "Bodyweight moves that train the same thing.", go: { name: "result", label: "No equipment", request: { kit: [] } } },
        { icon: "adapt", title: "Back after time away", detail: "Eases you in at a lower volume.", go: { name: "away" } },
        { icon: "check", title: "Take a rest day", detail: "Rest is part of the plan. Nothing gets doubled up later.", go: { name: "result", label: "Rest day", request: { rest: true } } },
      ];

  const back = <Button variant="ghost" block onClick={() => setView({ name: "menu" })}>Back</Button>;
  let title = "Adapt my workout";
  let body;

  switch (view.name) {
    case "menu":
      body = (
        <>
          <p className="muted">
            {restDay ? `Today is a rest day, and rest is part of the plan. If you'd still like to move, keep it short and easy.` : "Tell PressUp what today looks like and it reshapes the session around it."}
          </p>
          {restDay ? null : (
            <button type="button" className="checkin-cta" onClick={() => setView({ name: "checkin" })}>
              <span>
                <strong>How are you today?</strong>
                <span className="muted">Time, energy, sleep and how you feel. Four quick taps.</span>
              </span>
              <Icon name="chevron-right" />
            </button>
          )}
          <ul className="mode-list">
            {modes.map((m) => (
              <li key={m.title}>
                <button type="button" className="mode mode-btn" onClick={() => setView(m.go)}>
                  <span className="mode-icon"><Icon name={m.icon} /></span>
                  <span>
                    <strong>{m.title}</strong>
                    <span className="muted">{m.detail}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      );
      break;
    case "checkin":
      title = "Check-in";
      body = <CheckIn plannedMin={plannedMin} onDone={(req) => result("Adapted to your check-in", req)} back={back} />;
      break;
    case "minutes": {
      title = view.quick ? "Quick workout" : "Shorter session";
      const options = (view.quick ? [15, 20, 30] : [15, 20, 30, 45, 60]).filter((m) => m < plannedMin);
      body = (
        <>
          <p className="muted">How long have you got? {restDay ? planned.name : "Today\u2019s session"} is planned at about {plannedMin} minutes.</p>
          <div className="chip-row" role="group" aria-label="Minutes available">
            {(options.length ? options : [15]).map((m) => (
              <button key={m} type="button" className="pu-chip" onClick={() => result(view.quick ? "Quick workout" : `${m}-minute version`, { minutes: m, quick: view.quick, extra: restDay || undefined })}>
                {m} min
              </button>
            ))}
          </div>
          {back}
        </>
      );
      break;
    }
    case "kit":
      title = "Home workout";
      body = <KitPicker initial={homeKit(stored.profile)} onDone={(kit) => result("Home workout", { kit })} back={back} />;
      break;
    case "away":
      title = "Back after time away";
      body = (
        <>
          <p className="muted">How long since your last session?</p>
          <ul className="mode-list">
            {(Object.keys(AWAY_LABEL) as TimeAway[]).map((a) => (
              <li key={a}>
                <button type="button" className="mode mode-btn" onClick={() => result("Back after time away", { away: a })}>
                  <span><strong>{AWAY_LABEL[a].charAt(0).toUpperCase() + AWAY_LABEL[a].slice(1)}</strong></span>
                </button>
              </li>
            ))}
          </ul>
          {back}
        </>
      );
      break;
    case "result":
      title = "Today";
      body = (
        <Result stored={stored} sessionId={sessionId} label={view.label} request={view.request} back={back}
          onAccept={(label, request, adaptation) => {
            saveAdaptation({ date, sessionId, label, request, result: adaptation });
            close();
          }} />
      );
      break;
  }

  return (
    <Sheet open={open} onClose={close} title={title} id="adapt-title">
      {body}
    </Sheet>
  );
}

const ENERGY = [{ value: "low", label: "Low" }, { value: "ok", label: "OK" }, { value: "high", label: "Good" }] as const;
const SLEEP = [{ value: "poor", label: "Badly" }, { value: "ok", label: "OK" }, { value: "good", label: "Well" }] as const;
const SORE = [{ value: "none", label: "Not sore" }, { value: "some", label: "A bit sore" }, { value: "very", label: "Very sore" }] as const;
type PainChoice = BodyArea | "none" | "elsewhere";
const PAIN: { value: PainChoice; label: string }[] = [{ value: "none", label: "No pain" }, ...BODY_AREAS, { value: "elsewhere", label: "Somewhere else" }];

function CheckIn({ plannedMin, onDone, back }: { plannedMin: number; onDone: (req: AdaptRequest) => void; back: ReactNode }) {
  const [minutes, setMinutes] = useState<number>(0);
  const [energy, setEnergy] = useState<Energy>("ok");
  const [sleep, setSleep] = useState<Sleep>("ok");
  const [soreness, setSoreness] = useState<Soreness>("none");
  const [pain, setPain] = useState<PainChoice[]>(["none"]);
  const [sharp, setSharp] = useState(false);
  const times = [15, 20, 30, 45, 60].filter((m) => m < plannedMin);
  const hurts = pain.some((p) => p !== "none");

  const togglePain = (v: PainChoice) => {
    if (v === "none") return setPain(["none"]);
    const next = toggle(pain.filter((p) => p !== "none"), v);
    setPain(next.length ? next : ["none"]);
  };

  return (
    <>
      <Field label="Time today">
        <ChipChoice label="Time today" options={[...times.map((m) => ({ value: m, label: `${m} min` })), { value: 0, label: `As planned (${plannedMin} min)` }]}
          selected={[minutes]} onToggle={setMinutes} />
      </Field>
      <Field label="Energy">
        <ChipChoice label="Energy" options={[...ENERGY]} selected={[energy]} onToggle={setEnergy} />
      </Field>
      <Field label="Last night's sleep">
        <ChipChoice label="Sleep" options={[...SLEEP]} selected={[sleep]} onToggle={setSleep} />
      </Field>
      <Field label="Muscle soreness">
        <ChipChoice label="Soreness" options={[...SORE]} selected={[soreness]} onToggle={setSoreness} />
      </Field>
      <Field label="Any pain?" hint="Pain is different from soreness: it's sharp, in a joint, or doesn't ease as you warm up.">
        <ChipChoice label="Pain" options={PAIN} selected={pain} onToggle={togglePain} />
      </Field>
      {hurts ? (
        <Field label="Is it sharp, or getting worse?">
          <ChipChoice label="Sharp or getting worse" options={[{ value: "no", label: "No" }, { value: "yes", label: "Yes" }]} selected={[sharp ? "yes" : "no"]} onToggle={(v) => setSharp(v === "yes")} />
        </Field>
      ) : null}
      <div className="stack-2">
        <Button variant="primary" size="lg" block onClick={() => onDone({
          minutes: minutes || undefined, energy, sleep, soreness,
          pain: pain.filter((p): p is BodyArea => p !== "none" && p !== "elsewhere"),
          painElsewhere: pain.includes("elsewhere") || undefined,
          painSharp: (hurts && sharp) || undefined,
        })}>See today&rsquo;s session</Button>
        {back}
      </div>
    </>
  );
}

function KitPicker({ initial, onDone, back }: { initial: Equipment[]; onDone: (kit: Equipment[]) => void; back: ReactNode }) {
  const [kit, setKit] = useState(initial);
  return (
    <>
      <Field label="What have you got there?" hint="Leave everything off for bodyweight only.">
        <ChipChoice label="Kit at home" options={kitOptions} selected={kit} onToggle={(v) => setKit(toggle(kit, v))} />
      </Field>
      <div className="stack-2">
        <Button variant="primary" size="lg" block onClick={() => onDone(kit)}>Build my home workout</Button>
        {back}
      </div>
    </>
  );
}

function Result({ stored, sessionId, label, request, back, onAccept }: {
  stored: Stored;
  sessionId: string;
  label: string;
  request: AdaptRequest;
  back: ReactNode;
  onAccept: (label: string, request: AdaptRequest, adaptation: ReturnType<typeof adaptSession>) => void;
}) {
  const planned = stored.plan.sessions[sessionId];
  const a = adaptSession(planned, stored.profile, request);

  if (a.kind === "rest") {
    return (
      <>
        <section className="stack-2">
          <p className="eyebrow">{label}</p>
          <h3 className="h-display">Rest today</h3>
        </section>
        <WhyList items={a.reasons} />
        <Advice items={a.advice} />
        <div className="stack-2">
          <Button variant="primary" size="lg" block icon="check" onClick={() => onAccept(request.rest ? label : "Rest day", request, a)}>Take a rest day</Button>
          {back}
        </div>
      </>
    );
  }

  const unchanged = !a.changes.length;
  return (
    <>
      <section className="stack-2">
        <p className="eyebrow">{label}</p>
        <h3 className="h-display">{a.session.name}</h3>
        <p className="muted">{a.session.purpose}</p>
      </section>
      <div className="grid-2">
        <StatTile label="Est. time" value={estimateMinutes(a.session)} unit={unchanged ? "min" : `min · was ${estimateMinutes(planned)}`} />
        <StatTile label={a.session.exercises.every((e) => e.durationMin) ? "Effort" : "Working sets"}
          value={a.session.exercises.every((e) => e.durationMin) ? (a.session.hard ? "Hard" : "Easy") : a.session.exercises.reduce((n, e) => n + e.sets, 0)} />
      </div>
      {unchanged ? <p className="body-copy">No changes needed: today&rsquo;s session already fits.</p> : <WhyList items={a.changes} title="What changed" />}
      <Advice items={a.advice} />
      <div className="stack-2">
        <Button variant="primary" size="lg" block onClick={() => onAccept(label, request, a)}>{unchanged ? "Keep today's session" : "Use this version"}</Button>
        {a.advice.includes(REST_OK) ? (
          <Button variant="secondary" size="lg" block icon="moon" onClick={() => onAccept("Rest day", { ...request, rest: true }, adaptSession(planned, stored.profile, { ...request, rest: true }))}>Rest instead</Button>
        ) : null}
        {back}
      </div>
    </>
  );
}

/** The reasons behind an adaptation, one short line each. */
export function WhyList({ items, title = "Why" }: { items: string[]; title?: string }) {
  if (!items.length) return null;
  return (
    <section className="stack-2" aria-label={title}>
      <p className="eyebrow">{title}</p>
      <ul className="why-list">
        {items.map((c) => (
          <li key={c}><Icon name="adapt" size={16} />{c}</li>
        ))}
      </ul>
    </section>
  );
}

export function Advice({ items }: { items: string[] }) {
  return items.map((t) => (
    <p key={t} className="note">
      <Icon name={t.startsWith("Pain") ? "heart" : "check"} size={18} />
      {t}
    </p>
  ));
}
