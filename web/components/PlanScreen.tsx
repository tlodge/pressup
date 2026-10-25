"use client";

import { useStored } from "@/lib/store";
import { weekdayOf } from "@/lib/training";
import { useToday } from "@/lib/use-today";
import { PlanNotes, PlanWeek } from "./PlanWeek";
import { NeedsProfile } from "./NeedsProfile";
import { Icon } from "./ui/Icon";

export function PlanScreen() {
  const stored = useStored();
  const today = useToday();
  if (stored === "loading" || !today) return <div className="screen" aria-busy="true"><div className="skeleton" style={{ height: 420 }} /></div>;
  if (!stored) return <NeedsProfile title="Plan" />;
  const { plan } = stored;
  return (
    <div className="screen">
      <header className="top">
        <p className="eyebrow">This week</p>
      </header>
      <h1 className="h-display">Plan</h1>
      <PlanWeek plan={plan} today={weekdayOf(today)} linked />
      <PlanNotes notes={plan.notes} />
      <p className="note">
        <Icon name="calendar" size={18} />
        Moving sessions, handling a missed day and planning around your timetable arrive in milestone 6.
      </p>
    </div>
  );
}
