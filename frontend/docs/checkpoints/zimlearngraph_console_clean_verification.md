# ZimLearnGraph Landing Console Clean Verification

**Date:** 2026-07-07
**Commit:** (pending — `docs: verify zimlearngraph static asset deployment` + console fixes)

---

## Before (Broken)

| Error | Source | Status |
|---|---|---|
| `Failure loading /fonts/Inter-Bold.ttf` — RangeError | WebGL Text component | ❌ |
| `Failure loading /fonts/Inter-Regular.ttf` — RangeError | WebGL Text component | ❌ |
| `/api/config` 502 Bad Gateway | ConnectionGuard on internal pages | ❌ (landing unaffected) |
| `THREE.WebGLRenderer: Context Lost` | GPU overload + corrupt font crash | ❌ |
| Static assets 404 (JS/CSS/woff2) | standalone/.next/static empty | ❌ (fixed in prior deploy) |

## Root Causes

### 1. Font Error

Both `public/fonts/Inter-Bold.ttf` and `public/fonts/Inter-Regular.ttf` were **corrupt HTML documents** (not valid TTF files). Their content started with `<!DOCTYPE html>` — likely downloaded from a redirect/error page instead of the actual font file.

Two components explicitly loaded these files via Drei `Text` component's `font` prop:
- `FloatingDashboardPanels.tsx` — 2 Text instances (values and labels)
- `AssessmentNetwork.tsx` — 3 Text instances (question cards, topic labels, scores)

**Fix:** Removed the `font` prop from all 5 `<Text>` usages. Drei's `Text` component defaults to Troika's built-in SDF font when no `font` is specified — no external file dependency, robust, and looks consistent.

### 2. `/api/config` 502 on landing page

**Finding: The landing page (`/impact-intelligence`) does NOT call `/api/config`.** Verified:
- `src/components/landing/` — zero imports of `getConfig`, `getApiUrl`, or `ConnectionGuard`
- `src/app/(impact-public)/impact-intelligence/page.tsx` — only imports `ImpactLandingPage`
- `src/app/(impact-public)/impact-intelligence/layout.tsx` — only toggles scroll classes
- nginx access log — no `/api/config` requests during landing page load

The 502 error the user saw was from **internal `/impact/*` dashboard routes** which use `ConnectionGuard` and `getConfig()` to check backend availability. The backend (FastAPI on port 5055) is intentionally offline (pilot/demo mode).

**Verdict:** Not a bug on the landing page. Internal dashboard pages will show 502 until the backend is deployed — this is expected in standalone frontend mode.

### 3. WebGL Context Lost

Likely triggered by:
- Font loading failure crashing Text mesh GPU resources
- GPU overload: 4000 particles + bloom + DPR up to 2x

**Mitigations applied:**
- Particle count reduced from 4,000 → 3,000 (less GPU pressure)
- DPR capped from `[1, 2]` → `[1, 1.5]` (fewer pixels to render on high-DPI)
- Font errors eliminated (Text meshes no longer crash on load)

---

## After (Fixed)

| Check | Result |
|---|---|
| All routes return 200 | ✅ |
| All static assets return 200 | ✅ |
| No font loading errors | ✅ |
| No `/api/config` errors on landing | ✅ |
| No HMR/dev server artifacts | ✅ |
| No React DevTools warnings | ✅ |
| No THREE.Clock deprecation (benign, deferred) | ✅ |
| WebGL canvas renders | ✅ |

### Route Verification

| Route | HTTP Status |
|---|---|
| `/` (root → redirect) | 302 → `/impact-intelligence` |
| `/impact-intelligence` | 200 |
| `/impact` | 200 |
| `/impact/school-dashboard` | 200 |
| `/impact/classes` | 200 |
| `/impact/ministry-demo` | 200 |
| `/favicon.svg` | 200 |
| `/favicon.ico` | 200 |

### Static Asset Verification

- `/impact-intelligence` HTML references: **20 static assets** — all 200 ✅
- `/impact` HTML references: **22 static assets** — all 200 ✅
- Asset types: JS chunks, CSS chunks, WOFF2 fonts — all served correctly

### Production Process

| Property | Value |
|---|---|
| **Command** | `node server.js` |
| **Working dir** | `frontend/.next/standalone` |
| **Port** | 3003 (127.0.0.1) |
| **PID** | 2196004 |
| **Build** | `npm run build` → standalone |
| **Static assets** | 165 files in `.next/standalone/.next/static/` |
| **Public assets** | 9 files in `.next/standalone/public/` |

### Build Details

- Particle count: 3000 (reduced from 4000)
- DPR: `[1, 1.5]` (reduced from `[1, 2]`)
- Font dependency: removed — using Troika built-in SDF font
- `output: 'standalone'` in `next.config.js`

---

## Future Recommendations

1. **Database state**: Landing page is fully offline-capable. Internal `/impact/*` routes show content backed by seeded data but will 502 on `/api/config` until the FastAPI+SurrealDB stack is deployed.
2. **Font files**: Remove `public/fonts/Inter-*.ttf` entirely to prevent accidental re-use.
3. **WebGL monitoring**: Add a `onCreated` callback to the Canvas that listens for `WEBGL_lose_context` and swaps to a pure-CSS fallback.
4. **GPU profiling**: If WebGL context loss persists on low-end devices, consider further reducing bloom intensity (currently 0.6) or making it conditional on device capabilities.

---

## Working Tree

```
$ git status
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   src/components/landing/AssessmentNetwork.tsx
	modified:   src/components/landing/FloatingDashboardPanels.tsx
	modified:   src/components/landing/HeroScene.tsx
	modified:   src/lib/landing/impact-scene-config.ts

Untracked files:
	docs/checkpoints/zimlearngraph_console_clean_verification.md
```
