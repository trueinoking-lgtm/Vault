#!/usr/bin/env bash
# =============================================================================
# Vault Frontend Standalone Deploy Helper
# =============================================================================
# Builds the Vault Next.js frontend for standalone deployment, copies static
# assets into the standalone output, and optionally restarts the server and/or
# runs smoke tests.
#
# CRITICAL: The old frontend process MUST be killed BEFORE npm run build,
# because the build deletes .next/standalone/ entirely. If the process is
# still running when the directory is deleted, its CWD becomes "(deleted)"
# and it can no longer serve static assets (all return 500).
#
# Static preservation strategy:
#   Before deleting the standalone static directory, cached old static assets
#   are preserved in frontend/.vault-static-cache/. After the new build, old
#   cached assets are merged back into the standalone output (without overwriting
#   new files). This ensures stale browser sessions referencing old chunk names
#   do not immediately crash after deploy.
#
# Usage:
#   ./scripts/deploy_vault_frontend_standalone.sh [--restart] [--restart-systemd] [--smoke]
#
# Flags:
#   --restart          After building, restart the Vault frontend. If the
#                      vault-frontend.service systemd unit is installed it is
#                      restarted via systemctl; otherwise falls back to nohup.
#   --restart-systemd  After building, force restart via systemctl (error if
#                      the unit is not installed).
#   --smoke            After building (and optionally restarting), run smoke tests
#   -h, --help         Show this help message
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
STATIC_CACHE_DIR=".vault-static-cache"
CACHE_MAX_AGE_DAYS=14

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SYSTEMD_SERVICE_NAME="vault-frontend.service"

# ---- Colors -----------------------------------------------------------------
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# Returns 0 if the systemd unit is installed (so we can manage the frontend
# via systemctl instead of nohup).
systemd_service_installed() {
    systemctl list-unit-files "${SYSTEMD_SERVICE_NAME}" 2>/dev/null | grep -q "${SYSTEMD_SERVICE_NAME}"
}

# ---- Usage ------------------------------------------------------------------
usage() {
    cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Build and prepare the Vault frontend standalone deployment.

Options:
  --restart          After building, restart the Vault frontend via nohup (default)
  --restart-systemd  After building, restart the Vault frontend via systemctl
  --smoke            After building (and optionally restarting), run smoke tests
  -h, --help         Show this help message

Environment variables:
  VAULT_BASE_URL   Base URL for smoke tests (default: https://vault-lms.duckdns.org)
  VAULT_PORT       Port for the frontend server (default: 3003)
  VAULT_HOSTNAME   Hostname to bind (default: 0.0.0.0)

Examples:
  # Build and prepare standalone output (safe — no restart)
  $(basename "$0")

  # Full deploy cycle: build, restart via systemd, smoke test
  $(basename "$0") --restart-systemd --smoke

  # Build + restart via nohup
  $(basename "$0") --restart

  # Build + smoke test against a different base URL
  VAULT_BASE_URL=http://localhost:3003 $(basename "$0") --smoke
EOF
    exit 0
}

# ---- Parse flags ------------------------------------------------------------
RESTART=false
RESTART_SYSTEMD=false
SMOKE=false

while [[ $# -gt 0 ]]; do
    case "$1" in
        --restart)          RESTART=true;          shift ;;
        --restart-systemd)  RESTART_SYSTEMD=true;   shift ;;
        --smoke)            SMOKE=true;             shift ;;
        -h|--help)          usage ;;
        *) error "Unknown option: $1"; usage ;;
    esac
done

# If both restart flags are set, --restart-systemd wins
if [[ "$RESTART" == true && "$RESTART_SYSTEMD" == true ]]; then
    warn "Both --restart and --restart-systemd set. Using --restart-systemd."
    RESTART=false
fi

# ---- Step 0: Confirm we are in the repo root --------------------------------
cd "$REPO_ROOT"

if [[ ! -d "$VAULT_FRONTEND_DIR" ]] || [[ ! -f "$VAULT_FRONTEND_DIR/package.json" ]]; then
    error "Must be run from the vault-vault repository root."
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

# ---- Step 3: Preserve old static assets before build ------------------------
# The build may wipe .next/standalone, so cache existing static first.
STANDALONE_STATIC=".next/standalone/.next/static"
CACHE_PATH="$STATIC_CACHE_DIR"

OLD_STATIC_COUNT=0
if [[ -d "$STANDALONE_STATIC" ]]; then
    OLD_STATIC_COUNT=$(find "$STANDALONE_STATIC" -type f 2>/dev/null | wc -l)
    if [[ "$OLD_STATIC_COUNT" -gt 0 ]]; then
        info "Preserving $OLD_STATIC_COUNT old static files into $CACHE_PATH/ …"
        mkdir -p "$CACHE_PATH"
        # Copy without overwriting existing cache files (keep newest)
        cp -rn "$STANDALONE_STATIC/." "$CACHE_PATH/" 2>/dev/null || true
        info "Old static cached."
    fi
fi

# Also check if there's a stale cache from a previous interrupted deploy
if [[ -d "$CACHE_PATH" ]]; then
    CACHE_COUNT=$(find "$CACHE_PATH" -type f 2>/dev/null | wc -l)
    info "Static cache contains $CACHE_COUNT files."
fi

# ---- Step 4: Stop old frontend process BEFORE build -------------------------
# CRITICAL: npm run build deletes .next/standalone/ entirely. If the process
# is still running, its CWD becomes "(deleted)" and static serving breaks.
info "Stopping old frontend process (if any) before build…"

if systemd_service_installed; then
    # Prefer stopping the managed unit. This is SAFER than a raw port-kill:
    # with Restart=always, a port-kill would make systemd immediately
    # re-spawn the process into the deleted .next/standalone directory mid-build,
    # reintroducing the very stale-chunk bug this script exists to prevent.
    info "vault-frontend.service detected — stopping via systemctl (prevents restart-loop into deleted dir)…"
    systemctl stop "$SYSTEMD_SERVICE_NAME" 2>/dev/null || true
    # Belt-and-suspenders: clear any stale non-systemd process (old nohup) too.
    sleep 2
    OLD_PID="$(ss -tlnp | grep ":${VAULT_PORT} " | grep -oP 'pid=\K[0-9]+' | head -1 || true)"
    if [[ -n "$OLD_PID" ]]; then
        warn "Stale non-systemd process (PID: $OLD_PID) still on port $VAULT_PORT — killing…"
        kill -TERM "$OLD_PID" 2>/dev/null || true
        sleep 2
        kill -0 "$OLD_PID" 2>/dev/null && kill -KILL "$OLD_PID" 2>/dev/null || true
    fi
    info "Old frontend stopped."
else
    OLD_PID="$(ss -tlnp | grep ":${VAULT_PORT} " | grep -oP 'pid=\K[0-9]+' | head -1 || true)"
    if [[ -n "$OLD_PID" ]]; then
        info "Found existing process (PID: $OLD_PID) on port $VAULT_PORT — stopping…"
        kill -TERM "$OLD_PID" 2>/dev/null || true
        sleep 2
        # Force kill if still alive after graceful stop
        if kill -0 "$OLD_PID" 2>/dev/null; then
            warn "Process still running after SIGTERM — sending SIGKILL…"
            kill -KILL "$OLD_PID" 2>/dev/null || true
            sleep 1
        fi
        info "Old process stopped."
    else
        info "No existing process found on port $VAULT_PORT."
    fi
fi

# ---- Step 5: Build ----------------------------------------------------------
info "Building Vault frontend (npm run build — output: standalone)…"
npm run build
BUILD_ID="$(cat .next/BUILD_ID 2>/dev/null || echo 'unknown')"
info "Build complete. Build ID: $BUILD_ID"

# ---- Step 6: Remove stale standalone static directory -----------------------
# (build recreates .next/standalone from scratch)
if [[ -d "$STANDALONE_STATIC" ]]; then
    info "Removing stale standalone static directory…"
    rm -rf "$STANDALONE_STATIC"
fi

# ---- Step 7: Copy new static files into standalone output -------------------
info "Copying .next/static → .next/standalone/.next/static/ …"
if [[ ! -d ".next/static" ]]; then
    error ".next/static not found — build may have failed or output format changed."
    exit 1
fi
mkdir -p "$STANDALONE_STATIC"
cp -r ".next/static/." "$STANDALONE_STATIC/"

# ---- Step 8: Verify new static copy is not empty ---------------------------
NEW_STATIC_COUNT="$(find "$STANDALONE_STATIC" -type f 2>/dev/null | wc -l)"
if [[ "$NEW_STATIC_COUNT" -lt 1 ]]; then
    error "Static copy verification FAILED — $STANDALONE_STATIC is empty."
    error "This means static assets will return 500 in production."
    error "Check that .next/static/ was populated by the build step."
    exit 1
fi
info "New static files copied: $NEW_STATIC_COUNT files"

# ---- Step 9: Hard validation — chunks and media directories must exist ------
CHUNKS_COUNT="$(find "$STANDALONE_STATIC/chunks" -type f 2>/dev/null | wc -l)"
if [[ "$CHUNKS_COUNT" -lt 1 ]]; then
    error "CRITICAL: $STANDALONE_STATIC/chunks/ is empty or missing."
    error "This means all JS/CSS chunk requests will return 500."
    exit 1
fi
info "Chunks directory validated: $CHUNKS_COUNT files"

MEDIA_COUNT="$(find "$STANDALONE_STATIC/media" -type f 2>/dev/null | wc -l || echo 0)"
if [[ "$MEDIA_COUNT" -lt 1 ]]; then
    warn "No media files found in $STANDALONE_STATIC/media/ (fonts may be missing)."
else
    info "Media directory validated: $MEDIA_COUNT files"
fi

# ---- Step 10: Restore cached old static assets (merge, don't overwrite) -----
RESTORED_COUNT=0
if [[ -d "$CACHE_PATH" ]] && [[ -n "$(ls -A "$CACHE_PATH" 2>/dev/null)" ]]; then
    info "Restoring cached old static assets into standalone (no overwrite)…"
    # cp -n = no-clobber: only copy if destination doesn't exist
    # -r = recursive
    # This ensures current build assets are untouched, but old chunks remain
    # available for stale browser sessions.
    find "$CACHE_PATH" -type f | while read -r cached_file; do
        rel_path="${cached_file#"$CACHE_PATH/"}"
        dest="$STANDALONE_STATIC/$rel_path"
        if [[ ! -f "$dest" ]]; then
            mkdir -p "$(dirname "$dest")"
            cp "$cached_file" "$dest"
            RESTORED_COUNT=$((RESTORED_COUNT + 1))
        fi
    done
    # recount for accurate reporting
    RESTORED_COUNT=$(find "$STANDALONE_STATIC" -type f -newer "$CACHE_PATH" 2>/dev/null | wc -l || echo 0)
    FINAL_STATIC_COUNT=$(find "$STANDALONE_STATIC" -type f 2>/dev/null | wc -l)
    info "Cached old assets restored. Final standalone static: $FINAL_STATIC_COUNT files"
else
    info "No cached old static to restore."
fi

# ---- Step 11: Prune old cache (remove files older than CACHE_MAX_AGE_DAYS) --
if [[ -d "$CACHE_PATH" ]]; then
    PRUNED=$(find "$CACHE_PATH" -type f -mtime +${CACHE_MAX_AGE_DAYS} -delete -print 2>/dev/null | wc -l)
    # Remove empty directories left behind
    find "$CACHE_PATH" -type d -empty -delete 2>/dev/null || true
    if [[ "$PRUNED" -gt 0 ]]; then
        info "Pruned $PRUNED stale cache files older than ${CACHE_MAX_AGE_DAYS} days."
    fi
    REMAINING=$(find "$CACHE_PATH" -type f 2>/dev/null | wc -l)
    info "Static cache now has $REMAINING files."
fi

# ---- Step 12: Copy public assets into standalone output ---------------------
if [[ -d "public" ]] && [[ -n "$(ls -A public 2>/dev/null)" ]]; then
    info "Copying public assets → .next/standalone/public/ …"
    mkdir -p ".next/standalone/public"
    cp -r public/. ".next/standalone/public/"
    info "Public assets copied."
fi

# ---- Step 12b: Sync static into the nginx-readable direct-serve dir --------
# Nginx serves /_next/static/* directly from /var/www/hivemind-static/
# (see deploy/nginx/impact-standalone.conf). The repo .next tree lives under
# /root, which www-data cannot traverse, so the static dir must be copied to a
# path nginx can read. This MUST run after the standalone static copy above so
# the alias target is always repopulated before the service restarts.
NGINX_STATIC_DIR="/var/www/hivemind-static"
if [[ -d "$STANDALONE_STATIC" ]]; then
    info "Syncing static → nginx direct-serve dir ($NGINX_STATIC_DIR) …"
    mkdir -p "$NGINX_STATIC_DIR"
    rm -rf "${NGINX_STATIC_DIR:?}/"*
    cp -r "$STANDALONE_STATIC/." "$NGINX_STATIC_DIR/"
    # Ensure www-data (nginx worker) can read + traverse the whole tree.
    chmod -R a+rX "$NGINX_STATIC_DIR"
    NGINX_STATIC_COUNT=$(find "$NGINX_STATIC_DIR" -type f 2>/dev/null | wc -l)
    if [[ "$NGINX_STATIC_COUNT" -lt 1 ]]; then
        error "Nginx static sync FAILED — $NGINX_STATIC_DIR is empty."
        error "Direct static serving will 403/404 in production."
        exit 1
    fi
    info "Nginx direct-serve static synced: $NGINX_STATIC_COUNT files"
else
    warn "Skipping nginx static sync — $STANDALONE_STATIC missing."
fi

# ---- Step 13: Verify standalone server entry point exists -------------------
if [[ ! -f ".next/standalone/server.js" ]]; then
    error ".next/standalone/server.js not found — standalone build incomplete."
    error "Check that next.config.ts has output: 'standalone'."
    exit 1
fi
info "Standalone server entry point: .next/standalone/server.js"

cd "$REPO_ROOT"

# ---- Step 14: Restart the frontend (systemd preferred) ----------------------
# If the systemd unit is installed we ALWAYS manage the frontend through
# systemctl — never nohup — so future deploys never leave an orphaned process.
# Falls back to nohup only when the unit is not installed.
if [[ "$RESTART" == true || "$RESTART_SYSTEMD" == true ]]; then
    if systemd_service_installed; then
        info "vault-frontend.service installed — restarting via systemctl…"
        if systemctl restart "$SYSTEMD_SERVICE_NAME"; then
            echo ""
            info "═══════════════════════════════════════════════════════════════"
            info "  Vault frontend restarted via systemd ($SYSTEMD_SERVICE_NAME)"
            info "  Listening on http://$VAULT_HOSTNAME:$VAULT_PORT"
            info "  Logs: sudo journalctl -fu $SYSTEMD_SERVICE_NAME"
            info "═══════════════════════════════════════════════════════════════"

            sleep 2
            if systemctl is-active --quiet "$SYSTEMD_SERVICE_NAME"; then
                info "Service is active (running)."
            else
                warn "Service is not active after restart — check logs:"
                warn "  sudo journalctl -u $SYSTEMD_SERVICE_NAME -n 30 --no-pager"
            fi
        else
            error "systemctl restart failed. Check the service status:"
            error "  sudo systemctl status $SYSTEMD_SERVICE_NAME"
            exit 1
        fi
    else
        # ---- Fallback: nohup restart (unit not installed) ----
        warn "vault-frontend.service NOT installed — falling back to nohup restart."
        warn "For a supervised service, install the unit:"
        warn "  sudo cp deploy/systemd/$SYSTEMD_SERVICE_NAME /etc/systemd/system/"
        warn "  sudo systemctl daemon-reload && sudo systemctl enable $SYSTEMD_SERVICE_NAME"
        info "Starting Vault frontend (port $VAULT_PORT) via nohup…"

        cd "$VAULT_FRONTEND_DIR"
        PORT="$VAULT_PORT" HOSTNAME="$VAULT_HOSTNAME" \
            nohup node .next/standalone/server.js \
            > /var/log/vault-frontend.log 2>&1 &
        NEW_PID=$!
        cd "$REPO_ROOT"

        echo ""
        info "═══════════════════════════════════════════════════════════════"
        info "  Vault frontend started (PID: $NEW_PID)"
        info "  Listening on http://$VAULT_HOSTNAME:$VAULT_PORT"
        info "  Log file: /var/log/vault-frontend.log"
        info "═══════════════════════════════════════════════════════════════"

        sleep 3
        if kill -0 "$NEW_PID" 2>/dev/null; then
            info "Process confirmed running."
        else
            warn "Process exited within 3 seconds — check log file for errors."
        fi
    fi
fi

# ---- Step 15: Optional smoke test -------------------------------------------
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

    # Root "/" is expected to 302-redirect to /impact-intelligence (intentional).
    # Verify the redirect target and that the landing route serves 200.
    root_code="$(curl -s -o /dev/null -w '%{http_code}' "$VAULT_BASE_URL/" 2>/dev/null || echo '000')"
    root_location="$(curl -s -o /dev/null -w '%{redirect_url}' "$VAULT_BASE_URL/" 2>/dev/null || true)"
    if [[ "$root_code" == "302" || "$root_code" == "301" ]]; then
        if echo "$root_location" | grep -qE '/impact-intelligence$|/impact-intelligence[?/]'; then
            info "  ✅ Root (/) — HTTP $root_code → $root_location"
        else
            error "  ❌ Root (/) — redirects to '$root_location', expected /impact-intelligence"
            ((errors++))
        fi
    elif [[ "$root_code" == "200" ]]; then
        info "  ✅ Root (/) — HTTP 200"
    else
        error "  ❌ Root (/) — expected 200 or 302→/impact-intelligence, got HTTP $root_code"
        ((errors++))
    fi

    # Landing route must serve 200
    check_http "$VAULT_BASE_URL/impact-intelligence" 200 "Impact landing (/impact-intelligence)"
    # Other app routes (smoke subset)
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

    # Direct static serving (Nginx alias → /var/www/hivemind-static).
    # Extract one /_next/static asset referenced by the live landing HTML and
    # confirm it returns 200 with a stable Content-Length (proves it is served
    # by Nginx, not the Node proxy).
    LIVE_HTML="$(curl -s "$VAULT_BASE_URL/impact-intelligence" 2>/dev/null || true)"
    STATIC_ASSET="$(echo "$LIVE_HTML" | grep -oE '/_next/static/[^"'\'' ]+\.(js|css)' | head -1 || true)"
    if [[ -n "$STATIC_ASSET" ]]; then
        asset_url="$VAULT_BASE_URL$STATIC_ASSET"
        asset_code="$(curl -s -o /dev/null -w '%{http_code}' "$asset_url" 2>/dev/null || echo '000')"
        asset_clen="$(curl -sI "$asset_url" 2>/dev/null | grep -i '^content-length:' | awk '{print $2}' | tr -d '\r' || true)"
        if [[ "$asset_code" == "200" && -n "$asset_clen" ]]; then
            info "  ✅ Direct static ($STATIC_ASSET) — HTTP 200, Content-Length: $asset_clen"
        else
            error "  ❌ Direct static ($STATIC_ASSET) — expected HTTP 200 + Content-Length, got HTTP $asset_code"
            ((errors++))
        fi
    else
        warn "  ⚠️ Could not extract a static asset from live HTML — skipping direct-static smoke check"
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
FINAL_STATIC_COUNT=$(find "$VAULT_FRONTEND_DIR/$STANDALONE_STATIC" -type f 2>/dev/null | wc -l)
echo ""
info "═══════════════════════════════════════════════════════════════"
info "  Vault Frontend Deploy Helper — Complete"
info "  Build ID:              $BUILD_ID"
info "  Build output:          $VAULT_FRONTEND_DIR/.next/standalone/"
info "  New static files:      $NEW_STATIC_COUNT"
info "  Restored cached files: $RESTORED_COUNT"
info "  Final standalone static: $FINAL_STATIC_COUNT files"
info ""
info "  Next steps:"
if [[ "$RESTART_SYSTEMD" != true && "$RESTART" != true ]]; then
    info "  • Restart via systemd: $(basename "$0") --restart-systemd"
    info "  • Restart via nohup:   $(basename "$0") --restart"
    info "  • Or manually:"
    info "      cd $VAULT_FRONTEND_DIR && PORT=$VAULT_PORT HOSTNAME=$VAULT_HOSTNAME \\"
    info "        nohup node .next/standalone/server.js \\"
    info "        > /var/log/vault-frontend.log 2>&1 &"
fi
if [[ "$SMOKE" != true ]]; then
    info "  • Run smoke tests:    $(basename "$0") --smoke"
fi
info "═══════════════════════════════════════════════════════════════"
