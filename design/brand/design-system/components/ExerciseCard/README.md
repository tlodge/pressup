# ExerciseCard

One exercise in a workout or programme list. The order number is set in Anton in `accent`, so the list reads like a plan.

The detail line is "sets × reps · load", for example "4 × 8 · 82.5 kg". With a `status` the trailing chevron becomes a `Badge`. Long names truncate with an ellipsis rather than wrapping.

**Consumer provides:** `index`, `name`, `detail`, optional `muscles` (array), `status` (`done` | `pr` | `missed`), `onClick` (makes the whole card a button).
