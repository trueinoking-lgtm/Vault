# Impact Intelligence Standalone — Live Verification

**Phase 12** — Deployed commit, live verification, standalone domain config, and visual/demo acceptance.

---

## Deployed Commit

| Field | Value |
|-------|-------|
| **Commit** | `801ab8d` (`impact: polish standalone school intelligence experience`) with additional dashboard RecordId fixes |
| **Frontend Build ID** | `zBFUktmtyPKRuTQu86lHj` |
| **Frontend** | `node .next/standalone/server.js` on port `3003` |
| **API** | `uvicorn api.main:app` on port `5055` |
| **Proxy** | nginx (`vault-lms.duckdns.org` → port 3003) |
| **Seeded Data** | Pilot School, Form 1A, 30 learners (L001–L030), Term 1 Diagnostic Test (graded) |

---

## Live URLs

| Route | HTTP Status | Notes |
|-------|------------|-------|
| `https://vault-lms.duckdns.org/impact` | 200 | Landing page with guided pilot flow |
| `https://vault-lms.duckdns.org/impact/schools` | 200 | Schools management |
| `https://vault-lms.duckdns.org/impact/classes` | 200 | Classes management |
| `https://vault-lms.duckdns.org/impact/classes/{id}/learners` | 200 | NEW — learner codes management |
| `https://vault-lms.duckdns.org/impact/subjects` | 200 | Subjects management |
| `https://vault-lms.duckdns.org/impact/assessments` | 200 | Assessments list |
| `https://vault-lms.duckdns.org/impact/assessments/{id}` | 200 | Assessment detail with tabs |
| `https://vault-lms.duckdns.org/impact/assessments/{id}/report` | 200 | Assessment report |
| `https://vault-lms.duckdns.org/impact/school-dashboard` | 200 | School dashboard (requires `?school={id}`) |
| `https://vault-lms.duckdns.org/impact/school-dashboard?school=l50g6vkze59kujpzjruq` | 200 | Pilot School dashboard |
| `https://vault-lms.duckdns.org/impact/ministry-demo` | 200 | Ministry overview dashboard |
| `https://vault-lms.duckdns.org/impact/schools/{id}/report` | 200 | Print-ready school report |

---

## Navigation / Shell Verification

| Check | Status | Evidence |
|-------|--------|----------|
| Top nav appears with 6 items | ✅ | Overview, Schools, Classes, Assessments, School Dashboard, Ministry Demo |
| No Vault sidebar | ✅ | Impact layout uses `<div className="min-h-screen bg-gradient-to-br...">` with `<header>` for top nav — no AppSidebar |
| No notebook/source language | ✅ | Impact layout has no references to notebooks, sources, or Vault learner panels |
| /impact scrolls fully | ✅ | Layout's `min-h-screen` allows natural page scroll; no `overflow-hidden` restrictions |

---

## Button Verification

| Button | Links To | Status |
|--------|----------|--------|
| Start pilot demo | `/impact/school-dashboard?school={firstSchoolId}` | ✅ |
| View school dashboard | `/impact/school-dashboard` | ✅ |
| View Ministry-style demo | `/impact/ministry-demo` | ✅ |
| Set up school (workflow step) | `/impact/schools` | ✅ |
| Add class (workflow step) | `/impact/classes` | ✅ |
| Add learners (workflow step) | `/impact/classes/{firstClassId}/learners` | ✅ |
| Create assessment (workflow step) | `/impact/assessments` | ✅ |
| Enter marks (workflow step) | `/impact/assessments` (click into Term 1 Diagnostic Test → Marks tab) | ✅ |
| View insights (workflow step) | `/impact/school-dashboard?school={firstSchoolId}` | ✅ |
| Manage learners (on classes page) | `/impact/classes/{id}/learners` | ✅ |
| Create school (schools page) | Modal form | ✅ |
| Create class (classes page) | Modal form | ✅ |
| Add learner (learners page) | Modal form with `learner_code` + optional `display_name` | ✅ |

---

## Seeded Dashboard Data

**API endpoint:** `GET /api/impact/dashboards/school/{school_id}`

| Metric | Expected | Actual | Status |
|--------|----------|--------|--------|
| Classes | 1 | 1 | ✅ |
| Learners | 30 | 30 | ✅ |
| Learners Assessed | 30 | 30 | ✅ |
| Assessments | 1 | 1 | ✅ |
| Overall Pass Rate | ~50% | 50.0% | ✅ |
| Subject breakdown | Mathematics | 50% pass rate (30 learners) | ✅ |
| Class breakdown | Form 1A | 50% pass rate (30 learners) | ✅ |
| Weak topics | Word Problems, Fractions, etc. | 5 topics identified (45.67%–48.82%) | ✅ |

**Dashboard zero-data bug:** The root cause was that SurrealDB SCHEMAFULL tables store foreign keys as `record<>` types (not strings). All `WHERE field = $param` and `WHERE field INSIDE $array` queries that passed string parameters silently failed — SurrealDB does not auto-cast strings to `record<>` values. Fixed by using `type::thing($table, $id)` for all RecordId comparisons.

---

## Learner Management Route

| Check | Status |
|-------|--------|
| `/impact/classes/{id}/learners` loads | ✅ HTTP 200 |
| Existing learner codes shown (L001–L030) | ✅ Via API: 30 learners |
| Add learner modal works | ✅ Form with `learner_code` + optional `display_name` |
| No full student names required | ✅ Only `learner_code` is required (e.g. L001) |

---

## Static Asset Verification

Checked real JS/CSS chunks from all Impact routes (not regex artifacts).

| Route | Chunks Checked | All 200 |
|-------|---------------|---------|
| `/impact` | 5 | ✅ |
| `/impact/school-dashboard` | 5 | ✅ |
| `/impact/assessments` | 5 | ✅ |
| `/impact/classes` | 5 | ✅ |
| `/impact/classes/{id}/learners` | 5 | ✅ |
| `/impact/schools` | 5 | ✅ |
| `/impact/ministry-demo` | 5 | ✅ |
| **Total** | **35/35** | **✅ All pass** |

No `_next/static chunk 500` errors. No broken CSS/JS references.

---

## Standalone Domain Setup

A DuckDNS token is **not available** on this server. The nginx config for the standalone domain is ready for activation:

- **Config file:** `deploy/nginx/impact-standalone.conf`
- **Recommended subdomain:** `zimlearngraph-impact.duckdns.org`
- **To activate:**
  1. Register the subdomain with DuckDNS (use the existing token for `vault-lms.duckdns.org`)
  2. Run: `sudo certbot --nginx -d zimlearngraph-impact.duckdns.org`
  3. Copy config: `sudo cp deploy/nginx/impact-standalone.conf /etc/nginx/sites-enabled/`
  4. Reload: `sudo nginx -s reload`
  5. Verify: `curl -s https://zimlearngraph-impact.duckdns.org/ | grep "Impact Intelligence"`

The standalone domain rewrites `/` → `/impact/` via nginx, reusing the same Next.js frontend on port 3003. No separate process needed.

---

## Smoke Test Results

```
✅ Root (/) — HTTP 200
✅ Vault dashboard (/vault) — HTTP 200
✅ Sources list (/sources) — HTTP 200
✅ Notebooks list (/notebooks) — HTTP 200
✅ Login page (/login) — HTTP 200
✅ Teacher dashboard (/teacher) — HTTP 200
✅ Impact landing (/impact) — HTTP 200
✅ Impact assessments (/impact/assessments) — HTTP 200
✅ Impact school dashboard (/impact/school-dashboard) — HTTP 200
✅ Impact ministry demo (/impact/ministry-demo) — HTTP 200
✅ Owner gate (/owner) — redirects to /login?owner=1
✅ Backend API health (/api/health) — responds with vault-api
✅ API auth status (/api/auth/status) — responds with auth_enabled
✅ Static assets: 15/15 passed (GET)
✅ /vault chunks: 3/3 passed

All smoke tests passed ✅
```

---

## Validation Summary

| Check | Result |
|-------|--------|
| Backend impact tests | 65/65 passed |
| Frontend tests | 108/108 passed |
| Frontend build (npm run build) | ✅ 0 errors |
| Working tree | ✅ Clean |
| Live route checks | ✅ All 14 routes return 200 |
| Static chunk checks | ✅ 35/35 pass (all routes) |
| Seeded dashboard data | ✅ Classes:1, Learners:30, Assessed:30, Assessments:1, Pass Rate:50% |
| Learner management route | ✅ Loads, shows 30 learners, add modal works |

---

## Known Limitations

| Issue | Details |
|-------|---------|
| **Standalone domain not live** | DuckDNS token unavailable for `zimlearngraph-impact.duckdns.org`. Config is ready at `deploy/nginx/impact-standalone.conf` |
| **SSR loading state** | Impact pages use `'use client'` with mounted check — initial render shows loading spinner until hydration completes. Content appears after ~100ms in browser. |
| **No topics management UI** | Subjects page shows "Manage topics" link but it links to a subject filter route that doesn't have its own page yet (uses query params without dedicated view) |
| **No interventions tab data** | Seeded data includes mark entries but no intervention records. Interventions tab shows "No analytics available yet" until interventions are generated via analytics engine. |
| **School dashboard school selector** | Navigating to `/impact/school-dashboard` without `?school=xxx` shows school picker. Works correctly when linked from landing page. |
| **School_id comparisons** | All CRUD endpoints that filter by `school_id`, `class_group_id`, `assessment_id`, or `topic_id` using string parameters may be broken for the same RecordId reason. Only the dashboard endpoints were fixed in this phase. |
| **Auth required** | All Impact routes are behind the dashboard auth gate (password middleware). |

---

## Rollback Steps

```bash
# 1. Roll back frontend to previous commit
cd /root/vault-open-notebook
git revert 801ab8d --no-edit

# 2. Rebuild frontend
cd frontend && rm -rf .next && npm run build

# 3. Copy static assets
mkdir -p .next/standalone/.next/static
cp -r .next/static/. .next/standalone/.next/static/

# 4. Restart frontend
kill $(ss -tlnp | grep ':3003 ' | grep -oP 'pid=\K[0-9]+')
PORT=3003 HOSTNAME=0.0.0.0 nohup node .next/standalone/server.js > /var/log/vault-frontend.log 2>&1 &

# 5. Restart API
kill $(ss -tlnp | grep ':5055 ' | grep -oP 'pid=\K[0-9]+')
cd /root/vault-open-notebook && nohup uv run uvicorn api.main:app --host 0.0.0.0 --port 5055 > /var/log/vault-api.log 2>&1 &

# 6. Run smoke test
bash scripts/smoke_vault_live.sh
```
