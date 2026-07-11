# ZimLearnGraph — Preserve Seeded Impact Demo When API Data Is Empty

**Date:** 2026-07-11
**Trigger:** Walkthrough of the public Impact demo against a production
backend that has **empty** Impact data. The backend is healthy and returns
`200` with empty lists (`{"schools":[],"total":0}`,
`{"class_groups":[],"total":0}`, `{"assessments":[],"total":0}`). The public
pages rendered empty states ("No schools yet", empty classes/assessments)
instead of the 3-school seeded demo.

## Root cause

`src/lib/hooks/use-impact.ts` exposes a `withFallback` helper used by every
Impact list/dashboard hook:

```ts
function withFallback<T>(queryFn, fallback) {
  return async () => {
    try {
      return await queryFn()        // <- resolves with {schools:[], total:0}
    } catch {
      return fallback               // <- only fires on THROWN errors
    }
  }
}
```

It only fell back on **thrown errors** (backend unreachable / network
failure). Against a live, healthy-but-empty backend the API call **succeeds
with an empty array**, so `withFallback` returned the empty data and no
seeded fallback fired. The pages then rendered their empty states.

This is exactly the "do not rely only on failed API requests; empty
successful API responses should also fall back for public demo mode"
requirement.

## Fix

Extended `withFallback` to also fall back on **empty successful responses**.
It now accepts an optional `isEmpty` predicate; if the resolved data is
declared empty, the seeded fallback is returned.

```ts
function withFallback<T>(queryFn, fallback, isEmpty?) {
  return async () => {
    try {
      const data = await queryFn()
      if (isEmpty && isEmpty(data)) return fallback   // NEW: empty-success fallback
      return data
    } catch {
      return fallback                                    // unchanged: error fallback
    }
  }
}
```

Per-shape empty predicates were added and wired into every demo hook:

| Hook | Predicate (empty when…) | Seeded fallback |
|------|-------------------------|-----------------|
| `useImpactSchools` | `schools.length === 0` | `SEEDED_SCHOOLS` (3 schools) |
| `useImpactClassGroups` | `class_groups.length === 0` | `SEEDED_CLASSES` (6 classes) |
| `useImpactLearners` | `learners.length === 0` | `SEEDED_LEARNERS` (180) |
| `useImpactSubjects` | `subjects.length === 0` | `SEEDED_SUBJECTS` (3) |
| `useImpactTopics` | `topics.length === 0` | `SEEDED_TOPICS` (13) |
| `useImpactAssessments` | `assessments.length === 0` | `SEEDED_ASSESSMENTS` (6) |
| `useImpactInterventions` | `interventions.length === 0` | `SEEDED_INTERVENTIONS` (8) |
| `useSchoolDashboard` | all-zero dashboard | `getSeededSchoolDashboard(schoolId)` |
| `useMinistryDashboard` | `total_schools === 0 && total_learners_assessed === 0` | `SEEDED_MINISTRY_DASHBOARD` |
| `useAssessmentAnalytics` | `null` | `getSeededAssessmentAnalytics(id)` |

Non-demo detail hooks (`useImpactSchool(id)`, `useImpactAssessment(id)`,
`useImpactLearner`, `useImpactClassGroup`, report hooks) were intentionally
left as error-only — they are keyed by an ID and have no meaningful seeded
fallback for an arbitrary id.

Type-only imports for the `*ListResponse` and `SchoolDashboard` shapes were
added to `use-impact.ts` so the predicates typecheck.

## Verification

After rebuild + deploy (`bash scripts/deploy_vault_frontend_standalone.sh`):

| Check | Result |
|-------|--------|
| `GET /api/impact/schools` (live backend) | `200 {"schools":[],"total":0}` (still empty) |
| `/impact` (overview) | renders 3 schools / 6 classes / 180 learners / 6 assessments (seeded) |
| `/impact/schools` | **3 school cards** (no "No schools yet") |
| `/impact/classes` | **6 class rows/cards** |
| `/impact/assessments` | **6 assessment cards** |
| `/impact/school-dashboard` | defaults to `school-pilot` seeded dashboard (selector works) |
| Primary nav | Overview / Schools / Classes / Assessments / School Dashboard — **no "Ministry Demo"** |
| Console | clean (0 errors) |
| `/_next/static/*` | still served directly by Nginx, immutable, `Content-Length` present |
| `/api/owner-access` | still routes to Next (prior fix intact) |
| AetherLink | untouched |

## Build note

`node_modules` had been left partial by an earlier OOM-killed `npm ci`; the
frontend LSP (`tsserver`) was holding ~600MB. Killed the LSP process, freed
~600MB, then `npm ci` succeeded. No dependency changes were introduced by
this fix — only `src/lib/hooks/use-impact.ts` was edited.

## Commit

```
fix: preserve seeded impact demo when api data is empty
```
