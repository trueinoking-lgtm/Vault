# FAQ & Defense: ZimLearnGraph

> **AI4I Data Track — Anticipated Questions and Evidence-Based Responses**

---

## Q1: Why Data Track and not just Design Track?

**Core answer:** Because the structural innovation is the dataset itself, not the interface.

**Response:**
ZimLearnGraph's primary innovation is the **data infrastructure** — the privacy architecture, collection protocol, quality framework, and governance model that convert scattered assessment marks into structured learning evidence. This is a data pipeline problem, not a UI/UX problem. The dashboard is a visualisation of what the data enables — and we have already built it as a Design Track proof. But the dashboard without the data pipeline is an empty interface. The data pipeline without the dashboard is still a functioning, impact-generating dataset.

**Evidence:**
- 7 Data Track documents specifying the complete pipeline
- Schema, DDL, quality metrics, privacy governance — all independent of any interface
- Dashboard is explicitly positioned as "proof/interface layer" throughout the documentation

**If pressed:**
"We filed secondary relevance for Design Track because the dashboard demonstrates the data's value. But we chose Data Track as primary because the infrastructure problem is the bottleneck. Without solving the data layer, no amount of design creates impact."

---

## Q2: Is this just a dashboard?

**Core answer:** No — the dashboard is the visible layer of a much deeper data infrastructure.

**Response:**
The dashboard is what you see, but it is not what we built. Behind it:

- A **data schema** with 14 entities, 29 foreign key constraints, and SQL DDL
- A **collection protocol** that works in low-connectivity, paper-based classrooms
- A **quality framework** with 10 automated metrics and 3-tier thresholds
- A **privacy governance** model with learner-code-first anonymisation and schema-enforced no-PII design
- A **dataset card** documenting intended use, limitations, and ethical risks

The dashboard is the tip of the iceberg. The data infrastructure is everything below the waterline.

**Evidence:**
- All 7 Data Track documents — none of which describe dashboard features
- The dashboard exists as a separate deliverable (Design Track)

---

## Q3: Where does AI fit?

**Core answer:** AI is an advisory layer on top of deterministic analytics — not the core decision-making engine.

**Response:**
In ZimLearnGraph's architecture, the AI layer is explicitly **advisory**:

1. **Deterministic analytics come first** — topic performance, weakness signals, and pre/post comparisons are computed algorithmically using defined formulas. No AI is involved.
2. **AI summarises what analytics computed** — the AI takes deterministic outputs and generates natural-language briefs for teachers and school leaders.
3. **AI is labelled as advisory** — every AI-generated summary carries the message: *"This summary is AI-generated and advisory only. Always verify against the underlying data."*

The dataset itself is built to be AI-ready — structured, documented, privacy-preserving — so that future AI applications (training Zimbabwe-specific education models, developing personalised learning tools, generating actionable recommendations) become possible.

**Evidence:**
- Collection protocol footer: "No AI is involved in collection, validation, or derivation"
- Privacy governance: "AI summaries are advisory only" section
- Dataset card: "Advisory AI summaries" listed under Intended Use

**If pressed:**
"AI is not required for ZimLearnGraph to generate value. The deterministic analytics layer — topic performance, weakness signals, intervention effectiveness — delivers standalone impact. AI adds interpretation on top, but the core value is the structured data."

---

## Q4: How is learner privacy protected?

**Core answer:** Architecture-enforced, schema-level privacy — no learner name can enter the system.

**Response:**
Privacy is not a policy on top of the system. It is the system's architectural foundation:

1. **Learner codes first** — each learner receives an anonymised code (e.g., `ZLG-2026-S01-C03-L042`) at school onboarding. The school holds the name-to-code mapping locally; it never enters the dataset.
2. **No PII fields in schema** — the data schema has no `learner_name`, `date_of_birth`, `national_id`, `guardian_name`, or `address` fields. PII cannot be stored because there is nowhere to put it.
3. **Role-based access** — teachers see only their own classes; school administrators see aggregates; programme administrators see cross-school aggregates only.
4. **School-controlled participation** — the school is the data controller. Schools may withdraw and request deletion at any time.
5. **Published governance** — complete privacy governance document, data processing agreement template, annual transparency report.

**Evidence:**
- Privacy governance document with 7 privacy-by-design principles
- Schema with zero PII fields
- Data dictionary — no PII columns exist

**If pressed:**
"Could a school re-identify learners? Yes — they hold the mapping. Could anyone else? No — because the mapping never enters the system. We treat the school as the legitimate data controller, which is both legally appropriate and practically necessary for any education data system."

---

## Q5: How do you get real data from schools?

**Core answer:** By working with what schools already do, not asking them to do something new.

**Response:**
ZimLearnGraph does not require schools to adopt new technology, change their assessment practices, or buy equipment. The key design decisions that make data collection feasible:

1. **Teacher-first design** — teachers already mark assessments. ZimLearnGraph simply asks them to enter what they already know into a structured format. Estimated time: 15 minutes per assessment class.
2. **CSV bulk upload** — teachers download a pre-populated template, fill it offline during or after class, and upload when connected. No real-time entry required.
3. **School champion model** — each school designates a local champion who receives a small stipend to support other teachers and maintain momentum.
4. **Training and onboarding** — in-person cluster workshops, printed quick-reference guides, weekly quality support calls.
5. **Value demonstration** — mid-pilot reports show each school what their data reveals, proving the value of continued participation.

**Evidence:**
- Collection protocol Step 3: multiple entry methods including offline CSV
- Budget: School onboarding & training is the largest line item (25%)

**If pressed:**
"The biggest risk is not 'will teachers enter data?' — they already record marks. The risk is 'will they maintain consistent quality?' That's why our quality framework has automated checks, weekly reviews, and a clearly documented remediation protocol."

---

## Q6: What prevents poor-quality data?

**Core answer:** A multi-layered quality system that detects, alerts, and remediates — transparently.

**Response:**
Poor-quality data is the #1 threat to dataset credibility. ZimLearnGraph addresses it at four levels:

**Level 1 — Automated validation at entry:**
Every submission is checked for: valid learner codes, non-null metadata, topic mappings on all questions, scores within range, no duplicates, expected learner count.

**Level 2 — 10 quality metrics with tiered thresholds:**
Each metric has Good/Warning/Critical thresholds. Warning triggers automated notification. Critical triggers data quarantine and mandatory remediation.

**Level 3 — Weekly human review:**
A programme administrator reviews quality metrics per school per week, contacting teachers with actionable guidance before small issues compound.

**Level 4 — Remediation protocol:**
Green = monitor. Yellow = 7-day resolution window with support offered. Red = immediate quarantine, root cause analysis, corrective action plan.

**Evidence:**
- Complete quality framework with all 10 metrics defined
- Q6 (Invalid Score Rate) and Q7 (Duplicate Rate) have 0% targets — enforced by system
- Q5 (Missing Score Rate) tracks and alerts on incomplete entries

**If pressed:**
"We don't hide bad data. The quality dashboard is transparent — schools can see their own metrics. The remediation protocol is designed to fix problems, not penalise teachers. Quality improves through support, not surveillance."

---

## Q7: How can this scale beyond one school?

**Core answer:** Each school is an independent data unit — scaling is procedural, not architectural.

**Response:**
ZimLearnGraph's architecture is designed for horizontal scaling from day one:

1. **Independent school units** — each school's data pipeline is self-contained. Onboarding a 50th school uses the same protocol as onboarding the first.
2. **No cross-school dependency** — schools do not need to coordinate. Scaling is additive.
3. **Curriculum-aligned topic registry** — the same topic registry for Mathematics, English, and Science works at any school following the ZIMSEC curriculum. Adding new subjects means extending the registry, not redesigning it.
4. **Offline-friendly protocol** — rural schools without reliable internet can participate via CSV upload. The protocol is identical; only the transport method differs.
5. **Documented scaling path** — five phases from Term 2 expansion to Year 3–5 national learning intelligence infrastructure, each with concrete targets.

**Evidence:**
- Dataset card: Future scaling path with 5 phases and specific school counts
- Collection protocol: Designed for any school, any location type

**If pressed:**
"At 5–10 schools, we validate the pipeline. At 50–100 schools, it becomes a national education resource. The protocol doesn't change between those two numbers — only the number of onboarding cycles."

---

## Q8: What happens if teachers do not enter marks?

**Core answer:** We design for adoption, monitor for engagement, and remediate for non-participation.

**Response:**
Teacher non-entry is a recognised risk with documented mitigation strategies:

**Prevention:**
- Minimal overhead design (15 min per assessment class)
- CSV template with pre-populated learner codes — no data entry from scratch
- School champion provides peer support
- Training workshops build capability before data collection starts

**Detection:**
- Weekly adoption rate metric (80% target)
- Per-school quality dashboard visible to programme administrator
- Missing entries surface within days, not weeks

**Remediation:**
- Week 1–2: Automated reminder and support offer
- Week 3–4: School champion or programme administrator check-in
- Week 5+: Root cause investigation; possible school replacement from over-recruitment pool

**Evidence:**
- Quality framework: Q1 (Learner Code Completeness) and Q4 (Mark Completion Rate) directly measure engagement
- Risk register: "Low teacher adoption" listed with specific mitigation

**If pressed:**
"Our over-recruitment strategy targets 10–12 schools for a 5–10 school pilot. If one or two schools struggle with adoption, we have buffer. The data from the remaining schools still produces a valid pilot outcome."

---

## Q9: How does this align with national AI goals?

**Core answer:** Directly maps to Zimbabwe's National AI Policy Framework and MoPSE's education data strategy.

**Response:**
**Zimbabwe National AI Policy Framework alignment:**
1. **Data as a national asset** — ZimLearnGraph produces structured, high-quality education data as a foundational resource for AI development
2. **Privacy-preserving data infrastructure** — learner-code-first design is a model for other sectors
3. **Home-grown AI training data** — the dataset enables Zimbabwe-specific education AI, reducing reliance on foreign training data
4. **Equitable access** — offline-friendly protocol and peri-urban/rural pilot recruitment address the digital divide
5. **Teacher empowerment** — AI supports teacher judgement, does not replace it

**MoPSE education data strategy alignment:**
1. Evidence-based teaching
2. Intervention effectiveness measurement
3. Longitudinal learner tracking
4. Data-driven resource allocation

**Evidence:**
- AI4I strategy document: "Alignment with National AI/Data Priorities" section
- Judge alignment matrix: "Local/National Impact" criterion

---

## Q10: What can be delivered without full national integration?

**Core answer:** The entire data pipeline and its standalone value — independent of any government system.

**Response:**
ZimLearnGraph delivers value at every scale, without requiring Ministry integration:

**At pilot scale (5–10 schools):**
- Complete, quality-scored dataset with real assessment data
- Validated collection protocol, quality thresholds, and privacy model
- Demonstrated teacher adoption and intervention effectiveness measurement
- Schools with operational structured data capability

**At multi-school scale (10–50 schools):**
- Cross-school aggregate analytics without individual school identification
- Benchmarking data for peer learning
- Expanded topic registry coverage

**At all scales, without MoPSE integration:**
- Learner-level topic performance and weakness signals
- Intervention tracking and effectiveness measurement
- Privacy-preserving data infrastructure
- AI-ready structured dataset

National integration is a future scaling goal, not a prerequisite for impact.

**Evidence:**
- AI4I strategy: Clear separation between pilot deliverables (independent) and national-scale goals (future)
- Dataset card: Pilot scope defines what's delivered within the pilot period

**If pressed:**
"MoPSE integration would accelerate scale and amplify impact. But we don't need a Ministry agreement to help 500 learners in 10 schools. The pilot proves the model, generates the evidence, and builds the case for national adoption."

---

## Quick Reference: Key Numbers to Defend

| Number | What | Why It's Defensible |
|---|---|---|
| 5–10 schools | Pilot scope | Realistic for 24 weeks with 1 programme administrator |
| 500–1,000 learners | Expected cohort | Based on average class sizes in target schools |
| 15 min/assessment | Teacher time burden | CSV template with pre-populated learner codes |
| 90% quality | Aggregate threshold | Proven by automated validation at entry |
| 80% adoption | Teacher engagement | School champion + training + over-recruitment buffer |
| 70% intervention linkage | Signal-to-action rate | Pilot phase; stretch goal 85% |
| 60% effectiveness | Pre/post improvement | ≥ 10pp is a meaningful classroom improvement |
| 3.5/5 satisfaction | Teacher survey | Realistic first-pilot expectation |
| $75,000 | Total budget | Lean; school-facing activity is 50% of spend |
| 24 weeks | Pilot duration | Matches 2 academic terms |

---

## If You Only Have Time for Three Answers

| Question | One-Line Answer |
|---|---|
| **What's the core innovation?** | "The structured data pipeline that makes education AI possible — not the AI itself." |
| **Why Data Track?** | "Because the dataset is the product. The dashboard is proof. The data is what creates impact." |
| **Is this ready?** | "MVP is live. Pipeline is documented. What's missing is real data from real schools — and that's exactly what we're asking to fund." |

---

*This FAQ is designed for quick reference during Q&A. Each response is evidence-based and refers to specific documents in the application package. Update responses as the pilot progresses and new evidence becomes available.*
