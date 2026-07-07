# AI4I Data Track Application: ZimLearnGraph

> ZimLearnGraph turns ordinary teacher-marked assessments into structured, privacy-conscious, AI-ready learning evidence.

| Field | Detail |
|---|---|
| **Project Title** | ZimLearnGraph: Turning School Assessment Records into AI-Ready Learning Evidence |
| **Primary Track** | Data Track |
| **Secondary Relevance** | Design Track |
| **Country** | Zimbabwe |
| **Sector** | Education — Assessment Data Infrastructure |
| **Target Users** | Teachers, school leaders, education administrators |

---

## Executive Vision

Zimbabwean schools already generate learning data every week. Every term, teachers mark thousands of tests, exams, and topic exercises that contain granular signals about what each learner knows and where they need support. That data currently stays trapped in paper mark books, teacher notebooks, isolated spreadsheets, and end-of-term reports. It is not standardised, not anonymised, not linked to curriculum topics, and not structured for any analytical or AI use.

ZimLearnGraph is designed around a simple idea: schools already generate learning data through ordinary assessments, but that data is rarely structured for analysis or AI use. By converting teacher-marked tests into learner-coded, question-linked, topic-mapped, intervention-aware records, ZimLearnGraph creates an AI-ready education data layer that can help schools identify weak topics, prioritize support, and measure whether interventions are working.

**The core innovation is the dataset layer.** The Impact Intelligence dashboard is a proof/interface layer that shows what becomes possible when this data exists. AI summaries are an advisory interpretation layer. The pilot is an evidence-generation pathway. Future scale points toward national learning intelligence infrastructure.

---

## Problem Statement

### What Is Lost Today

Every marked test in a Zimbabwean classroom produces the same pattern:

- A learner answers eight questions across five topics
- The teacher marks each question and records a total score
- The score enters a mark book as a single number — "45/100"
- The topic-level signal — "passed Fractions, failed Ratios" — is lost
- The learner's trajectory across terms is invisible
- The teacher intervenes based on memory, not structured evidence
- The intervention's effect is never measured

This pattern repeats across every school, every subject, every term. The data is generated but never captured in usable form.

### The Five Barriers

1. **No structured collection** — marks sit in paper books, notebooks, or ad-hoc spreadsheets with no standard format
2. **No learner-level continuity** — a learner's performance across terms and years cannot be connected
3. **No topic-level granularity** — aggregate scores hide which specific topics are weak
4. **No privacy infrastructure** — fear of exposing learner names prevents centralisation
5. **No feedback loop** — interventions happen but their effectiveness is never measured

### Why This Is a Data Problem

The fundamental barrier to AI impact in Zimbabwean education is not model capability. It is data infrastructure. You cannot train education AI models, build analytical dashboards, or generate actionable insights without structured, privacy-preserving, representative education data. ZimLearnGraph solves the infrastructure problem first.

---

## Why This Belongs in the Data Track

ZimLearnGraph's primary innovation is the dataset itself — its privacy architecture, its collection protocol, its quality framework, its schema, and its governance model. These are data infrastructure contributions, not interface or AI contributions.

The Data Track is the correct home because:

- The dataset is the product, not the dashboard
- The structural innovation is in how data is collected, linked, and governed
- AI is a downstream consumer of the dataset, not the core contribution
- The dataset is designed to be reused across many AI applications
- Without the data layer, there is no AI, no dashboard, no impact

The Design Track is secondary because the dashboard proves the data is useful but is not the primary innovation. A dashboard without the data pipeline is an empty interface. The data pipeline without the dashboard is still a functioning, impact-generating dataset.

---

## Dataset Object: What ZimLearnGraph Is

ZimLearnGraph is an AI-ready education assessment data layer for Zimbabwe. It converts the existing teacher-marked assessment workflow into a structured, queryable dataset that connects:

```
School → Class → Learner Code → Subject → Topic → Assessment → Question → Mark
→ Weakness Signal → Intervention → Follow-up Result
```

**What the dataset contains:**

| Entity | Description |
|---|---|
| `school` | Registered institution with sector, province, district |
| `class_group` | Specific class or stream within a school |
| `teacher` | Anonymised staff code |
| `learner` | Learner identified only by anonymised learner code |
| `subject` | Curriculum subject (Mathematics, English, Science) |
| `topic` | Curriculum topic within a subject, aligned to ZIMSEC syllabus |
| `assessment` | A specific test, exam, or topic exercise |
| `assessment_question` | Individual question mapped to a curriculum topic |
| `mark_entry` | Per-learner, per-question score with validation |
| `derived_topic_performance` | Weighted topic-level performance per learner |
| `learner_risk_signal` | Automated flag for below-threshold topic mastery |
| `intervention` | Teacher-recorded remediation action linked to a signal |
| `follow_up_assessment_result` | Pre/post comparison measuring intervention impact |

---

## What Makes the Dataset AI-Ready

ZimLearnGraph defines six levels of AI-readiness for education assessment data:

| Level | State | Description |
|---|---|---|
| **L0** | Raw marks | Paper mark books, unlinked spreadsheets, term reports |
| **L1** | Learner-coded | Anonymised learner codes replace names; no PII |
| **L2** | Question-linked | Each mark is connected to a specific question on a specific assessment |
| **L3** | Topic-mapped | Questions are linked to curriculum topics; weakness detection is possible |
| **L4** | Intervention-linked | Weakness signals are connected to recorded interventions and follow-ups |
| **L5** | Validated improvement | Pre/post comparisons measure intervention effectiveness; quality-scored |

Most schools operate at **L0** today. ZimLearnGraph takes data to **L3–L5** within a single collection workflow.

The dataset is AI-ready because:
- **Structured schema** — 14 entities with foreign key relationships, SQL DDL provided
- **Privacy-preserving** — no PII, learner-code-first, school-controlled mapping
- **Deterministically derived** — topic performance and risk signals computed by formula, not AI
- **Quality-scored** — 10 automated metrics track completeness, accuracy, and linkage
- **Versioned** — every dataset snapshot carries a semantic version and quality score
- **Exportable** — SQL, CSV, and JSON formats supported
- **Documented** — full dataset card, data dictionary, collection protocol, schema, governance

---

## What Already Exists

### MVP — Live and Functional

A complete MVP demonstrates the full data flow with seeded data:

| Component | Status | Detail |
|---|---|---|
| Dataset card | ✅ Complete | Motivation, intended use, limitations, ethics, governance |
| Data dictionary | ✅ Complete | 14 entities, all fields specified with types and constraints |
| Collection protocol | ✅ Complete | 8-step SOP from onboarding to follow-up assessment |
| Quality framework | ✅ Complete | 10 metrics with formulas, thresholds, and remediation protocols |
| Privacy governance | ✅ Complete | 7 privacy-by-design principles, RBAC model, breach response |
| Schema with DDL | ✅ Complete | 11 core tables, 29 foreign key constraints, SQLite-compliant |
| AI4I strategy | ✅ Complete | Positioning, pilot plan, impact metrics, risk register |
| Dashboard (Impact Intelligence) | ✅ Live | Public landing page + authenticated app with seeded data |
| Analytics engine | ✅ Built | Deterministic topic performance, weakness signals, intervention tracking |
| Seeded dataset | ✅ Loaded | 30 learners, 8 questions, 5 topics, full mark-entry and analytics |

### Documents Package

The full Data Track documentation lives at `docs/data/`:
- Dataset card
- Data dictionary
- Collection protocol
- Quality framework
- Privacy governance
- Schema
- AI4I strategy

### Design Track

The live Impact Intelligence landing page and authenticated app demonstrate what the data layer enables. Both are accessible at the public domain.

---

## Why Us

We are not starting from zero. We are ready to turn a validated prototype into a real pilot dataset.

- **Live MVP** — the full data pipeline is built, documented, and running with seeded data
- **Public landing page** — stakeholders can see and interact with the concept today
- **Complete data package** — seven documents specify every layer of the pipeline
- **Working analytics engine** — deterministic topic performance and weakness signals are computed from real-seeded marks
- **Privacy architecture** — learner-code-first design is schema-enforced, not policy-only
- **Teacher-first protocol** — designed for Zimbabwe's classroom reality, not Silicon Valley assumptions
- **Quality system** — 10 automated metrics ensure dataset credibility from day one

We have moved from concept to working proof. What we need is the opportunity to validate with real school data, refine through real use, and produce the evidence base for wider adoption.

---

## Data Quality and Governance

### Quality Framework

Ten automated metrics track dataset health:

| Metric | What It Measures | Pilot Target |
|---|---|---|
| Q1: Learner code completeness | Every enrolled learner has marks | ≥ 90% |
| Q2: Metadata completeness | Assessment records have all required fields | 100% |
| Q3: Question-topic mapping | Every question maps to a curriculum topic | ≥ 80% |
| Q4: Mark completion rate | Expected entries are filled | ≥ 90% |
| Q5: Missing score rate | Blank entries (excluding absent) | < 3% |
| Q6: Invalid score rate | Scores exceeding max | 0% |
| Q7: Duplicate learner code rate | Duplicates within an assessment | 0% |
| Q8: Intervention linkage | Weakness signals with linked interventions | ≥ 70% |
| Q9: Follow-up coverage | Interventions with follow-up results | ≥ 40% |
| Q10: Dataset versioning | Every export carries a version identifier | 100% |

Each metric has Good / Warning / Critical thresholds with corresponding actions. The quality dashboard is transparent — schools can see their own metrics. Remediation is supportive, not punitive.

### Privacy Governance

- **Learner codes first** — no learner name enters the dataset
- **No PII in schema** — there is no field for learner name, date of birth, national ID, or address
- **School controls the mapping** — the name-to-code mapping is held by the school, never by the system
- **School is data controller** — the platform processes anonymised data under school instruction
- **Schools may withdraw** — full data deletion on request

---

## Responsible AI Safeguards

ZimLearnGraph treats AI as an advisory layer, not a decision layer:

- **Deterministic analytics are the source of truth** — topic performance, weakness signals, and pre/post comparisons are computed by formula, not AI
- **AI summarises only what analytics computed** — AI generates natural-language briefs from deterministic outputs
- **AI is labelled as advisory** — every AI summary carries the message: "AI-generated and advisory. Always verify against underlying data."
- **No high-stakes automated decisions** — the system does not pass, fail, promote, or label learners. It provides evidence for teacher judgement.
- **No automated interventions** — interventions are teacher-recorded, teacher-controlled

---

## Pilot Pathway

### What a Pilot Looks Like

| Phase | Weeks | Activities |
|---|---|---|
| Setup | 1–4 | School onboarding, learner code generation, teacher training |
| Collection | 5–16 | Real assessment data entry, question-topic mapping, quality monitoring |
| Intervention cycle | 10–20 | Weakness signals → interventions → follow-up assessments |
| Analysis | 20–24 | Dataset export, impact analysis, pilot report |

**Scope:** 5–10 schools, ~500–1,000 learners, 3 subjects (English, Mathematics, Science)

### Expected Outputs

- Structured, quality-scored dataset from real school assessments
- Validated collection protocol with real-use refinements
- Calibrated quality thresholds
- Teacher training materials and adoption data
- Intervention effectiveness measurements (pre/post)
- Full pilot report with outcomes and recommendations

---

## Future Potential

The pilot validates the pipeline. Beyond it:

- **Term 2+ expansion** — additional subjects and class groups within pilot schools
- **Multi-school scale** — 10–50 schools across multiple provinces
- **National pilot** — 50–100 schools with formal MoPSE engagement (Year 2)
- **Learning intelligence infrastructure** — dataset as a national education resource for research, planning, and AI development

Each scale step uses the same protocol. The architecture does not change — only the number of onboarding cycles.

---

## What AI4I Support Unlocks

AI4I support would enable the step from validated prototype to real-school pilot:

- Deploy the data collection pipeline in 5–10 Zimbabwean schools
- Train teachers on structured data entry and topic mapping
- Run the full assessment-to-intervention-to-follow-up cycle with real data
- Validate quality thresholds against real classroom conditions
- Produce the evidence base — dataset, impact metrics, pilot report — needed for wider adoption

The pipeline is built. The documents exist. The privacy architecture is designed. What is missing is the real-school validation that turns this from a working demo into a proven education data resource.

---

*ZimLearnGraph: data infrastructure first. AI second. Impact always.*
