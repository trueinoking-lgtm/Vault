# Phase F2 — Frontend User Role Hook Checkpoint

**Commit range:** `0d7b470` → `[pending]`
**Branch:** `main`
**Date:** 2026-07-05

## Completed

### New Files

| File | Purpose |
|------|---------|
| `frontend/src/lib/hooks/use-user-role.ts` | `useUserRole()` hook — resolves frontend role from `GET /api/auth/me` |
| `frontend/src/lib/hooks/use-user-role.test.ts` | 10 unit tests covering all role derivation paths |
| `frontend/src/lib/api/auth.ts` | `authApi.me()` API helper (`GET /api/auth/me`) |

### Modified Files

| File | Change |
|------|--------|
| `frontend/src/lib/types/api.ts` | Added `AuthMeResponse`, `AuthUserResponse` interfaces and `UserRole` type |
| `frontend/src/lib/api/query-client.ts` | Added `QUERY_KEYS.authMe` for TanStack Query cache key |

### Not Changed

- **Backend** — untouched. `GET /api/auth/me` response not modified.
- **Sidebar navigation** — no changes to `AppSidebar.tsx` or `getNavigation()`.
- **Owner gate** — `vault-owner-access` cookie, `/api/owner-access` route, owner login flow all unchanged.
- **Teacher routes** — `/teacher`, `/teacher/classes/[id]` unchanged.
- **Learner routes** — `/vault`, `/sources`, `/notebooks`, `/search` unchanged.
- **Dashboard layout** — `(dashboard)/layout.tsx` unchanged.
- **useAuth hook** — unchanged.
- **Any UI** — no visible behavior changes.

## Role Derivation Behavior

The hook calls `GET /api/auth/me` and derives a single `UserRole` value:

| Response Condition | Derived Role | Rationale |
|-------------------|-------------|-----------|
| `authenticated: false` | `anonymous` | No active session or password |
| `owner_access: true` or `user.is_global_owner: true` | `global_owner` | Global owner privileges |
| Authenticated, no owner access | `learner` | Safe conservative default |

**Conservative limitation:** The backend `AuthMeResponse` does not currently expose school memberships or role lists. Therefore `teacher` cannot be derived and is not returned. The `UserRole` type includes `'teacher'` as a future value but it is unused in this phase.

### Hook API

```typescript
interface UserRoleState {
  role: UserRole | null          // Resolved role, null while loading
  me: AuthMeResponse | null      // Raw backend response
  isLoading: boolean             // True during initial fetch
  error: string | null           // Error message if fetch failed
  isResolved: boolean            // True after first successful fetch
  refetch: () => Promise<void>   // Force refetch from backend
}
```

## Files Changed Summary

```
M  frontend/src/lib/types/api.ts             (+AuthMeResponse, AuthUserResponse, UserRole)
A  frontend/src/lib/api/auth.ts              (new — authApi.me())
A  frontend/src/lib/hooks/use-user-role.ts   (new — useUserRole hook)
A  frontend/src/lib/hooks/use-user-role.test.ts (new — 10 tests)
M  frontend/src/lib/api/query-client.ts      (+QUERY_KEYS.authMe)
```

## Tests Added

| # | Test | Result |
|---|------|--------|
| 1 | Returns `anonymous` when not authenticated | ✅ |
| 2 | Returns `global_owner` when `owner_access` is true | ✅ |
| 3 | Returns `global_owner` when `user.is_global_owner` is true | ✅ |
| 4 | Returns `learner` for regular authenticated user | ✅ |
| 5 | Returns `learner` when auth mode is disabled | ✅ |
| 6 | Returns `learner` when auth mode is password (no user record) | ✅ |
| 7 | Handles API error gracefully, falls back to `learner` | ✅ |
| 8 | Exposes raw `me` response | ✅ |
| 9 | `refetch()` returns updated role | ✅ |
| 10 | Does not call API when not authenticated | ✅ |

## Validation

| Suite | Before | After |
|-------|--------|-------|
| Frontend tests | 57/57 | **67/67** (+10) |
| Frontend build | Clean | **Clean** |
| Backend tests | 355/355 | **355/355** |
| Scrub check | README attribution only | ✅ |
| Working tree | Clean | Pending commit |

### Scrub Check (exact remaining matches)

All matches are README attribution or historical checkpoint/design doc references — no new matches introduced.

## Verification Checklist

- [x] Hook compiles and all 10 tests pass
- [x] `/api/auth/me` API helper compiles
- [x] No sidebar/nav behavior changed
- [x] Owner gate unchanged
- [x] Teacher routes unchanged
- [x] Learner routes unchanged
- [x] Backend behavior unchanged
- [x] No old upstream naming reintroduced

## Backend Limitation Documented

The `AuthMeResponse` schema (`api/models.py`) does not include `roles`, `schools`, or `memberships` fields. The `useUserRole()` hook's `deriveRole()` is intentionally conservative and returns only `global_owner` or `learner` for authenticated users. Derivation of `teacher` requires a backend schema change to `/api/auth/me`.

## Next Phase Recommended

Phase F3 — Role-aware sidebar navigation:
- Modify `AppSidebar.tsx` to accept the resolved role
- Add teacher section (visible to global_owner and teacher roles)
- Add owner section (visible to global_owner only)
- Add new locale keys and icons
