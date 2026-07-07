# AI4I Data Track Application: ZimLearnGraph

> **Turning School Assessment Records into AI-Ready Learning Evidence**

| Field | Detail |
|---|---|
| **Project Title** | ZimLearnGraph: Turning School Assessment Records into AI-Ready Learning Evidence |
| **Primary Track** | Data Track |
| **Secondary Relevance** | Design Track |
| **Country** | Zimbabwe |
| **Sector** | Education — Assessment Data Infrastructure |
| **Target Users** | Teachers, school administrators, education planners, researchers |
| **Pilot Scope** | 5–10 schools, 500–1,000 learners, 3 subjects, 2 academic terms |
| **Status** | MVP demonstrating full data flow with seeded data; ready for real pilot deployment |

---

## One-Liner

ZimLearnGraph converts teacher-marked assessments into a structured, privacy-conscious, AI-ready education dataset for detecting learning gaps, tracking interventions, and supporting school-level and national education planning.

---

## Executive Summary

Zimbabwe's schools already generate millions of assessment records every term — test scores, exam results, topic exercises — all containing rich signals about what learners know and where they struggle. This data is trapped in paper mark books, teacher notebooks, isolated spreadsheets, and end-of-term reports. It is not standardised, not anonymised, not linked to curriculum topics, and not structured for any analytical or AI use.

ZimLearnGraph is a structured data pipeline that converts these existing assessment records into a privacy-preserving, topic-linked, longitudinal dataset. It is designed for Zimbabwe's classroom reality: paper-based assessments, teacher-driven marking, low connectivity, and a national curriculum already structured into topics.

The core innovation is the **data layer** — the collection protocol, schema, quality framework, and privacy governance that turn scattered marks into machine-readable learning evidence. The live dashboard is a proof/interface layer, demonstrating what becomes possible when this structured data exists. AI summaries are explicitly advisory only; deterministic analytics remain the source of truth.

An MVP already exists with seeded data demonstrating the full data flow: school → class → learner code → subject → topic → assessment → question → mark → weakness signal → intervention → follow-up result. Funding will enable real pilot data collection across 5–10 Zimbabwean schools, validating the pipeline, refining quality thresholds, and building the evidence base for national-scale deployment.

---

## Problem Statement

### The Core Problem

Zimbabwe's education system has no structured, privacy-preserving, AI-ready dataset connecting classroom assessment signals to learner-level competency gaps.

Every term, teachers mark thousands of assessments — tests, exams, topic exercises — that contain granular data on what each learner knows and where they need support. This data is systematically lost because:

1. **No structured collection** — marks sit in paper mark books, teacher notebooks, or isolated spreadsheets
2. **No learner-level continuity** — a learner's performance trajectory across terms and years is invisible
3. **No topic-level granularity** — teachers know a learner "passed" maths but not which specific topics are weak
4. **No privacy infrastructure** — fear of exposing learner names prevents schools from centralising records
5. **No feedback loop** — interventions happen but their effectiveness is never measured

### Why This Matters for AI4I

The AI4I challenge funds AI for impact in developing contexts. In Zimbabwe, the fundamental barrier to AI in education is not model capability — it is **data infrastructure**. You cannot train education AI models, build analytical dashboards, or generate actionable insights without structured, privacy-preserving, representative education data. ZimLearnGraph solves the infrastructure problem first.

### Why Now

- Zimbabwe's National AI Policy Framework identifies data infrastructure as a priority
- MoPSE's education data strategy emphasises evidence-based teaching
- Zimbabwean schools already produce the data — it is simply not captured in usable form
- Low-cost cloud infrastructure and offline CSV workflows make deployment feasible
- The MVP demonstrates technical viability; pilot funding enables real-world validation

---

## Solution

### What ZimLearnGraph Does

ZimLearnGraph provides a complete data pipeline for converting teacher-marked assessments into structured, AI-ready learning evidence:

**Collection layer:**
- Schools enrol class groups, teachers, and learners — generating anonymised learner codes
- Teachers enter assessment metadata, map questions to curriculum topics, and record marks
- Interventions are logged and linked to weakness signals
- Follow-up assessments measure pre/post change

**Analytics layer:**
- Topic-level performance is derived from per-question marks
- Weakness signals are generated for below-threshold topics
- Intervention effectiveness is computed via pre/post comparison

**Advisory layer:**
- Dashboards visualise deterministic analytics for teachers and school leaders
- AI-generated summaries provide natural-language interpretation — explicitly labelled as advisory

### Innovation

The innovation is structural, not algorithmic:

| Aspect | Current Practice | ZimLearnGraph |
|---|---|---|
| Assessment data | Paper mark books, spreadsheets, term reports | Structured, queryable, longitudinal dataset |
| Learner identity | Full names on paper | Anonymised learner code (school holds mapping) |
| Topic linkage | Teacher knows topic but data is one score | Each question mapped to curriculum topic |
| Intervention tracking | Ad hoc, memory-based | Structured logging with pre/post measurement |
| Privacy | No mechanism (names everywhere) | Privacy-by-design: no PII in dataset |
| AI readiness | Not possible (data unstructured) | Structured, documented, AI-ready schema |

### What Exists Today

An MVP demonstrating the complete data flow with seeded data:
- Data track: 7 documents (dataset card, data dictionary, collection protocol, quality framework, privacy governance, schema, AI4I strategy)
- Design track: Live landing page demonstrating the data visualisation layer
- Full schema with 11 core entities and SQL DDL
- 10 quality metrics with automated monitoring framework
- Privacy governance with learner-code-first anonymisation

### What Funding Enables

Real pilot data collection across 5–10 Zimbabwean schools, validating every layer of the pipeline with genuine classroom data, refining quality thresholds, training teachers, and producing verifiable impact evidence.

---

## Impact Model

### Theory of Change

```
INPUTS → ACTIVITIES → OUTPUTS → OUTCOMES → IMPACT
```

**Inputs:** Funding, pilot schools, teacher training, topic registry, data platform

**Activities:** Onboard schools, generate learner codes, collect assessment data, derive topic performance, log interventions, measure follow-up results, monitor quality

**Outputs:**
- Structured dataset with ≥ 500 learners, 3 subjects, 2 terms
- 10 quality metrics measured and reported
- Teacher training completed with satisfaction ≥ 3.5/5
- ≥ 70% of weakness signals linked to interventions
- ≥ 40% of interventions with follow-up results

**Outcomes:**
- Teachers have actionable topic-level weakness data
- Schools have aggregate performance dashboards
- Intervention effectiveness is measurable
- Data quality framework is validated

**Impact:**
- Evidence-based teaching practices
- Privacy-preserving data infrastructure in Zimbabwean schools
- Reusable dataset template for national education data strategy

### Impact Metrics

| Metric | Target | Method |
|---|---|---|
| Data quality score | ≥ 90% all core metrics | Automated quality computation |
| Teacher adoption | ≥ 80% regularly submitting | Weekly activity logs |
| Intervention linkage | ≥ 70% signals linked | Database join count |
| Intervention effectiveness | ≥ 60% show ≥ 10pp improvement | Pre/post comparison |
| Teacher satisfaction | ≥ 3.5/5 | End-of-pilot survey |
| Assessment coverage | ≥ 85% of teacher-marked assessments | Teacher report + system count |

---

## Data Readiness

### Current State

The data pipeline is fully specified and ready for implementation:
- Complete data dictionary with 14 entities and 11 core assessment entities
- Formal schema with SQL DDL, 29 foreign key constraints
- Collection protocol with 8-step SOP
- Quality framework with 10 measurable metrics
- Privacy governance with learner-code-first anonymisation
- Dataset card documenting intended use, limitations, and ethics

### MVP Evidence

The MVP demonstrates all stages of the data flow with seeded data:
1. School onboarding and learner code generation
2. Assessment metadata entry with question-topic mapping
3. Mark entry with validation
4. Topic performance derivation
5. Weakness signal generation
6. Intervention recording
7. Follow-up assessment with pre/post comparison

### Readiness Level

| Layer | Readiness | What's Needed |
|---|---|---|
| Data schema | ✅ Complete | Real data for validation |
| Collection protocol | ✅ Complete | Teacher training materials |
| Quality framework | ✅ Complete | Threshold tuning with real data |
| Privacy governance | ✅ Complete | School data processing agreements |
| Dashboard interface | ✅ Live (seeded data) | Real data integration |
| AI advisory layer | ✅ Designed | Real data for contextualisation |

---

## Feasibility

### Technical Feasibility

- Schema is SQL-compliant and implementable in SQLite, PostgreSQL, or SurrealDB
- Offline CSV workflow addresses connectivity constraints
- Batch upload design means no real-time dependency
- Topic registry aligned to existing ZIMSEC curriculum
- Learner code generation is deterministic, auditable, and privacy-preserving

### Operational Feasibility

- Teacher-first design minimises new work (15 minutes per assessment class)
- Bulk CSV upload and offline workflows accommodate connectivity variation
- Designated school champions ensure local ownership
- Weekly quality monitoring catches issues early
- 7-day remediation window for warning-level quality issues

### Risk Mitigation

See detailed risk register in FAQ Defense document. Key mitigations include over-recruiting schools (10–12 for 5–10 target), automated validation at entry, offline-first CSV workflow, and privacy-by-design architecture.

---

## Responsible AI & Privacy

- **No PII in dataset** — learner codes are the only identifier; school holds mapping locally
- **Deterministic analytics first** — all topic performance and weakness signals are computed algorithmically, not by AI
- **AI is advisory only** — summaries are labelled as non-authoritative, teacher-check-required
- **No automated high-stakes decisions** — no pass/fail, promotion, or intervention assignment by system
- **RBAC enforcement** — teachers see own classes, administrators see school-level aggregates only
- **Annual transparency report** — published for all programme stakeholders
- **Breach response plan** — 24-hour assessment, 72-hour notification

---

## Scalability

### Horizontal (More Schools)

The data pipeline scales by onboarding additional schools using the same protocol. Each school is independent — no cross-school integration required for pilot success.

### Vertical (More Subjects)

The topic registry is expandable. Starting with English, Mathematics, and Science (O-Level), the same schema supports any ZIMSEC subject.

### Geographic (More Regions)

The offline CSV workflow, teacher-first design, and minimal infrastructure requirements mean the pipeline works across urban, peri-urban, and rural schools.

### National Scale

At national scale (50–100+ schools), ZimLearnGraph's structured dataset becomes a foundational education data resource for MoPSE planning, education research, and AI model training on Zimbabwe-specific data.

---

## Sustainability

| Dimension | Strategy |
|---|---|
| **Financial** | Low infrastructure cost (CSV upload, cloud-hosted analytics); government or donor funding for national scale |
| **Operational** | Teacher adoption embeds data collection into existing workflow; no separate data entry staff needed |
| **Technical** | Open schema, SQL-compliant, no proprietary lock-in; standards-aligned for interoperability |
| **Institutional** | School retains local code-name mapping and controls participation; programme builds capability, not dependency |
| **Data** | Dataset, schema, and protocols outlive the pilot; schools retain the capability to collect structured data |

---

*Application prepared for the AI for International Impact (AI4I) Data Track. ZimLearnGraph: data infrastructure first. AI applications second. Impact always.*
