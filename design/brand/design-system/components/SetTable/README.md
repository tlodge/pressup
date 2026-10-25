# SetTable

The set logger: set number, previous performance, weight, reps and a done toggle.

The first unfinished set is the current one, shown on `accent-soft` with its number in `accent`. Done sets move to `success-soft` with a filled `success` tick. Previous values sit in `body-sm` and `ink-muted` so today's numbers lead. Tapping a weight or rep cell should open a `Stepper` in a sheet.

**Consumer provides:** `sets` (`[{ prev, weight, reps, done }]`), optional `unit` (default "kg"), `onChange`.
