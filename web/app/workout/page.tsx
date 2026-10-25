import type { Metadata } from "next";
import { Suspense } from "react";
import { WorkoutPreview } from "@/components/WorkoutPreview";

export const metadata: Metadata = { title: "Workout" };

export default function WorkoutPage() {
  // The session id comes from the URL and the plan from this device, so the content renders on the client.
  return (
    <Suspense fallback={<div className="screen" aria-busy="true"><div className="skeleton" style={{ height: 420 }} /></div>}>
      <WorkoutPreview />
    </Suspense>
  );
}
