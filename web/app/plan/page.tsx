import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Plan" };

export default function PlanPage() {
  return (
    <ComingSoon
      title="Plan"
      milestone={6}
      intro="Your week at a glance, and a plan that bends when life gets in the way."
      points={[
        "See every session this week and how the programme fits together.",
        "Move a session to another day that suits your recovery.",
        "Missed one? Move it, fold the key lifts into a later session, or skip it. No doubling up.",
        "Add the week's commitments and get suggested training slots.",
        "Accept or reject every change PressUp suggests.",
      ]}
    />
  );
}
