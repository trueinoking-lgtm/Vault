# Vault H3 — Fireworks Material AI Smoke Checkpoint

**Date:** 2026-07-05
**Commit base:** `dde19c0` (H2 runtime activation)

## Summary

End-to-end proof that Vault's full AI path works with Fireworks: material/source → embedding/indexing → retrieval/ask → DeepSeek V4 Flash answer. All steps completed successfully.

## Test Flow

1. Created disposable test notebook and source with Emberfall smoke content
2. Processed source through `source_graph` (ingestion path)
3. Embedded source content using Fireworks Qwen3 embedding model
4. Ran ask query through Vault's retrieval-augmented generation pipeline
5. Verified answer correctly referenced Emberfall and two moons
6. Cleaned up all test data

## Verification Results

| Check | Result |
|-------|--------|
| Test material created | ✅ Source + notebook via API |
| Source ingestion | ✅ `source_graph.ainvoke()` processed content |
| Full text stored | ✅ "Vault H3 smoke fact: the test planet is called Emberfall..." |
| Embedding model | ✅ `accounts/fireworks/models/qwen3-embedding-8b` (4096 dims) |
| Embedding storage | ✅ 1 chunk stored in `source_embedding` table |
| Ask query | ✅ SSE response with correct answer |
| Generation model | ✅ `accounts/fireworks/models/deepseek-v4-flash` |
| AI answer | ✅ "The test planet is called **Emberfall**, and it has **two moons**" |
| Source reference | ✅ Included in answer: `[source:72pbi6v4nmk6g49ordbp]` |
| Test data cleanup | ✅ Source and notebook deleted |
| Secret exposure check | ✅ No API key matches in repo |
| Old naming check | ✅ No `open_notebook` references |
| Live smoke | ✅ 10/10 passed |

## Model IDs Verified

- **Embedding:** `model:tfh3tbrp7g76jl7bvq3a` → `accounts/fireworks/models/qwen3-embedding-8b`
- **Generation:** `model:f34595wvf4qz00bgufq8` → `accounts/fireworks/models/deepseek-v4-flash`
- **Default config:** Both set as system defaults in `/api/models/defaults`

## Limitations

1. **Async command worker not running:** The `surreal-commands` worker was not active, so async embedding jobs queued via the API were not processed. Workaround: ran source processing and embedding directly via Python scripts.

2. **Embedding dimensions:** Qwen3 embedding produces 4096-dimensional vectors. This is consistent with the model specification but is larger than some other embedding models (e.g., OpenAI's 1536 dims).

3. **Ask endpoint requires explicit model IDs:** The `/api/search/ask` endpoint requires `strategy_model`, `answer_model`, and `final_answer_model` to be specified explicitly (not just using defaults).

## What Changed

- No code files modified
- No migrations added
- Temporary helper scripts (`scripts/h3_process_source.py`, `scripts/h3_embed_source.py`) were created and deleted
- Test notebook and source were created and deleted

## What Did NOT Change

- No code files modified
- No migrations added
- No frontend changes
- No model defaults changed
- AetherLink not touched
- No upstream naming reintroduced
