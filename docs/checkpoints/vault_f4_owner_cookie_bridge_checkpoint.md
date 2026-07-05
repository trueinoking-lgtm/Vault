# Vault Phase F4 — Owner-Cookie Auto Bridge Checkpoint

**Committed:** `6dcb95b`  
**Date:** 2026-07-05  
**Previous checkpoint:** `a3152b5` (F3b — role-aware sidebar)

## Goal

After a successful global-owner session login, automatically set the existing `vault-owner-access` cookie using the same password already submitted during login, so the owner does not need to log in twice.

## Implementation

### Files Changed

| File | Change |
|------|--------|
| `frontend/src/components/auth/LoginForm.tsx` | Added owner-access bridge after normal login success |
| `frontend/src/components/auth/LoginForm.test.tsx` | 5 new tests covering bridge behavior (new file) |

### Bridge Behavior

After `login(password)` succeeds in the **normal** (non-`?owner=1`) path:

1. Call `authApi.me()` to check if the user is a global owner
2. If `meResponse.owner_access` OR `meResponse.user?.is_global_owner === true`:
   - Call `POST /api/owner-access` with the same password
   - Best-effort: non-OK response only logs a warning (no user-facing error)
3. If `authApi.me()` fails entirely:
   - Log a warning, skip bridge — login still succeeds
4. If non-owner:
   - Skip bridge entirely

### No Password Persistence

The password is used only in memory during the `handleSubmit` flow. It is passed to:
- `login(password)` — which stores it as a Bearer token (pre-existing behavior)
- `POST /api/owner-access` body — transient fetch, not stored

The existing `login()` store already persists the password as a token in localStorage (pre-existing). This phase adds no new password storage.

### Owner Gate Compatibility

The existing `/owner` gate (`vault-owner-access` cookie check, `/login?owner=1` redirect) is **unchanged**. The bridge only pre-emptively sets the cookie so global owners skip the gate on first visit.

- `/login?owner=1` flow is **unchanged** — the bridge only runs on normal (non-`?owner=1`) logins
- Owner route hardening and cookie checks are **unchanged**
- Backend auth and permissions were **not modified**
- Navigation and sidebar (F3b) are **not modified**
- AetherLink and ops/deployment scripts are **not modified**

### Non-Owner Behavior

Teacher and learner logins are completely unaffected — `authApi.me()` returns `owner_access: false`, so the bridge is skipped entirely.

## Validation

| Suite | Result |
|-------|--------|
| Frontend tests (81 tests) | ✅ All passed (+5 new) |
| Frontend build | ✅ Clean |
| Backend tests (363 tests) | ✅ All passed |
| Scrub check | ✅ README attribution only |
| Runtime smoke | ✅ All routes 200/expected |
| Owner gate | ✅ Still redirects (307) before login |

## Git

```
6dcb95b vault: bridge owner access after login
```
