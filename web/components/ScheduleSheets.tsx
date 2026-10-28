"use client";

import { useState } from "react";
import { AVAILABILITY, missedOptions, moveOptions, planAroundWeek, type Availability, type Change, type DayOption, type Week } from "@/lib/engine/schedule";
import { saveWeek, type WeekView } from "@/lib/store";
import { WEEKDAY_LONG, WEEKDAY_SHORT, type Weekday } from "@/lib/training";
import { WhyList } from "./AdaptSheet";
import { ChipChoice } from "./onboarding/fields";
import { Sheet } from "./Sheet";
import { Icon } from "./ui/Icon";
import { Button } from "./ui/primitives";

/** The confirm step every schedule change goes through: what changes, why, and Accept or Back. */
function Confirm({ change, view, onAccept, onBack }: { change: Change; view: WeekView; onAccept: () => void; onBack: () => void }) {
  return (
    <>
      <p className="body-copy"><strong>{change.summary}</strong></p>
      <WhyList items={change.reasons} />
      <MiniWeek before={view} after={change.week} />
      <div className="stack-2">
        <Button variant="primary" size="lg" block icon="check" onClick={onAccept}>Accept</Button>
        <Button variant="ghost" block onClick={onBack}>Back</Button>
      </div>
    </>
  );
}

/** The week after a change, with changed days marked. */
function MiniWeek({ before, after }: { before: Week; after: Week }) {
  const on = (w: Week, d: number) => {
    const e = w.days.find((x) => x.weekday === d);
    if (!e) return { text: "Rest", id: "" };
    const s = w.sessions[e.sessionId];
    return { text: w.skipped.includes(e.sessionId) ? `${s.name} (skipped)` : s.name, id: `${e.sessionId}:${JSON.stringify(s)}:${w.skipped.includes(e.sessionId)}` };
  };
  return (
    <ol className="mini-week" aria-label="Your week after this change">
      {WEEKDAY_SHORT.map((d, i) => {
        const a = on(after, i);
        const changed = a.id !== on(before, i).id;
        return (
          <li key={d} className={changed ? "is-changed" : undefined}>
            <span>{d}</span>
            <span>{a.text}</span>
            {changed ? <span className="sr-only">changed</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

function DayList({ options, onPick }: { options: DayOption[]; onPick: (o: DayOption) => void }) {
  if (!options.length) return <p className="muted">There are no days left this week.</p>;
  return (
    <ul className="mode-list">
      {options.map((o) => (
        <li key={o.weekday}>
          <button type="button" className={`mode mode-btn${o.ok ? "" : " mode-off"}`} disabled={!o.ok} onClick={() => onPick(o)}>
            <span className="mode-icon"><Icon name={o.ok ? "calendar" : "ban"} /></span>
            <span>
              <strong>{WEEKDAY_LONG[o.weekday]}</strong>
              <span className="muted">{o.reason}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Move a session to another day this week. `initial` jumps straight to a day picked by dragging. */
export function MoveSheet({ view, sessionId, today, doneDays, initial, onClose }: {
  view: WeekView; sessionId: string | null; today: Date; doneDays: Weekday[]; initial?: Weekday; onClose: () => void;
}) {
  const [picked, setPicked] = useState<DayOption | null>(null);
  const wd = ((today.getDay() + 6) % 7) as Weekday;
  const options = sessionId ? moveOptions(view, sessionId, wd, doneDays) : [];
  const dropped = initial !== undefined ? options.find((o) => o.weekday === initial) : undefined;
  const choice = picked ?? (dropped?.ok ? dropped : null);
  const s = sessionId ? view.sessions[sessionId] : null;
  const close = () => { setPicked(null); onClose(); };
  return (
    <Sheet open={!!sessionId} onClose={close} title={s ? `Move ${s.name}` : "Move"} id="move-title">
      {choice?.change ? (
        <Confirm change={choice.change} view={view} onBack={() => (picked ? setPicked(null) : close())}
          onAccept={() => { saveWeek(choice.change!.week, today, choice.change!.summary); close(); }} />
      ) : (
        <>
          {dropped && !dropped.ok ? <p className="note"><Icon name="ban" size={18} />{WEEKDAY_LONG[dropped.weekday]} doesn&rsquo;t work. {dropped.reason}</p> : null}
          <p className="muted">Pick a day. Days that would double up or put hard sessions back to back are greyed out, with the reason.</p>
          <DayList options={options} onPick={setPicked} />
        </>
      )}
    </Sheet>
  );
}

/** A planned session that went by without a workout: move it, fold its key lifts into a later session, or skip it. */
export function MissedSheet({ view, sessionId, today, doneDays, minutes, onClose }: {
  view: WeekView; sessionId: string | null; today: Date; doneDays: Weekday[]; minutes: number; onClose: () => void;
}) {
  const [picked, setPicked] = useState<Change | null>(null);
  const wd = ((today.getDay() + 6) % 7) as Weekday;
  const s = sessionId ? view.sessions[sessionId] : null;
  const opts = sessionId ? missedOptions(view, sessionId, wd, doneDays, minutes) : null;
  const close = () => { setPicked(null); onClose(); };
  return (
    <Sheet open={!!sessionId} onClose={close} title={s ? `Missed ${s.name}` : "Missed session"} id="missed-title">
      {picked ? (
        <Confirm change={picked} view={view} onBack={() => setPicked(null)} onAccept={() => { saveWeek(picked.week, today, picked.summary); close(); }} />
      ) : opts && s ? (
        <>
          <p className="muted">It happens. Pick what works for the rest of your week. PressUp never doubles up sessions to catch up.</p>
          <section className="stack-2">
            <p className="eyebrow">Move it to</p>
            <DayList options={opts.moves} onPick={(o) => o.change && setPicked(o.change)} />
          </section>
          {opts.folds.length ? (
            <section className="stack-2">
              <p className="eyebrow">Or fold its main lifts into</p>
              <DayList options={opts.folds} onPick={(o) => o.change && setPicked(o.change)} />
            </section>
          ) : null}
          <section className="stack-2">
            <p className="eyebrow">Or let it go</p>
            <Button variant="secondary" size="lg" block onClick={() => setPicked(opts.skip)}>Skip it this week</Button>
          </section>
        </>
      ) : null}
    </Sheet>
  );
}

/** Mark the week's busy and short days, then see a suggested layout for the rest of the week. */
export function WeekSheet({ view, open, today, doneDays, onClose }: { view: WeekView; open: boolean; today: Date; doneDays: Weekday[]; onClose: () => void }) {
  const wd = ((today.getDay() + 6) % 7) as Weekday;
  const [busy, setBusy] = useState<Week["busy"]>(view.busy);
  const [proposal, setProposal] = useState<Change | null>(null);
  const close = () => { setProposal(null); onClose(); };
  const days = WEEKDAY_LONG.map((_, i) => i as Weekday).filter((d) => d >= wd);
  return (
    <Sheet open={open} onClose={close} title="Plan around your week" id="week-title">
      {proposal ? (
        <Confirm change={proposal} view={view} onBack={() => setProposal(null)}
          onAccept={() => { saveWeek(proposal.week, today, `Planned around your week. ${proposal.reasons.join(" ")}`); close(); }} />
      ) : (
        <>
          <p className="muted">Lectures, shifts, a night out: mark the days you&rsquo;re busy or short of time, and PressUp suggests where your sessions fit.</p>
          {days.map((d) => (
            <div key={d} className="field">
              <p className="field-label">{WEEKDAY_LONG[d]}{d === wd ? " (today)" : ""}</p>
              {doneDays.includes(d) ? (
                <p className="muted">Trained already.</p>
              ) : (
                <ChipChoice label={WEEKDAY_LONG[d]} options={AVAILABILITY} selected={[busy[d] ?? "free"]}
                  onToggle={(v: Availability) => setBusy({ ...busy, [d]: v === "free" ? undefined : v })} />
              )}
            </div>
          ))}
          <Button variant="primary" size="lg" block onClick={() => setProposal(planAroundWeek(view, busy, wd, doneDays))}>Suggest my week</Button>
        </>
      )}
    </Sheet>
  );
}
