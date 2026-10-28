# PressUp build roadmap

The app is a mobile-first Next.js web app in `web/`, built on the design system in `design/brand/design-system/`. Each milestone ends in something you can deploy to Vercel and share.

The core idea from the brief: **your plan adapts to your life, not the other way round.** The workout engine is rules-based and testable. AI arrives later, and only to interpret requests and explain decisions, never to invent workouts.

## Status

- **Milestone 1 (Foundation):** done (`main`, 638b178).
- **Milestone 2 (Onboarding and first plan):** done (`main`, b67f6c2).
- **Milestone 3 (Exercise library):** done (`main`, a48ac90). 52 exercises with how-to steps, coaching cues and easier/harder variations; the Exercises tab with search, body-area filters, a "suits my kit and limits" filter and favourites; detail pages with favourite and leave-out toggles (both rebuild the plan) and personalised swaps; and swapping any exercise in a planned session for one that trains the same thing. Instructions are drafted and need review by a qualified coach; demonstration videos are placeholders. Swaps are kept through plan rebuilds from milestone 6.
- **Milestone 4 (Adaptive daily workouts):** done (`main`, 729405e). ADAPT MY WORKOUT opens a four-question check-in (time, energy, sleep, soreness and pain) and seven modes: shorter, quick, low energy, home (pick your kit), no equipment, back after time away, and rest. The rules engine shows the adapted session with a reason for every change before you accept it; Today and the workout screen then show it, with a way back to the plan. Pain swaps only to the same movement, sharp or unexplained pain means rest with advice to see a GP or physio, and a rest day never adds work to another day. On a planned rest day, a light quick workout is built from the session easiest on the legs. Adaptations last for the day; logging what was done arrives in milestone 5.
- **Milestone 5 (Workout logging and progression):** done (`main`, a0bbde5). Start workout opens the in-workout screen: one exercise at a time with its target and why, last time's sets, weight and rep steppers, a rest timer with a buzz and beep at zero, how hard the last set was, and a finish sheet with session effort and notes. Progress survives a reload, and a workout can be resumed or discarded. Targets follow fixed rules (see `lib/engine/progress.ts`), and the summary shows new bests and next time's targets. Runs log minutes, effort and notes. Today shows a finished session as done, and the week ring counts logged workouts. Weights are in kilograms only for now.
- **Milestone 6 (Weekly scheduling):** done (`main`). The Plan tab shows this week day by day with done, missed and skipped sessions. Drag a session by its handle to another day (or tap the handle for a list of days); unsuitable days are greyed out with the reason. A missed session can move to a free day, have its main lifts folded into a later session (trimmed so it doesn't get longer), or be skipped. "Plan around my week" takes busy and short days and suggests a new layout, skipping the least important sessions instead of doubling up. Every change shows what moves and why before you accept it, and the week can be put back to the plan. Changes last for the current week; the plan itself is untouched. Today and the week ring follow this week's layout. Swaps now survive plan rebuilds. Changing your profile mid-week resets that week's changes.

## Milestones

| # | Milestone | What you can show after it |
|---|---|---|
| 1 | **Foundation** | The app shell on a phone: brand, fonts, five tabs (Today, Plan, Progress, Exercises, Profile), and a Today screen with a sample planned workout, weekly progress and the ADAPT MY WORKOUT button. Installable to the home screen. |
| 2 | **Onboarding and first plan** | A short onboarding flow (goals, experience, days, time, location, equipment, likes and limits). Its answers generate a weekly programme with recovery-aware scheduling (no hard legs before a hard run). Preferences are editable from Profile. Data is stored on the device. |
| 3 | **Exercise library** | A structured exercise database (muscles, equipment, movement pattern, easier and harder variations, substitutes) and the Exercises tab: search, filter, favourite, exclude. Substitutions keep the movement's training purpose. |
| 4 | **Adaptive daily workouts** | The daily check-in (time, energy, sleep, how you feel) and ADAPT MY WORKOUT modes (quick, low energy, home, no equipment, shortened, return to training, rest). The engine trims accessories before main lifts, keeps rest realistic, respects equipment, and never pushes through pain. Every change shows a short "why". |
| 5 | **Workout logging and progression** | The in-workout screen: set table, steppers, rest timer, effort (RPE) and notes. Progressive overload follows fixed rules: add weight or reps only after the target is met at a sensible effort; hold or reduce after a struggle. |
| 6 | **Weekly scheduling** | The Plan tab: the week at a glance, drag a session to another suitable day, and options for a missed session (move it, fold key lifts into a later session, or skip). Enter the week's commitments and get suggested training slots. You accept or reject every change. |
| 7 | **Progress dashboard** | Strength trends, PRs, history, consistency, running distance and pace, calisthenics milestones and goal progress. Trends over noise, and no focus on body weight. |
| 8 | **Accounts and sync** | Sign-in and a hosted database so data follows the user across devices. Privacy settings in Profile. |
| 9 | **AI coach** | Natural-language requests ("20 minutes, at home, upper body", "I missed legs yesterday") parsed into engine calls, with plain-English explanations. The engine validates every result. |
| 10 | **Depth and polish** | Running plans (5K, 10K, half), calisthenics skill progressions, light theme toggle, accessibility audit, offline support. |

## Decisions so far

- **Stack:** Next.js (App Router, TypeScript), plain CSS on the design-system tokens, no UI framework. Deployed on Vercel.
- **Theme:** dark by default, as the brand book says. A light theme exists in the tokens and gets a toggle in milestone 10.
- **Data until milestone 8:** stored on the device (localStorage), so early builds need no backend or sign-in.
- **Copy:** the brief's taglines, "Fitness that fits real life." and "Less pressure. More progress.", lead in the app. "Challenge • Motivate • Succeed" stays the brand's poster line.
- **Safety:** reported pain always leads to alternatives or rest, plus advice to see a professional. Nothing in the app encourages training through it.

## Open questions (needed before the milestone shown)

- Exercise demonstrations: licensed video, commissioned illustrations or photos? (milestone 3 uses text and placeholders)
- Who reviews the exercise instructions? They are drafted from standard coaching practice; set `GUIDE_REVIEWED` in `web/lib/exercise-guide.ts` once a qualified coach has checked them.
- Hosting for accounts and data, for example Supabase or Neon with Auth.js (milestone 8)
- Which AI provider and budget (milestone 9)
