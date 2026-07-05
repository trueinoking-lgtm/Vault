# Vault G3 — Stable Release Freeze Checkpoint

**Tag:** `vault-g3-stable`  
**Commit:** `2955498` — `vault: harden backend health checks`  
**Date:** 2026-07-05  
**Previous phase:** G2 — Backend service and API health hardening

---

## Purpose

Lock the current working tree as a known-good demo build before adding further features. This freeze represents the first end-to-end verified Vault release with:

- All F-phase role/navigation features (learner, teacher, owner)
- All G-phase deployment hardening (runbook, smoke script, health endpoint, systemd template)
- Clean naming migration (no donor brand references in active code)
- Verified live deployment at `vault-lms.duckdns.org`

---

## Validation Summary

| Check | Result |
|-------|--------|
| Backend tests | **367/367 passed** |
| Frontend tests | **81/81 passed** |
| Frontend build | **Clean** (`npm run build`) |
| Live smoke test | **10/10 passed** |
| Scrub check (donor naming) | **0 matches** |
| Working tree | **Clean** (`git status --short` — no output) |

---

## Phase History Included in This Freeze

| Phase | Commit(s) | What Was Built |
|-------|-----------|----------------|
| **F1** | `0d7b470` | Frontend role-navigation design doc |
| **F2** | `bcd9bd5` | `useUserRole()` hook — 10 unit tests |
| **F3a** | `e33b395` | Backend `GET /api/auth/me` membership exposure |
| **F3b** | `a3152b5` | Role-aware `AppSidebar` — 14 locale entries |
| **F4** | `6dcb95b`, `80be6e8` | Owner-cookie auto bridge, 5 tests, checkpoint doc |
| **G1** | `a537305`, `bba28f5` | Release runbook, smoke script, path scrub |
| **G2** | `2955498` | `GET /api/health`, systemd template, 4 tests, runbook expanded |

---

## Runtime Port Layout

| Service | Port | Status |
|---------|------|--------|
| Vault FE (Next.js standalone) | 3003 | ✅ Running (new build) |
| Vault API (FastAPI / uvicorn) | 5055 | ✅ Running |
| SurrealDB | 8000 | ✅ Running |
| AetherLink | 3002 | ✅ Untouched (not part of Vault) |

---

## Health Endpoint

- **Route:** `GET /api/health`
- **Response:** `{"status": "ok", "service": "vault-api"}`
- **No auth required** (excluded from `PasswordAuthMiddleware`)
- **Access:** Direct `:5055/api/health` or proxied `/api/health` via frontend

---

## Key Artifacts

| Artifact | Path |
|----------|------|
| Release runbook | `docs/operations/vault_release_runbook.md` |
| Live smoke script | `scripts/smoke_vault_live.sh` |
| Backend systemd template | `docs/operations/vault-backend.service.example` |
| Backend health tests | `tests/test_health_api.py` |
| Role-navigation design | `docs/architecture/vault_frontend_role_navigation_design.md` |

---

## Known Constraints

1. **Static asset sync required after rebuild:** `npm run build` outputs to `.next/`; standalone server needs `.next/static/` copied to `.next/standalone/.next/static/`. Documented in release runbook.
2. **EADDRINUSE on restart:** Second `node server.js` or `uvicorn` process will fail if the original is still running. Harmless — original serves correct code.
3. **Podcast migration warnings on startup:** Expected when no OpenAI credential is configured. Non-blocking.
4. **Auth is dev-only (password middleware):** Replace with OAuth/JWT before production. Noted in runbook.

---

## Tag

```bash
git tag -a vault-g3-stable -m "Vault G3 — stable release freeze (2955498)"
```

This tag pins the exact state of all commits listed above. Future development begins from this baseline.
