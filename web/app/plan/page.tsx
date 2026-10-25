import type { Metadata } from "next";
import { PlanScreen } from "@/components/PlanScreen";

export const metadata: Metadata = { title: "Plan" };

export default function PlanPage() {
  return <PlanScreen />;
}
