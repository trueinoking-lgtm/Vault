# Vault Phase F — Role-Navigation / Auth Integration Checkpoint

**Commits:** `0d7b470` (F1) · `bcd9bd5` (F2) · `e33b395` (F3a) · `a3152b5` (F3b) · `6dcb95b` (F4) · `80be6e8` (F4 doc)  
**Date:** 2026-07-05  
**Previous checkpoint:** `e9d173f` (Epsilon school teacher layer)

---

## Completed Capabilities

| Phase | Commit | What Was Built |
|-------|--------|----------------|
| **F1** | `0d7b470` | Frontend role-navigation design doc (`docs/architecture/vault_frontend_role_navigation_design.md`) |
| **F2** | `bcd9bd5` | `useUserRole()` hook — resolves frontend role from `GET /api/auth/me`. 10 unit tests. |
| **F3a** | `e33b395` | Backend `GET /api/auth/me` now exposes `memberships: AuthMembershipResponse[]`. Hook derives `teacher` from active teacher/owner memberships. |
| **F3b** | `a3152b5` | `AppSidebar.tsx` role-aware `getNavigation(t, role)`. Teacher Dashboard + Owner Tools nav items. Locale keys across 14 locales. |
| **F4** | `6dcb95b` | Owner-cookie auto bridge after global-owner login. `POST /api/owner-access` called transparently with the submitted password. 5 new tests. |
| **F4 doc** | `80be6e8` | Checkpoint doc for owner-cookie bridge. |

---

## Files Created / Modified

### F2 — Role Hook (6 files)
```
M  frontend/src/lib/types/api.ts              (+AuthMeResponse, AuthUserResponse, UserRole)
A  frontend/src/lib/api/auth.ts               (new — authApi.me())
A  frontend/src/lib/hooks/use-user-role.ts    (new — useUserRole hook)
A  frontend/src/lib/hooks/use-user-role.test.ts (new — 10 tests → later extended to 15)
M  frontend/src/lib/api/query-client.ts       (+QUERY_KEYS.authMe)
```

### F3a — Auth Membership Roles (7 files)
```
M  api/models.py                               (+AuthMembershipResponse)
M  api/routers/auth.py                         (+_get_memberships(), membership exposure in /api/auth/me)
M  frontend/src/lib/hooks/use-user-role.ts     (+teacher derivation from memberships)
M  frontend/src/lib/hooks/use-user-role.test.ts (+5 teacher derivation tests → 15 total)
M  frontend/src/lib/types/api.ts               (+AuthMembershipResponse)
M  tests/test_auth_api.py                      (+membership endpoint tests)
```

### F3b — Role-Aware Sidebar (16 files)
```
M  frontend/src/components/layout/AppSidebar.tsx     (+role-aware getNavigation, role hook)
M  frontend/src/components/layout/AppSidebar.test.tsx (+5 role-aware tests → 7 total)
M  frontend/src/lib/locales/*/index.ts                (+navigation.teacherDashboard, .ownerTools in 14 locales)
```

### F4 — Owner-Cookie Bridge (2 files)
```
M  frontend/src/components/auth/LoginForm.tsx     (+owner-access bridge after normal login)
A  frontend/src/components/auth/LoginForm.test.tsx (new — 5 bridge tests)
```

---

## Routes Now Discoverable

| Role | Routes Visible in Sidebar |
|------|--------------------------|
| **Learner** | `/vault`, `/sources`, `/notebooks`, `/search` |
| **Teacher** | Learner routes + **Teacher Dashboard** (`/teacher`) |
| **Global Owner** | Learner routes + Teacher Dashboard (`/teacher`) + **Owner Tools** (`/owner`) |
| **Anonymous** | No restricted links (redirected to `/login`) |

---

## Role Visibility Behavior

| State | Behavior |
|-------|----------|
| `anonymous` | Not authenticated — no nav rendered |
| `learner` | Learner study routes only |
| `teacher` | Learner routes + Teacher Dashboard (`GraduationCap` icon) |
| `global_owner` | Learner routes + Teacher Dashboard + Owner Tools (`Shield` icon) |
| `loading` (not yet resolved) | `null` role passed → no restricted links flashed; learner-only safe default |
| `error` (fetch failure) | Falls back to `learner` — no restricted links shown |

---

## `/api/auth/me` Role Data

The `GET /api/auth/me` endpoint returns:

```typescript
interface AuthMeResponse {
  authenticated: boolean
  auth_mode: 'session' | 'password' | 'disabled'
  user: AuthUserResponse | null     // { id, display_name, email, is_global_owner, active }
  owner_access: boolean             // true if password matched VAULT_OWNER_PASSWORD
  memberships: AuthMembershipResponse[]  // school memberships for role derivation
}

interface AuthMembershipResponse {
  membership_id: string
  school_id: string
  role: string                       // 'learner' | 'teacher' | 'owner'
  active: boolean
}
```

### Role Derivation (in `useUserRole()`)

1. Not authenticated → `anonymous`
2. `owner_access` or `user.is_global_owner` → **`global_owner`**
3. Any active membership with `role: 'teacher' | 'owner'` → **`teacher`**
4. Otherwise → **`learner`**

---

## Security Model

| Layer | Mechanism | Status |
|-------|-----------|--------|
| **L1 — Nav visibility** | `AppSidebar.tsx` uses `useUserRole()` to conditionally show nav items | **UX only, not auth** |
| **L2 — Owner cookie gate** | `vault-owner-access` HTTP-only cookie checked by `/owner` route redirect | **Unchanged** |
| **L3 — Backend permission guards** | `require_global_owner()`, `check_school_role()`, `check_classroom_access()` in `permissions.py` | **Real security boundary** |
| **L4 — Login owner flow** | `/login?owner=1` → re-enter password → `POST /api/owner-access` → cookie set | **Unchanged** |

Navigation visibility is **UX, not authorization** — backend permission guards remain the real security boundary.

---

## Owner-Cookie Bridge Behavior (F4)

After a **normal** (non-`?owner=1`) login:

1. `login(password)` succeeds → token stored by existing login flow (Zustand → localStorage)
2. Frontend calls `authApi.me()` to check owner status
3. **If `owner_access` or `user.is_global_owner` is true:**
   - Calls `POST /api/owner-access` with the **same submitted password** (in-memory variable)
   - Sets `vault-owner-access` cookie transparently (12h TTL)
   - If `/api/owner-access` fails (non-OK): logs warning, **login still succeeds** — owner gate handles later
4. **If `authApi.me()` fails:** logs warning, skips bridge, **login still succeeds** — owner gate handles later
5. **Non-owner users** never receive the `vault-owner-access` cookie

### Password Storage

The password is used **only in memory** during the `handleSubmit` flow:
- `login(password)` — pre-existing Bearer-token-in-localStorage behavior (unchanged)
- `POST /api/owner-access` body — transient fetch, not stored

**No new password storage was added.**

---

## What Was NOT Changed

- **Backend auth/permissions** — not modified (F3a only added membership exposure, no permission changes)
- **Owner gate** — `vault-owner-access` cookie check, `/api/owner-access` route, owner login flow all unchanged
- **`/login?owner=1` flow** — unchanged; the bridge only runs on normal (non-`?owner=1`) logins
- **Owner route hardening** — unchanged
- **Teacher dashboard functionality** — unchanged
- **Owner school management** — unchanged
- **Learner study behavior** — unchanged
- **Navigation/sidebar from F3b** — not modified by F4
- **AetherLink and ops/deployment scripts** — not modified
- **No migrations added**

---

## Tests and Validation

| Suite | Result |
|-------|--------|
| Frontend tests | **81/81 passed** (57 before Phase F → +10 F2 → +5 F3a → +4 F3b → +5 F4) |
| Backend tests | **363/363 passed** |
| Frontend build | **Clean** (Next.js 16.2.6, Turbopack) |
| Live deploy smoke | ✅ All routes 200/expected |
| Scrub check | ✅ README attribution + historical references only |

---

## Deferred Items (not in scope for Phase F)

| Item | Reason |
|------|--------|
| Optional dashboard switcher (F5) | Defer — only if users report confusion from combined sidebar |
| Landing redirects (per-role `/owner` or `/teacher`) | Defer — would change current login flow behavior |
| `HttpOnly` / session auth hardening | Separate concern — frontend still uses password Bearer |
| `proxy.ts` wired as Next.js `middleware.ts` | Owner gate currently works through login page + backend guards |
| Full tenant filtering on learner/study/library APIs | Epsilon-level work, not role-nav |
| User/library pickers for owners/teachers | Deferred to teacher/owner polish phases |
| Learner progress detail (`/teacher/classes/[id]/learners/[learnerId]`) | Deferred to E5 |
| Production release checklist (CORS hardening, rate limiting, CSP) | Phase G concern |

---

## Next Recommended Options

| Option | Description |
|--------|-------------|
| **A — Phase G: Deployment/release hardening** | Production readiness: CORS, CSP, rate limiting, monitoring, release checklist |
| **B — Phase F5: Lightweight dashboard switcher** | Optional toggle between learner/owner/teacher views in sidebar |
| **C — Phase E5: Learner progress detail** | Teacher-facing learner progress page |
| **D — Owner/teacher polish** | Improve school management UI, teacher dashboard content, classroom tools |

---

## Git Log

```
80be6e8 docs: checkpoint owner cookie bridge
6dcb95b vault: bridge owner access after login
a3152b5 vault: add role-aware navigation entries
e33b395 vault: expose auth membership roles
bcd9bd5 vault: add frontend user role hook
0d7b470 docs: design frontend role navigation
```
