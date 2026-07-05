# Vault E2.1 Checkpoint — Classroom Assignment Foundation

> **Date:** 2026-07-05
> **Tag:** `vault-g3-stable` (E2.1 applied on top)

---

## Goal

Add the smallest safe assignment foundation so a teacher can assign a Vault learning object to a class, and learners can see assigned work.

## Scope

### In scope
- Backend schema/model for classroom assignments with target types
- Backend API for teachers/owners to create/list assignments
- Backend API for learners to list their assigned work
- Basic assignment completion tracking
- Minimal frontend teacher UI to create/list assignments
- Minimal frontend learner UI showing assigned work
- Tests for permissions and privacy boundaries
- i18n keys for assignment-related strings

### Not in scope (deferred to E2.2+)
- Full grading
- Adaptive learning
- School analytics dashboards
- Parent/admin workflows
- Notification systems
- Due-date reminders
- Richer assignment target picker
- Assignment detail page
- Teacher completion dashboard
- Due-date sorting/filtering
- Review-queue integration
- Weak-spot intervention suggestions

---

## Schema Changes

### Migration 19

**classroom_assignment** — expanded with new fields:
- `target_type`: `"material"` | `"leaf"` | `"notebook"` (optional)
- `target_id`: string (optional)
- `title`: string (optional)
- `instructions`: string (optional)
- `due_at`: datetime (optional)
- `archived_at`: datetime (optional)
- `notebook_id`: now optional (backward compatible)

**assignment_progress** — new table:
- `assignment_id`: record<classroom_assignment>
- `classroom_id`: record<classroom>
- `learner_id`: record<school_membership>
- `status`: `"not_started"` | `"completed"`
- `completed_at`: datetime (optional)
- `created` / `updated`: auto timestamps
- Unique index on `(assignment_id, learner_id)`

---

## API Endpoints

### Teacher/Owner endpoints (existing, enhanced)
- `POST /api/classrooms/{classroom_id}/assignments` — create assignment (now supports target_type, target_id, title, instructions, due_at)
- `GET /api/classrooms/{classroom_id}/assignments` — list assignments
- `DELETE /api/classrooms/{classroom_id}/assignments/{assignment_id}` — deactivate

### Learner endpoints (new)
- `GET /api/assignments` — list assigned work across enrolled classrooms
- `POST /api/assignments/{assignment_id}/complete` — mark assignment completed

---

## Permission Model

| Action | Global Owner | Teacher (own class) | Learner (enrolled) | Other |
|--------|-------------|--------------------|--------------------|-------|
| Create assignment | ✅ | ✅ | ❌ 403 | ❌ 403 |
| List classroom assignments | ✅ | ✅ | ✅ | ❌ 403 |
| Deactivate assignment | ✅ | ✅ | ❌ 403 | ❌ 403 |
| List my assignments | ✅ | ✅ | ✅ (own only) | ❌ 401 |
| Mark complete | ✅ | ✅ | ✅ (own only) | ❌ 403 |

---

## Privacy Boundaries

- Learner assignment response (`LearnerAssignmentResponse`) contains ONLY:
  - Assignment metadata (title, type, target, due date)
  - Progress status (not_started/completed)
  - No private reflection text
  - No AI diagnosis
  - No grades or rankings
  - No hidden learner-only content
- Teacher sees aggregate completion signals only
- Teacher does NOT see individual learner reflection text

---

## Files Changed

### Backend
| File | Change |
|------|--------|
| `vault_core/database/migrations/19.surrealql` | **New** — expand assignments, create progress table |
| `vault_core/database/migrations/19_down.surrealql` | **New** — rollback migration |
| `vault_core/database/async_migrate.py` | Register migration 19 |
| `vault_core/domain/school.py` | Expand ClassroomAssignment, add AssignmentProgress |
| `api/models.py` | Add AssignmentProgress*, LearnerAssignment*, update ClassroomAssignment* |
| `api/routers/schools.py` | Add learner endpoints, update create_assignment |

### Frontend
| File | Change |
|------|--------|
| `frontend/src/lib/types/api.ts` | Add progress/learner assignment types |
| `frontend/src/lib/api/schools.ts` | Add listMyAssignments, markAssignmentComplete |
| `frontend/src/lib/api/query-client.ts` | Add myAssignments query key |
| `frontend/src/lib/hooks/use-learner-assignments.ts` | **New** — learner hooks |
| `frontend/src/components/teacher/TeacherAssignmentsSection.tsx` | **New** — teacher UI |
| `frontend/src/components/learner/LearnerAssignmentsSection.tsx` | **New** — learner UI |
| `frontend/src/app/(dashboard)/teacher/classes/[id]/page.tsx` | Add assignments section |
| `frontend/src/app/(dashboard)/vault/page.tsx` | Add learner assignments section |
| `frontend/src/lib/locales/*/index.ts` | Add assignment i18n keys (all 14 locales) |

### Tests
| File | Change |
|------|--------|
| `tests/test_classroom_assignments.py` | **New** — 11 permission/privacy tests |
| `tests/test_school_domain.py` | Update assignment repr test, add target fields test |
| `tests/test_schools_api.py` | Update mock data for expanded assignment model |

---

## Tests Added

### Backend (11 new)
- teacher can create assignment for own classroom
- owner can create assignment
- unauthenticated user rejected
- learner cannot create assignment
- enrolled learner sees assigned work
- unenrolled learner sees nothing
- unauthenticated learner rejected
- learner can mark own complete
- unenrolled learner rejected from marking complete
- learner response has no private fields (privacy)

### Frontend
- Locale parity test passes (all 14 locales have assignment keys)
- Sidebar behavior unchanged (existing tests pass)

---

## Validation Results

| Check | Result |
|-------|--------|
| Backend tests (pytest) | ✅ 392/392 |
| Frontend tests (npm test) | ✅ 81/81 |
| Frontend build (npm build) | ✅ Passed |
| Scrub | ✅ 0 matches |

---

## Known Follow-ups for E2.2

- Richer assignment target picker (browse materials/leaves)
- Assignment detail page
- Teacher completion dashboard with per-learner status
- Due-date sorting/filtering
- Review-queue integration
- Weak-spot intervention suggestions
- Classroom name resolution in learner assignment list
- Bulk assignment creation

---

> **Last updated:** 2026-07-05
