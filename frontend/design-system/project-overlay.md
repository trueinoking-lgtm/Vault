# Project design overlay

- Project/scope: `HiveMind Intelligence landing and dashboard, including /impact-intelligence/style-guide`
- Status: `verified`
- Provenance: `Landed HMI redesign specification supplied by Kade ("Inter/Manrope for body"); frontend/src/app/globals.css; approved landing and dashboard implementation`
- Approver: `Kade / product owner`
- Approved/review date: `2026-07-18 / 2026-07-18`

## Brand assets and type

| Asset/font | Source | Usage/rules | Verification |
|---|---|---|---|
| HiveMind mark | `frontend/public/hivemind-mark.svg` | Existing navigation and product identity; do not redraw | Landed asset and current usage |
| Fraunces 600 | `frontend/public/fonts/fraunces-600.woff2` | Landing display headings through `--font-impact-display` | `@font-face` and token mapping in globals.css |
| Inter 400/500/600/700 | `frontend/public/fonts/inter-*.woff2` | Required body and UI face across HMI | Landed redesign specification and `@font-face` declarations |

Inter requirement (normally disallowed): `Required. The existing HMI brand requirement is documented in the landed redesign specification as "Inter/Manrope for body". The implemented system selected self-hosted Inter. This narrowly waives the Picaso Inter-disallow for HMI only.`

## Semantic accents

| Token/name | Hex | Exclusive meaning | Contrast pairs | Source |
|---|---:|---|---|---|
| Data/network accent | `#2FA8A0` | Data, network relationships, connected evidence | `#2FA8A0 / #0A0E17 = 6.64:1` | Landing tokens in globals.css |
| Human/equity accent | `#C9A227` | Human impact, equity, primary decision signal | `#C9A227 / #0A0E17 = 7.98:1` | Landing tokens in globals.css |
| Dashboard emphasis gold, dark | `#E8B84B` | Product-app emphasis and highlighted evidence in dark mode | `#E8B84B / #0B0C10 = 11.42:1` | Dashboard tokens in globals.css |
| Dashboard emphasis gold, light | `#C9971F` | Product-app emphasis and highlighted evidence in light mode | `#C9971F / #14171F = 6.35:1` | Dashboard tokens in globals.css |

Two landing accents are verified because their meanings are distinct. Dashboard gold intentionally differs from landing gold to suit the dashboard's violet system and light/dark surfaces.

## Icons and motion

- Exactly one non-default icon set: `lucide-react 0.525.0`
- Icon usage: `16/20/24px, currentColor, 1.8-2px stroke, no mixed icon libraries, visible label or accessible name required.`
- Motion visibility targets: `Signature pulse: 5s, scale 1 to 1.035, opacity 0.55 to 0.8; node glow: 2.8s, opacity 0.45 to 1; dust: 24-54s vertical travel; graphic hidden below 900px.`
- Reduced-motion behavior: `Signature and node animations stop and freeze at 0.65/0.75 opacity; dust and orbit animations stop; SVG signal dots are hidden; hover transforms stop.`

## Narrow exceptions

| Route/selector | Base rule | Exception and rationale | Measurable acceptance | Source/approver/review date |
|---|---|---|---|---|
| HMI body/UI text | Picaso disallows Inter as a default | Inter is an existing HMI brand requirement, not a default selection | Self-hosted Inter 400/500/600/700 loads and is mapped to HMI body/UI | Landed redesign spec ("Inter/Manrope for body") / Kade / 2026-07-18 |
| `/impact-intelligence` `.hero-signature-graphic` | Important hero visuals must remain legible | Graphic is intentionally restrained behind a darkening radial overlay to preserve WCAG AA text contrast | `graphic-pulse` opacity 0.55 to 0.8; hidden below 900px; reduced-motion freezes at 0.65 | Approved landing implementation / Kade / 2026-07-18 |
| `/impact-intelligence` gold and teal tokens | Prefer one accent unless semantics require two | Gold means human/equity; teal means data/network | Both meanings remain distinct in labels, composition, or non-color cues; exact hex values retained | globals.css / Kade / 2026-07-18 |
| Dashboard `--accent-gold` | Shared brand accents often use one value | Dashboard gold is mode-specific and intentionally differs from landing gold | Dark `#E8B84B`, light `#C9971F`, landing unchanged at `#C9A227` | globals.css / Kade / 2026-07-18 |

This overlay cannot waive contrast, reduced motion, keyboard/focus behavior, or content integrity.
