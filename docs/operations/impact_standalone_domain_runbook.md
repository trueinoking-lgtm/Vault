# Impact Intelligence — Standalone Domain Runbook

## Overview

This document describes how to serve Impact Intelligence as a standalone product on its own domain (e.g., `impact.vault-lms.duckdns.org`) while keeping the main Vault application running on `vault-lms.duckdns.org`.

The same Next.js frontend and FastAPI backend are reused — no separate repo is needed. The standalone domain simply opens the `/impact` route by default.

---

## 1. Recommended DuckDNS Subdomain

Register a new DuckDNS subdomain:

| Purpose | Example Domain |
|---------|---------------|
| Main Vault | `vault-lms.duckdns.org` |
| Impact standalone | `impact-vault-lms.duckdns.org` or `impact-lab.duckdns.org` |

Point both subdomains to the same server IP.

---

## 2. Approach Options

### Option A: nginx Rewrite (Recommended)

Use nginx to serve a different Next.js route based on the domain. No frontend code changes needed.

```nginx
# /etc/nginx/sites-available/vault-lms

# --- Main Vault domain ---
server {
    listen 80;
    server_name vault-lms.duckdns.org;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /api/ {
        proxy_pass http://localhost:5055/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# --- Impact standalone domain ---
server {
    listen 80;
    server_name impact-vault-lms.duckdns.org;

    location / {
        proxy_pass http://localhost:3000/impact;
        proxy_set_header Host vault-lms.duckdns.org;

        # IMPORTANT: The /impact prefix is stripped. The Next.js app
        # receives requests as /impact/... but the proxy sends them
        # directly to /impact.
        # Actually, to make this cleaner, we add a rewrite:
        rewrite ^/(.*)$ /impact/$1 break;
        proxy_pass http://localhost:3000;
    }

    # API still works via same backend
    location /api/ {
        proxy_pass http://localhost:5055/api/;
        proxy_set_header Host $host;
    }
}
```

**How it works:**
- Requests to `impact-vault-lms.duckdns.org/school-dashboard` are rewritten to `localhost:3000/impact/school-dashboard`
- Next.js handles the route as `/impact/school-dashboard` as if navigated from within Impact
- The API endpoints (`/impact/schools`, `/impact/assessments`, etc.) continue to work via the same proxy

### Option B: Next.js Hostname Detection

Add hostname detection in a Next.js middleware or the landing page to auto-redirect:

```typescript
// frontend/src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const isImpactDomain = hostname.includes('impact-vault-lms')
    || hostname.includes('impact-lab')
  
  // Redirect impact domain root to /impact
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
**Cons:** Slightly more complex, can affect page load performance.

### Option C: Docker Compose with nginx

If using Docker, add the nginx config as a volume mount:

```yaml
# docker-compose.override.yml (or main compose file)
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/impact-standalone.conf:/etc/nginx/conf.d/impact-standalone.conf:ro
    networks:
      - vault-network
```

---

## 3. Verification Checklist

After configuring the standalone domain, verify:

### 3.1 DNS Resolution
```bash
nslookup impact-vault-lms.duckdns.org
# Should resolve to your server IP
```

### 3.2 Landing Page Loads
```bash
curl -s -o /dev/null -w "%{http_code}" http://impact-vault-lms.duckdns.org/
# Should return 200
```

### 3.3 Impact Routes Work
```bash
# Landing page
curl -s http://impact-vault-lms.duckdns.org/ | grep -c "Impact Intelligence"

# Dashboard
curl -s -o /dev/null -w "%{http_code}" http://impact-vault-lms.duckdns.org/school-dashboard

# Schools
curl -s -o /dev/null -w "%{http_code}" http://impact-vault-lms.duckdns.org/schools

# API
curl -s http://impact-vault-lms.duckdns.org/api/impact/schools | grep -c "schools"
```

### 3.4 Vault Still Works
```bash
curl -s -o /dev/null -w "%{http_code}" http://vault-lms.duckdns.org/
# Should return 200 (Vault main page, not Impact)
```

### 3.5 No Broken Static Assets
```bash
# Check for 404s in the browser console or via:
curl -s http://impact-vault-lms.duckdns.org/ | grep -o '/_next/[^"]*' | head -5 | while read asset; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "http://impact-vault-lms.duckdns.org$asset")
  echo "$asset → $status"
done
```

### 3.6 Browser Test
1. Open `http://impact-vault-lms.duckdns.org/` in a browser
2. Verify Impact Intelligence landing page loads (not Vault)
3. Click "View school dashboard" → should navigate within /impact/*
4. Navigate to Classes → should show class data
5. Verify all six workflow step buttons work
6. Open `http://vault-lms.duckdns.org/` in another tab → Vault should load normally

---

## 4. How to Avoid Breaking Vault

| Risk | Mitigation |
|------|-----------|
| Route clash | The standalone domain rewrites `/` → `/impact/*`. Vault's routes sit outside `/impact/`, so no clash. |
| API CORS | The API already allows all origins in dev (`allow_origins=["*"]`). For production, ensure the impact domain is in the CORS allowlist. |
| Auth cookies | If Vault uses cookie-based auth, the impact domain needs the same cookie. Use a shared parent domain (`.duckdns.org`) or JWT tokens. |
| Static assets | Next.js builds a single set of `/_next/static/*` assets. They work on any domain. |
| SEO | If both domains index, add `<link rel="canonical">` or configure robots.txt. |

### CORS Configuration

```python
# api/main.py — add impact domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://vault-lms.duckdns.org",
        "https://impact-vault-lms.duckdns.org",  # ← add this
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 5. Rollback Plan

```bash
# Remove nginx config for impact domain
sudo rm /etc/nginx/sites-enabled/impact-vault-lms
sudo nginx -s reload

# Or comment out the server block and reload
```

Restarting the Next.js app affects both domains — the frontend process is shared.

---

## 6. Future Considerations

- **Separate repo**: Impact Intelligence could be extracted into its own Next.js app for independent scaling, but this requires significant effort and duplication of shared components.
- **Sub-path hosting**: Instead of a separate domain, Impact could live at `/impact` on the main domain with a prominent link. This is the current setup.
- **SSR/SSG split**: If Impact pages need different caching strategies, consider using Next.js `export` for static generation while keeping Vault on SSR.
