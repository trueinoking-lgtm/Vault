# Vault H5 — AI Worker Service Activation Checkpoint

**Date:** 2026-07-05
**Previous checkpoint:** H4 (AI runtime integration hardening)

---

## Summary

Installed and verified the Vault AI worker as a production systemd service so material embedding/indexing continues to work after process restarts and reboots.

## Worker Service Status

| Property | Value |
|----------|-------|
| Service file | `/etc/systemd/system/vault-worker.service` |
| Template source | `deploy/systemd/vault-worker.service` |
| Status | **active (running)** |
| Enabled | **yes** (starts on boot) |
| PID | 2034276 (after restart) |

## Worker Command

```
/usr/local/lib/hermes-agent/venv/bin/uv run \
    --env-file /root/vault-open-notebook/.env \
    surreal-commands-worker --import-modules commands
```

## Environment Handling

- `.env` at `/root/vault-open-notebook/.env` contains: `VAULT_ENCRYPTION_KEY`, `SURREAL_URL`, `SURREAL_USER`, `SURREAL_PASSWORD`, `SURREAL_NAMESPACE`, `SURREAL_DATABASE`, `FIREWORKS_API_KEY`
- Worker reads env via `--env-file` flag (uv passes to subprocess)
- No hardcoded credentials in service file
- `.env` is NOT committed to git

## Service Management Commands

```bash
# Status
sudo systemctl status vault-worker.service

# Restart
sudo systemctl restart vault-worker.service

# Stop
sudo systemctl stop vault-worker.service

# Logs (live)
sudo journalctl -fu vault-worker.service

# Logs (recent)
sudo journalctl -u vault-worker.service -n 100 --no-pager
```

## Runtime Smoke Result

1. Created disposable notebook + source with text "the test city is called Ironvale"
2. Worker processed `process_source` command → extracted text, submitted `embed_source`
3. Worker completed embedding: 1 chunk, 1.60s processing time
4. Source status: `completed`, `embedded=True`
5. Asked "What is the test city called?" **without explicit model IDs**
6. Answer: "The test city is called **Ironvale**. [source:3w8g3avm0ebkjhiall21]"
7. Default models used: Fireworks DeepSeek V4 Flash (chat), Fireworks Qwen3 (embedding)
8. Test data cleaned up

## Restart Sequence Smoke

1. Worker restarted via `sudo systemctl restart vault-worker.service` ✅
2. Backend restarted (uvicorn) ✅
3. `/api/health` returns `{"status":"ok","service":"vault-api"}` ✅
4. Live smoke 10/10 ✅

## Reboot Testing

- **Not rebooted** — service is `enabled` and confirmed `active` after manual start
- Reboot expected to auto-start worker via `WantedBy=multi-user.target`
- SurrealDB runs as a direct process (not systemd) — must be running before worker starts

## Stale Command Cleanup

- Worker found ~48 stale commands from previously deleted sources (from H3 smoke tests)
- These retried with exponential backoff before eventually failing
- Cleared stale commands from database to unblock new command processing
- **Recommendation:** Clean up command queue when deleting test sources

## Tests

| Suite | Count | Result |
|-------|-------|--------|
| Backend | 398 | ✅ All passed |
| Frontend | 81 | ✅ All passed |
| Live smoke | 10/10 | ✅ All passed |

## Validation

| Check | Result |
|-------|--------|
| Worker installed | ✅ |
| Worker enabled | ✅ |
| Worker active | ✅ |
| Worker logs (no secrets) | ✅ No FIREWORKS_API_KEY leaked |
| Default model resolution | ✅ Ask works without explicit model IDs |
| End-to-end embedding | ✅ Source embedded via worker |
| End-to-end ask | ✅ Correct answer with source citation |
| Backend tests | ✅ 398/398 |
| Frontend tests | ✅ 81/81 |
| Frontend build | ✅ Clean |
| Live smoke | ✅ 10/10 |
| Scrub | ✅ 0 matches (only doc references) |
| Secrets check | ✅ No API keys exposed |
| Working tree | ✅ Clean (after commit) |

## Limitations

1. **SurrealDB is not systemd-managed** — runs as a direct process. If SurrealDB crashes, the worker will fail to connect. Consider adding a systemd service for SurrealDB in the future.
2. **Stale commands accumulate** — deleting sources does not clean up queued commands. The worker retries them with backoff before failing. Manual cleanup via SurrealDB `DELETE command WHERE ...` may be needed.
3. **Worker depends on `.env` file** — if `.env` is missing or incomplete, the worker will fail to start or connect to the database.
4. **No health check endpoint for worker** — the worker has no HTTP health endpoint; health is determined by `systemctl status`.

## Files Changed

| File | Change |
|------|--------|
| `deploy/systemd/vault-worker.service` | Fixed paths, removed hardcoded env vars, added EnvironmentFile, removed security restrictions |
| `docs/checkpoints/vault_h5_ai_worker_service_activation.md` | This checkpoint |
