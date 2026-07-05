# Vault H4 — AI Runtime Integration Hardening Checkpoint

**Date:** 2026-07-05
**Previous checkpoint:** H3 (`8b57e01`)

---

## Summary

Hardened the AI runtime path so Vault uses configured Fireworks defaults without requiring explicit model IDs, and documented the async command worker runtime.

---

## Part A — Default Model Resolution

### What Changed

The `/search/ask` and `/search/ask/simple` endpoints now accept **optional** model IDs. When omitted, they fall back to the configured default chat model.

#### Files Modified
- **`api/models.py`** — `AskRequest` model fields `strategy_model`, `answer_model`, `final_answer_model` changed from `str` (required) to `Optional[str]` (optional, defaults to `None`)
- **`api/routers/search.py`** — Added `_resolve_ask_model()` helper function that:
  1. Uses explicit model ID if provided
  2. Falls back to `DefaultModels.default_chat_model` if omitted
  3. Returns clear 422 error if no model can be resolved (not 500)
  - Updated both `ask_knowledge_base` and `ask_knowledge_base_simple` endpoints

#### Default Resolution Behavior
```
Request includes model IDs → Use them (unchanged behavior)
Request omits model IDs   → Resolve from DefaultModels.default_chat_model
No defaults configured     → 422 with clear error message
Invalid model ID           → 422 with "model not found" message
```

#### Frontend Impact
- **None** — The frontend already resolves defaults client-side in `search/page.tsx` (lines 104-114) before calling `sendAsk()`. The backend change makes the API more flexible for direct API callers and automation.

---

## Part B — Async Command Worker Runtime

### Worker Status

The `surreal-commands` background worker is **required** for async jobs but has no systemd service by default. Without it:
- Source embedding jobs queue but never process
- Sources stay stuck at `CommandStatus.NEW`
- Vector search returns no results for new content

### What Was Added

1. **`deploy/systemd/vault-worker.service`** — Systemd service template for the worker
   - Runs `surreal-commands-worker --import-modules commands`
   - Depends on SurrealDB and Vault backend
   - Includes security hardening and journald logging

2. **`docs/operations/vault_release_runbook.md`** — Updated with:
   - Worker added to runtime layout table
   - Worker process verification command
   - Worker restart/status commands
   - Worker log location

3. **`docs/operations/vault_fireworks_ai_setup.md`** — Added "Worker Required for Embeddings" section explaining:
   - Why the worker is needed
   - What happens without it
   - How to start it (development and production)

---

## Tests Added

**`tests/test_ask_defaults.py`** — 6 tests covering:
1. Omitted models resolve to default chat model (streaming endpoint)
2. Explicit model IDs override defaults
3. Invalid explicit model returns 422
4. No defaults and no models returns 422 (not 500)
5. Omitted models resolve to default (simple endpoint)
6. No defaults returns 422 on simple endpoint

**Test Results:**
- Backend: 398 passed (up from 392 before H4)
- Frontend: 81 passed (unchanged)

---

## Validation Results

| Check | Result |
|-------|--------|
| Backend tests | ✅ 398/398 passed |
| Frontend tests | ✅ 81/81 passed |
| Frontend build | ✅ Clean |
| Live smoke | ✅ 10/10 passed |
| Scrub | ✅ 0 matches |
| Secrets check | ✅ No FIREWORKS_API_KEY exposure |
| Git status | Clean (after commits) |

---

## Endpoints Updated

| Endpoint | Change |
|----------|--------|
| `POST /search/ask` | Model fields now optional with default resolution |
| `POST /search/ask/simple` | Model fields now optional with default resolution |

---

## Files Changed

| File | Type | Description |
|------|------|-------------|
| `api/models.py` | Modified | AskRequest fields made optional |
| `api/routers/search.py` | Modified | Added `_resolve_ask_model()` helper |
| `deploy/systemd/vault-worker.service` | Created | Worker systemd service template |
| `docs/operations/vault_release_runbook.md` | Modified | Added worker docs |
| `docs/operations/vault_fireworks_ai_setup.md` | Modified | Added worker requirement section |
| `tests/test_ask_defaults.py` | Created | 6 tests for default model resolution |

---

## Remaining Limitations

1. **Worker not auto-started** — The worker service template exists but must be manually installed. Production deployments should install it via `sudo cp deploy/systemd/vault-worker.service /etc/systemd/system/`.

2. **No worker health check endpoint** — The worker process has no HTTP health endpoint. Monitoring relies on process presence (`pgrep`) or journald logs.

3. **Ask endpoint still requires all three model slots** — Even though they're optional individually, the endpoint needs at least a default chat model configured. A future improvement could allow per-slot defaults (strategy vs answer vs final answer).
