# Vaultification Plan

> Goal: transform `/root/vault-vault` from donor-brand Vault into Vault’s knowledge engine without breaking the verified working runtime.

## Current grounded inventory

### Backend routers actually present
- `api/routers/notebooks.py`
- `api/routers/sources.py`
- `api/routers/notes.py`
- `api/routers/insights.py`
- `api/routers/context.py`
- `api/routers/search.py`
- `api/routers/chat.py`
- `api/routers/source_chat.py`
- `api/routers/transformations.py`
- `api/routers/podcasts.py`
- `api/routers/models.py`
- `api/routers/settings.py`
- `api/routers/credentials.py`
- `api/routers/embedding.py`
- `api/routers/embedding_rebuild.py`
- `api/routers/commands.py`
- plus auth/config/languages/episode_profiles/speaker_profiles

### Frontend routes actually present
- `frontend/src/app/(dashboard)/notebooks/page.tsx`
- `frontend/src/app/(dashboard)/notebooks/[id]/page.tsx`
- `frontend/src/app/(dashboard)/sources/page.tsx`
- `frontend/src/app/(dashboard)/search/page.tsx`
- `frontend/src/app/(dashboard)/podcasts/page.tsx`
- `frontend/src/app/(dashboard)/transformations/page.tsx`
- `frontend/src/app/(dashboard)/settings/page.tsx`
- `frontend/src/app/(dashboard)/advanced/page.tsx`
- `frontend/src/app/(auth)/login/page.tsx`

### Core donor engine seams already identified
- FastAPI app registration in `api/main.py`
- sidebar/navigation in `frontend/src/components/layout/AppSidebar.tsx`
- notebook workspace in `frontend/src/app/(dashboard)/notebooks/[id]/page.tsx`
- ingestion job in `commands/source_commands.py`
- donor namespace package in `vault_core/`

---

## 1. Vault concepts that should survive unchanged

These are already good Vault infrastructure and should stay intact in phase 1.

### Survive unchanged
1. **Source ingestion pipeline**
   - Keep `commands/source_commands.py::process_source_command`
   - Keep `vault_core.graphs.source.source_graph`
   - Rationale: this is already the correct fetch → extract → process → persist backbone for Vault knowledge ingestion.

2. **Async command/job architecture**
   - Keep `surreal_commands` usage and retry strategy.
   - Rationale: Vault needs durable background jobs for ingestion, transforms, audio, and future teaching workflows.

3. **Embedding pipeline and rebuild commands**
   - Keep `commands/embedding_commands.py` and rebuild flow.
   - Rationale: Vault memory search depends on this.

4. **FastAPI + service + router layering**
   - Keep the current app shape in `api/main.py`, routers, and service files.
   - Rationale: clean enough to rebrand and extend without rewrite.

5. **SurrealDB-backed persistence and repository abstraction**
   - Keep the DB layer initially.
   - Rationale: already verified working; defer storage replacement until a Vault-native schema demands it.

6. **Context assembly pattern**
   - Keep notebook-context style assembly of sources + notes + chat context.
   - Rationale: this is directly reusable as Vault’s knowledge-context assembly.

7. **Model/credentials/settings infrastructure**
   - Keep the provider-agnostic settings/model registry.
   - Rationale: Vault will need the same model routing controls.

8. **Search + ask + source-chat capabilities**
   - Keep current query stack and repurpose it under Vault naming.

### Phase-1 rule
Do **not** rewrite ingestion, embeddings, command retries, or storage internals during the first Vaultification step.

---

## 2. Concepts that should be renamed into Vault language

### Rename map

| Donor term | Vault term | Why |
|---|---|---|
| Vault | Vault | product identity |
| Notebook | Vault | top-level knowledge container |
| Source | Source | already correct; keep initially |
| Note | Artifact | umbrella Vault output type |
| Insight | Intelligence | clearer Vault outcome language |
| Transformation | Pipeline | better reflects reusable processing logic |
| Podcast | Briefing | future home for audio/text brief outputs |
| Ask and Search | Query Vault | clearer core action |
| Advanced | Workshop | power-user / engine controls |

### Important nuance
- **Source** can remain `Source` in phase 1 to avoid unnecessary churn.
- **Note** should become **Artifact** at the product level, with typed subforms later:
  - `artifact`
  - `lesson`
  - `brief`
  - `intelligence`

---

## 3. UI routes/pages: keep, remove, or rewrite

### Keep and rename/reframe

| Current route | Action | Vault target |
|---|---|---|
| `/notebooks` | keep, rename | `/vaults` |
| `/notebooks/[id]` | keep, rename | `/vaults/[id]` |
| `/sources` | keep | `/sources` initially, maybe later `/inbox` or `/evidence` |
| `/search` | keep, relabel | `/query` |
| `/podcasts` | keep, repurpose | `/briefings` |
| `/transformations` | keep, relabel | `/pipelines` |
| `/settings` | keep | `/settings` |
| `/advanced` | keep, relabel | `/workshop` |
| `/login` | keep temporarily | unchanged until auth strategy changes |

### Rewrite priority
1. **Highest priority rewrite**: `/notebooks` → Vault list page
2. **Highest value workspace rewrite**: `/notebooks/[id]` → Vault workspace
3. **Search page relabel/reframe**: Query Vault
4. **Podcasts page repurpose**: Briefings / audio outputs

### Remove
- Remove nothing in phase 1.
- Old routes should become aliases or redirects during transition.

### Sidebar transformation target
Current sidebar sections in `AppSidebar.tsx`:
- Collect
- Process
- Create
- Manage

Vault target could become:
- Ingest
- Vaults
- Outputs
- Control

But **do not** do full nav surgery in the first commit.

---

## 4. Which backend APIs should become Vault-native APIs

### API alias plan
Do not break working clients. Add Vault-native aliases first, deprecate donor paths later.

| Current API | Vault-native API | Strategy |
|---|---|---|
| `/api/notebooks` | `/api/vaults` | add alias router first |
| `/api/notes` | `/api/artifacts` | add alias router first |
| `/api/insights` | `/api/intelligence` | add alias router first |
| `/api/transformations` | `/api/pipelines` | add alias router first |
| `/api/podcasts` | `/api/briefings` | add alias router first |
| `/api/search` | `/api/query` | add alias router first |
| `/api/sources` | `/api/sources` | keep path initially |
| `/api/context` | `/api/context` or `/api/vaults/{id}/context` | extend later |
| `/api/chat` | `/api/chat` | keep |
| `/api/source_chat` flow | source-aware chat under Vault context | keep first |

### Concrete backend strategy
Phase 2 should add new routers that call the existing services, instead of renaming the current routers in place.

Example:
- new `api/routers/vaults.py` calling notebook service/model logic
- new `api/routers/artifacts.py` calling notes service/model logic

This keeps the donor endpoints alive while moving the product surface to Vault language.

---

## 5. Where source ingestion connects to Vault memory/knowledge

### Current grounded flow
`commands/source_commands.py::process_source_command` does:
1. load transformations
2. load source record
3. write command reference
4. invoke `source_graph`
5. gather resulting insights
6. return processing metrics

### Vault connection plan
This command becomes the backbone of Vault’s knowledge ingestion.

### Mapping
- **Source record** = canonical ingested knowledge item
- **full_text + metadata** = Vault knowledge payload
- **embedded chunks** = Vault searchable memory substrate
- **source↔vault association** = membership of knowledge inside a Vault container
- **insights generated from source** = first-pass intelligence derived from ingested knowledge

### Where to attach Vault-native memory
Attach at the seam **after `source_graph.ainvoke(...)` completes** and before the output returns.

That is the correct place to later:
- emit Vault memory events
- fan out to teaching pipelines
- generate derived artifacts
- schedule audio brief production

### Practical phase sequencing
- Phase 1: keep ingestion behavior unchanged
- Phase 2: add Vault event emission / aliasing around source completion
- Phase 3: attach teaching and briefing jobs downstream of source completion

---

## 6. Where notes become Vault artifacts, lessons, briefs, or intelligence outputs

### Current donor shape
Notes are retrieved in the notebook workspace and treated as notebook-associated text entities.

### Vaultification target
Turn donor `Note` into a **Vault Artifact** umbrella concept.

### Proposed subtype model
Add a typed discriminator at the API/domain boundary:
- `artifact`
- `lesson`
- `brief`
- `intelligence`

### Mapping
| Current donor object | Vault meaning |
|---|---|
| manual note | artifact |
| transformation-generated note | lesson or intelligence |
| summarization output | brief |
| extracted analytical output | intelligence |

### Attachment point
The first clean attachment point is:
- notes service / notes API schemas
- then notebook workspace UI filters

### Smallest non-breaking schema step later
Add optional field:
- `artifact_type: str | null`

Default behavior:
- existing notes with null remain renderable
- new writes default to `artifact`

This gives Vault language without breaking existing data.

---

## 7. Where future Kokoro TTS and Whisper.cpp STT hooks should attach

### Kokoro TTS attachment
Best donor seam: the existing podcast/voice generation surface.

#### Attach here
- backend router family currently under `api/routers/podcasts.py`
- services in `api/podcast_service.py`
- command layer in `commands/podcast_commands.py`

### Vaultification target
Repurpose this area into **Briefings** / **Audio Briefings**.

#### Future structure
- `api/routers/briefings.py`
- `api/briefing_service.py`
- `commands/briefing_commands.py`
- `vault/voice/tts.py` (Kokoro integration layer)

#### What Kokoro should do
Input:
- lesson/brief/intelligence text

Output:
- audio file + metadata attached to a Vault artifact/briefing

### Whisper.cpp STT attachment
Best donor seam: source creation + ingestion pipeline.

#### Attach here
- `api/routers/sources.py`
- `api/sources_service.py`
- the upload/text/link source workflow
- `process_source_command`

### Future source type extension
Add source kinds such as:
- `audio`
- `voice_memo`

### Whisper flow
1. user uploads audio
2. Whisper.cpp transcribes audio
3. transcript becomes source text
4. existing source pipeline continues normally
5. transcript is chunked, embedded, and attached to Vault memory

### Summary
- **Kokoro TTS** attaches downstream of generated outputs
- **Whisper.cpp STT** attaches upstream of source ingestion

---

## 8. Where the teaching/skill layer should attach

Vault’s teaching layer should not be bolted onto raw UI first. It should attach to reusable knowledge outputs and pipelines.

### Best attachment seams
1. **Pipelines (current transformations)**
   - current donor transformations are already reusable text-processing recipes
   - these are the natural seed for a skill/teaching system

2. **Artifacts / intelligence outputs**
   - lessons and intelligence derived from sources are the correct teaching substrate

3. **Query layer**
   - the ask/search stack is where a teaching layer becomes interactive

### Proposed first-class Vault addition later
Create:
- `api/routers/skills.py`
- `api/skills_service.py`
- `vault/skills/`

### Role of the skill layer
- package reusable reasoning or teaching templates
- convert ingested source material into reusable lessons
- let Vault answer not only from source text, but from refined learned artifacts

### Clean conceptual relationship
- source = evidence
- intelligence/artifact = derived output
- skill = reusable teaching/processing behavior
- query = access point

### First attachment milestone
The first real skill-layer connection should likely be:
- transformation/pipeline → produce typed lesson artifact
- then expose skill-like reuse over that pipeline

---

## 9. The smallest first code change that starts transforming Vault into Vault

### Recommendation
The first commit should be **small, visible, non-breaking, and identity-setting**.

### First recommended commit
**Commit title:**
`vault: introduce Vault identity and publish transformation plan`

### What the first commit should do
1. Add `VAULTIFICATION_PLAN.md` to the repo root
2. Change frontend brand strings from `Vault` to `Vault`
3. Change FastAPI OpenAPI metadata from `Vault API` to `Vault API`
4. Change only the most obvious label:
   - sidebar/app brand text
   - do **not** rename routes yet
   - do **not** rename storage tables yet
   - do **not** rename every notebook reference yet

### Why this is the right first change
- it starts transformation immediately
- it does not risk the verified ingestion/runtime path
- it makes the donor/final-product distinction explicit
- it gives every later commit a clear target identity

### First commit file set
#### Edit
- `api/main.py`
- `frontend/src/app/layout.tsx`
- `frontend/src/components/layout/AppSidebar.tsx`
- possibly translation files if `common.appName` / nav labels are i18n-backed

#### Add
- `VAULTIFICATION_PLAN.md`

### What **not** to do in the first commit
- do not rename the Python package `vault_core/`
- do not rename DB tables
- do not rename every `notebook_id` field
- do not replace routes yet
- do not add Kokoro or Whisper hooks yet
- do not alter ingestion behavior yet

---

## Recommended migration phases after the first commit

### Phase 1 — Identity and framing
- publish plan
- rebrand app/API strings to Vault
- keep donor internals intact

### Phase 2 — Surface aliases
- add `/vaults`, `/artifacts`, `/pipelines`, `/briefings`, `/query` routes and API aliases
- keep old donor paths as compatibility aliases

### Phase 3 — Typed outputs
- add `artifact_type`
- turn notes into artifacts/lessons/briefs/intelligence outputs

### Phase 4 — Audio and teaching seams
- attach Whisper.cpp to audio ingestion
- attach Kokoro to briefing generation
- add skills/teaching layer

### Phase 5 — Deep donor namespace cleanup
- progressively replace donor names in code internals only after the Vault surface is stable

---

## Exact first recommended commit message

```text
vault: introduce Vault identity and publish transformation plan

- add Vaultification plan to repo root
- rebrand frontend app identity from Vault to Vault
- rebrand FastAPI OpenAPI metadata from Vault API to Vault API
- preserve all working donor internals, routes, and data model names for now
```

---

## Verification for that first commit

Only lightweight verification is needed:
1. frontend still starts on the same port/runtime already in use
2. backend OpenAPI title reflects `Vault API`
3. frontend shell/header reflects `Vault`
4. no ingestion/storage/runtime logic changed

---

## Final stance

The donor codebase has already proven itself as working infrastructure. The correct next move is **not** more Vault testing. The correct move is:

1. establish Vault identity
2. add Vault-native language at the product surface
3. preserve the working ingestion/memory engine underneath
4. progressively replace donor concepts only where Vault truly needs a stronger abstraction
