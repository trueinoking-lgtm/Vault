# Impact Intelligence — Standalone Domain Runbook

## Overview

This document describes how to serve Impact Intelligence as a standalone product on its own domain (e.g., `zimlearngraph.duckdns.org`) while keeping the main Vault application running on `vault-lms.duckdns.org`.

The same Next.js frontend and FastAPI backend are reused — no separate repo is needed. The standalone domain simply redirects `/` to `/impact` so Impact Intelligence opens at the root.

---

## 1. DuckDNS Subdomain

Register a new DuckDNS subdomain pointing to the same VPS IP.

| Purpose | Example Domain | VPS IP |
|---------|---------------|--------|
| Main Vault | `vault-lms.duckdns.org` | `178.104.213.110` |
| Impact standalone | `zimlearngraph.duckdns.org` | `178.104.213.110` |

### Creating the domain

1. Go to https://www.duckdns.org/ and sign in
2. Add a new domain with the chosen hostname
3. Set IP to your VPS public IP (both A and AAAA if IPv6)
4. DNS propagates within seconds for DuckDNS

---

## 2. Approach: nginx Redirect (No Rewrite, No Code Changes)

**No path rewriting** — the simplest approach that cannot break anything:

- `/` → 302 redirects to `/impact` (browser URL updates to `/impact`)
- `/impact/*`, `/_next/static/*` → proxied straight through to Next.js (port 3003)
- `/api/*` → proxied to FastAPI (port 5055)
- `Host` header is passed as `$host` (the actual domain the user typed)

This avoids all the pitfalls of nginx path rewriting (double-prefix issues, broken static assets, etc.).

### nginx Config

Save as `deploy/nginx/impact-standalone.conf`:

```nginx
server {
    listen 80;
    server_name zimlearngraph.duckdns.org;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name zimlearngraph.duckdns.org;

    ssl_certificate /etc/letsencrypt/live/zimlearngraph.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zimlearngraph.duckdns.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # API → same FastAPI backend (port 5055)
    location /api/ {
        proxy_pass http://127.0.0.1:5055/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # Root path → redirect to /impact so standalone domain opens Impact Intelligence
    location = / {
        return 302 /impact;
    }

    # Everything else → Next.js frontend (port 3003)
    # No path rewriting — Next.js handles its own routing
    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Alternative: Frontend Hostname Detection

Instead of the nginx redirect, you could add a Next.js middleware to detect the standalone domain:

```typescript
// frontend/src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const isImpactDomain = hostname.includes('zimlearngraph')
    || hostname.includes('impact')

  if (isImpactDomain && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/impact', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}
```

**Pros:** No nginx rewrite config needed.
**Cons:** Slightly more complex, adds middleware processing overhead.

---

## 3. Installation Steps

```bash
# 1. Create nginx symlinks
sudo ln -sf /root/vault-open-notebook/deploy/nginx/impact-standalone.conf /etc/nginx/sites-available/zimlearngraph
sudo ln -sf /etc/nginx/sites-available/zimlearngraph /etc/nginx/sites-enabled/zimlearngraph

# 2. Get SSL certificate (first time)
sudo mkdir -p /var/www/certbot
sudo certbot certonly --webroot -w /var/www/certbot -d zimlearngraph.duckdns.org \
  --non-interactive --agree-tos --email your-email@example.com

# 3. Test and reload nginx
sudo nginx -t
sudo nginx -s reload
```

---

## 4. Verification Checklist

### 4.1 DNS Resolution
```bash
dig +short zimlearngraph.duckdns.org A
# Should resolve to your VPS IP (e.g., 178.104.213.110)
```

### 4.2 Root Redirect Works
```bash
curl -sI -o /dev/null -w "%{http_code} %{redirect_url}\n" https://zimlearngraph.duckdns.org/
# Should return: 302 https://zimlearngraph.duckdns.org/impact
```

### 4.3 Impact Routes Load
```bash
# Landing page serves content (200, non-empty)
curl -s -o /dev/null -w "Status: %{http_code}, Size: %{size_download} bytes\n" \
  https://zimlearngraph.duckdns.org/impact

# Sub-routes work
for path in "/impact" "/impact/schools" "/impact/assessments" "/impact/school-dashboard"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://zimlearngraph.duckdns.org$path")
  echo "$path → $code"
done
```

### 4.4 Vault Domain Still Works
```bash
for path in "/" "/impact" "/impact/schools" "/api/health" "/notebooks"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://vault-lms.duckdns.org$path")
  echo "$path → $code"
done
```

### 4.5 Static Assets Load
```bash
# Extract CSS URLs from the page and check they serve 200
curl -s https://zimlearngraph.duckdns.org/impact | \
  grep -oP 'href="([^"]*\.css[^"]*)"' | \
  while read attr; do
    url=$(echo "$attr" | sed 's/href="//;s/"//')
    code=$(curl -sI -o /dev/null -w "%{http_code}" "https://zimlearngraph.duckdns.org$url")
    echo "$url → $code"
  done
```

### 4.6 Browser Testing
1. Open `https://zimlearngraph.duckdns.org/` → should redirect to `/impact`
2. Impact Intelligence landing page loads with pilot readiness panel
3. Click all workflow step buttons → navigate to correct pages
4. Open `https://vault-lms.duckdns.org/` in another tab → Vault loads normally
5. Open `https://vault-lms.duckdns.org/impact` → Impact still works at Vault subpath
6. Check browser console for no 404/500 errors on static assets

---

## 5. How to Avoid Breaking Vault

| Risk | Mitigation |
|------|-----------|
| Route clash | The standalone domain uses a simple 302 redirect for `/` and proxies everything else unchanged. No path rewriting means Vault's routes are never affected. |
| API CORS | The API already allows all origins (`allow_origins=["*"]`). No change needed. |
| Auth cookies | Vault's cookie-based auth is scoped to `vault-lms.duckdns.org`. On the standalone domain, auth cookies for Impact endpoints would need to either share a parent domain (`.duckdns.org`) or use token-based auth. |
| Static assets | Next.js builds a single set of `/_next/static/*` assets. They work on any domain that proxies to the same Next.js server. |
| Process sharing | The standalone domain and Vault share the same Next.js (port 3003) and FastAPI (port 5055) processes. Restarting affects both. |

### CORS Configuration

The existing API config uses `allow_origins=["*"]` which covers all domains. No change required.

```python
# api/main.py — if restrict mode is needed later
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://vault-lms.duckdns.org",
        "https://zimlearngraph.duckdns.org",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 6. Smoke Test Script

Save as `scripts/smoke-test-standalone-domain.sh`:

```bash
#!/bin/bash
set -euo pipefail

DOMAIN="${1:-zimlearngraph.duckdns.org}"
VAULT_DOMAIN="${2:-vault-lms.duckdns.org}"

echo "=== Standalone Domain Smoke Test ==="
echo "Testing: https://$DOMAIN"
echo "Vault baseline: https://$VAULT_DOMAIN"
echo ""

# 1. DNS
echo "1. DNS resolution..."
dig +short "$DOMAIN" A || echo "WARN: DNS not resolving"

# 2. Root redirect
echo ""
echo "2. Root redirect..."
redirect=$(curl -sI -o /dev/null -w "%{http_code} %{redirect_url}" "https://$DOMAIN/")
echo "   $redirect"

# 3. Impact routes
echo ""
echo "3. Impact routes..."
for path in "/impact" "/impact/schools" "/impact/assessments" "/impact/school-dashboard"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN$path")
  echo "   $path → $code"
done

# 4. Vault still works
echo ""
echo "4. Vault domain..."
for path in "/" "/impact" "/api/health"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://$VAULT_DOMAIN$path")
  echo "   $path → $code"
done

# 5. Static assets
echo ""
echo "5. Static assets..."
curl -s "https://$DOMAIN/impact" | \
  grep -oP 'href="([^"]*\.css[^"]*)"' | \
  head -3 | \
  while read attr; do
    url=$(echo "$attr" | sed 's/href="//;s/"//')
    code=$(curl -sI -o /dev/null -w "%{http_code}" "https://$DOMAIN$url")
    echo "   $url → $code"
  done

echo ""
echo "=== Done ==="
```

---

## 7. Rollback Plan

```bash
# Disable the standalone domain
sudo rm /etc/nginx/sites-enabled/zimlearngraph
sudo nginx -s reload

# Full cleanup
sudo rm /etc/nginx/sites-available/zimlearngraph
sudo rm /etc/nginx/sites-enabled/zimlearngraph
sudo rm -rf /etc/letsencrypt/live/zimlearngraph.duckdns.org

# Verify Vault still works
curl -sI https://vault-lms.duckdns.org/ | head -1
```

Restarting the Next.js or FastAPI process affects both domains — the services are shared.

---

## 8. Future Considerations

- **Separate repo**: Impact Intelligence could be extracted into its own Next.js app for independent scaling, but this requires significant effort and duplication of shared components.
- **Sub-path hosting**: Instead of a separate domain, Impact lives at `/impact` on the main domain. The standalone domain just adds a shortcut.
- **SSR/SSG split**: If Impact pages need different caching strategies, consider using Next.js `export` for static generation while keeping Vault on SSR.
- **Custom domain**: DuckDNS can be replaced with a custom domain (e.g., `impact.school.gov.zw`) by adding a CNAME record pointing to the DuckDNS hostname.
