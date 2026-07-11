# ZimLearnGraph — Serve Next Static Assets Directly from Nginx

**Date:** 2026-07-11
**Trigger:** After the cache-bust release (`fix: cache-bust impact landing
chunk`, `8617e4c`) and the temporary browser cache purge
(`ops: add temporary browser cache purge for zimlearngraph`, `42a1c4f`), the
user's browser failed on a **NEW** chunk:

```
/_next/static/chunks/0ky4vid.0j9a0.js
ERR_INCOMPLETE_CHUNKED_ENCODING 200
ChunkLoadError
```

This proved the old "poisoned immutable cache" explanation was no longer
sufficient: the app was already on the newer build/runtime, but a *lazily
loaded* chunk was still being truncated. The fix is structural — serve
`/_next/static/*` directly from Nginx with a stable `Content-Length` instead of
proxying it through the Node/Next server.

## Why cache-bust was insufficient

A content-hash cache-bust only helps *new* visitors (new filenames → fresh
fetch). It does **not** fix truncation that happens on the *live server path*.
The new failing chunk showed the real root cause is intermittent truncation of
large/lazy chunks **as they stream through the nginx→Node proxy**, under
concurrent HTTP/2 chunk fetches. Evidence (from `nginx/access.log.1`, Jul 8):
the *same* chunk `0ky4vid.0j9a0.js` (full size 1211590 bytes) was served as:

```
200 372945  ... "GET /_next/static/chunks/0ky4vid.0j9a0.js"
200 373240  ... "GET /_next/static/chunks/0ky4vid.0j9a0.js"
200 373058  ... "GET /_next/static/chunks/0ky4vid.0j9a0.js"
```

i.e. ~373 KB of a 1211 KB file — truncated, then cached `immutable` in the
browser. Identical signature to the original `07vbqatnaegte.js` breakdown.
Serving the file directly from disk via Nginx (`sendfile`, single stable
`Content-Length`, no Node/chunked-stream in the path) removes that failure
mode entirely.

## Current failing chunk

```
0ky4vid.0j9a0.js  (full size 1,211,590 bytes; SHA-256
66c1cc82f8c65e745ccdaf0d66b4d607c7ab19238380469f71974015106e0834)
```

## Before / after response headers

### Before (via nginx→Node proxy)
```
HTTP/1.1 200 OK
Content-Length: 1211590
Cache-Control: public, max-age=31536000, immutable
Server: nginx (proxied from Node; chunked stream under the hood)
```
Intermittently truncated under parallel fetches → `ERR_INCOMPLETE_CHUNKED_ENCODING`.

### After (Nginx direct from disk)
```
HTTP/1.1 200 OK
Content-Length: 1211590
Cache-Control: public, max-age=31536000, immutable
Server: nginx/1.28.3 (Ubuntu)
```
Served from `/var/www/zimlearngraph-static/` via `sendfile`, no Node in path.
No `Transfer-Encoding: chunked`, stable `Content-Length`.

## Direct Nginx location block

```nginx
# Static assets (hashed, content-addressed) — served DIRECTLY from disk by
# Nginx, NOT proxied through the Node/Next server. This gives a stable
# Content-Length + sendfile and avoids Node/Next/proxy truncation of
# large or lazily-loaded chunks (see zimlearngraph_nginx_direct_static_assets.md).
# The alias points at the standalone static dir that the deploy script
# repopulates on every build. No Clear-Site-Data here (immutable is correct).
location ^~ /_next/static/ {
    alias /var/www/zimlearngraph-static/;
    access_log off;
    add_header Cache-Control "public, max-age=31536000, immutable" always;
}
```

Key points:
- `location ^~ /_next/static/` is placed **above** the catch-all `location /`
  proxy, so static requests never reach Node.
- The alias target is `/var/www/zimlearngraph-static/`, a path **outside**
  `/root` (which is `0700` and unreadable by `www-data`).
- `access_log off` reduces log volume for high-frequency static hits.
- **No** `Clear-Site-Data` here (immutable is correct for hashed assets).
- `/api/` and the document `location /` (temporary `no-store`+`Clear-Site-Data`
  purge, removed after 2026-07-13) are untouched.

### Why not `alias` into `.next/standalone` under `/root`?

`/root` is `drwx------`, so the `www-data` nginx worker cannot traverse it →
`403 Forbidden`. The static tree is therefore copied (by the deploy script) to
`/var/www/zimlearngraph-static/` with `chmod -R a+rX`, which `www-data` can
read and traverse.

### `alias` vs `root` vs `try_files` gotcha

- `alias /…/.next/static/;` + `try_files $uri =404;` → **bug**: nginx appends
  the full URI onto the alias, double-prefixing `/_next/static/` → 404.
- `root /…/standalone;` → bug: on-disk path is `standalone/.next/static/...`
  (URL prefix `_next` ≠ on-disk `.next`), so `root + $uri` resolves to the
  nonexistent `standalone/_next/static/...` → 404.
- Final working form: `alias` to the exact static dir **without** `try_files`
  (nginx serves the aliased file directly and 404s on its own when missing).

## Repeated full-body download results (Nginx direct)

100 sequential `curl -L --fail` downloads of
`https://zimlearngraph.duckdns.org/_next/static/chunks/0ky4vid.0j9a0.js`:

- **failures: 0 / 100**
- size distribution: `100 × 1211590 bytes`
- hash distribution: `100 × 66c1cc82f8c65e745ccdaf0d66b4d607c7ab19238380469f71974015106e0834`
- public hash **==** local file hash (exact byte match)

Compare this to the earlier proxy path, where the same chunk intermittently
returned 373 KB.

## Local-vs-public hash comparison

```
local : 66c1cc82f8c65e745ccdaf0d66b4d607c7ab19238380469f71974015106e0834
public: 66c1cc82f8c65e745ccdaf0d66b4d607c7ab19238380469f71974015106e0834
match : YES
```

Local file: `/root/vault-open-notebook/frontend/.next/standalone/.next/static/chunks/0ky4vid.0j9a0.js`
Nginx-served copy: `/var/www/zimlearngraph-static/chunks/0ky4vid.0j9a0.js`

## Browser verification (fresh session)

Loaded `https://zimlearngraph.duckdns.org/impact-intelligence` fresh:
- ✅ no `ChunkLoadError`
- ✅ no `ERR_INCOMPLETE_CHUNKED_ENCODING`
- ✅ no static 404/500
- ✅ no HMR / `webpack-hmr`
- ✅ 0 console messages, 0 JS errors
- ✅ page renders with live data; WebGL/Three.js sections present in DOM

For a browser still holding a poisoned chunk (old `07vbqatnaegte.js` or the
truncated `0ky4vid.0j9a0.js`): close all tabs, clear site data once (or use
incognito), reopen. With static now served directly + immutable, a fresh fetch
always gets the full file.

## Deploy-script compatibility (PART F)

`scripts/deploy_vault_frontend_standalone.sh` updated:

- **Step 12b** (new): after copying `.next/static` →
  `.next/standalone/.next/static`, it syncs that tree into
  `/var/www/zimlearngraph-static/` (`rm -rf` + `cp -r` + `chmod -R a+rX`),
  fails the deploy if the target ends up empty. This guarantees the Nginx
  `alias` target is always repopulated before the service restarts, so the
  direct-static path never points at a stale/missing directory.
- **Smoke test** (new): extracts one `/_next/static/*.(js|css)` asset from the
  live landing HTML and asserts it returns `HTTP 200` + a `Content-Length`
  header — proving static is served directly by Nginx, not the Node proxy.
- The script still stops `vault-frontend.service` before `npm run build`
  (build wipes `.next/standalone`), builds, repopulates static (both standalone
  and `/var/www`), then restarts via systemd. No behavior change to the
  document/API paths.

## Remaining risks

- The `/var/www/zimlearngraph-static/` dir is a **copy** of the build output.
  Any future manual change to static assets must go through the deploy script
  (which syncs it) — do not hand-edit files there expecting them to persist
  across rebuilds.
- The temporary `Clear-Site-Data` + `no-store` on document routes
  (`42a1c4f`) is still in place and should be removed **after 2026-07-13**.
  It is independent of the static change and does not affect `/_next/static/`.
- `immutable` on hashed static assets is correct and is preserved; no
  weakening of caching for `_next/static` (per requirement).

## UPDATE (2026-07-11): temporary cache purge removed

The temporary `Clear-Site-Data` + `no-store` document-route purge
(`42a1c4f`) was removed in `ops: remove temporary zimlearngraph cache purge`
once this direct-static fix was verified. It is no longer needed — the
truncation failure mode is gone at the Nginx layer, so browsers have nothing
poisoned to evict. `/_next/static/*` direct serving is unchanged.
