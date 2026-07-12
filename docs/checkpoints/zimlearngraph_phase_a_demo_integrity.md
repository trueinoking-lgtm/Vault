# ZimLearnGraph Phase A — Demo Integrity Checkpoint

**Date:** 2026-07-12  
**Scope:** P0 submission integrity and judge-facing demo repair  
**Stable reference preserved:** `zimlearngraph-public-demo-stable-v0.4`  
**Production build:** `51WkabTr30slz_M2q3jqW`

## Outcome

Phase A restores one traceable, internally consistent seeded demonstration across the Impact landing page, overview, school dashboards/reports, class learner views, assessment details, assessment reports, and report exports.

Every Impact route now carries the disclosure:

> Seeded multi-school demonstration data. No learner identities. Not verified pilot evidence.

The implementation deliberately does **not** claim verified pilot results, production ingestion, longitudinal improvement, causal diagnosis, teacher effectiveness, Ministry integration, national deployment, or automated learner decisions.

## Canonical seeded baseline

| Measure | Canonical value |
|---|---:|
| Schools | 3 |
| Classes | 6 |
| Learners / learners assessed | 180 |
| Assessments | 6 |
| Questions analysed | 39 |
| Mark data points | 1,166 |
| Average school pass rate | 57% |
| Weak topics | 5 |
| Learner-support signals | 39 |
| Interventions | 8 total / 7 active |

School report totals remain:

- Pilot School — 2 classes, 60 learners, 2 assessments, 50% overall pass rate.
- Mbare High School — 2 classes, 58 learners, 2 assessments, 57% overall pass rate.
- Chitungwiza Central School — 2 classes, 62 learners, 2 assessments, 63% overall pass rate.

## Repairs completed

### Canonical frontend evidence

- Added stable-ID selectors for seeded schools, classes, assessments, assessment analytics, assessment reports, and school reports.
- Corrected assessment analytics so each assessment uses its exact class cohort rather than all learners in the school.
- Added a canonical statistics builder used by the landing page and overview.
- Removed animated zero states from judge-facing counters; canonical values render immediately, including reduced-motion environments.
- Reconciled landing metrics and evidence visual labels with the canonical dataset.

### Fallback and CTA integrity

- Detail and report hooks now preserve populated API data but use the matching seeded entity when APIs fail or return empty payloads.
- All six seeded assessment details and reports resolve by stable ID.
- All three school reports resolve by stable ID.
- All six seeded class learner routes resolve by stable ID.
- Report CSV exports now generate locally from the displayed report, so seeded export actions do not depend on missing backend records.
- Removed unsupported public mutation/export controls where their backend-only behavior could fail against seeded records.

### Reports and evidence lineage

Assessment reports now expose:

- assessment/class/subject context;
- learner and mark coverage;
- question-level performance;
- topic-level performance and revision priorities;
- learner-support priorities;
- recommended interventions;
- seeded-data disclosure and limitations.

School reports now expose:

- school totals and class pass-rate evidence;
- assessments and subjects;
- weak topics and support indicators;
- interventions;
- dataset readiness, mapping completeness, disclosure, and limitations.

Evidence remains traceable through the intended chain:

`assessment → question → curriculum topic → support signal → intervention → intended follow-up evidence`

### Backend RecordID boundary

- Added strict typed response models for school and assessment reports.
- Added recursive normalization of SurrealDB `RecordID` values at the API response boundary.
- Preserved typed record references inside database/query logic.
- Updated report foreign-key comparisons to use `type::thing(...)`.
- Fixed school-report intervention conversion before response validation.
- Kept FastAPI `response_model` validation enabled on both report routes.

### Truthful public language

- Replaced risk/ranking-style public labels with learner-support language.
- Qualified follow-up and improvement claims as intended, illustrative, and teacher-verified.
- Kept teacher judgement primary and AI advisory-only.
- Removed the expired temporary i18n cache-bust marker after its one-day operational use; no `Clear-Site-Data` behavior was introduced.

## Verification evidence

### Automated tests

| Gate | Result |
|---|---|
| Full backend test suite | **469 passed**; 4 existing deprecation/mock warnings |
| Full frontend test suite | **116 passed** across 15 files |
| Focused Phase A frontend tests | **8 passed** |
| Focused Impact backend tests | **71 passed** |
| Production Next.js build / TypeScript | **Passed** |
| `git diff --check` | **Passed** |

### Deployment

Deployment used only `scripts/deploy_vault_frontend_standalone.sh --restart-systemd --smoke`, after explicitly stopping the systemd unit to avoid its `Restart=always` race while the standalone directory was rebuilt.

- Production build ID: `51WkabTr30slz_M2q3jqW`
- `vault-frontend.service`: active
- Frontend `127.0.0.1:3003`: listening
- FastAPI `127.0.0.1:5055`: listening
- AetherLink `127.0.0.1:3002`: listening and untouched
- Deployment smoke suite: all checks passed
- Public Impact landing stress check: **100/100 HTTP 200**
- Canonical route matrix: **27/27 HTTP 200**

### Hydrated browser verification

Hydrated browser checks confirmed:

- canonical landing values `3 / 6 / 180 / 57% / 39 / 1,166` render without transient zeroes;
- persistent seeded-demo disclosure is present;
- all six assessment details render;
- all six assessment reports render populated evidence;
- all three school reports render populated evidence;
- representative class learner view renders its exact class cohort;
- school report includes subjects, weak topics, support indicators, interventions, readiness, disclosure, and limitations;
- assessment report includes question/topic lineage, learner-support priorities, interventions, disclosure, and limitations;
- local report CSV action completes without browser errors;
- final inspected pages reported zero console messages, zero JavaScript errors, and zero failed Next.js resources.

## Boundaries deliberately retained

- This remains seeded demonstration evidence, not verified pilot evidence.
- Learner codes are synthetic/pseudonymous; no real learner identities are represented.
- Support signals require teacher verification and are not diagnoses or automated decisions.
- Follow-up and longitudinal improvement remain future pilot evidence requirements.
- No visual-overhaul or national-scale feature work was included in Phase A.
- No Nginx, systemd, SurrealDB, FastAPI topology, AetherLink, or port changes were made.
