# Vault Study Session & Review Persistence — Design

**Phase:** Delta E (design only)  
**Status:** Draft  
**Author:** Ops pass  
**Date:** 2026-07-04  
**Git ref:** `4c0cb33` (HEAD at time of writing)

---

## Current State

Vault's learner loop currently has:

| Feature | Implementation | Persistence |
|---------|---------------|-------------|
| Libraries (notebooks) | Full CRUD, relationships | ✅ SurrealDB `notebook` table |
| Materials (sources) | Full CRUD, embedding, insights | ✅ SurrealDB `source` table |
| Leaves (notes) | Full CRUD, embedding | ✅ SurrealDB `note` table |
| Check-yourself on leaf cards | Local React state in `LeafStudyCard.tsx` | ❌ None — lost on page refresh |
| Review Queue | UI shell in `ReviewQueue.tsx` using `useRecentNotes()` | ❌ No persisted review state |
| Study sessions | Not implemented | ❌ N/A |

The existing Review Queue (`frontend/src/components/vault/ReviewQueue.tsx`) explicitly documents its scaffolding status:

> *"No persistence, no scoring, no weak-spot tracking. Review history / spaced repetition to be added in a later Delta phase."*

---

## Problem Statement

Without persisted learning events:

1. **Check-yourself results vanish on page refresh.** A learner marks a leaf as "remembered" or "needs review" — the next load resets everything to zero.
2. **Review Queue has no signal.** It can only show recently touched leaves, not leaves the learner actually struggled with.
3. **No study-session tracking.** There is no way to measure time-on-task, completion rates, or which materials were studied in a given session.
4. **No foundation for weak-spot heuristics.** Future features like spaced repetition, weak-spot summaries, or teacher dashboards require raw event data to compute from.

---

## Goals

1. **Persist leaf review events** — each "opened", "remembered", "needs_review" click records a timestamped row.
2. **Track study sessions** — a lightweight start/stop container so we can eventually measure engagement.
3. **Serve a persisted review queue** — `GET /api/study/review-queue` returns leaves ordered by recency of last review plus a "needs_review" flag, replacing the current `useRecentNotes` scaffolding.
4. **Keep the data schema minimal** — three new tables, no joins across hundreds of rows per learner.
5. **Separate raw events from derived insights** — review events are append-only facts; weak spots and spaced-repetition schedules are computed downstream.

## Non-Goals

- ❌ No scoring system (no points, no leaderboards, no grades)
- ❌ No quiz attempts (multiple-choice, fill-in-the-blank, etc.)
- ❌ No spaced-repetition scheduler (Anki-style intervals)
- ❌ No teacher dashboard or analytics UI
- ❌ No school/tenant model
- ❌ No AI-generated weak spots
- ❌ No RBAC or per-user isolation (single-learner Vault for now)
- ❌ No frontend UI changes (design only)

---

## Proposed Minimal Entities

### 1. `study_session`

**Purpose:** Groups leaf-review events into a contiguous study period. Allows future measurement of session duration, cards reviewed per session, completion rates.

**Why not optional?** Even without a UI for sessions, the entity provides a natural grouping key. In Delta H, the Material Study Hub can start/stop sessions automatically when a learner navigates into/away from a leaf.

```surql
DEFINE TABLE IF NOT EXISTS study_session SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS notebook_id ON TABLE study_session TYPE record<notebook>;
DEFINE FIELD IF NOT EXISTS status ON TABLE study_session TYPE string
  ASSERT $value INSIDE ["active", "completed", "abandoned"];
DEFINE FIELD IF NOT EXISTS started_at ON TABLE study_session TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS ended_at ON TABLE study_session TYPE option<datetime>;
DEFINE FIELD IF NOT EXISTS leaf_count ON TABLE study_session TYPE int DEFAULT 0;
DEFINE FIELD IF NOT EXISTS created ON TABLE study_session TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated ON TABLE study_session TYPE datetime DEFAULT time::now();
```

| Field | Required | Future-facing? | Notes |
|-------|----------|----------------|-------|
| `id` | auto | No | SurrealDB record ID (`study_session:uuid`) |
| `notebook_id` | Yes | No | Links to the library being studied |
| `status` | Yes | No | `active`, `completed`, `abandoned` |
| `started_at` | Yes | No | Set at creation time |
| `ended_at` | Optional | No | Set when status changes to `completed` or `abandoned` |
| `leaf_count` | Yes | No | Count of distinct leaves reviewed in this session; incremented by application logic |
| `created` | auto | No | SurrealDB standard |
| `updated` | auto | No | SurrealDB standard |

**Indexes/query patterns:**
- `SELECT * FROM study_session ORDER BY started_at DESC LIMIT 1 WHERE status = "active"` — find current session
- `SELECT * FROM study_session WHERE notebook_id = $id ORDER BY started_at DESC` — session history for a library
- `SELECT count() FROM study_session WHERE status = "completed" GROUP ALL` — total sessions count

---

### 2. `leaf_review_event`

**Purpose:** Single append-only record of a learner's interaction with one leaf during study. Each button click on a LeafStudyCard creates one event.

```surql
DEFINE TABLE IF NOT EXISTS leaf_review_event SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS session_id ON TABLE leaf_review_event TYPE record<study_session>;
DEFINE FIELD IF NOT EXISTS note_id ON TABLE leaf_review_event TYPE record<note>;
DEFINE FIELD IF NOT EXISTS notebook_id ON TABLE leaf_review_event TYPE record<notebook>;
DEFINE FIELD IF NOT EXISTS event_type ON TABLE leaf_review_event TYPE string
  ASSERT $value INSIDE ["opened", "check_started", "remembered", "needs_review", "listened"];
DEFINE FIELD IF NOT EXISTS event_metadata ON TABLE leaf_review_event TYPE option<object> FLEXIBLE;
DEFINE FIELD IF NOT EXISTS created ON TABLE leaf_review_event TYPE datetime DEFAULT time::now();
```

| Field | Required | Future-facing? | Notes |
|-------|----------|----------------|-------|
| `id` | auto | No | SurrealDB record ID (`leaf_review_event:uuid`) |
| `session_id` | Yes | No | Links to parent study session |
| `note_id` | Yes | No | Which leaf was reviewed |
| `notebook_id` | Yes | No | Denormalized for query convenience (avoids join through session) |
| `event_type` | Yes | No | See event types below |
| `event_metadata` | Optional | Yes | Flexible JSON for future fields (time spent, audio duration, etc.) |
| `created` | auto | No | Timestamp of the event |

**Event types:**

| Event | When emitted | After this, review state is… |
|-------|-------------|------------------------------|
| `opened` | Leaf card is expanded or navigated to for the first time in a session | unchanged |
| `check_started` | Learner clicks "Check yourself" but hasn't answered yet | unchanged |
| `remembered` | Learner clicks "I remembered" after a check | strengthened (needs_review = false) |
| `needs_review` | Learner clicks "Needs review" after a check | weakened (needs_review = true) |
| `listened` | Learner listens to TTS on the leaf | unchanged |

**Why not simplify to a single `review_outcome` field?** Event types are timeline facts, not state mutations. The distinction between `opened` → `check_started` → `remembered` vs just `opened` lets future heuristics detect abandonment or hesitation. Application logic derives the current state from the most recent terminal event for each leaf.

**Indexes/query patterns:**
- `SELECT * FROM leaf_review_event WHERE note_id = $id ORDER BY created DESC` — review timeline for one leaf
- `SELECT * FROM leaf_review_event WHERE session_id = $id ORDER BY created` — full session timeline
- `SELECT note_id, math::max(created) as last_reviewed FROM leaf_review_event WHERE event_type INSIDE ["remembered", "needs_review"] GROUP BY note_id` — per-leaf last review date (useful for review queue)
- `SELECT note_id FROM leaf_review_event GROUP BY note_id ORDER BY math::max(created) DESC LIMIT 20` — recent leaves (replaces `useRecentNotes`)
- `SELECT * FROM leaf_review_event WHERE notebook_id = $id AND event_type = "needs_review" ORDER BY created DESC` — leaves flagged as needing review

**Query for review queue (initial implementation):**
```surql
-- Leaves that have been reviewed at least once, ordered by last review time,
-- with a "needs_review" flag from the most recent terminal event.
LET $recent = (
  SELECT note_id, math::max(created) AS last_reviewed
  FROM leaf_review_event
  WHERE event_type INSIDE ["opened", "remembered", "needs_review"]
  GROUP BY note_id
);

SELECT * FROM (
  SELECT
    note_id,
    last_reviewed,
    (SELECT event_type FROM leaf_review_event
     WHERE note_id = $parent.note_id
     ORDER BY created DESC LIMIT 1)[0].event_type AS latest_event
  FROM $recent
  ORDER BY last_reviewed DESC
  LIMIT $limit
);
```

---

### 3. `leaf_review_state` (denormalized, derived)

**Purpose:** Pre-computed current review state per leaf, updated by an application-level trigger whenever a terminal event (`remembered`, `needs_review`) is recorded. Avoids counting on the aggregated query above for the Review Queue's most common read path.

```surql
DEFINE TABLE IF NOT EXISTS leaf_review_state SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS note_id ON TABLE leaf_review_state TYPE record<note> UNIQUE;
DEFINE FIELD IF NOT EXISTS notebook_id ON TABLE leaf_review_state TYPE record<notebook>;
DEFINE FIELD IF NOT EXISTS needs_review ON TABLE leaf_review_state TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS last_event_type ON TABLE leaf_review_state TYPE string;
DEFINE FIELD IF NOT EXISTS last_event_at ON TABLE leaf_review_state TYPE datetime;
DEFINE FIELD IF NOT EXISTS review_count ON TABLE leaf_review_state TYPE int DEFAULT 0;
DEFINE FIELD IF NOT EXISTS created ON TABLE leaf_review_state TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated ON TABLE leaf_review_state TYPE datetime DEFAULT time::now();
```

| Field | Required | Future-facing? | Notes |
|-------|----------|----------------|-------|
| `id` | auto | No | SurrealDB record ID |
| `note_id` | Yes | No | Unique per leaf — upsert not create |
| `notebook_id` | Yes | No | Denormalized |
| `needs_review` | Yes | No | `true` if last terminal event was `needs_review` |
| `last_event_type` | Yes | No | The most recent event type affecting state |
| `last_event_at` | Yes | No | Timestamp of that event |
| `review_count` | Yes | No | Total `remembered` + `needs_review` events |
| `created` | auto | No | |
| `updated` | auto | No | |

**Why a separate table instead of computing from events on every read?** The review queue is a frequently-rendered component (every page load on `/vault`). Running an aggregate query over potentially thousands of events per leaf creates unnecessary latency. The state table is updated in the same API call that inserts the event, so it's always consistent within a single request. This is a standard materialized-adjacent pattern.

**Lifecycle:** `leaf_review_state` is upserted by the `POST /api/study/leaf-events` handler after every `remembered` or `needs_review` event. No separate cleanup is needed — if events are deleted for a leaf (admin action), the state row remains benign (it only affects the review queue suggestion).

**Indexes/query patterns:**
- `SELECT * FROM leaf_review_state WHERE notebook_id = $id ORDER BY updated DESC` — review queue
- `SELECT * FROM leaf_review_state WHERE needs_review = true AND notebook_id = $id ORDER BY updated DESC` — needs-review filter
- `SELECT count() FROM leaf_review_state WHERE notebook_id = $id GROUP ALL` — total reviewed leaves in a library

---

### 4. `weak_spot` (deferred — sketch only)

**Purpose (future):** Derived heuristic identifying topics or leaves the learner repeatedly marked as `needs_review`. Computed by a background job or scheduled cron, not by the event-logging endpoints.

```surql
-- NOT FOR INITIAL IMPLEMENTATION
DEFINE TABLE IF NOT EXISTS weak_spot SCHEMAFULL;

DEFINE FIELD IF NOT EXISTS notebook_id ON TABLE weak_spot TYPE record<notebook>;
DEFINE FIELD IF NOT EXISTS label ON TABLE weak_spot TYPE string;  -- e.g., "Trigonometric identities"
DEFINE FIELD IF NOT EXISTS source_ids ON TABLE weak_spot TYPE array<record<source>>;
DEFINE FIELD IF NOT EXISTS note_ids ON TABLE weak_spot TYPE array<record<note>>;
DEFINE FIELD IF NOT EXISTS event_ids ON TABLE weak_spot TYPE array<record<leaf_review_event>>;
DEFINE FIELD IF NOT EXISTS weakness_score ON TABLE weak_spot TYPE float;  -- 0.0 (strong) to 1.0 (weak)
DEFINE FIELD IF NOT EXISTS computed_at ON TABLE weak_spot TYPE datetime;
DEFINE FIELD IF NOT EXISTS created ON TABLE weak_spot TYPE datetime DEFAULT time::now();
```

**Deferral rationale:** Weak-spot computation depends on having enough `leaf_review_event` data to be meaningful. Implementing it before there are any events is premature. The `leaf_review_event` schema's `event_metadata` field is designed to carry extra context (time spent, hesitation markers) that a future heuristic could use.

---

## Proposed API Endpoints

All under the `/api/study/` prefix, in a new `api/routers/study.py` router.

### `POST /api/study/sessions`

**Purpose:** Start or resume a study session for a notebook.

**Request body:**
```json
{
  "notebook_id": "notebook:abc123"
}
```

**Logic:**
1. Query for an existing `study_session` with `status = "active"` for this notebook.
2. If found, return it (resume).
3. If not found, create a new `study_session` with `status = "active"`.

**Response:** `StudySessionResponse` — the session record.

**Future note:** When a learner navigates to the Material Study Hub, the frontend calls this endpoint. When they navigate away (or after N minutes of inactivity), a `PATCH` closes the session.

---

### `PATCH /api/study/sessions/{id}`

**Purpose:** End an active study session.

**Request body:**
```json
{
  "status": "completed"
}
```

**Logic:**
1. Set `status = "completed"` and `ended_at = now()`.
2. Update `leaf_count` to the current count of distinct `note_id` values in `leaf_review_event` for this session.

**Response:** `StudySessionResponse` — the updated session record.

---

### `POST /api/study/leaf-events`

**Purpose:** Log a leaf review event.

**Request body:**
```json
{
  "session_id": "study_session:uuid",
  "note_id": "note:xyz",
  "notebook_id": "notebook:abc",
  "event_type": "remembered",
  "event_metadata": {}
}
```

**Logic:**
1. Validate `event_type` is one of the allowed values.
2. Insert into `leaf_review_event`.
3. If `event_type` is `remembered` or `needs_review`, upsert `leaf_review_state`:
   - Set `needs_review = (event_type == "needs_review")`
   - Increment `review_count`
   - Update `last_event_at`, `last_event_type`
4. Return the created event.

**Response:** `LeafReviewEventResponse`.

---

### `GET /api/study/review-queue`

**Purpose:** Return leaves ready for review, ordered by recency.

**Query params:**
- `notebook_id` (optional) — filter by library
- `limit` (default 20) — max results
- `needs_review_only` (default false) — if true, only return leaves with `needs_review = true`

**Logic:**
1. Query `leaf_review_state` for the given notebook, ordered by `updated DESC`.
2. Optionally filter to `needs_review = true`.
3. Join with `note` table to get leaf title/content preview.
4. Return combined results.

**Response:**
```json
{
  "items": [
    {
      "note_id": "note:xyz",
      "title": "Trigonometric identities",
      "content_preview": "Key formulas: sin²θ + cos²θ = 1...",
      "needs_review": true,
      "last_reviewed": "2026-07-04T14:30:00Z",
      "review_count": 3
    }
  ],
  "total": 15
}
```

---

### `GET /api/study/sessions`

**Purpose:** List study sessions (for future analytics).

**Query params:**
- `notebook_id` (optional)
- `limit` (default 10)
- `status` (optional)

---

## Frontend Integration Points

### LeafStudyCard (`frontend/src/components/notebooks/LeafStudyCard.tsx`)

**Current:** Check-yourself buttons toggle local `useState` only.

**Delta G integration:**
- On card expand: call `POST /api/study/leaf-events` with `event_type: "opened"`
- On "Check yourself" click: call with `event_type: "check_started"`
- On "Remembered" click: call with `event_type: "remembered"`
- On "Needs review" click: call with `event_type: "needs_review"`
- On TTS play: call with `event_type: "listened"`

Each call needs a `session_id`. The component or a parent hook should get-or-create a session on mount via `POST /api/study/sessions`.

**Error handling:** Events are non-critical — the UI should never block on them. Use `try/catch` or fire-and-forfetch (mutation with `onError` that logs to console but doesn't show a toast).

### ReviewQueue (`frontend/src/components/vault/ReviewQueue.tsx`)

**Current:** Uses `useRecentNotes()` which queries `/api/notes` ordered by `updated desc`.

**Delta H integration:**
- Replace `useRecentNotes()` with `useStudyReviewQueue(notebookId)` calling `GET /api/study/review-queue`
- Keep the existing empty-state UI (`t('vault.nothingToReview')`)
- Add a "needs review" badge on items where `needs_review = true`

### Study Hub (`frontend/src/components/sources/SourceDetailContent.tsx`)

**Future (post-Delta):** The Material Study Hub's "Study this material" button could call `POST /api/study/sessions` to start a session. Navigating away calls `PATCH` to end it.

### New hooks needed:

| Hook | API call | Purpose |
|------|----------|---------|
| `useStudySession(notebookId)` | `POST /api/study/sessions` | Get or create active session |
| `useLogReviewEvent()` | `POST /api/study/leaf-events` | Mutation: log a review event |
| `useReviewQueue(notebookId, options)` | `GET /api/study/review-queue` | Fetch review queue items |

### New API module needed:

`frontend/src/lib/api/study.ts` — following the existing pattern in `api/notes.ts`, export `studyApi` with methods for each endpoint.

### New types needed in `frontend/src/lib/types/api.ts`:

```typescript
export interface StudySessionResponse {
  id: string
  notebook_id: string
  status: 'active' | 'completed' | 'abandoned'
  started_at: string
  ended_at?: string
  leaf_count: number
}

export interface CreateStudySessionRequest {
  notebook_id: string
}

export interface UpdateStudySessionRequest {
  status: 'completed' | 'abandoned'
}

export interface LeafReviewEventResponse {
  id: string
  session_id: string
  note_id: string
  notebook_id: string
  event_type: 'opened' | 'check_started' | 'remembered' | 'needs_review' | 'listened'
  event_metadata?: Record<string, unknown>
  created: string
}

export interface CreateLeafReviewEventRequest {
  session_id: string
  note_id: string
  notebook_id: string
  event_type: LeafReviewEventResponse['event_type']
  event_metadata?: Record<string, unknown>
}

export interface ReviewQueueItem {
  note_id: string
  title?: string
  content_preview?: string
  needs_review: boolean
  last_reviewed: string
  review_count: number
}

export interface ReviewQueueResponse {
  items: ReviewQueueItem[]
  total: number
}
```

---

## Migration Plan

### New migration file: `vault_core/database/migrations/16.surrealql`

```surql
-- Migration 16: Study session, review event, and review state tables
-- for Vault's learner-loop persistence.

-- 1. Study session
DEFINE TABLE IF NOT EXISTS study_session SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS notebook_id ON TABLE study_session TYPE record<notebook>;
DEFINE FIELD IF NOT EXISTS status ON TABLE study_session TYPE string
  ASSERT $value INSIDE ["active", "completed", "abandoned"];
DEFINE FIELD IF NOT EXISTS started_at ON TABLE study_session TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS ended_at ON TABLE study_session TYPE option<datetime>;
DEFINE FIELD IF NOT EXISTS leaf_count ON TABLE study_session TYPE int DEFAULT 0;
DEFINE FIELD IF NOT EXISTS created ON TABLE study_session TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated ON TABLE study_session TYPE datetime DEFAULT time::now();

-- 2. Leaf review event (append-only log)
DEFINE TABLE IF NOT EXISTS leaf_review_event SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS session_id ON TABLE leaf_review_event TYPE record<study_session>;
DEFINE FIELD IF NOT EXISTS note_id ON TABLE leaf_review_event TYPE record<note>;
DEFINE FIELD IF NOT EXISTS notebook_id ON TABLE leaf_review_event TYPE record<notebook>;
DEFINE FIELD IF NOT EXISTS event_type ON TABLE leaf_review_event TYPE string
  ASSERT $value INSIDE ["opened", "check_started", "remembered", "needs_review", "listened"];
DEFINE FIELD IF NOT EXISTS event_metadata ON TABLE leaf_review_event TYPE option<object> FLEXIBLE;
DEFINE FIELD IF NOT EXISTS created ON TABLE leaf_review_event TYPE datetime DEFAULT time::now();

-- 3. Leaf review state (denormalized, derived from events)
DEFINE TABLE IF NOT EXISTS leaf_review_state SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS note_id ON TABLE leaf_review_state TYPE record<note> UNIQUE;
DEFINE FIELD IF NOT EXISTS notebook_id ON TABLE leaf_review_state TYPE record<notebook>;
DEFINE FIELD IF NOT EXISTS needs_review ON TABLE leaf_review_state TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS last_event_type ON TABLE leaf_review_state TYPE string;
DEFINE FIELD IF NOT EXISTS last_event_at ON TABLE leaf_review_state TYPE datetime;
DEFINE FIELD IF NOT EXISTS review_count ON TABLE leaf_review_state TYPE int DEFAULT 0;
DEFINE FIELD IF NOT EXISTS created ON TABLE leaf_review_state TYPE datetime DEFAULT time::now();
DEFINE FIELD IF NOT EXISTS updated ON TABLE leaf_review_state TYPE datetime DEFAULT time::now();
```

### Registration in `async_migrate.py`:

Add migration 16 to both the `up_migrations` and `down_migrations` lists in `AsyncMigrationManager.__init__()`.

### Down migration: `vault_core/database/migrations/16_down.surrealql`

```surql
-- Rollback migration 16
DROP TABLE IF EXISTS leaf_review_state;
DROP TABLE IF EXISTS leaf_review_event;
DROP TABLE IF EXISTS study_session;
```

### Data migration:

**None required.** All three tables are new and empty. Existing `note`, `notebook`, and `source` records are untouched. Existing review-queue UI continues to work (it still uses `useRecentNotes` until Delta H).

---

## Privacy & Security Notes

1. **Single-learner assumption.** Vault currently has no user accounts. All events are stored unauthenticated within the database. When multi-user is added later, a `user_id` field must be added to `study_session`, `leaf_review_event`, and `leaf_review_state`. The fields are marked with `-- FUTURE: add user_id` inline in the migration SQL.
2. **Event data is not encrypted at rest.** Review events contain no PII beyond the fact that a learner reviewed a specific leaf. If stronger privacy is required, encrypt `note_id` references or store only hashed identifiers.
3. **No PII in event_metadata.** The `event_metadata` FLEXIBLE object must not be used to store learner-identifiable information (names, emails, IPs). This is an application-level constraint, not a database constraint.
4. **Review events are append-only.** There is no `DELETE` or `UPDATE` endpoint for individual events. If data correction is needed, an admin can run a direct SurrealQL query. This preserves the audit trail.
5. **API endpoints are gated by the existing PasswordAuthMiddleware**, same as all other `/api/*` routes. No separate auth is needed.

---

## Failure / Rollback Plan

| Failure mode | Impact | Mitigation |
|-------------|--------|------------|
| Transaction conflict writing review event | Lost event | Retry once with exponential backoff in the API handler. Non-critical — learner can re-click. |
| `leaf_review_state` update fails after event insert | State table desyncs from events | Event is already persisted. Next event for the same leaf will re-upsert state correctly. A periodic reconciliation job can fix orphans. |
| Migration 16 fails on API startup | API fails to start (current behavior) | Apply 16_down.surrealql manually via `surreal sql`, fix the migration SQL, restart API. |
| Review queue endpoint returns error | Review Queue shows empty state | The UI already has an empty-state (`t('vault.nothingToReview')`). No crash — just degraded suggestions. |
| Frontend event-logging mutation fails | Local state only (no persistence) | The UI already works without persistence. The button click response is purely local. The failure is silent (no toast). |
| `POST /api/study/sessions` fails on leaf mount | Leaf events logged without session_id | Make `session_id` optional in the event schema for this case, or fall back to a temporary client-side UUID that gets reconciled later. |

### Rollback steps (if Delta F needs to be reverted entirely):

```bash
# 1. Revert backend migration
surreal sql --endpoint http://localhost:8000 --ns vault_core --db vault_core \
  < vault_core/database/migrations/16_down.surrealql

# 2. Revert code changes (git revert)
git revert <delta-f-commit-hash>

# 3. Restart API (migration auto-unapplied at startup)
sudo systemctl restart vault-api.service
```

---

## Implementation Slices (Post-Design)

### Delta F — Backend models, migration, API skeleton

**Scope:**
1. Create `vault_core/domain/study.py` with `StudySession`, `LeafReviewEvent`, `LeafReviewState` models inheriting from `ObjectModel`.
2. Add migration 16 `.surrealql` / `16_down.surrealql`.
3. Register migration 16 in `AsyncMigrationManager`.
4. Create `api/routers/study.py` with all proposed endpoints.
5. Register router in `api/main.py`.
6. Add Pydantic models in `api/models.py` for request/response schemas.
7. Create `frontend/src/lib/api/study.ts` with `studyApi`.
8. Add TypeScript types to `frontend/src/lib/types/api.ts`.

**Deliverable:** Fully functional backend with persistent event storage. No frontend behavioral changes — the new API is callable but not wired into the UI yet.

### Delta G — Frontend event logging from LeafStudyCard

**Scope:**
1. Create `useStudySession` hook.
2. Create `useLogReviewEvent` mutation hook.
3. Wire LeafStudyCard check-yourself buttons → `POST /api/study/leaf-events`.
4. Wire card expand → `POST /api/study/leaf-events` (event_type: "opened").

**Deliverable:** Every "Check yourself" interaction persists. Reloading no longer loses the learner's work.

### Delta H — ReviewQueue uses persisted review state

**Scope:**
1. Create `useReviewQueue` hook calling `GET /api/study/review-queue`.
2. Replace `useRecentNotes()` in `ReviewQueue.tsx`.
3. Add "needs review" badge to items where `needs_review = true`.

**Deliverable:** Review Queue shows actual review history instead of recently updated leaves.

### Delta I — Simple weak-spot heuristic design

**Scope:**
1. Design a lightweight heuristic: leaves with ≥2 `needs_review` events and no `remembered` event in 7 days are "weak".
2. Create a cron-able script or API endpoint that runs the heuristic and writes to the `weak_spot` table.
3. Add a "Weak spots" section to the Vault dashboard.

**Deliverable:** First analytics feature — no AI, no ML, just counting events.

---

## Important Constraints (Reaffirmed)

| Constraint | Status | Notes |
|-----------|--------|-------|
| No scoring | ✅ | Event types carry no score |
| No quiz attempts | ✅ | Out of scope |
| No spaced-repetition scheduler | ✅ | Raw data only — algorithm added later |
| No teacher dashboard | ✅ | Out of scope |
| No school/tenant model | ✅ | Single-learner Vault |
| No AI-generated weak spots | ✅ | Heuristic-based when implemented |
| `npm`, not `pnpm` | ✅ | Applies to all frontend changes |
| Existing data preserved | ✅ | No existing tables modified |
| AetherLink untouched | ✅ | Frontend-only, in Vault codebase |
| Owner/auth unchanged | ✅ | No auth changes needed |

---

## Appendix: Query Patterns Reference

### Most common reads, ordered by expected frequency:

1. **Review queue for a notebook** (every `/vault` page load)
   ```surql
   SELECT * FROM leaf_review_state WHERE notebook_id = $nbid
   ORDER BY updated DESC LIMIT 20;
   ```

2. **Find current active session** (every leaf card expand)
   ```surql
   SELECT * FROM study_session WHERE notebook_id = $nbid
   AND status = "active" ORDER BY started_at DESC LIMIT 1;
   ```

3. **Full review timeline for a leaf** (debugging / future analytics)
   ```surql
   SELECT * FROM leaf_review_event WHERE note_id = $nid ORDER BY created;
   ```

4. **Count leaves needing review** (dashboard badge)
   ```surql
   SELECT count() FROM leaf_review_state WHERE notebook_id = $nbid
   AND needs_review = true GROUP ALL;
   ```

5. **Session summary** (future dashboard)
   ```surql
   SELECT * FROM study_session WHERE notebook_id = $nbid
   AND status = "completed" ORDER BY started_at DESC LIMIT 10;
   ```
