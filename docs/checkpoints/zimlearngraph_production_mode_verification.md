# ZimLearnGraph Production Mode Verification

> **Audit and fix of the production deployment on port 3003 (standalone)**

**Date:** 2026-07-07  
**Domain:** zimlearngraph.duckdns.org (proxied through nginx → localhost:3003)

---

## Problem

The live site at zimlearngraph.duckdns.org was serving a Next.js **development build** (Turbopack dev server). The browser console showed:

- React DevTools "This page is using the development build of React" warning
- WebSocket connection errors to `/_next/webpack-hmr`
- Turbopack/HMR client chunk references in the HTML
- Runtime development-only error overlays on asset failures

This is not acceptable for a live demo. Dev servers expose source maps, allow arbitrary code execution via HMR, and deliver significantly degraded performance compared to production builds.

---

## Investigation

### Wrong Process (BEFORE)

```
PID 2191178  next-server (v16.2.6)  — Launched via:
  bash → npm exec → sh → node /.../next dev -p 3003
```

The full process chain:
```
2191142  /bin/bash -lic "set +m; cd .../frontend && npx next dev -p 3003"
2191152  npm exec next dev -p 3003
2191165  sh -c next dev -p 3003
2191166  node .../node_modules/.bin/next dev -p 3003
2191178  next-server (v16.2.6) — **Turbopack dev server**
```

This was started via the earlier Phase L8 work using `npm run dev` instead of a production build.

### Correct Process (AFTER)

```
PID 2192765  next-server (v)  — Launched via:
  node .../.next/standalone/server.js
```

The full process chain:
```
2192755  node server.js  (standalone production server)
2192765  next-server (v)  — **Production build**
```

---

## Fix Applied

### 1. Kill Dev Server

Killed the entire process tree: PIDs 2191178, 2191166, 2191165, 2191152, 2191142, 2191198.

### 2. Fix Build Blocker

The production build failed with:
```
⨯ useSearchParams() should be wrapped in a suspense boundary at page "/login"
```

**Fix:** Wrapped `LoginForm` in `<Suspense>` with a fallback loading state in `src/app/(auth)/login/page.tsx`.

### 3. Production Build

Ran `npm run build` — succeeded.

- Compiler: Next.js 16 (Turbopack, production mode)
- Output: `standalone` (configured in `next.config.ts`)
- Standalone path: `.next/standalone/`

### 4. Start Production Server

```bash
cd .next/standalone
PORT=3003 HOST=127.0.0.1 node server.js
```

### 5. Fix Standalone Static Assets

Standalone mode does not automatically include `public/` files. Copied `favicon.svg` and other public assets to `.next/standalone/public/`.

---

## Verification Results

### Console Artifacts Check

| Artifact | Dev Server | Production Standalone | Status |
|---|---|---|---|
| `/_next/webpack-hmr` | Present (WebSocket) | Absent | ✅ |
| `react-refresh` runtime | Present | Absent | ✅ |
| `__NEXT_DEV` flag | Set | Not set | ✅ |
| React DevTools dev warning | Shows | Does not show | ✅ |
| Turbopack chunk references | Build artifact? | Build artifact (Next.js 16) | ⚠️ Acceptable |
| Source maps served | Yes (inline) | No | ✅ |

**Note on Turbopack chunks:** Next.js 16 uses Turbopack as the production bundler by default. The presence of `turbopack-*.js` chunk filenames is expected in both dev and production modes. Unlike webpack's HMR, Turbopack's production chunks do NOT include WebSocket/HMR connections — they are standard compiled bundles. Verified by absence of `webpack-hmr`, `react-refresh`, and `__NEXT_DEV`.

### Route Checks

| Route | Status | Content |
|---|---|---|
| `/` | `200` | Redirects to `/impact-intelligence` (nginx) |
| `/impact-intelligence` | `200` | Landing page with WebGL scene |
| `/impact` | `200` | Impact Intelligence app with seeded demo data |
| `/impact/school-dashboard` | `200` | School dashboard (if school selected) |
| `/impact/classes` | `200` | Classes management |
| `/impact/ministry-demo` | `200` | Ministry demo view |
| `/favicon.svg` | `200` | Branded "Z" on cyan→blue gradient |
| `/favicon.ico` | `200` | Fallback favicon |

### Static Asset Checks

| Asset | Status |
|---|---|
| `/_next/static/chunks/*.js` | All `200` |
| `/_next/static/media/*.woff2` | All `200` |
| `/_next/static/css/*.css` | All `200` |
| `/favicon.svg` | `200` |
| `/favicon.ico` | `200` |

### WebGL Check

The WebGL canvas is rendered in the `HeroScene` component (R3F). The Three.js bundle is included in the production JS chunks. WebGL rendering depends on client-side browser capability (not verifiable from server-side curl). The production build includes the full R3F dependency tree.

---

## Commit Summary

All changes from Phase L8 (visual parity) and this production fix are committed together:

| File | Change |
|---|---|
| `frontend/src/app/(auth)/login/page.tsx` | Fixed build blocker: wrapped LoginForm in Suspense boundary |
| `docs/checkpoints/zimlearngraph_production_mode_verification.md` | This document |
| (Plus all Phase L8 changes documented in `impact_landing_app_visual_parity.md`) | |

---

## Rollback Instructions

To revert to dev server (not recommended):

```bash
kill $(lsof -ti :3003)
cd /root/vault-open-notebook/frontend
npx next dev -p 3003 -H 127.0.0.1
```

To rebuild production after future changes:

```bash
cd /root/vault-open-notebook/frontend
npm run build
cp public/* .next/standalone/public/
kill $(lsof -ti :3003)
cd .next/standalone && PORT=3003 HOST=127.0.0.1 node server.js
```
