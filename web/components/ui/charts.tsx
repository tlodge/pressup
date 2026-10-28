"use client";

import { useId, useState, type ReactNode } from "react";

/* Small single-series charts in the calm register: press-yellow marks, hairline recessive axes, a label on the latest
   value only, a tooltip on hover and keyboard focus, and a table view so no value depends on hovering. */

const W = 320;
const PAD = { top: 14, right: 8, bottom: 22, left: 30 };

type Tip = { x: number; y: number; value: string; label: string } | null;

/** Clean tick values from 0 to at least `max`. */
function ticks(max: number): number[] {
  if (max <= 0) return [0, 1];
  const raw = max / 3;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, i) => Math.round(i * step * 100) / 100);
}

function Tooltip({ tip }: { tip: Tip }) {
  if (!tip) return null;
  return (
    <div className="chart-tip" style={{ left: `${(tip.x / W) * 100}%`, top: tip.y }} role="status">
      <strong>{tip.value}</strong>
      <span>{tip.label}</span>
    </div>
  );
}

export function ChartTable({ caption, head, rows }: { caption: string; head: [string, string]; rows: [string, string][] }) {
  return (
    <details className="chart-table">
      <summary>Show as a table</summary>
      <table>
        <caption className="sr-only">{caption}</caption>
        <thead><tr><th scope="col">{head[0]}</th><th scope="col">{head[1]}</th></tr></thead>
        <tbody>{rows.map(([a, b]) => <tr key={a}><th scope="row">{a}</th><td>{b}</td></tr>)}</tbody>
      </table>
    </details>
  );
}

/** Columns over time, with an optional target per column drawn as a short grey rule. */
export function ColumnChart({ data, height = 150, format, title, legend }: {
  data: { label: string; value: number; target?: number; tip: string }[];
  height?: number;
  format: (v: number) => string;
  title: string;
  legend?: ReactNode;
}) {
  const [tip, setTip] = useState<Tip>(null);
  const max = Math.max(1, ...data.map((d) => Math.max(d.value, d.target ?? 0)));
  const ys = ticks(max);
  const top = ys[ys.length - 1];
  const plotH = height - PAD.top - PAD.bottom;
  const band = (W - PAD.left - PAD.right) / data.length;
  const bar = Math.min(16, band - 8);
  const y = (v: number) => PAD.top + plotH - (v / top) * plotH;
  const last = data.length - 1;
  return (
    <figure className="chart">
      {legend}
      <div className="chart-plot">
        <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={title} onPointerLeave={() => setTip(null)}>
          {ys.map((t) => (
            <g key={t}>
              <line className="chart-grid" x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} />
              <text className="chart-tick" x={PAD.left - 6} y={y(t) + 3} textAnchor="end">{format(t)}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = PAD.left + band * i + band / 2;
            const h = Math.max(0, y(0) - y(d.value));
            const r = Math.min(4, h / 2, bar / 2);
            const x0 = cx - bar / 2;
            const show = () => setTip({ x: cx, y: Math.min(y(d.value), d.target !== undefined ? y(d.target) : Infinity) - 6, value: format(d.value), label: d.tip });
            return (
              <g key={d.label} className="chart-col" tabIndex={0} aria-label={d.tip} onPointerEnter={show} onFocus={show} onBlur={() => setTip(null)}>
                <rect className="chart-hit" x={cx - band / 2} y={PAD.top} width={band} height={plotH} />
                {h > 0 ? <path className="chart-bar" d={`M${x0},${y(0)} V${y(d.value) + r} Q${x0},${y(d.value)} ${x0 + r},${y(d.value)} H${x0 + bar - r} Q${x0 + bar},${y(d.value)} ${x0 + bar},${y(d.value) + r} V${y(0)} Z`} /> : null}
                {d.target !== undefined ? <line className="chart-target" x1={cx - bar / 2 - 3} x2={cx + bar / 2 + 3} y1={y(d.target)} y2={y(d.target)} /> : null}
                {i === last && d.value > 0 ? <text className="chart-value" x={cx} y={y(d.value) - 5} textAnchor="middle">{format(d.value)}</text> : null}
                {i === 0 || i === last ? <text className="chart-tick" x={cx} y={height - 6} textAnchor="middle">{d.label}</text> : null}
              </g>
            );
          })}
          <line className="chart-axis" x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} />
        </svg>
        <Tooltip tip={tip} />
      </div>
    </figure>
  );
}

/** One measure over time as a 2px line, with the latest value labelled at its end. */
export function LineChart({ data, height = 120, format, title }: {
  data: { label: string; value: number; tip: string }[];
  height?: number;
  format: (v: number) => string;
  title: string;
}) {
  const [tip, setTip] = useState<Tip>(null);
  const id = useId();
  const values = data.map((d) => d.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  // A flat or narrow range gets some headroom so small changes don't look dramatic: trends over noise.
  const span = Math.max(hi - lo, hi * 0.1, 1);
  const min = Math.max(0, lo - span * 0.25);
  const max = hi + span * 0.25;
  const plotH = height - PAD.top - PAD.bottom;
  const right = 44; // room for the end label
  const x = (i: number) => PAD.left + (data.length === 1 ? 0 : (i / (data.length - 1)) * (W - PAD.left - right));
  const y = (v: number) => PAD.top + plotH - ((v - min) / (max - min)) * plotH;
  const path = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.value)}`).join(" ");
  const last = data.length - 1;
  return (
    <figure className="chart">
      <div className="chart-plot">
        <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={title} onPointerLeave={() => setTip(null)}>
          {[min, max].map((t, i) => (
            <g key={i}>
              <line className="chart-grid" x1={PAD.left} x2={W - right} y1={y(t)} y2={y(t)} />
              <text className="chart-tick" x={PAD.left - 6} y={y(t) + 3} textAnchor="end">{Math.round(t)}</text>
            </g>
          ))}
          <path className="chart-line" d={path} />
          {data.map((d, i) => {
            const show = () => setTip({ x: x(i), y: y(d.value) - 10, value: format(d.value), label: d.tip });
            return (
              <g key={`${id}-${i}`} tabIndex={0} aria-label={`${d.label}: ${format(d.value)}`} onPointerEnter={show} onFocus={show} onBlur={() => setTip(null)} className="chart-pt">
                <circle className="chart-hit" cx={x(i)} cy={y(d.value)} r={14} />
                <circle className={i === last ? "chart-dot" : "chart-dot chart-dot-quiet"} cx={x(i)} cy={y(d.value)} r={i === last ? 4.5 : 3} />
              </g>
            );
          })}
          <text className="chart-value" x={x(last) + 8} y={y(data[last].value) + 4}>{format(data[last].value)}</text>
          <text className="chart-tick" x={PAD.left} y={height - 6}>{data[0].label}</text>
          {last > 0 ? <text className="chart-tick" x={x(last)} y={height - 6} textAnchor="middle">{data[last].label}</text> : null}
        </svg>
        <Tooltip tip={tip} />
      </div>
    </figure>
  );
}
