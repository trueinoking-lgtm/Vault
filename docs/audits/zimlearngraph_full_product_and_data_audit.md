# ZimLearnGraph Impact — Full Product & Data Audit

**Generated:** 2026-07-11
**Scope:** `/root/vault-open-notebook` at `7af194b`; stable baseline tag `zimlearngraph-public-demo-stable-v0.4` points to `28d0929`
**Focus:** ZimLearnGraph Impact Intelligence module
**Method:** Static code analysis, targeted test execution, and live-route verification; no production data changed and no secrets exposed.

---

## 1. Summary of Findings

| Dimension | Verdict |
|-----------|---------|
| **Operational capabilities** | Broad Impact CRUD, analytics, dashboard, report, CSV and advisory-AI endpoints exist; not all are integration-tested |
| **Seeded demo readiness** | List/aggregate fallback is strong, but seeded assessment detail routes currently fail with “Assessment not found” |
| **Deterministic analytics** | Substantial engine; targeted Impact API/analytics suite verified at 68 passing tests |
| **AI summaries** | Wired, gracefully degrades when AI is unavailable |
| **Auth on Impact router** | **None** — zero permission checks; shared-password only |
| **Intervention follow-up** | **Partial** — status field exists, no state machine / longitudinal tracking |
| **RecordId hygiene** | **Moderate risk** — mixed comparison strategies, one confirmed runtime type bug |
| **Data Track leverage** | Strong foundation, but collection-access evidence and machine-readable handover evidence remain critical gaps |

---

## 2. Capability Classification

### 2.1 API Routes (`/api/impact/*`)

| Endpoint | File & Lines | Classification | Notes |
|----------|-------------|----------------|-------|
| `GET /schools` | `api/routers/impact.py:109-128` | **Operational** | CRUD: List, Get, Create, Update, Delete. No auth. |
| `GET /schools/{id}` | `impact.py:131-147` | **Operational** | |
| `POST /schools` | `impact.py:150-170` | **Operational** | |
| `PUT /schools/{id}` | `impact.py:173-199` | **Operational** | |
| `DELETE /schools/{id}` | `impact.py:202-211` | **Operational** | |
| `GET /classes` | `impact.py:219-249` | **Operational** | Filters by school_id. No auth. |
| `GET /classes/{id}` | `impact.py:252-269` | **Operational** | Full CRUD. No auth. |
| `POST /classes` | `impact.py:272-294` | **Operational** | |
| `PUT /classes/{id}` | `impact.py:297-324` | **Operational** | |
| `DELETE /classes/{id}` | `impact.py:327-336` | **Operational** | |
| `GET /learners` | `impact.py:344-374` | **Operational** | Filters by class_group_id. No auth. |
| `GET /learners/{id}` | `impact.py:377-393` | **Operational** | Full CRUD. No auth. |
| `POST /learners` | `impact.py:396-417` | **Operational** | |
| `PUT /learners/{id}` | `impact.py:420-446` | **Operational** | |
| `DELETE /learners/{id}` | `impact.py:449-458` | **Operational** | |
| `GET /subjects` | `impact.py:466-483` | **Operational** | Full CRUD. No auth. |
| `GET /topics` | `impact.py:567-595` | **Operational** | Filters by subject_id. No auth. |
| `GET /assessments` | `impact.py:683-729` | **Operational** | Filters by class_group_id, subject_id. No auth. |
| `GET /assessments/{id}/analytics` | `impact.py:836-955` | **Operational** | Calls `ImpactAnalyticsEngine.calculate_analytics()`. |
| `GET /dashboards/school/{id}` | `impact.py:1390-1611` | **Operational** | School-level aggregation. No auth. |
| `GET /dashboards/ministry` | `impact.py:1614-1781` | **Operational** | Cross-school aggregation. No auth. |
| `GET /reports/assessment/{id}` | `impact.py:1789-1894` | **Operational** | Full assessment report. |
| `GET /reports/school/{id}` | `impact.py:1897-2041` | **Operational** | Full school report. |
| `GET assessments/{id}/export/marks` | `impact.py:2049-2127` | **Operational** | CSV export. |
| `GET assessments/{id}/export/analytics` | `impact.py:2130-2264` | **Operational** | CSV export. |
| `GET schools/{id}/export/report` | `impact.py:2267-2381` | **Operational** | CSV export. |
| `GET assessments/{id}/ai/teacher-summary` | `impact.py:2393-2437` | **Operational** | Graceful fallback on failure/timeout. |
| `GET assessments/{id}/ai/intervention-plan` | `impact.py:2440-2479` | **Operational** | Graceful fallback. |
| `GET assessments/{id}/ai/remedial-lesson` | `impact.py:2482-2554` | **Operational** | Graceful fallback. |

### 2.2 Frontend Routes

| Route | File | Classification | Notes |
|-------|------|----------------|-------|
| `/impact` | `frontend/src/app/(impact)/impact/page.tsx` | **Operational** | Overview with aggregated stats. Uses fallback demo. |
| `/impact/schools` | `(impact)/impact/schools/page.tsx` | **Operational** | School list. |
| `/impact/schools/[id]/report` | `(impact)/impact/schools/[id]/report/page.tsx` | **Operational** | School report. |
| `/impact/classes` | `(impact)/impact/classes/page.tsx` | **Operational** | Class list. |
| `/impact/classes/[id]/learners` | `(impact)/impact/classes/[id]/learners/page.tsx` | **Operational** | Learner list. |
| `/impact/assessments` | `(impact)/impact/assessments/page.tsx` | **Operational** | Assessment list. |
| `/impact/assessments/[id]` | `(impact)/impact/assessments/[id]/page.tsx` | **Operational** | Assessment detail + analytics. |
| `/impact/assessments/[id]/report` | `(impact)/impact/assessments/[id]/report/page.tsx` | **Operational** | Full assessment report. |
| `/impact/school-dashboard` | `(impact)/impact/school-dashboard/page.tsx` | **Operational** | School dashboard with visualizations. |
| `/impact/ministry-demo` | `(impact)/impact/ministry-demo/page.tsx` | **Seeded demo** | **Redirects to /impact** — was removed from nav. Content is a no-op redirect. |
| `/impact-intelligence` | `(impact-public)/impact-intelligence/page.tsx` | **Operational public proof layer** | Live landing page using `ImpactLandingPage`; copy includes stale and contradictory demo metrics that must be corrected. |
| `/owner/schools` | `(dashboard)/owner/schools/page.tsx` | **Operational** | Uses Epsilon `school` table router — NOT Impact `impact_school`. |
| `/owner/schools/[id]` | `(dashboard)/owner/schools/[id]/page.tsx` | **Operational** | Epsilon school detail. |
| `/owner/schools/[id]/classrooms/[classroomId]` | `(dashboard)/owner/schools/[id]/classrooms/[classroomId]/page.tsx` | **Operational** | Epsilon classroom detail. |
| `/owner/ai` | `(dashboard)/owner/ai/page.tsx` | **Operational** | AI config. |
| `/teacher` | `(dashboard)/teacher/page.tsx` | **Operational** | Teacher home. |
| `/teacher/classes/[id]` | `(dashboard)/teacher/classes/[id]/page.tsx` | **Operational** | Teacher class view. |

### 2.3 SurrealDB Schema / Migrations

| Migration | File | Classification | Notes |
|-----------|------|----------------|-------|
| 16 | `migrations/16.surrealql` | **Operational** | Study session, leaf review event, leaf review state tables. |
| 17 | `migrations/17.surrealql` | **Operational** | User, school, classroom, enrollment, assignment, auth_session tables. |
| 18 | `migrations/18.surrealql` | **Operational** | Optional scoping fields (school_id, created_by, user_id) on existing tables. |
| 19 | `migrations/19.surrealql` | **Operational** | Classroom assignment expansion + assignment_progress table. |
| 20 | `migrations/20.surrealql` | **Operational** | **All 9 Impact tables** + 9 indexes. SCHEMAFULL with ASSERT constraints and record<> types. |

**Impact tables defined in migration 20** (all SCHEMAFULL with record<> foreign keys):
- `impact_school` — name, district, province, school_type, active
- `impact_class_group` — school_id (record<impact_school>), name, grade_level, academic_year, teacher_name, active
- `impact_learner` — school_id, class_group_id, learner_code, display_name, status
- `impact_subject` — name, level, curriculum
- `impact_topic` — subject_id, name, strand, syllabus_code
- `impact_assessment` — school_id, class_group_id, subject_id, title, assessment_type, term, date_written, total_marks, pass_mark, status
- `impact_assessment_question` — assessment_id, question_number, label, max_marks, topic_id, skill_type, difficulty
- `impact_mark_entry` — assessment_id, question_id, learner_id, score, max_score
- `impact_intervention` — assessment_id, class_group_id, topic_id, severity, recommendation, status

### 2.4 Domain Models

| Model | File:Line | Classification | Notes |
|-------|-----------|----------------|-------|
| `ImpactSchool` | `vault_core/domain/impact.py:18-30` | **Operational** | 6 fields. `nullable_fields: district, province, school_type` |
| `ImpactClassGroup` | `impact.py:33-46` | **Operational** | 6 fields. `nullable_fields: teacher_name, academic_year` |
| `ImpactLearner` | `impact.py:49-64` | **Operational** | 5 fields + status enum. |
| `ImpactSubject` | `impact.py:67-77` | **Operational** | 3 fields. |
| `ImpactTopic` | `impact.py:80-91` | **Operational** | 3 fields + subject_id FK. |
| `ImpactAssessment` | `impact.py:94-118` | **Operational** | 9 fields + status enum. |
| `ImpactAssessmentQuestion` | `impact.py:121-138` | **Operational** | 7 fields + skill_type enum. |
| `ImpactMarkEntry` | `impact.py:141-155` | **Operational** | 4 fields. |
| `ImpactIntervention` | `impact.py:158-174` | **Operational** | 5 fields + severity/status enums. |
| `School` (Epsilon) | `domain/school.py:15-27` | **Operational** | **Separate from ImpactSchool** — different table, different fields, different router. |
| `SchoolMembership` | `domain/school.py:30-43` | **Operational** | Links User to School with role. |
| `Classroom` | `domain/school.py:47-61` | **Operational** | Epsilon classroom. |
| `StudySession` | `domain/study.py:41-123` | **Operational** | Study review session. |
| `LeafReviewEvent` | `domain/study.py:126-211` | **Operational** | Append-only review log. |
| `LeafReviewState` | `domain/study.py:230-320` | **Operational** | Denormalized review state. |

### 2.5 Seeded Demo

| Component | File:Line | Classification | Notes |
|-----------|-----------|----------------|-------|
| Seed script | `scripts/seed_impact_demo.py` (361 lines) | **Operational** | Creates 1 school, 1 class, 1 subject, 5 topics, 30 learners, 1 assessment, 8 questions, 240 mark entries. Uses realistic mark distribution (top/mid/bottom tiers). |
| Reset script | `scripts/reset_impact_demo.py` (74 lines) | **Operational** | Drops all 9 impact tables in reverse dependency order. **Destructive** — uses `REMOVE TABLE`. |
| Frontend demo data | `frontend/src/lib/impact/demo-data.ts` (820 lines) | **Seeded demonstration** | Contains 3 schools, 6 classes, **180 generated learners**, 3 subjects, 13 topics, 6 assessments and deterministic analytics/interventions. Uses seeded PRNG for reproducibility. |
| Fallback hook | `frontend/src/lib/hooks/use-impact.ts` (688 lines) | **Partially complete seeded fallback** | Lists and aggregates fall back on API error or successful-empty responses. `useImpactAssessment(id)` does not fall back to the matching seeded assessment, causing seeded detail links to fail. Other detail/report hooks require the same audit. |
| Fallback API client | `frontend/src/lib/api/impact.ts` (416 lines) | **Seeded demonstration** | All API calls wired to fallback. |

### 2.6 Deterministic Analytics

| Component | File:Line | Classification | Notes |
|-----------|-----------|----------------|-------|
| `ImpactAnalyticsEngine` | `vault_core/analytics/impact.py:127-687` | **Operational** | 560+ lines of deterministic calculation. Key methods: `calculate_analytics`, `_fetch_questions/marks/learners/topics`, `_calculate_learner_performance`, `_calculate_question_performance`, `_calculate_topic_performance`, `_generate_interventions`, `classify_topic`, `classify_learner_risk`. |
| Thresholds | `impact.py:135-143` | **Operational** | CRITICAL_TOPIC=40%, WEAK_TOPIC=55%, CRITICAL_QUESTION=35%, HIGH_RISK=40%, MEDIUM_RISK=50% |
| Outputs | `AssessmentAnalytics` dataclass `impact.py:93-119` | **Operational** | Contains question_performance, topic_performance, learner_performance, weak_topics, at_risk_learners, interventions. |

### 2.7 AI Summaries

| Component | File:Line | Classification | Notes |
|-----------|-----------|----------------|-------|
| `ImpactAISummaryService` | `vault_core/analytics/impact_ai.py:175-451` | **Operational** | Three generators: `generate_teacher_summary`, `generate_intervention_plan`, `generate_remedial_lesson`. Uses `provision_langchain_model`. |
| Prompt templates | `impact_ai.py:61-167` | **Operational** | System/human prompt pairs for each summary type. Enforce: "You must NOT invent or change any numbers." |
| Privacy in prompts | `impact_ai.py:204-211` | **Operational** | At-risk learner names = `learner_code` only, not `display_name`. |
| Graceful degradation | `routes/impact.py:2393-2554` | **Operational** | 30s timeout. Returns clear "not_configured" vs "unavailable" messages. |

### 2.8 Interventions & Follow-Up

| Feature | File:Line | Classification | Notes |
|---------|-----------|----------------|-------|
| ImpactIntervention CRUD | `routes/impact.py:1234-1365` | **Operational** | Full CRUD for intervention records. |
| Analytics generates interventions | `analytics/impact.py:511-591` | **Operational** | `_generate_interventions` creates topic + learner interventions with severity/recommendation. |
| Dashboard shows interventions | `routes/impact.py:1578-1611` | **Operational** | Fetches recent 5 interventions for school dashboard. |
| Intervention status | domain model field | **Partial** | Status field exists (`pending/in_progress/completed/dismissed`) but **no state machine, no status transitions enforced, no endpoint to mark completed, no follow-up assessment tracking.** |
| Intervention follow-up workflow | — | **Missing** | No way to: (1) assign an intervention to a teacher, (2) schedule a follow-up assessment, (3) compare before/after analytics, (4) track intervention effectiveness over time. |
| Follow-up assessment linking | — | **Missing** | No DB field linking an intervention to a follow-up assessment. |

### 2.9 Reports & Exports

| Feature | File:Line | Classification | Notes |
|---------|-----------|----------------|-------|
| Assessment report | `routes/impact.py:1789-1894` | **Operational** | Full JSON report: assessment + questions + learners + analytics + school/class/subject. |
| School report | `routes/impact.py:1897-2041` | **Operational** | Full JSON report: school + classes + assessments + pass rates + interventions. |
| CSV: marks export | `routes/impact.py:2049-2127` | **Operational** | Per-learner, per-question mark breakdown as CSV. |
| CSV: analytics export | `routes/impact.py:2130-2264` | **Operational** | Multi-section CSV: summary + question + topic + learner performance. |
| CSV: school report | `routes/impact.py:2267-2381` | **Operational** | Multi-section CSV: school summary + class pass rates + interventions. |
| PDF export | — | **Missing** | No PDF rendering capability. All exports are raw CSV. |

### 2.10 Authentication & Roles

| Component | File:Line | Classification | Notes |
|-----------|-----------|----------------|-------|
| Impact router auth | `routes/impact.py` (entire file) | **Missing** | **No authentication whatsoever.** Zero `Request` parameter usage, zero auth decorators, zero permission checks. The router is protected ONLY by PasswordAuthMiddleware (global shared secret). |
| PasswordAuthMiddleware | `api/main.py` (auth middleware) | **Partial** | Simple password check. Not user-scoped. Not role-based. Documented as "insecure, dev-only" in CLAUDE.md. |
| Schools router auth | `api/routers/schools.py:163-167` | **Operational** | Full RBAC: `require_global_owner()`, `check_school_role()`, `check_classroom_access()`. Uses `api/permissions.py`. |
| Permissions module | `api/permissions.py:1-241` | **Operational** | `get_current_user()` resolves from: (1) session token, (2) VAULT_OWNER_PASSWORD, (3) VAULT_PASSWORD. `check_school_role()` enforces role hierarchy (owner>teacher>learner). `check_classroom_access()` validates teacher-of-classroom. `require_global_owner()` blocks non-owners. |
| Owner area guard | `api/permissions.py:98-108` | **Operational** | `require_global_owner()` raises 401/403. |
| Impact/Epsilon split | — | **Unsafe to claim** | Impact Intelligence has its OWN school/class/learner tables (`impact_school` etc.) that are COMPLETELY separate from the Epsilon schools system (`school` etc.). Impact data has NO link to Vault users or schools. |

### 2.11 Owner Area

| Feature | File | Classification | Notes |
|---------|------|----------------|-------|
| Owner schools | `frontend/src/app/(dashboard)/owner/schools/page.tsx` | **Operational** | Lists Epsilon schools (not Impact schools). |
| Owner school detail | `owner/schools/[id]/page.tsx` | **Operational** | Epsilon school CRUD. |
| Owner classrooms | `owner/schools/[id]/classrooms/[classroomId]/page.tsx` | **Operational** | Epsilon classroom CRUD. |
| Owner AI config | `owner/ai/page.tsx` | **Operational** | AI model configuration. |
| Owner access API | nginx config routes `/api/owner-access` → frontend | **Operational** | Verified routing. |

**Important:** The `(dashboard)/owner/*` area manages the **Epsilon school tables** (`school`, `classroom`, `school_membership`), NOT the **Impact school tables** (`impact_school`, `impact_class_group`, `impact_learner`). There is no owner UI for Impact Intelligence schools.

### 2.12 Tests

| Test file | Lines | Coverage | Classification |
|-----------|-------|----------|----------------|
| `tests/test_impact_api.py` | 513 | CRUD for all 8 impact entity types | **Operational** — mocks domain models, tests all CRUD + error cases |
| `tests/test_impact_analytics.py` | 1156 | Full analytics engine: class avg, pass rate, topic perf, weak detection, risk detection, incomplete marks, max-score validation, interventions | **Operational** — thorough coverage with fixtures |
| `tests/test_schools_api.py` | 754 | Epsilon schools CRUD + permission enforcement | **Operational** |
| `tests/test_school_domain.py` | — | (exists but smaller) | **Operational** |
| `tests/test_study_api.py` | — | Study session / review APIs | **Operational** |
| `tests/test_graphs.py` | — | LangGraph workflow tests | **Operational** |

**Gap:** No tests for:
- Impact dashboard endpoints `/dashboards/school/{id}` and `/dashboards/ministry`
- Impact report endpoints `/reports/assessment/{id}` and `/reports/school/{id}`
- CSV export endpoints
- AI summary endpoints (hard to unit test AI calls)
- Frontend demo-data seeding correctness
- Frontend fallback hook logic
- E2E / integration tests (require SurrealDB + API)

### 2.13 Deployment

| Component | File | Classification | Notes |
|-----------|------|----------------|-------|
| NGINX standalone config | `deploy/nginx/impact-standalone.conf` (98 lines) | **Operational** | SSL via Let's Encrypt. Root → redirect to /impact. Static assets served directly from disk. API proxied to port 5055. Frontend proxied to port 3003. |
| systemd: API | `deploy/systemd/vault-api.service` (58 lines) | **Operational** | uv run run_api.py. Depends on surrealdb service. Restart=always. |
| systemd: Frontend | `deploy/systemd/vault-frontend.service` (24 lines) | **Operational** | Standalone Next.js server on port 3003. |
| systemd: SurrealDB | `deploy/systemd/vault-surrealdb.service` | **Operational** | (exists) |
| systemd: Worker | `deploy/systemd/vault-worker.service` | **Operational** | (exists) |
| Frontend deploy script | `scripts/deploy_vault_frontend_standalone.sh` | **Operational** | Standalone Next.js build + static asset sync. |
| Docker | `Dockerfile`, `docker-compose.yml` | **Operational** | Containerized deployment option. |

### 2.14 Documentation

| Document | File | Classification | Notes |
|----------|------|----------------|-------|
| Data Track Strategy | `docs/data/zimlearngraph_ai4i_data_track_strategy.md` (274 lines) | **Docs-only** | Primary Data Track positioning. Covers problem statement, data collection protocol, quality framework, schema, privacy governance, monetization. |
| Dataset Card | `docs/data/zimlearngraph_dataset_card.md` | **Docs-only** | Dataset documentation. |
| Data Dictionary | `docs/data/zimlearngraph_data_dictionary.md` | **Docs-only** | Field-level documentation. |
| Schema | `docs/data/zimlearngraph_schema.md` | **Docs-only** | Schema documentation. |
| Privacy Governance | `docs/data/zimlearngraph_privacy_governance.md` | **Docs-only** | Privacy architecture. |
| Quality Framework | `docs/data/zimlearngraph_quality_framework.md` | **Docs-only** | Data quality standards. |
| Collection Protocol | `docs/data/zimlearngraph_collection_protocol.md` | **Docs-only** | Data collection procedures. |
| Impact Model (AI4I) | `docs/applications/ai4i_zimlearngraph_impact_model.md` | **Docs-only** | Impact measurement framework. |
| Executive Summary | `docs/applications/ai4i_zimlearngraph_executive_summary.md` | **Docs-only** | Application summary. |
| Application Draft | `docs/applications/ai4i_zimlearngraph_application_draft.md` | **Docs-only** | Full AI4I application. |
| Budget & Use of Funds | `docs/applications/ai4i_zimlearngraph_budget_and_use_of_funds.md` | **Docs-only** | Budget. |
| Problem/Solution | `docs/applications/ai4i_zimlearngraph_problem_solution.md` | **Docs-only** | Problem/solution framing. |
| FAQ Defense | `docs/applications/ai4i_zimlearngraph_faq_defense.md` | **Docs-only** | FAQ / objection handling. |
| Why Us | `docs/applications/ai4i_zimlearngraph_why_us.md` | **Docs-only** | Competitive positioning. |
| Judge Alignment Matrix | `docs/applications/ai4i_zimlearngraph_judge_alignment_matrix.md` | **Docs-only** | Evaluation criteria alignment. |
| Data Asset Features | `docs/applications/ai4i_zimlearngraph_data_asset_features.md` | **Docs-only** | Data asset description. |
| Data Track Fit | `docs/applications/ai4i_zimlearngraph_data_track_fit.md` | **Docs-only** | Data Track alignment. |
| Pitch Script | `docs/applications/ai4i_zimlearngraph_pitch_script.md` | **Docs-only** | Presentation script. |
| Commercial: Pitch | `docs/commercial/impact_intelligence_pitch.md` | **Docs-only** | Stakeholder pitch. |
| Commercial: Demo Script | `docs/commercial/impact_intelligence_demo_script.md` | **Docs-only** | Live demo walkthrough. |
| Commercial: Limitations | `docs/commercial/impact_intelligence_limitations.md` | **Docs-only** | Known limitations document. |
| Commercial: Pilot Offer | `docs/commercial/impact_intelligence_pilot_offer.md` | **Docs-only** | Pilot proposal template. |
| Operations: Demo Runbook | `docs/operations/impact_intelligence_demo_runbook.md` | **Docs-only** | Demo operations runbook. |
| Operations: Standalone Runbook | `docs/operations/impact_standalone_domain_runbook.md` | **Docs-only** | Standalone domain operations. |

---

## 3. RecordId Risks

### 🔴 Confirmed Runtime Bug (High Severity)

**File:** `api/routers/impact.py:1999`
**Code:** `InterventionRecommendationResponse(**i)` where `i` is a raw SurrealDB dict from `repo_query`
**Problem:** `InterventionRecommendationResponse` expects fields like `intervention_type`, `entity_type`, `entity_name` — but the raw SurrealDB row has crude fields like `severity`, `recommendation`, `status`, `assessment_id`. This will raise a `ValidationError` at runtime on the school report endpoint when interventions exist.
**Fix needed:** Construct the response manually or use `ImpactIntervention(**i)` and map fields.

### 🟡 Mixed RecordId Comparison Strategies (Medium Severity)

Throughout `api/routers/impact.py`, some queries use `type::thing()` for RecordId comparison:

```python
# Correct — uses type::thing() for SCHEMAFULL record<> fields
"WHERE assessment_id = type::thing($table, $id)"
```

But **other queries** pass bare prefixed strings:

```python
# Lines 2062, 2069, 2076, 2280, 2287, 2295
"WHERE assessment_id = $assessment_id"   # BARE STRING — fragile
"WHERE school_id = $school_id"           # BARE STRING — fragile
"WHERE assessment_id IN $ids"            # BARE STRING LIST — fragile
```

In SurrealDB SCHEMAFULL tables, `record<impact_assessment>` fields store RecordId objects. String comparison (`= $bare_string`) may not match correctly. The `IN $assessment_ids` pattern (bare string array, line 1926-1928, 2295-2297) is particularly risky.

### 🟡 Domain Model `id` Field Ambiguity (Medium Severity)

Domain models store `school_id`, `class_group_id`, `subject_id` etc. as plain strings (type `str`). These get populated from SurrealDB response dicts via `parse_record_ids()` (which converts RecordId→string). But when models are **created** via the API, the constructor receives string IDs from the `ImpactSchoolCreate` schema. The `_ensure_prefixed` pattern strips/re-adds prefixes at multiple points, creating opportunities for prefix mismatch or double-prefixing.

### 🟢 `_ensure_prefixed` / `_strip_prefix` Isolates Risk (Low Severity)

All API endpoints use `_ensure_prefixed` on input and `_strip_prefix` on output. This keeps RecordId logic centralized but creates 60+ string-manipulation call sites in `impact.py` alone. Any call site that forgets one of these helpers could pass a bare ID to a SCHEMAFULL query expecting a RecordId.

---

## 4. Security & Privacy Gaps

### 🔴 Critical: No Authentication on Impact Router

**File:** `api/routers/impact.py` (entire file)
**Risk:** Zero authentication checks. No `Request` parameter used. No role verification. The only protection is `PasswordAuthMiddleware` (a shared secret) registered in `api/main.py`. Anyone with valid credentials (leaked or brute-forced) has full read/write access to all Impact data — schools, learners, marks, interventions.

Compare with the Epsilon Schools router (`api/routers/schools.py`) which uses `require_global_owner()`, `check_school_role()`, `check_classroom_access()` at every endpoint.

### 🔴 Critical: No Tenancy / Data Isolation

Impact Intelligence has its own school/class/learner tables completely separate from the Vault Epsilon system. There is no:
- Owner/user field on any Impact model
- Membership linking a Vault user to an Impact school
- Query filter scoping data to the caller's school
- Mechanism preventing School A from seeing School B's learner data

Consequence: If deployed with multiple schools, the `/dashboards/ministry` endpoint returns ALL schools' data to any authenticated caller.

### 🟡 High: Learner PII Exposed

- `display_name` is returned in all learner list/detail API responses
- CSV exports contain full learner names and codes
- No role-based PII redaction (e.g., teachers see names, ministry sees codes only)
- The `_format_at_risk_learners` in `impact_ai.py:204-211` correctly uses `learner_code` only — but the API itself does not follow the same practice

### 🟡 High: CORS Wide Open

Per CLAUDE.md: "CORS enabled — allow all origins in dev." No production CORS hardening visible in `api/main.py`.

### 🟡 Medium: No Rate Limiting

No rate limiting anywhere in the API. Bulk data exfiltration is possible via the CSV export endpoints or paginated list endpoints.

### 🟡 Medium: No Audit Logging

No record of who accessed what Impact data. No audit trail for learner data access.

### 🟢 Low: PasswordAuthMiddleware Documented as Dev-Only

The auth middleware is explicitly documented as "insecure, dev-only" and "production deployments should replace with OAuth/JWT."

---

## 5. P0 Data Track Leverage

The Data Track position is well-justified and well-documented. Key assets:

| Asset | Status | Location |
|-------|--------|----------|
| Structured data schema | **Operational** | Migration 20 defines 9 tables, 9 indexes, SCHEMAFULL with assertions |
| Privacy-by-design architecture | **Docs-complete** | `docs/data/zimlearngraph_privacy_governance.md` |
| Collection protocol | **Docs-complete** | `docs/data/zimlearngraph_collection_protocol.md` |
| Quality framework | **Docs-complete** | `docs/data/zimlearngraph_quality_framework.md` |
| Dataset card | **Docs-complete** | `docs/data/zimlearngraph_dataset_card.md` |
| Data dictionary | **Docs-complete** | `docs/data/zimlearngraph_data_dictionary.md` |
| AI4I alignment strategy | **Docs-complete** | `docs/data/zimlearngraph_ai4i_data_track_strategy.md` |
| Working dashboard (as proof) | **Operational** | Full React frontend with seeded demo fallback |
| Deterministic analytics | **Operational** | `vault_core/analytics/impact.py` — no AI required |
| Seed/collection script | **Operational** | `scripts/seed_impact_demo.py` |

### Data Track Positioning Recommendations

1. **The dashboard IS the proof layer** — the data schema + collection protocol + deterministic analytics are the primary innovation. The `docs/data/zimlearngraph_ai4i_data_track_strategy.md` makes this argument persuasively (lines 23-37).

2. **The live demo at `zimlearngraph.duckdns.org`** validates the Data Track claim by showing what the data enables.

3. **The evidence base is document-rich but not submission-ready** — the schema and governance documents are useful foundations, but the official Track 1 package still needs credible source-access evidence, structured metadata, a dictionary CSV, manifest/checksums, sample validation output, a load test and explicit permission status.

4. **Recommendation:** Lead with the data architecture (schema + determinism + privacy-by-design) and reference the dashboard as a proof-of-concept visualization layer.

---

## 6. What Should NOT Be Built Before Submission

| Feature | Rationale |
|---------|-----------|
| Full RBAC on Impact router | Scope risk. Document as known limitation. The Data Track submission doesn't require per-user authorization. |
| Intervention follow-up workflow | Scope risk. The intervention status field exists and can be described as "foundation for future follow-up tracking." |
| Learner portal | Outside Data Track scope. |
| Longitudinal analytics (cross-assessment trends) | Could be compelling but adds scope. Current analytics are per-assessment. Document as a roadmap item. |
| PDF report generation | CSV exports suffice for Data Track evidence. |
| Email notifications | Nice-to-have, not required for submission. |
| Full production-grade offline synchronisation | Too broad before submission. Build only a narrow, demonstrable CSV/XLSX validation/import slice after the official proposal and handover package are secured. |
| School onboarding wizard | Not needed for pilot scope. |
| Real-time collaboration | Way outside scope. |

---

## 7. Recommendation: Pre-Submission Repairs

**Must fix (will crash at runtime):**

1. **`routes/impact.py:1999`** — Bug: `InterventionRecommendationResponse(**i)` with wrong type. Fix to use proper `ImpactIntervention` model and manual field mapping. Would crash the school report endpoint when interventions exist.

**Strongly recommended:**

2. **RecordId consistency audit** — Audit all 50+ query sites in `impact.py` to ensure `type::thing()` is used for every RecordId comparison in SCHEMAFULL tables. Pay special attention to `IN $ids` patterns (lines 1926, 2295).

3. **Remove `display_name` from list endpoints** — Return only `learner_code` for learner list/detail to avoid unnecessary PII exposure. Keep full name only in the assessment-specific export (where it's pedagogically necessary).

**Documentation (no code changes):**

4. **Add a `SECURITY.md`** noting: (a) Impact router has no per-user auth, (b) shared-password middleware is dev-only, (c) CORS is wide open, (d) no tenancy isolation for multi-school deployments.

5. **Tag the Data Track submission explicitly** so evaluators can find: the schema (migration 20), the deterministic analytics engine, the collection protocol docs, and the live demo.

---

## 8. Evidence Index

| Evidence | Path | Lines |
|----------|------|-------|
| Impact router (all endpoints) | `api/routers/impact.py` | 1-2554 |
| Impact domain models | `vault_core/domain/impact.py` | 1-174 |
| Deterministic analytics engine | `vault_core/analytics/impact.py` | 1-686 |
| AI summary service | `vault_core/analytics/impact_ai.py` | 1-451 |
| Schema migration (Impact) | `vault_core/database/migrations/20.surrealql` | 1-105 |
| Migration system | `vault_core/database/async_migrate.py` | 1-274 |
| Seed script | `scripts/seed_impact_demo.py` | 1-360 |
| Frontend seeded demo | `frontend/src/lib/impact/demo-data.ts` | 1-820 |
| Fallback hooks | `frontend/src/lib/hooks/use-impact.ts` | 1-688 |
| API client | `frontend/src/lib/api/impact.ts` | 1-416 |
| Types/TS | `frontend/src/lib/types/impact.ts` | 1-529 |
| Landing page | `frontend/src/components/landing/ImpactLandingPage.tsx` | 1-92 |
| Landing copy | `frontend/src/lib/landing/impact-copy.ts` | 1-145 |
| Schools router (with auth) | `api/routers/schools.py` | 1-886 |
| Permissions module | `api/permissions.py` | 1-241 |
| Epsilon school domain | `vault_core/domain/school.py` | 1-140 |
| Study domain (review loop) | `vault_core/domain/study.py` | 1-320 |
| Impact API tests | `tests/test_impact_api.py` | 1-513 |
| Impact analytics tests | `tests/test_impact_analytics.py` | 1-1156 |
| Schools API tests | `tests/test_schools_api.py` | 1-754 |
| NGINX config | `deploy/nginx/impact-standalone.conf` | 1-98 |
| API systemd service | `deploy/systemd/vault-api.service` | 1-58 |
| Frontend systemd service | `deploy/systemd/vault-frontend.service` | 1-24 |
| Data Track Strategy | `docs/data/zimlearngraph_ai4i_data_track_strategy.md` | 1-274 |
| Epsilon school design | `docs/architecture/vault_epsilon_school_primitives_design.md` | (exists) |
| Study review design | `docs/architecture/vault_study_review_persistence_design.md` | (exists) |

---

## 9. RecordId Risk Detail Map

| Location | Pattern | Risk |
|----------|---------|------|
| `impact.py:1999` | `InterventionRecommendationResponse(**i)` | 🔴 **Confirmed bug** — wrong model type |
| `impact.py:1926-1928` | `WHERE assessment_id IN $ids` (bare strings) | 🟡 String vs RecordId mismatch |
| `impact.py:2062, 2069, 2076` | `WHERE assessment_id = $assessment_id` (bare string) | 🟡 String vs RecordId mismatch |
| `impact.py:2280, 2287` | `WHERE school_id = $school_id` (bare string) | 🟡 String vs RecordId mismatch |
| `impact.py:2295-2297` | `WHERE assessment_id IN $ids` (bare strings) | 🟡 String vs RecordId mismatch |
| `impact.py:1373-1387` | `_build_thing_conditions()` uses `type::thing()` | 🟢 Correct (but may hit query length limits) |
| `impact.py:1414-1417` | Dashboard queries use `type::thing()` | 🟢 Correct |
| `impact.py:1442-1447` | Dashboard marks query uses `type::thing()` | 🟢 Correct |
| Domain models everywhere | `school_id: str` field type for RecordId FKs | 🟡 Pydantic may reject RecordId objects |
| `_ensure_prefixed` (60+ call sites) | String prefix manipulation | 🟢 Low risk individually, brittle in aggregate |

---

## 10. Two-School-System Risk

The codebase has **two independent school data models** that share no data, no foreign keys, and no auth:

| Feature | Impact (Impact Intelligence) | Epsilon (Vault Schools) |
|---------|----------------------------|------------------------|
| Table | `impact_school` | `school` |
| Migration | 20 | 17 |
| Router | `/api/impact/schools` (no auth) | `/api/schools` (with auth) |
| Domain model | `ImpactSchool` | `School` |
| Frontend area | `/(impact)/impact/schools` | `/(dashboard)/owner/schools` |
| Auth | None | `require_global_owner()` |
| Purpose | Assessment analytics | School management |

**Risk:** A school enrolled in Epsilon has no corresponding Impact school. A school with Impact data has no Epsilon membership. There is no mapping or synchronization between them. This means the "school dashboard" in Impact Intelligence cannot leverage the Epsilon auth/permission system for data isolation.

---

## 11. Live Product and UX Audit

**Audit target:** `https://zimlearngraph.duckdns.org`
**Method:** fresh browser navigation, accessibility-tree inspection, console inspection, route traversal and source cross-check. Browser Harness was attempted first but its local Chromium process failed readiness diagnostics; Hermes native browser was used as the documented fallback.

### 11.1 Route-level findings

| Route | Live result | Honest classification |
|---|---|---|
| `/impact-intelligence` | Loads with correct ZimLearnGraph title and a polished dark editorial composition | Operational public landing, but content accuracy needs urgent repair |
| `/impact` | Loads 3 seeded schools, weak-topic evidence, recent assessments and 7 active interventions | Seeded demonstration; coherent overview |
| `/impact/schools` | Loads 3 schools with 2 classes each and 60/58/62 learners | Seeded demonstration; clear card-level summary |
| `/impact/classes` | Loads 6 classes | Seeded demonstration; very thin information depth |
| `/impact/assessments` | Loads 6 assessment cards with learner/question/pass/weak-topic statistics | Seeded demonstration; strongest browse surface |
| `/impact/assessments/assess-math-term1` | **Fails with “Assessment not found”** | Broken public demo path; P0 |
| `/impact/school-dashboard` | Loads school selector and five dashboard sections | Seeded demonstration; chart values need accessible text/table equivalents |
| `/impact/schools/school-pilot/report` | **Fails with “Report not found”** | Broken primary CTA; P0 |
| `/impact/ministry-demo` | Redirects to `/impact` | Legacy route only; do not describe as an aggregate ministry product |
| `/owner/*` | Existing internal Vault operator area | Operational but separate from Impact school domain |
| `/teacher/*` | Existing Vault teacher surface | Operational Vault capability, not an Impact-integrated teacher workspace |

### 11.2 Credibility defects

1. **Contradictory and unstable landing metrics (P0):** the visible landing surfaces present mutually inconsistent demo states:
   - top strip: `18 learners`, `3 schools`, `3 assessments`, `6% pass rate`;
   - hero proof points: `30 learners`, `8 questions`, `5 weak topics`;
   - actual seeded platform: `180 learners`, `3 schools`, `6 assessments`;
   - an animated metrics section initially exposes zero values in the accessibility tree.

   The independent browser audit also observed transient top-strip values such as 42, 96 and 180 learners across page loads/animation states. Even if these are animation frames rather than new datasets, the presentation allows users and assistive technology to read them as evidence. Metrics must resolve from one canonical source and expose a stable final value.

   The source confirms one-school legacy copy in `frontend/src/lib/landing/impact-copy.ts`, while the application now uses the newer multi-school seed. This is not cosmetic: it undermines trust in an evidence product.

2. **Unsupported longitudinal claim (P0):** the landing says “Progress is measured over time. Follow-up assessments confirm recovery,” but the current model has no intervention-to-follow-up link or longitudinal outcome workflow. Rephrase as a pilot/roadmap capability until built.

3. **Broken primary evidence CTAs (P0):** assessment cards lead to “Assessment not found,” and the school dashboard’s “View Full Report” CTA leads to “Report not found.” List hooks fall back to seeded entities, but detail/report hooks call backend-only records. When the live API has no matching seeded record, the detail surfaces fail instead of resolving the corresponding fallback object. The same pattern must be audited for analytics and question-detail hooks.

4. **Ambiguous demo labelling (P0):** pages use credible school names and operational language without a persistent, explicit “seeded demonstration data” marker. The landing mentions a live demo but does not consistently distinguish synthetic proof from verified pilot evidence.

5. **Stale dates (P1):** all visible assessments are dated in 2025 while the challenge submission is in July 2026. Historical samples are acceptable if labelled; otherwise they look neglected.

### 11.3 Visual and interaction assessment

#### What works

- The public landing has a distinctive dark, editorial visual system and better narrative rhythm than the product workspace.
- Brand metadata and favicon are now correct.
- Headline and deterministic/advisory-AI principles are strong.
- School and assessment cards communicate practical questions rather than abstract AI jargon.
- Navigation is compact and stable across public Impact routes.

#### What prevents “phenomenal” quality

- **Two visual products:** the landing is cinematic/editorial; internal Impact pages revert to generic card-dashboard patterns. The handoff feels like entering a different product.
- **No visible data confidence system:** quality, readiness, provenance, validation state and missing evidence—the Data Track moat—are absent from the main UI.
- **Thin class view:** class cards do not answer weak topics, curriculum coverage, support status, assessment recency or quality.
- **School dashboard is graph-first rather than evidence-first:** accessible snapshots expose section headings but not the underlying values, interpretation, provenance or next actions.
- **No data steward experience:** imports, validation errors, duplicates, mappings, releases and lineage are not represented.
- **No true Impact teacher workflow:** assessment entry, question-topic mapping, intervention recording and follow-up remain conceptual or split across unrelated Vault surfaces.
- **Generic information architecture:** “Overview / Schools / Classes / Assessments / School Dashboard” describes database objects, not educator jobs or evidence stages.
- **Desktop-first density:** the narrow navbar and card grids need explicit 320px/mobile and low-bandwidth validation.
- **Motion debt:** console shows `THREE.Clock` deprecation. Motion should be reduced on product screens and respect reduced-motion preferences.

### 11.4 Recommended visual direction

Do not rebuild the application shell from scratch. Establish one shared ZimLearnGraph evidence design system:

- **Public vision:** cinematic editorial narrative showing marks → curriculum graph → quality/lineage → aggregate insight → controlled pilot.
- **Product shell:** calm, high-density, evidence-first workspace with persistent context (school, term, data release), quality/readiness status and role-specific navigation.
- **Color semantics:** restrained charcoal/ink base; Zimbabwean mineral/land accents (copper, msasa green, warm maize) used semantically, not decoratively; red reserved for validation/critical support warnings.
- **Typography:** expressive display face only for public storytelling; highly legible data UI type for product surfaces; tabular numerals for metrics.
- **Charts:** every chart paired with plain-language interpretation, source/period, missingness and accessible table/text alternative.
- **Core visual motif:** evidence lineage—small traceable links from source mark to question, curriculum node, signal, intervention and follow-up—not abstract particles.
- **Demo truth badge:** persistent “Seeded demonstration · no learner identities” indicator with a link explaining what is real, simulated, built and planned.

### 11.5 Accessibility and console

- Public route titles and favicon are correct.
- No fatal browser JavaScript errors were observed during the audited route traversal.
- Console warning: `THREE.Clock` is deprecated in favour of `THREE.Timer`.
- School dashboard chart content is not sufficiently represented in the accessibility tree; add textual summaries/data tables and verify WCAG 2.1 AA.
- Track 2 official guidance specifically expects 4.5:1 contrast, 44×44 touch targets, chart descriptions and 320–1920px responsiveness; these should be treated as secondary design quality gates.

## 12. Built, Seeded, Documented, Partial and Missing

### Built and operational

- Next.js standalone public product, FastAPI, SurrealDB, Nginx/systemd deployment.
- Impact entity CRUD APIs and schema for schools, classes, learners, subjects, topics, assessments, questions, marks and interventions.
- Deterministic assessment analytics and tested threshold logic.
- School/ministry-style aggregate endpoints, reports and CSV exports in code.
- Advisory AI summary endpoints with graceful unavailability handling.
- Stable public route shell and direct Nginx static serving.

### Demonstrated with seeded data

- Three schools, six classes, 180 generated learner records, six assessments and aggregate dashboards.
- Weak-topic, support-priority and intervention examples.
- Public school and assessment browsing.
- This is **not verified pilot evidence** and must never be presented as such.

### Exists in documentation but not as an operational product capability

- Fully operational quality score/dashboard and automated remediation workflow.
- AI-readiness ladder surfaced per school/class/assessment.
- Versioned dataset release machinery and complete manifest/checksum workflow.
- Full privacy/consent/access governance workflow.
- Low-connectivity/offline capture and conflict-safe sync.
- Canonical national curriculum graph and standards-inspired exchange layer.
- Intervention-linked follow-up outcomes and longitudinal learning position records.
- District/provincial context and resource evidence.

### Partial

- Intervention lifecycle: records/status exist; assignment, follow-up link and outcome confidence do not.
- Reports/exports: endpoints exist; known RecordId/response-shape risks and missing endpoint tests remain.
- Authentication: Vault/Epsilon RBAC exists; Impact tenancy and school membership integration do not.
- AI layer: generators exist; operational provider availability, evaluation and audit logging are not guaranteed.
- Seed fallback: strong for lists/aggregates; broken for assessment details.
- School/teacher workspaces: Vault surfaces exist but do not form the requested Impact evidence workflow.

### Missing

- Verified school-access/permission evidence.
- Real pilot dataset and pilot evaluation.
- Data steward workspace and ingestion verification queue.
- CSV/XLSX/manual-grid ingestion pipeline with row-level errors and provenance.
- Machine-readable release package with manifest/checksums and load test.
- Curriculum-version/unit/subtopic/competency/prerequisite graph.
- Attendance, resource, teacher continuity and contextual support model.
- Role-isolated multi-school Impact deployment.
- Learner transfer learning-position record.

## 13. Unsafe Claims

Do not claim any of the following without new evidence:

- national approval, Ministry adoption, national deployment or national dataset coverage;
- three real pilot schools or 180 real learners;
- production-grade school tenancy/RBAC for Impact data;
- operational offline-first data capture;
- complete curriculum harmonisation or national curriculum graph;
- longitudinal intervention effectiveness/follow-up evidence;
- causal teacher or school effectiveness conclusions;
- an AI model making reliable high-stakes learner decisions;
- a submission-ready AI dataset merely because schema documents and seeded records exist;
- current landing metrics as verified evidence.

## 14. Precise Implementation Sequence

The deadline is 14 July 2026. Sequence work by official scoring leverage and demo risk—not by visual ambition alone.

### Phase A — Submission integrity and demo repair (P0, immediate)

1. Capture the authenticated application form fields and limits with the applicant.
2. Rewrite the formal proposal into the official 10-page Data Track structure.
3. Obtain/prepare credible school-access evidence, source register and permission status.
4. Fix seeded assessment detail/report fallback and add regression tests.
5. Replace contradictory/stale landing metrics with one canonical demo disclosure/data source.
6. Remove or relabel unsupported follow-up/longitudinal claims.
7. Repair the known school-report intervention response/RecordId paths and add endpoint tests.

### Phase B — Official handover evidence slice (P0)

1. Package a safe `v0.1-demo` release with structured metadata, dictionary CSV, schema, sample records, manifest/checksums, validation report and governance files.
2. Add an executable load/validation test proving machine-readability without manual cleanup.
3. Build deterministic Quality Index v1 and AI Readiness Ladder v1 as versioned libraries/specifications, with unit tests.
4. Surface a compact quality/readiness/seeded-data panel in the existing demo—no broad redesign yet.

### Phase C — Ingestion prototype and pilot evidence loop (P0/P1)

1. Implement a narrow CSV/XLSX assessment import flow: upload → map → validate → preview errors → human confirm → ingest/release.
2. Never silently discard invalid rows; preserve source filename, row number, validation result and correction history.
3. Add one curriculum mapping workflow for three pilot subjects.
4. Add intervention-to-follow-up linkage and deterministic improvement evidence.
5. Pilot low-bandwidth strategy: downloadable templates and resumable local queue before advanced sync.

### Phase D — Coherent product redesign (P1)

1. Freeze a shared evidence design system and information architecture.
2. Rebuild, in order: public vision → product shell → school workspace → assessment evidence workspace → teacher workflow → data steward workflow.
3. Replace “School Dashboard” with role/job-oriented navigation and contextual school/term/release selection.
4. Add accessible chart summaries, data tables, lineage drawers, quality/readiness indicators and persistent demo disclosure.
5. Validate at 320, 768, 1280 and 1920px; WCAG 2.1 AA; reduced motion; low-bandwidth mode.

### Phase E — Pilot and scale foundations (P1/P2)

1. Integrate Impact schools with membership/RBAC and tenant-scoped APIs before real multi-school data.
2. Extend canonical curriculum, context/resource and lineage models through focused migrations.
3. Add release registry/export controls and aggregate Regional Insights—never league tables.
4. Introduce learner transfer Learning Position Record only after privacy/access rules are proven.

### Explicitly defer (P3)

- national assessment bank/window claims;
- full national curriculum harmonisation;
- causal instructional-effectiveness scoring;
- national learner portability deployment;
- advanced research/AI training releases using real learner data.

---

*End of audit.*
