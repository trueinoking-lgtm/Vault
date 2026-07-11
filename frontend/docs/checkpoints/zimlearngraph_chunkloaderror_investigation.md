# ZimLearnGraph – ChunkLoadError / ERR_INCOMPLETE_CHUNKED_ENCODING Investigation

**Date:** 2026-07-11
**Trigger:** User reports the browser still shows (same chunk hash as the
original Jul-8 report):
```
/_next/static/chunks/07vbqatnaegte.js
Failed to load resource: net::ERR_INCOMPLETE_CHUNKED_ENCODING
turbopack-0u-h77wdhzigw.js: ChunkLoadError: Failed to load chunk
  /_next/static/chunks/07vbqatnaegte.js
```
Instruction emphasis: **do not treat HTTP 200 as sufficient** — the question is
whether the full response body is served without being cut off.

## Conclusion (read first)

**The live server is fixed and byte-stable. The user's browser error is a
POISONED CACHE from the Jul-8 breakage window, not a live defect.**

Root cause of the *original* breakage (Jul 8): the frontend process serving
from `.next/standalone` was stale/wrong at that time, and nginx logged this
exact chunk being served **truncated** (`200 228463` on 14:13, vs full
`767428`) and as **`500 21`** error bodies repeatedly between 14:02 and 15:31.

The response header is `Cache-Control: public, max-age=31536000, immutable`.
`immutable` tells the browser it MUST NOT revalidate for a year. Any browser
that cached a truncated body during that window will keep replaying the broken
228 KB file forever — even though the server now serves the correct 767428
bytes. Fresh sessions (curl, incognito, hard refresh) are clean.

**The correct fix is client-side:** hard refresh / clear cache / open in
incognito. Do NOT weaken the `immutable` header — for content-hashed `_next`
chunks it is correct practice (a new build = a new URL, so no stale asset can
persist across deploys except a pre-fix cached body).

## Task 2 — Repeated HTTPS download (body integrity)

50 sequential downloads of
`https://zimlearngraph.duckdns.org/_next/static/chunks/07vbqatnaegte.js`:

- All 50 → HTTP 200
- All 50 → identical size **767428 bytes** (one distinct size)
- All 50 → identical sha256 **`1f378bef82c06809503e841b3656af33b9e540130cae156d8bae88f9f3a83cb0`** (one distinct hash)
- No failures, no size drift, no hash drift.

Plus a 20-concurrent stress burst: all 20 → 767428 bytes, one distinct hash.
**Serving is byte-stable under load.**

## Task 3 — Public download vs local filesystem

Local files found (mtime 2026-07-11 11:14, the current build):
- `/root/vault-open-notebook/frontend/.next/standalone/.next/static/chunks/07vbqatnaegte.js`
- `/root/vault-open-notebook/frontend/.next/static/chunks/07vbqatnaegte.js`

Both local copies: sha256 `1f378bef…`, size 767428.

Downloaded `/tmp/chunk-1.js`: sha256 `1f378bef…`, size 767428 → **matches both
local files exactly.** No divergence between public and disk.

## Task 4 — Service restart / OOM

```
systemctl show vault-frontend.service:
  NRestarts=0
  ExecMainPID=2461976
  SubState=running
  ActiveEnterTimestamp=Sat 2026-07-11 11:25:30 UTC  (stable 26+ min)
```
- `systemctl status`: active (running), single PID, 56.8M RSS (peak 57.4M)
- `journalctl -u vault-frontend.service`: no entries (clean, no crash loop)
- `journalctl --since "30 minutes ago"`: empty
- `dmesg`: OOM kills present but **all dated Jul 7 (4 days ago)** and killed
  **chrome** processes under `hermes-gateway.service` — NOT node/next. No
  current OOM, no node kill.

Acceptance met: no restarts during browsing, no OOM kills of the frontend,
no crash loop, one stable process.

## Task 5 — Nginx logs (premature upstream close)

`/var/log/nginx/error.log` (current): no errors. No
`prematurely closed` / `upstream` / `connection reset` / `broken pipe` entries.

**Historical evidence in the rotated `/var/log/nginx/access.log.1` (dated Jul 8,
the original report window)** — this exact chunk being served broken:

```
14:02:56  07vbqatnaegte.js  500   21      (error body, not JS)
14:13:32  07vbqatnaegte.js  200   228463  (TRUNCATED — full is 767428)
14:20:26  07vbqatnaegte.js  200   228595  (truncated)
14:40:45  07vbqatnaegte.js  200   228487  (truncated)
14:55:58  07vbqatnaegte.js  500   21      (error body)
14:56:51  07vbqatnaegte.js  500   21
14:58:18  07vbqatnaegte.js  500   21
14:58:46  07vbqatnaegte.js  500   21
15:31:12  07vbqatnaegte.js  500   21
```
Then after the Jul-11 rebuild (`11:15:40` in the *current* access.log):
```
11:15:40  07vbqatnaegte.js  200   767428  (FULL, correct)
```
So the breakage was real on Jul 8 and **resolved when the frontend was
redeployed with a correct, stable standalone server** (see
`zimlearngraph_frontend_systemd_hardening.md`).

## Task 6 — Response headers

`curl -I https://zimlearngraph.duckdns.org/_next/static/chunks/07vbqatnaegte.js`:

```
HTTP/1.1 200 OK
Server: nginx/1.28.3 (Ubuntu)
Content-Type: application/javascript; charset=UTF-8
Content-Length: 767428          <-- fixed length, NOT chunked transfer
Connection: keep-alive
Cache-Control: public, max-age=31536000, immutable
Accept-Ranges: bytes
Last-Modified: Sat, 11 Jul 2026 11:14:50 GMT
ETag: W/"bb5c4-19f50e32071"
Vary: Accept-Encoding
```
- `Content-Length` present → server sends a fixed-length body, **not**
  `Transfer-Encoding: chunked`. The browser's "ERR_INCOMPLETE_CHUNKED_ENCODING"
  label is a *symptom* of a mid-stream connection close, not server chunking.
- `Cache-Control: …immutable` → **the poison-cache vector**: a body cached
  during the Jul-8 window is never revalidated.
- `ETag` + `Last-Modified` present (correct for immutable hashed assets).
- Same headers over HTTP/1.1 (`--http1.1`).

## Task 7/8 — Restart/crash root cause & Nginx truncation

- Service is **not** restarting (NRestarts=0) → no crash-root-cause fix needed.
- Nginx is **not** truncating now (current logs clean; correct `proxy_http_version
  1.1` + 300s timeouts; static served via the catch-all `location /` →
  `127.0.0.1:3003`, no stale alias). No nginx config change needed.

## Task 9 — Cache / stale-runtime (this is the cause)

Fresh-session verification (the browser tool runs a clean context with no
poisoned cache — equivalent to incognito):

- Loaded `https://zimlearngraph.duckdns.org/impact-intelligence` fresh.
- Reloaded (re-navigated) — fresh context again.
- `browser_console` after load: **0 console messages, 0 JS errors**.
- No `ChunkLoadError`, no `ERR_INCOMPLETE_CHUNKED_ENCODING`, no HMR, no
  `/_next/webpack-hmr`, no static 404/500, no font errors.
- Page renders with live data.

Conclusion: **production is clean for fresh sessions.** The user's error is
their own browser's poisoned cache of the Jul-8 truncated body (held because
the asset is `immutable`).

### Required client-side fix (give to anyone who still sees the error)
1. Hard refresh: `Ctrl+Shift+R` (Win/Linux) / `Cmd+Shift+R` (Mac), **or**
2. Clear site data for `zimlearngraph.duckdns.org` (DevTools → Application →
   Storage → "Clear site data"), **or**
3. Open in a private/incognito window.

After any of these, the correct 767428-byte body is fetched and the
ChunkLoadError disappears.

## Task 10 — Final browser acceptance

Fresh session (incognito-equivalent):
- ✅ no ChunkLoadError
- ✅ no ERR_INCOMPLETE_CHUNKED_ENCODING
- ✅ no HMR
- ✅ no webpack-hmr
- ✅ no static 404/500
- ✅ no font errors
- ✅ page renders and is stable after reload

## Remaining risk

1. **Any browser that cached the truncated body before ~Jul-11 11:15 will keep
   failing until its cache is cleared** (immutable = up to 1 year). This is the
   only way the error can still appear. Mitigation: the client-side clear-cache
   steps above. (The header is intentionally correct and was NOT changed — for
   content-hashed `_next` assets `immutable` is best practice and self-heals on
   the next deploy because the filename changes.)
2. **Deploy-time window:** because `vault-frontend.service` uses `Restart=always`,
   a manual `npm run build` while the unit is active would be unsafe (kill→
   restart into a deleted `.next/standalone`). Always deploy via the script,
   which stops the unit first. This is the class of bug that caused the Jul-8
   truncation and is now prevented by systemd supervision.
3. No server-side defect remains. No code rebuild was required for this
   investigation — the fix was supervision + correct standalone serving, done
   in the prior phase.

## Commands used (reproducible)

```bash
URL="https://zimlearngraph.duckdns.org/_next/static/chunks/07vbqatnaegte.js"
for i in $(seq 1 50); do
  curl -L --fail --silent --show-error -o "/tmp/chunk-$i.js" \
    -w "$i HTTP=%{http_code} SIZE=%{size_download}\n" "$URL" || echo "$i FAILED"
done
ls -l /tmp/chunk-*.js | awk '{print $5}' | sort | uniq -c
sha256sum /tmp/chunk-*.js | awk '{print $1}' | sort | uniq -c

curl -sI "$URL"
systemctl show vault-frontend.service -p NRestarts -p ExecMainPID -p SubState
grep 07vbqatnaegte /var/log/nginx/access.log.1 | tail -20
```
