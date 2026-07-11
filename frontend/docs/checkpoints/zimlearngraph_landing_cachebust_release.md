# ZimLearnGraph — Impact Landing Chunk Cache-Bust Release

**Date:** 2026-07-11
**Goal:** Force a new chunk filename so browsers that cached the poisoned,
truncated `07vbqatnaegte.js` (from the Jul-8 breakage window) stop requesting it.

## Why a cache-bust was needed

Investigation (`zimlearngraph_chunkloaderror_investigation.md`) proved the live
server now serves `07vbqatnaegte.js` correctly (50/50 identical downloads,
matching local hash, fresh browser clean). The user's browser still errored
because the response is:

```
Cache-Control: public, max-age=31536000, immutable
```

`immutable` means a body cached during the Jul-8 broken window is never
revalidated. A browser holding the truncated 228 KB body for
`07vbqatnaegte.js` keeps replaying it forever, even though the server now sends
the full 767428 bytes. **The only way to break that client-side cache without
asking every visitor to clear storage is to change the chunk's filename** —
which a content change in the compiled chunk graph triggers automatically.

## What was changed (no-risk, no behavior change)

1. **Landing build marker** — `src/lib/landing/landing-build.ts` (new):
   ```ts
   export const IMPACT_LANDING_BUILD =
     'zimlearngraph-public-demo-stable-v0.4-cachebust-20260711';
   ```
   Imported in `src/components/landing/ImpactLandingPage.tsx` and rendered as
   `data-impact-build={IMPACT_LANDING_BUILD}` on the landing content overlay
   (so the constant is in the emitted JS, not stripped by minification).

2. **i18n catalog cache-bust (the actual fix)** — added an unused `cacheBust`
   key to the `common` section of **all 14 locale files**
   (`src/lib/locales/*/index.ts`):
   ```ts
   cacheBust: "zimlearngraph-public-demo-stable-v0.4-cachebust-20260711",
   ```
   This is the key change: `07vbqatnaegte.js` was a **shared i18n catalog chunk**
   (full locale strings — "Impossibile", "Selecciona", "Classroom",
   "Materials", etc.). The landing-only change in step 1 did NOT touch i18n, so
   that shared chunk's content was byte-identical → same filename → still
   poisoned. Adding the marker to the catalog changed its content → Turbopack
   re-hashed it → new filename → old reference gone.

   The `cacheBust` key is pure data, never rendered unless referenced, so it
   has zero runtime/app-behavior impact. It was added to all 14 locales to keep
   the locale-parity test (`src/lib/locales/index.test.ts`) satisfied.

No UI redesign. No app-behavior change. No backend data touched. AetherLink
untouched.

## Deploy

Used ONLY the safe script (stops the systemd unit first, builds, copies
static/public, restarts systemd, smoke-tests):

```bash
./scripts/deploy_vault_frontend_standalone.sh --restart --smoke
```

Build ID: `ZBpU4oDPSzG-PoyzPvfgJ`. Service restarted via `systemctl`
(`vault-frontend.service`), not nohup.

> Note: an earlier attempt in this session was interrupted by a gateway
> shutdown mid-build, which left the systemd unit in a `failed` (CHDIR)
> crash-loop and a nohup orphan running. After the gateway returned, the build
> was completed and the service was reconciled back to clean systemd
> supervision (see "Service status" below).

## Old poisoned chunk

```
07vbqatnaegte.js   (was 767428 bytes; served truncated as 228463 on Jul-8)
```

## New extracted chunk filenames (from live /impact-intelligence HTML)

```
0018dy-m-kusj.js
01xu6t.8j1xot.js
02a~tjx75q4yd.js
03~yq9q893hmn.js
047-cys6mtmnu.js
09zovzd8x8z6i.js        <- carries cacheBust marker
0a7pf9x651pj1.js        <- carries cacheBust marker
0b.68y~bjh7rg.js
0esl8pswswf6s.js
0j_bln_e2y1rj.js        <- landing-build marker + cacheBust marker
0jem7nolp9nj8.js
0ugi3mc46-w.g.js
102k35gvrqwvv.js
15fegtpum9a4_.js
16~glc9p6tmvr.js
16.zxbaz56fun.js
turbopack-0u-h77wdhzigw.js
+ 4 CSS files + 1 woff2 media
```

The old `07vbqatnaegte.js` is **not** in this list.

## Proof old chunk is not referenced

```bash
curl -s https://zimlearngraph.duckdns.org/impact-intelligence \
  | grep -oE '/_next/static/[^"'\'' ]+' | sort -u > /tmp/assets-new.txt
grep '07vbqatnaegte.js' /tmp/assets-new.txt && echo BAD || echo OK
# -> OK: old chunk no longer referenced
```

Also confirmed `data-impact-build="zimlearngraph-public-demo-stable-v0.4-cachebust-20260711"`
is present in the live SSR HTML.

## Static asset verification

Every extracted asset fetched over HTTPS returned HTTP 200 — 21 assets, 0
failures, 0× 404, 0× 500. (Script output: "OK: all assets 200".)

## Browser verification (fresh session = incognito/hard-refresh equivalent)

- Loaded `https://zimlearngraph.duckdns.org/impact-intelligence` fresh.
- `browser_console` after load: **0 console messages, 0 JS errors**.
- ✅ browser does not request `07vbqatnaegte.js`
- ✅ no `ERR_INCOMPLETE_CHUNKED_ENCODING`
- ✅ no `ChunkLoadError`
- ✅ no HMR / `webpack-hmr`
- ✅ no static 404/500
- ✅ page renders with live data (36 learners, 3 schools, 6 assessments, 12% pass)

## Service status

```
systemctl is-active vault-frontend.service   -> active
cgroup of listening process on 127.0.0.1:3003 -> system.slice/vault-frontend.service
NRestarts=0
```
Frontend is systemd-supervised (not a nohup orphan). nginx proxies the domain
→ 127.0.0.1:3003.

## Remaining risk

- The actual `immutable` cache header is unchanged (correct for hashed `_next`
  assets and self-heals on every future deploy because filenames change). The
  only browsers still at risk are those that cached the truncated body *before*
  this release; they now request the new filename and get the correct body
  automatically. No visitor action required.
- For any browser that somehow cached a *different* broken chunk during the
  Jul-8 window, the same mechanism applies: a future content change re-hashes
  it. No further action needed now.
