# ZimLearnGraph Phase B — Standalone Product Experience Checkpoint

**Date:** 2026-07-12
**Scope:** school-level product shell, evidence workflows, responsive/accessibility and browser verification
**Phase A base:** `fc34732 — fix: restore zimlearngraph demo integrity`
**Production build:** `-ylxJBFtoNEYr_2As8ATw`

## Outcome

ZimLearnGraph now has a dedicated product experience rather than appearing as a hidden Vault submodule.

**Product identity:** ZimLearnGraph — Assessment and learning intelligence for schools.

**Promise:** Turn teacher-marked assessments into evidence that helps schools identify learning gaps, support learners, and track interventions.

The redesign preserves the Phase A disclosure on every product route:

> Seeded multi-school demonstration data. No learner identities. Not verified pilot evidence.

## Canonical baseline preserved

| Measure | Value |
|---|---:|
| Schools | 3 |
| Classes | 6 |
| Learners / learners assessed | 180 |
| Assessments | 6 |
| Questions analysed | 39 |
| Mark data points | 1,166 |
| Average school pass rate | 57% |
| Topics needing attention | 5 |
| Learner-support signals | 39 |
| Interventions | 8 total / 7 active |

## Before / after findings

| Before Phase B | After Phase B |
|---|---|
| Impact pages used a narrow feature layout and felt subordinate to Vault. | Dedicated responsive ZimLearnGraph shell with no notebook, material or AI-provider navigation. |
| Product navigation omitted interventions/reports and used a Ministry-labelled demo route. | Seven purposeful destinations: Overview, Schools, Classes, Assessments, Interventions, Reports, Stakeholder Demo. |
| School overview was query-string driven and disconnected from the school card workflow. | Stable `/impact/schools/[id]` school overview with dashboard evidence and report actions. |
| No class overview route existed between class discovery and learners. | Stable `/impact/classes/[id]` overview with real Manage learners navigation. |
| Assessment workflow used mixed labels and made the evidence path harder to scan. | Explicit six-stage tab workflow: Overview, Questions and topics, Marks, Results, Support, Report. |
| Overview metrics existed but did not guide a complete task path. | Canonical eight-metric overview plus seven linked workflow steps. |
| No committed browser test harness covered responsive workflows. | Playwright desktop/tablet/mobile projects cover workflow links, navigation, tabs, scrolling, dead destinations, console and Next.js resources. |

## Routes redesigned or added

- `/impact` — product overview and guided workflow.
- `/impact/schools` — all three seeded schools with location, class, learner, assessment and pass-rate context.
- `/impact/schools/[id]` — performance summary, class comparison, subject performance, attention topics, interventions, assessments and readiness.
- `/impact/classes` — school-associated class discovery.
- `/impact/classes/[id]` — class summary and evidence path.
- `/impact/classes/[id]/learners` — anonymous learner codes, participation, support indicators and supported add-code mutation.
- `/impact/assessments` — assessment evidence table/cards.
- `/impact/assessments/[id]` — complete tabbed workflow with deterministic metrics primary and manual AI explanation secondary.
- `/impact/interventions` — deterministic, teacher-led action register.
- `/impact/reports` — school and assessment report library.
- `/impact/stakeholder-demo` — aggregated school illustration with explicit non-Ministry disclosure.
- `/impact/school-dashboard` and `/impact/ministry-demo` — compatibility redirects to the new school/stakeholder paths.
- Existing school and assessment report routes retained and made shell/print compatible.

## Interaction audit

- Every primary navigation item resolves to an HTTP 200 destination.
- Overview primary actions and all seven workflow steps resolve to functioning routes.
- School cards have one clear Open school action.
- School overview links to class detail and print-ready report.
- Class rows/cards are actionable; class detail links to the real learner route.
- Learner-code mutation exposes loading/disabled state, validation, error feedback and success confirmation.
- Assessment tabs expose `tablist`, `tab`, `tabpanel`, selected state and URL state.
- Report links resolve to populated print-friendly reports.
- Legacy dashboard/demo links redirect instead of becoming dead routes.
- Loading, empty, error/retry and disabled states use shared product components where applicable.
- No placeholder `href="#"` controls exist on Impact pages.

## Responsive and accessibility verification

Playwright projects verified:

| Viewport | Result |
|---|---|
| Desktop — 1440 × 1000 | Passed |
| Tablet — 1024 × 900 | Passed |
| Mobile — 390 × 844 | Passed |

Verified:

- no document-level horizontal overflow;
- full overview scrolling;
- local horizontal table/tab scrolling where needed;
- 44px minimum primary controls;
- mobile navigation opens as a labelled modal dialog and closes after navigation;
- active route uses `aria-current="page"` and a non-colour left marker;
- skip-to-content link and labelled navigation landmarks;
- visible keyboard focus rings on navigation, buttons and tabs;
- status badges combine text with colour;
- anonymous learner codes only;
- no learner failure/risk labels in redesigned workflows.

## Screenshot evidence

- `docs/checkpoints/assets/zimlearngraph-phase-b/overview-desktop-1440.png`
- `docs/checkpoints/assets/zimlearngraph-phase-b/overview-tablet-1024.png`
- `docs/checkpoints/assets/zimlearngraph-phase-b/overview-mobile-390.png`

## Validation evidence

| Gate | Result |
|---|---|
| Full backend suite | **469 passed**; 4 existing warnings |
| Focused Impact backend suite | **71 passed**; 2 existing warnings |
| Full frontend suite | **123 passed** across 17 files |
| Focused Phase B component/contract suite | **7 new tests passed**; 15 focused Impact tests passed together |
| Playwright browser suite | **13 passed, 2 deliberate non-mobile skips** across desktop/tablet/mobile |
| Production Next.js build | **Passed** |
| Production TypeScript compilation | **Passed** |
| Standalone `npm run typecheck` | **Passed** |
| Canonical product route matrix | **37/37 HTTP 200** |
| Browser console / page errors | **0 on monitored overview workflow** |
| Failed Next.js resources | **0 on monitored overview workflow** |
| Deployment smoke suite | **Passed** |
| `git diff --check` | **Passed before checkpoint** |

Deployment used `scripts/deploy_vault_frontend_standalone.sh --restart-systemd --smoke` after stopping `vault-frontend.service` before the production build.

## Remaining limitations

- The product still uses seeded demonstration evidence; it is not a verified school pilot.
- Learner-code creation depends on the existing API and does not add bulk import or identity management.
- AI explanation remains optional, manual and secondary; no new AI capability was introduced.
- Reports use browser print/CSV behavior rather than a new server-side document service.
- No parent portal, Ministry integration, national-scale dashboard or national-impact claim was added.
- Longitudinal improvement remains a future evidence requirement, not a Phase B claim.
