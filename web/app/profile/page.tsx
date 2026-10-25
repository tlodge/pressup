import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <ComingSoon
      title="Profile"
      milestone={2}
      intro="Fitness that fits real life. Less pressure, more progress. Your goals and preferences shape everything PressUp suggests."
      points={[
        "Goals: build muscle, get stronger, run a 5K, master a pull-up, or a mix.",
        "Training days, time per session, location and equipment.",
        "Exercises you enjoy, ones you avoid, and any limitations.",
        "Change any of it later without starting again.",
      ]}
    />
  );
}
