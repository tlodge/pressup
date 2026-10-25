import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = { title: "Set up your plan" };

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
