# ZimLearnGraph Static Asset Verification

> **Root cause analysis and fix for production static asset 404s on zimlearngraph.duckdns.org**

**Date:** 2026-07-07  
**Server:** Next.js production standalone on port 3003, proxied through nginx (TLS)

---

## Root Cause

The Next.js standalone server was running but its `.next` directory was **missing the `static/` directory entirely**.

| Location | Expected | Actual |
|---|---|---|
| `frontend/.next/static/` | Build output (165 files) | ✅ 165 files present |
| `frontend/.next/standalone/.next/static/` | Copy needed for runtime | ❌ **0 files — empty directory** |
| `frontend/.next/standalone/public/` | Public assets | ❌ Missing `favicon.svg` |

The standalone server at `.next/standalone/server.js` serves `/_next/static/*` from `.next/standalone/.next/static/`. When no files exist there, every static chunk request returns 404.

### Why 404 Happened

`npm run build` generates static assets in `frontend/.next/static/`. The standalone output (`output: "standalone"` in `next.config.ts`) creates `.next/standalone/` — but the **`static/` directory was not automatically propagated** to `standalone/.next/static/`. This is a known Next.js standalone quirk: the build copies server code but static assets need to be present in the right location within the standalone tree.

The nginx config was clean — no stale alias, just a plain `proxy_pass http://127.0.0.1:3003;`. All 404s were caused by the standalone server itself not having the files.

---

## Old Process (Broken)

```
PID 2192765  next-server (v)
CWD: /root/vault-open-notebook/frontend/.next/standalone
CMD: node server.js
STATIC FILES: 0 in standalone/.next/static/
```

## New Process (Fixed)

```
PID 2193364  node server.js
CWD: /root/vault-open-notebook/frontend/.next/standalone  
CMD: node server.js
STATIC FILES: 165 in standalone/.next/static/, 8 in standalone/public/
```

---

## Fix Applied

### Step 1: Copy static assets

```bash
cd /root/vault-open-notebook/frontend
rm -rf .next/standalone/.next/static
mkdir -p .next/standalone/.next
cp -a .next/static .next/standalone/.next/static
```

### Step 2: Copy public assets

```bash
rm -rf .next/standalone/public
cp -a public .next/standalone/public
```

### Step 3: Restart server

```bash
kill $(lsof -ti :3003)
cd .next/standalone
PORT=3003 HOST=127.0.0.1 node server.js
```

### Asset Counts After Fix

| Location | Files |
|---|---|
| `standalone/.next/static/chunks/` | 94 entries |
| `standalone/.next/static/media/` | 68 entries |
| `standalone/public/` | 8 entries |

---

## Verification Results

### Route Checks

| Route | Localhost | HTTPS (public) | Status |
|---|---|---|---|
| `/` | 200 | 302 (redirect → /impact-intelligence) | ✅ |
| `/impact-intelligence` | 200 | 200 | ✅ |
| `/impact` | 200 | 200 | ✅ |
| `/favicon.svg` | 200 | 200 | ✅ |
| `/favicon.ico` | 200 | 200 | ✅ |

### Static Asset Checks

| View | Assets Referenced | All 200 | Status |
|---|---|---|---|
| `/impact-intelligence` | 20 JS/CSS/font files | ✅ 0 failures | ✅ |
| `/impact` | 22 JS/CSS/font files | ✅ 0 failures | ✅ |

### Sample Assets Verified (over HTTPS)

```
/_next/static/chunks/047-cys6mtmnu.js             → 200
/_next/static/chunks/05qmwjqau64bz.css           → 200
/_next/static/chunks/turbopack-0cio-yl.s9z~1.js  → 200
/_next/static/media/83afe278b6a6bb3c-s.p...woff2 → 200
```

### Console Artifact Check

| Artifact | Present | Status |
|---|---|---|
| `/_next/webpack-hmr` | No (not requested) | ✅ |
| `react-refresh` runtime | No | ✅ |
| `__NEXT_DEV` flag | No | ✅ |
| React DevTools dev warning | No | ✅ |
| Turbopack chunks | Yes (build artifact) | ⚠️ Acceptable |
| Static 404 errors | None | ✅ |

### Nginx Check

No stale `/_next/static` alias exists. All requests proxy cleanly to the standalone server:

```nginx
location / {
    proxy_pass http://127.0.0.1:3003;
    # no stale alias for /_next/static
}
```

### Working Tree

```
M  frontend/.next/standalone/... (build artifacts, not tracked)
M  frontend/src/app/(auth)/login/page.tsx  (Suspense fix)
```

---

## Future Build Checklist

After running `npm run build`, always run:

```bash
cd /root/vault-open-notebook/frontend
rm -rf .next/standalone/.next/static .next/standalone/public
cp -a .next/static .next/standalone/.next/static
cp -a public .next/standalone/public
```

Then restart the server.

---

*Verification complete. All routes, static assets, and SSL certs are functional.*
