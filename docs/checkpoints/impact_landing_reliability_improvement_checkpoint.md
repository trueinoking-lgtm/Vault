# Impact Landing Reliability + Evidence Flow Checkpoint

**Date:** 2026-07-08  
**Scope:** `/impact-intelligence` public landing page, standalone frontend reliability, and live ZimLearnGraph domain smoke coverage.

## Summary

This checkpoint improves ZimLearnGraph according to the review priorities:

1. make the live deployment reliable enough for demo/pilot use,
2. make the landing page prove the product workflow more concretely,
3. surface trust/governance language earlier,
4. show school-ready report outputs beyond dashboards,
5. make the controlled pilot offer more specific.

## Product framing preserved

- Teacher-marked assessments remain the source of truth.
- Deterministic analysis is positioned before AI.
- AI is described as advisory only.
- Learner language remains support-oriented and non-punitive.
- The product is framed as an assessment evidence layer, not an AI grader or teacher replacement.

## User-facing landing changes

### New sections/components

- `frontend/src/components/landing/ImpactWorkflowProof.tsx`
  - Concrete six-step journey from mark book to support plan.
  - Steps: enter marks, map questions, read weak topics, plan support, track change, report evidence.

- `frontend/src/components/landing/ImpactReportOutputs.tsx`
  - Explains the operational outputs schools can use.
  - Outputs: teacher reteach brief, learner support summary, school improvement snapshot, pilot impact report.

- `frontend/src/components/landing/ImpactTrustPanel.tsx`
  - Adds trust/governance language.
  - Covers teacher judgement, deterministic analysis, AI advisory-only, and learner-safe reporting.

### Updated sections/components

- `ImpactHero.tsx`
  - Stronger premium hero with proof points and evidence signal panel.

- `EvidenceSignalPanel.tsx`
  - Visualizes marks becoming support signals.

- `ImpactEvidenceStrip.tsx`
  - Shows product principles immediately after the hero.

- `ImpactHowItWorks.tsx`
  - Reworded away from implementation/motion jargon toward product workflow proof.

- `ImpactPilot.tsx` + `impact-copy.ts`
  - Pilot offer is now more concrete: one school, one class, one subject, one teacher-marked assessment, one support cycle, one report.

- `SectionEntrance.tsx`
  - Added safety fallback so sections do not remain invisible if browser animation/intersection observers are delayed or constrained.

## Reliability/deployment changes

- `deploy/systemd/vault-frontend.service`
  - Corrected `WorkingDirectory` to `/root/vault-open-notebook/frontend`.
  - Corrected `ExecStart` to use available Node runtime: `/root/.hermes/node/bin/node`.

- Systemd service installed and enabled:
  - `vault-frontend.service` is active.
  - `vault-frontend.service` is enabled for reboot survival.

- `scripts/smoke_vault_live.sh`
  - Added `/impact-intelligence` route check.
  - Added `/favicon.ico` and `/favicon.svg` GET checks.
  - Added `/impact-intelligence` and `/impact/school-dashboard` to static asset extraction coverage.

- `.gitignore`
  - Added `frontend/.vault-static-cache/` so deploy preservation cache is not committed.

- `frontend/public/favicon.ico`
  - Added browser-compatible favicon to stop `/favicon.ico` errors.

## Verification evidence

### Build

```bash
npm run build
```

Result:

```txt
✓ Compiled successfully
✓ Finished TypeScript
✓ Generating static pages (30/30)
○ /impact-intelligence
```

### Targeted lint

```bash
npx eslint \
  src/components/landing/ImpactProblem.tsx \
  src/components/landing/ImpactIntelligenceLayers.tsx \
  src/components/landing/ImpactMetrics.tsx \
  src/components/landing/ImpactIntervention.tsx \
  src/components/landing/ImpactPilot.tsx \
  src/components/landing/ImpactCTA.tsx \
  src/components/landing/ImpactWorkflowProof.tsx \
  src/components/landing/ImpactTrustPanel.tsx \
  src/components/landing/ImpactReportOutputs.tsx \
  src/components/landing/ImpactLandingPage.tsx \
  src/components/landing/SectionEntrance.tsx \
  src/lib/landing/impact-copy.ts \
  next.config.ts
```

Result: no output, exit code `0`.

### Deployment

```bash
VAULT_BASE_URL=https://zimlearngraph.duckdns.org \
  bash scripts/deploy_vault_frontend_standalone.sh --restart-systemd
```

Result:

```txt
Build complete
New static files copied: 165 files
Chunks directory validated: 95 files
Media directory validated: 67 files
Final standalone static: 179 files
Vault frontend restarted via systemd
Service is active (running)
```

### Live checks

```txt
systemctl is-active vault-frontend.service -> active
systemctl is-enabled vault-frontend.service -> enabled
https://zimlearngraph.duckdns.org/impact-intelligence -> 200
https://zimlearngraph.duckdns.org/favicon.ico -> 200
http://127.0.0.1:3003/impact-intelligence -> 200
```

### Static assets

```txt
/impact-intelligence assets_checked 21
/impact/school-dashboard assets_checked 22
```

All checked assets returned HTTP 200.

### Browser QA

- Live `/impact-intelligence` loaded successfully.
- Browser console reported no JS errors.
- Hero, workflow proof, report outputs, trust panel, pilot offer, and CTA rendered visibly.
- Visibility fallbacks were added after QA showed some scroll-triggered sections could appear blank in a full-page capture before intersection animations fired.

## Remaining known risks

- Repo-wide lint still has unrelated pre-existing issues outside this scoped landing/deployment surface.
- Full commercial docs in `docs/commercial/` were not expanded in this pass.
- Further product depth should focus on mark import UX and exportable PDF/report generation.
