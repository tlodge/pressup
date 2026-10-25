# StatTile

One number with its unit and label: volume, 1RM, streak, sessions.

The value is `stat` (Barlow Condensed, tabular figures); the unit sits beside it in `ink-muted`. `highlight` moves the tile onto `accent-soft` with the value in `accent`. Use it for the one number this screen is about, such as a new PR. A `delta` starting with "-" shows a down arrow in `danger`; otherwise an up arrow in `success`. Override with `trend`.

**Consumer provides:** `label`, `value` (pre-formatted string), optional `unit`, `delta`, `trend`, `highlight`. Lay tiles out in a grid; the tile fills its track.
