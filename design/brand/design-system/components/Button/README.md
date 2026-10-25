# Button

The pill-shaped action control; round ends echo the logo's stroke caps.

- **primary**: `press-yellow` fill, `on-yellow` label. At most one per screen, for the thing the screen is for ("Start workout", "Log set", "Join programme").
- **secondary**: `line-strong` outline, `ink` label. Alternatives and adjustments ("Swap exercise", "−15s").
- **ghost**: `accent` text, no frame. Low-stakes exits ("Skip", "View all").
- Sizes: `sm` 36px (inline in rows), `md` 48px (default), `lg` 56px (the bottom call to action on a phone; pair with `block`).

Labels are verbs in the `label` style, uppercase, two words where possible. No exclamation marks.

**Consumer provides:** `children` (label), optional `icon` (an `Icon` name), `onClick`, and any native button attributes.
