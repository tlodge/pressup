import type { Metadata } from "next";
import { ProgressScreen } from "@/components/ProgressScreen";

export const metadata: Metadata = { title: "Progress" };

export default function ProgressPage() {
  // Progress is worked out from the logs on this device, so it renders on the client.
  return <ProgressScreen />;
}
