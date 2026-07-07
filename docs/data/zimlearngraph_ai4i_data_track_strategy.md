# ZimLearnGraph AI4I Data Track Strategy

> **Zimbabwe AI for International Impact (AI4I) — Data Track submission positioning, strategy, and implementation roadmap.**

**Version:** 0.1.0 — Pilot Scope  
**Last Updated:** 2026-07-07  
**Submission Track:** Data Track (Primary), Design Track (Secondary)

---

## Executive Summary

ZimLearnGraph is an **AI-ready education assessment data layer** for Zimbabwe — a structured, privacy-preserving dataset that converts teacher-marked classroom assessments into machine-readable learning evidence. It connects the pieces of the education data chain — school, class, learner, subject, topic, assessment, question, mark, weakness signal, intervention, and follow-up result — into a single, queryable, anonymised dataset.

The Data Track submission packages the **dataset architecture, collection protocol, quality framework, privacy governance, and schema** as the core innovation. The dashboard landing page (already live) is a proof/interface layer demonstrating what becomes possible when this data exists. The AI summary feature is an advisory interpretation layer built on top of deterministic analytics.

**The Data Track is primary** because the structural innovation is the dataset itself — its privacy-by-design architecture, its teacher-centred collection protocol, its deterministic analytics pipeline, and its readiness for AI-augmented education intelligence. Without the data layer, there is no AI, no dashboard, no impact.

---

## Why Data Track Is Primary

| Dimension | Data Track (Primary) | Design Track (Secondary) |
|---|---|---|
| **Core innovation** | Structured dataset pipeline that converts teacher-marked tests into AI-ready learning evidence | Dashboard and landing page UI/UX |
| **Impact lever** | Enables data-driven teaching, intervention tracking, longitudinal analytics, and future AI training | Visualises the data for human understanding |
| **Reusability** | Dataset schema and collection protocol are transferable to any subject, school, or country | Dashboard is specific to this pilot context |
| **AI readiness** | The dataset IS the training/inference data — without it, AI has nothing to analyse | AI summaries are an advisory interface layer |
| **Scalability** | Data pipeline scales by onboarding schools (horizontal), subjects (vertical), and regions (geographic) | UI redesign needed for each new scale context |
| **Sustainability** | Dataset governance and quality framework provide the long-term value proposition | Dashboard is a window onto the data, not the asset itself |
| **AI4I alignment** | AI4I explicitly prioritises data resources that enable AI applications in developing contexts | Design is valued but complementary |

### Why Not Tracks

The Design Track (dashboard, landing page) demonstrates what the data enables. It is valuable for stakeholder communication, teacher engagement, and investor/funder demos. But it is **not the primary innovation**. The dashboard without the underlying data pipeline is an empty interface. The data pipeline without the dashboard is still a functional, impact-generating dataset.

**Positioning:** The dashboard is proof. The data is the product.

---

## Problem Statement

### The Problem

Zimbabwe's education system generates millions of teacher-marked assessments every term — tests, exams, topic exercises — that contain rich, granular signals about what learners know and where they struggle. This data is systematically **lost** because:

1. **No structured collection** — marks exist on paper mark sheets, in teacher notebooks, or in isolated spreadsheets that are never aggregated
2. **No learner-level longitudinal view** — a learner's performance trajectory across terms and years is invisible to teachers and school leaders
3. **No topic-level granularity** — teachers know a learner "passed" or "failed" a test but lack systematic data on which specific topics are weak
4. **No privacy-preserving infrastructure** — fear of exposing learner names and performance data prevents schools from centralising assessment records
5. **No feedback loop** — interventions are conducted but their effectiveness is never systematically measured because follow-up results aren't linked to earlier weakness data

### The Consequence

Teachers make intervention decisions based on intuition and memory rather than structured evidence. School leaders lack data to allocate resources effectively. Education researchers have no granular, longitudinal dataset for studying learning outcomes. AI applications cannot be developed because the foundational training data does not exist in structured form.

### Why This Is an AI4I Problem

The AI4I challenge is about using AI to **create impact in developing contexts**. In Zimbabwe, the fundamental barrier to AI in education is not model capability — it is **data infrastructure**. You cannot build education AI without structured, privacy-preserving, representative education data. ZimLearnGraph solves the data infrastructure problem first, making future AI applications possible.

---

## Proposed Dataset Object

### What It Is

A structured, anonymised, longitudinal dataset capturing the complete assessment-to-intervention-to-outcome chain for learners in participating Zimbabwe schools.

### Dataset Characteristics

| Attribute | Value |
|---|---|
| **Scope** | 5–10 pilot schools, ~500–1,000 learners, 3 subjects |
| **Granularity** | Per-question marks mapped to curriculum topics |
| **Temporality** | Longitudinal across 2 academic terms (initial pilot) |
| **Identifiers** | Anonymised learner codes only; no PII |
| **Entities** | 11 core entities (school → class → learner → subject → topic → assessment → question → mark → performance → signal → intervention → follow-up) |
| **Format** | Relational schema (SQL-compliant DDL provided); CSV/JSON export ready |
| **Versions** | Semantic versioning per dataset snapshot |
| **Quality thresholds** | 10 measurable quality metrics with automated monitoring |

### What It Enables

- Topic-level weakness signal detection per learner
- Intervention effectiveness measurement (pre/post comparison)
- Longitudinal learning trajectory tracking
- Class-level and school-level aggregate analytics
- AI advisory summaries grounded in deterministic data
- Future AI model training on Zimbabwe-specific education data

---

## Pilot Plan

### Phase 1: Setup (Weeks 1–4)

- [ ] Finalise school recruitment (target: 5–10 schools; urban and peri-urban mix)
- [ ] Deploy learner code generation system
- [ ] Onboard teachers with training on data entry workflow
- [ ] Load curriculum topic registry for Mathematics, English, Science
- [ ] Set up quality monitoring dashboard

### Phase 2: Data Collection (Weeks 5–16 / Term 1)

- [ ] Schools begin systematic mark entry for all assessments in pilot subjects
- [ ] Teachers map each question to curriculum topics
- [ ] Weekly quality metric reviews with programme administrator
- [ ] Baseline topic performance derived after first assessment cycle

### Phase 3: Intervention Cycle (Weeks 10–20)

- [ ] First weakness signals generated and surfaced to teachers
- [ ] Teachers log interventions in response to signals
- [ ] Follow-up assessments administered for intervened topics
- [ ] Pre/post comparison computed

### Phase 4: Analysis and Iteration (Weeks 20–24)

- [ ] Full pilot dataset exported and quality-scored
- [ ] Impact analysis: intervention effectiveness rates, data quality metrics, teacher adoption rates
- [ ] Teacher satisfaction survey
- [ ] Pilot report generated
- [ ] Term 2 expansion plan prepared

### Key Milestones

| Milestone | Target Week | Verifiable Outcome |
|---|---|---|
| Schools onboarded | Week 4 | ≥ 5 schools active |
| First assessment data collected | Week 6 | ≥ 500 mark entries |
| First weakness signals generated | Week 10 | ≥ 1 signal per learner in at least one topic |
| First interventions recorded | Week 12 | ≥ 50% of signals have linked interventions |
| First follow-up results | Week 16 | ≥ 10 follow-up assessments with pre/post comparison |
| Pilot data export | Week 22 | Full dataset with quality report |
| Pilot report | Week 24 | Documented outcomes, lessons, recommendations |

---

## Impact Metrics

### Primary Impact Indicators

| Metric | Target | Measurement Method |
|---|---|---|
| **Data quality score** | ≥ 90% on all core metrics | Automated quality framework computation |
| **Teacher adoption rate** | ≥ 80% of enrolled teachers submitting data regularly | Weekly activity logs |
| **Intervention linkage rate** | ≥ 70% of weakness signals linked to an intervention | Database join count |
| **Intervention effectiveness** | ≥ 60% of follow-ups show meaningful improvement (≥ 10 pp) | Pre/post score comparison |
| **Teacher satisfaction** | ≥ 3.5 / 5 | End-of-pilot survey |
| **Assessment coverage** | ≥ 85% of teacher-marked assessments in pilot subjects entered | Teacher self-report + system count |

### Secondary Impact Indicators

- Number of learners with longitudinal performance data spanning ≥ 2 assessment cycles
- Number of topics with assessment data across multiple schools
- Quality metric trend direction (improving/declining over pilot duration)
- Teacher time spent on data entry (target: ≤ 15 minutes per assessment class)
- Data completeness by school (identifying and addressing gaps)

### Long-Term Impact (Year 2+)

- Number of schools voluntarily continuing data submission post-pilot
- Education researchers accessing the anonymised dataset
- AI models trained on ZimLearnGraph data for education-specific applications
- Policy influence: MoPSE referencing the dataset structure in national education data strategy

---

## Differentiation

### vs. Existing Education Data Initiatives in Zimbabwe

| Initiative | Focus | ZimLearnGraph Advantage |
|---|---|---|
| **EMIS (Education Management Information System)** | School-level aggregate statistics (enrolment, staffing, infrastructure) | Learner-level granular data, topic-level assessment detail, privacy-by-design |
| **School-based mark sheets** | Paper records, per-assessment only | Structured, longitudinal, queryable, anonymised, quality-controlled |
| **EdTech platforms (e.g., online quizzes)** | Platform-native digital assessments | Works with teacher-marked paper assessments — 90%+ of Zimbabwe's assessment practice |
| **Commercial learning analytics tools** | Well-resourced, high-connectivity environments | Designed for low-connectivity, teacher-first workflows in Zimbabwean schools |

### vs. International Education Datasets

| Feature | ZimLearnGraph | Typical International Dataset |
|---|---|---|
| **Privacy-by-design** | Learner codes from day one; no PII in schema | Often retrofit anonymisation onto PII-collecting systems |
| **Teacher-centred collection** | Teacher controls entry via existing workflow | Often requires platform migration or dual entry |
| **Intervention-outcome linkage** | Structured pre/post comparison built into schema | Rarely captures intervention-outcome pairs |
| **AI4I context** | Designed for developing-country constraints | Designed for OECD education systems |
| **Offline-friendly** | Batch CSV upload, no real-time requirement | Usually online-only |
| **Open documentation** | Complete dataset card, data dictionary, quality framework, governance | Often proprietary and undocumented |

### Unique Value Proposition

ZimLearnGraph is the first structured, privacy-preserving, AI-ready education assessment dataset purpose-built for Zimbabwe's classroom reality: paper-based assessments, teacher-driven marking, low connectivity, and a national curriculum that is already structured into topics. It does not ask schools to change how they teach or assess. It asks them to capture what they already know in a structured, shareable format.

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Low teacher adoption** | Medium | High | Minimal-overhead entry (CSV upload, batch workflows); dedicated training sessions; designated school champion; weekly quality support calls |
| **Poor data quality** | Medium | High | Automated validation at entry; quality dashboard with per-school visibility; progressive threshold tightening; remediation protocol |
| **School dropout mid-pilot** | Low | High | Over-recruit schools (target 5–10, onboard 10–12); maintain positive relationship through regular value-demonstration reports |
| **Connectivity issues** | Medium | Medium | Offline CSV workflow; mobile-friendly upload; SMS-based notifications as backup communication channel |
| **Re-identification breach** | Low | Critical | No PII in dataset; coarse learner codes; role-based access; annual privacy audit; breach response plan |
| **Topic mapping inconsistency** | Medium | Medium | Standardised topic registry per subject; teacher training on topic mapping; periodic mapping audit by subject lead |
| **Sustained engagement beyond pilot** | Medium | High | Demonstrate value with mid-pilot data reports for each school; co-design Term 2 scope with teacher feedback |
| **Funders/policymakers expect dashboard only** | High | Medium | Clear communication that the data layer is the core innovation; dashboard is the visible but dependent layer |

---

## Use of Funding/Support

| Investment Area | Allocation | Rationale |
|---|---|---|
| **School onboarding & training** | 25% | Teacher training is critical for data quality; in-person onboarding builds trust and adoption |
| **Platform infrastructure** | 20% | Data entry interface, validation engine, analytics pipeline, quality dashboard |
| **Data quality management** | 15% | Quality monitoring staff, remediation support, weekly review cycles |
| **Curriculum topic registry development** | 10% | Structured topic taxonomy for Mathematics, English, Science (O-Level); expandable to other subjects |
| **Pilot coordination & reporting** | 15% | Programme administrator, school liaison, impact analysis, pilot report |
| **Privacy & governance audit** | 5% | External privacy review, compliance assessment, transparency report |
| **Future scalability planning** | 10% | Documentation, schema refinement, standards alignment roadmap, MoPSE engagement |

### How Support Accelerates Impact

- **Funding enables the pilot** — without support, the data collection infrastructure cannot be deployed at scale
- **Technical support** — education data modelling expertise, quality framework refinement, privacy review
- **Policy engagement** — introductions to MoPSE, education research institutions, and potential partner schools
- **AI4I network** — connection to other AI4I grantees working on education data in similar contexts; shared learning on privacy, quality, and standards

---

## Alignment with National AI/Data Priorities

### Zimbabwe National AI Policy Framework

ZimLearnGraph directly aligns with the following national priorities:

1. **Data as a national asset** — structured, high-quality, education-specific data is a foundational resource for AI development
2. **Privacy-preserving data infrastructure** — learner-code-first design demonstrates privacy-by-default architecture that can serve as a model for other sectors
3. **Home-grown AI training data** — Zimbabwe's AI ecosystem needs locally representative training data; ZimLearnGraph provides structured, curriculum-aligned education data from Zimbabwean classrooms
4. **Equitable access** — the pilot explicitly includes peri-urban and (future) rural schools; the offline-friendly design ensures connectivity is not a barrier
5. **Teacher empowerment** — technology supports rather than replaces teacher judgement; AI summaries are explicitly advisory

### National Education Data Strategy

ZimLearnGraph supports the following MoPSE-priority outcomes:

- **Evidence-based teaching** — teachers receive structured data on topic-level learner performance
- **Intervention effectiveness** — the pre/post follow-up loop provides the first structured measurement of remediation outcomes in Zimbabwean classrooms
- **Longitudinal tracking** — learner codes enable linking assessment data across terms and years for the same learner
- **Data-driven resource allocation** — school-level aggregate data helps leaders identify which subjects and topics need additional support

### AI4I-Specific Alignment

| AI4I Priority | ZimLearnGraph Contribution |
|---|---|
| **Create AI-ready data resources** | Structured, documented, privacy-preserving dataset purpose-built for education AI |
| **Enable AI applications in developing contexts** | The dataset enables education-specific AI models (weakness detection, personalised recommendations, teacher advisory) |
| **Build foundational infrastructure** | Dataset card, data dictionary, collection protocol, quality framework, and governance model are reusable templates for other education data initiatives |
| **Privacy-first data governance** | Learner-code-first design, no PII collection, role-based access, school-controlled participation |
| **Sustainable impact beyond funding** | The dataset, schema, and protocols outlive the pilot; schools retain the capability to collect and use structured assessment data |

---

## Conclusion

ZimLearnGraph's Data Track submission presents a **structural innovation in education data infrastructure** — not a product feature, not an AI model, not a dashboard design — but a complete, documented, privacy-preserving pipeline for converting the assessment data Zimbabwe's schools already generate into AI-ready learning evidence.

The dashboard (live at `impact-intelligence-landing-live-v0.1`) is the window. The data pipeline, documented across these seven documents, is the building.

---

*ZimLearnGraph — AI-ready education assessment data layer for Zimbabwe. Data Track primary. Design Track secondary. The dataset is the product. The dashboard is the proof.*
