# ProgressRing

The logo's arc, made functional. A round-capped arc fills clockwise from 12 o'clock, and a small ring rides on its leading end, like the dot at the end of the logo's arc.

Use it for weekly goal, programme progress and workout completion. The arc is `accent-line` (press-yellow in both themes), the track is `ring-track`. Keep the centre to a value and a one-word label. The centre text scales with `size` (value at 20%, label at 8.5%, never below 9px), so it stays inside the ring at any size; don't override its font size.

**Consumer provides:** `value` (0–1), optional `size` (px), `stroke` (px, default 10, the `stroke-ring` token), `label`, `children` (replaces the % value), `ariaLabel`.
