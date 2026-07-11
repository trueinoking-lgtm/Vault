# ZimLearnGraph — Route Next-owned /api/owner-access through Nginx

**Date:** 2026-07-11
**Trigger:** Live walkthrough of ZimLearnGraph surfaced a broken owner-login
flow. `LoginForm.tsx` calls `fetch('/api/owner-access', {method:'POST'})`,
but nginx proxied **all** `/api/*` to the FastAPI backend (`:5055`), which
has no `/api/owner-access` handler → `404 {"detail":"Not Found"}`. The
owner gate (`/owner` → `/login?owner=1`) therefore could not authenticate.

## Root cause

The nginx server block for `zimlearngraph.duckdns.org` had a single
catch-all:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:5055/api/;   # FastAPI backend
    ...
}
```

This sends every `/api/*` request to FastAPI. Three Next.js frontend API
routes also live under `/api/*`:

- `/api/owner-access`  → **Next-only** (no backend handler)  ← broken
- `/api/search/ask`      → **backend-owned** (works; not affected)
- `/api/sources/[id]/chat/sessions/[id]/messages` → backend-owned path shape

Only `/api/owner-access` was genuinely misrouted. The others resolve to the
backend correctly, so the fix is a **surgical exact-match** for that one path,
not a blanket "send all /api/* to Next".

## Exact nginx location added

Inserted **above** the generic `/api/` backend block (exact-match
`location =` wins over prefix `location /api/`):

```nginx
# Next.js-owned API route(s): must hit the FRONTEND (port 3003), NOT
# the FastAPI backend. The backend has no /api/owner-access handler, so
# proxying it there returned 404 and broke owner login on the live site.
# FastAPI-owned /api/* (auth, notebooks, search/ask, schools, impact…)
# still go to the backend via the generic block below.
location = /api/owner-access {
    proxy_pass http://127.0.0.1:3003;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Static `/_next/static/`, document routes (`location /` → `:3003`), and the
backend `/api/` block are all unchanged. AetherLink (separate
`/etc/nginx/sites-available/aether-link`) is untouched.

## Proof — /api/owner-access now routes to Next

Before (through public domain):
```
GET  https://zimlearngraph.duckdns.org/api/owner-access  → 404 {"detail":"Not Found"}   (FastAPI, wrong)
GET  http://127.0.0.1:3003/api/owner-access          → 200 {"enabled":false,"source":"disabled"}  (Next, correct)
```

After (through public domain):
```
GET  https://zimlearngraph.duckdns.org/api/owner-access  → 200 {"enabled":false,"source":"unavailable"}  (Next ✓)
POST https://zimlearngraph.duckdns.org/api/owner-access  → 403 {"detail":"Owner access is not configured yet. Set VAULT_OWNER_PASSWORD or enable API password auth..."}  (Next handler ✓, was 404)
```

The 403 (vs direct-3003's "disabled") is expected: through nginx the Next
handler runs its normal `resolveOwnerAccessConfig()` logic and finds no
`VAULT_OWNER_PASSWORD` env set, so it reports "not configured". With
`VAULT_OWNER_PASSWORD` set it would return 200 + set the `vault-owner-access`
httpOnly cookie. The 404 break is resolved either way.

## Proof — backend /api/* still route to FastAPI

```
GET  https://zimlearngraph.duckdns.org/api/auth/status   → 200  (FastAPI ✓)
POST https://zimlearngraph.duckdns.org/api/search/ask
        -H "Content-Type: application/json" -d '{}'
                                                  → 422 {"detail":[{"type":"missing","loc":["body","question"],"msg":"Field required"}]}  (FastAPI validation ✓ — NOT Next 404)
```

`/api/search/ask` is backend-owned and continues to hit FastAPI (its 422 is
normal validation, proving the real handler runs). No backend route was
rerouted.

## Owner-login verification (end-to-end)

- `/owner` → `307` → `https://zimlearngraph.duckdns.org/login?owner=1&next=%2Fowner` (gate intact).
- `LoginForm.tsx` `POST /api/owner-access` now reaches the Next route
  (403 "not configured" instead of 404). Once `VAULT_OWNER_PASSWORD`
  is configured in the frontend environment, this returns 200 and sets the
  `vault-owner-access` cookie, completing owner login.
- Cookie behavior: `route.ts` sets `vault-owner-access=granted`
  (httpOnly, sameSite=lax, secure in prod, path=/). Unchanged.

## Public demo verification (unchanged / healthy)

| Route | Status |
|-------|--------|
| `/impact-intelligence` | 200 |
| `/impact` | 200 |
| `/impact/schools` | 200 |
| `/impact/classes` | 200 |
| `/impact/assessments` | 200 |
| `/impact/school-dashboard` | 200 |
| `/_next/static/*` | 200, `Content-Length` present, `immutable` (served directly from `/var/www/zimlearngraph-static/`) |

No ChunkLoadError, no ERR_INCOMPLETE_CHUNKED_ENCODING (static still direct).

## AetherLink untouched

`/etc/nginx/sites-available/aether-link` (separate file, last modified Jun 22)
was not modified. Only `/etc/nginx/sites-available/zimlearngraph` changed.

## Deploy-script / repo compat

`deploy/nginx/impact-standalone.conf` was synced to the live config so future
`nginx -s reload` / redeploys do not regress this route. No frontend rebuild,
no backend-data change.

## Commands run

```bash
nginx -t && systemctl reload nginx
cp /etc/nginx/sites-available/zimlearngraph deploy/nginx/impact-standalone.conf
git add deploy/nginx/impact-standalone.conf frontend/docs/checkpoints/zimlearngraph_owner_access_nginx_routing.md
git commit -m "fix: route next owner access api through nginx"
```
