# Vault Epsilon C3a — Bootstrap Session Auth Checkpoint

**Date:** 2026-07-05
**Git ref:** `b5f56d7` (HEAD — Epsilon C2 auth design doc)

## What Was Built

First backend coexistence layer for user/session authentication, preserving the current password-based self-hosted mode.

### Endpoints Added / Modified

| Endpoint | Method | Description | Auth |
|----------|--------|-------------|------|
| `/api/auth/login` | **POST** (new) | Authenticate with password → receive session token | Public (excluded from middleware) |
| `/api/auth/logout` | **POST** (new) | Invalidate current session token | Session or password |
| `/api/auth/me` | **GET** (new) | Return current user info and auth mode | Session or password |
| `/api/auth/status` | GET (unchanged) | Returns `{ auth_enabled }` | Public |

### Authentication Flow

1. **Login:** Client sends `POST /api/auth/login` with `{ password }`. Server checks `VAULT_OWNER_PASSWORD` first, then `VAULT_PASSWORD`.
2. **Owner bootstrap:** First successful owner login auto-creates a `User` record with `is_global_owner = true`. Subsequent logins reuse the existing record.
3. **Session creation:** Server generates a 128-char hex token (64 random bytes). SHA-256 hash stored in `auth_session` table. Raw token returned once.
4. **Subsequent requests:** Client includes `Authorization: Bearer {session_token}`. Middleware resolves session → sets `request.state.user`.
5. **Legacy fallback:** Raw `VAULT_PASSWORD` still works as a bearer token. Middleware checks password when session lookup fails.

### Dual-Mode Middleware

`PasswordAuthMiddleware` now:
1. Accepts `VAULT_PASSWORD` bearer token (existing behavior)
2. Accepts `VAULT_OWNER_PASSWORD` bearer token (new)
3. Accepts valid session tokens (new — resolves via `auth_session` table)
4. When session is resolved, sets `request.state.user` for downstream use
5. When no password configured, skips auth entirely (existing behavior)

### Session Token Security

- Raw token: 128 hex chars (64 random bytes via `secrets.token_hex`)
- Stored hash: SHA-256 of raw token
- Expiry: 30 days from creation (configurable via `VAULT_SESSION_TTL_DAYS`)
- Logout: `DELETE` from `auth_session` by token hash

### Files Changed

| File | Status | Description |
|------|--------|-------------|
| `api/auth.py` | **Rewritten** | Added `resolve_session()`, `create_session_for_user()`, `delete_session()`, `get_or_create_owner_user()`, `get_or_create_legacy_user()`. Modified `PasswordAuthMiddleware` for dual-mode. |
| `api/routers/auth.py` | **Rewritten** | Added `POST /login`, `POST /logout`, `GET /me`. Preserved `GET /auth/status`. |
| `api/main.py` | Modified | Added `/api/auth/login` to excluded paths. |
| `api/models.py` | Modified | Added `AuthLoginRequest`, `AuthUserResponse`, `AuthLoginResponse`, `AuthMeResponse`. |
| `tests/test_auth_api.py` | **Created** | 15 test cases across 6 test classes. |

## What Was NOT Done (Deferred)

- **School role enforcement** (Epsilon C4): No `require_school_role()` implementation.
- **Password middleware removal:** `VAULT_PASSWORD` and `VAULT_OWNER_PASSWORD` still work exactly as before.
- **Frontend changes:** No login page changes, no owner cookie changes, no frontend role routing.
- **Owner route changes:** `/owner/*` frontend gate unchanged.
- **Tenancy enforcement:** No query filtering by `user_id` or `school_id`.
- **Email verification / registration flow:** Deferred post-Epsilon.
- **Migration:** None — all tables already exist from Epsilon B1/B2.

## Validation

- `uv run python -m pytest tests/` — **all passed**
- `cd frontend && npm test` — **57/57 passed**
- `cd frontend && npm run build` — **clean**
- Scrub check — only README attribution matches
