# Vault Frontend Stability Report

Date: 2026-07-02
Repo: `/root/vault-vault`
Frontend artifact: `/root/vault-vault/frontend/.next/standalone/server.js`
Verification scope: isolated standalone runtime on `127.0.0.1:3003` only

## Executive Verdict
The Vault frontend production build is **functionally verified and short-run stable** when run as a standalone Next.js server on `127.0.0.1:3003`, with backend proxying to FastAPI at `127.0.0.1:5055` working correctly.

A 5-minute soak test completed cleanly with zero route failures and zero process deaths. Within the scope of this verification — isolated localhost runtime correctness plus short-duration uptime under repeated probing — the artifact now meets the bar for a **stable runtime baseline**.

The host VPS is still under severe memory pressure, and an older unrelated `next-server` OOM event remains visible in kernel logs from earlier in the session. That environmental risk should stay documented, but it did **not** reproduce during the isolated 3003 soak.

## Initial Verification
The standalone server was started from the built artifact and bound to `127.0.0.1:3003`.

Environment used:
- `NODE_ENV=production`
- `PORT=3003`
- `HOSTNAME=127.0.0.1`
- `INTERNAL_API_URL=http://127.0.0.1:5055`
- `NEXT_PUBLIC_API_URL=http://127.0.0.1:5055`
- `API_URL=http://127.0.0.1:5055`
- `NODE_OPTIONS=--max-old-space-size=2048`

Startup log evidence:
```text
▲ Next.js 16.2.6
- Local:         http://127.0.0.1:3003
- Network:       http://127.0.0.1:3003
✓ Ready in 0ms
```

Initial route check on port 3003 only:

| Route | Result | Notes |
|---|---:|---|
| `/notebooks` | 200 | Returned full HTML page; contained `Vault` and `/_next/static/` |
| `/api/settings` | 200 | Returned real JSON settings payload |
| `/api/notebooks` | 200 | Returned `[]` |
| `/api/sources` | 200 | Returned `[]` |
| `/api/notes` | 200 | Returned `[]` |

The frontend `/api/settings` response matched the live backend keyset, confirming the proxy path is hitting FastAPI rather than fallback content.

## 5-Minute Soak Test
Date/time window:
- Start: `2026-07-02T16:32:47+00:00`
- End: `2026-07-02T16:37:53+00:00`
- Duration: ~`305.2s`

Method:
- isolated probing against `127.0.0.1:3003` only
- routes repeatedly checked every ~10 seconds:
  - `/notebooks`
  - `/api/settings`
  - `/api/notebooks`
  - `/api/sources`
  - `/api/notes`
- after each round, the standalone process was checked for liveness

Results:
- rounds completed: **30**
- total route probes: **150**
- process alive checks: **30**
- route failures: **0**
- process death events: **0**

Per-route outcome summary:

| Route | Successes | Failures | Status pattern | Response size |
|---|---:|---:|---|---:|
| `/notebooks` | 30 | 0 | always `200` | 17802 bytes |
| `/api/settings` | 30 | 0 | always `200` | 239 bytes |
| `/api/notebooks` | 30 | 0 | always `200` | 2 bytes |
| `/api/sources` | 30 | 0 | always `200` | 2 bytes |
| `/api/notes` | 30 | 0 | always `200` | 2 bytes |
| `process alive` | 30 | 0 | always `alive` | n/a |

Raw soak evidence file:
- `/root/vault-vault/.run/soak_3003_results.jsonl`

## Memory / Swap Pressure
Measured before and after the soak:

| Metric | Before | After | Interpretation |
|---|---:|---:|---|
| Free memory | 260 MiB | 251 MiB | slight drift only |
| Available memory | ~1.4 GiB | ~1.4 GiB | effectively unchanged |
| Swap usage | 2.0 GiB / 2.0 GiB | 2.0 GiB / 2.0 GiB | fully used, but stable |
| Standalone RSS | 90,148 KiB | 95,620 KiB | modest increase only |
| Standalone PID | 1716785 | 1716785 | process survived intact |

Interpretation:
- the host remains memory-constrained
- however, the isolated Vault standalone runtime did **not** exhibit runaway growth or crash behavior during the 5-minute soak

## OOM / Kill Signal Review
Checked before and after the soak:
- `dmesg`
- `journalctl --since '10 minutes ago'`

Result:
- **no fresh OOM events** during the soak
- **no fresh kill signals** for the Vault standalone process during the soak
- the only visible OOM evidence is the earlier historical event involving a different `next-server` PID from before this isolated verification

## Important Isolation Note
Ports `3000` and `3002` were explicitly excluded from verification because they may be influenced by unrelated Aetherlink / PM2 runtime behavior. All evidence in this report comes from port `3003` only.

## Build Artifact Status
Confirmed present:
- `frontend/.next/standalone/server.js`
- `frontend/.next/standalone/node_modules/`
- `frontend/.next/standalone/.next/static/`
- `frontend/.next/standalone/public/`

## Backend Status During Verification
Backend health endpoint responded successfully:
- `http://127.0.0.1:5055/health` → `200 OK`

The frontend proxy endpoints matched a live backend rather than mocked fallback content.

## Caveats
1. **Host memory pressure remains severe**
   - swap is fully consumed
   - other workloads on this VPS could still trigger future OOM conditions
2. **This is a light-load verification**
   - the soak proves short-run stability under repeated probes
   - it does not prove behavior under heavy concurrency or long multi-hour uptime
3. **No supervision / auto-restart layer was verified**
   - this report verifies the artifact and runtime behavior, not full service management
4. **Empty arrays are expected here**
   - `[]` from notebooks, sources, and notes is consistent with an empty dataset, not a defect

## Tag Recommendation
**Create `vault-stable-runtime-baseline`.**

Justification:
- the standalone build artifact exists and boots cleanly
- all required frontend and proxy routes returned `200`
- the proxy behavior matches the real backend
- the 5-minute isolated soak completed with **0 failures across 150 route probes**
- the standalone process remained alive for all 30 liveness checks
- no fresh OOM / kill events were recorded during the soak

Recommended tag target:
- commit: `14ba8f51e81f34855cd21c390f2576215d8808dd`

Recommended tag message:
```text
Frontend standalone runtime verified stable on 127.0.0.1:3003 over 5-minute soak test. 0 failures. See VAULT_FRONTEND_STABILITY_REPORT.md for full evidence.
```

## Bottom Line
The Vault frontend build is **production-runnable and verified stable for the defined validation scope** on `127.0.0.1:3003`. Environmental memory pressure remains a real VPS concern, but the repository artifact itself now has enough direct evidence to justify the tag `vault-stable-runtime-baseline`.
