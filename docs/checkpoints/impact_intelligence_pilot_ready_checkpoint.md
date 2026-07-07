# Impact Intelligence — Pilot Ready Checkpoint

**Status:** ✅ Ready for pilot deployment
**Date:** July 2026

---

## Deployed Commit

| Field | Value |
|-------|-------|
| **Current commit** | `7d7cf17` — `docs: verify standalone impact intelligence live demo` |
| **Previous key commit** | `801ab8d` — `impact: polish standalone school intelligence experience` |
| **Frontend Build ID** | `zBFUktmtyPKRuTQu86lHj` |
| **Frontend** | Next.js 16.2.6 standalone on port 3003 |
| **API** | FastAPI (uvicorn) on port 5055 |
| **Database** | SurrealDB on port 8000 |
| **Live URL** | `https://vault-lms.duckdns.org/impact` |
| **Standalone domain** | `deploy/nginx/impact-standalone.conf` (ready, DNS not activated) |

---

## Live Verification Summary

### Route Health (all HTTP 200)

| Route | Status |
|-------|--------|
| `/impact` | ✅ |
| `/impact/schools` | ✅ |
| `/impact/classes` | ✅ |
| `/impact/classes/{id}/learners` | ✅ |
| `/impact/subjects` | ✅ |
| `/impact/assessments` | ✅ |
| `/impact/assessments/{id}` | ✅ |
| `/impact/assessments/{id}/report` | ✅ |
| `/impact/school-dashboard` | ✅ |
| `/impact/school-dashboard?school={id}` | ✅ |
| `/impact/ministry-demo` | ✅ |
| `/impact/schools/{id}/report` | ✅ |

### Static Assets

| Route | Chunks Checked | All 200 |
|-------|---------------|---------|
| All impact routes | 35/35 | ✅ |

### Smoke Tests

| Test | Result |
|------|--------|
| Vault live smoke test | ✅ All passed |
| Backend unit tests | 65/65 passed |
| Frontend unit tests | 108/108 passed |
| Frontend build | ✅ 0 errors |

---

## Seeded Demo Data

| Entity | Count | Details |
|--------|-------|---------|
| School | 1 | Pilot School (Harare South, Harare) |
| Class | 1 | Form 1A (Mrs. Chidyausiku) |
| Learners | 30 | L001–L030 |
| Subject | 1 | Mathematics (O-Level, ZIMSEC) |
| Topics | 5 | Fractions, Ratios, Percentages, Graphs, Word Problems |
| Assessment | 1 | Term 1 Diagnostic Test (100 marks, pass 50, graded) |
| Questions | 8 | Mapped to topics with skill types |
| Mark entries | 240 | 30 learners × 8 questions |

---

## Dashboard Metrics (Seeded)

| Metric | Value |
|--------|-------|
| Classes | 1 |
| Learners | 30 |
| Learners Assessed | 30 |
| Assessments | 1 |
| Overall Pass Rate | 50.0% |
| Subject Pass Rate | Mathematics: 50% |
| Class Pass Rate | Form 1A: 50% |
| Weak Topics | 5 (45.7%–48.8%) |
| At-Risk Learners | 15 (medium risk) |

---

## Known Limitations

See [docs/commercial/impact_intelligence_limitations.md](../commercial/impact_intelligence_limitations.md) for full details.

Key limitations for pilot:

- Not a full LMS — analytics layer only
- No parent portal
- No Ministry integration
- No auto-marking
- No multi-school RBAC
- AI summaries are advisory only (deterministic analytics are source of truth)
- Learner codes only (no names required)
- No bulk data import (CSV/XLSX)
- Single server deployment
- Standalone domain not yet activated (DNS pending)

---

## Pilot Readiness Checklist

### Deployment

- [x] Frontend built and running on port 3003
- [x] API running on port 5055
- [x] nginx serving `vault-lms.duckdns.org`
- [x] Seeded demo data loaded
- [x] All smoke tests passing
- [x] Working tree clean

### Core Features

- [x] School management (create, list, edit)
- [x] Class management (create, list, edit)
- [x] Learner management (create, list, with codes)
- [x] Subject management (create, list)
- [x] Topic management (create, list)
- [x] Assessment management (create, list, edit)
- [x] Question management (create, list, topic-mapped)
- [x] Mark entry (per-learner, per-question)
- [x] Analytics engine (class average, pass rate, topic performance)
- [x] Weak topic detection (< 55%)
- [x] Learner risk classification (high/medium/low)
- [x] Intervention recommendations (critical/weak/stable)

### Reports & Dashboards

- [x] School dashboard (aggregated stats, charts)
- [x] Assessment results (per-question, per-learner)
- [x] School impact report (print-ready)
- [x] Assessment report (print-ready)
- [x] Ministry-style aggregate demo

### UX

- [x] Standalone Impact layout (no Vault sidebar)
- [x] Top navigation (6 items)
- [x] Guided pilot flow landing page
- [x] Workflow step tracking with live status
- [x] Empty states with helpful CTAs
- [x] All buttons link to real pages

### Documentation

- [x] Demo script (`docs/commercial/impact_intelligence_demo_script.md`)
- [x] Pilot offer (`docs/commercial/impact_intelligence_pilot_offer.md`)
- [x] Data collection template (`docs/commercial/impact_intelligence_school_data_collection_template.md`)
- [x] Pitch one-pager (`docs/commercial/impact_intelligence_pitch_one_pager.md`)
- [x] Limitations doc (`docs/commercial/impact_intelligence_limitations.md`)
- [x] Standalone domain runbook (`docs/operations/impact_standalone_domain_runbook.md`)
- [x] Live verification doc (`docs/checkpoints/impact_intelligence_standalone_live_verification.md`)
- [x] This checkpoint (`docs/checkpoints/impact_intelligence_pilot_ready_checkpoint.md`)

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Learner codes instead of names | Privacy-first, faster onboarding, avoids PII handling |
| Deterministic analytics as source of truth | Teachers trust the numbers, AI is advisory only |
| Standalone product shell | Impact should feel like its own product, not a Vault subpage |
| Same backend, same process | Avoids deployment complexity — nginx rewrite is enough |
| DuckDNS + Let's Encrypt | Free, simple, already works for vault-lms domain |

---

## Next Steps After Pilot

1. Activate standalone domain (`zimlearngraph-impact.duckdns.org`)
2. Collect feedback from pilot teacher
3. Fix any bugs found during real use
4. Add CSV/XLSX mark import
5. Consider multi-assessment trend tracking
6. Plan production deployment with RBAC
