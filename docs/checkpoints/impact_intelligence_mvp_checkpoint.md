# Impact Intelligence — MVP Checkpoint

**Date:** 2026-07-06
**Version:** MVP 1.0 (Pilot Ready)
**Status:** ✅ FROZEN — No new application features will be added to this checkpoint.

---

## Commits Included

| Commit | Phase | Description |
|--------|-------|-------------|
| `446f8ed` | Phase 1 | Data model + CRUD backend |
| `a527d9a` | Phase 2 | Analytics engine + thresholds |
| `bf23da6` | Phase 3 | Frontend module shell + routes |
| `2da21ba` | Phase 4 | Teacher assessment workflow |
| `ea8993f` | Phase 5 | School + ministry dashboards |
| `87b1e13` | Phase 6 | Demo seed data |
| `ea8993f` | Phase 7 | Reports + CSV export + print |
| `4d016b5` | Phase 7 | Impact reports (amended) |
| `7782ef4` | Phase 8 | AI summaries |
| `a2375c9` | Phase 8.5 | Hardening + demo runbook |

---

## Feature List

### Core Features (Deterministic — No AI Required)

- [x] School management (CRUD)
- [x] Class management (CRUD)
- [x] Learner management (CRUD with codes)
- [x] Subject management (CRUD)
- [x] Topic management (CRUD)
- [x] Assessment management (CRUD)
- [x] Question mapping with topic assignment
- [x] Mark entry grid with validation
- [x] Deterministic analytics engine
- [x] Class average, pass rate, failure rate calculation
- [x] Weak topic detection (threshold: <55%)
- [x] Critical topic detection (threshold: <40%)
- [x] Critical question detection (threshold: <35%)
- [x] Learner risk detection (high: <40%, medium: <pass_mark)
- [x] Intervention recommendation generation

### Dashboard Features

- [x] Teacher assessment dashboard (5 tabs)
- [x] School impact dashboard (aggregated)
- [x] Ministry demo dashboard (aggregate only)
- [x] Classes needing support
- [x] Topics needing revision
- [x] Intervention priority view

### Export & Report Features

- [x] CSV export of marks
- [x] CSV export of analytics
- [x] CSV export of school report
- [x] Print-friendly assessment report
- [x] Print-friendly school report
- [x] Browser Print → Save as PDF

### AI Features (Optional — Advisory Only)

- [x] Teacher summary generation
- [x] Intervention plan generation
- [x] Remedial lesson outline generation
- [x] Manual generation buttons (no auto-trigger)
- [x] 30-second timeout
- [x] Graceful fallback when AI unavailable

### Demo & Data

- [x] Demo seed data (Pilot School, Form 1A, Mathematics)
- [x] Reset script (`scripts/reset_impact_demo.py`)
- [x] Seed script (`scripts/seed_impact_demo.py`)
- [x] Demo runbook (`docs/operations/impact_intelligence_demo_runbook.md`)

---

## Routes Added

### Frontend Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/impact` | ImpactHome | Main landing page |
| `/impact/schools` | SchoolSetup | School management |
| `/impact/classes` | ClassSetup | Class management |
| `/impact/subjects` | SubjectTopicSetup | Subject/topic management |
| `/impact/assessments` | AssessmentSetup | Assessment list |
| `/impact/assessments/[id]` | AssessmentDetail | 5-tab workflow page |
| `/impact/assessments/[id]/report` | AssessmentReport | Print-friendly report |
| `/impact/schools/[id]/report` | SchoolReport | Print-friendly report |
| `/impact/school-dashboard` | SchoolDashboard | School analytics |
| `/impact/ministry-demo` | MinistryDemo | Ministry view |

### Backend Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/impact/schools` | List/create schools |
| GET/PUT/DELETE | `/api/impact/schools/{id}` | Get/update/delete school |
| GET/POST | `/api/impact/classes` | List/create class groups |
| GET/PUT/DELETE | `/api/impact/classes/{id}` | Get/update/delete class |
| GET/POST | `/api/impact/learners` | List/create learners |
| GET/PUT/DELETE | `/api/impact/learners/{id}` | Get/update/delete learner |
| GET/POST | `/api/impact/subjects` | List/create subjects |
| GET/PUT/DELETE | `/api/impact/subjects/{id}` | Get/update/delete subject |
| GET/POST | `/api/impact/topics` | List/create topics |
| GET/PUT/DELETE | `/api/impact/topics/{id}` | Get/update/delete topic |
| GET/POST | `/api/impact/assessments` | List/create assessments |
| GET/PUT/DELETE | `/api/impact/assessments/{id}` | Get/update/delete assessment |
| GET | `/api/impact/assessments/{id}/analytics` | Get assessment analytics |
| GET/POST | `/api/impact/assessments/{id}/questions` | List/create questions |
| GET/PUT/DELETE | `/api/impact/questions/{id}` | Get/update/delete question |
| GET/POST | `/api/impact/mark-entries` | List/create marks |
| GET/PUT/DELETE | `/api/impact/mark-entries/{id}` | Get/update/delete mark |
| GET/POST | `/api/impact/interventions` | List/create interventions |
| GET/PUT/DELETE | `/api/impact/interventions/{id}` | Get/update/delete intervention |
| GET | `/api/impact/dashboards/school/{id}` | School dashboard |
| GET | `/api/impact/dashboards/ministry` | Ministry dashboard |
| GET | `/api/impact/reports/assessment/{id}` | Assessment report data |
| GET | `/api/impact/reports/school/{id}` | School report data |
| GET | `/api/impact/assessments/{id}/export/marks` | CSV marks export |
| GET | `/api/impact/assessments/{id}/export/analytics` | CSV analytics export |
| GET | `/api/impact/schools/{id}/export/report` | CSV school report |
| GET | `/api/impact/assessments/{id}/ai/teacher-summary` | AI teacher summary |
| GET | `/api/impact/assessments/{id}/ai/intervention-plan` | AI intervention plan |
| GET | `/api/impact/assessments/{id}/ai/remedial-lesson` | AI remedial lesson |

---

## Scripts Added

| Script | Description |
|--------|-------------|
| `scripts/seed_impact_demo.py` | Seed demo data |
| `scripts/reset_impact_demo.py` | Reset demo data |

---

## Key Files

### Backend Core
- `vault_core/domain/impact.py` — 10 domain models
- `vault_core/database/migrations/20.surrealql` — Migration
- `vault_core/analytics/impact.py` — Deterministic analytics engine
- `vault_core/analytics/impact_ai.py` — AI summary service
- `api/routers/impact.py` — All CRUD + analytics + report + export + AI endpoints
- `api/models.py` — Pydantic schemas

### Frontend Core
- `frontend/src/lib/types/impact.ts` — TypeScript types
- `frontend/src/lib/api/impact.ts` — API client
- `frontend/src/lib/hooks/use-impact.ts` — React Query hooks
- `frontend/src/components/impact/AISummaryPanel.tsx` — AI summary UI
- `frontend/src/components/impact/InterventionPanel.tsx` — Interventions UI
- `frontend/src/components/impact/MarkEntryGrid.tsx` — Mark entry grid
- `frontend/src/components/impact/QuestionMapBuilder.tsx` — Question mapping UI

---

## Reports & Export Features

### CSV Exports
- **Marks CSV**: Learner × question grid with totals, percentages, pass/fail
- **Analytics CSV**: Summary + question performance + topic performance + learner performance
- **School Report CSV**: School summary + pass rates by class + interventions

### Print Reports
- **Assessment Report**: Full analytics in print-friendly layout
- **School Report**: School overview with class breakdowns
- Method: Browser Print → Save as PDF (MVP approach)

---

## AI Summary Behavior

### Trigger
- **Manual only** — User clicks "Generate" button
- No auto-trigger on page load (cost safety)

### Timeout
- 30-second timeout for all AI requests
- On timeout: "AI summary timed out" message shown

### Failure
- No AI provider: "AI summaries are unavailable. Assessment analytics are still available."
- Error during generation: Fallback content shown
- No provider/model details exposed in UI

### Privacy
- Learner codes only (L001, L002) sent to AI provider
- Full student names not included in prompts

### Labeling
- AI output labeled as "Generated explanation" or "Fallback content"
- Source tag shows whether content is AI-generated or fallback

---

## Validation Commands

Run these to verify the checkout:

```bash
# Backend tests
python -m pytest tests/test_impact_api.py -v
python -m pytest tests/test_impact_analytics.py -v

# Frontend tests
cd frontend && npm test

# Frontend build
cd frontend && npm run build

# Python syntax check
python -m py_compile api/routers/impact.py
python -m py_compile vault_core/analytics/impact_ai.py

# Seed data
python scripts/reset_impact_demo.py
python scripts/seed_impact_demo.py
```

### Last Known Test Results
- Backend impact API tests: 20/20 ✅
- Backend analytics tests: 34/34 ✅
- Frontend tests: 108/108 ✅
- Frontend build: ✅ (31 routes)

---

## Known Limitations

### Functional
- Not a full LMS — no lesson planning, gradebook, attendance, timetabling
- No parent portal
- No auto-marking
- Single-school focus for MVP

### Technical
- No offline mode
- No mobile app (responsive web only)
- CSV uses comma separators (may need explicit import settings)
- PDF via browser print (not server-side)
- Single SurrealDB instance (backup managed separately)

### AI
- AI summaries are advisory only
- Quality depends on configured provider/model
- Provider/model details hidden from teacher UI

### Data
- Learner codes recommended (not full names)
- Manual data entry (no bulk CSV import yet)
- No real-time updates (refresh required)

---

## Next Recommended Roadmap

### Short Term (Post-Pilot)
1. **Bulk import** — CSV import for learners, questions, marks
2. **Multi-class assessment** — Same assessment across multiple classes
3. **Longitudinal tracking** — Compare assessments over time
4. **Multiple subjects** — Cross-subject analytics

### Medium Term
5. **Multi-school administration** — District-level dashboards
6. **Parent portal** — Individual learner reports for parents
7. **Teacher collaboration** — Multiple teachers per assessment
8. **Curriculum alignment** — Map topics to national curriculum standards

### Long Term
9. **Ministry integration** — Data pipelines for ministry reporting
10. **Auto-marking** — MCQ scan-to-import
11. **District aggregation** — Aggregate across schools/districts
12. **National benchmarks** — Compare against national averages

---

## Commercial Docs

- `docs/commercial/impact_intelligence_pitch.md`
- `docs/commercial/impact_intelligence_pilot_offer.md`
- `docs/commercial/impact_intelligence_school_data_template.md`
- `docs/commercial/impact_intelligence_teacher_walkthrough.md`
- `docs/commercial/impact_intelligence_limitations.md`
- `docs/commercial/impact_intelligence_demo_script.md`
- `docs/operations/impact_intelligence_demo_runbook.md`
