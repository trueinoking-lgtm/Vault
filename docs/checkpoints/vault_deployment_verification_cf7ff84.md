# Vault Deployment Verification — cf7ff84

**Checkpoint date:** 2026-07-04  
**Previous checkpoint:** `docs/checkpoints/vault_delta_learner_loop_checkpoint.md`  
**Verified by:** Delta deployment verification pass

---

## Summary

The public VPS deployment at `vault-lms.duckdns.org` now serves the latest Vault learner-loop checkpoint (commit `cf7ff84`). The deployment is verified to be Vault, not AetherLink or a stale build. All learner-loop routes respond correctly, the owner gate is functional, and learner-facing copy matches the current product state. One deployment issue (stale standalone server) was found and corrected; no application code was changed.

---

## Commit Verified

| Attribute | Value |
|-----------|-------|
| **HEAD** | `cf7ff8435fb01fbf3ec4db1a21e767569266c139` |
| **origin/main** | `cf7ff8435fb01fbf3ec4db1a21e767569266c139` |
| **Branch** | `main` |
| **Working tree** | Clean |

---

## Running Services

| Service | Host | Port | PID | Purpose | Status |
|---------|------|------|-----|---------|--------|
| **Vault Frontend** | `0.0.0.0` | `3003` | `1919007` | Next.js v16.2.9 standalone serving Vault learner UI | ✅ Running |
| **Vault API** | `127.0.0.1` | `5055` | `1856172` | Uvicorn/FastAPI backend for Vault data and AI | ✅ Running |
| **SurrealDB** | `127.0.0.1` | `8000` | `1856099` | Graph database storing Vault notebooks, sources, notes | ✅ Running |
| **AetherLink Frontend** | `127.0.0.1` | `3002` | `1715985` | Next.js v16.1.6 — separate application, **untouched** | ✅ Running |

### Service topology (simplified)

```
Internet → nginx:443 → vault-lms.duckdns.org
  ├── /api/* → 127.0.0.1:5055 (Vault FastAPI → SurrealDB:8000)
  └── /* → 127.0.0.1:3003 (Vault Next.js standalone)
```

AetherLink is served separately at `aetherlink.cloud-ip.cc:443 → 127.0.0.1:3002` and is not reachable via the Vault domain.

---

## Route Verification

All routes verified at `https://vault-lms.duckdns.org` with `curl`.

| Route | Expected | Observed | Status |
|-------|----------|----------|--------|
| `/` | `200` | `200` | ✅ |
| `/vault` | `200` | `200` | ✅ |
| `/sources` | `200` | `200` | ✅ |
| `/notebooks` | `200` | `200` | ✅ |
| `/owner` (no cookie) | `307` → `/login?owner=1&next=%2Fowner` | `307` → `/login?owner=1&next=%2Fowner` | ✅ |
| `/owner/ai` (no cookie) | `307` → `/login?owner=1&next=%2Fowner%2Fai` | `307` → `/login?owner=1&next=%2Fowner%2Fai` | ✅ |
| `/owner` (with `vault-owner-access=granted`) | `200` | `200` | ✅ |
| `/owner/ai` (with cookie) | `200` | `200` | ✅ |
| `/admin` | `307` → `/owner` | `307` → `/owner` | ✅ |
| `/settings/api-keys` | `307` → `/owner/ai` | `307` → `/owner/ai` | ✅ |
| `/api/auth/status` | Auth status JSON | `{"auth_enabled":false,"message":"Authentication is disabled"}` | ✅ |

### Owner Gate Verification

The owner-protected routes (`/owner`, `/owner/ai`, `/owner/runtime`, `/owner/settings`) are gated by two layers:

1. **Next.js middleware** (`src/proxy.ts`, compiled to `.next/server/middleware.js`): intercepts requests to `/owner*`, `/admin*`, and `/settings/api-keys`. Without a valid `vault-owner-access=granted` cookie, it issues a `307` redirect to `/login?owner=1&next=<original-path>`. The original path is preserved in the `next` query parameter so the middleware can redirect back after login.

2. **Next.js config redirects** (`next.config.ts`): legacy `/admin` and `/settings/api-keys` routes redirect to the canonical owner destinations before the page renders.

Verified behavior:
- **No cookie**: `307` → `/login?owner=1&next=%2Fowner` (redirect preserved through `-L` follow)
- **With cookie**: `200` — page renders normally
- The `login` page itself shows a login form and does not leak owner content

---

## Learner-Loop Copy Verification

The following phrases were confirmed present in the deployed JavaScript bundles, proving the latest build is served:

| Phrase | Found in bundle | What it proves |
|--------|-----------------|----------------|
| `"Review queue"` | `1_xfx31f_40zc.js` | Delta D review queue section is built in |
| `"Study this material"` | `1_xfx31f_40zc.js` | Casing normalization applied (sentence case) |
| `"Add material"` | `1_xfx31f_40zc.js` | Casing normalization applied (sentence case) |
| `"Open material"` | `1_xfx31f_40zc.js` | Casing normalization applied (sentence case) |
| `"Check yourself"` | `1_xfx31f_40zc.js` | Delta C retrieval practice flow is built in |
| `"Nothing to review"` | `1_xfx31f_40zc.js` | Review queue empty state is present |

These strings are served from the `.next/static/chunks/` directory via the standalone server at port 3003, confirming the build at `cf7ff84` is active.

---

## Deployment Fixes Applied

Three issues were found during verification and corrected. **No application code was changed** — all fixes are operations-only.

### 1. Stale Standalone Server

**Problem:** The Vault frontend process (port 3003) had been started at `10:54` from a pre-Delta build. The standalone server at `.next/standalone/server.js` had been overwritten by the latest build at `17:15`, but the running process still used the old code in memory. This caused:
- `/owner` returning `404` instead of `307` (no middleware)
- `/settings/api-keys` redirecting to `/admin/api-keys` instead of `/owner/ai`
- Missing learner-loop features

**Fix:** Kill the old process (PID 1886183 / 1886194) and restart:
```bash
kill -TERM <old-pid>
cd /root/vault-open-notebook/frontend
PORT=3003 HOSTNAME=0.0.0.0 node .next/standalone/server.js
```

### 2. Missing Static Files

**Problem:** Next.js `output: 'standalone'` does not automatically copy `.next/static/` into `.next/standalone/.next/static/`. The standalone server serves HTML correctly but returns `404` for all `/_next/static/*` assets (JS bundles, CSS, fonts, images), breaking the client-side app.

**Fix:** Manually copy the static directory into the standalone output:
```bash
cp -r /root/vault-open-notebook/frontend/.next/static \
      /root/vault-open-notebook/frontend/.next/standalone/.next/static
```
Then restart the frontend process.

### 3. Owner Gate Non-Functional Under Stale Build

**Problem:** With the stale build, the middleware (proxy.ts) was not present or not registered, so `/owner` returned a prerendered static `404` page instead of redirecting to the login gate.

**Fix:** Resolved automatically by restarting the latest build, which includes the compiled middleware.

---

## Known Deployment Caveats

1. **No bare `/health` endpoint.** The API responds at `/api/auth/status` but does not expose a standalone health-check route. The OpenAPI paths all live under `/api/*`. A monitoring health check would need to hit `/api/auth/status` (or a dedicated `/health` endpoint added later).

2. **Owner gate is stronger than hidden UI but not full RBAC.** The middleware cookie gate (`vault-owner-access=granted`) prevents unauthenticated access to owner routes, but:
   - Anyone who knows the cookie name/value can bypass it
   - There is no server-side role verification
   - There is no user account system
   - The login page has no password in the default configuration (`auth_enabled: false`)

3. **Static-copy step is manual.** The `cp -r .next/static .next/standalone/.next/static/` step is required after every `npm run build` and must be automated in the deployment script.

4. **AetherLink must stay on port 3002, bound to `127.0.0.1`.** The Vault deployment uses port 3003 publicly via nginx. AetherLink is bound to localhost only on port 3002, served by a separate nginx `server_name` block (`aetherlink.cloud-ip.cc`). These must not overlap.

5. **Process identity matters, not only port response.** Port `3003` answering `200` does not guarantee the correct build is running. Always verify:
   - Build ID (`cat .next/BUILD_ID`)
   - Process start time (`ps -p <pid> -o lstart=`)
   - Static chunk filenames match what the HTML references
   - Learner-loop phrases are present in bundles

---

## Recommended Next Ops Follow-Ups

### A. Deploy Script

Add a `deploy.sh` that runs the full cycle atomically:

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /root/vault-open-notebook/frontend

npm run build
cp -r .next/static .next/standalone/.next/static
kill "$(lsof -ti :3003)" 2>/dev/null || true
sleep 1
PORT=3003 HOSTNAME=0.0.0.0 nohup node .next/standalone/server.js \
  > /var/log/vault-frontend.log 2>&1 &
echo "Vault frontend restarted (PID: $!)"
```

### B. API Health Endpoint

Expose a lightweight health endpoint at `/api/health` (or document `/api/auth/status` as the canonical health check) to support monitoring and automated smoke tests.

### C. Process Manager / Service File

Create a `systemd` unit file for the Vault frontend standalone server:

```ini
[Unit]
Description=Vault Next.js Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/vault-open-notebook/frontend
ExecStart=/usr/bin/node .next/standalone/server.js
Environment=PORT=3003
Environment=HOSTNAME=0.0.0.0
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

This enables `systemctl start vault-frontend`, automatic restart on crash, and integration with `journalctl`.

### D. Smoke-Test Script

Create `scripts/smoke-test.sh` for post-deployment validation:

```bash
#!/usr/bin/env bash
BASE="${1:-https://vault-lms.duckdns.org}"

check() { curl -s -o /dev/null -w '%{http_code}' "$1"; }

echo "Root:       $(check "$BASE/")"
echo "Vault:      $(check "$BASE/vault")"
echo "Sources:    $(check "$BASE/sources")"
echo "Owner:      $(check -I "$BASE/owner" 2>&1 | grep -oP 'location: \K.*')"
echo "API status: $(curl -s "$BASE/api/auth/status" | grep -oP '"message":"[^"]*"')"
echo "Copy smoke: $(curl -s "$BASE/_next/static/chunks/1_xfx31f_40zc.js" | grep -c 'Review queue')"
```

### E. Owner Password Rotation

Document the owner password mechanism. Currently auth is disabled (`auth_enabled: false`). When enabled, the password is set via environment variable and should be rotated periodically. The owner cookie (`vault-owner-access`) has a 12-hour TTL (`OWNER_ACCESS_COOKIE_MAX_AGE`).

---

## Validation

| Check | Result |
|-------|--------|
| `git status --short` | Clean |
| Working tree after doc commit | Clean |

---

## Known Commits in Scope

| Commit | Phase | Description |
|--------|-------|-------------|
| `cf7ff84` | Docs | Delta learner loop checkpoint (this doc's anchor) |
| `9c654fa` | Delta D | Review queue shell |
| `5d932a9` | — | Acceptance polish — casing normalization |
| All prior Alpha–Delta commits | Alpha–Delta | Learner loop, owner shell, study features |
