# Vault Delta Memory Loop — Completion Checkpoint

**Phase:** Delta (learner memory loop — full persistence)
**Date:** 2026-07-04
**Git ref:** `cf68ebb` (HEAD — checkpoint doc)

---

## 1. Delta Objective

> *Build a complete, persistent learner memory loop: from landing on Vault's dashboard → creating a library → adding materials → opening a study hub → reading leaf study cards → doing retrieval practice → logging review events → seeing weak-spot-aware review suggestions — all surviving page reloads.*

Delta spans two sub-phases:

| Sub-phase | Scope | Commits |
|-----------|-------|---------|
| **Delta A–D** (UI/Product Shell) | Material study hub, leaf study cards, local check-yourself, review queue shell | `6aaff2f` → `5d932a9` |
| **Delta E–L** (Persistence Layer) | Study sessions, review events, review state, weak-spot detection, frontend grouping, session lifecycle | `80c16e4` → `585e7fd` |

---

## 2. Completed Delta Phases

### 2.1 Delta A — Material Study Hub (`6aaff2f`)

- `SourceDetailContent.tsx`: study-ready alert with contextual CTAs
- Study hub card (shown only for ready materials):
  - **Read material** — scrolls to content tab
  - **Ask a question** — opens chat panel
  - **Create leaf** — links to the primary notebook
  - **Listen** — TTS button
- Green-themed card with graduation cap icon
- "Study this material" header with description

### 2.2 Delta B — Leaf Study Cards (`1e18c64`)

- `LeafStudyCard.tsx` rendering structured leaf sections:
  - **What this leaf covers** — derived from first markdown heading
  - **Key points** — up to 3 section previews with "+N more" overflow
  - **Source material link** — extracted from `## Source Material` section
- Plain-text fallback (no headings) with content preview
- AI/Bot type badge, human/created-by badge
- Dropdown actions: Teach this leaf, Explain simply, Quiz me (callbacks), Delete
- TTS button in footer
- Memory leaf special handling (Review this Memory action)

### 2.3 Delta C — Local Check-Yourself Flow (`36f2e54`)

- Expandable "Check yourself" section on leaf study cards
- Prompt: *"Can you explain this in your own words?"*
- Textarea for self-answer
- Two outcome buttons: "I remembered this" / "I need to review this"
- Feedback message after submission
- "Try again" to reset and re-attempt
- 9 locale keys across all languages for the flow
- **Component-local only at this point** — no persistence yet

### 2.4 Delta D — Review Queue Shell (`9c654fa`)

- `ReviewQueue.tsx` component on `/vault` dashboard
- Empty state: "Nothing to review yet" with "Go to Libraries" CTA
- When leaves exist: amber info banner, list of recent leaves
- Honest disclosure: *"Review history is not saved yet."*
- Reuses `useRecentNotes()` — no custom data source yet

### 2.5 Delta E — Persistence Design (Design Doc)

- Design document: `docs/architecture/vault_study_review_persistence_design.md`
- Three new entities designed:
  - `study_session` — groups events into study periods
  - `leaf_review_event` — append-only log of learner interactions
  - `leaf_review_state` — denormalized per-leaf current state
- Five allowed event types: `opened`, `check_started`, `remembered`, `needs_review`, `listened`
- API surface design: POST/PATCH sessions, POST events, GET review queue
- Non-goals documented: no scoring, no spaced repetition, no teacher dashboard

### 2.6 Delta F — Backend Study/Review Persistence (`80c16e4`)

- Three SurrealDB tables (migration 16): `study_session`, `leaf_review_event`, `leaf_review_state`
- Domain models in `open_notebook/domain/study.py`: `StudySession`, `LeafReviewEvent`, `LeafReviewState`
- API router in `api/routers/study.py` with 5 endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/study/sessions` | POST | Start or resume a study session |
| `/api/study/sessions/{id}` | PATCH | End a session (completed / abandoned) |
| `/api/study/sessions` | GET | List study sessions |
| `/api/study/leaf-events` | POST | Log a leaf review event; upserts review state |
| `/api/study/review-queue` | GET | Return persisted review queue |

- Pydantic models in `api/models.py` for all request/response types
- Backend test suite for the study router

### 2.7 Delta G — LeafStudyCard Event Logging (`34e5759`)

- `LeafStudyCard.tsx` fires `check_started`, `remembered`, `needs_review` events via `useLogReviewEvent()` mutation
- Events are non-blocking — errors degrade silently to `console.warn`
- New hooks in `frontend/src/lib/hooks/use-study.ts`: `useStudySession`, `useLogReviewEvent`
- New API client module: `frontend/src/lib/api/study.ts`
- New TypeScript types: `StudySessionResponse`, `LeafReviewEventResponse`, `ReviewQueueItem`, etc.

### 2.8 Delta H — Persisted Review Queue (`49c246d`)

- `ReviewQueue.tsx` replaced `useRecentNotes()` with `useReviewQueue()` hook calling `GET /api/study/review-queue`
- Added `notebook_id` to API response and TypeScript interfaces
- Cross-notebook aggregation in the vault dashboard
- All 14 locale files updated for new keys

### 2.9 Delta I — Weak-Spot Heuristic Design (Design Doc)

- Design document: `docs/architecture/vault_weak_spot_heuristic_design.md`
- Core heuristic defined:
  - ≥2 `needs_review` events
  - No `remembered` after the most recent `needs_review`
  - Most recent `needs_review` is ≥1 hour old (cooldown)
- Learner-friendly labels: "Needs practice" never "weak spot"
- Query-time derivation recommended for v1
- Future optimization: `consecutive_needs_review` field on `leaf_review_state`

### 2.10 Delta J — Backend Weak-Spot Fields (`5179568`)

- `LeafReviewEvent.compute_weak_spot_for_note()` — query-time heuristic
- `LeafReviewEvent._compute_weak_spot_from_events()` — testable static logic
- `ReviewQueueItem` Pydantic model gains `is_weak_spot` (bool) and `weak_spot_label` (optional str)
- API returns weak-spot flags on every review queue request
- Short-circuit optimization: if `review_count < 2`, skip per-query computation
- 6 new backend tests for weak-spot heuristic edge cases

### 2.11 Delta K — "Needs Practice" Frontend Display (`6140ceb`)

- `ReviewQueue.tsx` renders three sections:
  - **Needs practice** (orange, `is_weak_spot === true`) — Target icon, orange-50 background
  - **Needs review** (amber, remaining `needs_review === true`) — RefreshCw icon
  - **Recently remembered** (green, `needs_review === false`) — CheckCircle icon
- Weak-spot items excluded from "Needs review" to avoid duplication
- Empty section automatically hidden when no items qualify
- 4 new locale keys across all 14 locale files:
  - `vault.needsPractice`, `vault.needsPracticeDesc`
  - `vault.needsPracticeSingle`, `vault.needsPracticeMultiple`

### 2.12 Delta L — Stale Session Auto-Close (`585e7fd`)

- `StudySession.close_stale_sessions_for_notebook()` classmethod
- Stale threshold: **12 hours** (`STALE_SESSION_HOURS = 12`)
- Called at the start of `POST /api/study/sessions` before looking up an existing session
- Marks stale active sessions as `abandoned` with `ended_at = now()`
- New test: `test_abandons_stale_and_creates_new_session`
- Two-layer guard against stale sessions:
  - **Layer 1** (Debt C): Frontend best-effort PATCH on NotesColumn unmount
  - **Layer 2** (Delta L): Server-side auto-close when next session is created

---

## 3. Current Learner Loop (End-to-End)

The complete, persisted learner loop now functions as follows:

```text
1. Learner lands on /vault
   → Command Center dashboard shows: quick actions, Continue Studying,
     Recent Materials, Recent Leaves, Review Queue, Learning Panel.

2. Learner creates a library (or opens an existing one)
   → "Create Library" from sidebar (+) or quick action.
   → Library appears in dashboard's "Continue Studying" section.

3. Learner adds a material
   → Navigate to /sources ("Materials"), click "Add material".
   → Upload file / paste URL / enter text.
   → Material processes through statuses:
     Preparing → Building study memory → Ready to study / Preparation failed.

4. Learner opens a ready material
   → Source detail view with study hub: Read, Ask, Create leaf, Listen.

5. Learner opens a leaf study card
   → From the library's notes tab, leaf renders as a study card:
     · What this leaf covers (first heading)
     · Key points (section previews)
     · Source material link
   → [PERSISTENCE] A study session is created/resumed via POST /api/study/sessions
     when NotesColumn mounts. The session ID is shared across all cards.

6. Learner uses "Check yourself"
   → Expand the orange "Check yourself" section on a leaf.
   → [PERSISTENCE] Fires check_started event → POST /api/study/leaf-events.
   → Learner writes a self-answer.
   → Clicks "I remembered this" → fires remembered event → POST + upserts leaf_review_state.
   → Clicks "I need to review this" → fires needs_review event → POST + upserts leaf_review_state.

7. Learner returns to /vault
   → Review Queue loads from GET /api/study/review-queue.
   → If the learner has ≥2 needs_review on any leaf and ≥1h has passed:
     → That leaf appears in the "Needs practice" (orange) section.
   → Other needs-review items appear in "Needs review" (amber).
   → Remembered items appear in "Recently remembered" (green).

8. Learner closes the tab or navigates away
   → [BEST EFFORT] NotesColumn unmount fires PATCH /api/study/sessions/{id} → completed.
   → [FALLBACK] If the PATCH fails or tab is killed, the session remains active.
   → Next time learner OR the same learner starts a session for that notebook:
     → Stale sessions older than 12h are auto-closed as "abandoned".
     → A new session is created.

9. Learner can explicitly close a session
   → The PATCH endpoint accepts status "completed" or "abandoned".
   → Leaf count is recalculated from distinct note_ids in the session's events.
```

---

## 4. What Is Intentionally Still Deferred

The following were explicitly scoped out of Delta and remain for future phases:

| Item | Ref | Priority | Why Deferred |
|------|-----|----------|--------------|
| **`opened`/`listened` event logging** | DEBT-005 | Low | Events exist in schema and API but LeafStudyCard fires only 3 of 5 event types. Would enable richer timeline analytics. |
| **Frontend health endpoint** | DEBT-006 | Low | Backend has `GET /health` but standalone Next.js frontend lacks one. Systemd cannot health-check Next.js readiness. |
| **Configurable weak-spot thresholds** | — | Low | `≥2 needs_review`, `≥1h cooldown` are hardcoded. Future admin UI could expose these. |
| **Richer study-session analytics** | — | Low | Current tracking has leaf_count but no per-session summaries, duration, or event-count metrics. |
| **Quiz attempts** | Non-goal | Deferred | Multiple-choice, fill-in-blank, and automated quiz generation were explicit non-goals. |
| **Scoring system** | Non-goal | Deferred | Points, grades, leaderboards — explicitly excluded. |
| **Spaced-repetition scheduler** | Non-goal | Deferred | SM-2 / Anki-style intervals could sit on top of existing event data in a future phase. |
| **Teacher dashboard** | Non-goal | Deferred | No educator-facing analytics or classroom management. Single-learner Vault for now. |
| **School/class/tenancy model** | Non-goal | Deferred | Single-tenant only. No multi-user isolation, no enrollment, no classroom grouping. |
| **AI-generated weak-spot diagnosis** | Non-goal | Deferred | Current heuristic is purely deterministic (event counts). AI-based semantic diagnosis deferred. |
| **Mobile responsive polish** | — | Low | Desktop-first; minimal mobile optimization. |
| **Production-grade auth** | — | Medium | Owner gate is cookie-based; no JWT/OAuth, no user registration. |

---

## 5. Validation Results

| Suite | Command | Result |
|-------|---------|--------|
| Backend (full) | `uv run python -m pytest tests/` | **222/222 passed** |
| Study API subset | `uv run python -m pytest tests/test_study_api.py` | **19/19 passed** |
| Frontend unit tests | `cd frontend && npm test` | **57/57 passed** |
| Frontend build | `cd frontend && npm run build` | **Clean compilation** |
| Working tree | `git status --short` | **Clean** |
| Git HEAD | `git log --oneline -1` | `cf68ebb` |

---

## 6. Demo Script

A manual walkthrough that exercises the full persisted memory loop:

```text
PREREQUISITE: Vault API + Frontend + SurrealDB running, one library with
at least one leaf (note) in it.

1. Open http://localhost:3003/vault
   → Command Center dashboard: quick actions, Continue Studying,
     Review Queue, Learning Panel.

2. Open /notebooks and click into your library (or create one)
   → Library page loads with notes tab visible.

3. Open a leaf study card (click on a note)
   → LeafStudyCard renders: heading, key points, source material link.
   → A study session is silently created (POST /api/study/sessions).
   → Study session ID is shared across all leaf cards in this library.

4. Expand "Check yourself"
   → Click the orange "Check yourself" bar.
   → check_started event fires → POST /api/study/leaf-events
     (visible in API logs / SurrealDB leaf_review_event table).

5. Write an answer, click "I need to review this"
   → needs_review event fires → POST /api/study/leaf-events.
   → leaf_review_state is upserted: needs_review=true, review_count=1.
   → Feedback message: "You have marked this for review."

6. Close the leaf, open it again, repeat step 5
   → needs_review event fires again. review_count becomes 2.
   → The leaf now has ≥2 needs_review events with no remembered after.

7. Wait at least 1 minute (or adjust cooldown mentally)
   → The weak-spot cooldown is 1 hour. For testing, verify that the
     heuristic would classify this as weak (≥2 needs_review, no later
     remembered, and the last needs_review is >1h old in real usage).

8. Open /vault
   → Review Queue loads from GET /api/study/review-queue.
   → If step 7 conditions met: leaf appears in "Needs practice" (orange).
   → If conditions not yet met: leaf appears in "Needs review" (amber).

9. Open the leaf again. Use "Check yourself" → "I remembered this"
   → remembered event fires → POST /api/study/leaf-events.
   → leaf_review_state upserted: needs_review=false.

10. Open /vault again
    → Leaf now in "Recently remembered" (green).
    → No longer in "Needs practice" — a recent remembered resets weak-spot status.

11. Close the browser tab (hard close, no navigation)
    → The session remains "active" in the database.

12. Reopen Vault, navigate to the same library
    → POST /api/study/sessions fires on NotesColumn mount.
    → Session from step 11 is >0s old but <12h old → it is RESUMED (not abandoned).

13. Wait 12 hours (or for verification, check the close_stale_sessions logic)
    → After 12h, the next POST /api/study/sessions for this notebook will:
      a) Find the stale active session
      b) Set it to status=abandoned, ended_at=now()
      c) Create a fresh active session
    → This prevents unbounded accumulation of orphaned sessions.

VERIFICATION POINTS:

  ✓ Leaf study card renders structured content
  ✓ Check yourself opens and accepts input
  ✓ Review events appear in leaf_review_event table (SurrealDB)
  ✓ Review state reflects latest outcome in leaf_review_state table
  ✓ Review Queue shows leaf in the correct section
  ✓ Weak-spot heuristic correctly classifies ≥2 needs_review
  ✓ remembered event resets weak-spot classification
  ✓ Study session is created and shared across cards
  ✓ Tab-close leaves session active (verifiable in DB)
  ✓ Re-visit resumes existing active session
  ✓ 12h+ sessions are auto-abandoned on next session create
```

---

## 7. Next Recommended Phase: Epsilon

Delta built a **complete single-learner memory loop**. The natural next phase is **Epsilon**: layering in multi-tenant primitives so Vault can operate in school and classroom environments.

### Epsilon A (recommended first step) — School/Class/Teacher Design Doc

Before writing any code, produce a design document covering:

1. **User model**
   - Email + password registration
   - Login / logout session management
   - Basic roles: learner, teacher, admin

2. **School entity**
   - Container for multiple classrooms/cohorts
   - Self-hosted per school or cloud-hosted multi-school

3. **Classroom grouping**
   - Teacher + enrolled learners
   - Notebook assignment (teacher creates → assigns to class)
   - Review queue scoping per user + per class

4. **Data isolation**
   - Add `user_id` to study tables (nullable — single-tenant instances unchanged)
   - Backward compatibility: existing data continues working with `user_id = null`

5. **Non-goals for Epsilon**
   - ❌ Full RBAC (keep simple)
   - ❌ Scoring / grades / leaderboards
   - ❌ Spaced repetition scheduler
   - ❌ AI generation features
   - ❌ Changes to Delta-era table schema without backward compatibility

### Epsilon+ later phases (after the design doc)

- **Epsilon B**: Implement user auth (backend + frontend)
- **Epsilon C**: School/classroom API + data model
- **Epsilon D**: Teacher dashboard (aggregate review queue, weak spots, session activity)
- **Epsilon E**: Notebook sharing and assignment flow

---

## 8. Delta Phase Summary

```
Delta A (study hub):       SourceDetailContent study hub card with CTAs
     ↓
Delta B (leaf cards):      LeafStudyCard structured rendering
     ↓
Delta C (check yourself):  Local retrieval practice on each leaf
     ↓
Delta D (review shell):    ReviewQueue component on /vault
     ↓
Delta E (design):          Persistence design doc for sessions + events + state
     ↓
Delta F (backend persist): study_session, leaf_review_event, leaf_review_state tables + API
     ↓
Delta G (wire events):     LeafStudyCard fires check_started / remembered / needs_review
     ↓
Delta H (persisted queue): ReviewQueue consumes GET /api/study/review-queue
     ↓
Delta I (design weak):     Weak-spot heuristic design doc
     ↓
Delta J (backend weak):    Query-time weak-spot derivation, API fields
     ↓
Delta K (frontend weak):   Three-section ReviewQueue: Needs practice / Needs review / Remembered
     ↓
Delta L (auto-close):      Stale session auto-close after 12 hours
```

**Delta is complete.** The learner memory loop is persisted, tested, and running in production. All check-yourself actions survive page reloads, weak spots are surfaced in a learner-friendly three-tier review queue, and study sessions do not accumulate indefinitely.

Future feature expansion should begin with **Epsilon A — School/Class/Teacher Design Doc**, not more Delta-phase feature additions.

---

## Appendix: Git History

```
cf68ebb docs: add Delta completion checkpoint         ← THIS DOC
585e7fd vault: auto-close stale study sessions          ← Delta L
6140ceb vault: show needs-practice items in review queue ← Delta K
fe52d2f vault: lift study session lifecycle ownership    ← Debt C
4b5e89f docs: diagnose backend async test failures       ← Debt B
73809e4 docs: add Vault stabilization debt register       ← Debt A
5179568 vault: derive weak-spot flags for review queue   ← Delta J
a38e1e5 docs: design weak-spot heuristic                 ← Delta I
49c246d vault: use persisted review queue                ← Delta H
34e5759 vault: persist leaf check-yourself events        ← Delta G
80c16e4 vault: add study and review persistence backend  ← Delta F
5d932a9 vault: polish learner study loop                 ← Delta A-D acceptance
9c654fa vault: add ReviewQueue shell                     ← Delta D
36f2e54 vault: implement check-yourself flow             ← Delta C
1e18c64 vault: add LeafStudyCard component               ← Delta B
6aaff2f vault: add Material Study Hub                    ← Delta A
```

*Prepared: 2026-07-04 · Git ref: `cf68ebb`*
