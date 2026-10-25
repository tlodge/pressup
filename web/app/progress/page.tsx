import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  return (
    <ComingSoon
      title="Progress"
      milestone={7}
      intro="Meaningful trends over weeks and months, not a wall of numbers."
      points={[
        "Strength trends and personal records for your main lifts.",
        "Workout history and how consistent your weeks have been.",
        "Running distance and pace, and calisthenics milestones.",
        "Progress towards each of your goals.",
      ]}
    />
  );
}
