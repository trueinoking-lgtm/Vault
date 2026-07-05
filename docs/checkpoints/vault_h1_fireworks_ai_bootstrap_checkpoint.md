# Vault H1 Checkpoint — Fireworks AI Bootstrap

> **Date:** 2026-07-05
> **Tag:** `vault-g3-stable` (H1 applied on top)
> **H1 feature commit:** `03150d9`
> **H1 tests/docs commit:** `8e44625`
> **G4 docs commit:** `8d8005f`

---

## Summary

Vault now boots with Fireworks AI as the default provider when `FIREWORKS_API_KEY` is set. The bootstrap is idempotent, respects existing user defaults, and exposes zero secrets through API responses.

---

## Generation Model

| Field | Value |
|-------|-------|
| Model | `accounts/fireworks/models/deepseek-v4-flash` |
| Provider | `fireworks` (mapped to `openai_compatible` internally) |
| Base URL | `https://api.fireworks.ai/inference/v1` |
| Used for | Chat, source chat, ask/search, transformations, insights, notes |

## Embedding Model

| Field | Value |
|-------|-------|
| Model | `accounts/fireworks/models/qwen3-embedding-8b` |
| Provider | `fireworks` |
| Used for | Vector search, semantic similarity, material embeddings |

> **Critical:** Embeddings use a **different model** from text generation. DeepSeek V4 Flash is NOT used for embeddings.

---

## Provider Architecture

Fireworks is **not** a native Esperanto provider. Vault maps it to the `openai_compatible` adapter:

```
DB: provider="fireworks"
  → ModelManager detects "fireworks"
  → Maps to Esperanto provider="openai-compatible"
  → Sets base_url="https://api.fireworks.ai/inference/v1"
  → Passes FIREWORKS_API_KEY as api_key
```

User-facing display shows `fireworks` as the provider name.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FIREWORKS_API_KEY` | **Yes** | — | Fireworks API key (starts with `fw_`) |
| `VAULT_DEFAULT_CHAT_MODEL` | No | `accounts/fireworks/models/deepseek-v4-flash` | Override generation model |
| `VAULT_DEFAULT_EMBEDDING_MODEL` | No | `accounts/fireworks/models/qwen3-embedding-8b` | Override embedding model |
| `VAULT_DEFAULT_FAST_MODEL` | No | Same as chat | Override fast model slot |
| `VAULT_DEFAULT_LONG_CONTEXT_MODEL` | No | Same as chat | Override large context slot |
| `VAULT_FORCE_FIREWORKS_DEFAULTS` | No | `false` | Force overwrite existing defaults |

---

## Force Flag Behavior

- **`VAULT_FORCE_FIREWORKS_DEFAULTS=false`** (default): Bootstrap only seeds defaults if no user defaults exist
- **`VAULT_FORCE_FIREWORKS_DEFAULTS=true`**: Bootstrap overwrites any existing defaults with Fireworks models

---

## Defaults Preservation

The bootstrap is **idempotent**:
- Existing credentials are reused (not duplicated)
- Existing models are reused (not duplicated)
- Existing user defaults are **preserved** unless force flag is set
- If `FIREWORKS_API_KEY` is not set, bootstrap skips silently

---

## Tests

| Suite | Count | Status |
|-------|-------|--------|
| `test_fireworks_bootstrap.py` | 14 | ✅ All pass |
| Full backend (pytest) | 381 | ✅ 381/381 |
| Frontend (npm test) | 81 | ✅ 81/81 |
| Frontend (npm build) | — | ✅ Passed |

**Test coverage:**
- Bootstrap creates credential + models from env
- Bootstrap skips without API key
- Embeddings use `qwen3-embedding-8b`, not DeepSeek chat
- Existing defaults not overwritten (force=false)
- Force flag overwrites existing defaults
- Health endpoint leaks no secrets
- Model defaults endpoint leaks no secrets
- Credential status endpoint leaks no secrets
- Credential response hides API key
- Provider mapping (key_provider, discovery, connection_tester, availability)

---

## Runtime Status

| Check | Result |
|-------|--------|
| `FIREWORKS_API_KEY` in `.env` | **Not set** |
| Bootstrap behavior | Skipped gracefully (expected) |
| `/api/health` | ✅ `{"status":"ok","service":"vault-api"}` |
| `/api/models/defaults` | ✅ Shows Fireworks model IDs, no secrets |
| `/api/models` (fireworks) | ✅ Both models registered (language + embedding) |
| `/api/credentials/status` | ✅ No API keys exposed |
| Live smoke | ✅ 10/10 checks pass |

> **Note:** Fireworks models and defaults exist in SurrealDB from a prior test run. Without `FIREWORKS_API_KEY`, the bootstrap will skip on restart, but existing DB records persist.

---

## Static Asset Fix

**Root cause:** `.next/standalone/.next/static/` was empty — Next.js standalone build doesn't include static files automatically.

**Fix:** Copied `.next/static/` into `.next/standalone/.next/static/` and restarted the frontend server.

**Result:** Static asset check now returns HTTP 200. Full smoke: 10/10.

---

## Secrets / Privacy Guarantees

- API keys encrypted at rest via `VAULT_ENCRYPTION_KEY` (Fernet)
- API keys **never** appear in API responses (only `has_api_key: boolean`)
- `FIREWORKS_API_KEY` read from env only, never committed to git
- `.env` is in `.gitignore`
- Health endpoint returns `{"status":"ok","service":"vault-api"}` — no provider info
- Model defaults return model IDs only — no keys
- Credential status returns `has_api_key` boolean — no keys
- Credential response uses `CredentialResponse` which excludes `api_key` field

---

## Files Changed (H1)

| File | Change |
|------|--------|
| `vault_core/ai/fireworks_bootstrap.py` | **New** — startup bootstrap module |
| `vault_core/ai/models.py` | Fireworks→openai_compatible provider mapping |
| `vault_core/ai/key_provider.py` | Added `fireworks` to PROVIDER_CONFIG |
| `vault_core/ai/model_discovery.py` | Added Fireworks discovery function |
| `vault_core/ai/connection_tester.py` | Added Fireworks test model |
| `api/routers/models.py` | Added to provider availability, priority |
| `api/credentials_service.py` | Added to env config, modalities, test, discover |
| `api/main.py` | Wired bootstrap into lifespan |
| `.env.example` | Added Fireworks placeholder vars |
| `tests/test_fireworks_bootstrap.py` | **New** — 14-backend test suite |
| `docs/operations/vault_fireworks_ai_setup.md` | **New** — setup guide |

---

## Files Changed (G4)

| File | Change |
|------|--------|
| `docs/operations/vault_backup_restore_runbook.md` | **New** — 701-line runbook |
| `scripts/backup_vault_surrealdb.sh` | **New** — hot export script |
| `scripts/restore_vault_surrealdb.sh` | **New** — restore with guards |
| `scripts/README.md` | Updated with backup/restore docs |

---

> **Last updated:** 2026-07-05
