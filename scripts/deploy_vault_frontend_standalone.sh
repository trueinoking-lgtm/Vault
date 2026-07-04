#!/usr/bin/env bash
# =============================================================================
# Vault Frontend Standalone Deploy Helper
# =============================================================================
# Builds the Vault Next.js frontend for standalone deployment, copies static
# assets into the standalone output, and optionally restarts the server and/or
# runs smoke tests.
#
# Usage:
#   ./scripts/deploy_vault_frontend_standalone.sh [--restart] [--smoke]
#
# Flags:
#   --restart    After building, restart the running Vault frontend process
#   --smoke      After building (and optionally restarting), run smoke tests
#   -h, --help   Show this help message
#
# Environment:
#   VAULT_BASE_URL   Base URL for smoke tests (default: https://vault-lms.duckdns.org)
#   VAULT_PORT       Port for the frontend server (default: 3003)
#   VAULT_HOSTNAME   Hostname to bind (default: 0.0.0.0)
# =============================================================================

set -euo pipefail

# ---- Configuration ----------------------------------------------------------
VAULT_BASE_URL="${VAULT_BASE_URL:-https://vault-lms.duckdns.org}"
VAULT_FRONTEND_DIR="frontend"
VAULT_PORT="${VAULT_PORT:-3003}"
VAULT_HOSTNAME="${VAULT_HOSTNAME:-0.0.0.0}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---- Colors -----------------------------------------------------------------
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ---- Usage ------------------------------------------------------------------
usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Build and prepare the Vault frontend standalone deployment.

Options:
  --restart    After building, restart the running Vault frontend process
  --smoke      After building (and optionally restarting), run smoke tests
  -h, --help   Show this help message

Environment variables:
  VAULT_BASE_URL   Base URL for smoke tests (default: https://vault-lms.duckdns.org)
  VAULT_PORT       Port for the frontend server (default: 3003)
  VAULT_HOSTNAME   Hostname to bind (default: 0.0.0.0)

Examples:
  # Build and prepare standalone output (safe — no restart)
  $(basename "$0")

  # Full deploy cycle: build, restart, smoke test
  $(basename "$0") --restart --smoke

  # Build + smoke test against a different base URL
  VAULT_BASE_URL=http://localhost:3003 $(basename "$0") --smoke
EOF
    exit 0
}

# ---- Parse flags ------------------------------------------------------------
RESTART=false
SMOKE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --restart) RESTART=true; shift ;;
        --smoke)   SMOKE=true;   shift ;;
        -h|--help) usage ;;
        *) error "Unknown option: $1"; usage ;;
    esac
done

# ---- Step 0: Confirm we are in the repo root --------------------------------
cd "$REPO_ROOT"

if [[ ! -d "$VAULT_FRONTEND_DIR" ]] || [[ ! -f "$VAULT_FRONTEND_DIR/package.json" ]]; then
    error "Must be run from the vault-open-notebook repository root."
    error "Expected '$VAULT_FRONTEND_DIR/package.json' to exist."
    exit 1
fi
info "Repository root: $REPO_ROOT"

# ---- Step 1: Confirm package-lock.json exists -------------------------------
if [[ ! -f "$VAULT_FRONTEND_DIR/package-lock.json" ]]; then
    error "$VAULT_FRONTEND_DIR/package-lock.json not found."
    error "Run 'npm install' in $VAULT_FRONTEND_DIR/ to generate it, then retry."
    exit 1
fi
info "Found package-lock.json (lockfileVersion 3)"

# ---- Step 2: Install dependencies -------------------------------------------
cd "$VAULT_FRONTEND_DIR"

info "Installing dependencies with npm ci (reproducible install)…"
npm ci
info "Dependencies installed."

# ---- Step 3: Build ----------------------------------------------------------
info "Building Vault frontend (npm run build — output: standalone)…"
npm run build
BUILD_ID="$(cat .next/BUILD_ID 2>/dev/null || echo 'unknown')"
info "Build complete. Build ID: $BUILD_ID"

# ---- Step 4: Copy static files into standalone output -----------------------
info "Copying .next/static → .next/standalone/.next/static/ …"
if [[ ! -d ".next/static" ]]; then
    error ".next/static not found — build may have failed or output format changed."
    exit 1
fi
mkdir -p ".next/standalone/.next/static"
cp -r ".next/static/." ".next/standalone/.next/static/"
info "Static files copied successfully."

# ---- Step 5: Copy public assets into standalone output ----------------------
if [[ -d "public" ]] && [[ -n "$(ls -A public 2>/dev/null)" ]]; then
    info "Copying public assets → .next/standalone/public/ …"
    mkdir -p ".next/standalone/public"
    cp -r public/. ".next/standalone/public/"
    info "Public assets copied."
fi

# ---- Step 6: Verify standalone server entry point exists --------------------
if [[ ! -f ".next/standalone/server.js" ]]; then
    error ".next/standalone/server.js not found — standalone build incomplete."
    error "Check that next.config.ts has output: 'standalone'."
    exit 1
fi
info "Standalone server entry point: .next/standalone/server.js"

cd "$REPO_ROOT"

# ---- Step 7: Optional restart -----------------------------------------------
if [[ "$RESTART" == true ]]; then
    info "Restart flag set — restarting Vault frontend (port $VAULT_PORT)…"

    # Find and stop existing process on the port
    OLD_PID="$(lsof -ti :"$VAULT_PORT" 2>/dev/null || true)"
    if [[ -n "$OLD_PID" ]]; then
        info "Stopping existing process (PID: $OLD_PID)…"
        kill -TERM "$OLD_PID" 2>/dev/null || true
        sleep 2
        # Force kill if still alive after graceful stop
        if kill -0 "$OLD_PID" 2>/dev/null; then
            warn "Process still running after SIGTERM — sending SIGKILL…"
            kill -KILL "$OLD_PID" 2>/dev/null || true
            sleep 1
        fi
    fi

    # Start new process
    cd "$VAULT_FRONTEND_DIR"
    PORT="$VAULT_PORT" HOSTNAME="$VAULT_HOSTNAME" \
        nohup node .next/standalone/server.js \
        > /var/log/vault-frontend.log 2>&1 &
    NEW_PID=$!
    cd "$REPO_ROOT"

    echo ""
    info "═══════════════════════════════════════════════════════════════"
    info "  Vault frontend restarted (PID: $NEW_PID)"
    info "  Listening on http://$VAULT_HOSTNAME:$VAULT_PORT"
    info "  Log file: /var/log/vault-frontend.log"
    info "═══════════════════════════════════════════════════════════════"

    # Brief wait + process liveness check
    sleep 3
    if kill -0 "$NEW_PID" 2>/dev/null; then
        info "Process confirmed running."
    else
        warn "Process exited within 3 seconds — check log file for errors."
    fi
fi

# ---- Step 8: Optional smoke test --------------------------------------------
if [[ "$SMOKE" == true ]]; then
    echo ""
    info "Smoke flag set — running smoke tests against $VAULT_BASE_URL…"

    errors=0

    check_http() {
        local url="$1"
        local expected="$2"
        local desc="$3"
        local http_code
        http_code="$(curl -s -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo '000')"
        if [[ "$http_code" == "$expected" ]]; then
            info "  ✅ $desc — HTTP $http_code"
        else
            error "  ❌ $desc — expected HTTP $expected, got HTTP $http_code"
            return 1
        fi
    }

    # Routes that should return 200
    check_http "$VAULT_BASE_URL/"        200 "Root (/)"
    check_http "$VAULT_BASE_URL/vault"   200 "Vault dashboard (/vault)"
    check_http "$VAULT_BASE_URL/sources" 200 "Sources list (/sources)"
    check_http "$VAULT_BASE_URL/notebooks" 200 "Notebooks list (/notebooks)"

    # Owner gate — no cookie should redirect to /login
    owner_redirect="$(curl -s -o /dev/null -w '%{redirect_url}' "$VAULT_BASE_URL/owner" 2>/dev/null || true)"
    if echo "$owner_redirect" | grep -q '/login?owner=1'; then
        info "  ✅ Owner gate (/owner) — redirects to /login?owner=1"
    else
        error "  ❌ Owner gate (/owner) — expected redirect to /login?owner=1"
        error "     Got: $owner_redirect"
        ((errors++))
    fi

    # API auth status endpoint
    api_status="$(curl -s "$VAULT_BASE_URL/api/auth/status" 2>/dev/null || echo '{"error":"unreachable"}')"
    if echo "$api_status" | grep -q '"auth_enabled"'; then
        info "  ✅ API auth status (/api/auth/status) — responds with auth_enabled"
    else
        error "  ❌ API auth status (/api/auth/status) — unexpected response:"
        error "     $api_status"
        ((errors++))
    fi

    if [[ "$errors" -eq 0 ]]; then
        echo ""
        info "═══════════════════════════════════════════"
        info "  All smoke tests passed ✅"
        info "═══════════════════════════════════════════"
    else
        echo ""
        warn "═══════════════════════════════════════════"
        warn "  $errors smoke test(s) failed ⚠️"
        warn "═══════════════════════════════════════════"
    fi
fi

# ---- Summary ----------------------------------------------------------------
echo ""
info "═══════════════════════════════════════════════════════════════"
info "  Vault Frontend Deploy Helper — Complete"
info "  Build ID:     $BUILD_ID"
info "  Build output: $VAULT_FRONTEND_DIR/.next/standalone/"
info ""
info "  Next steps:"
if [[ "$RESTART" != true ]]; then
    info "  • Restart the server:  $(basename "$0") --restart"
    info "  • Or manually:"
    info "      cd $VAULT_FRONTEND_DIR && PORT=$VAULT_PORT HOSTNAME=$VAULT_HOSTNAME \\"
    info "        nohup node .next/standalone/server.js \\"
    info "        > /var/log/vault-frontend.log 2>&1 &"
fi
if [[ "$SMOKE" != true ]]; then
    info "  • Run smoke tests:    $(basename "$0") --smoke"
fi
info "═══════════════════════════════════════════════════════════════"
