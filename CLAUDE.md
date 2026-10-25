# PressUp

PressUp is a fitness app that works as an adaptive coach: the training plan adapts to the user's time, energy, recovery and week, instead of expecting them to follow a rigid programme. Taglines: "Fitness that fits real life." and "Less pressure. More progress." First audience: students and young adults.

This repository holds the brand and design system (`design/`) and the mobile-first Next.js web app (`web/`). `ROADMAP.md` lists the build milestones and the decisions behind them; keep it current as milestones land.

## Where things are

- `ROADMAP.md`: the ten build milestones, what each one ships, decisions and open questions.
- `web/`: **the app.** Next.js 16 (App Router, TypeScript, Cache Components on), plain CSS on the design-system tokens. Deployed to Vercel with Root Directory `web`.
  - Next 16 has breaking changes from older versions. Read the guide in `web/node_modules/next/dist/docs/` before using an API you haven't checked (see `web/AGENTS.md`).
  - `app/styles/tokens.css`: copy of the design-system tokens, with the font stacks pointed at the `next/font` variables. `app/styles/components.css`: port of the design system's `bundle.css`. Keep both in step with `design/brand/design-system/`.
  - `app/globals.css`: app shell (a 480px phone column, the fixed tab bar, sheets) and screen layout classes.
  - `components/ui/`: the design-system components as typed React modules (`Icon.tsx`, `primitives.tsx`). `components/TabBar.tsx` is the five-section nav: Today, Plan, Progress, Exercises, Profile.
  - `lib/training.ts`: training types (`Session`, `Prescription` with a `role` of main, secondary or accessory) and `estimateMinutes`. `lib/sample-plan.ts`: the sample four-day week used until onboarding exists.
  - User data lives on the device until milestone 8, so screens that read it are client components. `lib/use-today.ts` reads the date on the client; with Cache Components, never read `new Date()` during prerender.
- `design/`: brand source and design system.
  - `design/assets/`: the original material from the brand owner. Six poster PNGs (`IMG_2195`–`IMG_2200`) and `Group-PDF-Export.pdf` (the logo: page 1 wordmark, page 2 P mark; a 300 dpi raster inside a PDF, not vectors).
  - `design/brand/logo/`, `graphics/`, `imagery/`: working assets cut from the above (transparent logo PNGs in four inks, the stick-figure pattern, poster thumbnails and text-free photo crops).
  - `design/PressUp-Design-System.pdf`: the review PDF of the design system.
  - `design/brand/design-system/`: **the design system source.**
    - `README.md`: the brand book (voice, two registers, colour, type, devices, logo, layout, motion, icons, accessibility). Read it before designing or building anything.
    - `tokens.json`: every token (colours in `dark` and `light` themes, type styles, spacing, radius, shadow, stroke, opacity). The single source of truth.
    - `tokens.css`: CSS custom properties generated from `tokens.json`. Regenerate it if tokens change.
    - `components/bundle.js` / `bundle.css` / `index.d.ts`: 16 React 18 components on `window.PressUp`. Plain JS, no build step.
    - `components/<Name>/README.md` + `preview.html`: usage guidelines and a live preview for each. `local.html` is the same preview wired to run from disk. `TodayScreen`, `WorkoutScreen`, `WebHero` are example screens; `Cover` is the design-system page's cover art.
    - `assets/Logos|Graphics|Imagery/`: copies of the brand assets with usage READMEs.
    - `gallery.html`: every component and example on one page, with a dark/light switch.
    - `review.html`: print source for the review PDF. To regenerate, serve the folder on port 4174, then from `design/` run: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer --virtual-time-budget=20000 --print-to-pdf=PressUp-Design-System.pdf http://localhost:4174/review.html`.
    - `design-system.json`: the index used by the claude.ai "Design System" artifact (see below).
    - `previous-account-blob-ids.json`: asset IDs from the original claude.ai account. Kept for reference only.

`.claude/launch.json` has two previews: `web` (the Next dev server) and `design-system` (serves the folder; open `/gallery.html`).

## Decisions already made (don't re-ask)

- Product: an adaptive fitness coach (see `ROADMAP.md`). Workouts come from a rules-based engine; AI only interprets requests and explains decisions, and every result is validated by the rules.
- Safety: reported pain always leads to alternatives or rest and advice to see a professional. Never encourage training through it, and never double up after a missed session.
- Two registers: loud for brand moments (website, onboarding, PRs), calm for working screens (logging, timers).
- Theme: dark-first with a full light theme. The app ships dark; a light toggle comes in milestone 10. The website is dark only.
- Fonts: free Google Fonts matched to the posters, loaded with `next/font`: Anton (display), Barlow Condensed (numbers, labels, buttons), Jost (body).
- Colour: press-yellow `#F5EC61` (sampled from the logo) and black. There is no olive or orange (removed at review, 2026-10-25). On light grounds yellow is a fill: `accent` text is ink on a press-yellow fill (`accent-highlight`, `accent-soft`), and progress arcs stay yellow (`accent-line`) over a dark `ring-track`. Status colours are teal (success) and coral (danger), always paired with an icon or word.
- EchoHeadline is press-yellow in both themes, light included (the owner's choice at review). It's decorative there (about 1.2:1), so anything it says must also appear in readable text.
- ProgressRing and RestTimer centre text scales with the ring's size (`--pu-ring-size`); don't hard-code its font size.
- Name in running text is "PressUp"; PRESSUP appears only in the wordmark.
- The brand had no icons, so `Icon` is a small hand-drawn set (2px, round caps). The app adds `calendar`, `adapt`, `moon`, `bolt` and `chevron-left` in the same style. Lucide is the suggested fallback.
- All other text/background pairs are checked at 4.5:1 or better in both themes.

## Open items

- Ask the designer for a true vector logo (SVG/AI). The current logo files are high-res PNGs.
- Replace the photo crops (`photo-*.jpg`) with real shoots when available.
- Not yet designed: onboarding, progress charts, workout-complete/new-PR screen, programme detail, settings.
- Open questions for later milestones are listed in `ROADMAP.md`.

## The Design System artifact

The design system is published as a private "Design System" artifact in this account: https://claude.ai/artifact/ERFdDQ4gK4gbsDvCnGhYMJ. Its asset blob IDs are recorded in `design-system.json`.

To update it, read the live files first (people edit on the page), then publish only the changed `project/…` files. The published `README.md` and the `preview.html` files for ProgrammeCard, TodayScreen and WebHero use `/_blob/<id>` image URLs where the local copies use `assets/...` paths, so swap the paths in a staging copy before publishing. Never publish `tokens.css`, `gallery.html`, `review.html`, `local.html` files, `previous-account-blob-ids.json` or the image files. Send `components/index.d.ts` with contentType `text/plain`.
