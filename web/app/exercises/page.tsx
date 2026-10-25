import type { Metadata } from "next";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Exercises" };

export default function ExercisesPage() {
  return (
    <ComingSoon
      title="Exercises"
      milestone={3}
      intro="A library of movements with clear instructions, and swaps that keep the point of the exercise."
      points={[
        "How to do each exercise, the muscles it trains and the kit it needs.",
        "Easier and harder variations, plus substitutes that serve the same purpose.",
        "Favourite the moves you like and hide the ones you can't or won't do.",
      ]}
    />
  );
}
