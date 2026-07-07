# Impact Intelligence — Demo Integrity Verification Checkpoint

## Phase 14: Demo Integrity & Standalone Shell

**Date:** 2026-07-07
**Commit:** (current HEAD)
**Domain:** https://zimlearngraph.duckdns.org

---

## 1. Critical Fixes Applied

### 1.1 Landing Page At-Risk Learners (was hardcoded to 0)
- **Before:** `const atRiskCount = 0` (hardcoded)
- **After:** Fetches real count from assessment analytics API
- **Live value:** At-risk learners: **15** (matches Results tab)

### 1.2 Classes Page Cards Clickable (was dead <div>)
- **Before:** Class cards were `<div>` with no link
- **After:** Cards wrap `<Link href="/impact/classes/{id}/learners">` with "Manage learners →" text
- **Navigation:** `/impact/classes/{id}/learners` opens learner list

### 1.3 Learner Management Route (was blank page)
- **Before:** `/impact/classes/{id}/learners` showed empty white page
- **After:** Shows class info (name, teacher, year), 30 learner codes (L001-L030), Add Learner form modal
- **Acceptance:** 30 learners visible with codes, status, display names

### 1.4 Marks Tab Data Loading (was 0 learners, 0 questions)
- **Root cause:** SurrealDB `record<>` comparison bug — `impact_mark_entry.assessment_id = $string` failed
- **Fix:** Changed to `impact_mark_entry.assessment_id = type::thing($table, $rid)`
- **After:** Marks tab shows **30 learners · 8 questions · 100% complete** with live scores
- **Acceptance:** All 30 learners have per-question scores visible

### 1.5 Questions Tab Data Loading (was 0 questions)
- **Root cause:** Same RecordId bug in `impact_assessment_question WHERE assessment_id = $string`
- **Fix:** Changed to `type::thing()` comparison
- **After:** Questions tab shows **8 questions · 100/100 marks assigned** with topic/skill/difficulty
- **Acceptance:** Q1-Q8 visible with max marks matching Results tab

### 1.6 Invalid Assessment ID (was blank page)
- **Before:** `/impact/assessments/1` showed empty white content area
- **After:** Shows Next.js 404 page ("This page could not be found.")
- **Acceptance:** Never renders blank; shows error state

### 1.7 Browser Title (was "Vault")
- **Before:** All Impact pages had `<title>Vault</title>`
- **After:** Client-side `document.title` updated to "Impact Intelligence" after hydration
- **Acceptance:** Browser tab shows "Impact Intelligence" on all Impact pages

### 1.8 Vault Sidebar Bleed (was visible on Impact pages)
- **Before:** "Quick actions" section from Vault CommandPalette appeared at bottom of all Impact pages
- **After:** Impact routes moved to standalone `(impact)` route group — no Vault shell components
- **Acceptance:** No Vault sidebar, no Quick actions, no notebook/source terminology

### 1.9 Loading States (improved)
- School dashboard, classes, schools, assessments, learner management all have `LoadingSpinner` during data fetch
- Landing page shows spinner during client mount
- **Acceptance:** No flash of empty/zero content before data loads

### 1.10 Misleading Labels (polished)
- "MARKS" → "MARKS ENTERED" (clarifies what 240/240 represents)
- "Turn marked tests into learning evidence." → "From marked tests to learning evidence." (smoother readability)
- `assessment_type` capitalization handled via CSS `capitalize`

---

## 2. Backend Changes

### Fixed: SurrealDB RecordId comparison across 6 endpoints

| Endpoint | Original | Fixed |
|----------|----------|-------|
| `GET /impact/learners?class_group_id=` | `WHERE class_group_id = $cg_id` | `WHERE class_group_id = type::thing($table, $rid)` |
| `GET /impact/assessments?class_group_id=` | `WHERE class_group_id = $cg_id` | `WHERE class_group_id = type::thing($table, $rid)` |
| `GET /impact/assessments/{id}/questions` | `WHERE assessment_id = $a_id` | `WHERE assessment_id = type::thing($table, $rid)` |
| `GET /impact/mark-entries?assessment_id=` | `WHERE assessment_id = $a_id` | `WHERE assessment_id = type::thing($table, $rid)` |
| `GET /impact/interventions?class_group_id=` | `WHERE class_group_id = $cg_id` | `WHERE class_group_id = type::thing($table, $rid)` |
| `GET /impact/reports/assessment/{id}` | 3× `WHERE x_id = $x_id` | 3× `WHERE x_id = type::thing($table, $rid)` |

### File: `api/routers/impact.py` — 6 endpoint patches

---

## 3. Frontend Changes

### New Route Group: `(impact)/`

Created standalone Impact route group outside `(dashboard)` to eliminate Vault shell bleed.

| Before | After |
|--------|-------|
| `app/(dashboard)/impact/page.tsx` | `app/(impact)/impact/page.tsx` |
| `app/(dashboard)/impact/layout.tsx` | `app/(impact)/impact/layout.tsx` |
| `app/(dashboard)/impact/schools/` | `app/(impact)/impact/schools/` |
| `app/(dashboard)/impact/classes/` | `app/(impact)/impact/classes/` |
| `app/(dashboard)/impact/assessments/` | `app/(impact)/impact/assessments/` |
| `app/(dashboard)/impact/school-dashboard/` | `app/(impact)/impact/school-dashboard/` |
| `app/(dashboard)/impact/ministry-demo/` | `app/(impact)/impact/ministry-demo/` |

### New Layout: `app/(impact)/layout.tsx`
- Sets document title to "Impact Intelligence"
- No Vault components (no ErrorBoundary, no CommandPalette, no ModalProvider)
- Returns `{children}` directly

### Landing Page Fix: `app/(impact)/impact/page.tsx`
- Fetches `useAssessmentAnalytics()` for real at-risk learner count
- Fetches `useSchoolDashboard()` for weak topics count and pass rate
- Displays "Marks entered" label instead of "Marks"
- Updated subtitle

### Classes Page Fix: `app/(impact)/impact/classes/page.tsx`
- Class cards wrapped in `<Link>` to `/impact/classes/{id}/learners`
- Added "Manage learners →" visual affordance

---

## 4. Verification Results

### Live Routes (all return HTTP 200)

| Route | Status | Notes |
|-------|--------|-------|
| `/impact` | 200 | Landing page, correct pilot readiness data |
| `/impact/classes` | 200 | Clickable class cards |
| `/impact/classes/{id}/learners` | 200 | 30 learners visible |
| `/impact/schools` | 200 | Pilot School listed |
| `/impact/assessments` | 200 | Term 1 Diagnostic Test |
| `/impact/assessments/{id}` | 200 | Tabs: Setup, Questions (8), Marks (30/8/100%), Results, Interventions |
| `/impact/assessments/{id}/report` | 200 | Full report with tables |
| `/impact/school-dashboard` | 200 | Dashboard or school picker |
| `/impact/ministry-demo` | 200 | Placeholder content |
| `/impact/assessments/1` | 200 | 404 rendered (invalid ID — proper error) |

### Data Correctness

| Metric | Expected | Actual |
|--------|----------|--------|
| Classes | 1 | 1 |
| Learners Assessed | 30 | 30 |
| Assessments | 1 | 1 |
| Overall Pass Rate | ~50% | 50% |
| Weak Topics | 5 | 5 |
| At-Risk Learners | ~15 | 15 |
| Questions per assessment | 8 | 8 |
| Mark entries | 240 | 240 |
| Marks completion | 100% | 100% |

### Vault Domain Unaffected

| Route | Status |
|-------|--------|
| `vault-lms.duckdns.org/` | 200 (Vault normal) |
| `vault-lms.duckdns.org/impact` | 200 (Impact works) |
| `vault-lms.duckdns.org/notebooks` | 200 |
| `vault-lms.duckdns.org/api/health` | 200 |

---

## 5. Test Results

- **Backend tests:** 463 passed, 0 failed
- **Frontend build:** 0 errors, all Impact routes compiled
- **Working tree:** Clean

---

## 6. Known Remaining Issues (not blocking demo)

| Issue | Severity | Notes |
|-------|----------|-------|
| SSR title still "Vault" | Low | Client-side updates to "Impact Intelligence" after hydration |
| "Export Marks/CSV" buttons exist but may error on export | Low | Not tested — need API verification |
| Ministry Demo page is placeholder | Low | "Coming Soon" sections — expected per scope |
| School Report page has empty district/province/type | Low | Seed data may need richer population |
| AI Insights "Generate" buttons do nothing | Low | AI features explicitly excluded from this phase |
| Login may be required on standalone domain | Low | Shares auth with Vault; cookie-based |
