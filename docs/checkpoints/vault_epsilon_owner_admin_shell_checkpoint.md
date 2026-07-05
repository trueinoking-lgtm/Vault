# Epsilon D — Owner Admin Shell Checkpoint

**Commit range:** `07157b5` → `635bf25`
**Branch:** `main`

## Completed Capabilities

### Routes

| Route | Description | Phase |
|-------|-------------|-------|
| `/owner/schools` | School list with create/edit | D1 |
| `/owner/schools/[id]` | School detail with Members & Classrooms tabs | D2a |
| `/owner/schools/[id]/classrooms/[classroomId]` | Classroom detail with Enrollments & Assignments tabs | D2b |

### UI Capabilities

| Feature | Actions | Phase |
|---------|---------|-------|
| **Schools** | List, create, edit (name, slug, description, active) | D1 |
| **Members** | List, create (user_id + role), edit (role, active) | D2a |
| **Classrooms** | List, create (teacher_id + name + subject + grade), edit (name, subject, grade, active) | D2a |
| **Enrollments** | List, create (learner_id), deactivate | D2b |
| **Assignments** | List, create (notebook_id + assigned_by), deactivate | D2b |

### Backend/API Foundation

- **School/class APIs:** `api/routers/schools.py` — CRUD for schools, memberships, classrooms, enrollments, assignments
- **Permission guards:** `api/permissions.py` — role checks (global owner, school owner, teacher, learner)
- **Session auth coexistence:** `api/auth.py` — dual-mode password + session token auth
- **Repository RecordID normalization:** `vault_core/database/repository.py` — `ensure_record_refs()` normalizes string record references to SurrealDB `RecordID` objects across `repo_create`, `repo_insert`, `repo_update`, and `repo_upsert`

### Test & Build Status

| Suite | Count |
|-------|-------|
| Backend tests | 324/324 passed |
| Frontend tests | 57/57 passed |
| Frontend build | Clean |
| Scrub check | README attribution only |
| Working tree | Clean |

## Current Owner Setup Flow

```
1. Create School          → /owner/schools (create dialog)
2. Add Members            → /owner/schools/[id] (Members tab)
3. Create Classroom       → /owner/schools/[id] (Classrooms tab)
4. Enroll Learners        → /owner/schools/[id]/classrooms/[classroomId] (Enrollments tab)
5. Assign Notebooks       → /owner/schools/[id]/classrooms/[classroomId] (Assignments tab)
```

The flow assumes the owner already has:
- A `user` record (bootstrapped on first owner login via `get_or_create_owner_user()`)
- The user's ID for creating memberships
- Notebooks in the system for assignments

## What Remains Intentionally Deferred

| Feature | Reason | Target |
|---------|--------|--------|
| User picker | No user search/browse UI | Future Epsilon |
| Library/notebook picker | No notebook search/browse UI | Future Epsilon |
| Teacher dashboard | Full teacher-facing views | Epsilon E1 |
| Learner portal | Learner-facing class views | Epsilon F |
| Class progress read model | Analytics / completion tracking | Epsilon E |
| Tenant filtering on learner APIs | Row-level school scoping | Epsilon E |
| Full production auth hardening | HttpOnly cookies, CSP, CSRF | Phase F |

## Known Technical Note

`ensure_record_refs()` in `vault_core/database/repository.py` currently normalizes string values for keys ending in `_id` or `_by` (e.g. `user_id`, `school_id`, `assigned_by`). Future SurrealDB schema fields typed as `record<xxx>` with keys ending in other suffixes will need explicit handling or schema-aware normalization.

## Commit History (Owner Admin Shell)

```
635bf25 vault: add owner classroom enrollment and assignment shell
a44af0b test: cover repository record reference normalization
bf07b31 vault: add owner school detail management shell
92bdc27 vault: fix session auth user record handling
0d1d45a vault: fix migration 16 UNIQUE syntax for SurrealDB compatibility
07157b5 vault: add owner school management shell
4142ede vault: add school API permission guards
764c025 vault: add bootstrap session auth
feac519 vault: add school and classroom APIs
7125889 vault: add dormant school scoping fields
```

## Next Recommended Phase

**Epsilon E1 — Teacher dashboard / class progress read model design doc**

1. Design the teacher-facing view model (what data does a teacher see for their classes?)
2. Design the class progress read model (aggregations, metrics, completion tracking)
3. Design tenant-filtered queries for learner/study/library APIs
4. Document before implementing to align the data model with UI needs
