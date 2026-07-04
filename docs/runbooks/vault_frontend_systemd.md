# Vault Frontend — systemd Service Runbook

## Service File

`deploy/systemd/vault-frontend.service`

## Prerequisites

- `systemd` (available on all modern Linux distributions)
- Vault frontend has been built at least once (`npm run build` in `frontend/`)
- Static assets have been copied (see deploy runbook)
- Root/sudo access to install systemd unit files

## Installation

```bash
# 1. Copy the service file into place
sudo cp deploy/systemd/vault-frontend.service /etc/systemd/system/

# 2. Reload systemd to pick up the new unit
sudo systemctl daemon-reload

# 3. Enable the service to start on boot
sudo systemctl enable vault-frontend.service

# 4. Start the service
sudo systemctl start vault-frontend.service

# 5. Verify it is running
sudo systemctl status vault-frontend.service
```

## Day-to-Day Operations

### Restart (after a deploy build)

```bash
# Run the deploy helper to build + copy static assets:
./scripts/deploy_vault_frontend_standalone.sh

# Then restart the systemd service:
sudo systemctl restart vault-frontend.service
```

Or, use the unified flag:

```bash
./scripts/deploy_vault_frontend_standalone.sh --restart-systemd
```

This builds, copies static assets, then calls `systemctl restart vault-frontend.service` — all in one step.

### Stop

```bash
sudo systemctl stop vault-frontend.service
```

### View Logs

```bash
# Follow live logs
sudo journalctl -fu vault-frontend.service

# Last 100 lines
sudo journalctl -n 100 -u vault-frontend.service

# Since last restart
sudo journalctl -u vault-frontend.service --since "5 minutes ago"

# Export to file (for sharing)
sudo journalctl -u vault-frontend.service --no-pager > vault-frontend.log
```

### Check Port

```bash
# Confirm Vault frontend is listening on port 3003
sudo ss -tlnp | grep 3003

# Expected output: LISTEN at 0.0.0.0:3003 with node process
```

## Verify AetherLink Is Separate

After any Vault frontend operation, confirm AetherLink is still on port 3002:

```bash
sudo ss -tlnp | grep 3002

# Expected: LISTEN at 127.0.0.1:3002 with a Next.js process
#   that is NOT the Vault frontend (verify by process name or PID)
```

## Full Deploy Cycle

```bash
# 1. Build + smoke test (safe mode)
./scripts/deploy_vault_frontend_standalone.sh --smoke

# 2. Restart via systemd
sudo systemctl restart vault-frontend.service

# 3. Smoke test again
./scripts/deploy_vault_frontend_standalone.sh --smoke
```

Or all in one:

```bash
./scripts/deploy_vault_frontend_standalone.sh --restart-systemd --smoke
```

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Service fails to start | `sudo journalctl -u vault-frontend.service -n 50 --no-pager` |
| Port 3003 not listening | Verify standalone build exists: `ls -la frontend/.next/standalone/server.js` |
| Static assets (JS/CSS) return 404 | Static copy step was missed. Run the deploy helper to copy `.next/static` into the standalone output. |
| `systemctl restart` hangs | The service has a 10-second stop timeout (`TimeoutStopSec=10`). After that, systemd sends SIGKILL. |
| Owner gate not working | Build may be stale. Rebuild and restart. |

## Uninstalling

```bash
sudo systemctl stop vault-frontend.service
sudo systemctl disable vault-frontend.service
sudo rm /etc/systemd/system/vault-frontend.service
sudo systemctl daemon-reload
```

## Notes

- The service runs as `root` to match the current deployment environment. For multi-tenant VPS setups, consider creating a dedicated `vault` system user and updating `User=` and `WorkingDirectory=` accordingly.
- The security hardening directives (`NoNewPrivileges=yes`, `ProtectHome=read-only`, `ProtectSystem=full`, `PrivateTmp=yes`) are enabled by default. If you see permission errors, temporarily disable them by commenting the lines out with `#` and re-running `sudo systemctl daemon-reload`.
- If the API is on a different host than `localhost:5055`, add `Environment=INTERNAL_API_URL=http://<host>:<port>` to the service file or use a systemd drop-in: `sudo systemctl edit vault-frontend.service`.
