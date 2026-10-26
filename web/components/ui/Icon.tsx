/* Icons: 24px grid, 2px stroke, round caps and joins, like the logo's line.
   Same set as the design system's Icon, plus calendar and adapt for the app's navigation. */
const PATHS = {
  home: ["M4 11.5 12 5l8 6.5", "M6.5 10v9h11v-9"],
  list: ["M9 7h11", "M9 12h11", "M9 17h11", "M4.5 7h.01", "M4.5 12h.01", "M4.5 17h.01"],
  plus: ["M12 5v14", "M5 12h14"],
  minus: ["M5 12h14"],
  chart: ["M4 19h16", "M7 15v-3", "M12 15V8", "M17 15v-6"],
  user: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M4.5 20c1.2-3.5 4-5 7.5-5s6.3 1.5 7.5 5"],
  play: ["M8 5.5v13l10-6.5-10-6.5Z"],
  pause: ["M9 6v12", "M15 6v12"],
  check: ["M5 12.5 10 17l9-10"],
  x: ["M6 6l12 12", "M18 6 6 18"],
  timer: ["M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z", "M12 9v4l2.5 2", "M10 2.5h4"],
  "chevron-right": ["M9 5l7 7-7 7"],
  "chevron-left": ["M15 5l-7 7 7 7"],
  "arrow-up": ["M12 19V5", "M6 11l6-6 6 6"],
  "arrow-down": ["M12 5v14", "M6 13l6 6 6-6"],
  flame: ["M12 21c3.9 0 6.5-2.6 6.5-6.2 0-3.6-2.6-5.6-3.6-8.8-1.6 1.6-2.2 3.2-2.4 4.5C11.6 8.3 9.9 6 8.4 3.5 6.8 6.6 5.5 9.6 5.5 13c0 4.9 2.6 8 6.5 8Z"],
  dumbbell: ["M3 12h2", "M19 12h2", "M8 12h8", "M5 8.5v7", "M8 7v10", "M16 7v10", "M19 8.5v7"],
  calendar: ["M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z", "M4 10.5h16", "M8.5 3.5v4", "M15.5 3.5v4"],
  adapt: ["M4.5 11a7.5 7.5 0 0 1 13-4.2L19.5 9", "M19.5 4.5V9H15", "M19.5 13a7.5 7.5 0 0 1-13 4.2L4.5 15", "M4.5 19.5V15H9"],
  moon: ["M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z"],
  bolt: ["M13 3 5.5 13.5H12L11 21l7.5-10.5H12L13 3Z"],
  heart: ["M12 20s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.3C19.5 15.4 12 20 12 20Z"],
  ban: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z", "M5.6 5.6l12.8 12.8"],
  search: ["M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z", "M16 16l5 5"],
  swap: ["M7 4 3.5 7.5 7 11", "M3.5 7.5h13", "M17 13l3.5 3.5L17 20", "M20.5 16.5h-13"],
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 24, title, className }: { name: IconName; size?: number; title?: string; className?: string }) {
  return (
    <svg
      className={["pu-icon", className].filter(Boolean).join(" ")}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name].map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
