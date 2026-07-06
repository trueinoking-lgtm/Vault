#!/usr/bin/env bash
# =============================================================================
# Vault Live Smoke Test
# =============================================================================
# Standalone smoke test for the Vault production frontend.  Checks key routes,
# the API status endpoint, and static assets from multiple routes.  Requires no
# secrets and does not touch AetherLink.
#
# Usage:
#   bash scripts/smoke_vault_live.sh [base_url]
#
# Default base URL: https://vault-lms.duckdns.org
#
# Environment:
#   VAULT_STALE_ASSET_CHECK=1   Also check known stale chunk URLs and report
#                                whether they are still served (diagnostic only,
#                                does not fail normal smoke).
#   VAULT_LOCAL_CHECK=1         Also check static assets directly on localhost:3003
#                                to distinguish proxy problems from server problems.
#
# Examples:
#   bash scripts/smoke_vault_live.sh
#   bash scripts/smoke_vault_live.sh http://localhost:3003
#   VAULT_STALE_ASSET_CHECK=1 bash scripts/smoke_vault_live.sh
#   VAULT_LOCAL_CHECK=1 bash scripts/smoke_vault_live.sh
#
# Exit code: 0 if all checks pass, 1 if any check fails.
# =============================================================================

set -euo pipefail

BASE_URL="${1:-https://vault-lms.duckdns.org}"
STALE_CHECK="${VAULT_STALE_ASSET_CHECK:-0}"
LOCAL_CHECK="${VAULT_LOCAL_CHECK:-0}"
LOCAL_PORT="${VAULT_PORT:-3003}"
errors=0

# ---- Colors ------------------------------------------------------------------
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ---- Usage -------------------------------------------------------------------
if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    echo "Usage: $(basename "$0") [base_url]"
    echo ""
    echo "Smoke-test a live Vault frontend deployment."
    echo ""
    echo "  base_url    Base URL to test (default: https://vault-lms.duckdns.org)"
    echo ""
    echo "Environment variables:"
    echo "  VAULT_STALE_ASSET_CHECK=1   Also check known stale chunk URLs (diagnostic)"
    echo "  VAULT_LOCAL_CHECK=1         Also check local frontend on localhost:$LOCAL_PORT"
    echo ""
    echo "Examples:"
    echo "  $(basename "$0")"
    echo "  $(basename "$0") http://localhost:3003"
    echo "  VAULT_STALE_ASSET_CHECK=1 $(basename "$0")"
    echo "  VAULT_LOCAL_CHECK=1 $(basename "$0")"
    exit 0
fi

echo ""
info "═══════════════════════════════════════════════════════════════"
info "  Vault Live Smoke Test"
info "  Target: $BASE_URL"
info "═══════════════════════════════════════════════════════════════"
echo ""

# ---- Helper ------------------------------------------------------------------
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

# GET-based asset check (not HEAD — browsers use GET)
check_asset_get() {
    local url="$1"
    local desc="$2"
    local http_code
    http_code="$(curl -fsS -L -o /dev/null -w '%{http_code}' "$url" 2>/dev/null || echo '000')"
    if [[ "$http_code" == "200" ]]; then
        info "  ✅ $desc — HTTP $http_code (GET)"
        return 0
    else
        error "  ❌ $desc — HTTP $http_code (GET)"
        return 1
    fi
}

check_json_field() {
    local url="$1"
    local field="$2"
    local desc="$3"
    local body
    body="$(curl -s "$url" 2>/dev/null || echo '{"error":"unreachable"}')"
    if echo "$body" | grep -q "\"$field\""; then
        info "  ✅ $desc — responds with $field"
    else
        error "  ❌ $desc — unexpected response:"
        error "     $body"
        return 1
    fi
}

# ---- 1. Route smoke tests ----------------------------------------------------
echo "  ── Route checks ──"

check_http "$BASE_URL/" 200 "Root (/)"
check_http "$BASE_URL/vault" 200 "Vault dashboard (/vault)"
check_http "$BASE_URL/sources" 200 "Sources list (/sources)"
check_http "$BASE_URL/notebooks" 200 "Notebooks list (/notebooks)"
check_http "$BASE_URL/login" 200 "Login page (/login)"
check_http "$BASE_URL/teacher" 200 "Teacher dashboard (/teacher)"

# Impact Intelligence routes
check_http "$BASE_URL/impact" 200 "Impact landing (/impact)"
check_http "$BASE_URL/impact/assessments" 200 "Impact assessments (/impact/assessments)"
check_http "$BASE_URL/impact/school-dashboard" 200 "Impact school dashboard (/impact/school-dashboard)"
check_http "$BASE_URL/impact/ministry-demo" 200 "Impact ministry demo (/impact/ministry-demo)"

# Owner gate — no cookie should redirect to /login?owner=1
echo "  ── Owner gate check ──"
owner_redirect="$(curl -s -o /dev/null -w '%{redirect_url}' "$BASE_URL/owner" 2>/dev/null || true)"
if echo "$owner_redirect" | grep -q '/login?owner=1'; then
    info "  ✅ Owner gate (/owner) — redirects to /login?owner=1"
else
    error "  ❌ Owner gate (/owner) — expected redirect to /login?owner=1"
    error "     Got: $owner_redirect"
    ((errors++))
fi

# ---- 2. API health check ----------------------------------------------------
echo "  ── API health check ──"
check_json_field "$BASE_URL/api/health" "vault-api" "Backend API health (/api/health)"

# ---- 3. API auth status check -----------------------------------------------
echo "  ── Auth status check ──"
check_json_field "$BASE_URL/api/auth/status" "auth_enabled" "API auth status (/api/auth/status)"

# ---- 4. Static asset check from multiple routes (GET-based) -----------------
echo "  ── Static asset check (multi-route, GET) ──"

# Check CSS and JS assets from each route
ROUTES=("/" "/vault" "/sources" "/notebooks" "/teacher")
total_checked=0
total_ok=0

for route in "${ROUTES[@]}"; do
    # Extract CSS and JS assets from this route
    assets=$(curl -s "${BASE_URL}${route}" 2>/dev/null | grep -oP '/_next/static/(chunks|css)/[^"'\''>< ]+\.(js|css)' | sort -u | head -3 || true)

    if [[ -n "$assets" ]]; then
        while IFS= read -r asset_url; do
            [[ -z "$asset_url" ]] && continue
            total_checked=$((total_checked + 1))
            asset_code=$(curl -fsS -L -o /dev/null -w '%{http_code}' "${BASE_URL}${asset_url}" 2>/dev/null || echo '000')
            if [[ "$asset_code" == "200" ]]; then
                total_ok=$((total_ok + 1))
            else
                error "  ❌ Static asset $asset_url from $route returned HTTP $asset_code"
                errors=$((errors + 1))
            fi
        done <<< "$assets"
    fi
done

if [[ $total_checked -gt 0 ]]; then
    info "  ✅ Static assets checked: $total_ok/$total_checked passed (GET)"
else
    warn "  ⚠️  No static assets found to check"
fi

# ---- 5. Route-specific /vault chunk check -----------------------------------
echo "  ── /vault route chunk check (GET) ──"

# Extract chunks specifically from /vault HTML (limit to 3 for speed)
VAULT_CHUNKS=$(curl -s "${BASE_URL}/vault" 2>/dev/null | grep -oP '/_next/static/chunks/[^"'\''>< ]+\.js' | sort -u | head -3 || true)

if [[ -n "$VAULT_CHUNKS" ]]; then
    vault_chunks_ok=0
    vault_chunks_total=0
    while IFS= read -r chunk_url; do
        [[ -z "$chunk_url" ]] && continue
        vault_chunks_total=$((vault_chunks_total + 1))
        chunk_code=$(curl -fsS -L -o /dev/null -w '%{http_code}' "${BASE_URL}${chunk_url}" 2>/dev/null || echo '000')
        if [[ "$chunk_code" == "200" ]]; then
            vault_chunks_ok=$((vault_chunks_ok + 1))
        else
            error "  ❌ /vault chunk $chunk_url returned HTTP $chunk_code"
            errors=$((errors + 1))
        fi
    done <<< "$VAULT_CHUNKS"

    info "  ✅ /vault chunks checked: $vault_chunks_ok/$vault_chunks_total passed"
else
    warn "  ⚠️  No chunks found in /vault HTML"
fi

# ---- 6. Local frontend check (optional) ------------------------------------
if [[ "$LOCAL_CHECK" == "1" ]]; then
    echo "  ── Local frontend check (localhost:$LOCAL_PORT) ──"

    # Check if local frontend is reachable
    local_health=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${LOCAL_PORT}/" 2>/dev/null || echo '000')
    if [[ "$local_health" == "200" ]]; then
        info "  ✅ Local frontend reachable on port $LOCAL_PORT"

        # Check a local static asset
        local_asset=$(curl -s "http://127.0.0.1:${LOCAL_PORT}/vault" 2>/dev/null | grep -oP '/_next/static/chunks/[^"'\''>< ]+\.js' | sort -u | head -1 || true)
        if [[ -n "$local_asset" ]]; then
            local_code=$(curl -fsS -L -o /dev/null -w '%{http_code}' "http://127.0.0.1:${LOCAL_PORT}${local_asset}" 2>/dev/null || echo '000')
            if [[ "$local_code" == "200" ]]; then
                info "  ✅ Local static asset $local_asset — HTTP $local_code"
            else
                error "  ❌ Local static asset $local_asset — HTTP $local_code"
                error "     Local Next server cannot serve static assets."
                errors=$((errors + 1))
            fi
        fi

        # Compare local vs public for the same asset
        if [[ -n "$local_asset" ]]; then
            public_code=$(curl -fsS -L -o /dev/null -w '%{http_code}' "${BASE_URL}${local_asset}" 2>/dev/null || echo '000')
            if [[ "$local_code" == "200" && "$public_code" != "200" ]]; then
                warn "  ⚠️  Local passes but public fails — proxy/nginx problem"
            elif [[ "$local_code" != "200" && "$public_code" == "200" ]]; then
                warn "  ⚠️  Public passes but local fails — unexpected"
            fi
        fi
    else
        error "  ❌ Local frontend not reachable on port $LOCAL_PORT (HTTP $local_health)"
        errors=$((errors + 1))
    fi
fi

# ---- 7. Stale asset diagnostic (optional) ----------------------------------
if [[ "$STALE_CHECK" == "1" ]]; then
    echo "  ── Stale asset diagnostic (VAULT_STALE_ASSET_CHECK=1) ──"

    # Known stale chunk URLs from previous builds
    STALE_URLS=(
        "/_next/static/chunks/0xlom6.~a6t4v.js"
        "/_next/static/chunks/0iv91htxp8-ti.js"
        "/_next/static/chunks/12zjoa9otwrth.js"
        "/_next/static/chunks/0h431e3jkuhjk.js"
        "/_next/static/chunks/12prz70y1fyr5.css"
    )

    stale_served=0
    stale_missing=0
    for stale_url in "${STALE_URLS[@]}"; do
        stale_code=$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}${stale_url}" 2>/dev/null || echo '000')
        if [[ "$stale_code" == "200" ]]; then
            stale_served=$((stale_served + 1))
        elif [[ "$stale_code" == "404" || "$stale_code" == "500" ]]; then
            stale_missing=$((stale_missing + 1))
        fi
    done

    info "  Stale assets: $stale_served served (200), $stale_missing missing ($stale_missing returned 404/500)"
    if [[ "$stale_served" -gt 0 ]]; then
        info "  ✅ Old chunks preserved — stale browser sessions will not crash"
    else
        warn "  ⚠️  No old chunks preserved — stale browsers may see ChunkLoadError"
    fi
fi

# ---- Summary ----------------------------------------------------------------
echo ""
if [[ "$errors" -eq 0 ]]; then
    info "═══════════════════════════════════════════════════════════════"
    info "  All smoke tests passed ✅"
    info "═══════════════════════════════════════════════════════════════"
    echo ""
    exit 0
else
    warn "═══════════════════════════════════════════════════════════════"
    warn "  $errors smoke test(s) failed ⚠️"
    warn "═══════════════════════════════════════════════════════════════"
    echo ""
    exit 1
fi
