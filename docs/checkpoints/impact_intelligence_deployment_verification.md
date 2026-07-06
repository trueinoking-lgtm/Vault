# Impact Intelligence — Deployment Verification

**Date:** 2026-07-06
**Environment:** Local deployment (SurrealDB + API + Frontend)
**Verified by:** Phase 10 deployment verification

---

## Environment

| Service | Port | Status |
|---------|------|--------|
| SurrealDB | 8000 | ✅ Running |
| API (uvicorn) | 5055 | ✅ Running |
| Frontend (Next.js) | 3003 | ✅ Running |

## Routes Verified

### Backend Endpoints (all return HTTP 200)

| Endpoint | Status |
|----------|--------|
| `GET /api/impact/schools` | ✅ |
| `GET /api/impact/classes` | ✅ |
| `GET /api/impact/learners` | ✅ |
| `GET /api/impact/subjects` | ✅ |
| `GET /api/impact/topics` | ✅ |
| `GET /api/impact/assessments` | ✅ |
| `GET /api/impact/assessments/{id}` | ✅ |
| `GET /api/impact/assessments/{id}/analytics` | ✅ |
| `GET /api/impact/assessments/{id}/export/marks` | ✅ (CSV) |
| `GET /api/impact/assessments/{id}/export/analytics` | ✅ (CSV) |
| `GET /api/impact/schools/{id}/export/report` | ✅ (CSV) |
| `GET /api/impact/reports/assessment/{id}` | ✅ |
| `GET /api/impact/reports/school/{id}` | ✅ |
| `GET /api/impact/dashboards/school/{id}` | ✅ |
| `GET /api/impact/dashboards/ministry` | ✅ |
| `GET /api/impact/assessments/{id}/ai/teacher-summary` | ✅ |
| `GET /api/impact/assessments/{id}/ai/intervention-plan` | ✅ |
| `GET /api/impact/assessments/{id}/ai/remedial-lesson` | ✅ |

### Frontend Routes (all return HTTP 200)

| Route | Status |
|-------|--------|
| `/impact` | ✅ |
| `/impact/assessments` | ✅ |
| `/impact/school-dashboard` | ✅ |
| `/impact/ministry-demo` | ✅ |

---

## Analytics Verification

| Metric | Expected | Actual | Status |
|--------|----------|--------|--------|
| Learners assessed | 30 | 30 | ✅ |
| Class average | ~40-50% | 47.29% | ✅ |
| Pass rate | ~35-50% | 50.0% | ✅ |
| Weak topics | 5 | 5 | ✅ |
| At-risk learners | ~10-15 | 15 | ✅ |
| Interventions | ~10-20 | 20 | ✅ |

### Weak Topics Identified
1. Word Problems: 45.67% (Weak)
2. Fractions: 46.15% (Weak)
3. Percentages: 47.23% (Weak)
4. Graphs: 48.51% (Weak)
5. Ratios: 48.82% (Weak)

---

## CSV Export Verification

| Export | Filename Pattern | Status |
|--------|------------------|--------|
| Marks CSV | `marks_*.csv` | ✅ |
| Analytics CSV | `analytics_*.csv` | ✅ |
| School Report CSV | `school_report_*.csv` | ✅ |

---

## AI Summary Behavior

| Behavior | Status | Notes |
|----------|--------|-------|
| Manual generation only | ✅ | No auto-trigger on page load |
| Graceful failure | ✅ | Returns fallback message on timeout/error |
| Provider hidden from UI | ✅ | Only "AI-generated" / "Fallback" shown |
| Learner codes only in prompts | ✅ | Privacy-safe |
| 30-second timeout | ✅ | Returns friendly timeout message |

AI summaries generate correctly when an AI provider is configured. When unconfigured, the API returns "AI summaries are unavailable" fallback within 30 seconds.

---

## Tests

| Test Suite | Count | Status |
|------------|-------|--------|
| Backend impact API tests | 20/20 | ✅ |
| Backend analytics tests | 34/34 | ✅ |
| Frontend tests | 108/108 | ✅ |
| Frontend build | 31 routes | ✅ |

---

## Bugs Fixed During Verification

### 1. RecordId type mismatch in SurrealDB queries
**Issue:** SurrealDB stores foreign keys (school_id, assessment_id, etc.) as RecordId types. String comparisons in `WHERE field = 'value'` don't match RecordId values, even when the string matches the RecordId's string representation.

**Affected:** All `repo_query` calls filtering by foreign key fields in the analytics engine.

**Fix:** Use `type::thing(table, id)` for RecordId comparisons instead of direct string comparison.

**Files fixed:**
- `vault_core/analytics/impact.py` — Added `_split_record_id()` helper, updated `_fetch_questions()`, `_fetch_marks()`, `_fetch_learners()`, `_fetch_topics()` to use `type::thing()`
- `api/routers/impact.py` — Updated report and CSV export endpoints to use `ImpactAssessment.get()` / `ImpactSchool.get()` for primary key lookups and parameterized queries with `type::thing()` for foreign key queries

### 2. AI summary manual trigger
**Issue:** Phase 8 React Query hooks auto-triggered AI summary generation on page load.

**Fix:** Replaced auto-fetch hooks with manual button + local state pattern.

---

## Known Issues at Deployment

1. **Seeded data analytics now works correctly** after the RecordId type fix above.
2. **AI provider dependency** — AI summaries require a configured AI provider to generate meaningful content.
3. **No offline mode** — The application requires a network connection to the API and database.

---

## Deployment Commands Reference

```bash
# Reset and seed demo data
python scripts/reset_impact_demo.py
python scripts/seed_impact_demo.py

# Start API (port 5055)
uv run uvicorn api.main:app --host 0.0.0.0 --port 5055

# Build frontend
cd frontend && npm run build

# Start frontend (port 3003)
cd frontend && npx next start -p 3003

# Run tests
python -m pytest tests/test_impact_api.py tests/test_impact_analytics.py
cd frontend && npm test
```

---

## Post-Deployment Incident: Static Chunk 500s (2026-07-06)

### Symptom
Browser console showed `_next/static/chunks/*.css 500` and `_next/static/chunks/*.js 500` on the live site (`vault-lms.duckdns.org`).

### Root Cause
The Next.js standalone server's working directory had become stale. Specifically:

1. The process serving port 3003 (`pid=2087276`) had its CWD pointing to `/root/vault-open-notebook/frontend/.next/standalone **(deleted)**` — the directory had been replaced by a subsequent build while the process was still running.
2. The newly built `standalone/.next/static/chunks/` directory was **empty** — the `npm run build` creates `.next/static/` in the `frontend/` directory, but this must be **manually copied** into `standalone/.next/static/` for the standalone server to serve them.
3. When Nginx proxies `/_next/static/...` to the Next standalone server on port 3003, the server cannot find the chunk files in its standalone directory tree and returns 500.
4. Additionally, because the old process's CWD was a deleted directory, even if files existed, the resolved base path would be wrong.

### The Fix
The existing script `scripts/deploy_vault_frontend_standalone.sh` handles this correctly but wasn't being used for the initial deploy. The script:

1. **Stops the old process BEFORE `npm run build`** — the build deletes `.next/standalone/` entirely, which poisons the running process's CWD.
2. **Copies `.next/static/` → `.next/standalone/.next/static/** — the standalone output does NOT include static files; they must be copied separately.
3. **Preserves old static assets** in `.vault-static-cache/` and merges them back after the new build, so stale browser sessions don't crash on old chunk URLs.
4. **Copies `public/` → `standalone/public/** — for other static assets.
5. **Validates** the chunks directory exists and has files before declaring success.

### Verification After Fix
| Check | Result |
|-------|--------|
| All 4 impact routes (`/impact`, `/impact/assessments`, `/impact/school-dashboard`, `/impact/ministry-demo`) | ✅ HTTP 200 |
| All extracted CSS/JS chunk URLs from impact pages | ✅ 20/20 HTTP 200 |
| Previously-broken chunks (`047-cys6mtmnu.js`, `03d83vww3ht45.js`, etc.) | ✅ HTTP 200 |
| Standard smoke tests (routes, API, auth, owner gate, static) | ✅ All passed |
| Chunks in standalone directory | ✅ 86 files |
| Process CWD is valid | ✅ `/root/vault-open-notebook/frontend/.next/standalone` (not deleted) |

### Recommendation
Always use `scripts/deploy_vault_frontend_standalone.sh --restart` when redeploying the frontend. Never manually restart a standalone server after a rebuild without also copying the new `.next/static` assets.

---

## Signed Off

All 19 backend endpoints return HTTP 200.
All 4 frontend routes return HTTP 200.
All 54 backend tests pass.
All 108 frontend tests pass.
Frontend build produces 31 routes with no errors.
AI summaries are manual-only and gracefully degrade.
CSV exports produce valid files.
All static chunks return HTTP 200 (regression fixed).
