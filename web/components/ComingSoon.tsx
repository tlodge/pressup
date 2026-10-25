import Image from "next/image";
import { Badge } from "./ui/primitives";
import { Icon } from "./ui/Icon";

/** A designed placeholder for a section that lands in a later milestone: what it will do, and when. */
export function ComingSoon({ title, intro, milestone, points }: { title: string; intro: string; milestone: number; points: string[] }) {
  return (
    <div className="screen">
      <header className="top">
        <p className="eyebrow">{title}</p>
        <Badge>Milestone {milestone}</Badge>
      </header>
      <section className="soon">
        <h1 className="h-display">{title}</h1>
        <p className="body-copy muted">{intro}</p>
        <ul className="soon-list card">
          {points.map((p) => (
            <li key={p}>
              <Icon name="check" />
              {p}
            </li>
          ))}
        </ul>
        <Image className="figures" src="/brand/pressup-figures-yellow.png" alt="" width={240} height={40} />
      </section>
    </div>
  );
}
