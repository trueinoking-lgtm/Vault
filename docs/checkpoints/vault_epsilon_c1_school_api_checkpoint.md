# Vault Epsilon C1 — School / Classroom API Checkpoint

**Date:** 2026-07-05
**Git ref:** `7125889` (Epsilon B2 — dormant scoping fields)

## What Was Built

Backend API endpoints for basic school/class primitives. This phase is **API-only** — no frontend UI, no tenancy enforcement, no auth wiring.

### Endpoints Added

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/schools` | POST | Create a school |
| `/api/schools` | GET | List schools (with `?active=` and `?order_by=` filters) |
| `/api/schools/{school_id}` | GET | Get a single school |
| `/api/schools/{school_id}` | PATCH | Update school fields (name, slug, description, settings, active) |
| `/api/schools/{school_id}/members` | POST | Add a member (user_id + role: owner/teacher/learner) |
| `/api/schools/{school_id}/members` | GET | List members (with `?role=` and `?active=` filters) |
| `/api/schools/{school_id}/members/{membership_id}` | PATCH | Update membership role or active status |
| `/api/schools/{school_id}/classrooms` | POST | Create a classroom |
| `/api/schools/{school_id}/classrooms` | GET | List classrooms in a school |
| `/api/classrooms/{classroom_id}` | GET | Get a single classroom |
| `/api/classrooms/{classroom_id}` | PATCH | Update classroom fields |
| `/api/classrooms/{classroom_id}/enrollments` | POST | Enroll a learner |
| `/api/classrooms/{classroom_id}/enrollments` | GET | List enrollments |
| `/api/classrooms/{classroom_id}/enrollments/{enrollment_id}` | DELETE | Soft-deactivate enrollment |
| `/api/classrooms/{classroom_id}/assignments` | POST | Assign a notebook to a classroom |
| `/api/classrooms/{classroom_id}/assignments` | GET | List assignments |
| `/api/classrooms/{classroom_id}/assignments/{assignment_id}` | DELETE | Soft-deactivate assignment |

### Files Changed

- `api/routers/schools.py` — new router (all endpoints)
- `api/models.py` — Pydantic models for all school/class entities
- `api/main.py` — registered the router
- `tests/test_schools_api.py` — 28 test cases (mocked domain models)

### Pydantic Models Added

- `SchoolCreate`, `SchoolUpdate`, `SchoolResponse`
- `SchoolMembershipCreate`, `SchoolMembershipUpdate`, `SchoolMembershipResponse`
- `ClassroomCreate`, `ClassroomUpdate`, `ClassroomResponse`
- `ClassEnrollmentCreate`, `ClassEnrollmentResponse`
- `ClassroomAssignmentCreate`, `ClassroomAssignmentResponse`

## What Was NOT Done (Deferred)

- **Role enforcement** (Epsilon C2): All endpoints currently allow any authenticated request. `TODO(Epsilon C2)` markers left in code.
- **Login/register/session behavior** (Epsilon C): Current `PasswordAuthMiddleware` unchanged.
- **Tenancy enforcement** (Epsilon C3): No query filtering by `school_id` or `user_id`.
- **Teacher dashboard UI** (Epsilon E): No frontend changes.
- **School management frontend** (Epsilon D): No frontend changes.
- **New migrations**: None. Epsilon B1 migration 17 already created the tables. Epsilon B2 migration 18 added scoping fields.

## Validation

- `uv run python -m pytest tests/` — **all passed**
- `cd frontend && npm test` — **57/57 passed**
- `cd frontend && npm run build` — **clean**
- Scrub check — only README attribution matches

## Next Phase

**Epsilon C2:** Add role verification dependencies that check the caller's `school_membership` before allowing school/class operations.
