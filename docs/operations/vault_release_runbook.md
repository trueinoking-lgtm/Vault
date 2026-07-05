# Vault Release / Deployment Runbook

**Target domain:** `https://vault-lms.duckdns.org`  
**Last updated:** 2026-07-05

> Throughout this runbook, `$REPO_DIR` refers to the repository root.
> On the production VPS this is `/root/vault-lms/repo` (do not rely on the
> directory name matching old project naming). Set it once before running commands:
> ```bash
> REPO_DIR=/root/vault-lms/repo
> ```

---

## 1. Runtime Layout

| Service | Port | Access | Technology |
|---------|------|--------|------------|
| **Vault frontend** | `3003` | `0.0.0.0:3003` (public) | Next.js 16 standalone |
| **Vault backend (API)** | `5055` | `127.0.0.1:5055` (local-only) | FastAPI / uvicorn |
| **SurrealDB** | `8000` | `127.0.0.1:8000` (local-only) | SurrealDB |
| **AetherLink** | `3002` | `127.0.0.1:3002` (local-only) | Next.js (separate app) |

> **⚠️ CRITICAL:** Vault frontend is on **port 3003**. AetherLink is on **port 3002**.
> Do NOT verify Vault against port 3002. Always use port 3003 or the public domain.

### Process Verification

```bash
# Vault frontend
ss -tlnp | grep 3003
# Expected: LISTEN 0.0.0.0:3003 with node/"next-server"

# Vault backend
ss -tlnp | grep 5055
# Expected: LISTEN 127.0.0.1:5055 with uvicorn

# SurrealDB
ss -tlnp | grep 8000
# Expected: LISTEN 127.0.0.1:8000 with surreal

# AetherLink (separate — do not touch)
ss -tlnp | grep 3002
# Expected: LISTEN 127.0.0.1:3002 (this is NOT Vault)
```

---

## 2. Pre-Release Checklist

Before any release, confirm:

- [ ] Git working tree is clean (`git status --short` → no output)
- [ ] Latest code is pulled (`git log -1 --oneline`)
- [ ] Backend tests pass (`uv run python -m pytest tests/ -q` → all green)
- [ ] Frontend tests pass (`cd frontend && npm test` → all green)
- [ ] Frontend builds clean (`cd frontend && npm run build` → exit 0)
- [ ] No `OPEN_NOTEBOOK_*`, `open_notebook`, or `OpenNotebook` naming in active code (see scrub check below)
- [ ] `VAULT_OWNER_PASSWORD` is set in the environment (for owner-gate smoke)
- [ ] All required environment variables are present (see §7)

---

## 3. Release Process

### Step 1 — Pull Latest & Verify Tree

```bash
cd "$REPO_DIR"
git pull
git status --short          # expect clean
```

### Step 2 — Run Backend Tests

```bash
uv run python -m pytest tests/ -q
# Expected: 363 passed (or latest count)
```

### Step 3 — Run Frontend Tests

```bash
cd frontend
npm test
# Expected: 81 passed (or latest count)
cd ..
```

### Step 4 — Build Frontend

```bash
cd frontend
npm run build
cd ..
```

### Step 5 — Deploy via Standalone Helper

```bash
# Build only (no restart — safe):
bash scripts/deploy_vault_frontend_standalone.sh

# Build + restart + smoke (full deploy cycle):
bash scripts/deploy_vault_frontend_standalone.sh --restart --smoke
```

The deploy helper:

1. Installs dependencies with `npm ci`
2. Runs `npm run build` (Next.js standalone output)
3. Copies `.next/static/` → `.next/standalone/.next/static/` (critical — Next.js does not do this automatically)
4. Copies `public/` → `.next/standalone/public/`
5. Verifies `.next/standalone/server.js` exists
6. (If `--restart`) Stops old process, starts new one via `nohup`
7. (If `--smoke`) Runs HTTP route smoke tests

### Step 6 — Restart Backend (if changed)

```bash
# Find the uvicorn process:
PID=$(pgrep -f "uvicorn api.main:app")
kill -TERM "$PID"
sleep 2

# Restart:
cd "$REPO_DIR"
nohup uv run uvicorn api.main:app --host 0.0.0.0 --port 5055 \
  > /var/log/vault-api.log 2>&1 &

# Verify:
sleep 3
curl -s http://localhost:5055/api/auth/status
```

### Step 7 — Static Asset Verification

After deploying, verify the critical static asset copy step succeeded:

```bash
# Confirm static files exist in the standalone output:
ls -la frontend/.next/standalone/.next/static/
# Should show subdirectories: chunks/, css/, media/, etc.

# Verify a known static asset loads via HTTP:
# Extract a static asset URL from the HTML:
STATIC_URL=$(curl -s https://vault-lms.duckdns.org | grep -oP '/_next/static/[^"'"'"']+' | head -1)
curl -s -o /dev/null -w '%{http_code}' "https://vault-lms.duckdns.org${STATIC_URL}"
# Expected: 200
```

### Step 8 — Route Smoke Test

```bash
# Using the standalone smoke script:
bash scripts/smoke_vault_live.sh https://vault-lms.duckdns.org

# Expected output:
# ✅ Root (/) — 200
# ✅ Vault (/vault) — 200
# ✅ Sources (/sources) — 200
# ✅ Notebooks (/notebooks) — 200
# ✅ Owner gate (/owner) — redirects to /login?owner=1
# ✅ API status (/api/auth/status) — responds with auth_enabled
# ✅ Static asset load — 200
# ✅ All smoke tests passed
```

### Step 9 — API Health Check

```bash
# Backend health:
curl -s http://localhost:5055/health
curl -s https://vault-lms.duckdns.org/api/auth/status

# Expected: JSON with auth_enabled field
```

---

## 4. Rollback Process

### Rolling Back the Frontend

```bash
# 1. Check out the previous commit
cd "$REPO_DIR"
git log --oneline -5                  # find the commit to revert to
git checkout <previous-stable-hash> -- frontend/

# 2. Rebuild the old frontend
cd frontend
npm ci
npm run build
cd ..

# 3. Copy static assets
mkdir -p frontend/.next/standalone/.next/static
cp -r frontend/.next/static/. frontend/.next/standalone/.next/static/

# 4. Restart the server
PID=$(lsof -ti:3003)
kill -TERM "$PID" 2>/dev/null
sleep 2

cd frontend
nohup node .next/standalone/server.js > /var/log/vault-frontend.log 2>&1 &
cd ..

# 5. Smoke test
bash scripts/smoke_vault_live.sh https://vault-lms.duckdns.org
```

### Rolling Back the Backend

```bash
# 1. Check out previous API code
git checkout <previous-stable-hash> -- api/ vault_core/

# 2. Restart uvicorn
PID=$(pgrep -f "uvicorn api.main:app")
kill -TERM "$PID"
sleep 2
cd "$REPO_DIR"
nohup uv run uvicorn api.main:app --host 0.0.0.0 --port 5055 \
  > /var/log/vault-api.log 2>&1 &

# 3. Verify
curl -s http://localhost:5055/api/auth/status
```

### Full Rollback (Frontend + Backend)

```bash
git revert --no-commit HEAD          # revert the latest commit
# or: git reset --hard <previous-hash>

# Then rebuild frontend (steps above) and restart backend (steps above)
```

> **Note:** Database schema migrations run automatically on API startup. If the rollback involves a schema change, you may need to run a down-migration manually. See the database migration docs.

---

## 5. Log Locations

| Component | Log Source | Command |
|-----------|-----------|---------|
| Frontend (nohup) | `/var/log/vault-frontend.log` | `tail -f /var/log/vault-frontend.log` |
| Frontend (systemd) | journald | `sudo journalctl -fu vault-frontend.service` |
| Backend (API) | `/var/log/vault-api.log` | `tail -f /var/log/vault-api.log` |
| Backend (systemd) | journald | `sudo journalctl -fu vault-api.service` |
| SurrealDB | terminal or journald | `sudo journalctl -fu surrealdb` (if running via systemd) |
| Next.js build | stdout (terminal) | Review build output |
| `npm ci` / `npm run build` | stdout (terminal) | `cd frontend && npm run build 2>&1 | tee build.log` |

---

## 6. Common Failure Modes

### Static Assets Returning 404

**Symptom:** Page loads HTML but JS/CSS files return 404.

**Causes (in order of likelihood):**

1. **Missing `.next/standalone/.next/static/`** — Next.js standalone output does not include static files by default. Run the deploy helper or copy manually:
   ```bash
   mkdir -p frontend/.next/standalone/.next/static
   cp -r frontend/.next/static/. frontend/.next/standalone/.next/static/
   ```

2. **Stale browser cache / service worker** — The browser may be loading old chunks. Clear:
   - Open DevTools → Application → Service Workers → Unregister
   - DevTools → Application → Clear site data
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)

3. **Wrong process / old standalone server** — The new build was deployed but the old server process is still running. Verify:
   ```bash
   ss -tlnp | grep 3003
   # Check the PID matches the new build's path
   ls -l /proc/<PID>/cwd 2>/dev/null
   ```

4. **Stale HTML pointing to old chunk names** — If the HTML was cached by a CDN or proxy, the `_next/static` URLs in it may not match the newly built files. Hard refresh or clear CDN cache.

### Port 3003 Already in Use

```bash
# Find and kill the process on 3003
PID=$(lsof -ti:3003)
kill -TERM "$PID"
sleep 2
# Force if still alive
kill -KILL "$PID" 2>/dev/null
```

### Backend Not Responding

```bash
# Check if uvicorn is running
pgrep -f "uvicorn api.main:app"

# Check logs
tail -50 /var/log/vault-api.log

# Restart
kill -TERM $(pgrep -f "uvicorn api.main:app")
sleep 2
cd "$REPO_DIR"
nohup uv run uvicorn api.main:app --host 0.0.0.0 --port 5055 \
  > /var/log/vault-api.log 2>&1 &
```

### Frontend Build Fails

```bash
# Common causes:
# - disk space: check with `df -h`
# - Out of memory: check with `free -m`
# - TypeScript errors: review the build output for type failures
# - Missing dependencies: `cd frontend && npm ci` (clean install)

# If npm ci fails, try:
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
# Then commit the updated package-lock.json
```

### Browser Cleanup Instructions

When a user reports issues after a deploy:

1. **Unregister service worker:**
   - Chrome: DevTools → Application → Service Workers → Unregister
   - Firefox: DevTools → Storage → Service Workers → Unregister

2. **Clear site data:**
   - Chrome: DevTools → Application → Clear site data → Clear
   - Firefox: DevTools → Storage → Clear storage
   - Or: Settings → Privacy & Security → Clear browsing data → Advanced → Site data

3. **Hard refresh:**
   - `Ctrl+Shift+R` (Windows/Linux)
   - `Cmd+Shift+R` (Mac)

---

## 7. Environment Variable Checklist

The following environment variables must be set for the app to work correctly:

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `VAULT_ENCRYPTION_KEY` | **Yes** | Encryption key for credentials and sensitive data |
| `VAULT_OWNER_PASSWORD` | Recommended | Owner password for `/owner` routes (creates global owner users) |
| `VAULT_PASSWORD` | Fallback | General API password (used if `VAULT_OWNER_PASSWORD` is not set) |
| `SURREAL_URL` | **Yes** | SurrealDB connection URL (default: `ws://127.0.0.1:8000/rpc`) |
| `SURREAL_USER` | **Yes** | SurrealDB user (default: `root`) |
| `SURREAL_PASSWORD` | **Yes** | SurrealDB password |
| `SURREAL_NAMESPACE` | **Yes** | SurrealDB namespace |
| `SURREAL_DATABASE` | **Yes** | SurrealDB database name |
| `INTERNAL_API_URL` | For standalone | Backend URL used by frontend rewrites (default: `http://localhost:5055`) |

> **⚠️ Legacy env vars are NOT valid:** Old upstream names such as `OPEN_NOTEBOOK_*` are NOT used by Vault. All Vault-specific variables use the `VAULT_` prefix. Do not set or reference `OPEN_NOTEBOOK_*` variables.

---

## 8. Live Smoke URLs

These are the routes checked during a smoke test:

| Route | Expected | What It Verifies |
|-------|----------|------------------|
| `https://vault-lms.duckdns.org/` | `200` | App root responds |
| `https://vault-lms.duckdns.org/vault` | `200` | Vault dashboard renders |
| `https://vault-lms.duckdns.org/sources` | `200` | Sources page renders |
| `https://vault-lms.duckdns.org/notebooks` | `200` | Notebooks page renders |
| `https://vault-lms.duckdns.org/login` | `200` | Login page renders |
| `https://vault-lms.duckdns.org/owner` (no cookie) | `307` → `/login?owner=1` | Owner gate active |
| `https://vault-lms.duckdns.org/teacher` | `200` | Teacher dashboard renders |
| `https://vault-lms.duckdns.org/api/auth/status` | JSON with `auth_enabled` | API reachable from frontend |
| At least one `/_next/static/...` asset | `200` | Static assets load correctly |

---

## 9. Scrub Check (Naming Audit)

Before every release, verify that no old upstream naming has been reintroduced:

```bash
rg -n "open_notebook|Open Notebook|open-notebook|OPEN_NOTEBOOK|OpenNotebook" . \
  --type-add 'code:*' \
  -g '!node_modules' -g '!.git' -g '!.next' -g '!package-lock*'
```

**Allowed matches:**
- README attribution (`Open Notebook` fork credit)
- Historical checkpoint / design doc references
- This runbook's legacy warning

**Disallowed matches:** Any occurrence in active source code (`.ts`, `.tsx`, `.py`, `.sh`, config files).

---

## 10. Deploy Smoke Script Reference

The standalone smoke script is at `scripts/smoke_vault_live.sh`:

```bash
# Usage:
bash scripts/smoke_vault_live.sh [base_url]

# Default base URL: https://vault-lms.duckdns.org
# Example with local port:
bash scripts/smoke_vault_live.sh http://localhost:3003
```

The script checks all routes in §8, extracts a static asset URL from the HTML, and verifies it loads. Exit code is `0` on success, `1` on failure.

---

## 11. AetherLink Isolation

Vault and AetherLink are independent applications. Vault deployment never touches AetherLink.

- AetherLink runs on port **3002** (127.0.0.1 only)
- Vault runs on port **3003** (0.0.0.0 — public)
- AetherLink uses its own PM2 process
- Vault uses nohup or systemd
- AetherLink has its own build and deploy process

**If you accidentally break AetherLink:** Restart it via its PM2 process (`pm2 restart aetherlink` or equivalent). Vault's deploy script does not interact with AetherLink in any way.
