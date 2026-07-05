# Vault H2 — Fireworks Runtime Activation Checkpoint

**Date:** 2026-07-05
**Commit base:** `c2b4b66` (E2.1 classroom assignment foundation)

## Summary

Fireworks AI provider activated at runtime by setting `FIREWORKS_API_KEY` in the server-local `.env` and updating the stored credential in SurrealDB. No code changes were made.

## Verification Results

| Check | Result |
|-------|--------|
| FIREWORKS_API_KEY set | ✅ Yes (in `.env`, not committed) |
| Credential updated | ✅ `credential:zwk4dv722z8775i5zo75` — valid key stored encrypted |
| Credential test | ✅ `success: true` — 7 models available |
| Generation smoke | ✅ DeepSeek V4 Flash responded correctly |
| Embedding smoke | ⏭️ Skipped (endpoint requires item_id/item_type, not a simple text API) |
| Health check | ✅ `{"status":"ok","service":"vault-api"}` |
| Model defaults | ✅ Fireworks DeepSeek V4 Flash as default chat model |
| Model list | ✅ Fireworks models visible (language + embedding) |
| Credentials status | ✅ `fireworks: true`, source: `database` |
| Live smoke | ✅ 10/10 passed |
| Secret exposure check | ✅ No matches for API key in repo |
| AetherLink untouched | ✅ Port 3002 |
| Vault backend | ✅ Port 5055 |
| Vault frontend | ✅ Port 3003 |

## Generation Smoke Detail

- **Session created:** `chat_session:cult7mostmrab6xs8yhs`
- **Prompt:** "Reply with exactly: Vault Fireworks OK"
- **Response:** `Vault Fireworks OK`
- **Model:** `accounts/fireworks/models/deepseek-v4-flash`

## What Changed

1. `.env` — added `FIREWORKS_API_KEY=<set, not exposed>` (not committed)
2. SurrealDB credential `credential:zwk4dv722z8775i5zo75` — API key updated via PUT `/api/credentials/{id}`
3. `.next/standalone/` — static assets re-copied (build artifact, not committed)

## What Did NOT Change

- No code files modified
- No migrations added
- No frontend changes
- No `.env` committed
- AetherLink not touched
- No upstream naming reintroduced

## Notes

- The Fireworks credential was originally bootstrapped with an invalid/test key during H1. The valid key was provided and applied via the credentials API.
- The embedding smoke was skipped because the `/api/embed` endpoint requires an existing `item_id` and `item_type` — it is not a standalone text embedding API. The Qwen3 embedding model is configured and will be used when sources/notes are embedded.
- Static assets required re-copying to standalone directory after backend restart (same pattern as G4 fix).
