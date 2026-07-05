# Vault Weak-Spot Heuristic — Design

**Phase:** Delta I (design only)  
**Status:** Draft  
**Date:** 2026-07-04  
**Git ref:** `49c246d` (Delta H — persisted review queue)  

---

## Current State

As of Delta H (commit `49c246d`):

| Layer | Component | What exists |
|-------|-----------|-------------|
| Events | `leaf_review_event` | Append-only log; event types: `opened`, `check_started`, `remembered`, `needs_review`, `listened` |
| State | `leaf_review_state` | Denormalized per-leaf: `needs_review` (bool), `last_event_type`, `last_event_at`, `review_count` |
| Sessions | `study_session` | Lightweight grouping container; status: `active`, `completed`, `abandoned` |
| Review Queue | `GET /api/study/review-queue` | Returns leaves from `leaf_review_state` with `note_id`, `notebook_id`, `title`, `needs_review`, `last_reviewed`, `review_count` |
| Frontend | `ReviewQueue.tsx` | Two sections: "Needs review" (amber) and "Recently remembered" (green). No weak-spot grouping. |
| Events wired | `LeafStudyCard.tsx` | Logs `check_started`, `remembered`, `needs_review` via non-blocking mutation |

### What is missing

- No heuristic that distinguishes **repeatedly-struggled-with** leaves from **single-needs-review** leaves
- The review queue shows *all* leaves ordered by recency; a leaf with 5× `needs_review` sits next to a leaf with 1× `needs_review`
- No visual differentiation, no grouping, no badge for high-struggle items
- No internal flag or computed field for "this leaf needs attention"

---

## Problem Statement

The current review queue treats every `needs_review` equally. A learner who marks a leaf as "needs review" once and a leaf they've marked 7× `needs_review` across three study sessions see the same amber "Needs review" badge. There is no signal that Vault understands *which* topics the learner is genuinely struggling with.

Without a weak-spot heuristic:

1. **Learners cannot prioritise.** The queue is flat — no hint about which items need more attention.
2. **No growth signal.** There is no way to measure improvement (a leaf that went from 4× `needs_review` to 2× `remembered` with no recent `needs_review` is improving, but the queue doesn't show that).
3. **Future features blocked.** Teacher dashboards, spaced-repetition priority weighting, and "most-needed practice" summaries require some per-leaf struggle measure.
4. **No foundation for personalisation.** A playlist of "your weakest 5 topics" cannot exist without an honesty rule to define weak.

---

## Goals

1. **Define a simple, explainable v1 heuristic** that answers: "Is this leaf a weak spot for the learner?"
2. **Derive the heuristic from existing events** only — no manual editing, no AI.
3. **Use learner-friendly labels** — "Needs practice", "Getting stronger" — never "weak" in the UI.
4. **Keep computation simple and cheap** — no psychometric models, no Bayesian inference, no adaptive testing.
5. **Make rollback easy** — v1 should be query-time derivation or a single denormalised field, not a new table.
6. **Never block the learner** — if the heuristic computation fails, fall back to the normal review queue display.

---

## Non-Goals

- ❌ No spaced-repetition scheduler (Anki intervals, SM-2, etc.)
- ❌ No scoring system (points, grades, leaderboards)
- ❌ No quiz attempt analysis (multiple-choice scoring)
- ❌ No AI-generated diagnosis ("the learner seems confused about X")
- ❌ No teacher dashboard or analytics UI (deferred to later phase)
- ❌ No school/tenant model
- ❌ No RBAC or per-user isolation
- ❌ No schema migration until Delta J (adding to `leaf_review_state`)
- ❌ No frontend changes until Delta K (displaying badges)
- ❌ No session-lifecycle changes until Delta L (cleanup pass)

---

## Proposed v1 Heuristic

### Core rule

A leaf is classified as a **weak spot** (internal term; displayed as "Needs practice") when **all** of the following are true:

1. **At least 2 `needs_review` events** have been logged for that leaf.
2. **No `remembered` event** has been logged **after** the most recent `needs_review` event.
3. **The most recent `needs_review` event is at least 1 hour old** (cooldown). This prevents a leaf that was just studied from appearing immediately as a weak spot — the learner may still be actively working on it.

### Edge cases and refinements

| Case | Classification | Rationale |
|------|---------------|-----------|
| 0–1 `needs_review` events | Not a weak spot | Not enough data to call it a struggle |
| 2+ `needs_review`, but a `remembered` after the last one | Not a weak spot | The learner demonstrated recall since the last struggle |
| 2+ `needs_review`, last one <1 hour ago | Not yet a weak spot | Cooldown — still in active study session |
| 2+ `needs_review`, last one ≥1 hour ago, no subsequent `remembered` | **Weak spot** | Persistent difficulty |
| 5+ `needs_review`, all within 1 hour (toggling back and forth) | Not a weak spot | Cooldown applies — likely rapid toggling in a single session |
| Events exist but `needs_review` count is 0 (only `remembered`) | Not a weak spot | No struggle signal at all |

### Why 2× and not 1×?

A single `needs_review` is too noisy. The learner might click "Needs review" because they were distracted, didn't understand the prompt, or accidentally clicked. A second `needs_review` on a separate occasion suggests genuine difficulty.

### Why a 1-hour cooldown?

Without a cooldown, a leaf studied in a single session where the learner toggles between "remembered" and "needs review" rapidly could trigger the weak-spot flag during the same study session. The cooldown ensures weak spots reflect **cross-session** difficulty, not within-session noise.

The cooldown is intentionally short (1 hour) rather than 24 hours because some learners study in bursts across the day and we want to catch genuine difficulty within the same day.

### Why no `opened`/`check_started` count?

`opened` and `check_started` are non-terminal events — they don't carry a quality signal. A leaf opened 10 times and marked `remembered` each time is well-learned, not weak. Including non-terminal events would add noise.

---

## Data Model: Recommendation

### Recommended approach for v1: **Query-time derivation from `leaf_review_event`**

Do **not** add a new table or migration for v1. Instead, compute the heuristic on demand using the existing `leaf_review_event` table. The backend already has `LeafReviewEvent.get_for_note()` which fetches events for a leaf.

**Cost analysis:**
- Each weak-spot check requires: 1 query per leaf to `leaf_review_event` filtered by `note_id` + `event_type` + `created`
- For a review queue of 20 items: at most 20 queries (worst case)
- Each query is over a small dataset (per-leaf events grow slowly — maybe 5–50 events per leaf typical)
- SurrealDB query is indexed on `note_id`

**Advantages of query-time derivation:**
- ✅ **No migration needed** — zero schema changes
- ✅ **Always consistent** — always reads the latest events, no stale denormalised state
- ✅ **Easy to roll back** — remove the heuristic with no data cleanup
- ✅ **Easy to iterate** — change the threshold (2→3, 1h→4h) with no migration
- ✅ **No new domain models** — reuses existing `LeafReviewEvent`

**Disadvantages:**
- ❌ Slightly slower than reading a precomputed field (but still fast — single-index query per leaf)
- ❌ Cannot sort/filter by weak-spot status at the database level without adding a field

**Trade-off decision:** For v1, query-time derivation is preferred because it avoids schema change risk and lets us iterate on the heuristic itself. Precomputed state (Delta J) can add a field to `leaf_review_state` once the heuristic is stable.

### Future state (Delta J): Denormalized field on `leaf_review_state`

Once the heuristic has been validated in production, add a field to `leaf_review_state`:

```
consecutive_needs_review: int = 0   -- number of terminal events since last 'remembered'
```

Updated on every terminal event:
- On `needs_review`: increment by 1
- On `remembered`: reset to 0

Then the weak-spot check becomes:
```
weak_spot = consecutive_needs_review >= 2
    AND (now - last_event_at) >= 1 hour
```

This avoids the query-time cost and enables database-level filtering (e.g. `SELECT * FROM leaf_review_state WHERE consecutive_needs_review >= 2`).

---

## Learner-Facing Labels

| Internal term | UI label | Context |
|--------------|----------|---------|
| `weak_spot` | **"Needs practice"** | Used in the review queue for items that meet the threshold |
| `improving` | **"Getting stronger"** | A leaf that had prior `needs_review` but has recent `remembered` events — not a weak spot but shows a positive trend |
| `stale_needs_review` | **"Ready to revisit"** | A leaf with `needs_review` older than 7 days — not a weak spot (single occurrence) but hasn't been seen in a while |
| `weak_spot` | **never shown** | The term "weak spot" / "weakness" / "weak" is never displayed in the learner UI |

**Rationale:** "Weak spot" has negative connotations and suggests a fixed deficit. "Needs practice" is growth-oriented — the learner can improve it. "Getting stronger" reinforces positive progress.

**Icon suggestion for "Needs practice":** A dumbbell, weight, or a hand with a pencil — something suggesting action and practice, not deficiency.

---

## Proposed API Changes (Delta J)

### Add an optional `is_weak_spot` and `weak_spot_label` to `ReviewQueueItem`

```json
{
  "note_id": "n1",
  "title": "Trigonometric identities",
  "needs_review": true,
  "is_weak_spot": true,
  "weak_spot_label": "needs_practice",
  "last_reviewed": "2026-07-04T14:30:00Z",
  "review_count": 5
}
```

**How `is_weak_spot` gets computed (query-time):**

In `GET /api/study/review-queue`, after fetching the state records and note titles:

```
for each item in review_queue:
    events = await LeafReviewEvent.get_for_note(item.note_id)
    needs_review_count = count of events with event_type == "needs_review"
    last_needs_review = max(created) where event_type == "needs_review"
    last_remembered = max(created) where event_type == "remembered"
    
    is_weak = needs_review_count >= 2
        AND (last_remembered is None OR last_needs_review > last_remembered)
        AND (now - last_needs_review) >= 1 hour
    
    item.is_weak_spot = is_weak
    if is_weak:
        item.weak_spot_label = "needs_practice"
```

**Alternative: Add a `consecutive_needs_review` field to `leaf_review_state`**

This is the Delta J backend change. Schema:

```surql
-- Added to existing leaf_review_state table (new field)
DEFINE FIELD IF NOT EXISTS consecutive_needs_review ON TABLE leaf_review_state TYPE int DEFAULT 0;
```

Update logic in `upsert_from_event`:

```python
if event_type == "needs_review":
    state.consecutive_needs_review = (state.consecutive_needs_review or 0) + 1
elif event_type == "remembered":
    state.consecutive_needs_review = 0
```

Then the review queue endpoint computes:

```python
item.is_weak_spot = (
    state.consecutive_needs_review >= 2
    and (now - state.last_event_at).total_seconds() >= 3600
)
```

**Recommendation:** Implement the query-time version first in Delta J. If it proves slow (>100ms per request on the review queue), add the denormalised field as an optimization. The schema change is tiny and rollback-safe (just `REMOVE FIELD`).

---

## Frontend Display Plan (Delta K)

### ReviewQueue section changes

The ReviewQueue component will gain a third section above "Needs review":

```
┌────────────────────────────────────────────┐
│  Review queue                              │
│  Items needing another look                │
├────────────────────────────────────────────┤
│  🏋️ **Needs practice**         (3 items)   │  ← NEW
│  ┌──────────────────────────────────────┐  │
│  │ 🔄 Trigonometric Identities     →   │  │
│  │    last reviewed 2d ago · 5x        │  │
│  └──────────────────────────────────────┘  │
├────────────────────────────────────────────┤
│  🔄 **Needs review**            (2 items)  │
│  ┌──────────────────────────────────────┐  │
│  │ 🔄 Quadratic Equations          →   │  │
│  │    last reviewed 1d ago              │  │
│  └──────────────────────────────────────┘  │
├────────────────────────────────────────────┤
│  ✅ **Recently remembered**      (5 items) │
│  ┌──────────────────────────────────────┐  │
│  │ ✅ Python Basics                →   │  │
│  │    last reviewed 3h ago              │  │
│  └──────────────────────────────────────┘  │
│                                            │
│  ℹ️ Review queue is based on your study    │
│     check-ins.                             │
└────────────────────────────────────────────┘
```

### Visual design

| Section | Color | Icon | Background |
|---------|-------|------|------------|
| **Needs practice** (§NEW) | Orange-600 text, orange-100 bg | Dumbbell (or Target) | Orange-50 border |
| **Needs review** | Amber-600 text, amber-100 bg | RefreshCw | Amber-50 border |
| **Recently remembered** | Green-600 text, green-100 bg | CheckCircle | Green-50 border |

### Behavior

- **"Needs practice" items** appear in BOTH the "Needs practice" section AND in "Needs review" (they are also `needs_review = true`). Alternatively, they appear ONLY in "Needs practice" and are excluded from "Needs review" to avoid duplication. **Recommendation:** Show them only in "Needs practice" — the "Needs review" section becomes "other needs-review items." This keeps the layout compact and prevents confusion.

- **"Getting stronger" label:** Not shown as a separate section in v1. May appear as a subtle micro-label on remembered items (e.g. a green arrow-up icon with tooltip "Getting stronger — 2 recent remembers").

- **"Ready to revisit" label:** Not shown in v1. Deferred.

### Empty states per section

- If no items are weak spots but some need review: show only "Needs review" and "Recently remembered"
- If no items need review at all: show the existing empty state

---

## Testing Plan

### Backend tests (Delta J)

| Test | What it validates |
|------|-------------------|
| `test_weak_spot_below_threshold` | 1 `needs_review`, no `remembered` → not weak |
| `test_weak_spot_meets_threshold` | 2 `needs_review`, no `remembered` → weak |
| `test_weak_spot_recent_remembered` | 3 `needs_review` + later 1 `remembered` → not weak |
| `test_weak_spot_cooldown_active` | 2 `needs_review`, last one 30 min ago → not weak (cooldown) |
| `test_weak_spot_cooldown_expired` | 2 `needs_review`, last one 90 min ago → weak |
| `test_weak_spot_mixed_order` | `remembered` → `needs_review` → `needs_review` → weak |
| `test_weak_spot_zero_events` | No events → not weak |
| `test_weak_spot_only_remembered` | 5 `remembered`, 0 `needs_review` → not weak |
| `test_weak_spot_api_response` | Review queue returns `is_weak_spot` field correctly |

### Frontend tests (Delta K)

| Test | What it validates |
|------|-------------------|
| `renders needs-practice section` | Weak-spot items appear in a separate section |
| `renders correct icon for needs-practice` | Dumbbell / orange icon shown |
| `excludes weak spots from needs-review section` | No duplication |
| `empty needs-practice section not shown` | When no items qualify, section is hidden |
| `label text matches locale key` | `vault.needsPractice` is used |
| `locale parity` | All new keys exist in all locale files |
| `loading state` | Works during query loading |
| `error state` | Graceful degradation (no weak-spot data = fall back to normal display) |

---

## Privacy/Security Notes

1. **No AI processing of learner content.** The heuristic is deterministic — pure rules over event counts. No leaf content is sent to any AI service.
2. **No personal data exported.** Weak-spot data is as private as the study events themselves (stored in local SurrealDB).
3. **No cross-learner aggregation.** Vault is single-learner in this phase. Weak spots are never compared across users.
4. **No logging of "weak spot" as a separate privacy-sensitive event.** It's a computed field, not a stored event type.

---

## Rollout Plan

### Phase: Delta J — Backend heuristic fields

1. Add weak-spot computation to `GET /api/study/review-queue` response (query-time from events)
2. Add `is_weak_spot` and `weak_spot_label` to `ReviewQueueItem` Pydantic model
3. Add `consecutive_needs_review` field to `leaf_review_state` schema (optional optimization)
4. Add unit tests (9 tests as outlined above)
5. Validate: `python -m pytest tests/test_study_api.py`
6. Do not change any frontend code
7. Commit

### Phase: Delta K — Frontend display

1. Add "Needs practice" section to `ReviewQueue.tsx`
2. Add new locale keys:
   - `vault.needsPractice` — "Needs practice"
   - `vault.needsPracticeDesc` — "Items you've struggled with most. Prioritise these."
   - `vault.needsPracticeSingle` — "1 leaf needs extra practice."
   - `vault.needsPracticeMultiple` — "{count} leaves need extra practice."
3. Add orange theme tokens (if not already existing)
4. Update display logic: weak-spot items shown in needs-practice section only, excluded from needs-review
5. Add/update tests
6. Validate: `cd frontend && npm test` + `npm run build`
7. Commit

### Phase: Delta L — Study-session lifecycle cleanup (optional)

1. If weak-spot computation reveals that abandoned sessions create noise (e.g. events from abandoned sessions still count toward weak-spot threshold), add session-completion signal
2. Consider filtering events from `abandoned` sessions out of the weak-spot calculation
3. This is a minor tuning pass, not a required phase

### Later: Teacher dashboard aggregation

1. Aggregated weak-spot counts across topics/tags
2. Charts showing improvement over time
3. All deferred — not part of the v1 design

---

## Failure/Rollback Plan

| Failure mode | Impact | Recovery |
|-------------|--------|----------|
| Query-time derivation is too slow (>500ms for 20-item queue) | Perceived sluggishness on vault dashboard | Add `consecutive_needs_review` field to `leaf_review_state` (Delta J field) |
| Heuristic misclassifies items (false positives) | Learner sees items in "Needs practice" that they don't find difficult | Adjust thresholds (raise from 2→3, increase cooldown from 1h→4h). No data migration needed. |
| Frontend section breaks under edge case | Display glitch in ReviewQueue | The needs-practice section is additive — removing it degrades to the Delta H display (needs-review + remembered) |
| SurrealDB query timeout on event aggregation | Timed-out leaves show no weak-spot data | Catch the error per-item; treat as "not weak" (safe fallback). Learner sees normal review queue. |
| New schema field causes migration failure | API startup fails | Rollback: remove the field from the migration. Query-time derivation still works. |

**Rollback command (if denormalised field was added):**
```surql
-- Migration 16_down or a hotfix
REMOVE FIELD consecutive_needs_review ON TABLE leaf_review_state;
```

No data loss — events remain in `leaf_review_event`.

---

## Implementation Slices Summary

| Slice | Scope | Files changed | Validation |
|-------|-------|--------------|------------|
| **Delta J** | Backend heuristic + API response | `api/models.py` (ReviewQueueItem), `api/routers/study.py` (computation), `tests/test_study_api.py` | `pytest` backend tests |
| **Delta K** | ReviewQueue display | `ReviewQueue.tsx`, locale files, optionally theme tokens | `npm test` + `npm run build` |
| **Delta L** | Optional session-lifecycle tuning | `vault_core/domain/study.py` or `api/routers/study.py` | `pytest` + `npm test` |
| Later | Teacher dashboard | Separate design, not in scope here | TBD |

---

## Open Questions

1. **Should weak spots be recalculated on every review queue read, or cached?**  
   *Current answer:* Recalculated on every read for v1. If slow, cache with a 30s–60s stale time.

2. **Should `review_count` in `leaf_review_state` be used instead of counting events?**  
   *No.* `review_count` counts ALL terminal events (needs_review + remembered). We need distinct counts per event type.

3. **Should weak spots be scoped to a notebook or global?**  
   *Notebook-scoped.* A leaf belongs to one notebook; weak spots are per-notebook by definition.

4. **Should `abandoned` session events be excluded?**  
   *Deferred to Delta L.* In v1, all events count regardless of session status. It's unlikely to significantly affect heuristic quality.

5. **Should the cooldown be configurable?**  
   *Not for v1.* Hard-code 1 hour. If feedback shows it's wrong, adjust and redeploy. Configurability adds complexity before the heuristic is validated.

---

## Appendix: Quick Reference

### Heuristic formula (pseudocode)

```
def is_weak_spot(leaf_id: str) -> tuple[bool, str | None]:
    events = get_events_for_leaf(leaf_id)
    
    needs_review_events = [e for e in events if e.event_type == "needs_review"]
    remembered_events = [e for e in events if e.event_type == "remembered"]
    
    if len(needs_review_events) < 2:
        return False, None  # Not enough data
    
    last_needs_review = max(e.created for e in needs_review_events)
    last_remembered = max((e.created for e in remembered_events), default=None)
    
    # If the most recent remembered is after the most recent needs_review
    if last_remembered and last_remembered > last_needs_review:
        return False, None  # Improved since last struggle
    
    # Cooldown: needs_review must be at least 1 hour old
    if (now - last_needs_review) < timedelta(hours=1):
        return False, None  # Still in cooldown
    
    return True, "needs_practice"
```

### Locale keys needed (Delta K)

```
"vault.needsPractice": "Needs practice",
"vault.needsPracticeDesc": "Items you've struggled with most. Prioritise these.",
"vault.needsPracticeSingle": "1 leaf needs extra practice.",
"vault.needsPracticeMultiple": "{count} leaves need extra practice.",
"vault.gettingStronger": "Getting stronger",
"vault.gettingStrongerTooltip": "You've remembered this leaf consistently."
```

### New Pydantic fields (Delta J)

```python
class ReviewQueueItem(BaseModel):
    note_id: str
    notebook_id: Optional[str] = None
    title: Optional[str] = None
    content_preview: Optional[str] = None
    needs_review: bool = False
    last_reviewed: Optional[str] = None
    review_count: int = 0
    # New in Delta J:
    is_weak_spot: bool = False
    weak_spot_label: Optional[Literal["needs_practice", "getting_stronger"]] = None
```
