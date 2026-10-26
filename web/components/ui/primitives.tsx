import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

type ButtonLook = { variant?: "primary" | "secondary" | "ghost"; size?: "sm" | "md" | "lg"; block?: boolean; icon?: IconName };

function buttonClass({ variant = "primary", size = "md", block }: ButtonLook, extra?: string) {
  return cx("pu-btn", `pu-btn-${variant}`, size !== "md" && `pu-btn-${size}`, block && "pu-btn-block", extra);
}

/** The pill-shaped action control. Labels are verbs: "Start workout", "Log set". */
export function Button({ variant, size, block, icon, className, children, ...rest }: ButtonLook & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...rest} className={buttonClass({ variant, size, block }, className)}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  );
}

/** A Button that navigates. */
export function ButtonLink({ href, variant, size, block, icon, className, children }: ButtonLook & { href: string; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={buttonClass({ variant, size, block }, className)}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </Link>
  );
}

const BADGE_ICON: Partial<Record<string, IconName>> = { done: "check", missed: "x", pr: "flame" };

/** A small status pill. Every tone carries an icon or a word, never colour alone. */
export function Badge({ tone = "neutral", children }: { tone?: "pr" | "done" | "missed" | "neutral"; children: ReactNode }) {
  const icon = BADGE_ICON[tone];
  return (
    <span className={`pu-badge pu-badge-${tone}`}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </span>
  );
}

export function Chip({ selected, onClick, children }: { selected?: boolean; onClick?: () => void; children: ReactNode }) {
  if (!onClick && selected === undefined) return <span className="pu-chip pu-chip-static">{children}</span>;
  return (
    <button type="button" className="pu-chip" aria-pressed={selected ? "true" : "false"} onClick={onClick}>
      {children}
    </button>
  );
}

/** One number with its unit and label. */
export function StatTile({ label, value, unit, delta, trend, highlight }: { label: string; value: string | number; unit?: string; delta?: string; trend?: "up" | "down"; highlight?: boolean }) {
  const dir = trend || (delta?.startsWith("-") ? "down" : "up");
  return (
    <div className={cx("pu-stat", highlight && "pu-stat-hl")}>
      <span className="pu-stat-label">{label}</span>
      <span className="pu-stat-value">
        {value}
        {unit ? <span className="pu-stat-unit">{unit}</span> : null}
      </span>
      {delta ? (
        <span className={`pu-stat-delta ${dir}`}>
          <Icon name={dir === "down" ? "arrow-down" : "arrow-up"} />
          {delta}
        </span>
      ) : null}
    </div>
  );
}

/** The logo's arc, made functional. Centre text scales with size so it stays inside the ring. */
export function ProgressRing({ value, size = 120, stroke = 10, label, ariaLabel, className, children }: { value: number; size?: number; stroke?: number; label?: string; ariaLabel?: string; className?: string; children?: ReactNode }) {
  const v = Math.max(0, Math.min(1, value || 0));
  const r = (size - stroke) / 2 - stroke * 0.6;
  const c = 2 * Math.PI * r;
  const a = -Math.PI / 2 + v * 2 * Math.PI;
  const hx = size / 2 + r * Math.cos(a);
  const hy = size / 2 + r * Math.sin(a);
  return (
    <div className={cx("pu-ring", className)} style={{ ["--pu-ring-size" as string]: `${size}px` }} role="img" aria-label={ariaLabel || `${Math.round(v * 100)}% complete`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="pu-ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        {v > 0 ? (
          <circle className="pu-ring-arc" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - v)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        ) : null}
        {v > 0 && v < 1 ? <circle className="pu-ring-head" cx={hx} cy={hy} r={stroke * 0.9} strokeWidth={stroke * 0.55} /> : null}
      </svg>
      <div className="pu-ring-center" aria-hidden="true">
        {children ?? <span className="pu-ring-value">{Math.round(v * 100)}%</span>}
        {label ? <span className="pu-ring-label">{label}</span> : null}
      </div>
    </div>
  );
}

/** The [ DISCIPLINE ] device: one value word in square brackets. */
export function BracketTitle({ size = "m", as: Tag = "h2", children }: { size?: "s" | "m" | "l"; as?: "h1" | "h2" | "h3" | "p"; children: ReactNode }) {
  return (
    <Tag className={`pu-bracket pu-bracket-${size}`}>
      <span className="pu-bracket-mark" aria-hidden="true">[</span>
      <span>{children}</span>
      <span className="pu-bracket-mark" aria-hidden="true">]</span>
    </Tag>
  );
}

/** Words separated by the logo's ring dot. */
export function Tagline({ words, size }: { words: string[]; size?: string }) {
  return (
    <p className="pu-tagline" style={size ? { fontSize: size } : undefined} aria-label={words.join(", ")}>
      {words.map((w, i) => (
        <span key={w} style={{ display: "contents" }}>
          {i ? <span className="pu-tagline-sep" aria-hidden="true" /> : null}
          <span>{w}</span>
        </span>
      ))}
    </p>
  );
}

/** One exercise in a workout or programme list. */
export function ExerciseCard({ index, name, detail, cue, muscles, status, action }: { index: number; name: string; detail?: string; cue?: string; muscles?: string[]; status?: "done" | "pr" | "missed"; action?: ReactNode }) {
  return (
    <div className="pu-ex">
      <span className="pu-ex-index" aria-hidden="true">{index < 10 ? `0${index}` : index}</span>
      <span className="pu-ex-body">
        <span className="pu-ex-name">{name}</span>
        {detail ? <span className="pu-ex-detail">{detail}</span> : null}
        {cue ? <span className="pu-ex-detail">{cue}</span> : null}
        {muscles?.length ? (
          <span className="pu-ex-tags">
            {muscles.map((m) => (
              <span key={m} className="pu-ex-tag">{m}</span>
            ))}
          </span>
        ) : null}
      </span>
      {status ? <Badge tone={status}>{status === "done" ? "Done" : status === "pr" ? "PR" : "Missed"}</Badge> : null}
      {action}
    </div>
  );
}
