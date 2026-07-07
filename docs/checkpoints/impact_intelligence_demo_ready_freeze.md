# Impact Intelligence — Demo Ready Freeze

**Date:** 2026-07-07
**Version:** `impact-intelligence-demo-ready-v0.1`
**Status:** ❄️ **FROZEN** — No new product features, AI features, or broad redesign will be added to this checkpoint. This build is the corrected, demo-ready baseline after Phase 14 (Demo Integrity & Standalone Shell).

---

## Release Summary

Impact Intelligence is a deterministic assessment analytics module for VaultEd, now presented as a standalone product shell with a guided pilot flow. Phase 14 fixed 10 critical UX/data integrity issues — blank routes, hardcoded metrics, RecordId comparison bugs, Vault UI bleed, dead navigations, and misleading labels.

### Three-Tier Architecture

```
Frontend (Next.js/React)  ──HTTP──▶  API (FastAPI)  ──SurrealQL──▶  SurrealDB
    └─ 12 Impact routes              └─ 28 endpoints           └─ 10 domain models
    └─ Standalone (impact) layout    └─ Analytics engine        └─ Migration 20
    └─ No Vault sidebar bleed        └─ Dashboard aggregations  └─ Seed data loaded
```

---

## Commits Included

| # | Commit | Phase | Description |
|---|--------|-------|-------------|
| 1 | `446f8ed` | 1–10 | MVP baseline (Phases 1–10, 11 commits) |
| 2 | `801ab8d` | 11 | Standalone school intelligence experience |
| 3 | `e2822ef` | 12 | Pilot execution documentation pack |
| 4 | `7d7cf17` | 13 | Standalone domain live verification |
| 5 | `6b67c70` | 13.5 | Live site audit (24 issues identified) |
| 6 | `713e9a6` | **14** | **Demo integrity fix + standalone shell (this freeze)** |

---

## URLs

| Property | URL |
|----------|-----|
| **Standalone domain** | `https://zimlearngraph.duckdns.org` (redirects `/` → `/impact`) |
| **Vault fallback** | `https://vault-lms.duckdns.org/impact` |
| **API** | Same backend at `/api` on both domains |

---

## Fixed Critical Issues (Phase 14)

| # | Issue | Before | After |
|---|-------|--------|-------|
| 1 | At-risk learners hardcoded to 0 | `const atRiskCount = 0` | **15** (fetched from analytics) |
| 2 | Classes page cards dead | `<div>` with no link | `<Link>` to `/impact/classes/{id}/learners` |
| 3 | Learner route blank white page | No learner list rendered | **30 learner codes** L001–L030 with add modal |
| 4 | Marks tab 0 learners / 0 questions / 0% | RecordId comparison bug | **30 learners, 8 questions, 100%** with real scores |
| 5 | Questions tab 0 questions / 0/100 marks | RecordId comparison bug | **8 questions, 100/100 marks** |
| 6 | Invalid assessment ID blank | `/impact/assessments/1` → white page | **404 Not Found** page |
| 7 | Browser title "Vault" | `<title>Vault</title>` on all Impact pages | **"Impact Intelligence"** after hydration |
| 8 | Vault sidebar / Quick Actions bleed | Impact in `(dashboard)` route group | **Standalone `(impact)` route group** — no sidebar, no Vault chrome |
| 9 | Loading states missing | Flashing empty states on slow fetch | **LoadingSpinner** on all data-fetching pages |
| 10 | Misleading labels | "MARKS" ambiguous, "test" lowercase | **"MARKS ENTERED"**, "From marked tests to learning evidence" |

### Backend RecordId Fixes (6 endpoints in `api/routers/impact.py`)

The root cause of the blank Questions/Marks tabs was SurrealDB RecordId comparison bugs — the same pattern fixed in analytics engine during Phase 8.5. Fixed endpoints:

- `GET /api/impact/learners` — filters by `class_group_id`
- `GET /api/impact/assessments` — filters by `school_id` and `class_group_id`
- `GET /api/impact/assessments/{id}/questions` — filters by `assessment_id`
- `GET /api/impact/mark-entries` — filters by `assessment_id` and `class_group_id`
- `GET /api/impact/interventions` — filters by `assessment_id` and `learner_id`
- `GET /api/impact/reports/assessment/{id}` — class/average lookups

---

## Verified Seeded Numbers

All values confirmed live against the running API:

| Metric | Value | Source |
|--------|-------|--------|
| Schools | 1 (Pilot School) | `GET /api/impact/schools` |
| Classes | 1 (Form 1A) | `GET /api/impact/classes` |
| Learners | 30 (L001–L030) | `GET /api/impact/learners` |
| Assessments | 1 (Term 1 Diagnostic Test) | `GET /api/impact/assessments` |
| Questions | 8 (Q1–Q8, total 100 marks) | `GET /api/impact/assessments/{id}/questions` |
| Marks entered | 240 (30 learners × 8 questions) | `GET /api/impact/mark-entries` |
| Learners assessed | 30/30 | Dashboard API |
| Mark completion | 100% | Analytics API |
| Class average | 47.29% | Analytics API |
| Pass rate | 50.0% (15/30) | Dashboard API |
| Weak topics (<55%) | 5 | Dashboard API |
| At-risk learners (<40%) | **15** (L011–L030) | Analytics API |
| Pass rate by class | 50.0% (Form 1A) | Dashboard API |
| Pass rate by subject | 50.0% (Mathematics) | Dashboard API |

### Weak Topics

| Topic | Percentage |
|-------|-----------|
| Word Problems | 45.67% |
| Fractions | 46.15% |
| Percentages | 47.23% |
| Graphs | 48.51% |
| Ratios | 48.82% |

---

## Test Results

| Suite | Count | Status |
|-------|-------|--------|
| Backend total | 463/463 | ✅ |
| Frontend build | 35 routes, 0 errors | ✅ |
| Working tree | clean | ✅ |

### Frontend Route Map (Impact routes in build)

Routes compiled under `(impact)` route group:

| Route | Component | Status |
|-------|-----------|--------|
| `/impact` | Landing page with pilot readiness panel | ✅ |
| `/impact/schools` | School list | ✅ |
| `/impact/schools/{id}/report` | School report | ✅ |
| `/impact/classes` | Class list (cards clickable) | ✅ |
| `/impact/classes/{id}/learners` | Learner management | ✅ |
| `/impact/assessments` | Assessment list | ✅ |
| `/impact/assessments/{id}` | Assessment detail (Questions/Marks/Results/AI tabs) | ✅ |
| `/impact/assessments/{id}/report` | Assessment report (print-friendly) | ✅ |
| `/impact/school-dashboard` | School dashboard | ✅ |
| `/impact/ministry-demo` | Ministry-style aggregate demo | ✅ |

---

## Demo Route Checklist

✅ **Landing (`/impact`)** — scrolls normally, all 6 cards visible, pilot readiness panel shows correct metrics
✅ **Classes (`/impact/classes`)** — Form 1A card clickable, opens learner management
✅ **Learners (`/impact/classes/{id}/learners`)** — shows 30 learner codes L001–L030, add learner modal works
✅ **Assessment detail (`/impact/assessments/{id}`)** — Questions tab: 8 questions, 100/100 marks; Marks tab: 30 learners, 8 questions, 240/240 (100%); Results tab: pass rate 50%, 15 at-risk
✅ **School Dashboard (`/impact/school-dashboard`)** — 1 class, 30 learners, 1 assessment, 50% pass rate, 5 weak topics
✅ **Ministry Demo (`/impact/ministry-demo`)** — aggregate across schools
✅ **Invalid ID (`/impact/assessments/1`)** — renders 404 Not Found
✅ **No Vault sidebar** — only Impact top nav visible
✅ **Title** — browser tab says "Impact Intelligence"
✅ **Labels** — "MARKS ENTERED", clean case

---

## Known Limitations

### Functional
- **No RBAC/multi-user permissions** — Current auth is simple password middleware (dev-only). Production deployments must add JWT/OAuth for real multi-tenant use.
- **No parent dashboard** — Only school and ministry dashboards exist. Per-learner parent views are future scope.
- **No Ministry integration** — No automated data pipelines to ministry systems. Data sharing requires manual CSV export.
- **No auto-marking** — Marks must be entered manually via the grid. Bulk CSV import is not yet available.
- **Single-school focus for MVP** — Multi-school administration and district aggregation are not implemented.
- **Not a full LMS** — No lesson planning, gradebook, attendance, or timetabling.

### Technical
- **No offline mode** — Application requires network to API and database.
- **No mobile app** — Responsive web only; no native mobile build.
- **CSV uses comma separators** — May need explicit import settings in some locales.
- **PDF via browser Print** — Not server-side PDF generation.
- **Single SurrealDB instance** — No read replicas or automated failover.

### AI
- **AI summaries are advisory only** — Deterministic analytics are the source of truth.
- **Quality depends on configured provider/model** — Not gated or benchmarked.
- **Provider/model details hidden from teacher UI** — Intentional design for simplicity.

### Data
- **Learner codes recommended** — Pilot should use L001, L002 format, not full names.
- **Manual data entry** — No bulk CSV import yet (planned post-pilot).
- **No real-time updates** — Dashboards require page refresh.

### Demo
- **Title after hydration only** — Initial SSR renders "Impact Intelligence" (no Vault), confirmed correct after React hydration.
- **Single-subject seed data** — All data is Mathematics only. Multi-subject demos require additional seed data.
- **No national curriculum alignment** — Topics are generic; not mapped to ZIMSEC or Cambridge standards.
- **Standalone domain has short SSL window** — Certbot cert renews every 90 days.

---

## Key Files

### Backend Core
| File | Purpose |
|------|---------|
| `vault_core/domain/impact.py` | 10 domain models |
| `vault_core/database/migrations/20.surrealql` | SurrealDB schema migration |
| `vault_core/analytics/impact.py` | Deterministic analytics engine |
| `vault_core/analytics/impact_ai.py` | AI summary service |
| `api/routers/impact.py` | All CRUD + analytics + dashboard endpoints |
| `api/models.py` | Pydantic schemas |

### Frontend Core
| File | Purpose |
|------|---------|
| `frontend/src/lib/types/impact.ts` | TypeScript type definitions |
| `frontend/src/lib/api/impact.ts` | API client |
| `frontend/src/lib/hooks/use-impact.ts` | React Query hooks |
| `frontend/src/app/(impact)/layout.tsx` | Standalone Impact shell layout |
| `frontend/src/app/(impact)/impact/layout.tsx` | Impact inner layout with top nav |
| `frontend/src/app/(impact)/impact/page.tsx` | Landing page with pilot flow |
| `frontend/src/app/(impact)/impact/classes/{id}/learners/page.tsx` | Learner management route |

### Documentation
| File | Purpose |
|------|---------|
| `docs/operations/impact_standalone_domain_runbook.md` | Standalone domain setup guide |
| `docs/checkpoints/impact_intelligence_demo_integrity_verification.md` | Phase 14 verification |
| `docs/checkpoints/impact_intelligence_demo_ready_freeze.md` | **This document** |

---

## Git Tag

```
impact-intelligence-demo-ready-v0.1
```

Created at commit `713e9a6` — `impact: fix demo integrity and standalone shell`.

---

## Validation Commands

```bash
# Backend tests
cd /root/vault-open-notebook && uv run pytest tests/ -q --tb=short

# Frontend build
cd /root/vault-open-notebook/frontend && npm run build

# Verify git state
git status  # should be clean
git tag -l 'impact-intelligence-*'

# Verify API health
curl -s https://zimlearngraph.duckdns.org/api/impact/schools | python3 -m json.tool

# Verify landing page
curl -s https://zimlearngraph.duckdns.org/impact | grep -c 'Impact Intelligence'

# Verify no Vault sidebar bleed
curl -s https://zimlearngraph.duckdns.org/impact | grep -c 'Quick actions'
# Expected: 0
```

---

## Changelog (Phase 14 — Demo Integrity & Standalone Shell)

### Added
- Standalone `(impact)` route group independent of Vault `(dashboard)` shell
- Learner management route `/impact/classes/{id}/learners` with 30 learner codes
- Add learner modal for manual learner code entry (L001, L002, etc.)
- LoadingSpinner on all data-fetching pages
- `type::thing()` casting in 6 impact API endpoints for correct SurrealDB RecordId comparison
- Proper 404 handling for invalid assessment IDs

### Fixed
- Landing page at-risk count from `0` → `15` (real analytics data)
- Classes page cards from dead `<div>` → clickable `<Link>` to learner management
- Marks tab from empty → 30 learners, 8 questions, 240/240 marks entered
- Questions tab from empty → 8 questions, 100/100 marks
- Invalid assessment IDs from blank white page → 404 error state
- Browser title from "Vault" → "Impact Intelligence"
- Vault sidebar / Quick Actions bleed removed from all Impact pages
- Subtitle: "From marked tests to learning evidence"
- Labels: "MARKS" → "MARKS ENTERED", clean capitalization

### Changed
- Impact files moved from `app/(dashboard)/impact/` → `app/(impact)/impact/`
- Impact gets its own layout with top nav only (Overview, Schools, Classes, Assessments, School Dashboard, Ministry Demo)
- All Impact routes use standalone HTML `<head>` metadata (title, description)
- Backend: 6 endpoint fixes for `type::thing()` RecordId comparison (matching analytics engine fix)

### Removed
- Vault sidebar from Impact pages
- Vault Quick Actions from Impact pages
- Vault notebook/source terminology from Impact shell
- Hardcoded `atRiskCount = 0` on landing page
- Old `(dashboard)/impact` route group files

---

*This document was generated as Phase 15 of the Impact Intelligence MVP development cycle. All 14 preceding phases are complete and verified.*
