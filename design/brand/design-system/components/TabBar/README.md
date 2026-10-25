# TabBar

The app's floating bottom navigation: Today, Plans, Log, Progress, Me. "Log" is the primary action and always sits in a `press-yellow` pill. The active tab gets `accent` with an `accent-soft` pill behind its icon.

Float it `space-4` above the bottom safe area, with `space-4` side gutters, on `surface-raised` with `radius-lg` and `shadow-float`. Hide it during an active workout, where the workout's own controls take over.

**Consumer provides:** optional `items` (`[{ id, label, icon, primary }]`), `active`, `onChange`.
