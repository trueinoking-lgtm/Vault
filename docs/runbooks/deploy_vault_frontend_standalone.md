# Vault Frontend — Standalone Deploy Runbook

## Prerequisites

- Working directory: repository root (`vault-vault/`)
- `node` and `npm` installed and in `PATH`
- `package-lock.json` present (committed — do not delete)
- Port `3003` free for frontend (or override via `VAULT_PORT`)

## Quick Reference

```bash
# Build only (safe — no process restart)
./scripts/deploy_vault_frontend_standalone.sh

# Build + restart the running server
./scripts/deploy_vault_frontend_standalone.sh --restart

# Build + restart + smoke test
./scripts/deploy_vault_frontend_standalone.sh --restart --smoke

# Smoke test only (after manual deploy)
./scripts/deploy_vault_frontend_standalone.sh --smoke
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VAULT_BASE_URL` | `https://vault-lms.duckdns.org` | Base URL for smoke tests |
| `VAULT_PORT` | `3003` | Frontend server port |
| `VAULT_HOSTNAME` | `0.0.0.0` | Bind address for frontend server |

## What the Script Does

1. **Validates location** — confirms `frontend/package.json` exists in the repo root
2. **Validates lockfile** — confirms `package-lock.json` exists so `npm ci` works
3. **`npm ci`** — fast, reproducible dependency install from lockfile
4. **Preserves old static assets** — caches existing standalone static into `frontend/.vault-static-cache/` for stale browser compatibility
5. **Stops old frontend process BEFORE build** — `npm run build` deletes `.next/standalone/` entirely; if the process is still running, its CWD becomes `(deleted)` and static serving breaks (all return 500)
6. **`npm run build`** — Next.js production build (`output: standalone`)
7. **Copies static assets** — `.next/static/` → `.next/standalone/.next/static/` (Next.js standalone does not do this automatically)
8. **Validates** `chunks/` and `media/` directories exist (hard check — fails if empty)
9. **Restores cached old static** — merges old chunks back (no overwrite) for stale browser compatibility
10. **Prunes** cached files older than 14 days
11. **Copies public assets** — `public/` → `.next/standalone/public/`
12. **Verifies server entry** — confirms `.next/standalone/server.js` exists
13. **`--restart` or `--restart-systemd`:** starts new process
14. **`--smoke`:** runs HTTP smoke tests against the deployed URL

## Smoke Test Checks

| Check | Expected | What it verifies |
|-------|----------|------------------|
| `GET /` | `200` | App root responds |
| `GET /vault` | `200` | Vault dashboard renders |
| `GET /sources` | `200` | Sources page renders |
| `GET /notebooks` | `200` | Notebooks page renders |
| `GET /owner` (no cookie) | Redirect to `/login?owner=1` | Owner gate middleware active |
| `GET /api/auth/status` | JSON with `auth_enabled` | API reachable and responds |

## Advisory: `npm ci` vs `npm install`

This script uses **`npm ci`** (clean install) rather than `npm install`. `npm ci`:

- Is **faster** — skips resolution, uses lockfile directly
- Is **deterministic** — produces the exact dependency tree in `package-lock.json`
- **Fails** if `package-lock.json` is out of sync with `package.json` — catches drift early
- **Deletes `node_modules`** first — ensures no stale packages leak between builds

Use `npm install` manually only when intentionally updating dependencies, then commit the updated `package-lock.json`.

## Caveats

- **Static copy is required.** Next.js `output: 'standalone'` does not copy `.next/static/` into the standalone output. Without this step, the server serves HTML but all `/_next/static/*` assets return 404. The script handles this automatically.
- **Process is always stopped before build** to prevent orphaned CWD. The `--restart`/`--restart-systemd` flags control whether a NEW process is started after the build.
- **AetherLink is never touched.** The script operates only inside `frontend/` and only on port `3003`. AetherLink runs on port `3002` and is not affected.
- **PIDs are not hardcoded.** Process discovery uses `ss -tlnp` (more reliable than lsof).
- **No secrets.** The script reads no credentials, secrets, or env files with sensitive data.
