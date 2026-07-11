# ZimLearnGraph — Temporary Browser Cache Purge (poisoned chunk)

**Date:** 2026-07-11
**Trigger:** After the cache-bust release (`fix: cache-bust impact landing
chunk`, `8617e4c`), the user's *normal* browser STILL showed:
```
/_next/static/chunks/07vbqatnaegte.js
ERR_INCOMPLETE_CHUNKED_ENCODING 200
ChunkLoadError
```
while the live HTML no longer referenced that chunk.

## Why the old chunk persisted in the user's browser

The server was already serving the new build (live HTML references new chunk
filenames, not `07vbqatnaegte.js`). The user's browser was still running a
**cached old HTML / module graph** from before the cache-bust release. Because
the document route itself was being cached with `Cache-Control: s-maxage=31536000`
(and the old chunk was `immutable`), an already-poisoned browser kept replaying
its stale module graph and requesting the dead chunk.

**Key lesson:** a content-hash cache-bust fixes *new* visitors automatically,
but it does **NOT** retroactively evict a chunk that an existing browser already
cached as `immutable` during the broken window. Those browsers need an explicit
cache eviction.

## Proof live HTML no longer references the old chunk

```bash
curl -s https://zimlearngraph.duckdns.org/impact-intelligence > /tmp/live.html
grep '07vbqatnaegte.js' /tmp/live.html && echo BAD || echo OK
# -> OK old chunk not in live HTML
```

## Headers — before / after

### Before (document `/impact-intelligence`)
```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Cache-Control: s-maxage=31536000
ETag: "kfx3lwdowh1tua"
```
No browser-facing `no-store`/`must-revalidate`, no `Clear-Site-Data`. The
document could be cached long-term.

### After (document `/impact-intelligence`)
```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Cache-Control: no-store, must-revalidate
Clear-Site-Data: "cache"
ETag: "kfx3lwdowh1tua"
```
`proxy_hide_header Cache-Control` strips Next's `s-maxage=31536000`; nginx then
adds `no-store, must-revalidate` + `Clear-Site-Data: "cache"` on document
routes only.

### `/_next/static/` (unchanged — stays immutable)
```
HTTP/1.1 200 OK
Cache-Control: public, max-age=31536000, immutable
```
Hashed static assets remain immutable (correct; they self-heal on every deploy
because filenames change). `Clear-Site-Data` is NOT applied here.

### `/api/` (unchanged)
No `no-store` / `Clear-Site-Data` applied to API routes.

## What was changed (nginx only, no rebuild)

File: `/etc/nginx/sites-available/zimlearngraph` (for this host), synced from
`deploy/nginx/impact-standalone.conf` in the repo.

1. Added a dedicated `location /_next/static/` block that proxies to the
   frontend and passes through Next's immutable `Cache-Control` for hashed
   assets (excluded from the document cache-bust).
2. In the document `location /` block, added:
   ```nginx
   proxy_hide_header Cache-Control;
   add_header Cache-Control "no-store, must-revalidate" always;
   add_header Clear-Site-Data "\"cache\"" always;
   ```
   Applied to HTML documents + app routes only. `/api/` and `/_next/static/`
   are separate locations and are unaffected.

No service rebuild, no frontend restart, no code change. Nginx reload only
(`nginx -t` passed, `systemctl reload nginx` clean).

## When to remove the temporary headers

The `Clear-Site-Data: "cache"` + `no-store` on documents is **temporary**.
Remove the three marked TEMPORARY lines from the document `location /` block
**after 2026-07-13** (≈48h from deploy), once old poisoned clients have had a
chance to load the page and evict their cache. After removal, documents should
return to a sane `must-revalidate` policy (or revert to Next's default) while
`/_next/static/` stays immutable. Leaving `no-store` permanently would disable
useful document caching; leaving `Clear-Site-Data` permanently is unnecessary
once the poisoned population has refreshed.

## Exact user-side fix (give to anyone still seeing the error)

Even with the server purge header, the most reliable one-time action:

1. Close **all** zimlearngraph.duckdns.org tabs/windows.
2. Clear site data once: DevTools → Application → Storage → "Clear site data"
   for `zimlearngraph.duckdns.org` (or browser settings → clear cookies/site
   data for that domain).
3. Reopen `https://zimlearngraph.duckdns.org/impact-intelligence`.

Alternatively, open in an incognito/private window — a fresh context has no
poisoned cache. After this, the correct new chunk filenames are fetched and the
ChunkLoadError is gone.

## Verification

- Live HTML does not reference `07vbqatnaegte.js`.
- Document route returns `no-store, must-revalidate` + `Clear-Site-Data: "cache"`.
- `/_next/static/*` still `200` and `immutable`.
- `/api/*` not affected.
- `nginx -t` OK, `systemctl reload nginx` clean.
- Frontend service unchanged (still `vault-frontend.service`, active).
