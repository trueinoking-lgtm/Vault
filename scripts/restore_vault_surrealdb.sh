#!/usr/bin/env bash
# =============================================================================
#  Vault — SurrealDB Restore Script
#  Restores a SurrealDB database from a .surql export file.
#  ⚠️  DESTRUCTIVE — replaces all data in the target namespace/database.
# =============================================================================
set -euo pipefail

# --- Configuration ----------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." &>/dev/null && pwd)"
ENV_FILE="${ENV_FILE:-"$PROJECT_DIR/.env"}"
BACKUP_DIR="${BACKUP_DIR:-"$PROJECT_DIR/backups"}"

# --- Colors -----------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# --- Helper functions -------------------------------------------------------
info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }
fatal() { echo -e "${RED}[FATAL]${NC} $*" >&2; exit 1; }

# --- Usage ------------------------------------------------------------------
usage() {
    echo ""
    echo -e "${BOLD}Vault — SurrealDB Restore Script${NC}"
    echo ""
    echo -e "${RED}⚠️  DESTRUCTIVE OPERATION — this replaces all data in the target database.${NC}"
    echo ""
    echo "Usage:"
    echo "  $0 <backup_file> [--yes]"
    echo ""
    echo "Arguments:"
    echo "  backup_file   Path to a .surql export file"
    echo "  --yes         Skip interactive confirmation (for scripted use)"
    echo ""
    echo "Options:"
    echo "  --env FILE    Path to .env file (default: \$PROJECT_DIR/.env)"
    echo "  --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 backups/surreal_export_20260705_120000.surql"
    echo "  $0 backups/surreal_export_20260705_120000.surql --yes"
    echo "  $0 /path/to/backup.surql --env /path/to/.env"
    echo ""
    echo "What this script does:"
    echo "  1. Validates the backup file exists and is non-empty"
    echo "  2. Reads credentials from .env file (never from command line)"
    echo "  3. Warns loudly about the destructive nature of the operation"
    echo "  4. Confirms with the user (unless --yes is passed)"
    echo "  5. Stops the Vault backend (graceful kill)"
    echo "  6. Runs surreal import"
    echo "  7. Restarts the Vault backend"
    echo "  8. Verifies the restore via health check"
    echo ""
    echo "Safety:"
    echo "  - No secrets are passed on the command line"
    echo "  - Interactive confirmation required unless --yes is passed"
    echo "  - Vault backend is stopped before import to prevent writes"
    echo "  - Vault backend is restarted after import completes"
    echo "  - Script exits non-zero on any failure"
    echo ""
    exit 0
}

# --- Parse arguments --------------------------------------------------------
BACKUP_FILE=""
AUTO_YES=0
CONFIRM=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --help|-h)
            usage
            ;;
        --yes|-y)
            AUTO_YES=1
            shift
            ;;
        --env)
            ENV_FILE="$2"
            shift 2
            ;;
        -*)
            fatal "Unknown option: $1 (use --help for usage)"
            ;;
        *)
            if [ -z "$BACKUP_FILE" ]; then
                BACKUP_FILE="$1"
            else
                fatal "Unexpected argument: $1"
            fi
            shift
            ;;
    esac
done

# --- Pre-flight checks ------------------------------------------------------
echo ""
info "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
info "${BOLD}  Vault — SurrealDB Restore${NC}"
info "${BOLD}  ⚠️  DESTRUCTIVE OPERATION${NC}"
info "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Validate backup file argument
if [ -z "$BACKUP_FILE" ]; then
    fatal "No backup file specified. Usage: $0 <backup_file> [--yes]"
fi

# Resolve backup file path (relative to project dir if not absolute)
if [[ "$BACKUP_FILE" != /* ]]; then
    BACKUP_FILE="$PROJECT_DIR/$BACKUP_FILE"
fi

# Check backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    fatal "Backup file not found: $BACKUP_FILE"
fi

# Check backup file is non-empty
if [ ! -s "$BACKUP_FILE" ]; then
    fatal "Backup file is empty: $BACKUP_FILE"
fi

# Show backup file info
BACKUP_SIZE="$(du -h "$BACKUP_FILE" | cut -f1)"
BACKUP_LINES="$(wc -l < "$BACKUP_FILE")"
info "Backup file: $BACKUP_FILE"
info "Size:        $BACKUP_SIZE"
info "Lines:       $BACKUP_LINES"
echo ""

# Check surreal CLI
if ! command -v surreal &>/dev/null; then
    fatal "surreal CLI not found. Is SurrealDB installed?"
fi

# Check .env file
if [ ! -f "$ENV_FILE" ]; then
    fatal "Environment file not found: $ENV_FILE"
fi

# Source environment variables
set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

# Validate required variables
REQUIRED_VARS=("SURREAL_USER" "SURREAL_PASSWORD" "SURREAL_NAMESPACE" "SURREAL_DATABASE")
MISSING=0
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
        error "Required variable $var is not set in $ENV_FILE"
        MISSING=1
    fi
done
if [ "$MISSING" -ne 0 ]; then
    exit 1
fi

# Check SurrealDB is reachable
if ! ss -tlnp 2>/dev/null | grep -q ':8000'; then
    fatal "SurrealDB does not appear to be running on port 8000."
fi

# --- Confirmation -----------------------------------------------------------
echo ""
warn "═══════════════════════════════════════════════════════════════"
warn "  ⚠️  WARNING: DESTRUCTIVE DATABASE RESTORE"
warn ""
warn "  This will REPLACE ALL DATA in:"
warn "    Namespace: ${SURREAL_NAMESPACE}"
warn "    Database:  ${SURREAL_DATABASE}"
warn ""
warn "  Source file: ${BACKUP_FILE}"
warn ""
warn "  The Vault backend will be STOPPED during the restore."
warn "  Any in-flight requests will be lost."
warn "═══════════════════════════════════════════════════════════════"
echo ""

if [ "$AUTO_YES" -eq 1 ]; then
    info "Auto-confirm mode (--yes): proceeding with restore."
else
    echo -en "${RED}${BOLD}Type 'RESTORE' to confirm (anything else cancels): ${NC}"
    read -r CONFIRM_INPUT
    if [ "$CONFIRM_INPUT" != "RESTORE" ]; then
        info "Restore cancelled by user."
        exit 0
    fi
fi
echo ""

# --- Step 1: Stop Vault backend ----------------------------------------------
info "Step 1: Stopping Vault backend..."

BACKEND_PID=$(pgrep -f "uvicorn api.main:app" | head -1 || true)
if [ -n "$BACKEND_PID" ]; then
    info "  Found Vault backend (PID: $BACKEND_PID) — sending SIGTERM..."
    kill "$BACKEND_PID" 2>/dev/null || true

    # Wait up to 15 seconds for graceful shutdown
    SHUTDOWN_OK=0
    for i in $(seq 1 15); do
        if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
            SHUTDOWN_OK=1
            break
        fi
        sleep 1
    done

    if [ "$SHUTDOWN_OK" -eq 0 ]; then
        warn "  Backend did not shut down gracefully — sending SIGKILL..."
        kill -9 "$BACKEND_PID" 2>/dev/null || true
        sleep 1
    fi

    # Verify port is free
    if ss -tlnp 2>/dev/null | grep -q ':5055'; then
        fatal "Port 5055 is still in use after killing backend. Aborting."
    fi
    info "  Vault backend stopped."
else
    info "  Vault backend was not running."
fi
echo ""

# --- Step 2: Import backup --------------------------------------------------
info "Step 2: Importing backup..."
info "  Endpoint:  http://localhost:8000"
info "  Namespace: ${SURREAL_NAMESPACE}"
info "  Database:  ${SURREAL_DATABASE}"
info "  File:      ${BACKUP_FILE}"
echo ""

IMPORT_START=$(date +%s)

# shellcheck disable=SC2086
if ! surreal import \
    --endpoint "http://localhost:8000" \
    --username "$SURREAL_USER" \
    --password "$SURREAL_PASSWORD" \
    --namespace "$SURREAL_NAMESPACE" \
    --database "$SURREAL_DATABASE" \
    "$BACKUP_FILE" 2>&1; then
    error "Import failed!"
    error ""
    error "The database may be in an inconsistent state."
    error "Options:"
    error "  1. Try importing the backup again"
    error "  2. Restore from a cold file copy (see runbook Section 7)"
    error "  3. If this is a fresh database, the import may need a restart"
    exit 1
fi

IMPORT_END=$(date +%s)
IMPORT_DURATION=$((IMPORT_END - IMPORT_START))
info "  Import completed in ${IMPORT_DURATION} seconds."
echo ""

# --- Step 3: Restart Vault backend -------------------------------------------
info "Step 3: Restarting Vault backend..."

cd "$PROJECT_DIR"

# Start backend in background
nohup uv run uvicorn api.main:app --host 0.0.0.0 --port 5055 > /dev/null 2>&1 &
BACKEND_NEW_PID=$!

# Wait for it to be ready (up to 15 seconds)
BACKEND_READY=0
for i in $(seq 1 15); do
    if curl -sf http://localhost:5055/api/health >/dev/null 2>&1; then
        BACKEND_READY=1
        break
    fi
    sleep 1
done

if [ "$BACKEND_READY" -eq 0 ]; then
    error "Vault backend did not start within 15 seconds."
    error "Check: tail -50 /var/log/vault-api.log  (or wherever logs go)"
    error "Manual restart: cd $PROJECT_DIR && uv run uvicorn api.main:app --host 0.0.0.0 --port 5055"
    exit 1
fi

info "  Vault backend restarted (PID: $BACKEND_NEW_PID)."
echo ""

# --- Step 4: Verify restore -------------------------------------------------
info "Step 4: Verifying restore..."

# Health check
HEALTH=$(curl -sf http://localhost:5055/api/health 2>/dev/null || echo '{"error":"unreachable"}')
if echo "$HEALTH" | grep -q '"vault-api"'; then
    info "  ✅ Backend health check passed"
else
    error "  ❌ Backend health check failed: $HEALTH"
    exit 1
fi

# Auth status check
AUTH=$(curl -sf http://localhost:5055/api/auth/status 2>/dev/null || echo '{"error":"unreachable"}')
if echo "$AUTH" | grep -q '"auth_enabled"'; then
    info "  ✅ Auth status check passed"
else
    error "  ❌ Auth status check failed: $AUTH"
    exit 1
fi

echo ""

# --- Done --------------------------------------------------------------------
info "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
info "${BOLD}  Restore completed successfully ✅${NC}"
info ""
info "  Source: ${BACKUP_FILE}"
info "  Namespace: ${SURREAL_NAMESPACE}"
info "  Database: ${SURREAL_DATABASE}"
info "  Import time: ${IMPORT_DURATION}s"
info "  Backend: running (PID: $BACKEND_NEW_PID)"
info ""
info "  Next steps:"
info "    1. Run smoke tests: bash scripts/smoke_vault_live.sh"
info "    2. Verify data manually in the Vault UI"
info "    3. Check for any anomalies in the API responses"
info "${BOLD}═══════════════════════════════════════════════════════════════${NC}"
echo ""

exit 0
