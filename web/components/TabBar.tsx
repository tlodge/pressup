"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStored } from "@/lib/store";
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
  const stored = useStored();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  if (pathname.startsWith("/onboarding")) return null; // setup is a focused flow with its own footer
  if (pathname.startsWith("/workout") && stored && stored !== "loading" && stored.active) return null; // nothing to distract mid-workout
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
