# ZimLearnGraph Impact Metadata & Favicon Branding Fix

**Date:** 2026-07-11
**Commit:** `fix: align zimlearngraph impact metadata`
**Scope:** Public ZimLearnGraph / Impact Intelligence routes — title + favicon branding. Internal "Vault" product name left unchanged (per constraint: only public Impact routes must not emit "Vault" metadata).

## Problem
Chrome address-bar suggestions showed **"Vault"** for `zimlearngraph.duckdns.org`. Audit confirmed
the `/impact/*` public routes emitted `<title>Vault</title>` in the server-rendered HTML, because:

- Root `src/app/layout.tsx` sets `metadata.title = "Vault"`.
- `src/app/(impact)/layout.tsx` was a **client** component that set `document.title` inside a `useEffect`.
  A client-side `document.title` assignment never corrects the **SSR `<title>`** that crawlers,
  browser history index, and `curl`/HTML see — so every `/impact/*` page shipped `<title>Vault</title>`.
- `src/app/(impact-public)/impact-intelligence/page.tsx` already set `metadata` at page level, which is
  why `/impact-intelligence` was already correct.

Separately, the favicon returned **404** on the live domain: the standalone build output lacked the
`public/` assets (a manual rebuild for the earlier seeded-demo fix had skipped the deploy script's
`public/` → `.next/standalone/public/` copy step).

## Root Cause
1. Metadata inheritance: `(impact)` route group had no server-side `metadata` export, so it inherited
   the root layout's `"Vault"` title for the SSR `<title>`.
2. Favicon 404: standalone output missing `public/` assets → node server returned 404 for `/favicon.svg`
   and `/favicon.ico`.

## Fix (surgical)
- **`src/app/(impact)/layout.tsx`** — converted from a client component to a **server component** that
  exports `metadata`:
  ```ts
  export const metadata: Metadata = {
    title: { default: 'Impact Intelligence — ZimLearnGraph', template: '%s · ZimLearnGraph Impact' },
    description: 'ZimLearnGraph Impact Intelligence — turn teacher-marked assessments into structured learning evidence and school support.',
    openGraph: { type: 'website', siteName: 'ZimLearnGraph Impact', title: 'Impact Intelligence — ZimLearnGraph', ... },
    twitter: { card: 'summary_large_image', title: 'Impact Intelligence — ZimLearnGraph', ... },
    icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
  }
  ```
  Removed the client-side `document.title` / `description` meta / favicon `<link>` hacks (now redundant —
  Next manages them from server metadata). The `landing-page` scroll/overflow effect was moved into the
  nav layout below.
- **`src/app/(impact)/impact/layout.tsx`** — added the `landing-page` class `useEffect` (moved here from
  the root impact layout) so the scroll behaviour is preserved.
- **`src/app/(impact)/impact/school-dashboard/page.tsx`** — wrapped the `useSearchParams()` reader in a
  `<Suspense>` boundary. The page was a static route calling `useSearchParams()` with no Suspense
  boundary, which aborted the production build during static prerender (`missing-suspense-with-csr-bailout`).
  Restructured so the default export renders `<Suspense fallback><SchoolDashboardContent/></Suspense>` and
  the inner component reads the param. (This also fixed a pre-existing build blocker that the earlier
  "successful" rebuild had actually skipped due to an OOM-kill before reaching the prerender phase.)
- **Standalone public assets** — copied `frontend/public/` → `.next/standalone/public/` and `chmod -R a+rX`
  (favicon perms were `600`). Node's standalone server now serves `/favicon.svg` and `/favicon.ico` (200).

## Verification (live, 2026-07-11)
- `curl` SSR `<title>` for every public Impact route = `Impact Intelligence — ZimLearnGraph`:
  `/impact-intelligence`, `/impact`, `/impact/schools`, `/impact/classes`, `/impact/assessments`,
  `/impact/school-dashboard`. No `Vault` in any `<title>` or `og:title`.
- Browser `document.title` on `/impact/schools` = `Impact Intelligence — ZimLearnGraph`.
- Favicon: `GET /favicon.svg` → **200**, `GET /favicon.ico` → **200** (ZimLearnGraph "Z" brand).
- Seeded demo intact: `/impact` shows 3 schools / 6 classes / 180 learners / 6 assessments; school cards
  show Classes 2 / Learners 60–62 / Assessments 2.
- Production build clean (no prerender error); `vault-frontend.service` restarted with new build.

## Notes
- The old "Vault" entries in the user's browser **history** will persist until the user clears history —
  that is expected and outside app control.
- nginx `location ^~ /_next/static/` already serves static chunks directly (prior commit); favicon is served
  by the node standalone from `public/`, no nginx change required.
- Deploy script `scripts/deploy_vault_frontend_standalone.sh` already copies `public/` → standalone (Step 12);
  future rebuilds via the script won't regress the favicon.
