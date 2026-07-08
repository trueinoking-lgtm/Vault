# ZimLearnGraph Backend — systemd Hardening (PHASE OPS1)

**Date:** 2026-07-08
**Goal:** Make the backend (SurrealDB + Vault/FastAPI) reboot- and crash-safe so `/api/*` never randomly 502s again.
**Result:** Both services are now `enabled` (start on boot) and `Restart=always` (self-heal on crash). Verified by a simulated restart.

---

## Unit files

Installed to `/etc/systemd/system/`, source of truth in `deploy/systemd/`:
- `vault-surrealdb.service`
- `vault-api.service`

### vault-surrealdb.service
```ini
[Unit]
Description=ZimLearnGraph SurrealDB (production datastore)
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/root/vault-open-notebook

ExecStart=/root/.local/bin/surreal start \
    --user root --pass root \
    --bind 127.0.0.1:8000 \
    rocksdb:/root/vault-open-notebook/surreal_data/mydatabase.db

Restart=always
RestartSec=5
StartLimitIntervalSec=60
StartLimitBurst=5

StandardOutput=journal
StandardError=journal
SyslogIdentifier=vault-surrealdb

NoNewPrivileges=yes
ProtectHome=no
ProtectSystem=full
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
```

### vault-api.service
```ini
[Unit]
Description=ZimLearnGraph Vault/FastAPI API
After=network.target vault-surrealdb.service
Wants=vault-surrealdb.service
Requires=vault-surrealdb.service

[Service]
Type=simple
User=root
Group=root
WorkingDirectory=/root/vault-open-notebook

EnvironmentFile=/root/vault-open-notebook/.env

ExecStart=/usr/local/lib/hermes-agent/venv/bin/uv run \
    --env-file /root/vault-open-notebook/.env \
    run_api.py

Restart=always
RestartSec=5
StartLimitIntervalSec=60
StartLimitBurst=5

StandardOutput=journal
StandardError=journal
SyslogIdentifier=vault-api

NoNewPrivileges=yes
ProtectHome=no
ProtectSystem=full
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
```

---

## Verified facts (no guessing)

| Item | Value |
|------|-------|
| SurrealDB binary | `/root/.local/bin/surreal` (v2.0.4) |
| SurrealDB bind | **127.0.0.1:8000** (loopback only — NOT public) |
| SurrealDB datastore | `/root/vault-open-notebook/surreal_data/mydatabase.db` (real rocksdb, 16 MB) |
| API binary | `/usr/local/lib/hermes-agent/venv/bin/uv` |
| API command | `uv run --env-file .env run_api.py` (uvicorn `api.main:app`) |
| API bind | `127.0.0.1:5055` |
| API config source | `EnvironmentFile=/root/vault-open-notebook/.env` (KEY=VALUE, compatible) |

The stale `surreal-data/` (hyphen) directory was **not** used. The DB was **not** wiped and **no seeds** were run. AetherLink (pm2 id 18) was **not touched**.

---

## Critical pitfall found & fixed

The frontend unit (`vault-frontend.service`) uses `ProtectHome=read-only`. Copying that to these two units **broke them**:
- SurrealDB failed: `Read-only file system ... renaming .../LOG.old` (it writes under `/root/vault-open-notebook/surreal_data`).
- `uv` failed: `Could not create temporary file ... Read-only file system at /root/.cache/uv`.

**Fix:** `ProtectHome=no` for both (kept `NoNewPrivileges`, `ProtectSystem=full`, `PrivateTmp`). `ProtectSystem=full` does not touch `/root`, so datastore + uv cache work while the rest of the FS stays read-only.

---

## Status (post-install)

```
systemctl is-active vault-surrealdb.service vault-api.service  ->  active  active
ss -ltnp | grep :8000  -> 127.0.0.1:8000  (surreal, loopback only)
ss -ltnp | grep :5055  -> 127.0.0.1:5055  (python3 / uv run)
```

SurrealDB journal: `Started kvs store at rocksdb:///root/vault-open-notebook/surreal_data/mydatabase.db` + `Started web server on 127.0.0.1:8000` + "existing root users were found" (proves it attached to the real store, not a fresh empty one).

API journal: `API initialization completed successfully` / `Application startup complete`, serving real `GET /api/auth/status 200`.

---

## Public API verification

| Endpoint | Result |
|----------|--------|
| `GET http://127.0.0.1:5055/api/auth/status` | 200 |
| `GET http://127.0.0.1:5055/api/config` | 200 |
| `GET https://zimlearngraph.duckdns.org/api/auth/status` | 200 — `{"auth_enabled":false,...}` |
| `GET https://zimlearngraph.duckdns.org/api/config` | 200 — `{"version":"1.10.0","dbStatus":"online"}` |
| `HEAD https://zimlearngraph.duckdns.org/api/config` | 405 (expected — endpoint rejects HEAD; GET works) |

**502 resolved.**

## Frontend verification (unchanged, healthy :3003)

| Route | Result |
|-------|--------|
| `/impact-intelligence` | 200 |
| `/impact` | 200 |
| `/impact/schools` | 200 |
| `/impact/assessments` | 200 |
| `/impact/school-dashboard` | 200 |

## Reboot-safety simulation (Step 8)

`systemctl restart vault-surrealdb.service vault-api.service` → both `active` again, ports re-bound, public API + frontend still 200. (A real host reboot was **not** performed — only a service-level restart to prove the units, not the manual processes, own the lifecycle.) On actual boot, `WantedBy=multi-user.target` + `enable` will auto-start them in order (API `Requires`/`After` SurrealDB).

---

## Remaining risks / notes

1. **Impact data still empty in prod.** API returns empty schools/classes/assessments; frontend uses its built-in 3-school demo fallback (dashboards not empty). Seed only on explicit go-ahead (`scripts/seed_impact_demo.py`).
2. **`auth_enabled:false`.** Authentication disabled in this deployment — flag if auth should be enforced for public `/api/*`.
3. **DB writes to `/root`.** `ProtectHome=no` is required for functionality; acceptable since the host is single-tenant (root). If multi-tenant hardening is ever needed, move the datastore + uv cache to a non-home path and re-add `ProtectHome=read-only`.
4. **AetherLink untouched** — pm2 id 18 (`aetherlink-webapp`) was not modified, restarted, or referenced.
5. Both services are `Restart=always` with `StartLimitBurst=5`/`StartLimitIntervalSec=60` to avoid restart storms on an unrecoverable store.

## Install/redeploy command
```bash
sudo cp deploy/systemd/vault-surrealdb.service /etc/systemd/system/
sudo cp deploy/systemd/vault-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable vault-surrealdb.service vault-api.service
sudo systemctl restart vault-surrealdb.service vault-api.service
```
