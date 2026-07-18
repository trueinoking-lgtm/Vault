# DESIGN.md

## Decision record

- Product/scope: `HiveMind Intelligence landing (/impact-intelligence and /impact-intelligence/style-guide) and dashboard (/impact/*)`
- Status: `draft`
- Owner / approver / date: `Kade / Kade / 2026-07-18`
- Canonical token file: `frontend/src/app/globals.css`
- Reference input: `Landed HMI redesign specification supplied by Kade, including "Inter/Manrope for body"; implemented landing and dashboard source in frontend/src`
- Borrowed qualities: `Existing hierarchy, information density, typography, and motion only. The style guide documents the approved products and does not replace their compositions.`
- Approved overlay: `frontend/design-system/project-overlay.md (verified, 2026-07-18)`

## Picaso design read

- Design Read: `A documentation catalog for an approved two-product HMI system, for maintainers and reviewers, with a restrained editorial and technical language.`
- Three dials: `DESIGN_VARIANCE 5/10; MOTION_INTENSITY 5/10; VISUAL_DENSITY 6/10`
- Anchor: `The landing signature network graphic: gold human/equity nodes and teal data/network paths on a navy field.`
- Priority constraints: `P1 WCAG AA contrast, visible focus, and reduced motion; P2 preserve the approved hero asset and 44px minimum controls; P3 self-hosted fonts; P4 real product copy only; P5 reflow at 390px without horizontal scrolling; P6 the verified Inter and dual-accent exceptions apply only as recorded in the overlay.`

## Semantic colors

HMI has two related but intentionally distinct product systems. Landing is navy, gold, and teal and has no light variant. Dashboard is violet and gold with dark and light modes. Dashboard theme selection defaults to dark and persists under localStorage key `hm-theme`.

| Role | Light hex | Dark hex (if supported) | Foreground | Contrast result | Meaning |
|---|---:|---:|---:|---:|---|
| Landing background | N/A | `#0A0E17` | `#F4F5F7` | `17.69:1 / pass` | Marketing canvas |
| Landing surface | N/A | `#121826` | `#F4F5F7` | `16.25:1 / pass` | Cards and panels |
| Landing raised surface | N/A | `#1A2233` | `#F4F5F7` | `14.50:1 / pass` | Nested or emphasized content |
| Landing border | N/A | `rgba(201,162,39,0.16)` | N/A | `decorative boundary` | Low-emphasis gold boundary |
| Landing primary / human | N/A | `#C9A227` | `#0A0E17` | `7.98:1 / pass` | Primary action, human/equity signal |
| Landing data | N/A | `#2FA8A0` | `#0A0E17` | `6.64:1 / pass` | Data/network signal and secondary focus |
| Landing secondary text | N/A | `#8B93A7` | `#0A0E17` | `6.28:1 / pass` | Supporting copy |
| Landing silver | N/A | `#C7CCD6` | `#0A0E17` | `12.24:1 / pass` | High-emphasis supporting copy |
| Dashboard background | `#F7F8FA` | `#0B0C10` | `#14171F` / `#F5F6F8` | `16.86:1 / 18.08:1, pass` | Product canvas |
| Dashboard surface | `#FFFFFF` | `#16171D` | `#14171F` / `#F5F6F8` | `17.98:1 / 16.52:1, pass` | Cards and shell |
| Dashboard raised surface | `#F1F2F4` | `#1D1F27` | `#14171F` / `#F5F6F8` | `15.85:1 / 14.74:1, pass` | Controls and nested panels |
| Dashboard border | `#EBEDF1` | `#2A2C35` | N/A | `boundary; pair with shape/spacing` | Subtle separation |
| Dashboard primary | `#6D5DE8` | `#7C6CF0` | `#FFFFFF` | `4.79:1 pass / 3.99:1 large-text or non-text only` | Primary action and active state |
| Dashboard gold | `#C9971F` | `#E8B84B` | `#14171F` / `#0B0C10` | `6.35:1 / 11.42:1, pass` | Dashboard-specific emphasis |
| Dashboard success | `#15803D` | `#34D399` | mode background | `4.56:1 / 9.25:1, pass` | Positive state |
| Dashboard warning | `#B45309` | `#F5A524` | mode background | `5.19:1 / 9.66:1, pass` | Warning state |
| Dashboard danger | `#DC2626` | `#F0554C` | mode background | `4.56:1 / 5.66:1, pass` | Destructive or error state |
| Focus ring | `#6D5DE8` | landing `#C9A227`; dashboard `#7C6CF0` | N/A | `2px visible ring plus offset / pass by treatment` | Keyboard focus |

Soft landing fills are `--gold-soft: rgba(201,162,39,0.12)` and `--teal-soft: rgba(47,168,160,0.12)`. They are backgrounds and never substitutes for text contrast.

## Typography and spacing

- Families and provenance: `Fraunces 600, self-hosted WOFF2, is the landing display face via --font-impact-display. Inter 400/500/600/700, self-hosted WOFF2, is required for body and UI by the landed HMI redesign specification ("Inter/Manrope for body") and is used by both systems.`
- Available weights: `Fraunces 600; Inter 400, 500, 600, 700.`
- Type scale: `display-xl 64px/1.02/600; display-lg 48px/1.05/600; heading-xl 36px/1.15/600; heading-lg 28px/1.2/600; heading-md 22px/1.3/600; body-lg 18px/1.65/400; body 16px/1.65/400; body-sm 14px/1.55/400; label 12px/1.4/600.`
- Spacing (4px base): `1: 4px; 2: 8px; 3: 12px; 4: 16px; 5: 20px; 6: 24px; 8: 32px; 10: 40px; 12: 48px; 16: 64px; 20: 80px; 24: 96px.`
- Breakpoints: `compact: 390px review viewport; hero graphic: hidden below 900px; lg: 1024px major grid reflow; wide: 1440px review viewport.`
- Radii / borders / shadows: `controls: full pill or 8px; cards: 18px; feature panels: 28px; dashboard shell: 32px; borders: 1px solid semantic border; elevation uses restrained, accent-tinted shadows only for hierarchy.`

## Component treatments

| Component | Tokens/density | Radius/elevation | Type/icon | Required states |
|---|---|---|---|---|
| Button | Landing gold primary, border secondary; dashboard violet primary | Pill on landing; established dashboard radius; no default glow | Inter 600; Lucide 16px when needed | default, hover, focus, active, disabled, loading |
| Input | Dashboard raised surface, subtle border, primary focus | 12px; no decorative shadow | Inter 400; label above control | default, focus, disabled, error |
| Card | Product surface and semantic border | 18px landing; 16px dashboard; selective elevation | Inter body, Fraunces only for marketing headings; Lucide | default, interactive, selected |
| Dialog | Dashboard raised surface and overlay | Existing Radix/shadcn treatment | Inter; Lucide close control | open, focus trap, reduced motion |
| Table | Dashboard surface with subtle separators | Container radius only | Inter, tabular numeric data | loading, empty, error, selected |
| Navigation | Landing navy/gold; dashboard surface/violet active | 44px minimum targets | Inter; Lucide dashboard icons | active, focus, collapsed/mobile |
| Chart | Dashboard semantic palette through Recharts | Card container treatment | Inter labels; text alternative required | tooltip, empty, error, color-independent meaning |

## Icons and motion

- Single non-default icon set: `lucide-react 0.525.0, already established across landing and dashboard.`
- Icon rules: `16, 20, or 24px; inherit currentColor; approximately 1.8 to 2px stroke; align to text baseline or centered control; aria-hidden when a visible label exists and aria-label on icon-only controls.`
- Motion intent: `The signature graphic makes the human/equity and data/network relationship legible through continuous pulse, orbit, node glow, and signal travel. Ambient dust provides depth without carrying meaning. Interaction motion confirms hover or state change.`
- Durations/easings: `graphic-pulse 5s ease-in-out infinite, node-glow 2.8s ease-in-out infinite, orbits 70s/90s linear infinite, dust 24-54s linear infinite, interaction 150-300ms.`
- Reduced-motion behavior: `All landing keyframe animation and transition motion stops. Graphic pulse freezes at opacity 0.65, node glow at 0.75, signal dots are hidden, dust stops, and hover transforms are removed.`

## Accessibility pairs and checks

| Foreground / background | Ratio | Text size/use | Result |
|---|---:|---|---|
| `#F4F5F7 / #0A0E17` | `17.69:1` | Landing primary text | Pass AA/AAA |
| `#8B93A7 / #0A0E17` | `6.28:1` | Landing supporting text | Pass AA |
| `#C9A227 / #0A0E17` | `7.98:1` | Landing accent text and focus | Pass AA/AAA |
| `#2FA8A0 / #0A0E17` | `6.64:1` | Landing data accent text | Pass AA |
| `#F5F6F8 / #0B0C10` | `18.08:1` | Dashboard dark primary | Pass AA/AAA |
| `#A0A5B4 / #0B0C10` | `7.95:1` | Dashboard dark secondary | Pass AA/AAA |
| `#14171F / #F7F8FA` | `16.86:1` | Dashboard light primary | Pass AA/AAA |
| `#5B6472 / #F7F8FA` | `5.63:1` | Dashboard light secondary | Pass AA |

Keyboard order follows document order; visible focus rings use the product accent with offset; primary controls retain at least 44px height; 390px layouts reflow to one column; no content is encoded by color alone; motion respects `prefers-reduced-motion`. The style guide is documentation and includes no fabricated claims or data.

## Approval log

| Date | Reviewer | Decision | Scope/evidence |
|---|---|---|---|
| `2026-07-18` | Kade | `draft` | Exact tokens transcribed from `frontend/src/app/globals.css`; style-guide route and motion manifest authored for review. |
