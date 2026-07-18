# HMI design-system verification

Build the frontend, start a fresh production preview on port 3100, then run:

```sh
node ~/.hermes/skills/design-system/scripts/verify-design.mjs \
  --base-url http://127.0.0.1:3100 \
  --routes /impact-intelligence,/impact-intelligence/style-guide \
  --manifest frontend/design-system/motion-targets.json \
  --output-dir test-results/design-system
```

The verifier captures 1440px and 390px screenshots and checks normal and reduced-motion computed styles. It expects a fresh, already-running production build and does not start or restart the server.
