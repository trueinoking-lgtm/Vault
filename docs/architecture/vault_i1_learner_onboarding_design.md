# Vault I1 — Learner First-Study Onboarding Design

**Date:** 2026-07-05
**Status:** Design doc — no code changes
**Scope:** Design only. No implementation, no migrations, no behavior changes.

---

## 1. Current Learner Routes and Behavior

| Route | Page | What it does |
|-------|------|-------------|
| `/vault` | Dashboard | Landing page after login. Shows first-run onboarding, quick actions, ContinueStudying, RecentMaterials, RecentLeaves, ReviewQueue, LearningPanel, LearnerAssignmentsSection. |
| `/sources` | Materials | Upload files, paste URLs, add text. Source creation triggers async processing (extract → embed → ready). |
| `/notebooks` | Libraries | List of notebooks (libraries). Each library groups materials. |
| `/notebooks/[id]` | Library detail | Three-column view: Sources, Notes/Leaves, Chat. Study session tracking. |
| `/search` | Ask Vault | Vector search + AI synthesis. Ask questions across all libraries. |
| `/settings` | Settings | API keys, model config. Not learner-facing in practice. |

### Existing First-Run Behavior

The vault dashboard already has two onboarding states:

1. **No libraries** → "Start your first library" card with CTA to create one
2. **Has libraries, no materials** → "Add your first material" card with CTA to /sources

These are simple prompt cards, not a guided flow. Once the user creates a library and adds one material, the onboarding disappears and the full dashboard renders.

### Existing Study Infrastructure

- **StudySession** — groups review events into a contiguous study period per notebook
- **LeafReviewEvent** — append-only log: `opened`, `check_started`, `remembered`, `needs_review`, `listened`
- **LeafReviewState** — denormalized current state per leaf: `needs_review`, `review_count`, `last_event_type`
- **Weak-spot heuristic** — 2+ `needs_review` events, no `remembered` after latest, 1-hour cooldown → label `needs_practice`
- **ReviewQueue component** — shows three sections: needs practice, needs review, recently remembered
- **Source status mapping** — `BackendSourceStatus` → `LearnerSourceStatus`: preparing → building → ready → failed

### Current Quick Actions on Dashboard

| Action | Icon | Destination |
|--------|------|-------------|
| Add material | FileText | /sources |
| Create leaf | BookOpen | /sources |
| Ask Vault | MessageSquare | /search |
| Review learning memory | Brain | /notebooks |

---

## 2. Problem Statement

Vault is a powerful AI research tool, but a first-time learner arrives to a blank dashboard with no indication of what to do first. The current onboarding is two static cards that disappear after the first library + material are created. After that:

- **No guided sequence** — the learner doesn't know whether to study, ask, or review next
- **Processing is invisible** — after uploading material, the learner sees no indication that embedding is happening or when it's ready
- **Ask is disconnected** — the "Ask Vault" quick action goes to /search, which is a generic search page, not "ask this material"
- **Review is undiscoverable** — the ReviewQueue exists but only appears after the learner has already studied and marked items
- **No "start studying" CTA** — the learner must navigate to /notebooks/[id] manually to begin studying leaves
- **Settings exposure** — the /settings page shows model config, API keys, and provider details that are irrelevant to learners

A learner should be able to go from "I just arrived" to "I studied my first material and asked it a question" in under 60 seconds, without touching any settings.

---

## 3. Target First-Study Flow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Create library                                          │
│     "What are you studying?" → type name → Create           │
├─────────────────────────────────────────────────────────────┤
│  2. Add material                                            │
│     Upload file / paste URL / paste text → Add              │
├─────────────────────────────────────────────────────────────┤
│  3. Wait for processing                                     │
│     "Preparing your material..." [progress indicator]       │
│     "Building your study cards..." [progress indicator]     │
│     "Ready to study!" [green check]                         │
├─────────────────────────────────────────────────────────────┤
│  4. Start studying                                          │
│     "Start studying" CTA → opens library detail view        │
│     Shows leaves/cards generated from the material          │
├─────────────────────────────────────────────────────────────┤
│  5. Study a card                                            │
│     Read leaf → "I remember this" / "I need to review"      │
│     Action logged to LeafReviewEvent                        │
├─────────────────────────────────────────────────────────────┤
│  6. Ask about the material                                  │
│     "Ask about this material" CTA → Ask with material scope │
│     Answer cites the source                                 │
├─────────────────────────────────────────────────────────────┤
│  7. Review later                                            │
│     Dashboard shows "Review what I missed"                  │
│     Items with needs_review appear in ReviewQueue           │
│     Weak spots (2+ needs_review, no remembered) highlighted │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principle

Each step should be **one click or less** from the previous step. The learner never leaves the guided flow until they choose to.

---

## 4. Vocabulary Recommendation

The i18n keys already use learner-friendly vocabulary in most places. This section recommends consistent terminology across the entire product.

| Current term | Recommended term | Rationale |
|-------------|-----------------|-----------|
| Notebook | **Library** | Already used in i18n. A library groups related materials. |
| Source | **Material** | Already used in i18n. A material is something you study. |
| Note / Leaf | **Study card** (UI) / **Leaf** (internal) | "Study card" is more intuitive for learners. Keep "leaf" as the internal/domain term. |
| Search | **Ask Vault** | Already used in quick actions. The action is asking a question, not searching. |
| Chat | **Ask about this material** | Scoped to a specific material. More intuitive than generic "chat". |
| Transformation | **Generate insight** | Only shown to advanced users. Keep as-is for now. |
| Podcasts | **Listen** | Only shown to advanced users. Keep as-is for now. |

### Implementation Note

Do NOT rename routes or database tables in I-series. Vocabulary changes are UI-layer only (i18n keys, component labels, page titles). Route aliases (e.g., /library instead of /notebooks) are a future phase.

---

## 5. UX Surfaces

### 5.1 First-Run Empty State (Dashboard)

When the learner has no libraries:

```
┌──────────────────────────────────────────────────┐
│  Welcome to Vault                                 │
│                                                   │
│  Your personal study space. Add a library and     │
│  some material, and Vault will help you learn.    │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │  What are you studying?                      │  │
│  │  [________________________]                  │  │
│  │  [Create your first library]                 │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  Already have material? [Add it now →]            │
└──────────────────────────────────────────────────┘
```

### 5.2 Guided Checklist (After First Library Created)

Once the first library exists, show a progressive checklist instead of random quick actions:

```
┌──────────────────────────────────────────────────┐
│  Get started with [Library Name]                  │
│                                                   │
│  ✅ Create a library                              │
│  ○  Add your first material                       │
│  ○  Start studying                                │
│  ○  Ask a question                                │
│  ○  Review what you learned                       │
│                                                   │
│  [Add material →]                                 │
└──────────────────────────────────────────────────┘
```

The checklist progress persists until all 5 items are checked. After that, the dashboard shows the normal layout (ContinueStudying, RecentMaterials, ReviewQueue, etc.).

**Checklist item resolution:**
- ✅ Create a library — `notebooks.length > 0`
- ✅ Add material — `sources.length > 0` (in any library)
- ✅ Start studying — `study_session.count > 0` for any library
- ✅ Ask a question — `chat_session.count > 0` (or search/ask used)
- ✅ Review — `leaf_review_event.count > 0`

### 5.3 Continue Studying Panel

Already exists (`ContinueStudying.tsx`). Enhance with:
- Show the most recent library with unread/needs-review count
- "Continue" button goes directly to the library detail view
- If there are needs-review items, show "Review 3 items you missed" badge

### 5.4 Material Processing Status

After uploading material, show inline status on the dashboard and in the library view:

```
┌──────────────────────────────────────────────────┐
│  📄 Introduction to Biology                      │
│  ⏳ Preparing your material...                    │
│  ░░░░░░░░░░░░ 50%                                 │
└──────────────────────────────────────────────────┘

↓ (after processing completes)

┌──────────────────────────────────────────────────┐
│  📄 Introduction to Biology                      │
│  ✅ Ready to study                                │
│  [Start studying →]  [Ask about this →]          │
└──────────────────────────────────────────────────┘
```

**Status mapping** (already exists in `source-status.ts`):
- `new` / `queued` → "Preparing your material..."
- `running` → "Building your study cards..."
- `completed` → "Ready to study"
- `failed` → "Something went wrong. Try again."

### 5.5 "Ask This Material" CTA

On each material card (in library detail view and recent materials):

```
┌──────────────────────────────────────────────────┐
│  📄 Introduction to Biology                      │
│  ✅ Ready · 12 study cards                       │
│                                                   │
│  [Ask about this]  [Study]  [...]                │
└──────────────────────────────────────────────────┘
```

"Ask about this" opens the chat/ask view scoped to this specific material (existing source chat endpoint).

### 5.6 "Review What I Missed" Action

On the dashboard, when there are needs-review items:

```
┌──────────────────────────────────────────────────┐
│  📌 Review what you missed                       │
│  3 items need review · 1 weak spot               │
│  [Review now →]                                   │
└──────────────────────────────────────────────────┘
```

This is the existing `ReviewQueue` component, surfaced more prominently.

---

## 6. AI Behavior

- **No model picker for learners** — defaults are resolved from `DefaultModels` (H4 infrastructure)
- **No prompt/settings complexity** — learners never see model names, providers, or configuration
- **Ask uses existing flow** — Fireworks DeepSeek V4 Flash for generation, Qwen3 for embedding
- **Source chat is scoped** — "Ask about this material" uses the existing `/api/sources/{id}/chat` endpoint
- **Search/ask is global** — "Ask Vault" uses `/api/search/ask` across all libraries
- **No new AI features** — I-series is purely UX/onboarding, not AI capability

---

## 7. Worker/Processing Behavior

- **Processing is already async** — source creation queues a `process_source` command, worker picks it up
- **Status polling exists** — `useSourceStatus` auto-refetches every 2s while status is `new`/`queued`/`running`
- **Learner status mapping exists** — `mapBackendSourceStatusToLearnerStatus()` converts to preparing/building/ready/failed
- **No worker internals exposed** — learners see "Preparing" / "Building" / "Ready", not "CommandStatus.NEW" or "embedding chunks"
- **Processing timing** — typical source takes 2-5 seconds for extraction + embedding (tested in H3/H5)

### What to Show During Processing

| Stage | Learner message | Duration |
|-------|----------------|----------|
| Upload accepted | "Material added" | Instant |
| Extraction running | "Reading your material..." | 1-3s |
| Embedding running | "Building study cards..." | 1-3s |
| Complete | "Ready to study!" | — |
| Failed | "Something went wrong" + retry button | — |

---

## 8. Review Memory Behavior

The review system is already implemented in `vault_core/domain/study.py`. The I-series connects it to the onboarding flow.

### Event Types

| Event | When | Effect |
|-------|------|--------|
| `opened` | Learner opens a study card | Logged, no state change |
| `check_started` | Learner begins reviewing | Logged, no state change |
| `remembered` | Learner marks "I remember this" | `needs_review = false` in LeafReviewState |
| `needs_review` | Learner marks "I need to review this" | `needs_review = true` in LeafReviewState |
| `listened` | Learner listens to a podcast leaf | Logged, no state change |

### Review States

| State | Meaning | Dashboard appearance |
|-------|---------|---------------------|
| `needs_review` = true, not weak spot | Recently marked for review | Yellow dot in ReviewQueue |
| `needs_review` = true, is weak spot | 2+ consecutive needs_review, no improvement | Red dot, "Needs practice" label |
| `needs_review` = false | Remembered or never marked | Green check, "Recently remembered" |

### Weak-Spot Heuristic

A leaf is labeled "needs practice" when:
1. At least 2 `needs_review` events logged
2. No `remembered` event after the most recent `needs_review`
3. The most recent `needs_review` is at least 1 hour old (cooldown)

This prevents spam-clicking "needs review" from flooding the queue.

### Review Flow Integration

After studying a material, the dashboard should show:
- "You studied 8 cards. 2 need review." with a "Review now" CTA
- The ReviewQueue component surfaces these items
- Weak spots are highlighted at the top

---

## 9. Privacy

- **No teacher exposure of private reflection text** — teachers cannot see what a learner wrote in study card responses or chat
- **No grades/rankings/AI diagnosis** — the review system is private to the learner
- **No analytics dashboards** — no "learner progress" visible to teachers (E-series scope)
- **Study sessions are per-user** — `StudySession` has `user_id` field, queries filter by user
- **Leaf review events are per-user** — `LeafReviewEvent` has `user_id` field
- **Review state is per-user** — `LeafReviewState` has `user_id` field

This matches the existing privacy model. I-series does not change any access control.

---

## 10. Non-Goals

The following are explicitly out of scope for I-series:

| Item | Why |
|------|-----|
| ZimLearnGraph code | Design after learner flow is cleaner (Z1 phase) |
| Quiz engine | Not yet — study cards are mark-remembered/needs-review, not quiz questions |
| Tenant filtering rewrite | Existing model is sufficient |
| Route renames | `/notebooks` stays `/notebooks`, not `/library`. Alias phase later |
| New AI features | I-series is UX only |
| Model picker for learners | Defaults resolve automatically (H4) |
| Grading/assessment | Not in scope |
| Spaced repetition scheduling | Current weak-spot heuristic is sufficient for now |
| Mobile app | Web-only for now |

---

## 11. Proposed Implementation Slices

### I2 — Learner Dashboard Empty-State/Checklist

**Goal:** Replace the two-card onboarding with a persistent guided checklist.

**Changes:**
- Modify `frontend/src/app/(dashboard)/vault/page.tsx` to show checklist
- Create `frontend/src/components/vault/OnboardingChecklist.tsx`
- Add i18n keys for checklist items
- Checklist shows progress: library created → material added → studied → asked → reviewed
- Checklist persists until all items complete, then hides

**Files:**
- `frontend/src/components/vault/OnboardingChecklist.tsx` (new)
- `frontend/src/app/(dashboard)/vault/page.tsx` (modify)
- All 14 locale files (add i18n keys)

**Dependencies:** None. Can start immediately.

**Estimated complexity:** Small. ~200 lines new component, ~30 lines page modification.

---

### I3 — Material Upload/Process Status Polish

**Goal:** Make material processing visible and intuitive.

**Changes:**
- Enhance material cards to show processing status with learner-friendly labels
- Add inline progress indicator during processing
- Show "Ready to study" with action CTAs when complete
- Wire up `useSourceStatus` polling in material cards on the dashboard

**Files:**
- `frontend/src/components/vault/RecentMaterials.tsx` (modify)
- `frontend/src/components/sources/SourceCard.tsx` or equivalent (modify)
- i18n keys for processing states

**Dependencies:** None. Can start immediately.

**Estimated complexity:** Small. Status mapping already exists in `source-status.ts`.

---

### I4 — "Ask This Material" and "Start Studying" CTAs

**Goal:** Add prominent actions on material cards and library views.

**Changes:**
- Add "Ask about this" button on material cards → opens source chat
- Add "Start studying" button on library cards → opens library detail view
- Add "Review what I missed" banner on dashboard when needs-review items exist
- Enhance `ContinueStudying` panel with review count badge

**Files:**
- Material card components (modify)
- `frontend/src/components/vault/ContinueStudying.tsx` (modify)
- `frontend/src/components/vault/ReviewQueue.tsx` (modify for prominence)
- i18n keys for new CTAs

**Dependencies:** I2 (checklist should be in place first).

**Estimated complexity:** Medium. ~150 lines changes across 3-4 components.

---

### I5 — Vocabulary/Route Alias Polish

**Goal:** Make UI labels consistently learner-friendly without changing routes.

**Changes:**
- Audit all i18n keys for learner-facing labels
- Ensure "Library" is used everywhere instead of "Notebook" in UI
- Ensure "Material" is used everywhere instead of "Source" in UI
- Ensure "Study card" is used in UI, "leaf" only in internal/debug contexts
- Page titles: "My Libraries" instead of "Notebooks", "My Materials" instead of "Sources"

**Files:**
- All 14 locale files (update keys)
- Page components (update titles if not using i18n)

**Dependencies:** Can run in parallel with I2-I4.

**Estimated complexity:** Small. Mostly i18n key updates.

---

### Z1 — ZimLearnGraph Design (Future)

**Goal:** Design the learning graph system after the learner flow is clean.

**Dependencies:** I2-I5 complete. Learner flow validated with real users.

**Scope:** Not designed yet. Will include:
- Spaced repetition scheduling
- Knowledge graph visualization
- Adaptive study paths
- Progress analytics (private to learner)

---

## 12. Acceptance Criteria for I-Series

| Criterion | How to verify |
|-----------|--------------|
| First-time learner understands what to do in <30 seconds | User testing: 3 users, time to first study action |
| Uploaded material visibly becomes ready | Source status polling shows preparing → building → ready |
| Learner can ask/study/review without model settings | No navigation to /settings required in normal flow |
| Checklist guides through first 5 actions | Checklist component renders and tracks progress |
| Processing status is learner-friendly | No "CommandStatus.NEW" or technical terms visible |
| Review queue surfaces needs-review items | ReviewQueue shows items after learner marks them |
| No teacher exposure of private text | Permission tests pass, no new data sharing |
| No secrets exposed | API keys not visible in learner flow |
| Backend tests pass | 398/398 (no code changes in I-series) |
| Frontend tests pass | 81/81 (plus new tests for checklist) |
| Scrub clean | 0 matches for old upstream naming |

---

## 13. Implementation Order

```
I2 (checklist)  ──┐
                   ├──→ I4 (CTAs) ──→ Z1 (ZimLearnGraph design)
I3 (status)    ──┘
                   └──→ I5 (vocabulary)  [parallel]
```

- I2 and I3 can start in parallel
- I4 depends on I2 (checklist provides the scaffold)
- I5 can run in parallel with everything
- Z1 waits for I2-I5 to be complete and validated

---

> **Last updated:** 2026-07-05
> **Applies to:** Vault I-series learner onboarding
