import type { Metadata } from "next";
import { ExerciseLibrary } from "@/components/ExerciseLibrary";

export const metadata: Metadata = { title: "Exercises" };

export default function ExercisesPage() {
  return <ExerciseLibrary />;
}
