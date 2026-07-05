# Vault Epsilon C4 — Permission Guards Checkpoint

**Date:** 2026-07-05
**Git ref:** `764c025` (HEAD — Epsilon C3a bootstrap session auth)

## What Was Built

Backend permission enforcement for all school/class API endpoints, using the new user/session model from C3a. Legacy `VAULT_OWNER_PASSWORD` resolves to the global-owner User record, so owner-level access works the same for both session-based and password-based callers.

### Permission Helper Layer

New file: `api/permissions.py`

| Function | Purpose |
|----------|---------|
| `get_current_user(request)` | Resolve user from session token or env password |
| `require_global_owner(user)` | Raise 401/403 if user is None or not global owner |
| `check_school_role(school_id, user, min_role)` | Verify user has at least *min_role* at school |
| `check_classroom_access(classroom_id, user, min_role)` | Verify user can access a classroom's school; also checks classroom teacher specifically |
| `check_membership_belongs_to_school(membership_id, school_id, user)` | Verify membership record exists at the given school |

### Endpoint Protection Matrix

| Endpoint | Required Role | Behavior |
|----------|--------------|----------|
| `POST /api/schools` | Global owner | Create school |
| `GET /api/schools` | Global owner | List all schools (member-scoped deferred) |
| `GET /api/schools/{id}` | School member (≥learner) | Get school |
| `PATCH /api/schools/{id}` | School owner | Update school |
| `POST /api/schools/{id}/members` | School owner | Add member |
| `GET /api/schools/{id}/members` | School owner | List members |
| `PATCH /api/schools/{id}/members/{mid}` | School owner | Update/soft-delete member |
| `POST /api/schools/{id}/classrooms` | Teacher at school | Create classroom |
| `GET /api/schools/{id}/classrooms` | School member | List classrooms |
| `GET /api/classrooms/{id}` | School member | Get classroom |
| `PATCH /api/classrooms/{id}` | Teacher or school owner | Update classroom |
| `POST /api/classrooms/{id}/enrollments` | Teacher | Enroll learner |
| `GET /api/classrooms/{id}/enrollments` | Teacher | List enrollments |
| `DELETE /api/classrooms/{id}/enrollments/{eid}` | Teacher | Deactivate enrollment |
| `POST /api/classrooms/{id}/assignments` | Teacher | Assign notebook |
| `GET /api/classrooms/{id}/assignments` | School member | List assignments |
| `DELETE /api/classrooms/{id}/assignments/{aid}` | Teacher | Deactivate assignment |

### Role Hierarchy

```
Global owner  →  passes all checks automatically
School owner  →  full school management
Teacher       →  classroom management (create/update/enroll/assign)
Learner       →  read-only access to school/class info
```

### User Resolution for Legacy Passwords

| Password Type | Resolves To | Effective Role |
|---------------|------------|---------------|
| `VAULT_OWNER_PASSWORD` | Global-owner User (`is_global_owner=true`) | Full access |
| `VAULT_PASSWORD` | Legacy User (`is_global_owner=false`) | Member-level (depends on school_membership) |

### Files Changed

| File | Status | Description |
|------|--------|-------------|
| `api/permissions.py` | **Created** | Permission helper functions |
| `api/routers/schools.py` | Modified | All endpoints now call permission checks |
| `tests/test_schools_api.py` | **Rewritten** | 29 tests covering CRUD + permission scenarios |
| `docs/checkpoints/vault_epsilon_c4_permission_guards_checkpoint.md` | **Created** | This file |

## What Is Still NOT Enforced

- **Learner/study/library API tenancy:** `GET /api/notebooks`, `POST /api/study/sessions`, etc. are unchanged. No `WHERE user_id = $current_user` filtering.
- **Member-scoped school listing:** `GET /api/schools` still requires global owner. Users who are members of schools but not global owners cannot list their schools.
- **Learner enrollment-based assignment listing:** `GET /api/classrooms/{id}/assignments` requires school member access, not enrolled-learner access.
- **Frontend route protection:** `/owner/*` and login pages unchanged.
- **Teacher dashboard:** No class-progress read model.

## Known Limitations

1. `GET /api/schools` is global-owner-only. School members cannot see their own schools via this endpoint (needs membership-based filtering, deferred).
2. `check_classroom_access` with `min_role="teacher"` checks both school-level role and the specific classroom teacher assignment. This is correct but the SQL query for teacher resolution adds latency.
3. Legacy `VAULT_PASSWORD` callers who also have a `school_membership` record will resolve to a non-owner User and gain the permissions their membership grants. This is correct but may surprise deployments that expect "just the password" to have less access.

## Validation

- `uv run python -m pytest tests/` — **307/307 passed**
- `cd frontend && npm test` — **57/57 passed**
- `cd frontend && npm run build` — **clean**
- Scrub check — only README attribution matches
