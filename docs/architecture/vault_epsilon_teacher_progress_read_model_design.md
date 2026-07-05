# Vault Epsilon E1 — Teacher Progress Read Model Design

**Phase:** Epsilon E1 (design only)
**Status:** Draft
**Date:** 2026-07-05
**Git ref:** `63396c8` (HEAD — Epsilon D owner admin shell checkpoint)

---

## 1. Current State

### What Exists

- **Owner admin shell** (Epsilon D): `/owner/schools`, `/owner/schools/[id]`, `/owner/schools/[id]/classrooms/[classroomId]`
- **School/class APIs:** CRUD for schools, memberships, classrooms, enrollments, assignments — all permission-protected
- **Session auth:** Dual-mode password + session token coexistence
- **Permission guards:** Global owner, school owner, teacher, learner roles
- **Delta learner loop:** Study sessions (`study_session`), review events (`leaf_review_event`), review state (`leaf_review_state`)
- **Dormant scoping fields:** `school_id`, `user_id`, `created_by` on notebooks, sources, notes, study sessions — nullable, no tenancy enforcement

### What Does Not Exist

- **Teacher-facing views:** No dashboard, no class progress, no learner activity
- **Progress read models:** No aggregation endpoints for class-wide review data
- **Tenant filtering:** No row-level school scoping on learner/study/library queries
- **Teacher API endpoints:** No `/api/teacher/*` routes

---

## 2. Problem Statement

Teachers who manage classrooms in Vault have no visibility into learner activity. They can:

- See who is enrolled in their classes
- See what notebooks are assigned

But they cannot:

- See how many learners have started studying
- See which materials need the most practice
- Identify learners who are struggling
- Get a class-wide progress summary

Without these views, the classroom features are administrative shells — useful for setup but not for day-to-day teaching.

---

## 3. Goals (v1)

1. Provide teachers with a **read-only dashboard** showing class-level progress aggregates
2. Show **learner-level activity summaries** without exposing private reflection content
3. Use existing study/event/state data — no new learner-tracking infrastructure
4. Enforce **permission boundaries** so teachers see only their own classrooms
5. Keep the v1 dashboard **intentionally modest** — dashboards are easy to over-scope

---

## 4. Non-Goals (v1)

- ❌ Exposing typed check-yourself reflection text
- ❌ AI-generated diagnosis or recommendations
- ❌ High-stakes grades or scoring
- ❌ Automatic ranking of learners (no leaderboards)
- ❌ Psychometric scoring or engagement scoring
- ❌ Parent/guardian portal
- ❌ Real-time streaming updates (polling or refresh-button only)
- ❌ Writing new event types or review signals
- ❌ Tenant filtering on learner/study/library queries (deferred to Epsilon E)

---

## 5. Teacher Permission Boundaries

| Role | Can view |
|------|----------|
| **Global owner** | All schools, all classrooms, all progress data |
| **School owner** | Own school's classrooms and progress |
| **Teacher** | Own classrooms only (where `school_membership.role = 'teacher'` and membership links to classroom) |
| **Learner** | Cannot access `/api/teacher/*` endpoints at all |

Enforcement follows the existing `check_classroom_access()` pattern in `api/permissions.py`:

- `get_current_user(request)` → resolve user from session token
- `check_school_role(school_id, user, "owner")` → global/school owners pass
- `check_classroom_access(classroom_id, user, "teacher")` → teachers of that classroom pass

---

## 6. Learner Privacy Boundaries

### Safe Aggregate Fields (teachers may see)

| Field | Source | Description |
|-------|--------|-------------|
| `learner_count` | Count of active `class_enrollment` records | Total enrolled learners |
| `active_learner_count` | Learners with ≥1 study session in last N days | Recently active |
| `assigned_library_count` | Count of active `classroom_assignment` records | Notebooks assigned |
| `recent_study_sessions_count` | `study_session` in last 7 days for all enrolled learners | Class study volume |
| `needs_practice_leaf_count` | `leaf_review_state` where `needs_review = true` AND weak-spot heuristic triggers | Cross-class practice need |
| `needs_review_leaf_count` | `leaf_review_state` where `needs_review = true` | Raw review queue count |
| `remembered_leaf_count` | `leaf_review_event` where `event_type = 'remembered'` in last 7 days | Recent success count |
| `last_activity_timestamp` | Max `leaf_review_event.created` across all enrolled learners | Most recent class activity |

### Safe Learner-Level Fields (teachers may see)

| Field | Source | Description |
|-------|--------|-------------|
| `learner_id` | `school_membership.id` | Stable membership identifier |
| `user_id` | `school_membership.user_id` | User record reference |
| `display_name` | `user.display_name` | Learner's chosen name |
| `enrollment_status` | `class_enrollment.active` | Active or deactivated |
| `needs_practice_count` | Count of their notes with weak-spot = true | Practice burden |
| `recent_activity_at` | Max of their `leaf_review_event.created` | Last touch timestamp |
| `completed_leaf_count` | Count of `remembered` events | Rough completion proxy |

### Fields Teachers Must NOT See

- ❌ Raw check-yourself text (`note.content` where `note.note_type = 'check'`)
- ❌ Private notes not assigned to class (notes on notebooks the learner wasn't assigned)
- ❌ Unrelated personal libraries (notebooks not linked to the class)
- ❌ Auth/session info (password hash, session tokens)
- ❌ Other learner's data outside their class
- ❌ Event metadata that contains reflection content

---

## 7. Proposed Read Models

### `ClassProgressSummary`

```
{
  classroom_id: str
  classroom_name: str
  subject: str | null
  grade_level: str | null
  learner_count: int
  active_learner_count: int
  assigned_library_count: int
  recent_study_sessions_count: int
  needs_practice_leaf_count: int
  needs_review_leaf_count: int
  remembered_leaf_count: int
  last_activity_at: str | null
}
```

### `LearnerProgressSummary`

```
{
  learner_id: str
  user_id: str
  display_name: str | null
  enrollment_active: bool
  needs_practice_count: int
  recent_activity_at: str | null
  completed_leaf_count: int
}
```

### `ClassActivityEntry`

```
{
  event_id: str
  learner_id: str
  note_id: str
  notebook_id: str
  event_type: str
  created: str
}
```

---

## 8. Proposed API Endpoints

### Teacher endpoints (all under `/api/teacher/*`)

| Method | Endpoint | Returns | Permission |
|--------|----------|---------|------------|
| `GET` | `/api/teacher/classes` | `List[ClassProgressSummary]` | Teacher (own), School owner (own school), Global owner (all) |
| `GET` | `/api/teacher/classes/{classroom_id}` | `ClassProgressSummary` | Teacher (own classroom), School/Global owner |
| `GET` | `/api/teacher/classes/{classroom_id}/learners` | `List[LearnerProgressSummary]` | Teacher (own classroom), School/Global owner |
| `GET` | `/api/teacher/classes/{classroom_id}/activity` | `List[ClassActivityEntry]` | Teacher (own classroom), School/Global owner |

These endpoints are **read-only**. No teacher can modify data through these routes.

### Implementation notes for each endpoint

**`GET /api/teacher/classes`**
1. Resolve user from session
2. If global owner → return all classrooms with summaries
3. If school owner → find all classrooms in owned schools
4. If teacher → find all classrooms where user has teacher role
5. For each classroom, compute aggregate counts from study data

**`GET /api/teacher/classes/{classroom_id}/learners`**
1. Verify access via `check_classroom_access(classroom_id, user, "teacher")`
2. Fetch active enrollments for the classroom
3. For each enrolled membership, resolve user record and query their `leaf_review_state` and `leaf_review_event` counts
4. Return per-learner summary — no personal note content

**`GET /api/teacher/classes/{classroom_id}/activity`**
1. Verify access
2. Query `leaf_review_event` for all enrolled learners, scoped to assigned notebooks
3. Return event log (event_type, timestamp, note_id) — no content

---

## 9. Proposed Frontend Surfaces

### Teacher Class List (`/teacher`)

Simple list of classrooms the teacher has access to, showing:

- Classroom name + subject + grade
- Learner count / active learner count
- Needs-practice count (aggregate)
- Last activity timestamp

### Classroom Overview (`/teacher/classes/[id]`)

Tabbed or sectioned view:

1. **Overview tab:** Class summary stats (counts, charts placeholder)
2. **Learners tab:** Per-learner progress table (name, needs-practice count, last activity)
3. **Materials tab:** Assigned notebooks with links
4. **Activity tab:** Recent review event feed

### Learner Activity Summary (`/teacher/classes/[id]/learners/[learner_id]`)

Optional drill-down, only if the aggregate view is insufficient for v1.

---

## 10. Data Aggregation Rules

### How assignments connect to progress

```
classroom_assignment.notebook_id ──→ notebook
class_enrollment.learner_id ──→ school_membership ──→ user
study_session.notebook_id ──→ notebook (optionally scoped by user_id)
leaf_review_event.notebook_id ──→ notebook
leaf_review_state.notebook_id ──→ notebook
```

**Aggregation flow:**

1. Find all notebooks assigned to the classroom via `classroom_assignment`
2. Find all enrolled learners via `class_enrollment`
3. For each assigned notebook, query `leaf_review_state` and `leaf_review_event` scoped to:
   - `notebook_id` in the set of assigned notebooks
   - `user_id` in the set of enrolled learner user records
4. Count/aggregate the results

### Needs-practice detection

Reuses the existing weak-spot heuristic from `LeafReviewEvent.compute_weak_spot_for_note()`:

- At least 2 `needs_review` events
- No `remembered` event after the most recent `needs_review`
- Most recent `needs_review` is at least 1 hour old

For class-wide aggregation, this runs across all notes in assigned notebooks for all enrolled learners.

### Activity recency

"Recent" is defined as within the last 7 days for v1. Configurable threshold in later iterations.

### Query efficiency concerns

- Class-wide weak-spot computation on every request may be expensive for large classes
- v1 can compute on-demand with a reasonable timeout
- Future: add a materialized aggregation table or cache layer if needed

---

## 11. Testing Plan

### Backend tests (new `tests/test_teacher_api.py`)

| Test | Description |
|------|-------------|
| `test_global_owner_sees_all_classes` | Global owner can list all classrooms across all schools |
| `test_school_owner_sees_own_school_classes` | School owner sees only their school's classrooms |
| `test_teacher_sees_own_classrooms` | Teacher sees only classrooms where they have teacher role |
| `test_learner_cannot_access_teacher_endpoints` | Learner role gets 403 on `/api/teacher/*` |
| `test_classroom_progress_returns_aggregates` | Summary endpoint returns correct counts for a classroom with data |
| `test_learner_progress_excludes_note_content` | Per-learner endpoint does not return note text |
| `test_inactive_enrollments_excluded_from_counts` | Deactivated enrollments are not counted as active |
| `test_empty_classroom_returns_zero_counts` | Classroom with no learners returns all-zero aggregates |
| `test_activity_endpoint_returns_events_chronological` | Activity feed is sorted newest-first |

### Frontend tests

| Test | Description |
|------|-------------|
| Teacher class list renders correctly | Loading, empty, error, populated states |
| Classroom overview shows summary stats | All aggregate fields displayed |
| Learner list does not expose note content | Only safe fields are rendered |
| Navigation restricted by role | Learner cannot navigate to `/teacher/*` via sidebar or URL |

---

## 12. Rollout Plan

### Epsilon E2: Backend read-model endpoints

- Create `api/routers/teacher.py` with the four proposed endpoints
- Implement aggregation queries using existing `repo_query` and domain models
- Add permission checks using existing `check_classroom_access()`
- Add full test coverage
- **No frontend changes**

### Epsilon E3: Teacher dashboard route shell

- Add `/teacher` and `/teacher/classes/[id]` routes
- Add `TeacherSidebar` or extend existing sidebar with teacher links
- Add navigation/route guard for teacher role
- Stub pages with "coming soon" content
- **No progress data yet — just navigation**

### Epsilon E4: Classroom overview UI

- Implement classroom overview page with aggregate stats
- Implement learner progress list
- Add activity feed
- Wire to E2 backend endpoints
- **Learner-level drill-down deferred to E5 if needed**

### Epsilon E5: Learner progress detail (optional)

- Add `/teacher/classes/[id]/learners/[learner_id]` route
- Show per-learner practice data, recent activity, weak spots
- **Only if E4 shows teachers need the depth**

---

## 13. Rollback Plan

| Layer | Rollback action |
|-------|----------------|
| **Backend endpoints** | Remove `api/routers/teacher.py` import from `api/main.py`. Existing tests revert to previous count. |
| **Frontend routes** | Remove `/teacher` route directory. Remove sidebar links. No compilation impact on other pages. |
| **Permissions** | No new permission logic — only reuses existing guards. Rollback means routes don't exist, so guards are unreachable. |
| **Data** | Read-only endpoints. No data mutations, no migration to roll back. |

Since all endpoints are **read-only** and use **existing data structures**, there is zero data risk. The rollout is safe at every slice.

---

## 14. Implementation Slices Summary

| Slice | What | Dependencies | Effort estimate |
|-------|------|--------------|-----------------|
| E2 | Backend read-model endpoints | None | Medium |
| E3 | Teacher route shell + sidebar | E2 | Small |
| E4 | Classroom overview UI | E2 + E3 | Medium |
| E5 | Learner progress detail | E4 | Small (may skip) |

Total estimated effort: **2–3 weeks** for all four slices at a comfortable pace.

---

## 15. Open Questions

1. **User-owned notes/libraries before full tenancy:** How do we identify which notebooks belong to which learner before `user_id`/`school_id` filtering is enforced everywhere? 
   - *Proposal:* Start by scoping to notebooks assigned via `classroom_assignment`. Ignore user ownership until tenancy is enforced.

2. **Assigned notebook semantics:** Should assigning a notebook to a classroom clone it, share a reference, or just link?
   - *Current behavior:* `classroom_assignment` creates a link record. The same notebook can be assigned to multiple classrooms. This is a shared-reference model.
   - *Proposal:* Keep the shared-reference model for v1. Cloning can be added later if teachers need per-class customisation.

3. **Learner identity creation:** How will learner user records be created in the owner/teacher UI?
   - *Current state:* The owner shell accepts a raw `user_id` string. There is no user registration flow.
   - *Proposal:* User creation can remain manual (owner adds user IDs) for v1. A registration/onboarding flow is a separate feature.

4. **Session filtering before user_id tenancy:** Currently, `study_session` and `leaf_review_event` have nullable `user_id` fields. Before tenancy enforcement, how do we associate study data with a specific learner?
   - *Proposal:* For v1, infer learner identity from `leaf_review_event.user_id` and `study_session.user_id` where populated. Fall back to `notebook_id`-scoped aggregates (class-wide, not per-learner) when `user_id` is null.

5. **Dashboard refresh strategy:** Polling interval, refresh button, or WebSocket push?
   - *Proposal:* Refresh button + 60-second automatic poll for v1. WebSocket push is a future enhancement.
