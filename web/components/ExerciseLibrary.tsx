"use client";

import Link from "next/link";
import { useState } from "react";
import { blocker } from "@/lib/engine/eligibility";
import { AREAS, EXERCISES, LEVEL_LABEL, areaOf, type Area } from "@/lib/exercises";
import { kitLabel } from "@/lib/exercise-format";
import { useStored } from "@/lib/store";
import { Icon } from "./ui/Icon";

export function ExerciseLibrary() {
  const stored = useStored();
  const profile = stored && stored !== "loading" ? stored.profile : null;
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<Area | null>(null);
  const [onlyDoable, setOnlyDoable] = useState(true);
  const [onlyFavourites, setOnlyFavourites] = useState(false);

  const q = query.trim().toLowerCase();
  const results = EXERCISES.filter((e) => {
    if (area && areaOf(e) !== area) return false;
    if (q && !`${e.name} ${e.muscles.join(" ")}`.toLowerCase().includes(q)) return false;
    if (profile && onlyDoable && blocker(e, profile)) return false;
    if (profile && onlyFavourites && !profile.favourites.includes(e.id)) return false;
    return true;
  });

  return (
    <div className="screen">
      <header className="top"><p className="eyebrow">Library</p><span className="eyebrow">{EXERCISES.length} exercises</span></header>
      <h1 className="h-display">Exercises</h1>

      <div className="stack-3">
        <label className="search" htmlFor="exercise-search">
          <Icon name="search" size={20} />
          <input id="exercise-search" type="search" placeholder="Search by name or muscle" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" />
        </label>
        <div className="chip-scroll" role="group" aria-label="Body area">
          <button type="button" className="pu-chip" aria-pressed={area === null} onClick={() => setArea(null)}>All</button>
          {AREAS.map((a) => (
            <button key={a} type="button" className="pu-chip" aria-pressed={area === a} onClick={() => setArea(area === a ? null : a)}>{a}</button>
          ))}
        </div>
        {profile ? (
          <div className="chip-row" role="group" aria-label="Show">
            <button type="button" className="pu-chip" aria-pressed={onlyDoable} onClick={() => setOnlyDoable(!onlyDoable)}>Suits my kit and limits</button>
            <button type="button" className="pu-chip" aria-pressed={onlyFavourites} onClick={() => setOnlyFavourites(!onlyFavourites)}>
              <Icon name="heart" size={16} />Favourites{profile.favourites.length ? ` (${profile.favourites.length})` : ""}
            </button>
          </div>
        ) : null}
      </div>

      <p className="muted" role="status">{results.length === 1 ? "1 exercise" : `${results.length} exercises`}</p>
      {results.length ? (
        <ul className="ex-list">
          {results.map((e) => {
            const fav = profile?.favourites.includes(e.id);
            const block = profile ? blocker(e, profile) : null;
            return (
              <li key={e.id}>
                <Link href={`/exercises/${e.id}`} className="ex-row">
                  <span className="ex-row-main">
                    <strong>{e.name}</strong>
                    <span className="muted">{areaOf(e)} · {kitLabel(e)}</span>
                    <span className="ex-row-meta">{block ? <><Icon name="ban" size={14} />{block.text}</> : LEVEL_LABEL[e.level]}</span>
                  </span>
                  {fav ? <Icon name="heart" className="ex-fav" title="Favourite" /> : null}
                  <Icon name="chevron-right" className="pw-go" />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="card stack-2">
          <p><strong>Nothing matches.</strong></p>
          <p className="muted">{onlyFavourites ? "You haven't favourited any exercises here yet. Tap the heart on an exercise to add it." : "Try another search, or turn off “Suits my kit and limits” to see everything."}</p>
        </div>
      )}
    </div>
  );
}
