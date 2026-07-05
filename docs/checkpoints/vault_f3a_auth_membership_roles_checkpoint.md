# Phase F3a — Auth Membership Role Exposure Checkpoint

**Commit range:** `bcd9bd5` → `[pending]`
**Branch:** `main`
**Date:** 2026-07-05

## Completed

### Backend Changes

| File | Change |
|------|--------|
| `api/models.py` | Added `AuthMembershipResponse` model; added `memberships` field to `AuthMeResponse` |
| `api/routers/auth.py` | Added `_get_memberships()` async helper; updated `get_me()` to include memberships for session users |

### Frontend Changes

| File | Change |
|------|--------|
| `frontend/src/lib/types/api.ts` | Added `AuthMembershipResponse` interface; added `memberships` to `AuthMeResponse`; updated `UserRole` comment |
| `frontend/src/lib/hooks/use-user-role.ts` | Updated `deriveRole()` to check active memberships for `teacher`/`owner` role |
| `frontend/src/lib/hooks/use-user-role.test.ts` | Added 5 tests for teacher derivation from memberships |

### New Endpoint Response Field

`GET /api/auth/me` now returns:

```json
{
  "authenticated": true,
  "auth_mode": "session",
  "user": { ... },
  "owner_access": false,
  "memberships": [
    {
      "membership_id": "m1",
      "school_id": "s1",
      "role": "teacher",
      "active": true
    }
  ]
}
```

### Not Changed

- **Sidebar navigation** — unchanged
- **Owner gate** — unchanged
- **Teacher routes** — unchanged
- **Learner routes** — unchanged
- **Dashboard layout** — unchanged
- **Backend permissions** — unchanged
- **Legacy password auth** — unchanged

## Role Derivation Updated

| Response Condition | Derived Role | Change from F2 |
|-------------------|-------------|----------------|
| `authenticated: false` | `anonymous` | Same |
| `owner_access: true` or `user.is_global_owner: true` | `global_owner` | Same |
| Active membership with role `teacher` or `owner` | `teacher` | **New — previously fell through to `learner`** |
| Authenticated, no owner/teacher role | `learner` | Same |

## Tests Added

### Backend (`tests/test_auth_api.py`)

24 total (16 original + 8 new membership tests):

| Test | What it verifies |
|------|-----------------|
| `test_session_user_with_teacher_membership` | Active teacher membership returned |
| `test_session_user_with_school_owner_membership` | Active school-owner membership returned |
| `test_session_user_no_memberships` | Empty memberships list |
| `test_global_owner_memberships_may_be_empty` | Global owner with no memberships still works |
| `test_inactive_membership_excluded` | Inactive memberships not returned |
| `test_no_sensitive_fields_in_memberships` | No password_hash, token_hash, etc. leaking |
| `test_legacy_password_empty_memberships` | Legacy password auth returns empty memberships |
| `test_repo_query_failure_returns_empty` | DB failure returns empty list gracefully |

### Frontend (`frontend/src/lib/hooks/use-user-role.test.ts`)

15 total (10 original + 5 new):

| Test | What it verifies |
|------|-----------------|
| Active teacher membership → `teacher` | Teacher derivation |
| Active school-owner membership → `teacher` | School owner treats as teacher for nav |
| Inactive teacher membership → `learner` | Inactive memberships don't count |
| Learner-only membership → `learner` | Learner role doesn't elevate |
| Mixed memberships with active teacher → `teacher` | Multiple memberships handled correctly |

## Validation

| Suite | Result |
|-------|--------|
| Backend tests (`tests/`) | **363/363 passed** (+8 from previous 355) |
| Auth API tests (`tests/test_auth_api.py`) | **24/24 passed** (16 original + 8 new) |
| Frontend tests (`npm test`) | **72/72 passed** (+5 from previous 67) |
| Frontend build (`npm run build`) | **Clean** |
| Scrub check | README attribution only ✅ |
| Working tree | Clean (pending commit) |

## Privacy Confirmation

The `AuthMembershipResponse` model exposes only:
- `membership_id` — opaque SurrealDB record identifier
- `school_id` — opaque school identifier
- `role` — one of `owner`, `teacher`, `learner`
- `active` — boolean status

**Never exposed:** password_hash, token_hash, raw token, user_id, api_key, learner progress data, private note content, or any reflection text.
