#!/usr/bin/env bash
# Watchdog for the Vault/HMI frontend (vault-frontend.service).
# Runs every 30s via systemd timer. Guarantees the site is not down for long
# unless an intentional maintenance flag is present.
#
# Intentional downtime: `touch /root/.vault_frontend_maintenance` (the monitor
# will then leave the service alone). Remove the flag to resume auto-healing.
set -u

UNIT="vault-frontend.service"
PORT=3003
FLAG=/root/.vault_frontend_maintenance
LOG=/var/log/vault_frontend_watch.log
ts="$(date '+%Y-%m-%d %H:%M:%S')"

log() { echo "$ts: $*" >> "$LOG"; }

# 1) Intentional downtime — respect the flag, do nothing.
if [ -f "$FLAG" ]; then
  log "maintenance flag present — leaving service down"
  exit 0
fi

# 2) If the unit is active, assume healthy (don't fight a live/deploying server).
if systemctl is-active --quiet "$UNIT"; then
  # Extra sanity: if it claims active but isn't actually serving, restart once.
  if curl -s -o /dev/null --max-time 5 "http://127.0.0.1:${PORT}/impact-intelligence"; then
    exit 0
  fi
  log "$UNIT active but HTTP check failed — restarting"
  systemctl restart "$UNIT" >> "$LOG" 2>&1
  sleep 4
  if curl -s -o /dev/null --max-time 5 "http://127.0.0.1:${PORT}/impact-intelligence"; then
    log "recovered after HTTP-fail restart"
  else
    log "still not serving after restart"
  fi
  exit 0
fi

# 3) Unit not active and no maintenance flag -> bring it back up.
log "$UNIT inactive (no maintenance flag) — restarting"
systemctl restart "$UNIT" >> "$LOG" 2>&1
sleep 5
if curl -s -o /dev/null --max-time 5 "http://127.0.0.1:${PORT}/impact-intelligence"; then
  log "recovered, HTTP OK"
else
  log "still down after restart attempt"
fi
