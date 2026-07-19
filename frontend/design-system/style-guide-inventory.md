# Style-guide inventory

Gate status: `draft`  
Approver/date: `Kade / 2026-07-18`

Statuses are `draft`, `approved`, or `changed`. Any shared token/component change returns affected rows to `changed`.

| Component/foundation | Variants | States | Responsive coverage | Accessibility evidence/result | Owner | Status |
|---|---|---|---|---|---|---|
| Color foundations | Landing navy/gold/teal; dashboard violet/gold dark and light | contrast, semantic accent, focus | 390; 1440 | `DESIGN.md` contrast table; AA text pairs, dashboard dark violet with white restricted by size/use | Kade | draft |
| Typography | Fraunces display; Inter body/UI | scale, weights, long text | 390; 1440 | Self-hosted fonts with swap; semantic heading order; reflow review pending | Kade | draft |
| Button | Landing primary gold; landing secondary outline; dashboard primary violet | default, hover, focus, active, disabled, loading | 390; 1440 | 44px minimum target, visible focus, accessible name; catalog review pending | Kade | draft |
| Card | Landing surface/raised; dashboard surface/raised; static and interactive | default, hover, focus, selected, empty | 390; 1440 | Semantic article/heading order and non-color cues; catalog review pending | Kade | draft |
| Navigation | Landing desktop/mobile; dashboard expanded/collapsed | active, focus, open, collapsed | 390; 1440 | Landmark, keyboard order, named icon controls; source implementation reviewed | Kade | draft |
| Chart | Recharts bar, line, pie/donut and supporting treatments | tooltip, loading, empty, error | 390; 1440 | Role/name plus legend or text alternative and non-color cues required | Kade | draft |
| Marketing composition | Landing hero with signature graphic and evidence panel | realistic approved copy; normal/reduced motion | 390; 1440 | Real HMI copy only; graphic hidden under 900px; AA overlay intent documented | Kade | draft |
| Dashboard composition | Impact overview and product shell | dark/light, loading, empty, error, seeded data | 390; 1440 | Reading order, disclosure, labeled charts and table fallback review pending | Kade | draft |

Approval notes and reopened rows: `2026-07-18: initial inventory created from landed implementation. All rows remain draft pending visual review at 390px and 1440px.`
