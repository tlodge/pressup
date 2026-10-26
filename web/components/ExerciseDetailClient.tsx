"use client";

import Link from "next/link";
import { useState } from "react";
import { findSwaps } from "@/lib/engine/substitute";
import { toggleExcluded, toggleFavourite, useStored } from "@/lib/store";
import { Icon } from "./ui/Icon";

/** Favourite and leave-out toggles for one exercise. */
export function ExerciseActions({ id, name }: { id: string; name: string }) {
  const stored = useStored();
  const [message, setMessage] = useState<string | null>(null);
  if (stored === "loading") return <div className="skeleton" style={{ height: 48 }} />;
  if (!stored) {
    return <p className="muted">Build your plan to favourite exercises or leave them out. <Link href="/onboarding" className="text-link">Get started</Link></p>;
  }
  const fav = stored.profile.favourites.includes(id);
  const excluded = stored.profile.excluded.includes(id);
  return (
    <div className="stack-2">
      <div className="action-row">
        <button type="button" className="pu-chip" aria-pressed={fav} disabled={excluded}
          onClick={() => { toggleFavourite(id); setMessage(fav ? null : `${name} is a favourite. PressUp picks it when it has a choice.`); }}>
          <Icon name="heart" size={16} />{fav ? "Favourite" : "Add to favourites"}
        </button>
        <button type="button" className="pu-chip" aria-pressed={excluded}
          onClick={() => { toggleExcluded(id); setMessage(excluded ? `${name} can appear in your plans again.` : `${name} is left out. Your plan has been rebuilt without it.`); }}>
          <Icon name="ban" size={16} />{excluded ? "Left out of plans" : "Leave out of my plans"}
        </button>
      </div>
      {message ? <p className="toast" role="status">{message}</p> : null}
    </div>
  );
}

/** Swaps that train the same thing, marked by whether this user can do them. */
export function ExerciseSwaps({ id }: { id: string }) {
  const stored = useStored();
  if (stored === "loading") return null;
  const profile = stored ? stored.profile : null;
  const swaps = profile ? findSwaps(id, profile).slice(0, 6) : [];
  if (!profile || !swaps.length) return null;
  return (
    <section className="stack-2" aria-labelledby="swaps">
      <h2 id="swaps" className="eyebrow">Swaps that train the same thing</h2>
      <ul className="ex-list">
        {swaps.map((s) => (
          <li key={s.exercise.id}>
            <Link href={`/exercises/${s.exercise.id}`} className={`ex-row${s.blocker ? " ex-row-off" : ""}`}>
              <span className="ex-row-main">
                <strong>{s.exercise.name}</strong>
                <span className="muted">{s.reason}</span>
                {s.blocker ? <span className="ex-row-meta"><Icon name="ban" size={14} />{s.blocker.text}</span> : null}
              </span>
              <Icon name="chevron-right" className="pw-go" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
