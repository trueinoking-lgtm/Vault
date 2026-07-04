# Vault Stabilisation Debt Register

**Phase:** Debt A (audit only)  
**Date:** 2026-07-04  
**Git ref:** `5179568` (Delta J — weak-spot backend fields)  

---

## Scope

This register catalogues known technical debt and stabilisation concerns across the Vault learner-loop implementation (Deltas E–J). It does **not** propose new product features. Each item includes a severity, the evidence that identified it, its impact on ongoing development, and a recommended phase for remediation.

---

## Debt Items

### DEBT-001: Backend test suite has 66 pre-existing failures due to missing `pytest-asyncio`

| Field | Value |
|-------|-------|
| **Area** | Backend testing environment |
| **Severity** | High |
| **Evidence** | `python -m pytest tests/` reports 66 failures, 155 passed. `pip show pytest-asyncio` returns "not installed". `pyproject.toml` lists `pytest-asyncio>=1.2.0` under `[dependency-groups] dev` (PEP 735) but the dependency was never resolved into the active environment. All 66 failures are `@pytest.mark.asyncio`-decorated tests that fail with "Unknown pytest.mark.asyncio" or "Failed: asyncio" error. The study-api tests pass because they mock all async operations and never use `@pytest.mark.asyncio` directly. The domain tests (`test_domain.py`), sources API tests, credentials tests, graph tests, and embedding tests all use `@pytest.mark.asyncio` and fail. |
| **Impact** | Every new async backend change can only be validated against the 18 study-api tests. The other 66 tests are dead CI signal — they fail before any assertion runs. A regression in any of the 4 domain models, 5+ API routers, or embedding logic goes undetected. This is the highest-severity item because it undermines all future backend work. |
| **Proposed fix** | Run `uv sync --group dev` (PEP 735) or `pip install pytest-asyncio` into the active venv. Verify with `python -m pytest tests/ --tb=no -q` that the failure count drops from 66 to 0. If any genuine failures remain after asyncio resolution, fix or isolate them. Add `asyncio_mode = "auto"` to `pyproject.toml` to reduce boilerplate. |
| **Blocks Delta J?** | **No** — Delta J study-api tests are self-contained and mock all async dependencies. But it blocks *confidence* in any backend change touching non-study code. |
| **Recommended phase** | **Debt B — fix now.** Fix before any further backend work. |
| **Classification** | Fix now |

---

### DEBT-002: Study session lifecycle starts too low in the component tree

| Field | Value |
|-------|-------|
| **Area** | Frontend component architecture |
| **Severity** | Medium |
| **Evidence** | `useStudySession(notebookId)` is called inside `LeafStudyCard.tsx` (line 129), the leaf-level study card component. There are exactly 3 call sites (2 imports + 1 invocation). The session is cached via React Query so all cards in the same notebook share one session object, but the query is scoped to each card instance — every `LeafStudyCard` that mounts fires `POST /api/study/sessions` if the cache is cold. This works because the POST is idempotent (returns existing active session), but it means the session is created on first leaf-card interaction, not when the learner enters the study hub. |
| **Impact** | 1. Session start time is inaccurate — it fires on first leaf interaction, not on study-hub entry. 2. If the study-hub page is navigated to but no leaf card is expanded, no session is created. 3. Future features like "time spent studying" or "sessions today" will show zeros or undercounts. 4. Component coupling: `LeafStudyCard` should not be responsible for session lifecycle. |
| **Proposed fix** | Lift `useStudySession` to the parent component that renders the list of leaf cards (likely the Study Hub / Material panel). When the learner navigates to a notebook's study hub, create or resume the session there. Pass the session down via context or as a prop. `LeafStudyCard` receives the session as a prop and only calls `useLogReviewEvent`. |
| **Blocks Delta J?** | **No** — Delta J is backend-only. But Delta K (frontend weak-spot display) may benefit from knowing the actual session scope. |
| **Recommended phase** | **Debt C — fix before Epsilon.** Design and refactor after Debt B is resolved. |
| **Classification** | Fix before Epsilon |

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
| **Severity** | Medium |
| **Evidence** | `POST /api/study/sessions` creates or resumes an active session. `PATCH /api/study/sessions/{id}` with status `completed` or `abandoned` exists in the API router (lines 96–126). The frontend `useStudySession` hook (line 27) only calls `createSession()` — there is no call to `updateSession()` anywhere in the frontend codebase. Session cleanup on navigation away from the study hub is not implemented. Sessions accumulate in the `active` state indefinitely. |
| **Impact** | 1. `study_session` table accumulates `active` records that will never be closed. Over time, the query `SELECT * FROM study_session WHERE status = 'active' ORDER BY started_at DESC LIMIT 1` may return stale sessions. 2. `leaf_count` is never updated because `update_leaf_count()` is only called when a session is explicitly completed. 3. Metrics like "total study time" or "sessions completed" are unavailable. 4. If a learner switches notebooks without completing the old session, the `get_active_for_notebook` query finds the stale session when they return to the first notebook — this is actually correct behaviour (resume), but the session end time is never set. |
| **Proposed fix** | Two-part fix: (a) Add a frontend effect in the study-hub component that calls `PATCH /api/study/sessions/{id}` with `status: "completed"` when the learner navigates away (useEffect cleanup or `beforeunload`). (b) Add a server-side background job (or a simple check in `get_active_for_notebook`) that auto-closes sessions older than N hours. This prevents unbounded accumulation even if the learner never cleanly exits. |
| **Blocks Delta J?** | **No**. But the accumulation of active sessions may confuse weak-spot analysis if abandoned-session events are ever filtered. |
| **Recommended phase** | **Debt C** — can be designed alongside the session lifecycle refactor (DEBT-002). Do after Debt B. |
| **Classification** | Fix before Epsilon |

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
| DEBT-001 | Missing `pytest-asyncio`; 66 pre-existing failures | **High** | Fix now | **Debt B** — immediate |
| DEBT-002 | Session lifecycle starts too low in component tree | Medium | Fix before Epsilon | **Debt C** (after Debt B) |
| DEBT-003 | Weak-spot fields exist but no frontend display | Low | Safe to defer | Delta K (next feature) |
| DEBT-004 | Sessions never explicitly completed | Medium | Fix before Epsilon | **Debt C** (alongside 002) |
| DEBT-005 | `opened`/`listened` events not wired | Low | Safe to defer | Post-Epsilon cleanup |
| DEBT-006 | Frontend standalone lacks health endpoint | Low | Safe to defer | Ops phase |

---

## Recommended Fix Order

```
1. Debt B (DEBT-001)    — Fix backend test environment
   └── Fix pytest-asyncio. Verify 66→0 failures. Restore CI signal.

2. Debt C (DEBT-002 + DEBT-004) — Session lifecycle refactor
   ├── Lift useStudySession into study-hub parent component
   ├── Wire PATCH /api/study/sessions on navigation away
   └── Add server-side stale-session cleanup (optional)

3. Delta K (DEBT-003)   — Weak-spot frontend display
   ├── Add "Needs practice" section to ReviewQueue
   ├── Locale keys + orange theme
   └── Filter weak-spot items from "Needs review" section

4. Post-Epsilon          — Minor gaps (DEBT-005, DEBT-006)
   ├── Wire opened/listened events
   └── Frontend health endpoint (if still needed)
```

---

## Appendix: Verification Checks

### Before Debt B
- [ ] `git status --short` clean
- [ ] `python -m pytest tests/test_study_api.py` passes (18/18)
- [ ] 66 failures confirmed in `python -m pytest tests/ --tb=no -q`

### After Debt B
- [ ] `pip show pytest-asyncio` returns version
- [ ] `python -m pytest tests/ --tb=no -q` passes (or 0 known failures)
- [ ] No `PytestUnknownMarkWarning` for `asyncio`

### After Debt C
- [ ] `useStudySession` called from study-hub parent, not LeafStudyCard
- [ ] `PATCH /api/study/sessions/{id}` called on navigate away
- [ ] No accumulating `active` sessions after normal usage
