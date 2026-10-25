# RestTimer

The between-sets countdown: a large `ProgressRing` with the time scaled to the ring (28% of `size`: `stat-xl` at the default 240px), plus −15s / +15s / Skip.

Show it as a full-screen overlay or a bottom sheet on `surface-raised` with `shadow-float`. It should be readable at arm's length on the gym floor. When it reaches zero, give a short haptic and sound rather than a flashing animation.

**Consumer provides:** `total` (seconds), optional `seconds` (start value), `label`, `onSkip`. Ticking down is the app's job; the component holds the value.
