# Fireworks AI Setup Guide

> **Scope:** Configure Vault to use Fireworks AI as the default provider for text generation and embeddings.
> **Applies to:** Vault deployments using the Fireworks bootstrap system.

---

## Overview

Vault can bootstrap Fireworks AI as the default AI provider automatically when `FIREWORKS_API_KEY` is set. This eliminates manual UI configuration for basic AI features.

**What gets auto-configured:**
- Text generation (chat, source chat, ask/search, transformations, insights) → `deepseek-v4-flash`
- Embeddings (vector search, material embeddings) → `qwen3-embedding-8b`

**What does NOT happen:**
- TTS/STT are not configured (Fireworks does not offer these)
- Existing user-customized defaults are NOT overwritten (unless forced)
- No secrets are committed to git or exposed in API responses

---

## Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FIREWORKS_API_KEY` | **Yes** | Your Fireworks AI API key (starts with `fw_`) |
| `VAULT_DEFAULT_CHAT_MODEL` | No | Override the default generation model |
| `VAULT_DEFAULT_EMBEDDING_MODEL` | No | Override the default embedding model |
| `VAULT_FORCE_FIREWORKS_DEFAULTS` | No | Force overwrite existing defaults (`true`/`false`) |

### Setting the API Key

Add to your `.env` file:

```bash
# Fireworks AI
FIREWORKS_API_KEY=fw_your_api_key_here
```

**⚠️ NEVER commit `FIREWORKS_API_KEY` to git.** The `.env` file should be in `.gitignore`.

---

## Text Generation vs Embeddings

### Text Generation (DeepSeek V4 Flash)

Used for:
- Chat conversations
- Source chat (ask questions about uploaded content)
- Ask/Search synthesis (retrieve relevant sources → generate answer)
- Material insights (auto-generated summaries of uploaded content)
- Transformations (custom content transformations)
- Note generation

**Model:** `accounts/fireworks/models/deepseek-v4-flash`
**Base URL:** `https://api.fireworks.ai/inference/v1`

### Embeddings (Qwen3 Embedding 8B)

Used for:
- Vector search (semantic similarity across all content)
- Source embeddings (embedding uploaded materials for search)
- Note embeddings (embedding notes for search)

**Model:** `accounts/fireworks/models/qwen3-embedding-8b`
**Base URL:** `https://api.fireworks.ai/inference/v1`

> **Important:** Embeddings and text generation use **different models**. DeepSeek V4 Flash is a language model and is NOT suitable for embedding tasks. The bootstrap correctly routes each to the appropriate model.

---

## How the Bootstrap Works

On API startup, if `FIREWORKS_API_KEY` is set:

1. **Credential creation:** A `fireworks` credential record is created in the database with your API key (encrypted at rest)
2. **Model registration:** Two models are registered:
   - `accounts/fireworks/models/deepseek-v4-flash` (type: `language`)
   - `accounts/fireworks/models/qwen3-embedding-8b` (type: `embedding`)
3. **Default seeding:** `DefaultModels` is updated to point to these models

### Idempotency

The bootstrap is idempotent — running it multiple times is safe:
- Existing credentials are reused (not duplicated)
- Existing models are reused (not duplicated)
- Existing user defaults are preserved (unless forced)

---

## Forcing Defaults

By default, the bootstrap will NOT overwrite user-customized defaults. If a user has already configured their preferred models in Settings → Models, the bootstrap respects those choices.

To force the bootstrap to overwrite existing defaults:

```bash
VAULT_FORCE_FIREWORKS_DEFAULTS=true
```

This is useful for:
- Fresh deployments where you want Fireworks as the guaranteed default
- Resetting to Fireworks after experimenting with other providers

---

## Testing the Connection

### Via API

```bash
# Check provider availability
curl -s http://localhost:5055/api/models/providers | python3 -m json.tool

# Check default models
curl -s http://localhost:5055/api/models/defaults | python3 -m json.tool

# Check credential status
curl -s http://localhost:5055/api/credentials/status | python3 -m json.tool
```

### Via UI

1. Go to **Settings → Models** in the Vault UI
2. Verify `Fireworks (auto-bootstrapped)` credential appears
3. Verify default models are set to Fireworks models
4. Click **Test** on the credential to verify the API key works

### Via Smoke Test

```bash
bash scripts/smoke_vault_live.sh https://your-vault-url
```

---

## Fireworks API Key Security

### What Vault Does

- API keys are encrypted at rest in SurrealDB using `VAULT_ENCRYPTION_KEY`
- API keys are NEVER included in API responses (only `has_api_key: true/false`)
- The bootstrap reads the key from the environment variable only
- The key is stored in the database credential record, not in any file

### What You Must Do

- **NEVER commit `FIREWORKS_API_KEY` to git**
- Keep `.env` in `.gitignore`
- Use a strong `VAULT_ENCRYPTION_KEY` for credential encryption
- Rotate your Fireworks API key if it's ever exposed

### Verification

The following endpoints will NEVER expose your API key:
- `GET /api/health` — returns `{"status": "ok", "service": "vault-api"}`
- `GET /api/models/defaults` — returns model IDs only, no keys
- `GET /api/credentials/status` — returns `has_api_key` boolean only
- `GET /api/credentials` — returns `CredentialResponse` without `api_key` field

---

## Troubleshooting

### Bootstrap not running

Check that `FIREWORKS_API_KEY` is set in your `.env` file:

```bash
grep FIREWORKS_API_KEY .env
```

### Bootstrap skips with "no FIREWORKS_API_KEY"

The env var is not set or is empty. Ensure it's in your `.env` file and the API was restarted.

### Defaults not overwritten

Set `VAULT_FORCE_FIREWORKS_DEFAULTS=true` to force:

```bash
# In .env
VAULT_FORCE_FIREWORKS_DEFAULTS=true

# Restart the API
```

### Connection test fails

1. Verify your API key is valid at [Fireworks AI Console](https://fireworks.ai)
2. Check that the base URL is `https://api.fireworks.ai/inference/v1`
3. Verify your account has credits/quota remaining

---

## Model Override Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VAULT_DEFAULT_CHAT_MODEL` | `accounts/fireworks/models/deepseek-v4-flash` | Default text generation model |
| `VAULT_DEFAULT_FAST_MODEL` | Same as chat model | Default fast/cheap model slot |
| `VAULT_DEFAULT_LONG_CONTEXT_MODEL` | Same as chat model | Default large context model slot |
| `VAULT_DEFAULT_EMBEDDING_MODEL` | `accounts/fireworks/models/qwen3-embedding-8b` | Default embedding model |

---

## Architecture Note

Fireworks is not a native provider in the Esperanto AI abstraction library. Vault maps `fireworks` to the `openai_compatible` adapter internally, since Fireworks provides a fully OpenAI-compatible API. This mapping is transparent — the UI and database show `fireworks` as the provider name.

**Provider mapping chain:**
```
DB: provider="fireworks"
  → ModelManager.get_model() detects "fireworks"
  → Maps to Esperanto provider="openai-compatible"
  → Sets base_url="https://api.fireworks.ai/inference/v1"
  → Passes FIREWORKS_API_KEY as api_key
```

---

> **Last updated:** 2026-07-05
> **Applies to tag:** `vault-g3-stable` and later
