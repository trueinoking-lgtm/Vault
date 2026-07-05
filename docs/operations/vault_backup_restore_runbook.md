# Vault — Backup and Restore Runbook

> **Scope:** SurrealDB data backup and restoration for the Vault LMS backend.
> **Applies to:** Vault deployments using SurrealDB with file-based (RocksDB) storage.
> **Does NOT cover:** Frontend static assets, environment files, credentials, or AetherLink.

---

## Table of Contents

1. [What Data Must Be Backed Up](#1-what-data-must-be-backed-up)
2. [Where SurrealDB Data Lives](#2-where-surrealdb-data-lives)
3. [Backup Methods](#3-backup-methods)
4. [How to Stop Services Safely](#4-how-to-stop-services-safely)
5. [How to Export / Backup SurrealDB](#5-how-to-export--backup-surrealdb)
6. [How to Store Backup Files Safely](#6-how-to-store-backup-files-safely)
7. [How to Restore from Backup](#7-how-to-restore-from-backup)
8. [How to Verify Restored Data](#8-how-to-verify-restored-data)
9. [How to Restart Vault After Restore](#9-how-to-restart-vault-after-restore)
10. [Post-Restore Smoke Tests](#10-post-restore-smoke-tests)
11. [Disaster Scenarios](#11-disaster-scenarios)
12. [Backup Script Reference](#12-backup-script-reference)
13. [Restore Script Reference](#13-restore-script-reference)
14. [Service Order Quick Reference](#14-service-order-quick-reference)

---

## 1. What Data Must Be Backed Up

| Data | Source | Backup Method | Criticality |
|------|--------|--------------|-------------|
| **SurrealDB database files** | `surreal_data/` directory | File copy (cold) or `surreal export` (hot) | **High** — all user data, schemas, embeddings |
| **SurrealDB schema + data** | Live SurrealDB via HTTP | `surreal export --endpoint http://localhost:8000` | **High** — portable SurrealQL export |
| **Environment config** | `.env` file | File copy (separate from data backup) | **Medium** — contains connection strings |
| **Encryption key** | `VAULT_ENCRYPTION_KEY` in `.env` | Store separately in a password manager | **Critical** — needed to decrypt stored credentials |
| **Owner password** | `VAULT_OWNER_PASSWORD` (env var or config) | Store in a password manager | **Critical** — cannot access owner area without it |
| **AetherLink** | N/A — **do not back up or touch** | Separate deployment; not in Vault scope | N/A |

> **Important:** The `.env` file and credentials must be backed up separately. They are **not** included in the SurrealDB export. Losing the `VAULT_ENCRYPTION_KEY` means losing access to all encrypted credential records.

---

## 2. Where SurrealDB Data Lives

### Live Runtime Path

```
/root/vault-open-notebook/surreal_data/
```

Contents (RocksDB storage engine):

| File | Purpose |
|------|---------|
| `*.log` (e.g. `000004.log`) | Write-ahead log (WAL) |
| `CURRENT` | Current manifest pointer |
| `IDENTITY` | Server identity |
| `LOCK` | Database lock file (present when running) |
| `LOG` | RocksDB internal log |
| `MANIFEST-*` | SST file manifest |
| `OPTIONS-*` | RocksDB configuration snapshot |
| `mydatabase.db/` | (optional) Additional database directory |

**Size (typical):** ~5–10 MB for a development demo; grows with content ingestion.

### Connection Details

| Parameter | Value (this deployment) | Configurable via |
|-----------|------------------------|-----------------|
| Endpoint | `ws://127.0.0.1:8000/rpc` | `SURREAL_URL` in `.env` |
| HTTP endpoint | `http://127.0.0.1:8000` | Same host, HTTP port |
| Username | `root` | `SURREAL_USER` in `.env` |
| Password | (set in `.env`) | `SURREAL_PASSWORD` in `.env` |
| Namespace | (set in `.env`) | `SURREAL_NAMESPACE` in `.env` |
| Database | (set in `.env`) | `SURREAL_DATABASE` in `.env` |

> **Security note:** In production deployments, replace the default `root` user with a dedicated database user and restrict network access to localhost.

---

## 3. Backup Methods

Two complementary backup strategies:

### Method A: Hot Export (Recommended for Routine Backups)

Uses `surreal export` via the HTTP endpoint while SurrealDB is running. Produces a portable SurrealQL script that can be re-imported on any SurrealDB instance.

- **Pros:** No downtime; portable across architectures; can be automated
- **Cons:** Slightly slower than file copy; requires live database
- **Best for:** Daily/weekly automated backups

### Method B: Cold File Copy (Recommended for Snapshots)

Copies the entire `surreal_data/` directory while SurrealDB is **stopped**.

- **Pros:** Fast; captures exact byte-level state; works when DB is corrupted
- **Cons:** Requires downtime; machine-specific (RocksDB format); larger
- **Best for:** Pre-migration snapshots, disaster recovery, full rebuilds

> **Recommendation:** Use Method A for routine scheduled backups, Method B before any destructive operation (migration, upgrade, configuration change).

---

## 4. How to Stop Services Safely

### Stop Vault Backend (always stop first)

```bash
# Find the uvicorn process:
PID=$(pgrep -f "uvicorn api.main:app" | head -1)

# Graceful shutdown:
if [ -n "$PID" ]; then
  kill $PID
  # Wait up to 10 seconds for clean shutdown
  for i in $(seq 1 10); do
    if ! kill -0 $PID 2>/dev/null; then break; fi
    sleep 1
  done
  # Force kill if still alive
  kill -9 $PID 2>/dev/null
fi

# Verify:
ss -tlnp | grep 5055  # Should show nothing
```

### Stop SurrealDB (only if needed for cold backup)

```bash
PID=$(pgrep -x surreal | head -1)
if [ -n "$PID" ]; then
  kill $PID
  sleep 2
  # Verify:
  ss -tlnp | grep 8000  # Should show nothing
fi
```

> **WARNING:** Stopping SurrealDB makes the backend inoperable. All Vault users will see errors until the database is restarted.

### Frontend Behavior During Outages

| State | Frontend Behavior |
|-------|------------------|
| SurrealDB down, backend up | Backend API calls fail; frontend shows error states |
| Backend down, frontend up | Static pages load; API-driven features show errors |
| Frontend down, backend up | Inaccessible until frontend restarts |
| **Best practice** | Frontend can stay up during DB backup; users see transient errors |

### Never Touch AetherLink

```bash
# Verify AetherLink is untouched:
ss -tlnp | grep 3002
# Expected: LISTEN 127.0.0.1:3002 — do not stop or restart
```

---

## 5. How to Export / Backup SurrealDB

### Method A: Hot Export (via HTTP — Recommended)

```bash
cd /root/vault-open-notebook

# Source environment (read endpoint, namespace, database, credentials):
source .env 2>/dev/null

# Export to a timestamped file:
surreal export \
  --endpoint http://localhost:8000 \
  --username "$SURREAL_USER" \
  --password "$SURREAL_PASSWORD" \
  --namespace "$SURREAL_NAMESPACE" \
  --database "$SURREAL_DATABASE" \
  "backups/surreal_export_$(date +%Y%m%d_%H%M%S).surql"
```

> **⚠️ CRITICAL:** Use `http://localhost:8000`, **not** `ws://localhost:8000`. The WebSocket endpoint emits `"storage engine does not support backups on this architecture"` for file-based (RocksDB) storage. The HTTP endpoint works correctly.

Expected output:
```
INFO surreal::cli::export: The SurrealQL file was exported successfully
```

Verify the export:
```bash
# Check file was created and has content:
ls -lh backups/*.surql
wc -l backups/*.surql
# Expected: non-zero file size, 500+ lines of SurrealQL
```

### Method B: Cold File Copy (for snapshots)

```bash
# 1. Stop Vault backend
# 2. Stop SurrealDB

# 3. Copy the data directory:
cp -a /root/vault-open-notebook/surreal_data \
  "/root/vault-open-notebook/backups/surreal_data_$(date +%Y%m%d_%H%M%S)"

# 4. Restart SurrealDB
# 5. Restart Vault backend
```

Verify the copy:
```bash
# Size should match the live directory:
du -sh /root/vault-open-notebook/surreal_data
du -sh backups/surreal_data_*
```

---

## 6. How to Store Backup Files Safely

### Local Storage

Backup files are stored in `/root/vault-open-notebook/backups/` by default.

```bash
# Create the backups directory if it doesn't exist:
mkdir -p /root/vault-open-notebook/backups
```

### Security Requirements

| Requirement | Reason |
|-------------|--------|
| **Restrict file permissions** (`chmod 600` or `640`) | Backups contain all user data and schema |
| **Do not store in web-accessible paths** | Prevent data leakage |
| **Encrypt off-site copies** (gpg, age, or similar) | Protect data at rest |
| **Separate credentials from data backups** | `.env` contains passwords and keys |
| **Test restore periodically** | Verify backup integrity |

### Off-Site Transfer (Manual)

```bash
# Encrypt before transfer:
gpg --symmetric --cipher-algo AES256 backups/surreal_export_20260705_120000.surql

# Copy encrypted file to secure storage (example SCP):
scp backups/surreal_export_20260705_120000.surql.gpg user@offsite-backup:/path/
```

### Retention Guidelines

| Type | Retention | Notes |
|------|-----------|-------|
| Daily exports | 7 days | Rotate oldest |
| Weekly exports | 4 weeks | Keep one per week |
| Pre-migration snapshots | Until migration is verified working | Clean up after validation |
| Off-site copies | At least one per month | Encrypted |

> **Note:** The backup script (`scripts/backup_vault_surrealdb.sh`) does **not** delete old backups automatically. Set up a separate retention policy (e.g., `logrotate` or `cron` + `find -mtime`).

---

## 7. How to Restore from Backup

### Restore from SurrealQL Export (Hot Restore — Recommended)

```bash
cd /root/vault-open-notebook

# Source environment:
source .env 2>/dev/null

# ⚠️ DESTRUCTIVE OPERATION — confirm your intent
echo "This will REPLACE all data in the database. Are you sure? [y/N]"
read -r CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "Restore cancelled."
  exit 1
fi

# 1. Stop the Vault backend (prevents writes during restore):
PID=$(pgrep -f "uvicorn api.main:app" | head -1)
[ -n "$PID" ] && kill "$PID" && sleep 2

# 2. Import the SurrealQL backup:
surreal import \
  --endpoint http://localhost:8000 \
  --username "$SURREAL_USER" \
  --password "$SURREAL_PASSWORD" \
  --namespace "$SURREAL_NAMESPACE" \
  --database "$SURREAL_DATABASE" \
  "backups/surreal_export_20260705_120000.surql"

# 3. Restart the Vault backend:
cd /root/vault-open-notebook && uv run uvicorn api.main:app --host 0.0.0.0 --port 5055 &

# 4. Verify:
sleep 3 && curl -s http://localhost:5055/api/health
```

> **Important:** The `surreal import` command replaces tables and data. It does **not** drop tables that exist but weren't in the export. If you need a clean restore, consider dropping and recreating the database first (see Disaster Scenarios below).

### Restore from Cold File Copy (Full Replace)

```bash
# 1. Stop Vault backend
# 2. Stop SurrealDB

# 3. Replace the data directory:
cd /root/vault-open-notebook
cp -a backups/surreal_data_20260705_120000 surreal_data_rollback_backup
rm -rf surreal_data
cp -a backups/surreal_data_20260705_120000 surreal_data

# 4. Restart SurrealDB
# 5. Restart Vault backend
# 6. Run smoke tests
```

> **Safety:** The old (potentially working) data is copied to `surreal_data_rollback_backup` before replacement, giving you an immediate rollback option.

---

## 8. How to Verify Restored Data

### Quick Health Check

```bash
# Backend is running:
curl -s http://localhost:5055/api/health
# Expected: {"status":"ok","service":"vault-api"}

# Auth endpoint works (proves DB is queryable):
curl -s http://localhost:5055/api/auth/status
# Expected: {"auth_enabled": true, ...}

# Count records to verify data is present:
surreal sql --endpoint http://localhost:8000 \
  --username "$SURREAL_USER" \
  --password "$SURREAL_PASSWORD" \
  --namespace "$SURREAL_NAMESPACE" \
  --database "$SURREAL_DATABASE" \
  --json <<< "SELECT count() FROM notebook;"
# Expected: count > 0 (if notebooks existed before backup)
```

### Full Smoke Test

```bash
bash scripts/smoke_vault_live.sh https://vault-lms.duckdns.org
# Expected: All checks pass (exit code 0)
```

### Sanity Queries

Run these after restore to confirm data integrity:

```sql
-- Check notebook records
SELECT count() FROM notebook;

-- Check source records
SELECT count() FROM source;

-- Check schema is intact
INFO FOR KV;
```

---

## 9. How to Restart Vault After Restore

### Service Order

```
1. Start SurrealDB        (surreal start ...)
2. Wait for port 8000     (up to 10 seconds)
3. Start Vault backend    (uvicorn api.main:app)
4. Wait for port 5055     (up to 10 seconds)
5. Verify /api/health     (curl)
6. Verify /api/auth/status (curl)
7. (frontend should already be running or start last)
8. Run smoke test         (smoke_vault_live.sh)
```

### Commands

```bash
# 1. Start SurrealDB (if not running):
surreal start --username "$SURREAL_USER" --password "$SURREAL_PASSWORD" \
  --log info "file:///root/vault-open-notebook/surreal_data" &

# Wait for it:
for i in $(seq 1 10); do
  if ss -tlnp | grep -q 8000; then break; fi
  sleep 1
done

# 2. Start Vault backend:
cd /root/vault-open-notebook
uv run uvicorn api.main:app --host 0.0.0.0 --port 5055 &

# Wait for it:
for i in $(seq 1 10); do
  if curl -s http://localhost:5055/api/health >/dev/null 2>&1; then break; fi
  sleep 1
done

# 3. Run smoke test:
bash scripts/smoke_vault_live.sh https://vault-lms.duckdns.org
```

---

## 10. Post-Restore Smoke Tests

Run the standard smoke test suite:

```bash
bash scripts/smoke_vault_live.sh https://vault-lms.duckdns.org
```

Expected checks (10 total):

| # | Check | Expected |
|---|-------|----------|
| 1 | `/` | HTTP 200 |
| 2 | `/vault` | HTTP 200 |
| 3 | `/sources` | HTTP 200 |
| 4 | `/notebooks` | HTTP 200 |
| 5 | `/login` | HTTP 200 |
| 6 | `/teacher` | HTTP 200 |
| 7 | `/owner` redirect | → `/login?owner=1` (307) |
| 8 | `/api/health` | `vault-api` |
| 9 | `/api/auth/status` | `auth_enabled` |
| 10 | Static asset | HTTP 200 |

---

## 11. Disaster Scenarios

### Scenario A: Corrupted Database

**Symptoms:**
- Backend starts but API calls return 500 errors
- `surreal export` fails or produces incomplete output
- SurrealDB logs show RocksDB corruption errors

**Recovery:**
```bash
# 1. Stop backend and SurrealDB
# 2. Attempt SurrealDB fix:
surreal fix /root/vault-open-notebook/surreal_data

# 3. If fix fails, restore from last known-good backup:
#    (see Section 7 — Restore from Cold File Copy)

# 4. If no backup exists, try exporting what's readable:
surreal export --endpoint http://localhost:8000 \
  --username "$SURREAL_USER" --password "$SURREAL_PASSWORD" \
  --namespace "$SURREAL_NAMESPACE" --database "$SURREAL_DATABASE" \
  backups/surreal_partial_recovery.surql

# 5. Restore from last clean backup, then re-import partial data
```

### Scenario B: Failed Migration

**Symptoms:**
- Backend logs show migration errors on startup
- API endpoints return unexpected errors
- Some features stopped working after schema changes

**Recovery:**
```bash
# 1. Check which migration failed:
grep -i "migration.*fail\|error.*migration" /var/log/vault-api.log

# 2. If migration ran but caused issues:
#    — Roll back to pre-migration SurrealDB backup
#    — Restore from backup taken before migration

# 3. If migration didn't run (schema version mismatch):
#    — Check if SurrealDB version is compatible
#    — Verify all expected tables exist via INFO FOR KV;
```

### Scenario C: Accidental Data Deletion

**Symptoms:**
- User reports missing notebooks, sources, or notes
- `DELETE FROM notebook` or similar ran accidentally
- Records are gone but schema is intact

**Recovery:**
```bash
# 1. Stop backend immediately (prevent further writes):
pgrep -f "uvicorn api.main:app" | xargs kill

# 2. Restore from latest backup:
#    — Import last .surql export via surreal import
#    — Or restore cold file copy

# 3. Calculate data loss window:
#    — Compare backup timestamp to deletion time
#    — Any data created between backup and deletion is lost
```

### Scenario D: Server Rebuild

**Symptoms:**
- New server instance with no data
- SurrealDB starts with an empty database
- Backend starts but returns empty results

**Recovery:**
```bash
# 1. Install SurrealDB (same version):
#    curl -sSf https://install.surrealdb.com | sh
#    or download from https://github.com/surrealdb/surrealdb/releases

# 2. Create data directory:
mkdir -p /root/vault-open-notebook/surreal_data

# 3. Start SurrealDB:
surreal start --username root --password "$SURREAL_PASSWORD" \
  --log info "file:///root/vault-open-notebook/surreal_data" &

# 4. Restore from export file:
surreal import \
  --endpoint http://localhost:8000 \
  --username "$SURREAL_USER" --password "$SURREAL_PASSWORD" \
  --namespace "$SURREAL_NAMESPACE" --database "$SURREAL_DATABASE" \
  backups/surreal_export_YYYYMMDD_HHMMSS.surql

# 5. Verify:
bash scripts/smoke_vault_live.sh https://vault-lms.duckdns.org
```

### Scenario E: Frontend Works but Backend DB Unavailable

**Symptoms:**
- Static pages load
- API calls fail with connection errors
- `curl http://localhost:5055/api/health` fails
- `ss -tlnp | grep 5055` shows nothing

**Recovery:**
```bash
# 1. Check if SurrealDB is running:
ss -tlnp | grep 8000

# 2. If SurrealDB is down, restart it first:
surreal start --username root --password "$SURREAL_PASSWORD" \
  --log info "file:///root/vault-open-notebook/surreal_data" &

# 3. If SurrealDB is up but backend is down, restart backend:
cd /root/vault-open-notebook && uv run uvicorn api.main:app \
  --host 0.0.0.0 --port 5055 &

# 4. Verify:
curl -s http://localhost:5055/api/health
curl -s http://localhost:5055/api/auth/status

# 5. Smoke test:
bash scripts/smoke_vault_live.sh https://vault-lms.duckdns.org
```

### Scenario F: Clean Database Reset (Development Only)

If you need to start fresh (e.g., for testing):

```bash
# ⚠️ This destroys ALL data. Only for development/testing.
# 1. Stop backend and SurrealDB
# 2. Remove the data directory:
rm -rf /root/vault-open-notebook/surreal_data
# 3. Restart SurrealDB (creates new empty database)
# 4. Restart backend (runs migrations, creates schema)
# 5. Verify with smoke test
```

---

## 12. Backup Script Reference

**Script:** `scripts/backup_vault_surrealdb.sh`

Performs a hot export of SurrealDB via the HTTP endpoint. Creates a timestamped `.surql` file in the `backups/` directory.

```bash
# Basic usage:
bash scripts/backup_vault_surrealdb.sh

# With custom backup directory:
BACKUP_DIR=/path/to/backups bash scripts/backup_vault_surrealdb.sh

# With custom env file:
bash scripts/backup_vault_surrealdb.sh /path/to/.env
```

**What it does:**
1. Reads `SURREAL_USER`, `SURREAL_PASSWORD`, `SURREAL_NAMESPACE`, `SURREAL_DATABASE` from `.env`
2. Runs `surreal export --endpoint http://localhost:8000 ...`
3. Saves output to `backups/surreal_export_YYYYMMDD_HHMMSS.surql`
4. Reports the export file path and size
5. Exits non-zero if anything fails

**Safety:**
- Does **not** stop any services
- Does **not** delete old backups
- Fails safely if SurrealDB is unreachable
- Requires no interactive input (suitable for cron)

---

## 13. Restore Script Reference

**Script:** `scripts/restore_vault_surrealdb.sh`

Restores a SurrealDB database from a `.surql` export file.

```bash
# See usage:
bash scripts/restore_vault_surrealdb.sh

# Restore with confirmation:
bash scripts/restore_vault_surrealdb.sh backups/surreal_export_20260705_120000.surql

# Restore with auto-confirm (scripted):
bash scripts/restore_vault_surrealdb.sh backups/surreal_export_20260705_120000.surql --yes
```

**Safety guards:**
1. **Requires explicit backup file path** — no default file
2. **Validates file exists and is non-empty**
3. **Warns loudly** before destructive operation
4. **Requires interactive confirmation** unless `--yes` flag is passed
5. **Stops Vault backend** before import to prevent writes
6. **Restarts backend** after restore completes
7. **Exits non-zero** if any step fails

**What it does:**
1. Validates the backup file exists and has content
2. Displays a warning about the destructive nature of restore
3. Confirms with the user (unless `--yes`)
4. Stops the Vault backend (graceful kill)
5. Runs `surreal import --endpoint http://localhost:8000 ...`
6. Restarts the Vault backend
7. Waits for health check to pass
8. Reports completion

---

## 14. Service Order Quick Reference

### Backup (Hot Export — No Downtime)

```
1. Run backup script                           ← online
2. Verify exported file exists                  ← online
```

### Backup (Cold Snapshot — Brief Downtime)

```
1. Stop Vault backend                          ← downtime starts
2. Stop SurrealDB                              ← optional
3. Copy surreal_data/ directory                 ← downtime
4. Start SurrealDB                             ← optional
5. Start Vault backend                         ← downtime ends
6. Run smoke test                              ← verify
```

### Restore from SurrealQL Export

```
1. Stop Vault backend                          ← downtime starts
2. (SurrealDB stays running)                    ← online
3. surreal import backup.surql                 ← downtime
4. Start Vault backend                         ← downtime ends
5. Run smoke test                              ← verify
```

### Restore from Cold File Copy

```
1. Stop Vault backend                          ← downtime starts
2. Stop SurrealDB                              ← downtime
3. Replace surreal_data/ directory              ← downtime
4. Start SurrealDB                             ← downtime
5. Start Vault backend                         ← downtime ends
6. Run smoke test                              ← verify
```

---

> **Last updated:** 2026-07-05  
> **Applies to tag:** `vault-g3-stable` and later  
> **See also:** [Release Runbook](./vault_release_runbook.md) | [Smoke Script](../../scripts/smoke_vault_live.sh)
