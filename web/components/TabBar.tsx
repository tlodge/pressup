"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "./ui/Icon";

const TABS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Today", icon: "home" },
  { href: "/plan", label: "Plan", icon: "calendar" },
  { href: "/progress", label: "Progress", icon: "chart" },
  { href: "/exercises", label: "Exercises", icon: "dumbbell" },
  { href: "/profile", label: "Profile", icon: "user" },
];

/** The floating bottom navigation: the app's five sections. */
export function TabBar() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav className="tabbar" aria-label="Main">
      <div className="pu-tabs">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className="pu-tab" aria-current={isActive(t.href) ? "page" : undefined}>
            <span className="pu-tab-icon">
              <Icon name={t.icon} />
            </span>
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
