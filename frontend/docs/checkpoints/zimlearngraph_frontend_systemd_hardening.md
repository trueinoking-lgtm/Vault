# ZimLearnGraph Frontend — systemd Supervision Hardening

**Date:** 2026-07-11
**Engineer:** Hermes (Kade approval: "PHASE OPS2 — Make ZimLearnGraph frontend production service supervised")
**Follow-up to:** `frontend/docs/checkpoints/zimlearngraph_frontend_production_deploy_verification.md`

## Summary

The frontend had been running as an **orphaned `nohup` process** (PID 2458176),
which made it vulnerable to reboot/crash and left stale standalone processes
after rebuilds. This phase replaces it with a **supervised systemd service**
(`vault-frontend.service`) and updates the deploy script so future deploys
manage the frontend via systemctl instead of nohup.

**Additional root-cause finding:** before this work, a *previous*
`vault-frontend.service` unit was already present on disk (from
`deploy/systemd/vault-frontend.service`) but was **crash-looping**
(restart counter reached 101, exit code=1). Its bugs — wrong `WorkingDirectory`
and `ProtectSystem=full`/`ProtectHome=read-only` — are documented under
"Remaining risks" and have been fixed. This crash-looping unit competing for
port 3003 was plausibly a contributor to the original chunk-load errors.

## Part A — Supervised frontend service

### Before (orphan nohup)
- PID `2458176`, PPID 1 (orphaned), CWD
  `/root/vault-open-notebook/frontend/.next/standalone`
- Command: `node .next/standalone/server.js` (via nohup)
- `NODE_ENV=production`, `PORT=3003`, `HOSTNAME=0.0.0.0`

### Service unit
`/etc/systemd/system/vault-frontend.service` (identical to
`deploy/systemd/vault-frontend.service`):

```ini
[Unit]
Description=ZimLearnGraph Vault Frontend (Next.js standalone production server)
Documentation=https://github.com/trueinoking-lgtm/Vault
After=network-online.target
Wants=network-online.target
StartLimitIntervalSec=60
StartLimitBurst=5

[Service]
Type=simple
WorkingDirectory=/root/vault-open-notebook/frontend/.next/standalone
ExecStart=/root/.hermes/node/bin/node server.js
Environment=NODE_ENV=production
Environment=PORT=3003
Environment=HOSTNAME=127.0.0.1
Restart=always
RestartSec=5
TimeoutStopSec=10
NoNewPrivileges=true
StandardOutput=journal
StandardError=journal
SyslogIdentifier=vault-frontend

[Install]
WantedBy=multi-user.target
```

Notes:
- `StartLimitIntervalSec`/`StartLimitBurst` are in `[Unit]` (a prior version
  put them in `[Service]`, which systemd silently ignored).
- `HOSTNAME=127.0.0.1` — nginx is local and terminates TLS, so no public bind.
- No `ProtectSystem=full`/`ProtectHome` — those made the standalone dir
  read-only and broke the server (root cause of the previous crash loop).

### Actions performed
1. Wrote the corrected unit.
2. Stopped orphan nohup PID 2458176 (port 3003 only).
3. `systemctl daemon-reload && systemctl enable vault-frontend.service &&
   systemctl restart vault-frontend.service`.

### After (systemd-managed)
- **New PID `2461976`**, owned by systemd (CGroup `/system.slice/vault-frontend.service`)
- Command: `node server.js` (absolute node `/root/.hermes/node/bin/node`)
- `NODE_ENV=production`, `PORT=3003`, `HOSTNAME=127.0.0.1`
- `systemctl status` → `active (running)`, `enabled`
- `journalctl -u vault-frontend.service` → `Ready in 0ms`, no errors

### Verification
- `ss -ltnp | grep :3003` → `127.0.0.1:3003` (LISTEN, pid 2461976)
- `curl http://127.0.0.1:3003/` → 200; `curl https://zimlearngraph.duckdns.org/` → 302
- `pwdx 2461976` → `/root/vault-open-notebook/frontend/.next/standalone`
- No orphan nohup frontend process remains.

## Port / Nginx

- Nginx site `zimlearngraph.duckdns.org` → `proxy_pass http://127.0.0.1:3003`
  (unchanged; correct).
- Frontend binds `127.0.0.1:3003` — consistent with the local nginx proxy.
- Port 3003 is the app's intended production port (deploy script default
  `VAULT_PORT=3003`), not a dev port.

## Part B — Deploy script updated for systemd

`scripts/deploy_vault_frontend_standalone.sh` changes:

1. **Stop step (Step 4)** now detects the systemd unit and prefers
   `systemctl stop vault-frontend.service` *before* build. This is safer than a
   raw port-kill: with `Restart=always`, killing the PID would make systemd
   immediately re-spawn the process into the (soon-to-be-deleted)
   `.next/standalone` directory mid-build — reintroducing the stale-chunk bug.
   A belt-and-suspenders port-kill clears any leftover non-systemd process.
2. **Restart step (Step 14)** consolidated: if the systemd unit is installed,
   `--restart` *and* `--restart-systemd` both restart via `systemctl restart`;
   only when the unit is **not** installed does it fall back to nohup (+ a
   warning telling you how to install the unit). No more orphaned nohup starts.
3. Added `systemd_service_installed()` helper.
4. Header/usage docs updated to describe the new systemd-preferred default.

Critical rule preserved: **never run `npm run build`/`next build` while the
production frontend process is still serving from `.next/standalone`** — the
script still stops the process (now via systemctl) before building.

`bash -n` syntax check: OK.

## Part C — Smoke test root redirect fix

The smoke test previously failed `/` because it expected HTTP 200, but `/`
**intentionally** 302-redirects to `/impact-intelligence`.

New behavior:
- `/` may return 301/302; the test now verifies `Location` points to
  `/impact-intelligence` (or equivalent) instead of failing.
- Explicitly checks `/impact-intelligence` returns 200.
- A 200 on `/` is also accepted (future-proofing).
- Other routes (`/vault`, `/sources`, `/notebooks`) still require 200; owner
  gate + `/api/auth/status` checks unchanged.

## Part D — Public demo verification

Routes (HEAD, following redirects) — all **200**:

| Route | HTTP |
|-------|------|
| `/` | 200 (302 → `/impact-intelligence`) |
| `/impact-intelligence` | 200 |
| `/impact` | 200 |
| `/impact/schools` | 200 |
| `/impact/classes` | 200 |
| `/impact/assessments` | 200 |
| `/impact/school-dashboard` | 200 |
| `/api/auth/status` | 200 |

Static assets extracted from `/impact-intelligence` HTML: **21 references**,
fetched over HTTPS — **0 non-200** (zero 404, zero 500).

Browser console on `/impact-intelligence` (fresh load):
- `console_messages`: 0, `js_errors`: 0
- no HMR, no `/_next/webpack-hmr` reference
- no `ChunkLoadError`, no `ERR_INCOMPLETE_CHUNKED_ENCODING`
- no failed `/_next` asset requests (0)
- page renders with live data (e.g. 36 learners, 3 schools, 6 assessments)
- WebGL/Three.js: rendered; benign Three.js warnings (if any) acceptable

## Backend health

- `vault-surrealdb.service` — active
- `vault-api.service` — active
- `GET /api/auth/status` → 200 (local + via domain)
- Backend data not touched/wiped.

## AetherLink untouched confirmation

- AetherLink serves on port **3002** (PID 2315726), separate process, separate
  nginx site (`/etc/nginx/sites-available/aether-link`).
- `curl http://127.0.0.1:3002/` → 200. Not modified, not restarted.

## Remaining risks / notes

1. **Previous crash-looping unit:** the old `deploy/systemd/vault-frontend.service`
   had `WorkingDirectory=.../frontend` (wrong; standalone `server.js` resolves
   modules relative to its own dir → require() failure → exit 1 → loop) and
   `ProtectSystem=full` + `ProtectHome=read-only` (made the standalone dir
   read-only → startup failure). Both fixed. If you ever re-run an old install
   command from a stale copy of that file, the loop returns — use the
   repo copy (now corrected).
2. **`Restart=always` + build ordering:** because the service auto-restarts,
   all rebuilds MUST go through the deploy script (which stops the unit before
   `npm run build`). A manual `npm run build` while the unit is active would be
   killed/restarted into a deleted dir. This is mitigated by the script's
   `systemctl stop` in Step 4, but a manual build outside the script is still
   unsafe.
3. **`NoNewPrivileges=true` only:** intentional trade-off for operability over
   maximal sandboxing (the standalone server writes trace files under its own
   dir). Acceptable for a single-tenant VPS.
4. **No `User=` drop:** runs as root (matches existing vault-api/surrealdb units
   and node path under `/root/.hermes`). Consistent with the rest of the stack.

## Commits

- `ops: supervise zimlearngraph frontend service`
