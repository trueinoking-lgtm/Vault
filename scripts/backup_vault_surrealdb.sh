#!/usr/bin/env bash
# =============================================================================
#  Vault — SurrealDB Backup Script
#  Performs a hot export of SurrealDB via the HTTP endpoint.
#  Creates a timestamped .surql file in the backups/ directory.
# =============================================================================
set -euo pipefail

# --- Configuration ----------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." &>/dev/null && pwd)"
BACKUP_DIR="${BACKUP_DIR:-"$PROJECT_DIR/backups"}"
ENV_FILE="${1:-"$PROJECT_DIR/.env"}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
EXPORT_FILE="$BACKUP_DIR/surreal_export_$TIMESTAMP.surql"

# --- Colors -----------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# --- Helper functions -------------------------------------------------------
info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# --- Pre-flight checks ------------------------------------------------------
info "Vault — SurrealDB Backup"
info "Project: $PROJECT_DIR"
echo ""

# Check that surreal CLI exists
if ! command -v surreal &>/dev/null; then
    error "surreal CLI not found. Is SurrealDB installed?"
    exit 1
fi

# Check that the .env file exists
if [ ! -f "$ENV_FILE" ]; then
    error "Environment file not found: $ENV_FILE"
    echo "Usage: $0 [path/to/.env]"
    echo "  Override backup directory with BACKUP_DIR env variable."
    exit 1
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

# Check that SurrealDB is reachable
if ! curl -sf "http://localhost:8000/health" >/dev/null 2>&1; then
    # SurrealDB may not have an HTTP health endpoint; try ws endpoint check via ss
    if ! ss -tlnp 2>/dev/null | grep -q ':8000'; then
        error "SurrealDB does not appear to be running on port 8000."
        error "Start SurrealDB before running backup."
        exit 1
    fi
fi

# --- Create backup directory ------------------------------------------------
mkdir -p "$BACKUP_DIR"

# --- Export -----------------------------------------------------------------
info "Exporting SurrealDB database..."
info "  Endpoint:  http://localhost:8000"
info "  Namespace: ${SURREAL_NAMESPACE}"
info "  Database:  ${SURREAL_DATABASE}"
info "  Output:    $EXPORT_FILE"
echo ""

# shellcheck disable=SC2086
if ! surreal export \
    --endpoint "http://localhost:8000" \
    --username "$SURREAL_USER" \
    --password "$SURREAL_PASSWORD" \
    --namespace "$SURREAL_NAMESPACE" \
    --database "$SURREAL_DATABASE" \
    "$EXPORT_FILE" 2>&1; then
    error "Export failed."
    rm -f "$EXPORT_FILE"
    exit 1
fi

# --- Verify -----------------------------------------------------------------
if [ ! -s "$EXPORT_FILE" ]; then
    error "Export file is empty or was not created."
    rm -f "$EXPORT_FILE"
    exit 1
fi

LINE_COUNT="$(wc -l < "$EXPORT_FILE")"
FILE_SIZE="$(du -h "$EXPORT_FILE" | cut -f1)"

echo ""
info "Backup completed successfully!"
info "  File:  $EXPORT_FILE"
info "  Size:  $FILE_SIZE"
info "  Lines: $LINE_COUNT"
info "  Time:  $(date)"

exit 0
