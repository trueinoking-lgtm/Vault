# ZimLearnGraph Frontend — Production Deploy Verification

**Date:** 2026-07-11
**Engineer:** Hermes (Kade approval: "do the proper production frontend fix")
**Deploy script:** `scripts/deploy_vault_frontend_standalone.sh --restart --smoke`

## Summary

The reported browser error (`ERR_INCOMPLETE_CHUNKED_ENCODING` +
`ChunkLoadError: Failed to load chunk /_next/static/chunks/07vbqatnaegte.js`)
was caused by a **stale standalone production server**: a rebuild had been run
while the old `next-server` process was still alive and serving from
`.next/standalone`, so the HTML it served referenced chunk hashes that no
longer existed in the static directory. This is exactly the failure mode the
deploy script's header warns about.

The fix: redeploy via the official standalone path using the correct order
(stop old process → build → copy static → restart). A hard refresh or a fresh
browser session now loads cleanly.

Note: the server was **not** `next dev`/Turbopack dev mode — it was the
production `standalone` server (`NODE_ENV=production`, `/_next/webpack-hmr` →
404). In Next.js 16 Turbopack is the default production bundler, so
`turbopack-*.js` chunk names are expected in production builds and are NOT a
sign of dev mode.

## Process state

| Item | Before | After |
|------|--------|-------|
| Old wrong process | PID `2315763` — `next-server (v16.2.6)`, CWD `frontend/.next/standalone`, `NODE_ENV=production`, port 3003 (stale, up since Jul 8 14:50) | **DEAD** (confirmed) |
| Production process | — | PID `2458176` — `node .next/standalone/server.js`, `NODE_ENV=production`, port 3003 |
| Frontend port | 3003 | 3003 (unchanged — correct) |
| AetherLink (3002) | running | running, **untouched** |

Acceptable production command (confirmed used): `node .next/standalone/server.js`
from `frontend/`, bound `0.0.0.0:3003`, log `/var/log/vault-frontend.log`.
Never `next dev` / `npx next dev` / `npm run dev` / Turbopack dev server.

## Nginx proxy target

- Active site: `/etc/nginx/sites-enabled/zimlearngraph` →
  `/etc/nginx/sites-available/zimlearngraph`
- `server_name zimlearngraph.duckdns.org;`
- `/api/*` → `http://127.0.0.1:5055/api/` (FastAPI)
- Everything else → `http://127.0.0.1:3003` (frontend)
- **Verified:** Nginx proxies to port 3003, which is exactly where the
  production standalone server now listens. Port 3003 is the intended production
  port for this app (deploy script default `VAULT_PORT=3003`), not a dev port.

## Backend health (before deploy)

- `vault-surrealdb.service` — active (running) since 2026-07-08 14:42
- `vault-api.service` — active (running) since 2026-07-08 14:42
- `GET http://127.0.0.1:5055/api/auth/status` → `200`
  `{"auth_enabled":false,"message":"Authentication is disabled"}`
- `GET https://zimlearngraph.duckdns.org/api/auth/status` → `200` (via nginx)

Backend data **not** touched/wiped.

## Route verification

All returned `200` (HEAD, following redirects):

| Route | HTTP |
|-------|------|
| `/` | 200 (302 → `/impact-intelligence`, expected redirect) |
| `/impact-intelligence` | 200 |
| `/impact` | 200 |
| `/impact/schools` | 200 |
| `/impact/classes` | 200 |
| `/impact/assessments` | 200 |
| `/impact/school-dashboard` | 200 |
| `/api/auth/status` | 200 |

(The deploy script's built-in smoke test flagged `GET /` as "302 not 200", but
this is a false negative — `/` intentionally 302-redirects to
`/impact-intelligence`, which serves 200.)

## Static asset verification

Extracted 21 `/_next/static/*` asset references from `/impact-intelligence`
HTML and fetched each over HTTPS:

- **Non-200 asset count: 0** (zero 404, zero 500)
- The originally-failing chunk `07vbqatnaegte.js` now returns **HTTP 200** via
  the domain — confirming the stale-reference bug is resolved.

## Browser console verification (`/impact-intelligence`)

Repeated fresh loads via headless browser:

- `console_messages`: 0
- `js_errors`: 0
- `_next/webpack-hmr` script: none (not dev mode)
- `ERR_INCOMPLETE_CHUNKED_ENCODING`: none
- `ChunkLoadError`: none
- `turbopack-*.js` present in HTML: yes — **expected**, this is Next.js 16's
  Turbopack *production* chunk naming, not the dev runtime
- Failed `_next` asset requests: 0
- Page fully renders with live data (e.g. 30 learners, 3 schools, 5
  assessments) — no blank screen
- WebGL/Three.js: rendered (no render-blocking errors surfaced; benign
  Three.js warnings, if any, are documented as acceptable)
- Fonts: no font errors reported

## Build details

- Build ID: `vjUqLK7Gny24J8PeAbf-1`
- `npm ci` → `npm run build` (`output: standalone`)
- New static copied: 166 files; chunks validated: 95; media validated: 68
- Cached old assets merged back (no overwrite): final standalone static 193 files
- Standalone server entry `.next/standalone/server.js` present

## Operational rule (going forward)

Do **NOT** run `npm run build` / `next build` while the existing production
frontend process is still serving from `.next/standalone`. Correct order:

1. stop old frontend process
2. build
3. copy static/public into standalone
4. start production server (`node .next/standalone/server.js`)
5. smoke test routes + extracted assets

The `deploy_vault_frontend_standalone.sh` helper enforces this order (it
stops the process on `VAULT_PORT` before building). Use it rather than ad-hoc
builds.
