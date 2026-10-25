"use client";

import { useEffect, useRef } from "react";
import { Icon, type IconName } from "./ui/Icon";

const MODES: { icon: IconName; title: string; detail: string }[] = [
  { icon: "timer", title: "Shorter version of today", detail: "Keeps the main lifts and trims the extras to fit your time." },
  { icon: "bolt", title: "Quick workout", detail: "15 to 30 minutes, built from your plan." },
  { icon: "moon", title: "Low-energy session", detail: "Same purpose, lighter load, fewer sets." },
  { icon: "home", title: "Home or no equipment", detail: "Swaps in moves that train the same thing." },
  { icon: "adapt", title: "Back after time away", detail: "Eases you in at a lower volume." },
  { icon: "check", title: "Take a rest day", detail: "Rest is part of the plan. Your week reshuffles around it." },
];

/** The ADAPT MY WORKOUT sheet. The options are shown now; the engine behind them arrives in milestone 4. */
export function AdaptSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} className="sheet" aria-labelledby="adapt-title" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="sheet-body">
        <div className="sheet-grab" aria-hidden="true" />
        <div className="sheet-head">
          <h2 id="adapt-title" className="h-heading">Adapt my workout</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="x" />
          </button>
        </div>
        <p className="muted">Tell PressUp what today looks like and it reshapes the session around it.</p>
        <ul className="mode-list">
          {MODES.map((m) => (
            <li key={m.title} className="mode">
              <span className="mode-icon"><Icon name={m.icon} /></span>
              <span>
                <strong>{m.title}</strong>
                <span className="muted">{m.detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="note">
          <Icon name="timer" size={18} />
          Preview: adapting goes live in the next builds, with a quick check-in on time, energy, sleep and how you feel.
        </p>
      </div>
    </dialog>
  );
}
