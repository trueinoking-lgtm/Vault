# Vault Delta Completion Checkpoint

**Phase:** Delta (study persistence, review queue, weak-spot detection, session lifecycle)
**Date:** 2026-07-04
**Git ref:** `585e7fd` (HEAD — Delta L)

---

## 1. Delta Objective

> *"Transform Vault into a learner-first LMS by adding persistent study sessions, leaf review events, a persisted review queue, query-time weak-spot detection, an explicit learner-friendly ReviewQueue UI, and robust session lifecycle management."*

Delta was always scoped as a **foundational persistence and feedback layer** — not a full tutoring system. The goal was to close the learner loop so that check-yourself actions survive page reloads, weak spots are surfaced, and study sessions do not accumulate indefinitely. All without adding quizzes, scoring, spaced repetition, teacher tools, AI-generated content, or school multi-tenancy.

---

## 2. Commits Included

| Commit | Delta | Description | Files |
|--------|-------|-------------|-------|
| `80c16e4` | **E → F** | Backend: study sessions, leaf review events, review state tables, API endpoints | `api/routers/study.py`, `open_notebook/domain/study.py`, migrations, tests |
| `34e5759` | **G** | Frontend: wire leaf review events to backend from LeafStudyCard | `LeafStudyCard.tsx`, `use-study.ts`, `api/study.ts` |
| `49c246d` | **H** | Frontend: consume persisted review queue (replace `useRecentNotes`) | `ReviewQueue.tsx`, `api/types.ts` hooks |
| `a38e1e5` | **I** | Docs: weak-spot heuristic design doc | `docs/architecture/vault_weak_spot_heuristic_design.md` |
| `5179568` | **J** | Backend: query-time weak-spot derivation, `is_weak_spot` API field | `LeafReviewEvent.compute_weak_spot_for_note()`, `ReviewQueueItem` schema, tests |
| `73809e4` | **Debt A** | Docs: vault stabilization debt register | `docs/checkpoints/vault_stabilization_debt_register.md` |
| `4b5e89f` | **Debt B** | Diagnosis: async test environment gap (system venv vs uv) | Docs only; no code changes |
| `fe52d2f` | **Debt C** | Lift study session ownership to NotesColumn, best-effort completion on unmount | `NotesColumn.tsx`, `LeafStudyCard.tsx`, `useEndSession()` hook |
| `6140ceb` | **Delta K** | Frontend: three-section ReviewQueue (Needs practice, Needs review, Recently remembered) | `ReviewQueue.tsx`, 14 locale files |
| `585e7fd` | **Delta L** | Backend: stale-session auto-close (12h threshold) | `StudySession.close_stale_sessions_for_notebook()`, tests, debt register |

**Total:** 10 commits across the Delta phase. 0 migrations added after the initial schema.

---

## 3. Learner-Facing Behavior Now Available

| Behaviour | Detail |
|-----------|--------|
| **Persistent check-yourself** | "I remembered" / "Needs review" clicks survive page reload |
| **Persistent review queue** | Vault dashboard shows leaves ordered by last review, not by recency of edit |
| **Three-section review queue** | Needs practice (orange, weak-spot items) → Needs review (amber) → Recently remembered (green) |
| **Weak-spot visual distinction** | Items with ≥2 `needs_review` flagged as "Needs practice" with orange Target icon |
| **Study sessions** | Session created on entry to notebook study hub; shared across all leaf cards |
| **Session auto-recovery** | If tab closes without cleanup, stale sessions (12h+) auto-close on next visit |
| **Learner-friendly labels** | "Needs practice" not "Weak spot" — growth mindset language throughout |

---

## 4. Backend / Data Model Now Available

| Entity | Table | Key Fields |
|--------|-------|------------|
| StudySession | `study_session` | notebook_id, status (active/completed/abandoned), started_at, ended_at, leaf_count |
| LeafReviewEvent | `leaf_review_event` | session_id, note_id, notebook_id, event_type, event_metadata |
| LeafReviewState | `leaf_review_state` | note_id (unique), notebook_id, needs_review, last_event_type, last_event_at, review_count |

**Weak-spot heuristic** (query-time, not a table):
- Rule: ≥2 `needs_review` events, no later `remembered`, ≥1 hour since last `needs_review`
- Computed per `ReviewQueueItem` via `LeafReviewEvent.compute_weak_spot_for_note()`

**Schema stability:** No migrations added after the initial `migration_016.surrealql`. All Delta J–L changes are algorithmic or in-application-layer.

---

## 5. Frontend Components Changed

| Component | Change |
|-----------|--------|
| `ReviewQueue.tsx` | Replaced `useRecentNotes` with `useReviewQueue`. Three-section display (Delta K). |
| `LeafStudyCard.tsx` | Now receives `studySessionId` as prop (lifted from NotesColumn). Fires `check_started`, `remembered`, `needs_review`. |
| `NotesColumn.tsx` | Owns `useStudySession`. Best-effort `useEndSession` on unmount. |
| `vault/page.tsx` | Command Center dashboard. Dynamic imports for all vault sections. Layout orchestrator. |
| `/lib/hooks/use-study.ts` | New hooks: `useStudySession`, `useLogReviewEvent`, `useEndSession`, `useReviewQueue`. |
| `/lib/api/study.ts` | New API client module for `/api/study/*` endpoints. |
| `/lib/types/api.ts` | New types: `StudySessionResponse`, `LeafReviewEventResponse`, `ReviewQueueItem`, etc. |
| Locale files (×14) | 4 new keys: `vault.needsPractice`, `vault.needsPracticeDesc`, `vault.needsPracticeSingle`, `vault.needsPracticeMultiple`. |

---

## 6. API Endpoints Involved

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/study/sessions` | POST | Start or resume a study session (auto-closes stale sessions) |
| `/api/study/sessions/{id}` | PATCH | End a session (completed / abandoned) |
| `/api/study/sessions` | GET | List study sessions (optionally filtered by notebook/status) |
| `/api/study/leaf-events` | POST | Log a leaf review event; upserts review state for terminal events |
| `/api/study/review-queue` | GET | Return persisted review queue with weak-spot flags |

---

## 7. Validation Results

| Suite | Before Delta | After Delta |
|-------|-------------|-------------|
| Backend (`uv run pytest tests/`) | 221 passed | **222 passed** (+1 from Delta L) |
| Study API subset | 18 passed | **19 passed** (+1 from Delta L stale-session test) |
| Frontend (`npm test`) | 57 passed | **57 passed** |
| Frontend build (`npm run build`) | Clean | **Clean** |
| `git status --short` | Clean | **Clean** |

---

## 8. Remaining Deferred Items

Items explicitly kept out of Delta scope (from the debt register and design docs):

| Item | Debt/Ref | Priority | Notes |
|------|----------|----------|-------|
| **`opened`/`listened` event logging** | DEBT-005 | Low | Events exist in schema and API but are not fired by LeafStudyCard. Currently only `check_started`, `remembered`, `needs_review` are wired. Would enable richer timeline analytics and distinguish "opened but never reviewed" from "never interacted with." |
| **Frontend health endpoint** | DEBT-006 | Low | Backend has `GET /health` but the standalone Next.js frontend lacks one. Systemd cannot health-check Next.js compilation readiness. |
| **Configurable weak-spot thresholds** | — | Low | `≥2 needs_review`, `≥1h cooldown` are hardcoded. For admin tuning, expose as config/env vars. |
| **Richer study-session analytics** | — | Low | Current session tracking has leaf_count but no per-session weak-spot summaries, duration, or event-count metrics. A `GET /api/study/sessions/{id}/summary` or similar could expose this for a future dashboard. |
| **Teacher/school aggregation** | — | Deferred | Single-tenant only. No multi-user isolation, no classroom grouping, no teacher dashboard. The architecture doc explicitly defers this to Epsilon. |
| **Spaced-repetition scheduler** | Non-goal (Delta) | Deferred | SM-2 / Anki-style intervals were explicitly excluded from Delta scope. Could sit on top of the existing event data. |
| **Quiz/scoring system** | Non-goal (Delta) | Deferred | Multiple-choice, fill-in-blank, and automated scoring were excluded from Delta scope. |
| **AI-generated weak-spot diagnosis** | Non-goal (Delta) | Deferred | The current heuristic is purely deterministic (event counts). AI-based semantic diagnosis of "why" a learner struggles with a leaf is a separate feature. |

---

## 9. Recommended Next Phase: Epsilon — School / Class / Teacher Primitives

Delta built a complete single-learner study loop. The natural next phase is **Epsilon**: layer in multi-tenant primitives that allow Vault to operate in school and classroom environments.

### Epsilon should include (in suggested order):

1. **User model and authentication upgrade**
   - Replace the single-password auth with proper user accounts
   - Minimal: email + password registration, login, session management
   - No RBAC yet — just learner vs admin roles

2. **Teacher / school primitives**
   - School entity: container for multiple classrooms/cohorts
   - Classroom group: teacher + enrolled learners
   - Teacher dashboard: aggregate view of learner progress, weak spots, session activity

3. **Data isolation by user**
   - Currently all learners share one database namespace
   - Add `user_id` or `tenant_id` to study tables (study_session, leaf_review_event, leaf_review_state)
   - Backward compatible: single-learner mode remains default

4. **Review queue scoping**
   - Currently scoped to notebook only (no user isolation)
   - Add teacher view: "all weak spots across my classroom"
   - Add learner view: "my own review queue" (already works in single-learner mode)

5. **Notebook sharing / assignment**
   - Teacher creates a notebook (course) and assigns it to a classroom
   - Learners see assigned notebooks alongside their own

### What Epsilon should NOT do:

- ❌ Add full RBAC (keep simple for now)
- ❌ Add scoring/grades/leaderboards (defer to Epsilon+1)
- ❌ Add spaced repetition (defer to Zeta)
- ❌ Add AI generation features (defer to Eta)
- ❌ Change migrations for Delta-era tables (they remain single-tenant)

### Migration strategy for Epsilon:

- Add new tables: `user`, `school`, `classroom`, `enrollment`
- Add `user_id` (nullable) to existing study tables via a new migration
- Keep `user_id` optional — single-learner instances never set it
- The existing API continues unchanged when `user_id` is absent

---

## 10. Delta Phase Summary

```
Delta E–F (foundation):  Study session + review event + review state tables and API
       ↓
Delta G (wire events):   LeafStudyCard fires persisted events
       ↓
Delta H (review queue):  Frontend consumes persisted queue
       ↓
Delta I (design):        Weak-spot heuristic design doc
       ↓
Delta J (backend weak):  Query-time weak-spot derivation, API field
       ↓
Debt A (register):       Debt register created
       ↓
Debt B (test fix):       Async test environment diagnosed
       ↓
Debt C (lifecycle):      Session ownership lifted, best-effort completion
       ↓
Delta K (frontend weak): Three-section ReviewQueue with "Needs practice"
       ↓
Delta L (auto-close):    Stale session auto-close (12h threshold)
```

**Delta is complete.** The learner-loop persistence layer is stable, tested, and running in production. No further Delta-phase features should be added — remaining gaps are documented as deferred items and should be picked up in the appropriate Epsilon, Zeta, or Eta phases.

---

*Prepared: 2026-07-04 · Git ref: `585e7fd`*
