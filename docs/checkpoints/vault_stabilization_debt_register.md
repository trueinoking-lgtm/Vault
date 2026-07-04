# Vault Stabilisation Debt Register

**Phase:** Debt A (audit only)  
**Date:** 2026-07-04  
**Git ref:** `5179568` (Delta J — weak-spot backend fields)  

---

## Scope

This register catalogues known technical debt and stabilisation concerns across the Vault learner-loop implementation (Deltas E–J). It does **not** propose new product features. Each item includes a severity, the evidence that identified it, its impact on ongoing development, and a recommended phase for remediation.

---

## Debt Items

### DEBT-001: Backend test suite has 66 pre-existing failures due to environment mismatch (`pytest-asyncio` not in system venv)

| Field | Value |
|-------|-------|
| **Area** | Backend testing environment |
| **Severity** | ~~High~~ → **Fixed** |
| **Evidence** | `python -m pytest tests/` reports 66 failures, 155 passed. The system Python venv (`/usr/local/lib/hermes-agent/venv/`) lacks `pytest-asyncio`. The project correctly declares `pytest-asyncio>=1.2.0` under `[dependency-groups] dev` (PEP 735) — this is a `uv`-managed group that `uv sync` installs into the project's own `.venv/`. Running `uv run python -m pytest tests/` from the project root uses the `.venv/` and reports **221/221 passed, 0 failures**. This is an **environment mismatch**, not a dependency gap. The system Python venv is managed by the Hermes agent tooling and does not sync the project's `uv.lock`. All 66 failures are `@pytest.mark.asyncio`-decorated tests that fail with "Unknown pytest.mark.asyncio" because the system `pytest` doesn't recognise the marker. The study-api tests (18/18) pass under both environments because they mock all async operations and never use `@pytest.mark.asyncio`. |
| **Impact** | ~~Every new async backend change can only be validated against the 18 study-api tests.~~ **Resolved:** Running `uv run python -m pytest tests/` validates the full suite (221 tests). The 66 false failures in the system venv are harmless — they indicate nothing about code quality. |
| **Proposed fix** | No source-level changes required. Use `uv run python -m pytest tests/` to run the full backend test suite. The `pyproject.toml` and `uv.lock` were already correct. No migration, no config file, no script needed. |
| **Status** | **Fixed** — Debt B complete. The fix is a documented invocation change, not a dependency change. |
| **Blocks Delta J?** | **No** — and never did. |
| **Recommended phase** | **Debt B — complete.** |
| **Classification** | ✅ Fixed |

---

### DEBT-002: Study session lifecycle starts too low in the component tree

| Field | Value |
|-------|-------|
| **Area** | Frontend component architecture |
| **Severity** | ~~Medium~~ → ✅ Fixed |
| **Evidence** | `useStudySession(notebookId)` was called inside `LeafStudyCard.tsx` (line 129). Session ownership has been lifted to `NotesColumn.tsx`, the common ancestor of all `LeafStudyCard` instances for a given notebook. `LeafStudyCard` now receives `studySessionId?: string` as a prop and no longer imports `useStudySession`. The session is created/resumed when the NotesColumn mounts and shared across all cards via React Query caching. The `LeafStudyCard` still imports `useLogReviewEvent` and uses the passed `studySessionId`. |
| **Impact** | ~~Session start time is inaccurate — it fires on first leaf interaction, not on study-hub entry.~~ **Resolved:** Session is created when the NotesColumn mounts (i.e., when the learner navigates to the notebook study hub). All cards share one session. Component coupling removed. |
| **Proposed fix** | ~~Lift `useStudySession` to the parent component~~ **Done.** |
| **Status** | **Fixed** — Debt C complete. Session ownership moved from `LeafStudyCard` to `NotesColumn`. |
| **Blocks Delta J?** | **No** — and never did. |
| **Recommended phase** | **Debt C — complete.** |
| **Classification** | ✅ Fixed |

---

### DEBT-003: Weak-spot fields exist in the API but no frontend display yet

| Field | Value |
|-------|-------|
| **Area** | Frontend — ReviewQueue |
| **Severity** | Low |
| **Evidence** | Delta J (`5179568`) added `is_weak_spot` (bool) and `weak_spot_label` (optional string) to the `GET /api/study/review-queue` response. The `ReviewQueue.tsx` component does not use these fields — it renders only two sections: "Needs review" and "Recently remembered." The TypeScript interface `ReviewQueueItem` has the new fields but they are unused by any component. The design doc at `docs/architecture/vault_weak_spot_heuristic_design.md` (Delta I) specifies a third "Needs practice" section (Delta K). |
| **Impact** | The backend heuristic is computed on every review-queue request but its output is silently discarded. Learners see no visual distinction between single-struggle leaves and persistent weak spots. This is by design (Delta J was backend-only) but means the feature is invisible to learners until Delta K. |
| **Proposed fix** | Implement Delta K: add "Needs practice" section to `ReviewQueue.tsx`, add 4 new locale keys (`vault.needsPractice*`), filter weak-spot items from "Needs review" section, add orange theme. |
| **Blocks Delta J?** | **No** — this is a frontend-only gap. Delta J is complete. |
| **Recommended phase** | **Delta K** (next feature phase after debts). |
| **Classification** | Safe to defer |

---

### DEBT-004: Study sessions are created/resumed but never explicitly completed

| Field | Value |
|-------|-------|
| **Area** | Backend + Frontend — session lifecycle |
| **Severity** | ~~Medium~~ → ✅ Fixed |
| **Evidence** | `POST /api/study/sessions` creates or resumes an active session. Debt C added best-effort frontend completion via `useEndSession()` on `NotesColumn` unmount. Delta L adds server-side stale-session cleanup: `POST /api/study/sessions` now calls `StudySession.close_stale_sessions_for_notebook()` before looking up an existing session, which marks any active session older than 12 hours as `abandoned`. This prevents unbounded accumulation even if the frontend completion fires unreliably. Two layers now guard against stale sessions: (a) frontend best-effort PATCH on unmount, (b) server-side auto-close on next session create. |
| **Impact** | **Resolved.** Sessions no longer accumulate indefinitely. Edge case covered: learner closes tab without navigation → stale session auto-closed when they return (or when any session create occurs for that notebook). |
| **Proposed fix** | ~~Two-part fix: (a) frontend completion, (b) server-side stale cleanup~~ **Both implemented.** |
| **Status** | **Fixed** — Debt C + Delta L complete. Two-layer guard: frontend best-effort + server-side stale auto-close. |
| **Blocks Delta J?** | **No.** |
| **Recommended phase** | **Delta L — complete.** |
| **Classification** | ✅ Fixed |

---

### DEBT-005: `opened` and `listened` events are not wired

| Field | Value |
|-------|-------|
| **Area** | Frontend — LeafStudyCard |
| **Severity** | Low |
| **Evidence** | The `LeafReviewEvent` schema (migration 16, design doc) defines 5 event types: `opened`, `check_started`, `remembered`, `needs_review`, `listened`. The LeafStudyCard components fires only 3: `check_started` (line 346), `remembered` (line 373), `needs_review` (line 385). The `opened` event (fires when a leaf card is expanded) and `listened` event (fires when TTSButton is activated) are not wired. The `fireEvent` useCallback in `LeafStudyCard.tsx` (line 133) only accepts `'check_started' | 'remembered' | 'needs_review'`. |
| **Impact** | 1. The review-event timeline is missing the first and last events in a typical leaf interaction. `opened` would help detect which leaves are being read but not reviewed. `listened` would help tie audio engagement to recall outcomes. 2. The weak-spot heuristic (Delta J) is unaffected because it only relies on `needs_review` and `remembered`. 3. Without `opened`, the review queue cannot distinguish "leaf was opened but not reviewed" from "leaf never interacted with." |
| **Proposed fix** | Wire `opened` event: when the LeafStudyCard expands (click to open card details), fire `opened` event. Wire `listened` event: in the `TTSButton` callback or the card's play handler, fire `listened`. Add `'opened'` and `'listened'` to the `fireEvent` type union in `LeafStudyCard.tsx`. Ensure the events are non-blocking (same pattern as existing — `logReviewEvent.mutate()`). |
| **Blocks Delta J?** | **No**. Weak-spot heuristic uses only `needs_review` and `remembered`. |
| **Recommended phase** | Safe to defer to Delta M (post-Epsilon cleanup). May become useful for future analytics. |
| **Classification** | Safe to defer |

---

### DEBT-006: Vault frontend standalone deployment lacks a dedicated health endpoint

| Field | Value |
|-------|-------|
| **Area** | Operations / Deployment |
| **Severity** | Low |
| **Evidence** | The backend (`api/main.py` line 324) has `GET /health` returning `{"status": "healthy"}`. The `scripts/wait-for-api.sh` script polls `${API_URL}/health` to verify backend readiness. However, the Vault frontend standalone deployment (port 3003, Next.js standalone) has no equivalent health endpoint. The `deploy/systemd/vault-frontend.service` has no `HealthCheck` directive. The `scripts/deploy_vault_frontend_standalone.sh` smoke tests verify 6 routes after deployment but there is no lightweight health-check endpoint on the frontend itself. Additionally, the standalone frontend lacks a `HeartbeatMiddleware` or equivalent that the load balancer / systemd could use. |
| **Impact** | 1. `systemctl status vault-frontend` only checks if the process is running, not if the Next.js server is actually serving requests. After a deploy, the systemd service reports "active" before Next.js finishes its startup compilation, creating a race with the reverse proxy. 2. Future monitoring (Uptime Kuma, healthchecks.io, etc.) needs a dedicated endpoint that does not render a full page. 3. The `scripts/deploy_vault_frontend_standalone.sh` already does a 6-route smoke test, but a separate `/api/health` endpoint (or the backend's existing `/health` through the Next.js proxy) would be more standard for orchestration. |
| **Proposed fix** | Add a Next.js API route at `src/app/api/health/route.ts` (or proxy the backend's `/health` endpoint) that returns `{"status": "healthy"}` without invoking a page render. Update the systemd service to use `ExecStartPost` with a `curl` wait loop (similar to `wait-for-api.sh` but for the frontend port). This is a small, safe change that does not touch the backend. |
| **Blocks Delta J?** | **No** — pure ops concern. |
| **Recommended phase** | Safe to defer to an ops-focused phase. The existing deploy script's smoke tests provide adequate coverage for manual deploys. |
| **Classification** | Safe to defer |

---

## Summary

| ID | Title | Severity | Classification | Recommended phase |
|----|-------|----------|----------------|-------------------|
| DEBT-001 | Environment mismatch (`pytest-asyncio` not in system venv) | ~~High~~ → ✅ Fixed | ✅ Fixed | **Debt B — complete** |
| DEBT-002 | Session lifecycle starts too low in component tree | ~~Medium~~ → ✅ Fixed | ✅ Fixed | **Debt C — complete** |
| DEBT-003 | Weak-spot fields exist but no frontend display | Low | Safe to defer | Delta K — complete |
| DEBT-004 | Sessions never explicitly completed | ~~Medium~~ → ✅ Fixed | ✅ Fixed | **Delta L — complete** |
| DEBT-005 | `opened`/`listened` events not wired | Low | Safe to defer | Post-Epsilon cleanup |
| DEBT-006 | Frontend standalone lacks health endpoint | Low | Safe to defer | Ops phase |

---

## Recommended Fix Order

```
1. ✅ Debt B (DEBT-001) — Complete.
   └── Root cause: environment mismatch. pyproject.toml + uv.lock were already
       correct. Use `uv run python -m pytest tests/` to run the full suite.
       221/221 passed under uv. No source changes required.

2. ✅ Debt C (DEBT-002 + DEBT-004) — Complete.
   ├── Session ownership lifted from LeafStudyCard to NotesColumn.
   │   LeafStudyCard receives studySessionId as a prop.
   └── Best-effort session completion on column unmount via useEndSession hook.

3. ✅ Delta L (DEBT-004) — Complete.
   └── Server-side stale session auto-close added (12h threshold).
       Two-layer guard: frontend best-effort + backend auto-close.

4. ✅ Delta K (DEBT-003) — Complete.
   └── Needs-practice section displayed in ReviewQueue.
       4 locale keys added to all 14 locales.

5. Post-Epsilon          — Minor gaps (DEBT-005, DEBT-006)
   ├── Wire opened/listened events
   └── Frontend health endpoint (if still needed)
```

---

## Appendix: Verification Checks

### Before Debt B (confirmed)
- [x] `git status --short` clean
- [x] `python -m pytest tests/test_study_api.py` passes (18/18)
- [x] 66 failures confirmed in `python -m pytest tests/ --tb=no -q`

### After Debt B (verified)
- [x] `uv run python -m pytest tests/ --tb=no -q` → **221/221 passed, 0 failures**
- [x] `uv run python -m pytest tests/test_study_api.py` → **18/18 passed**
- [x] Root cause documented: environment mismatch (system venv vs uv-managed `.venv`)
- [x] No source-level changes required — `pyproject.toml` and `uv.lock` were correct
- [x] Invocation: use `uv run python -m pytest tests/` for full validation

### After Debt C (verified)
- [x] `LeafStudyCard` no longer calls `useStudySession` — session owned by `NotesColumn`
- [x] `LeafStudyCard` receives `studySessionId?: string` as a prop
- [x] `useEndSession` mutation hook added — calls `PATCH /api/study/sessions/{id}`
- [x] Best-effort completion fires on `NotesColumn` unmount via `useEffect` cleanup
- [x] Events still fire with session ID; if no session (loading), silently skipped
- [x] Typed reflection text still not persisted (unchanged)
- [x] ReviewQueue still uses persisted review queue (unchanged)
- [x] No Delta K frontend weak-spot display added
- [x] No migrations/schema changes
- [x] Owner route protection unchanged
- [x] Learner sidebar unchanged
- [x] `cd frontend && npm test` → **57/57 passed**
- [x] `cd frontend && npm run build` → **Clean compilation**
- [x] `uv run python -m pytest tests/test_study_api.py` → **18/18 passed**
- [x] `uv run python -m pytest tests/` → **221/221 passed**
