# ZimLearnGraph / Vault — Backend Restore Verification

**Date:** 2026-07-08
**Operator:** Hermes Agent (autonomous restore, controlled)
**Scope:** Restore SurrealDB + FastAPI backend so `/api/*` no longer returns 502.
**Out of scope:** Frontend (already healthy on :3003), AetherLink (pm2 id 18, untouched).

---

## 1. Root cause

The production stack has **no systemd/supervisor unit for SurrealDB or the API backend** — they were run as bare manual processes (started historically via `dev-init.sh` / `supervisord.single.conf` style commands). Both processes had died (general service outage — likely a host restart or crash), leaving:

- SurrealDB (`:8000`) — not listening
- FastAPI (`:5055`) — not listening
- nginx → `127.0.0.1:5055` → **502 Bad Gateway** on every `/api/*` call

The frontend static-asset 500s reported earlier were a **separate, unrelated incident** caused by a `next build` deleting `.next/standalone/` while the live server held it open; those were fixed by re-running `scripts/deploy_vault_frontend_standalone.sh --restart` (new PID 2266857, valid CWD, static repopulated). This document covers the **backend** portion only.

## 2. Configuration discovered (inspected before any action)

| Item | Value | Source |
|------|-------|--------|
| SurrealDB port | **8000** (bind `127.0.0.1`) | `.env: SURREAL_URL=ws://127.0.0.1:8000/rpc`; confirmed in prior `surrealdb.log` |
| SurrealDB data path (PRODUCTION) | `/root/vault-open-notebook/surreal_data/mydatabase.db` (rocksdb dir, **16 MB**, mtime 2026-07-07) | prior `surrealdb.log`: `Started kvs store at rocksdb:///root/vault-open-notebook/surreal_data/mydatabase.db`; `supervisord.single.conf` `rocksdb:/mydata/mydatabase.db` + volume `./surreal_data:/mydata` |
| SurrealDB creds | `root` / `root` | `.env` |
| SurrealDB namespace / db | `open_notebook` | `.env` (`SURREAL_NAMESPACE=open_notebook`) |
| API command (PRODUCTION) | `uv run --env-file .env run_api.py` (uvicorn `api.main:app`, `127.0.0.1:5055`) | prior `api.log` ("Starting … on 127.0.0.1:5055"); `supervisord.conf` `[program:api] uv run --no-sync uvicorn api.main:app --host 0.0.0.0 --port 5055` |
| Managed-by | `vault-frontend.service` (systemd, :3003, healthy) and `vault-worker.service` (systemd, running) — **DB and API are NOT systemd-managed** | `systemctl list-units` |
| Empty/decoys avoided | `surreal-data/` (hyphen dir) contains only a stale empty `mydatabase.db` (Jul 3) — NOT used | directory listing |

**No migrations or seeds were run.** The prod DB was confirmed to already contain the `open_notebook` namespace with data before restarting the server (see Step 3 verification).

## 3. Restore steps executed

### Step 3 — SurrealDB started (first)
```
/root/.local/bin/surreal start --user root --pass root \
  rocksdb:/root/vault-open-notebook/surreal_data/mydatabase.db
```
- Data dir confirmed non-empty (16 MB rocksdb) **before** start.
- Log confirms it attached to the **existing** store (and found existing root user, so it did NOT create a new empty DB):
  `Started kvs store at rocksdb:///root/vault-open-notebook/surreal_data/mydatabase.db`
  `Credentials were provided, but existing root users were found. The root user 'root' will not be created`
- PID 2268302, listening on **127.0.0.1:8000**.
- Health: `GET http://127.0.0.1:8000/health` → **200**.
- Namespace check via SQL endpoint: `INFO FOR ROOT` returned namespace `open_notebook` + root user → **real production data confirmed present**.

### Step 4 — FastAPI backend started
```
/usr/local/lib/hermes-agent/venv/bin/uv run --env-file /root/vault-open-notebook/.env run_api.py
```
- Confirmed `run_api.py` exists and matches the historically-used command.
- PID 2268503, listening on **127.0.0.1:5055**.
- Log: `API initialization completed successfully` / `Application startup complete`.
- Non-fatal warnings only (optional OpenAI podcast models not configured) — no errors.

## 4. Verification

### Local (direct)
| Endpoint | Result |
|----------|--------|
| `http://127.0.0.1:8000/health` | 200 |
| `http://127.0.0.1:5055/api/config` | 200 |
| `http://127.0.0.1:5055/api/auth/status` | 200 |

### Public (through nginx → zimlearngraph.duckdns.org)
| Endpoint | Result |
|----------|--------|
| `GET /api/auth/status` | 200 — `{"auth_enabled":false,"message":"Authentication is disabled"}` |
| `GET /api/config` | 200 (HEAD returns 405 — endpoint does not accept HEAD; GET works) |
| `/impact` | 200 |
| `/impact-intelligence` | 200 |
| Static assets (`.woff2`, `.css`, `.js`, `favicon.svg`) | 200 (21/21 referenced assets verified earlier) |
| Browser console on live `/impact-intelligence` | **0 errors, 0 JS errors** |

**502 resolved** — `/api/*` now serves 200 through nginx.

### Impact app behavior (Step 6)
- `/api/impact/schools` → 200, body `{"schools":[],"total":0}`
- `/api/impact/classes` → 200, empty
- `/api/impact/assessments` → 200, empty
- `/api/impact/school-dashboard` → 404 (route does not exist under that exact path; dashboard data served via other impact routes)

**Conclusion:** The production SurrealDB currently holds **no Impact seed data** (schools/classes/assessments empty). The frontend correctly falls back to its **built-in 3-school demo dataset** — verified live: landing page shows LEARNERS 42 / SCHOOLS 3 / ASSESSMENTS 6 / PASS RATE 14%, and the "Anchored in real assessment data" section renders computed fallback figures (6 learners assessed, 9% pass rate, Ratios & Proportional Reasoning 32% critical weakness). **Dashboards are NOT empty** — the seeded fallback covers the empty API by design.

Per the controlled-restore constraint, **no seed/migration was run** — the empty Impact data is the existing production state, not a regression.

## 5. Services now running
| Service | Port | PID | Managed by |
|---------|------|-----|------------|
| SurrealDB | 8000 (127.0.0.1) | 2268302 | manual (nohup) |
| FastAPI backend | 5055 (127.0.0.1) | 2268503 | manual (uv run) |
| Vault frontend | 3003 (0.0.0.0) | 2266857 | systemd `vault-frontend.service` |
| Vault worker | — | systemd | `vault-worker.service` |
| AetherLink webapp | 3002 | 2031700 | pm2 (untouched) |

## 6. Remaining risks / follow-ups
1. **No auto-restart for DB or API.** Both are bare `nohup`/`uv run` processes — they will NOT survive the next host reboot (this is the original fragility that caused the outage). Recommended: add systemd units (`vault-surrealdb.service`, `vault-api.service`) mirroring `vault-worker.service`, so the stack self-heals. **Not done in this restore** (out of scope; needs your sign-off).
2. **Impact data is empty in prod.** The demo fallback masks it, but a real pilot needs seed data. `scripts/seed_impact_demo.py` exists. Run only after explicit go-ahead (you instructed: do not run migrations/seeds blindly).
3. The API logs `auth_enabled:false` (authentication disabled) — expected for this deployment; flag if auth should be enforced.
4. Frontend `package.json` / `package-lock.json` show as modified in git (from the earlier `npm install lenis` for the landing work). Not committed here — separate landing change.

## 7. Commands to reproduce this restore
```bash
# SurrealDB (production datastore — do NOT use surreal-data/ hyphen dir)
/root/.local/bin/surreal start --user root --pass root \
  rocksdb:/root/vault-open-notebook/surreal_data/mydatabase.db

# FastAPI backend
cd /root/vault-open-notebook
/usr/local/lib/hermes-agent/venv/bin/uv run --env-file /root/vault-open-notebook/.env run_api.py
```
