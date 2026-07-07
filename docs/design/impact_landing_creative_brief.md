# ZimLearnGraph Impact — Landing Page Creative Brief & Technical Spec

**Document Version:** 1.0.0  
**Status:** Phase L1 (Draft)  
**Date:** July 07, 2026  
**Author:** Hermes Agent (Aether Systems Architect)  

---

## 1. Project Identity & Brand Direction

### 1.1 Product Overview
**ZimLearnGraph Impact** (also presented as **Impact Intelligence**) is a highly specialized, institutional-grade educational analytics platform. The system ingests raw teacher-marked assessment scores, maps them to granular topic indices and question structures, and surfaces deterministic intelligence layers (weak-topic analysis, student risk warning tracks, intervention maps, and regional/school-level dashboards). 

### 1.2 Core Brand Message
> **“Turn marked tests into learning intelligence.”**

### 1.3 Key Brand Principles & Tone Guidelines
* **Tone:** Confident, premium, analytical, institutional, futuristic but strictly grounded. It should feel like *Palantir for Education Systems*.
* **Audience:** School heads, regional inspectors, ministry stakeholders, and serious educators.
* **Content Constraints & Safeguards (Deterministic Focus):**
  * **No Replacements:** Never frame the system as a replacement for teachers. It is *teacher support* and *learning evidence*.
  * **No Automarking:** Avoid claiming the system automatically marks exams. The teacher marks; the system synthesizes.
  * **No Ministry Integration Claims:** Frame the ministry-level dashboard as a demonstrative/scale prototype, not as active national integrations.
  * **No Gimmicks:** No childish graphics, gamified badges, cartoon notebooks, or generic "AI brain" stock visuals.
  * **No AI Overuse:** Deterministic analytics (sums, weighted topic scores, progress delta formulas) are the engine. AI is presented as optional scaffolding (e.g., automated draft generation of localized lesson recommendations).

---

## 2. Visual Concept & Narrative Flow

### 2.1 The Cinematic Narrative: "The Intelligence Field Waking Up"
The landing page tells a sequential story of structured transformation, mapping directly to physical data visualisations in the 3D scene:

1. **Step 1: Raw Marks (Entropy):** Floods of unstructured, chaotic glowing particles representing single item-level data points (student $S_i$ scoring $M$ on Question $Q_j$).
2. **Step 2: Structured Assessment Cards:** Particles gather and organize into translucent, floating visual representations of exam paper question cards (e.g., $Q_1$, $Q_2$, $Q_3$).
3. **Step 3: Topic Mapping:** Glow-streams connect these question cards to centralized, clustered floating topic nodes (e.g., *Fractions*, *Ratios*, *Percentages*).
4. **Step 4: Weak-Topic Detection (Warning Track):** Low-performing topic clusters begin to pulse in a warning color (amber/gold), demonstrating how the system flags curriculum vulnerabilities.
5. **Step 5: Learner Risk Signals:** Nodes of students failing multiple core topics pull away into a distinct "Risk cluster," pulsing red-orange to signify urgent support needs.
6. **Step 6: Intervention Mapping:** A glowing document pane slides out from the weak-topic node, rendering a structured lesson recommendation card (turning analytics into action).
7. **Step 7: School / Ministry Aggregate Intelligence:** The entire network camera pulls back to stack these views into layered, clean glassmorphic dashboard decks representing aggregate school performance.

### 2.2 Color Palette
* **Base Environment:** Midnight Blue, Graphite `#02040a`, Near Black `#050814` to maximize depth and glowing highlights.
* **Insight/Healthy Signal:** Electric Cyan `#00f0ff`, Cobalt Blue `#1e40af` (represents standard proficiency and system stability).
* **Vulnerability warning:** Amber/Gold `#f59e0b` (signifies weak-topic hotspots).
* **Intervention alert:** Red-Orange `#f97316` (signifies learner-at-risk warnings).
* **System Growth (Sparse):** Emerald Green `#10b981` (signifies positive improvement deltas).

---

## 3. Page Structure & Wireframe

### Route Strategy
The page will live at the public-facing route:  
`/impact-intelligence` (or `/impact/landing` matching standalone configuration).

---

### Section-by-Section Wireframe Layout

#### Section 1: Cinematic Hero
* **Purpose:** Uncompromising premium first impression. Establish scale.
* **Headline:** "Turn marked tests into learning intelligence."
* **Subheadline:** "ZimLearnGraph Impact transforms teacher-marked assessments into weak-topic analysis, learner support signals, intervention plans, and school-level evidence."
* **CTAs:**
  * Primary: `View live demo` (href: `/impact`) — high-contrast glow button.
  * Secondary: `Request a pilot` (anchor to contact/email section).
* **WebGL Behavior:** Scene displays chaotic floating particles in deep space, slowly assembling into floating assessment cards. Subtle camera parallax tracking mouse cursor.
* **Micro Trust Strip:**
  * `Assessment-driven` | `Teacher-first` | `School-ready` | `Privacy-conscious` | `Evidence-focused`

#### Section 2: The Problem (The "Trapped Signal")
* **Purpose:** Validate pain points with institutional gravity.
* **Copy:** 
  > *"Every marked test contains a critical learning signal. Which questions exposed misconceptions? Which topics need urgent re-teaching? Which learners are falling behind? Yet, after recording the final score, this vital diagnostic intelligence is buried forever inside paper mark books and static spreadsheets."*
* **WebGL Behavior:** Camera tracks downward. Particles become unstructured grid lists of raw scores. A scan line sweeps across, highlighting raw entries and breaking them down into glowing vector streams.

#### Section 3: How It Works (The Pipeline)
* **Purpose:** Render the product logical and highly operational.
* **Steps:**
  1. **Record Marks:** Teachers input raw assessment matrices.
  2. **Index Topics:** Questions map directly to curricular topic graphs.
  3. **Diagnose Weakness:** System isolates systemic class-wide topic gaps.
  4. **Flag Risk:** At-risk learner profiles are isolated programmatically.
  5. **Recommend Actions:** Formative teaching intervention scripts are generated.
  6. **Evidence Growth:** Re-testing tracks improvement over time.
* **Layout:** Horizontal interactive pipeline cards. Hovering or active step states send pulse triggers directly to the WebGL background scene, showing the transition from question mapping to network grouping.

#### Section 4: Intelligence Layers (Multi-level Stakeholder Value)
* **Purpose:** Address different tiers of decision-makers.
* **Layout:** A 3-column or 3-step vertical accordion of deep glassmorphism panels.
  * **Teacher Layer:** Class-level weak topics, question difficulty index, and classroom support lists.
  * **School Layer:** Departmental progress comparisons, teacher diagnostic rates, and intervention audits.
  * **Stakeholder/Ministry Layer:** Anonymized regional performance heatmaps and curriculum coverage indices.
* **WebGL Behavior:** The 3D view morphs into a vertically stacked architectural representation of three glowing planes (Lower: raw items -> Middle: class groups -> Upper: system-wide reports).

#### Section 5: Empirical Proof (Live-Seeded Metrics)
* **Purpose:** Hard data backing the aesthetic authority.
* **Metrics displayed:**
  * **30** Learners Assessed
  * **8** Key Curricular Questions
  * **50%** Diagnostic Pass Rate
  * **5** Systemic Weak Topics Identified
  * **15** Learners Isolated for Target Support
  * **240** Marked Nodes Synthesized
* **Layout:** Clean grid of large numbers using precise monospace typography with a slow count-up animation, tied to glowing network stats highlighted in the WebGL viewport.

#### Section 6: Actionable Intervention Intelligence
* **Purpose:** Prove the product is a tool for active remediation, not just a passive dashboard.
* **Layout:** A split-pane screen. Left pane contains a realistic sample Intervention Card:
  ```yaml
  Focus Area: Ratio Simplification & Scaling
  Class Average Score: 32% (Critical Vulnerability)
  Remediation Recommendation: 
    - Re-teach simplifying compound ratios (3-part) using grid tiles.
    - Deploy targeted practice worksheet (ID: RM-302).
    - Schedule a 10-minute micro-assessment in 7 days.
  ```
* **WebGL Behavior:** The viewport targets a specific cluster node representing *Ratios*. It pulses gold/amber. The intervention card slides out directly from this node in screen-space, and upon a simulated re-test trigger, the connected paths transition to emerald green.

#### Section 7: Controlled Pilot Offer
* **Purpose:** Low-friction high-impact institutional offer.
* **Framework:**
  * **1** Primary School / Class / Subject
  * **1** Initial Diagnostic Assessment Run
  * **1** Standard Remediation Intervention Loop
  * **1** Outcome Report (Quantifying Learning Recovery)
* **Layout:** Highly structured, minimalist border card resembling a security or institutional certificate.

#### Section 8: Final Call to Action
* **Copy:** 
  > *"Move from marks to measurable learning impact."*
* **CTAs:**
  * `Book a Walkthrough` (triggers mailto or scheduled contact form).
  * `Explore Live Demo` (routes to `/impact`).

---

## 4. Technical & WebGL Scene Architecture

### 4.1 Rendering Strategy & Hydration
Because high-fidelity WebGL scenes can block SSR pipelines and inflate TTFB if not handled carefully, we will use a **Dynamic Client-Side Shell hydration model**:

* **Next.js Server Components:** The text content, layout skeletons, structural grids, and CTAs render as Server Components for optimal SEO, layout-shift mitigation, and indexability.
* **Deferred Canvas Loading:** The `Canvas` wrapper from React Three Fiber (`R3F`) is dynamically imported with `{ ssr: false }`.
* **Fallback State:** While the 3D context is compiling and compiling shaders, a high-quality, pure CSS animated gradient with subtle canvas-grid shadows represents the "Intelligence Field" background.

```tsx
// Pattern for client hydration
const HeroScene = dynamic(() => import('@/components/landing/impact/HeroScene'), {
  ssr: false,
  loading: () => <HeroSceneFallback />
})
```

### 4.2 WebGL Scene Objects (R3F Hierarchy)
1. **`DataParticleField`**: An instanced mesh (`THREE.InstancedMesh`) handling up to 5,000 individual particle points. Their positions, scales, and colors are manipulated using a custom vertex shader or via instance matrices updated in the animation loop.
2. **`NetworkGraph`**: A set of spheres representing topics/questions (`THREE.SphereGeometry`) and lines (`THREE.LineSegments` or custom tube meshes) rendering the relational curriculum links.
3. **`FloatingDashboardPlanes`**: Rendered flat planes with custom fragment shaders showing glowing gridlines and dynamic metrics, positioned in 3D coordinate space.
4. **`PostProcessingEffects`**: Cinematic camera rendering setup:
   * **Bloom:** Configured using selective bloom so only glowing particles, warning nodes, and data lines emit light (preventing washing out the glass panels).
   * **Vignette:** Draws focus to the center.
   * **Depth of Field (DoF):** Kept extremely subtle to draw attention to nodes near the focal plane while letting background streams blur elegantly.

### 4.3 Scroll Choreography Plan
Instead of relying on unstable viewport delta listeners, scroll mapping is handled using a unified scroll state derived from **Framer Motion's `useScroll`** or **GSAP ScrollTrigger**:

* A single normalized value, $t_{scroll} \in [0, 1]$, maps linearly across the scroll height of the page.
* We divide $t_{scroll}$ into segments corresponding to our 6 scene states:
  * $0.0 \to 0.15$: State 1 (Raw particles floating in high entropy)
  * $0.15 \to 0.35$: State 2 (Particles cluster into structured question/assessment groups)
  * $0.35 \to 0.50$: State 3 (Streams route questions to topic clusters; warning pulses activate)
  * $0.50 \to 0.65$: State 4 (Learner risk clusters separate; amber/red pulses focus on target nodes)
  * $0.65 \to 0.80$: State 5 (Camera focuses on the target intervention node and pops out the card UI)
  * $0.80 \to 1.00$: State 6 (Camera pulls back, rotates, and lines up nodes into three distinct horizontal stacked architectural planes)

---

## 5. Implementation Roadmap & Phases

We will build the landing page sequentially following these distinct phases:

### Phase L1 — Creative & Architecture (CURRENT)
* **Goal:** Finalize the visual narrative, copy decks, and technical design patterns. No active coding.
* **Check:** Approval of this document.

### Phase L2 — Static Landing Page Shell
* **Goal:** Code the complete Next.js page with all copy, sections, Tailwind styling, buttons, layout structures, and a mock static background.
* **Target files:**
  * `src/app/(impact-public)/impact-intelligence/page.tsx`
  * `src/app/(impact-public)/impact-intelligence/layout.tsx`
* **Commit:** `impact: add landing page shell`

### Phase L3 — WebGL Hero Scene Setup
* **Goal:** Create the basic R3F Canvas and import essential assets/shaders. Implement the `DataParticleField` and basic camera/bloom settings.
* **Dependencies needed:** `three`, `@types/three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` (or direct postprocessing/three controls), `gsap`, `framer-motion`
* **Target files:**
  * `src/components/landing/impact/HeroScene.tsx`
  * `src/components/landing/impact/DataParticleField.tsx`
* **Commit:** `impact: add webgl intelligence hero scene`

### Phase L4 — Scroll Choreography & Transitions
* **Goal:** Implement the scroll-to-state mapping using GSAP ScrollTrigger or Framer Motion, enabling the camera, particles, and node networks to adapt as the user scrolls.
* **Target files:**
  * `src/components/landing/impact/ScrollNarrative.tsx`
  * `src/components/landing/impact/AssessmentNetwork.tsx`
* **Commit:** `impact: add landing page scroll narrative`

### Phase L5 — Polish, Responsiveness, & Build Checks
* **Goal:** Refine shader parameters, smooth out lag, add a custom `prefers-reduced-motion` CSS/state check, handle responsive viewports (adjusting camera target on mobile), verify CTA links to real endpoints (`/impact`, `/impact/school-dashboard`), and run `npm run build` validation.
* **Commit:** `impact: polish premium landing experience`

---

## 6. Risks & Strategic Mitigations

1. **Package Overlap & Version Conflicts:**
   * *Risk:* Installing Three.js or React Three Fiber libraries could conflict with existing Next.js version limits or build dependencies.
   * *Mitigation:* Before any installs, perform dry runs (`npm i --dry-run`) to ensure standard peer dependency alignment. Use precise dependency version tagging.
2. **WebGL Device Performance Degradation:**
   * *Risk:* Frame rate dropping below 30FPS on standard laptops or high-resolution displays when rendering postprocessing/bloom filters.
   * *Mitigation:* Cap Device Pixel Ratio (DPR) to `Math.min(2, window.devicePixelRatio)` or hard lock at `1.5` on high-resolution screens. Implement automated FPS checking: if the average frame time exceeds 33ms, programmatically disable the postprocessing pass.
3. **Content and Accessibility Fallback:**
   * *Risk:* Users with screen readers or those with `prefers-reduced-motion` enabled getting a broken or disorienting experience.
   * *Mitigation:* Ensure every section contains rich, accessible semantic text, and use Tailwind's `motion-safe:` classes to guard animations. When a reduced motion flag is true, mount a clean, CSS-only fallback background and disable scroll-linked WebGL transformations completely.
