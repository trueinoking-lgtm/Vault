# Vault Auth and Permission Model Design

**Phase:** Epsilon C2 (design only)
**Status:** Draft
**Date:** 2026-07-05
**Git ref:** `feac519` (HEAD — Epsilon C1 school APIs)

---

## 1. Current Auth Architecture

### Backend

| Component | Implementation | Notes |
|-----------|---------------|-------|
| **API auth** | `PasswordAuthMiddleware` (Starlette BaseHTTPMiddleware) | Checks `Authorization: Bearer {password}` against `VAULT_PASSWORD` env var. Skips auth when `VAULT_PASSWORD` is unset/empty. |
| **Owner gate** | No backend owner/enforcement. Owner protection is entirely frontend-side. | The `vault-owner-access` HttpOnly cookie is set by the Next.js middleware, not the API. |
| **Auth status** | `GET /api/auth/status` | Returns `{ auth_enabled: bool }`. Used by frontend to decide whether to show login. |
| **User records** | `User` domain model exists (dormant) | Table has `display_name`, `email`, `password_hash`, `is_global_owner`, `active`. No login/register endpoints. |
| **Session records** | `AuthSession` domain model exists (dormant) | Table has `user_id`, `token_hash`, `expires_at`. No session-creation endpoints. |
| **Role records** | `SchoolMembership` domain model exists (dormant) | Only accessible via C1 school APIs. No middleware reads it. |

### Frontend

| Component | Implementation | Notes |
|-----------|---------------|-------|
| **API auth** | Axios interceptor adds `Bearer {token}` | Token is the raw password, stored in Zustand → localStorage. |
| **Owner gate** | Next.js middleware at `src/proxy.ts` | Checks `VAULT_OWNER_PASSWORD` or falls back to API password. Sets `vault-owner-access` HttpOnly cookie. |
| **Auth store** | Zustand `auth-store.ts` | Persists token to localStorage. 30-second checkAuth cache. |
| **Route protection** | `isOwnerProtectedPath()` in `owner-access.ts` | Checks pathname for `/owner/*`, `/admin/*`, `/settings/api-keys`. Redirects to `/login?owner=1` if no cookie. |
| **Login page** | `(auth)/login/` | Two entry points: normal login (prompts for API password) and owner login (`?owner=1` — also sets owner cookie). |

### Key Observation

The current architecture has **two separate auth gates** that operate independently:

1. **API password auth** (`PasswordAuthMiddleware`) — checks every API call. A single shared password. No user identity.
2. **Owner cookie gate** (`frontend/src/proxy.ts`) — protects only `/owner/*` frontend routes. Uses `VAULT_OWNER_PASSWORD` or falls back to the API password.

Both are password-only, user-identity-agnostic, and role-unaware.

---

## 2. Target Auth Behavior

### Principles

1. **Self-hosted simplicity preserved.** A single-user Vault deployment must work identically to today with zero additional configuration.
2. **Gradual adoption.** Schools deploy Vault, create users, and enable auth features incrementally. No big-bang cutover.
3. **Backward compatibility.** Existing single-password deployments auto-migrate. No data loss. No forced reconfiguration.
4. **User identity is the foundation.** Every authenticated request carries a `user_id` that can be used for scoping, even in single-user mode.
5. **Permissions are opt-in.** Adding `SchoolMembership` records activates role checks. Without them, the system behaves exactly as today.

### State Transition

```
  ┌─────────────────────────────────────────────────────────┐
  │   Phase 1: Bootstrap (Epsilon C3)                       │
  │   PasswordAuthMiddleware coexists with new session auth. │
  │   First owner login auto-creates a User record.         │
  │   New login endpoint returns a session token.           │
  └─────────────────────┬───────────────────────────────────┘
                        │
                        ▼
  ┌─────────────────────────────────────────────────────────┐
  │   Phase 2: Dual Mode (Mixed)                            │
  │   PasswordAuthMiddleware accepts both raw password AND  │
  │   session tokens.                                       │
  │   School/class APIs start checking school_membership.   │
  └─────────────────────┬───────────────────────────────────┘
                        │
                        ▼
  ┌─────────────────────────────────────────────────────────┐
  │   Phase 3: Full Role Model (Optional)                   │
  │   PasswordAuthMiddleware deprecated/deactivatable.      │
  │   All APIs check roles.                                 │
  │   Single-user mode uses implicit owner identity.        │
  └─────────────────────────────────────────────────────────┘
```

---

## 3. Migration Constraints

1. **Zero database migrations added.** All required tables (`user`, `auth_session`, `school_membership`) already exist from Epsilon B1. Scoping fields exist from Epsilon B2.
2. **No data loss on rollback.** Every change must be revertible by removing the auth middleware and clearing session records.
3. **PasswordAuthMiddleware must not break** for existing deployments. The `VAULT_PASSWORD` env var continues to work until explicitly disabled.
4. **Owner cookie mechanism unchanged.** The `vault-owner-access` cookie stays as an extra hardening layer until it can be replaced by role-based checks.
5. **No forced registration.** Existing deployments must not require creating user accounts to keep working.

---

## 4. Goals

1. **User identity bootstrap.** Convert the first successful owner login into a persistent `User` record linked to the configured owner password.
2. **Session-based auth.** Replace raw-password-in-every-request with a token returned from a login endpoint.
3. **Role-aware middleware.** FastAPI dependency that extracts `user_id` and `school_membership` from the session token, making them available to route handlers.
4. **Permission boundaries for C1 endpoints.** School/class/membership/enrollment/assignment endpoints check `school_membership.role` before allowing mutations.
5. **Dual-mode operation.** `PasswordAuthMiddleware` continues to accept raw passwords (for backward compatibility) alongside new session tokens.
6. **Owner-route mapping.** Define how existing `/owner/*` routes correspond to roles in the new model.

---

## 5. Non-Goals

1. ❌ **Full tenancy enforcement.** School-scoped query filtering (`WHERE school_id = $current_school`) is deferred to Epsilon C3/C4. This phase adds guards to school/class CRUD endpoints only.
2. ❌ **Learner data isolation.** No `WHERE user_id = $current_user` on notebook/source/note/study queries yet. That is Epsilon C3+.
3. ❌ **Teacher dashboard UI.** Deferred to Epsilon E.
4. ❌ **School management frontend.** Deferred to Epsilon D1.
5. ❌ **Learner portal (`/learn`).** Deferred to Epsilon E.
6. ❌ **Registration flow / forgot password / email verification.** Deferred post-Epsilon.
7. ❌ **SSO / OAuth / LDAP.** Password-based auth remains sufficient for self-hosted schools.
8. ❌ **Per-school AI provider configuration.** Deferred to Epsilon+.
9. ❌ **Changes to Delta learner memory loop.** Study sessions, review events, weak spots unchanged except for future user_id scoping.
10. ❌ **Storing learner reflection text.** The check-yourself textarea remains component-local state.
11. ❌ **Breaking single-user local deployments.** The `VAULT_PASSWORD` env var remains a first-class auth mechanism.

---

## 6. User / Session Model

### 6.1 User Record

The existing `user` table (migration 17) already has the right shape:

```surql
DEFINE TABLE IF NOT EXISTS user SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS display_name ON TABLE user TYPE string;
DEFINE FIELD IF NOT EXISTS email ON TABLE user TYPE string
  ASSERT string::is::email($value);
DEFINE FIELD IF NOT EXISTS password_hash ON TABLE user TYPE string;
DEFINE FIELD IF NOT EXISTS is_global_owner ON TABLE user TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS active ON TABLE user TYPE bool DEFAULT true;
DEFINE FIELD IF NOT EXISTS last_login_at ON TABLE user TYPE option<datetime>;
```

**Bootstrapping the owner user:**

When the API starts and `VAULT_OWNER_PASSWORD` is set (or `VAULT_PASSWORD`), the system checks if any user has `is_global_owner = true`.

- **If no owner user exists:** Create one on the first successful password login. Use `admin@vault.local` as the default email (configurable). Hash the configured password into `password_hash`. Set `is_global_owner = true`.
- **If an owner user already exists:** Normal password validation. Compare the incoming password against the stored hash, or against the env var for backward compatibility.

**Why lazy creation instead of startup migration?**
- Avoids storing a password hash in the database before the admin has completed setup
- Avoids creating a user record for deployments that never use user auth
- The first successful password login is a clear signal that the admin is ready

### 6.2 Session Token

The existing `auth_session` table (migration 17) already has the right shape:

```surql
DEFINE TABLE IF NOT EXISTS auth_session SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS user_id ON TABLE auth_session TYPE record<user>;
DEFINE FIELD IF NOT EXISTS token_hash ON TABLE auth_session TYPE string;
DEFINE FIELD IF NOT EXISTS expires_at ON TABLE auth_session TYPE datetime;
```

**Token format:** A random 64-byte hex string (128 chars). Stored hashed (SHA-256) in the database. The raw token is returned to the client once and never stored again.

**Expiry:** 30 days from creation. Configurable via env var (`VAULT_SESSION_TTL_DAYS`, default 30).

**Storage:** The frontend receives the raw token and stores it in the Zustand auth store (as it currently stores the raw password). The token is sent as `Authorization: Bearer {token}`.

**Logout:** `DELETE /api/auth/session` (or `POST /api/auth/logout`) deletes the session record. Client-side logout clears the token from localStorage.

### 6.3 Auth Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/auth/status` | GET | Returns `{ auth_enabled: bool }` and `{ auth_mode: "password" \| "session" \| "dual" }` | Public |
| `/api/auth/login` | POST | Authenticate with password → returns `{ token, user, expires_at }` | Public |
| `/api/auth/logout` | POST | Invalidate the current session token | Session required |
| `/api/auth/me` | GET | Returns current user profile + active school memberships | Session required |

### 6.4 Dual-Mode Middleware

The `PasswordAuthMiddleware` must evolve to accept **both**:
1. Legacy `Bearer {password}` — validated against `VAULT_PASSWORD` env var
2. Session `Bearer {token}` — validated against `auth_session` table, resolving to a `user_id`

**Detection logic:**
1. Extract the `Authorization` header value
2. Try session lookup first (SHA-256 hash the value, query `auth_session` WHERE `token_hash = $hash` AND `expires_at > now()` AND user.active = true)
3. If session is valid → set `request.user` and `request.memberships`
4. If session is invalid but the password matches `VAULT_PASSWORD` → legacy mode, no `request.user` set (behaves as today)
5. If neither → 401

This ensures existing deployments keep working while new deployments can use sessions.

---

## 7. Role Model

### 7.1 Roles

| Role | Level | Scope | Description |
|------|-------|-------|-------------|
| **Global Owner** | System | All schools, all users | The original Vault admin. Created from `VAULT_OWNER_PASSWORD` or first login. `is_global_owner = true` on the User record. Has unrestricted access to everything. |
| **School Owner** | School | Single school | Has administrative access to one school. Can manage members, classrooms, and school settings. Cannot access other schools or system-level AI config. |
| **Teacher** | School → Classroom | Assigned classrooms | Can create classrooms (within their school), enroll learners, assign notebooks, view class progress. Cannot manage school settings or members. |
| **Learner** | Classroom | Personal | Can view assigned notebooks, study (create sessions, log events), see own review queue and weak spots. Cannot see other learners' data. |

### 7.2 Role Assignment

Roles are assigned via `school_membership`:

```surql
DEFINE FIELD IF NOT EXISTS role ON TABLE school_membership TYPE string
  ASSERT $value INSIDE ["owner", "teacher", "learner"];
```

The `is_global_owner` flag on the `user` table is an **additional** super-admin flag. A `school_membership` with `role = "owner"` is a school-level admin, not a global owner.

**Inheritance:**
- `Global Owner`: `school_membership` role is irrelevant — has full access regardless.
- `School Owner`: Must have at least one `school_membership` WITH `role = "owner"` for the target school.
- `Teacher`: Must have at least one `school_membership` WITH `role = "teacher"` for the target school.
- `Learner`: Must have at least one `school_membership` WITH `role = "learner"` for the target school AND an active `class_enrollment`.

### 7.3 Permission Matrix

| Action | Global Owner | School Owner | Teacher | Learner | Unauthenticated |
|--------|:-----------:|:-----------:|:-------:|:-------:|:---------------:|
| Manage system AI config | ✅ | ❌ | ❌ | ❌ | ❌ |
| View runtime/job monitor | ✅ | ❌ | ❌ | ❌ | ❌ |
| List all schools | ✅ | own school | own school | own school | ❌ |
| Create/delete schools | ✅ | ❌ | ❌ | ❌ | ❌ |
| Update school settings | ✅ | ✅ (own) | ❌ | ❌ | ❌ |
| Add/remove school members | ✅ | ✅ (own) | ❌ | ❌ | ❌ |
| Update member roles | ✅ | ✅ (own) | ❌ | ❌ | ❌ |
| Create/delete classrooms | ✅ | ✅ (own) | ✅ (own school) | ❌ | ❌ |
| Update classroom | ✅ | ✅ (own) | ✅ (own class) | ❌ | ❌ |
| Enroll/unenroll learners | ✅ | ✅ (own) | ✅ (own class) | ❌ | ❌ |
| Assign notebooks | ✅ | ✅ (own) | ✅ (own class) | ❌ | ❌ |
| List assignments | ✅ | ✅ (own) | ✅ (own class) | ✅ (enrolled class) | ❌ |
| View class progress | ✅ | ✅ (own) | ✅ (own class) | ❌ | ❌ |
| View own review queue | ✅ | ✅ | ✅ | ✅ | ❌ |
| Study (create sessions, events) | ✅ | ✅ | ✅ | ✅ | ❌ |
| CRUD notebooks/sources/notes | ✅ | ✅ | ✅ | ✅ | ❌ |

---

## 8. Route Protection Plan

### 8.1 Backend API Route Protection

The protection strategy uses **FastAPI dependencies** that resolve the current user and their memberships from the session token.

```python
# Pseudocode — Future implementation

async def get_current_user(request: Request) -> User:
    """FastAPI dependency: extract user from session token."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401)
    token = auth[len("Bearer "):]
    user = await resolve_session(token)
    if not user:
        raise HTTPException(status_code=401)
    return user

def require_school_role(required_role: str):
    """Factory: return a dependency that checks school membership role."""
    async def dependency(school_id: str, user: User = Depends(get_current_user)):
        if user.is_global_owner:
            return  # Global owners pass all guards
        memberships = await SchoolMembership.get_for_user_and_school(
            user_id=user.id, school_id=school_id
        )
        role_rank = {"owner": 3, "teacher": 2, "learner": 1}
        if not memberships or role_rank.get(memberships[0].role, 0) < role_rank.get(required_role, 0):
            raise HTTPException(status_code=403)
    return dependency
```

**Route-to-dependency mapping:**

| Route Group | Dependency | Notes |
|-------------|-----------|-------|
| `POST/GET/PATCH /api/schools` | Global owner for create/delete; school member for read | Create school is owner-only. Listing returns only caller's schools. |
| `POST/GET /api/schools/{id}/members` | `require_school_role("owner")` for mutations; school member for reads | |
| `PATCH /api/schools/{id}/members/{mid}` | `require_school_role("owner")` | |
| `POST /api/schools/{id}/classrooms` | `require_school_role("teacher")` | Teachers can create classrooms |
| `GET /api/schools/{id}/classrooms` | `require_school_role("learner")` | Any school member can list |
| `GET/PATCH /api/classrooms/{id}` | Class teacher or school owner | |
| `POST/GET /api/classrooms/{id}/enrollments` | `require_school_role("teacher")` for class teacher | |
| `POST/GET /api/classrooms/{id}/assignments` | `require_school_role("teacher")` for class teacher | Learners can read assignments |
| `GET /api/notebooks`, POST /api/notes, etc. | Any authenticated user | No tenancy filtering yet |
| `GET /api/study/review-queue` | Any authenticated user | Future: scoped by user_id |
| `GET /owner/*` (backend) | Global owner only | New backend endpoint group |

### 8.2 Frontend Route Protection

| Frontend Route | Current Protection | Target Protection |
|---------------|-------------------|-------------------|
| `/login` | Public (no check) | Public (no check) |
| `/notebooks` | API password auth | Any authenticated user |
| `/sources`, `/notes` | API password auth | Any authenticated user |
| `/vault` (learner study) | API password auth | Learner or above |
| `/owner` | Owner cookie | Global owner or school owner |
| `/owner/ai` | Owner cookie | Global owner only |
| `/owner/settings` | Owner cookie | Global owner only |
| `/owner/runtime` | Owner cookie | Global owner only |
| `/owner/schools` (future) | — | Global owner or school owner |
| `/owner/schools/{id}` (future) | — | School member with appropriate role |
| `/dashboard` (future teacher) | — | Teacher or above |
| `/learn` (future learner) | — | Learner role assigned |

---

## 9. API Protection Plan

### 9.1 School Endpoints (C1)

| Endpoint | Method | Permission in C2 | Notes |
|----------|--------|-------------------|-------|
| `/api/schools` | POST | Global owner only | Creating a school requires system-level permission |
| `/api/schools` | GET | Any authenticated user (filter to own schools) | Returns only schools where caller has membership |
| `/api/schools/{id}` | GET | School member | 404 if not a member (don't reveal existence) |
| `/api/schools/{id}` | PATCH | School owner or global owner | |
| `/api/schools/{id}/members` | POST | School owner or global owner | |
| `/api/schools/{id}/members` | GET | School member | |
| `/api/schools/{id}/members/{mid}` | PATCH | School owner or global owner | |
| `/api/schools/{id}/classrooms` | POST | School owner or teacher at this school | |
| `/api/schools/{id}/classrooms` | GET | School member | |
| `/api/classrooms/{id}` | GET | School member (enrolled learner, teacher, etc.) | |
| `/api/classrooms/{id}` | PATCH | Class teacher or school owner | |
| `/api/classrooms/{id}/enrollments` | POST | Class teacher or school owner | |
| `/api/classrooms/{id}/enrollments` | GET | Class teacher or school owner | |
| `/api/classrooms/{id}/enrollments/{eid}` | DELETE | Class teacher or school owner | |
| `/api/classrooms/{id}/assignments` | POST | Class teacher or school owner | |
| `/api/classrooms/{id}/assignments` | GET | Enrolled learner or class teacher | Learners see active assignments |
| `/api/classrooms/{id}/assignments/{aid}` | DELETE | Class teacher or school owner | |

### 9.2 Owner Endpoints (future)

A new `owner` API router at `/api/owner/` prefix, protected by a `require_global_owner` dependency:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/owner/schools` | GET | List all schools in the system (superset of per-user listing) |
| `/api/owner/users` | GET | List all registered users |
| `/api/owner/settings` | GET/PATCH | System-level settings (current owner settings page) |
| `/api/owner/ai` | GET/POST | AI provider management (current owner AI page) |
| `/api/owner/runtime` | GET | Job/command monitor (current owner runtime page) |

The existing frontend owner routes (`/owner/*`) will call these endpoints instead of directly calling `/api/settings`, `/api/credentials`, etc.

---

## 10. Frontend Role Routing Plan

### 10.1 Current Frontend Route Structure

```
(app)/
├── (auth)/
│   └── login/                    ← Owner login + normal login
├── (dashboard)/
│   ├── owner/                    ← Protected by owner cookie
│   │   ├── page.tsx              ← Overview
│   │   ├── ai/                   ← AI provider config
│   │   ├── settings/             ← Processing settings
│   │   └── runtime/              ← Job monitor
│   ├── notebooks/
│   ├── sources/
│   ├── search/
│   ├── vault/                    ← Learner study dashboard
│   └── ... (learner routes)
```

### 10.2 Target Route Structure

```
(app)/
├── (auth)/
│   └── login/                    ← Unified login (password + owner)
├── (dashboard)/
│   ├── owner/                    ← Global owner only
│   │   ├── page.tsx              ← Overview
│   │   ├── ai/                   ← AI provider config (global owner only)
│   │   ├── settings/             ← Processing settings (global owner only)
│   │   ├── runtime/              ← Job monitor (global owner only)
│   │   └── schools/              ← School management (Epsilon D1)
│   │       └── [id]/
│   ├── teacher/                  ← Teacher dashboard (Epsilon D2/E)
│   │   ├── dashboard/            ← Class overview
│   │   └── classrooms/[id]/      ← Class detail + progress
│   ├── notebooks/, sources/, ... ← Any authenticated user
│   ├── vault/                    ← Learner dashboard (stays as-is)
│   └── learn/                    ← Future learner portal (Epsilon E)
```

### 10.3 Role Router

A new frontend role router component determines which sidebar and routes a user can see:

```typescript
// Pseudocode
function getEffectiveRole(user: User, memberships: SchoolMembership[]): 'owner' | 'teacher' | 'learner' {
  if (user.is_global_owner) return 'owner'
  const roles = memberships.map(m => m.role)
  if (roles.includes('owner')) return 'owner'  // School owner — can see owner routes for that school
  if (roles.includes('teacher')) return 'teacher'
  return 'learner'
}
```

**Sidebar mapping:**

| Role | Sidebar | Routes Visible |
|------|---------|---------------|
| Global owner | `AdminSidebar` (+ schools nav) | All routes including `/owner/*` and `/teacher/*` |
| School owner | `AdminSidebar` (limited) | Own school management, no system AI/routes |
| Teacher | `TeacherSidebar` | `/teacher/dashboard`, `/teacher/classrooms/*`, learner routes |
| Learner | `LearnerSidebar` (current AppSidebar) | `/notebooks`, `/sources`, `/vault` |

---

## 11. Compatibility Plan for Current Single-Password Mode

### 11.1 Phase 1: Coexistence (Epsilon C3)

**What changes:**
- Add `POST /api/auth/login` endpoint
- Add session token creation on successful password match
- Add `GET /api/auth/me` endpoint
- Keep `PasswordAuthMiddleware` but add session-token detection
- On first login with `VAULT_PASSWORD` or `VAULT_OWNER_PASSWORD`, create a `User` record automatically

**What stays the same:**
- `VAULT_PASSWORD` env var continues to work as a bearer token
- Owner cookie mechanism unchanged
- No role checks deployed yet
- Frontend auth store unchanged (stores whatever token it receives)
- All routes accessible with either raw password or session token

**Detection of mode:**
```
GET /api/auth/status → { auth_enabled: true, auth_mode: "dual", has_owner_user: true }
```

The frontend checks `auth_mode`:
- `"password"` — legacy mode, no user accounts exist yet. Show current login UI.
- `"session"` — full user auth, show login form with optional email.
- `"dual"` — both modes active. Frontend tries session-based login first, falls back to raw password.

### 11.2 Phase 2: Mixed (Epsilon C3/C4)

**What changes:**
- School/class API endpoints start checking `school_membership` roles
- Owner routes start checking `is_global_owner` flag
- Frontend sidebar adapts based on `GET /api/auth/me` response

**What stays the same:**
- Single-user deployments without school records see zero behavioral change
- `VAULT_PASSWORD` still works as a fallback bearer token
- Login page unchanged for single-user mode

### 11.3 Phase 3: Full Role Model (Post-Epsilon)

**What changes:**
- `PasswordAuthMiddleware` becomes optional (configurable via env var)
- All API calls require a valid session token
- Owner cookie gate replaced by role-based frontend routing
- Single-user mode uses implicit user identity (auto-created owner user)

**What stays the same:**
- Deployments that never configure schools continue to work in "implicit owner" mode
- The `VAULT_PASSWORD` env var can be removed once session auth is proven stable

### 11.4 Env Var Behavior During Transition

| Variable | Current | Phase 1 | Phase 2 | Phase 3 |
|----------|---------|---------|---------|---------|
| `VAULT_PASSWORD` | API bearer password | Dual-mode credential | Dual-mode credential | Optional fallback |
| `VAULT_OWNER_PASSWORD` | Frontend owner cookie password | Same + creates owner user | Owner user preferred | Owner user only |
| `VAULT_SESSION_TTL_DAYS` | — | Added, default 30 | Same | Same |
| `VAULT_AUTH_MODE` | — | Added, default `"dual"` | Same | Default `"session"` |

---

## 12. Implementation Slices

### Epsilon C3 — Bootstrap User/Session Auth (Next Phase)

**Files to create/modify:**
- `api/routers/auth.py` — Add `POST /login`, `POST /logout`, `GET /me`
- `api/main.py` — Modify `PasswordAuthMiddleware` to support dual-mode (password OR session token)
- `api/dependencies.py` (new) — `get_current_user()`, `require_school_role()` FastAPI dependencies
- `api/models.py` — Add `LoginRequest`, `LoginResponse`, `UserProfileResponse`
- `tests/test_auth_api.py` (new) — Auth endpoint tests

**Scope:**
- [ ] `POST /api/auth/login` — accepts `{ password }`, returns `{ token, user, expires_at }`
- [ ] First-login owner user bootstrap
- [ ] Session token generation + storage in `auth_session`
- [ ] Dual-mode middleware (password OR session token)
- [ ] `GET /api/auth/me` — returns current user + memberships
- [ ] `POST /api/auth/logout` — invalidates session
- [ ] Tests for login/logout/session/dual-mode

**Validation:**
- `uv run python -m pytest tests/` — all pass
- Existing single-password deployments still work without changes

### Epsilon C4 — Permission Guards for School/Class APIs

**Scope:**
- [ ] `get_current_user()` dependency that populates `request.user`
- [ ] `require_school_role("owner|teacher|learner")` dependency
- [ ] Wire dependencies to all school/class endpoints in `api/routers/schools.py`
- [ ] Remove `TODO(Epsilon C2)` markers
- [ ] Tests: unauthorized requests return 403, authorized requests succeed

**Validation:**
- School/class endpoints reject requests from users without appropriate memberships
- Existing notebook/source/note/study APIs remain unprotected (Epsilon C3+)

### Epsilon D1 — Owner School-Management UI Shell

**Scope:** Frontend school management pages under `/owner/schools/`.
See the Epsilon A design doc for detailed specs.

### Epsilon D2 — Teacher Classroom UI Shell

**Scope:** Frontend classroom management pages under `/teacher/`.
See the Epsilon A design doc for detailed specs.

### Epsilon E — Class Progress Read Model

**Scope:** Teacher dashboard endpoints and learner portal `/learn`.
See the Epsilon A design doc for detailed specs.

---

## 13. Rollback Plan

| Failure Mode | Impact | Recovery |
|-------------|--------|----------|
| Session auth breaks first login | Users cannot log in | Remove the session middleware change. Users revert to password-only auth. No data loss. |
| PasswordAuthMiddleware rejects valid passwords | All API calls return 401 | Set `VAULT_PASSWORD` to the original password. Restart API. The dual-mode logic is additive; removing it restores original behavior. |
| Owner user bootstrap creates duplicate accounts | Two users with `is_global_owner = true` | Manually set one of them to `is_global_owner = false` via `UPDATE user SET is_global_owner = false WHERE id = $id`. Add application-level enforcement (count check). |
| School/class permission guard too restrictive | Teachers cannot create classrooms | Remove `require_school_role()` dependencies. APIs return to unguarded state. |
| Frontend role router shows wrong sidebar | User sees wrong navigation | Fall back to static sidebar (current behavior) when `/api/auth/me` returns 401 or unexpected data. |

**Total rollback:** Revert the commit that changed `PasswordAuthMiddleware`, delete any `auth_session` records, and restart. The `User` records remain but are harmless (they are dormant without session auth).

---

## 14. Testing Plan

### Unit Tests

| Test | What it validates |
|------|-------------------|
| `test_login_with_correct_password` | Login returns token + user |
| `test_login_with_wrong_password` | Login returns 401 |
| `test_login_creates_owner_user_on_first_login` | Bootstrap owner user creation |
| `test_session_token_is_validated` | Token lookup + expiry check |
| `test_session_token_expired` | Expired token returns 401 |
| `test_logout_invalidates_session` | Token cannot be reused after logout |
| `test_dual_mode_legacy_password` | Raw `VAULT_PASSWORD` still works in dual mode |
| `test_dual_mode_session_token` | Session token works alongside password |
| `test_get_current_user_from_session` | Dependency correctly resolves user |
| `test_get_current_user_global_owner` | Global owner flag is accessible |
| `test_require_school_role_allows_owner` | School owner passes role check |
| `test_require_school_role_denies_learner` | Learner is denied teacher-level action |
| `test_require_school_role_denies_unauthenticated` | No token = 401 |
| `test_require_school_role_global_owner_passes_all` | Global owner bypasses school-level role checks |
| `test_auth_me_returns_memberships` | GET /auth/me includes active memberships |

### Integration Tests

| Test | What it validates |
|------|-------------------|
| `test_full_login_session_flow` | Login → use token → logout → token invalid |
| `test_password_only_works_alongside_sessions` | Same endpoint works with both auth methods |
| `test_school_create_requires_global_owner` | Learner cannot create a school |
| `test_teacher_creates_classroom` | Teacher can create classroom in their school |
| `test_teacher_cannot_manage_other_school` | Cross-school isolation |
| `test_learner_cannot_create_classroom` | Learner gets 403 on classroom creation |
| `test_single_user_mode_still_works` | No user records = password-only auth unchanged |

---

## 15. Open Questions

1. **Should login require an email, or just a password?** In single-user mode, the password alone is sufficient (the system auto-creates the owner user). In multi-user mode, email+password is required to identify which user is logging in.

2. **Should session tokens be stored in HttpOnly cookies or returned in the response body?** HttpOnly cookies are more secure (prevents XSS token theft) but harder to work with in the current frontend auth flow (Zustand + localStorage). Recommend: return the token in the response body for the first implementation. Migrate to HttpOnly cookies as a hardening pass (post-Epsilon).

3. **How does the owner cookie interact with session auth?** The owner cookie (`vault-owner-access`) is a separate frontend-side mechanism. In the new model, the backend `/api/auth/me` response indicates whether the user has `is_global_owner = true` or has school-owner-level memberships. The frontend uses this to decide whether to show owner routes. The cookie remains as an extra hardening layer for the owner login flow.

4. **Should the `VAULT_PASSWORD` env var auto-create a user on startup?** No — lazy creation on first login is safer. This avoids creating a user record that the admin never asked for. If the admin explicitly wants to pre-create the owner, they can use the future `/api/owner/users` endpoint (Epsilon C3).

5. **What email should the bootstrapped owner user get?** Default: `admin@vault.local`. Configurable via `VAULT_OWNER_EMAIL` env var. The email is only used for display in the UI; there is no email-verification flow yet.

---

*Prepared: 2026-07-05 · Git ref: `feac519`*
