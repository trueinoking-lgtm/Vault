# Impact App Reactive Seeded Demo Verification

**Date:** 2026-07-07
**Commit:** `impact: add reactive seeded demo experience`

---

## What Was Fixed

### Empty Pages Before

| Page | Before | After |
|---|---|---|
| `/impact` (Overview) | Inline `SEEDED` object with 1 school data | Aggregated from 3 schools: 3 cards, weak topics grid, recent assessments, interventions |
| `/impact/schools` | Empty shell ("No schools yet") | 3 school cards with name, district, type, classes, learners, pass rate, weak topics, at-risk |
| `/impact/classes` | Empty shell ("No classes yet") | 6 class cards with school name, teacher, learner count, pass rate, weak topics, at-risk, latest assessment |
| `/impact/assessments` | Empty shell ("No assessments yet") | 6 assessment cards with school, class, subject, date, learners, questions, pass rate, weak topics |
| `/impact/school-dashboard` | "Select a school" with no data | School selector dropdown, defaults to Pilot School, shows full dashboard |
| `/impact/ministry-demo` | Zeroed-out stats ("Ministry Demo Dashboard") | Client-side redirect to `/impact`. Nav link removed. |

### Seeded Data Model

| Entity | Count | Details |
|---|---|---|
| Schools | 3 | Pilot School, Mbare Community High, Chitungwiza Learning Centre |
| Classes | 6 | Form 1A, 1B (Pilot); Form 1A, 2A (Mbare); Form 1C, 2B (Chitungwiza) |
| Learners | 180 | 30 per class across 6 classes |
| Subjects | 3 | Mathematics, English, Combined Science |
| Topics | 13 | Fractions, Ratios, Percentages, Graphs, Word Problems, Comprehension, Grammar, Summary Writing, Vocabulary, Cells, Energy, Matter, Forces |
| Assessments | 6 | Term 1 Diagnostic Test, Fractions & Ratios Quiz, Comprehension Diagnostic, Grammar Check, Topic Test, Practical Readiness Check |
| Assessment Questions | 39 | Distributed across 6 assessments |
| Interventions | 8 | Varying severity (critical → medium), statuses (in_progress, pending, completed) |
| Mark entries | 0 (on-demand from analytics) | Generated via `getSeededAssessmentAnalytics()` |

### Architecture

- **Single source of truth:** `src/lib/impact/demo-data.ts` — 30KB module with all seeded data and helper functions
- **Hook-level fallback:** `src/lib/hooks/use-impact.ts` — all 20+ query hooks wrapped with `withFallback()` that catches API errors and returns seeded data
- **No page changes needed for fallback logic** — pages just call hooks, hooks handle the fallback transparently
- **Per-school dashboards** in `SCHOOL_DASHBOARDS` record
- **Per-assessment analytics** generated via `getSeededAssessmentAnalytics()`

### Visual Upgrades

| Change | Details |
|---|---|
| Overview page | Metric cards (6-column grid), weak topics with progress bars, recent assessments, interventions in progress, "Demo data" badge |
| Schools grid | Premium cards with accent bars, stats grid, support status badges, "View dashboard" CTA |
| Classes grid | Accent bars per performance tier, latest assessment metadata, school dashboard link |
| Assessments grid | Status pills, detailed stats breakdown, school/class context |
| School Dashboard | School selector dropdown, consistent dark mode, premium metric cards |
| Landing scene | Fixed/sticky WebGL canvas visible across full page, particles reduced 4000→2500, larger particles (less grainy) |
| Landing overlay | Semi-transparent `bg-[#050814]/60` with subtle backdrop blur so fixed scene shows through |

### Navigation

- "Ministry Demo" removed from top navigation bar
- `/impact/ministry-demo` redirects (client-side) to `/impact`

---

## Verification Results (live, HTTPS)

| Check | Result |
|---|---|
| `/impact-intelligence` | ✅ 200 |
| `/impact` | ✅ 200 |
| `/impact/schools` | ✅ 200 |
| `/impact/classes` | ✅ 200 |
| `/impact/assessments` | ✅ 200 |
| `/impact/school-dashboard?school=school-pilot` | ✅ 200 |
| `/impact/ministry-demo` | ✅ 200 (client-side redirect to /impact) |
| `/favicon.svg` | ✅ 200 |
| All static assets (JS/CSS/woff2) | ✅ 0 failures |
| HMR/dev artifacts | ✅ 0 occurrences |
| Font loading errors | ✅ 0 (Troika built-in font) |
| Production build | ✅ Passes cleanly |

---

## Known Limitations

1. **Client-side rendering:** All Impact pages are `'use client'` components. Initial SSR shows loading spinners; real data populates after JS hydration. Acceptable for a demo/pre-pilot experience.
2. **Client-side redirect for ministry-demo:** Not an HTTP 301/302; uses `router.replace` in the browser. The server sends a 200 with the redirect page. Fine for real users.
3. **Seeded analytics are deterministic but approximate:** `getSeededAssessmentAnalytics` uses some randomization for learner scores, so values vary slightly per page load.
4. **Seeded ID-based matching:** The fallback identifies seeded data by checking if school IDs match known seeded IDs (`school-pilot`, etc.). If the backend ever returns data with different IDs, it will correctly switch to live data.
5. **No backend:** The FastAPI backend on port 5055 is intentionally offline. `/api/config` will 502 on internal app pages (not landing).
6. **Assessment detail pages** (`/impact/assessments/[id]`, `/impact/assessments/[id]/report`) and school report pages (`/impact/schools/[id]/report`) don't have seeded fallbacks yet — they'll show loading or error states.

---

## Working Tree

```
Changes to be committed:
  new file:   frontend/docs/checkpoints/impact_app_reactive_seeded_demo.md
  new file:   frontend/src/lib/impact/demo-data.ts
  modified:   frontend/src/lib/hooks/use-impact.ts
  modified:   frontend/src/app/(impact)/impact/layout.tsx
  modified:   frontend/src/app/(impact)/impact/page.tsx
  modified:   frontend/src/app/(impact)/impact/schools/page.tsx
  modified:   frontend/src/app/(impact)/impact/classes/page.tsx
  modified:   frontend/src/app/(impact)/impact/assessments/page.tsx
  modified:   frontend/src/app/(impact)/impact/school-dashboard/page.tsx
  modified:   frontend/src/app/(impact)/impact/ministry-demo/page.tsx
  modified:   frontend/src/components/landing/ImpactLandingPage.tsx
  modified:   frontend/src/components/landing/ImpactHero.tsx
  modified:   frontend/src/components/landing/HeroScene.tsx
  modified:   frontend/src/lib/landing/impact-scene-config.ts
```
