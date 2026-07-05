# Frontend Role Navigation Design

**Status:** Draft / Phase F1
**Date:** 2026-07-05
**Design doc only — no code changes.**

---

## Current State

### Frontend Routing

```
/                           → Landing page (Vault branding, "Start Learning" CTA)
/(auth)/login               → Login form (password entry, owner-gate aware)
/(dashboard)/               → Dashboard layout (auth guard: redirects to /login if not authenticated)
/(dashboard)/vault          → Vault home
/(dashboard)/sources        → Materials list
/(dashboard)/sources/[id]   → Source detail
/(dashboard)/notebooks      → Notebooks / libraries list
/(dashboard)/notebooks/[id] → Notebook detail
/(dashboard)/search         → Ask & search
/(dashboard)/owner          → Owner admin shell (schools, settings, runtime, AI)
/(dashboard)/owner/schools  → School list (owner-gated via cookie)
/(dashboard)/owner/schools/[id] → School detail (owner-gated via cookie)
/(dashboard)/owner/schools/[id]/classrooms/[classroomId] → Classroom detail (owner-gated via cookie)
/(dashboard)/teacher        → Teacher dashboard shell (no nav entry)
/(dashboard)/teacher/classes/[id] → Teacher classroom overview (no nav entry)
/(dashboard)/admin          → Redirected to /owner via next.config redirects
/(dashboard)/settings       → User settings
/(dashboard)/advanced       → Advanced / system info
/(dashboard)/podcasts       → Podcast list
/(dashboard)/transformations → Transformation editor
```

### Current Auth Mechanism

| Layer | Mechanism | State |
|-------|-----------|-------|
| **Frontend auth** | Zustand store + localStorage (`auth-storage` key) | Stores token (password used as Bearer token) and boolean `isAuthenticated`. No role info. |
| **Frontend auth check** | `GET /api/notebooks` with Bearer token | Validates the password works. 30-second cache. |
| **Owner gate** | HTTP-only cookie `vault-owner-access` | Set by `POST /api/owner-access` after re-entering password. Checked by `proxy.ts` (not yet wired as middleware) and Next.js redirects. |
| **Login flow** | Two modes: regular login and owner-protected login | Regular: password → `/api/notebooks` → redirect `/notebooks`. Owner: same + `/api/owner-access` POST → cookie → redirect to `/owner`. |
| **Dashboard auth guard** | `(dashboard)/layout.tsx` | Checks `isAuthenticated`, redirects to `/login` if false. |
| **Backend role endpoint** | `GET /api/auth/me` | Returns user info + roles (global owner, school owner, teacher, learner). **Not yet consumed by frontend.** |

### Owner Gate Wiring

The `proxy.ts` file exports a `proxy(request)` function and a `config` matcher block intended as Next.js middleware, but **there is no `middleware.ts` file** in the project. The owner gate currently works through:

1. `next.config.*` redirects (`/admin` → `/owner`, `/settings/api-keys` → `/owner/ai`)
2. `LoginForm.tsx` checking `/api/owner-access` POST and setting the HTTP-only cookie
3. The `proxy.ts` function being available but **not active** as middleware (no file named `middleware.ts`)

### Sidebar Navigation

The `AppSidebar.tsx` component renders a hardcoded `getNavigation(t)` array:

```typescript
const getNavigation = (t: TFunction) => [
  {
    title: '',
    items: [
      { name: t('vault.vaultHome'), href: '/vault', icon: Command },
      { name: t('navigation.materials'), href: '/sources', icon: FileText },
      { name: t('navigation.libraries'), href: '/notebooks', icon: Book },
      { name: t('navigation.askAndSearch'), href: '/search', icon: Search },
    ],
  },
]
```

There are **no role-aware nav items**. The `/teacher` route exists but is not linked from the sidebar. The `/owner` routes are accessible only via direct URL entry + owner cookie gate.

---

## Problem Statement

1. **Teacher pages exist but are undiscoverable.** A user with the teacher role has no way to navigate to `/teacher` or `/teacher/classes/[id]` from the sidebar. They must know the URL or bookmark it.

2. **Owner nav is hidden behind the cookie gate but not surfaced contextually.** The owner sees the same sidebar as every other user — no indication that owner tools exist unless they already know the `/owner` URL.

3. **No single source of truth for the current user's role.** The frontend has `isAuthenticated: boolean` but no `role` field. Every future role-aware feature (hiding nav items, redirecting to role-appropriate landing, showing/hiding buttons) would need to duplicate role resolution.

4. **No landing redirect for different roles.** Currently all authenticated users land on `/notebooks` regardless of role. Teachers are not redirected to their dashboard; owners are not redirected to their admin panel on first login.

5. **The proxy.ts middleware is not wired into Next.js** despite being designed for it. The owner cookie check lives only in the login page, not as a request-time middleware.

---

## Goals

1. Add a **single source of truth** for the current user's role on the frontend by consuming `GET /api/auth/me`
2. Display **role-appropriate navigation items** in the sidebar
3. Allow **owners to discover and navigate** to owner tools from the sidebar
4. Allow **teachers to discover and navigate** to their classroom dashboard
5. Maintain **backward compatibility** with the existing owner cookie gate
6. Keep **learner routes** (the current `/vault`, `/sources`, `/notebooks`, `/search`) as the default for all authenticated users
7. Ensure backend **still enforces all permission checks** on every endpoint (defense in depth)

## Non-Goals

- No changes to backend auth, permissions, or role resolution
- No changes to the owner cookie gate behavior
- No removal of existing owner gate
- No learner progress detail page
- No teacher dashboard feature additions (UI content, not nav)
- No migration scripts
- No changes to deployment or ops
- No `middleware.ts` implementation yet (deferred to Phase F2+ implementation)

---

## Existing Auth/Frontend Behavior Summary

| Aspect | Current Behavior |
|--------|-----------------|
| Auth persistence | `localStorage` (`auth-storage` key), Zustand persist middleware |
| Token type | Raw password used as Bearer token |
| Role info | None stored. Backend returns `is_global_owner`, `schools`, `roles` from `GET /api/auth/me` but frontend ignores it. |
| Owner cookie | HTTP-only `vault-owner-access`, set by `POST /api/owner-access`, 12h TTL |
| Auth check | `GET /api/notebooks` with Bearer header, 30s cache |
| Login redirect | Regular: `/notebooks`. Owner-gated: `/owner` (or `next` param). |
| Session auth coexistence | Backend supports both password Bearer auth and session token auth. Frontend uses only password Bearer. |

---

## Target Role-Aware Navigation Behavior

### Auth Store Evolution

Extend the Zustand auth store to include role information:

```typescript
interface AuthState {
  isAuthenticated: boolean
  token: string | null
  // New fields:
  userRole: 'owner' | 'teacher' | 'learner' | 'unauthenticated' | null
  userDisplayName: string | null
  userSchoolIds: string[]        // schools the user belongs to
  userTeacherClassroomIds: string[] // classrooms where user is teacher
  lastRoleFetch: number | null
}
```

The role is resolved from `GET /api/auth/me` after a successful login or auth check. The auth store persists `isAuthenticated` and `token` only (no role info in localStorage — roles are re-fetched on each page load or at most every 5 minutes).

### Role Resolution Priority

```
1. GET /api/auth/me (most reliable)
   ↓
2. If 401/403 → fall back to unauthenticated behavior
3. If network error → use cached role from session (not localStorage)
4. If no cached role → downgrade to 'learner' (safe default, most restricted)
```

### Navigation Behavior Per Role

| Role | Sidebar Items | Landing Redirect | Owner Cookie Gate |
|------|---------------|------------------|-------------------|
| **Global owner** | Learner items + Owner tools + Teacher dashboard | `/owner` or last visited | Bypassed (role-based access) |
| **School owner** | Learner items + Teacher dashboard | `/notebooks` or `/teacher` | Active (must pass owner gate for `/owner/*`) |
| **Teacher** | Learner items + Teacher dashboard | `/notebooks` or `/teacher` | Active (blocked from `/owner/*`) |
| **Learner** | Learner items only | `/notebooks` or `/vault` | Active (blocked from `/owner/*`) |
| **Unauthenticated** | None (redirect to `/login`) | `/login` | Active (blocked from `/owner/*`) |

### Compatibility with Current Owner Cookie Gate

The existing cookie-based owner gate (`vault-owner-access`) remains in place and unchanged. Role-aware navigation is **additive**:

- **Global owners** gain sidebar nav links to `/owner/*` and `/teacher/*`. The owner cookie is still set when they visit owner pages, but they don't need to re-enter their password because role-based access gives them the nav entry point.
- **School owners and teachers** gain sidebar nav links to `/teacher/*`. The owner cookie still protects `/owner/*`.
- **Learners** see no new nav items. The owner cookie still protects `/owner/*`.
- **The login page owner gate flow is unchanged.** A regular user cannot access `/owner/*` by typing the URL — the cookie check (when middleware is wired) or the backend permission guard blocks them.

---

## Proposed Route Groups

### Learner Routes (Current default)

These are the existing routes available to all authenticated users:

| Route | Purpose |
|-------|---------|
| `/vault` | Vault home / dashboard |
| `/sources` | Materials list |
| `/sources/[id]` | Source detail |
| `/notebooks` | Libraries / notebooks list |
| `/notebooks/[id]` | Notebook detail |
| `/search` | Ask & search |
| `/podcasts` | Podcast list |
| `/settings` | User settings |
| `/advanced` | System info |
| `/transformations` | Transformation editor |

### Owner Routes

These are the existing owner-gated routes. No new routes are proposed — only nav linkage:

| Route | Purpose | Currently Linked? |
|-------|---------|-------------------|
| `/owner` | Owner dashboard shell | No (URL only) |
| `/owner/schools` | School management list | No (URL only) |
| `/owner/schools/[id]` | School detail with members/classrooms | No (URL only) |
| `/owner/schools/[id]/classrooms/[classroomId]` | Classroom enrollment/assignment | No (URL only) |
| `/owner/ai` | AI provider configuration | No (URL only, legacy redirect from `/admin/api-keys`) |
| `/owner/settings` | Owner settings | No (URL only) |
| `/owner/runtime` | Runtime diagnostics | No (URL only) |

Future Epsilon phases may add:
- `/owner/libraries` — Library/notebook picker for assignments (deferred)

### Teacher Routes

These are existing routes that need nav linkage:

| Route | Purpose | Currently Linked? |
|-------|---------|-------------------|
| `/teacher` | Teacher dashboard shell | No (URL only) |
| `/teacher/classes/[id]` | Teacher classroom overview | No (URL only) |

Future Epsilon phases may add:
- `/teacher/classes/[id]/learners/[learnerId]` — Learner progress detail (deferred)

---

## Proposed Navigation Behavior

### Sidebar Evolution

The `AppSidebar.tsx` `getNavigation()` function becomes dynamic, accepting the current role:

```typescript
const getNavigation = (t: TFunction, role: UserRole | null) => {
  const items = [
    {
      section: '',
      items: [
        { name: t('vault.vaultHome'), href: '/vault', icon: Command },
        { name: t('navigation.materials'), href: '/sources', icon: FileText },
        { name: t('navigation.libraries'), href: '/notebooks', icon: Book },
        { name: t('navigation.askAndSearch'), href: '/search', icon: Search },
      ],
    },
  ]

  // Role-aware items appended after learner items
  if (role === 'global_owner' || role === 'school_owner' || role === 'teacher') {
    items.push({
      section: t('navigation.teacher'),
      items: [
        { name: t('navigation.myClassrooms'), href: '/teacher', icon: GraduationCap },
      ],
    })
  }

  if (role === 'global_owner') {
    items.push({
      section: t('navigation.owner'),
      items: [
        { name: t('navigation.schools'), href: '/owner/schools', icon: Building2 },
        { name: t('navigation.aiConfig'), href: '/owner/ai', icon: Cpu },
      ],
    })
  }

  return items
}
```

### Landing Redirect

The `useAuth()` hook or `(dashboard)/layout.tsx` gains a landing-redirect check:

| Role | First Landing | Subsequent Navigation |
|------|---------------|----------------------|
| Global owner | `/owner` | Preserves last path |
| Teacher | `/teacher` | Preserves last path |
| Learner | `/notebooks` | Preserves last path (current behavior) |
| No role yet | `/notebooks` (current behavior) | N/A |

This is a **gentle redirect** — the first redirect after login. The user can navigate freely afterward.

### Owner Nav Visibility vs Owner Cookie Gate

The sidebar shows `/owner/*` nav items based on **role** (from `GET /api/auth/me`). But clicking those links still requires the `vault-owner-access` cookie. This creates a two-layer defense:

1. **L1 — Frontend nav visibility:** Only global owners see the owner nav items in the sidebar.
2. **L2 — Owner cookie gate / backend:** Even if a non-owner types `/owner/schools` in the URL, the owner cookie check (when `proxy.ts` is wired as middleware) and backend permission guard block them.

For global owners visiting `/owner/*` for the first time from the sidebar, the `AppSidebar` or a link click handler should trigger the owner access flow (similar to how clicking an owner link in the sidebar could auto-trigger a one-time `/api/owner-access` POST with the stored password). Alternatively, the owner cookie is set during login when the backend confirms `is_global_owner: true`.

**Recommended approach:** On login, if `GET /api/auth/me` returns `is_global_owner: true`, the frontend automatically calls `POST /api/owner-access` with the stored password to set the owner cookie. This means:
- No second password prompt for global owners
- The owner cookie is set transparently
- The existing owner gate continues to work for non-owner access attempts

---

## How `/api/auth/me` Is Used

### Current Backend Response (from `GET /api/auth/me`)

```json
{
  "id": "user:abc123",
  "username": "teacher@example.com",
  "display_name": "Ms. Smith",
  "is_global_owner": false,
  "schools": [
    {"school_id": "school:xyz789", "role": "teacher", "name": "Springfield Elementary"}
  ],
  "roles": ["teacher"]
}
```

### Frontend Consumption

A new hook `useUserRole()` wraps the auth store and fetches `GET /api/auth/me`:

```typescript
function useUserRole() {
  const { token, isAuthenticated } = useAuthStore()
  const [role, setRole] = useState<UserRole | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [schoolIds, setSchoolIds] = useState<string[]>([])
  const [classroomIds, setClassroomIds] = useState<string[]>([])

  useEffect(() => {
    if (!isAuthenticated || !token || token === 'not-required') {
      setRole('learner')
      return
    }
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` }})
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.roles) {
          if (data.is_global_owner) setRole('global_owner')
          else if (data.roles.includes('teacher')) setRole('teacher')
          else setRole('learner')
          setDisplayName(data.display_name)
        }
      })
      .catch(() => setRole('learner')) // safe fallback
  }, [isAuthenticated, token])

  return { role, displayName, schoolIds, classroomIds }
}
```

The role is **never persisted to localStorage** — it's fetched on every full page load and cached only in memory (React state). The auth store persists `isAuthenticated` and `token` (current behavior), and the role is re-resolved from the backend when a new page loads or the 5-minute cache expires.

---

## How Legacy Password Auth and Session Auth Interact on the Frontend

### Current: Password Bearer Only

The frontend sends the raw password as `Authorization: Bearer <password>` on every request. There is no session token flow.

### Future: Session Token Support

When the backend supports session auth (already implemented server-side), the frontend should:

1. **On login:** Call `POST /api/auth/login` with `{ password }` — returns `{ token, user }` with a session token.
2. **Store:** Save the session token (not the raw password) as the `token` in the auth store.
3. **Use:** Send session token as `Authorization: Bearer <session_token>`.

### Coexistence Strategy

The backend already supports both modes (password Bearer and session token). The frontend can switch to session tokens without breaking backwards compatibility:

- Old clients still using password Bearer continue to work.
- The frontend's transition is a store-level change: the token stored in localStorage changes from raw password to session token.
- The owner cookie (`vault-owner-access`) is independent — it continues to be set via `/api/owner-access` POST.

### Recommended Phase

Defer session token adoption to a dedicated auth hardening phase. For Phase F1–F4, the frontend continues using password Bearer auth and adds role resolution on top.

---

## What to Add

### Phase F2 — Role Auth Hook

- **Files touched:** `frontend/src/lib/stores/auth-store.ts`, `frontend/src/lib/hooks/use-user-role.ts` (new)
- **Changes:**
  - New `useUserRole()` hook that calls `GET /api/auth/me` and caches the result in memory (5-minute TTL)
  - Auth store gets optional role fields (not persisted to localStorage)
  - `useUserRole()` is called from `(dashboard)/layout.tsx` after auth check passes
  - The role is available to all child components via React context or direct hook call

### Phase F3 — Role-Aware Sidebar

- **Files touched:** `frontend/src/components/layout/AppSidebar.tsx`
- **Changes:**
  - `getNavigation()` accepts `role` parameter
  - Teacher section added (visible to global_owner, school_owner, teacher)
  - Owner section added (visible to global_owner only)
  - New locale keys for `navigation.teacher`, `navigation.myClassrooms`, `navigation.schools`, `navigation.aiConfig`, `navigation.owner`
  - New icons: `GraduationCap` (teacher), `Building2` (schools), `Cpu` (AI config)

### Phase F4 — Teacher Nav Link and Safe Route Fallback

- **Files touched:** `frontend/src/app/(dashboard)/layout.tsx` or `use-auth.ts`
- **Changes:**
  - Gentle landing redirect for teachers: `/notebooks` → `/teacher` if role is 'teacher'
  - Gentle landing redirect for global owners: `/notebooks` → `/owner` if role is 'global_owner'
  - The redirect fires only once per session (checked via sessionStorage flag `landingRedirectDone`)
  - Backend still enforces permissions on `/teacher/*` and `/owner/*` endpoints

### Phase F5 — Optional Dashboard Switcher

- **Files touched:** `frontend/src/components/layout/DashboardSwitcher.tsx` (new)
- **Changes:**
  - A dropdown or toggle in the sidebar header allowing global owners to switch between "Learner mode" (default student sidebar) and "Owner mode" (admin sidebar)
  - Teachers get a simpler "Teacher mode" switch
  - This is lowest priority — only if users report confusion from the combined sidebar

## Implementation Slices (Recommended Order)

| Phase | Name | Effort | Risk | Dependencies |
|-------|------|--------|------|-------------|
| **F2** | Role auth hook | Small | Low | Backend `GET /api/auth/me` already exists |
| **F3** | Role-aware sidebar | Medium | Low | F2 complete |
| **F4** | Teacher nav + landing redirect | Small | Medium | F2, F3. Risk: global owners might not expect redirect. Mitigate with sessionStorage flag. |
| **F5** | Dashboard switcher | Medium | Low | F3 complete. Optional — skip unless user feedback requests it. |

---

## Risks

### Locking Out the Owner

**Risk:** If the role fetch from `/api/auth/me` fails (network error, backend down), a global owner could be shown a learner sidebar with no owner nav links.

**Mitigation:**
- On network error, `useUserRole()` returns `null` — the sidebar renders all roles (owner + teacher + learner items) as a safe fallback.
- The owner cookie gate is unchanged — even if the sidebar shows all items, the backend still blocks unauthorized access.
- The login page already handles connection errors gracefully.

### Exposing Teacher Links to Learners

**Risk:** If the role fetch incorrectly returns `teacher` for a learner, the learner sees teacher nav items. They could click through to `/teacher`.

**Mitigation (defense in depth):**
- **L1: Frontend** — The role fetch is from the authenticated backend. Only the backend can return a role (learner users have no teacher relationship).
- **L2: Backend** — All `/api/teacher/*` endpoints enforce `check_classroom_access()` which returns 403 for learners.
- **L3: Owner gate** — `/owner/*` is protected by the cookie gate (when middleware is wired).
- **Result:** Even if a learner somehow gets teacher nav items, clicking them returns a backend 403. The UI error handler shows a "not found or access denied" message.

### Relying on localStorage Token Too Much

**Risk:** The auth store persists the token (password) to localStorage. If XSS is present, the attacker gains full vault access.

**Mitigation:**
- This is a pre-existing risk, not introduced by this design.
- Phase F auth hardening (deferred) should switch to HttpOnly session cookies.
- The role auth hook can be added without changing token storage behavior.

### Mismatch Between Owner Cookie and Session Auth

**Risk:** The owner cookie is set by `/api/owner-access` POST, while the session token is set by `/api/auth/login`. If the cookie expires but the session is still valid, the owner sees nav links but cannot access owner pages.

**Mitigation:**
- Phase F4 (auto-set owner cookie on login for global owners) keeps the two in sync.
- The owner cookie has a 12-hour TTL — longer than most sessions.
- When middleware is wired, a 401 from the owner cookie check can trigger a silent re-set of the cookie using the stored password.

---

## Testing Plan

### Unit Tests (Phase F2)

| Test | What It Verifies |
|------|-----------------|
| `useUserRole()` returns `global_owner` when `is_global_owner: true` | Correct role resolution |
| `useUserRole()` returns `teacher` when roles includes `teacher` | Correct role resolution |
| `useUserRole()` returns `learner` when no roles returned | Default fallback |
| `useUserRole()` returns `learner` on network error | Safe fallback |
| `useUserRole()` caches and refreshes after 5-minute TTL | Cache behavior |
| `useUserRole()` does not persist role to localStorage | Security |

### Component Tests (Phase F3)

| Test | What It Verifies |
|------|-----------------|
| AppSidebar renders learner items for learner role | Role-appropriate nav |
| AppSidebar adds teacher section for teacher role | Role-appropriate nav |
| AppSidebar adds teacher + owner sections for global owner | Role-appropriate nav |
| AppSidebar handles null role (shows all items as fallback) | Safe fallback |
| Collapsed sidebar shows tooltips for teacher/owner items | Accessibility |

### Integration Tests (Phase F4)

| Test | What It Verifies |
|------|-----------------|
| Teacher logs in → redirected to `/teacher` | Landing redirect |
| Global owner logs in → redirected to `/owner` | Landing redirect |
| Learner logs in → stays on `/notebooks` | No unwanted redirect |
| Role fetch fails → user stays on current page | Graceful degradation |
| Owner cookie not set → owner nav links show but backend returns 403 | Defense in depth |

### Manual Smoke Tests

1. **Owner flow:** Login as global owner → see owner sidebar items → navigate to `/owner/schools` → works (cookie set automatically)
2. **Teacher flow:** Login as teacher → see teacher sidebar items → navigate to `/teacher` → works
3. **Learner flow:** Login as learner → no new nav items → navigate to `/notebooks` → works
4. **URL entry:** Learner types `/teacher` in URL → backend returns 403 → error shown
5. **Cookie expiry:** Owner cookie expired → owner sees nav links but gets redirected through owner gate → re-authenticates

---

## Rollback Plan

Since this design is purely additive (no existing behavior is removed), rollback is straightforward:

| Phase | Rollback Action |
|-------|-----------------|
| F2 | Remove `useUserRole()` hook. Revert auth store additions. |
| F3 | Revert `AppSidebar.tsx` to hardcoded navigation. Remove new locale keys (i18n falls back to existing keys). |
| F4 | Remove landing redirect logic from `layout.tsx` or `use-auth.ts`. |
| F5 | Delete `DashboardSwitcher.tsx`. |

The rollback for any phase is a single git revert. No data migration is needed. No backend changes are involved.

**Rollback trigger conditions:**
- Any user reports being unable to access a previously accessible route
- Role resolution returns incorrect values for >1% of users
- The landing redirect loops or prevents login completion

---

## Constraints

- **Do not remove the existing owner gate.** The `vault-owner-access` cookie check and owner-access POST endpoint remain untouched.
- **Do not force every user into session auth yet.** The frontend continues using password Bearer auth for Phase F1–F4.
- **Do not break `/vault`, `/sources`, `/notebooks`.** These core learner routes must remain accessible and unchanged in behavior.
- **Do not expose teacher dashboard links unless the backend still enforces permissions.** All `/api/teacher/*` and `/api/owner/*` endpoints continue to enforce role checks server-side. Nav visibility is a UX improvement, not a security boundary.
- **Do not use old upstream naming** (`OPEN_NOTEBOOK_*`, `open_notebook`).
- **Do not use `pnpm`.**
- **Do not create generated files.**
