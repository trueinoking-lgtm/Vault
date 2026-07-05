# Epsilon E2 — Teacher Class Progress Read-Model Checkpoint

**Commit range:** `51332da` → `[pending]`
**Branch:** `main`
**Date:** 2026-07-05

## Completed

### New File

`api/routers/teacher.py` — read-only teacher class progress endpoints.

### Endpoints Added

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/teacher/classes` | List accessible classrooms with progress summaries |
| `GET` | `/api/teacher/classes/{classroom_id}` | Aggregate progress for one classroom |
| `GET` | `/api/teacher/classes/{classroom_id}/learners` | Per-learner progress (safe fields only) |
| `GET` | `/api/teacher/classes/{classroom_id}/activity` | Recent review event feed (metadata only) |

### Read Models Added

- `TeacherClassSummary` — classroom row in teacher's class list
- `ClassProgressSummary` — aggregate counters for one classroom
- `LearnerProgressSummary` — per-learner safe fields (no reflection text)
- `ClassActivityEntry` — single review event (metadata only)

### Permission Behavior

| User role | `/api/teacher/classes` | Classroom detail endpoints |
|-----------|----------------------|---------------------------|
| Global owner | All classrooms | All classrooms |
| School owner | Classrooms in owned schools | Own school's classrooms |
| Teacher | Own classrooms | Own classrooms |
| Learner | Empty list (`[]`) | 403 via `check_classroom_access` |
| Unauthenticated | 401 | 401 |

### Privacy Safeguards

- **No reflection text:** `LearnerProgressSummary` and `ClassActivityEntry` never include `content`, `full_text`, or note body fields
- **No auth data:** No password hashes, tokens, or session info
- **No unrelated libraries:** Queries scoped to `classroom_assignment.notebook_id`
- **No ranking:** Endpoints return lists without sort-by-progress
- **No AI diagnosis:** No psychometric or diagnostic fields
- **Limited user scoping:** When `user_id` is null on study/review records, `data_status: "limited_user_scoping"` is returned and per-learner counts omit user_id filtering

### Data Availability for Missing User Scoping

When `leaf_review_event.user_id` and `study_session.user_id` are null (tenancy not yet enforced):
- Class-wide aggregates are computed notebook-scoped (via assignments)
- `data_status: "limited_user_scoping"` is set on the summary
- Per-learner counts fall back to notebook-scoped values (same for all learners in a class)
- Activity feed shows `learner_id: null` for events without user attribution

### Tests Added

`tests/test_teacher_api.py` — 14 tests, all unit-style (no SurrealDB required):

| Test | What it verifies |
|------|-----------------|
| `test_global_owner_can_list` | Global owner sees all classrooms with summaries |
| `test_unauthenticated_gets_401` (list) | No user → 401 |
| `test_learner_gets_403` | Learner → empty list (no classrooms) |
| `test_empty_list_when_no_classes` | No accessible classrooms → `[]` |
| `test_returns_class_summary` | Teacher sees own classroom summary |
| `test_returns_404_for_missing` | Non-existent classroom → 404 |
| `test_unauthenticated_gets_401` (progress) | No user → 401 |
| `test_returns_learner_summaries` | Per-learner safe fields, display names resolved |
| `test_returns_empty_list_when_no_enrollments` | No enrollments → `[]` |
| `test_unauthenticated_gets_401` (learners) | No user → 401 |
| `test_returns_activity_feed` | Events with metadata, learner_id null when missing |
| `test_returns_empty_when_no_assignments` | No assignments → `[]` |
| `test_unauthenticated_gets_401` (activity) | No user → 401 |
| `test_teacher_cannot_access_another_teachers_class` | Mocked `check_classroom_access` raises 403 |

### Validation

| Suite | Result |
|-------|--------|
| `tests/test_teacher_api.py` (no SurrealDB) | **14/14 passed** |
| `uv run python -m pytest tests/` | **338/338 passed** |
| `cd frontend && npm test` | **57/57 passed** |
| `cd frontend && npm run build` | **Clean** |
| Scrub check | ✅ README attribution only |

### Migrations Added

**None.** All endpoints are read-only over existing schema and data.

## Remaining for Epsilon E3–E5

| Phase | What | Status |
|-------|------|--------|
| E3 | Teacher dashboard route shell + sidebar | Pending |
| E4 | Classroom overview UI | Pending |
| E5 | Learner progress detail (optional) | Pending |
