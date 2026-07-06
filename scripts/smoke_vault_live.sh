#!/usr/bin/env bash
# =============================================================================
# Vault Live Smoke Test
# =============================================================================
# Standalone smoke test for the Vault production frontend.  Checks key routes,
# the API status endpoint, and at least one current static asset extracted from
# the HTML.  Requires no secrets and does not touch AetherLink.
#
# Usage:
#   bash scripts/smoke_vault_live.sh [base_url]
#
# Default base URL: https://vault-lms.duckdns.org
#
# Examples:
#   bash scripts/smoke_vault_live.sh
#   bash scripts/smoke_vault_live.sh http://localhost:3003
#   bash scripts/smoke_vault_live.sh https://staging.example.com
#
# Exit code: 0 if all checks pass, 1 if any check fails.
# =============================================================================

set -euo pipefail

BASE_URL="${1:-https://vault-lms.duckdns.org}"
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
    echo "Examples:"
    echo "  $(basename "$0")"
    echo "  $(basename "$0") http://localhost:3003"
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

# ---- 4. Static asset check --------------------------------------------------
echo "  ── Static asset check ──"

# Extract static asset URLs from the root HTML — try multiple in case one is malformed
# Pattern matches /_next/static/... up to a quote, apostrophe, or whitespace
STATIC_URLS="$(curl -s "$BASE_URL/" 2>/dev/null \
    | grep -oP '/_next/static/[^"'"'"' ><]+' \
    | head -5 || true)"

if [[ -z "$STATIC_URLS" ]]; then
    warn "  ⚠️  Could not extract any static asset URL from HTML — skipping static check"
else
    static_checked=false
    static_ok=false
    while IFS= read -r static_url; do
        [[ -z "$static_url" ]] && continue
        # Skip malformed URLs (e.g. very short paths)
        if [[ ${#static_url} -lt 20 ]]; then
            continue
        fi
        static_checked=true
        static_code="$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}${static_url}" 2>/dev/null || echo '000')"
        if [[ "$static_code" == "200" ]]; then
            info "  ✅ Static asset load — HTTP 200 ($static_url)"
            static_ok=true
            break
        else
            warn "  ⚠️  Static asset $static_url returned HTTP $static_code — trying next…"
        fi
    done <<< "$STATIC_URLS"

    if [[ "$static_checked" == false ]]; then
        warn "  ⚠️  No valid static asset URLs found — skipping static check"
    elif [[ "$static_ok" == false ]]; then
        # All extracted URLs failed — provide diagnostic guidance
        failed_url="$(echo "$STATIC_URLS" | head -1)"
        error "  ❌ All static assets returned non-200 status"
        error "     First URL checked: $failed_url"
        error ""
        error "     Common cause: .next/standalone/.next/static/ is missing."
        error "     Fix: bash scripts/deploy_vault_frontend_standalone.sh --restart-systemd --smoke"
        error "     Or manually:"
        error "       mkdir -p frontend/.next/standalone/.next/static"
        error "       cp -r frontend/.next/static/. frontend/.next/standalone/.next/static/"
        ((errors++))
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
