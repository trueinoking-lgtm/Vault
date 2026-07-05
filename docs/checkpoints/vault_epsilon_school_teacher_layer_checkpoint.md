# Epsilon — School/Teacher Layer Completion Checkpoint

**Commit range:** `63396c8` → `99fe731`
**Branch:** `main`
**Date:** 2026-07-05

## Completed Epsilon Capabilities

### School & User Foundation

- **Dormant school/user/class schema** — `vault_core/database/migrations/` (migrations 17, 18): school, membership, classroom, enrollment, assignment tables with proper SurrealDB `record<>` references
- **Dormant school/user scoping fields** — Schema includes `school_id` on user records, `notebook_id` on assignments, `user_id` on study/review events (tenancy not yet enforced in learner APIs)
- **Session auth coexistence** — `api/auth.py`: dual-mode password + session token auth, `get_or_create_owner_user()` bootstraps first owner on login
- **School/class permission guards** — `api/permissions.py`: role hierarchy (global owner → school owner → teacher → learner), `check_classroom_access()` resolver, `require_school_role()` / `require_teacher_or_owner()` decorators

### Owner Management UI (Phase D)

- **School management UI** — `/owner/schools`: List schools, create (name, slug, description, active), edit
- **School detail UI** — `/owner/schools/[id]`: Members tab (list, create, edit role/active), Classrooms tab (list, create, edit)
- **Classroom enrollment/assignment UI** — `/owner/schools/[id]/classrooms/[classroomId]`: Enrollments tab (list, create, deactivate), Assignments tab (list, create, deactivate)

### Teacher Read-Model Backend (Phase E2)

- **4 read-model endpoints** in `api/routers/teacher.py`:
  - `GET /api/teacher/classes` — List accessible classrooms with progress summaries
  - `GET /api/teacher/classes/{classroom_id}` — Aggregate progress for one classroom
  - `GET /api/teacher/classes/{classroom_id}/learners` — Per-learner progress (safe fields only)
  - `GET /api/teacher/classes/{classroom_id}/activity` — Recent review event feed (metadata only)

### Teacher Dashboard Shell (Phase E3)

- **Dashboard shell** — `/teacher` route with greeting, quick stats (class count, learner count), start-of-day guidance
- **i18n** — 14 locale keys for teacher dashboard strings

### Teacher Classroom Overview UI (Phase E4)

- **Classroom overview** — `/teacher/classes/[id]`: learner progress table, aggregate counters, metadata-only activity feed
- **Semantic fix (E4b)** — `needs_practice` counts use the Delta weak-spot heuristic; tests for distinct needs_review vs needs_practice semantics (11 new tests)
- **Activity feed fix (E4c)** — SurrealDB 2.x named parameter bug fixed (`$0`/`$1` → `$nid_{index}`)

### Delta/Epsilon Stabilization (E4c runtime fix)

- **LeafReviewState upsert fix** — `repo_upsert()` target corrected from bare `note_fresh_note` to `leaf_review_state:note_fresh_note`; datetime fields changed from string to `datetime` objects
- **6 new repository-level tests** covering upsert target, flag correctness, review_count increment, idempotency

## Completed Routes

| Route | Description | Phase |
|-------|-------------|-------|
| `/owner/schools` | School list with create/edit | D1 |
| `/owner/schools/[id]` | School detail with Members & Classrooms tabs | D2a |
| `/owner/schools/[id]/classrooms/[classroomId]` | Classroom detail with Enrollments & Assignments tabs | D2b |
| `/teacher` | Teacher dashboard shell | E3 |
| `/teacher/classes/[id]` | Teacher classroom overview UI | E4 |

## Completed Backend Endpoints

### School CRUD & Relationships

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/schools` | List schools |
| `POST` | `/api/schools` | Create school |
| `GET` | `/api/schools/{school_id}` | Get school detail |
| `PUT` | `/api/schools/{school_id}` | Update school |
| `DELETE` | `/api/schools/{school_id}` | Delete school |
| `GET` | `/api/schools/{school_id}/members` | List school members |
| `POST` | `/api/schools/{school_id}/members` | Add school member |
| `PUT` | `/api/schools/{school_id}/members/{member_id}` | Update member role |
| `DELETE` | `/api/schools/{school_id}/members/{member_id}` | Remove member |
| `GET` | `/api/schools/{school_id}/classrooms` | List classrooms |
| `POST` | `/api/schools/{school_id}/classrooms` | Create classroom |
| `PUT` | `/api/schools/{school_id}/classrooms/{classroom_id}` | Update classroom |
| `DELETE` | `/api/schools/{school_id}/classrooms/{classroom_id}` | Delete classroom |
| `GET` | `/api/schools/{school_id}/classrooms/{classroom_id}/enrollments` | List enrollments |
| `POST` | `/api/schools/{school_id}/classrooms/{classroom_id}/enrollments` | Enroll learner |
| `PATCH` | `/api/schools/{school_id}/classrooms/{classroom_id}/enrollments/{enrollment_id}` | Deactivate enrollment |
| `GET` | `/api/schools/{school_id}/classrooms/{classroom_id}/assignments` | List assignments |
| `POST` | `/api/schools/{school_id}/classrooms/{classroom_id}/assignments` | Assign notebook |
| `PATCH` | `/api/schools/{school_id}/classrooms/{classroom_id}/assignments/{assignment_id}` | Deactivate assignment |

### Teacher Read-Model Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/teacher/classes` | List classrooms with progress summaries |
| `GET` | `/api/teacher/classes/{classroom_id}` | Aggregate class progress |
| `GET` | `/api/teacher/classes/{classroom_id}/learners` | Per-learner progress (safe fields) |
| `GET` | `/api/teacher/classes/{classroom_id}/activity` | Metadata-only activity feed |

### Session Auth Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/login` | Password login → session token |
| `POST` | `/api/auth/logout` | Invalidate session |
| `GET` | `/api/auth/me` | Current user info + roles |

## Permission Model

The permission hierarchy is implemented in `api/permissions.py` and enforced across all school/teacher endpoints.

### Role Hierarchy

| Role | Scope | Rights |
|------|-------|--------|
| **Global owner** | All schools | CRUD any school, member, classroom; full teacher/learner impersonation via API |
| **School owner** | Own schools | Manage school details, members, classrooms, enrollments, assignments |
| **Teacher** | Assigned classrooms | View classroom progress, learner summaries, activity feed |
| **Learner** | Own enrollments | (Not yet routed — no learner portal) |
| **Unauthenticated** | None | 401 on all school/teacher/study endpoints |

### Enforcement Points

- `require_school_role(school_id, [roles])` — checks user is a member of the given school with one of the listed roles
- `require_teacher_or_owner(classroom_id)` — resolves classroom → school, checks teacher or school/global ownership
- `check_classroom_access(classroom_id, user)` — returns classroom + school + role info for per-request scope checks
- `get_current_user` dependency (FastAPI) — extracts user + roles from session token or password header

## Privacy Guarantees

| Concern | Guarantee |
|---------|-----------|
| **Reflection text** | No check-yourself reflection text is persisted or exposed via any teacher/owner endpoint |
| **Source full_text** | Never included in teacher dashboard payloads |
| **Grades / rankings** | No grades, rankings, psychometric scores, or AI diagnosis exposed |
| **Activity feed** | Metadata-only: event_type, timestamp, note_id, learner_id (when available); no note content |
| **Auth data** | No password hashes, tokens, or session info in read-model responses |
| **User scoping gap** | When `user_id` is null on study/review records, `data_status: "limited_user_scoping"` is signalled |

## Important Stabilization Fixes

### CI Test Isolation & Coverage Rename

- `51332da` — School permission tests isolated from database dependency; test runner targets renamed from `open_notebook` to `vault_core`

### Repository RecordID Normalization

- `bf07b31` / `a44af0b` — `ensure_record_refs()` normalizes string record references to SurrealDB `RecordID` objects across `repo_create`, `repo_insert`, `repo_update`, and `repo_upsert` for keys ending in `_id` or `_by`

### Teacher Activity Endpoint SurrealDB Parameter Naming

- `f3a887f` — SurrealDB 2.x forbids positional `$0`, `$1` query parameters; fixed to named `$nid_{index}` parameters

### LeafReviewState Upsert Fix

- `99fe731` — Two bugs corrected:
  1. **Wrong upsert target**: `UPSERT leaf_review_state:note_<key>` (not bare table `note_<key>`)
  2. **Datetime format**: `last_event_at` and `updated` fields changed from `strftime` strings to `datetime` objects to match schema `TYPE datetime`

## Current Learner/Teacher Memory Semantics

### needs_review_leaf_count

- **Source:** `leaf_review_state` table (denormalized per-leaf state, updated by `upsert_from_event()`)
- **Counts** items where `needs_review = true`
- **Cleared by** `remembered` event type

### needs_practice_leaf_count

- **Source:** Delta weak-spot heuristic computed from `leaf_review_event` history (event-store pattern, not denormalized)
- **Weak spot definition** (all three required):
  - At least 2 `needs_review` events for the same note
  - No later `remembered` event
  - Latest `needs_review` event is at least 1 hour old

## Owner Setup Flow

```
1. Login first time      → / (bootstraps owner user via get_or_create_owner_user())
2. Create School         → /owner/schools (create dialog)
3. Add Members           → /owner/schools/[id] (Members tab)
4. Create Classroom      → /owner/schools/[id] (Classrooms tab)
5. Enroll Learners       → /owner/schools/[id]/classrooms/[classroomId] (Enrollments tab)
6. Assign Notebooks      → /owner/schools/[id]/classrooms/[classroomId] (Assignments tab)
```

The owner needs pre-existing `user` records for members and pre-existing notebooks for assignments. No user/library picker is available yet.

## Deferred Items

| Item | Reason | Suggested Phase |
|------|--------|-----------------|
| **User picker** for member/enrollment creation | No user search/browse UI | Epsilon E5+ |
| **Library/notebook picker** for assignment creation | No notebook search/browse UI | Epsilon E5+ |
| **Teacher sidebar / frontend role router** | No route-level role detection in frontend | Epsilon E5 |
| **Learner portal** | Learner-facing class views and progress | Epsilon F |
| **Learner progress detail page** | Per-learner detailed progress view | Epsilon E5 |
| **Full tenant filtering on learner/study/library APIs** | Row-level school scoping on GET endpoints | Epsilon F |
| **HttpOnly cookie auth hardening** | Current session is localStorage token | Phase F / Production |
| **Configurable weak-spot thresholds** | Hours, event count, cooldown are hardcoded | Future |
| **opened/listened event logging** | Currently only `needs_review` and `remembered` logged | Future |
| **Production deployment polish** | Docker, CI/CD, env config | Phase F |

## Validation

| Suite | Result |
|-------|--------|
| Backend tests (`tests/`) | **355/355 passed** |
| Frontend tests (`frontend/`) | **57/57 passed** |
| Frontend build (`npm run build`) | **Clean** |
| Scrub check (`open_notebook` naming) | **README attribution only** |
| Working tree | **Clean** |

### Runtime Smoke Highlights (Post-Fix)

- `POST /api/study/leaf-events` with `needs_review` → 200, creates both `leaf_review_event` and correct `leaf_review_state`
- `GET /api/study/review-queue` → returns items with `needs_review=True`, `review_count` incrementing
- `remembered` event → clears `needs_review` flag, increments count
- Teacher `GET /api/teacher/classes` → non-zero `needs_review_leaf_count` when events exist
- Teacher `needs_practice_leaf_count` ≤ `needs_review_leaf_count` (heuristic + cooldown)
- All 4 teacher read-model endpoints → 200 OK
- Activity feed → metadata-only (no content/reflection leaks)

## Commit History (School/Teacher Layer)

```
99fe731 vault: fix leaf review state upsert
f3a887f vault: fix teacher activity endpoint SurrealDB parameter naming
944be1d vault: align teacher needs-practice counts
2d16227 vault: add teacher classroom overview
499a897 vault: add teacher dashboard shell
d5be9d1 vault: add teacher class progress read models
51332da test: isolate school permission tests in CI
77c7e49 docs: design teacher progress read model
63396c8 docs: checkpoint Epsilon owner admin shell
635bf25 vault: add owner classroom enrollment and assignment shell
a44af0b test: cover repository record reference normalization
bf07b31 vault: add owner school detail management shell
92bdc27 vault: fix session auth user record handling
b1ab28a vault: add session auth coexistence
99c9f7b vault: add school/class permission guards
07157b5 vault: add school CRUD endpoints
```

## Next Recommended Options

| Option | Description | Effort |
|--------|-------------|--------|
| **A — Learner progress detail (E5)** | Per-learner UI showing review states, weak spots, activity timeline | Medium |
| **B — Frontend role router + teacher nav** | Route-level role detection, teacher sidebar navigation | Medium |
| **C — User/library picker polish** | Search/browse UI for members and notebook assignments | Large |
| **D — Deployment verification & release checkpoint** | Docker, env config, production readiness audit | Medium |
