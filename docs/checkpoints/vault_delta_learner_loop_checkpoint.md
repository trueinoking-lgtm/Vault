# Vault Delta Learner Loop Checkpoint

**Checkpoint date:** 2026-07-04
**Phase:** Delta (learner study loop shell)
**Base commit (Delta D):** `9c654fa`
**Polish commit (Delta Acceptance):** `5d932a9`

---

## Summary

Vault now has a frontend-complete learner loop shell that takes a learner from their first landing all the way through creating a library, adding materials, observing friendly processing states, opening a study hub, reading and interacting with leaves, doing local retrieval practice, and seeing review suggestions on their dashboard. Owner/operator routes have been extracted behind a cookie gate.

This is a **UI/product shell** — everything works in the browser but nothing is persisted to a backend review/study model. It is demoable end-to-end and suitable for user feedback, but significant backend and persistence work remains before it is production-ready as an LMS.

---

## Product State

### What is now demoable

- Learner dashboard at `/vault` with quick actions, recent materials, recent leaves, learning progress panel, and review queue
- First-library onboarding flow (empty-state → create library)
- Material(s) creation through `/sources` (URL, file upload, text paste)
- Learner-friendly material processing states (Preparing → Building study memory → Ready to study / Preparation failed)
- Study hub for ready materials (Read material, Ask a question, Create leaf, Listen)
- Leaf study cards with structured sections (What this leaf covers, Key points, Source material link)
- Local "Check yourself" retrieval practice on each leaf
- Dashboard review queue showing suggested recent leaves
- Owner route separation with cookie-based gate (`/owner`, `/owner/ai`, `/owner/settings`, `/owner/runtime`)
- Learner-appropriate vocabulary throughout (Libraries, Materials, Leaves, Study)

### What remains intentionally not built

See [Non-goals / Not yet built](#non-goals--not-yet-built).

---

## Demo Path

A manual demo script that exercises the full learner loop:

```text
1. Open /
   → Redirects to /notebooks or /vault depending on proxy.

2. Go to /vault
   → Learner dashboard loads: quick actions, recent materials, recent leaves,
     learning progress, review queue.
   → If no libraries exist, shows "Start your first library" onboarding.

3. Create first library
   → From sidebar (+) or quick action "Create Library".
   → Library appears in dashboard and sidebar.

4. Add material through /sources
   → Navigate to /sources (sidebar: "Materials").
   → Click "Add material" (+).
   → Upload a file, paste a URL, or enter text.
   → Material appears with processing badge.

5. Observe material status labels
   → Processing → "Preparing your material" (blue)
   → Building → "Building study memory" (blue)
   → Ready → "Ready to study" (green)
   → Failed → "Preparation failed" (red, with retry)
   → Each status has friendly description text.

6. Open ready material
   → Click on a "Ready to study" material card.
   → Source detail view opens with status alert showing "Ready to study".

7. Use study hub CTAs
   → Study hub card shows four actions:
     • "Read material" — scrolls to content tab
     • "Ask a question" — opens chat panel
     • "Create leaf" — links to library for leaf creation
     • "Listen" — TTS button reads the material aloud
   → Try each one.

8. Create / open a leaf
   → From library page, create a leaf tied to the material.
   → Leaf renders as a study card with structured sections:
     • What this leaf covers (derived from first heading)
     • Key points (section previews)
     • Source material link
   → Plain-text leaves also render safely.

9. Use Check yourself
   → On any non-memory leaf, expand "Check yourself".
   → Write a short answer, click "I remembered this" or "I need to review this".
   → Feedback appears. Reset with "Try again".
   → Note: This is component-local only — nothing is saved.

10. Return to /vault
    → Dashboard shows recent leaves.
    → Review queue lists recent leaves as "Suggested review".
    → Disclosure note: "Review history is not saved yet."

11. Verify /owner is separate and gated
    → Navigate to /owner (or click admin/settings/api-keys legacy URLs).
    → Without owner cookie, redirects to /login?owner=1.
    → After owner gate, owner dashboard with AI configuration,
      processing settings, and runtime tools is available.
    → Learner sidebar and command palette have no owner/admin/API-key links.
```

---

## Feature Inventory

### Learner Shell Cleanup (Alpha — `6cb123d`)

- Learner-appropriate copy throughout (Libraries instead of Notebooks, Materials instead of Sources, Leaves instead of Notes, Vault instead of Notebook LM)
- Dashboard: `/vault` with quick actions, recent materials, recent leaves, learning progress
- Sidebar navigation: Vault, Materials, Libraries, Study
- Command palette: navigation, library list, create actions, theme toggle

### Owner Shell + Owner Gate (Beta A/B — `6a88a24`, `91421714`, `9870cde`)

- Owner dashboard at `/owner` with AI providers, processing settings, runtime tools
- Cookie-based owner gate (`vault-owner-access` cookie) via proxy middleware
- Legacy routes (`/admin`, `/admin/api-keys`, `/settings/api-keys`) redirect to canonical owner paths
- Owner sidebar with dedicated navigation (Overview, AI Providers, Processing, Runtime Tools)
- Owner access documentation

### First-Library Onboarding (Gamma A — `9e9eeca`)

- Empty-state on `/vault` with "Start your first library" prompt
- "Create your first library" CTA
- "No libraries yet. Create one to get started." empty state
- Sidebar create menu (Material / Library)

### Material Onboarding (Gamma B — `5c109e6`)

- `/sources` page with "Add material" button
- Multi-source creation (URL, file upload, text paste)
- Batch creation support
- Library association during creation

### Material Status Mapping (Gamma B — `5c109e6`)

- Backend processing statuses mapped to learner-friendly labels:
  - `new`/`queued`/`running` → "Preparing your material"
  - `building` → "Building study memory"
  - `completed` → "Ready to study"
  - `failed` → "Preparation failed"
- Centralized in `frontend/src/lib/source-status.ts`
- Status alert on source detail with contextual CTAs
- Progress bar during processing
- Retry button on failure

### Material Study Hub (Delta A — `6aaff2f`)

- `SourceDetailContent.tsx`: study-ready alert with CTAs
- Study hub card (shown only for ready materials):
  - **Read material** — scrolls to content tab
  - **Ask a question** — opens chat panel (if available)
  - **Create leaf** — links to primary notebook
  - **Listen** — TTS button
- Green-themed card with graduation cap icon
- "Study this material" header with description

### Leaf Study Cards (Delta B — `1e18c64`)

- `LeafStudyCard.tsx` component rendering structured leaf sections:
  - **What this leaf covers** — derived from first markdown heading
  - **Key points** — up to 3 section previews with "+N more" overflow
  - **Source material link** — extracted from `## Source Material` section
- Plain-text fallback (no headings) with content preview
- AI/Bot type badge, human/created-by badge
- Dropdown actions: Teach this leaf, Explain simply, Quiz me (callbacks), Delete
- TTS button in footer
- Memory leaf special handling (Review this Memory action)

### Local Check-Yourself Flow (Delta C — `36f2e54`)

- Expandable "Check yourself" section on leaf study cards
- Prompt: "Can you explain this in your own words?"
- Textarea for self-answer
- Two outcome buttons: "I remembered this" / "I need to review this"
- Feedback message after submission
- "Try again" to reset and re-attempt
- **Component-local only** — no persistence, no scoring, no weak-spot tracking
- 9 locale keys across all languages for the flow

### Review Queue Shell (Delta D — `9c654fa`)

- `ReviewQueue.tsx` component on `/vault` dashboard
- Empty state: "Nothing to review yet" with "Go to Libraries" CTA
- When leaves exist: amber info banner ("Suggested review"), list of recent leaves with type icon, title, badge, relative timestamp, "Open Library" CTA
- Honest disclosure: "Review history is not saved yet."
- Reuses existing `useRecentNotes()` hook — no new data source
- **No persistence, no scoring, no weak-spot tracking**

### Acceptance Polish (Delta Acceptance — `5d932a9`)

- Normalized learner-facing CTA casing to sentence case across all 14 locales
- Fixed hardcoded casing in SourceCard (Teach this material), LeafStudyCard (Teach this leaf, Review this memory), AddSourceButton (Add material)
- 17 files changed, 50 lines — casing consistency only
- All 57 tests passing, build clean

---

## Non-goals / Not Yet Built

The following are explicitly out of scope for this checkpoint and remain for future phases:

- **Full RBAC** — only a coarse owner/learner split exists; no roles for teacher, school_admin
- **Real accounts/roles** — no multi-tenant identity, no registration flow
- **Schools/tenancy** — no multi-school data isolation
- **Teacher dashboard** — no educator-facing analytics or classroom management
- **Persisted study sessions** — no backend model for study sessions
- **Persisted review history** — no database records for review attempts
- **Weak spots** — no algorithmic identification of learner gaps
- **Quizzes/scoring** — no automated question generation or grading
- **Spaced repetition scheduler** — no SM-2 or similar algorithm
- **Progress analytics** — no charts, streaks, or completion tracking
- **Production-grade security** — owner gate is cookie-based, not JWT/OAuth
- **AI runtime observability** — no cost tracking, token usage, or model performance monitoring
- **Mobile responsive polish** — desktop-first, minimal mobile optimization

---

## Risks and Caveats

1. **Owner gate is stronger than before but is not full RBAC.** The cookie-based middleware (`proxy.ts`) blocks unauthenticated access to `/owner*` and legacy `/admin*`/`/settings/api-keys` routes, but there is no server-side authorization, no role hierarchy, and no per-resource permissions. A learner who obtains the cookie can access all owner surfaces.

2. **Review queue uses recent leaves as suggestions, not saved weak spots.** The "Suggested review" label is honest, but the data source (`useRecentNotes()`) shows the most recent 5 notes regardless of whether the learner found them difficult. There is no review-persistence model yet.

3. **Check-yourself is component-local only.** All `useState` — answers and feedback disappear on page navigation. There is no localStorage, no API call, no database write. Learners who refresh the page lose their check-yourself state.

4. **Internal route names differ from learner-facing labels.** The URL paths `/notebooks` and `/sources` still exist internally, even though the learner UI calls them "Libraries" and "Materials". This is transparent to learners but relevant for anyone extending the app.

5. **No backend data model changes for schools/classes/progress.** The SurrealDB schema has not been extended with student, class, enrollment, session, or progress records. Any persistence work will require schema migrations (handled by `AsyncMigrationManager`).

6. **Locale coverage is English-first.** All 13 non-English locales exist and pass the key-completeness test, but most strings remain in English. True translation is an ongoing effort.

---

## Recommended Next Phase Options

### Option A: Deploy / Demo Verification
Deploy the current stack (SurrealDB + API + Frontend) to a staging environment and run the demo path against real data. Verify that the full loop works under realistic conditions (PDF uploads, URL extractions, concurrent users). Document any gaps.

### Option B: Backend Design Doc for Study-Session / Review Persistence
Design the data model and API surface for:
- Study sessions (start/end time, materials studied, leaves reviewed)
- Review attempts (leaf reference, outcome, timestamp)
- Weak-spot tracking (per-leaf confidence score, review interval)
- Learner progress (materials completed, leaves created, reviews done)
This should produce a schema migration plan and API endpoint specification before any implementation begins.

### Option C: Owner Runtime Observability
Build the owner runtime surface with:
- Job queue monitoring (surreal-commands status, retry, cancel)
- AI provider health checks and fallback status
- Token usage and cost dashboards
- System resource monitoring (memory, disk, DB connection pool)
- Log viewer / recent error feed

### Option D: Mobile Polish
Audit and fix responsive layout issues across the learner loop:
- `/vault` dashboard card grid on narrow viewports
- Source detail tabs and sidebar on mobile
- Leaf study card overflow and text wrapping
- Review queue list item layout
- Navigation sidebar collapse behavior

---

## Validation

| Check | Result |
|-------|--------|
| `git status --short` | Clean |
| `npm test` | **57/57 passed** (9 test files: locales, AppSidebar, ConfirmDialog, ChatColumn, useTranslation, useModalManager, sourceContext, ownerAccess, config) |
| `npm run build` | **Passed clean** |
| Final commit | `5d932a9` — `vault: polish learner study loop` |
| Working tree after final commit | Clean |

---

## Known Commits (Chronological Order)

| Commit | Phase | Description |
|--------|-------|-------------|
| `6cb123d` | Alpha | Learner UX cleanup — copy, vocabulary, dashboard |
| `6a88a24` | Beta A | Owner shell extraction — owner routes, sidebar |
| `a74c9e9` | — | Locale cleanup — key completeness, i18n structure |
| `91421714` | Beta B | Owner route hardening — cookie gate via proxy middleware |
| `9870cde` | — | Owner access documentation |
| `9e9eeca` | Gamma A | Library onboarding — empty states, first-library flow |
| `5c109e6` | Gamma B | Material onboarding and learner-friendly status mapping |
| `6aaff2f` | Delta A | Material study hub — read, ask, create leaf, listen |
| `1e18c64` | Delta B | Leaf study cards — structured sections, plain-text fallback |
| `36f2e54` | Delta C | Local check-yourself retrieval practice flow |
| `9c654fa` | Delta D | Review queue shell — suggested review, honest disclosure |
| `5d932a9` | — | Acceptance polish — casing normalization across 14 locales |
