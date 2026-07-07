# ZimLearnGraph Dataset Card

> **AI-Ready Education Assessment Data Layer for Zimbabwe**

**Version:** 0.1.0 — Pilot Scope  
**Status:** MVP Dataset Specification  
**Last Updated:** 2026-07-07

---

## Motivation

Zimbabwe's education system produces thousands of teacher-marked assessments daily — tests, exams, topic exercises — but this assessment data remains locked in paper mark books, isolated spreadsheets, and institutional silos. No structured, privacy-preserving dataset exists that connects classroom assessment signals to learner-level competency gaps across schools, subjects, and topics over time.

ZimLearnGraph was created to solve this: to convert the existing, teacher-driven assessment workflow into a structured, queryable dataset that reveals learning evidence — topic-level weakness signals, intervention outcomes, and longitudinal progress — without adding new work for teachers or collecting unnecessary personal data.

The primary motivation is **data infrastructure**: making assessment data AI-ready for analysis, visualisation, and advisory intelligence while keeping the teacher at the centre of assessment practice.

## Intended Use

- **School-level learning analytics dashboards** — aggregate performance trends by subject, topic, class group, and assessment type
- **Teacher-facing weakness-signal identification** — surfacing which topics a class or individual learner is struggling with, based on structured mark data
- **Intervention tracking** — recording classroom-level interventions (remediation, re-teaching, targeted exercises) and linking them to follow-up assessment outcomes
- **Longitudinal learning evidence** — tracking the same learner (via anonymised learner code) across assessments, terms, and academic years to measure growth
- **Advisory AI summaries** — LLM-generated natural-language briefs for teachers and school leaders, grounded in deterministic analytics and explicitly marked as advisory
- **Pilot programme evaluation** — measuring the impact of structured data collection on teaching responsiveness and learner outcomes
- **Future education data research** — anonymised, aggregated datasets for education policy analysis and planning

## Non-Intended Use

- **High-stakes automated decision-making** — the dataset is designed for advisory and analytical use only; no automated learner pass/fail, grade promotion, or certification decisions should be derived from it
- **Public learner profiling** — individual learner performance data must never be published or exposed outside the school-teacher-administrator trust boundary
- **Teacher performance evaluation** — aggregate class-level data may inform teaching reflection, but the dataset is not designed for teacher ranking, disciplinary use, or employment decisions
- **Real-time assessment delivery** — this is a post-assessment data layer, not an online testing platform
- **National curriculum replacement** — ZimLearnGraph aligns assessment data with the Zimbabwe curriculum; it does not define or replace the curriculum
- **Commercial learner data brokering** — no data in this dataset shall be sold, licensed, or transferred to third parties for commercial purposes

## Data Sources

| Source | Description | Format | Frequency |
|---|---|---|---|
| Teacher-marked assessments | Paper or digital tests, exams, topic exercises marked by the classroom teacher | Paper mark sheets, spreadsheet files, or CSV exports | Per assessment cycle (weekly / termly) |
| School academic records | Learner enrolment lists with class-group assignments and subject registration | Spreadsheet or SMS records | Termly |
| Teacher records | Teacher-subject-class group mappings | Spreadsheet or school timetable | Termly |
| Manual mark entry | Teacher or administrator enters marks into the ZimLearnGraph data interface | Web form / CSV upload | Per assessment |
| Intervention records | Teacher logs of remediation actions taken in response to weak-topic signals | Web form with structured fields | Per intervention event |
| Follow-up assessments | Re-assessment of previously weak topics to measure intervention impact | Mark entry (same pipeline) | Per follow-up cycle |

### Collection Method

Data collection follows a teacher-first, incremental adoption model:

1. **School onboarding** — school administrators register participating class groups, subjects, and teacher assignments in the system
2. **Learner code generation** — the system generates anonymised learner codes for each enrolled learner; the school retains the code-to-name mapping locally (not stored in the dataset)
3. **Assessment metadata entry** — teacher or administrator records assessment metadata: subject, topic(s) covered, date, assessment type, total marks
4. **Mark entry** — teacher enters learner marks via structured web form or bulk CSV upload
5. **Question-topic mapping** — each question or question group is mapped to a curriculum topic, enabling granular weakness analysis
6. **Analytics generation** — the system derives topic-level performance, weakness signals, and class-level summaries from structured mark data
7. **Intervention logging** — when a teacher acts on a weakness signal, they record the intervention type, date, and scope
8. **Follow-up assessment** — a subsequent assessment on the same topics is recorded and linked to the original weak signal

All collection happens through deterministic, structured data entry — no AI is used in the collection pipeline. AI operates only at the advisory summary layer.

## Fields Collected

See the [ZimLearnGraph Data Dictionary](zimlearngraph_data_dictionary.md) for the full field catalogue.

**Core entities:**

| Entity | Description |
|---|---|
| `school` | Participating school (name, code, sector, location) |
| `class_group` | A specific class within a school (year, stream) |
| `teacher` | Classroom teacher (anonymised staff code) |
| `learner` | Individual learner identified only by anonymised learner code |
| `subject` | Curriculum subject (Mathematics, English, Science, etc.) |
| `topic` | Curriculum topic within a subject (Algebra, Fractions, etc.) |
| `assessment` | A specific test/exam/assignment instance |
| `assessment_question` | A question or question group within an assessment |
| `mark_entry` | Individual learner mark on a particular question |
| `derived_topic_performance` | Calculated performance summary per learner per topic |
| `learner_risk_signal` | Automated flag indicating below-threshold topic mastery |
| `intervention` | Teacher-recorded remediation action |
| `follow_up_assessment_result` | Post-intervention re-assessment outcome |

## Anonymization Approach

ZimLearnGraph uses **learner-code-first anonymization** as its foundational privacy mechanism:

1. **Learner codes** — each learner is assigned a deterministic, non-identifying code (e.g., `ZLG-2026-S01-C03-L042`) at school onboarding; the school alone holds the code-to-name mapping
2. **No personal identifiers in the dataset** — learner names, national ID numbers, dates of birth, contact details, and guardian information are never collected or stored
3. **Teacher anonymisation** — teachers are represented by staff codes; full names are stored only at school level for operational purposes, never in the analytical dataset
4. **School-level aggregation** — dashboards and analytics default to class-group and school-level aggregation; individual learner data is visible only to the assigned teacher
5. **No GDPR-style consent bottleneck** — because no personally identifiable information (PII) is collected, the dataset falls outside the scope of data protection regimes that regulate PII processing; the school acts as data controller for the code-name mapping that never enters the system

## Quality Checks

See the [ZimLearnGraph Quality Framework](zimlearngraph_quality_framework.md) for detailed metrics and thresholds.

**Automated checks applied on every data load:**

| Check | Description |
|---|---|
| Learner code validity | All learner codes match the expected pattern |
| Assessment metadata presence | Date, subject, topic, and type are non-null |
| Question-topic mapping coverage | Every question is mapped to at least one curriculum topic |
| Mark range validation | All marks fall within 0..max_score |
| Completion check | Mark entry count matches expected learner roll for the class |
| Duplicate detection | Duplicate learner code within the same assessment is flagged |
| Score-in-range | No mark exceeds the question's maximum possible score |
| Missing score rate | Proportion of blank entries is tracked and threshold-alerted |
| Intervention linkage | Every flagged weakness has at least a recorded intervention decision |

## Known Limitations

- **Pilot scale** — the dataset is limited to participating pilot schools and may not represent national learner demographics
- **Teacher-driven data quality** — mark entry quality depends on teacher training and adoption; data may be incomplete during initial onboarding
- **No external validation** — derived weakness signals are based on teacher-assigned marks, not externally standardised assessments
- **Topic mapping consistency** — topic attribution relies on teacher judgement and the curriculum topic framework; inter-teacher variation exists
- **Intervention recording fidelity** — interventions are teacher-self-reported; recording completeness and accuracy depend on teacher engagement
- **Longitudinal coverage** — full-term and cross-year tracking requires sustained participation; learner mobility (transfers, dropouts) creates gaps
- **No direct learner outcome data** — the dataset captures assessment marks, not broader learner outcomes (attendance, wellbeing, progression)
- **Offline-first gap** — schools with limited connectivity may experience data submission delays; batch upload workflows address this but introduce latency

## Ethical Risks

| Risk | Mitigation |
|---|---|
| **Re-identification via triangulation** | Learner codes use sufficient entropy; school codes and class-group granularity are coarse enough to prevent easy triangulation |
| **Data quality bias** | Schools with stronger admin capacity contribute more/better data, potentially skewing aggregate insights |
| **Teacher burden** | Collection protocol is designed for minimal overhead; bulk CSV upload and batch workflows reduce per-assessment effort |
| **Dashboard misinterpretation** | All dashboards display deterministic analytics; advisory AI summaries are labelled as non-authoritative |
| **Stigmatisation of low-performing learners** | No public ranking or red/green labelling of individual learners; data is teacher-facing only |
| **Function creep** | Dataset governance explicitly limits use to advisory analytics; each deployment agreement specifies scope |
| **Pilot-to-national equity** | Early pilot schools may receive more attention/resources; scale-up plan includes equity criteria for school selection |

## Governance

- **Data controller** — the individual school holds the learner code-to-name mapping and controls data sharing
- **Data processor** — the ZimLearnGraph platform processes anonymised assessment data under school instruction
- **Access control** — role-based access: teachers see their own classes, school administrators see school-level aggregates, programme administrators see cross-school aggregate data only
- **Retention** — anonymised assessment data is retained for the duration of the learner's participation; schools may request deletion at any time
- **Audit trail** — all data entry, modification, and export events are logged with timestamp and actor
- **Review cycle** — the dataset and governance framework are reviewed each academic term
- **Funder transparency** — programme funders may receive aggregate, cross-school analytics only (no individual learner or class-level data)

## Pilot Scope

- **Duration:** 2 academic terms (approximately 24 weeks)
- **Schools:** 5–10 volunteer schools across urban and peri-urban Zimbabwe
- **Subjects:** English, Mathematics, Science (ZIMSEC Ordinary Level)
- **Learners:** ~500–1,000 learners across participating class groups
- **Assessments:** All teacher-marked assessments within pilot subjects during the pilot period
- **Topics:** Curriculum topics as defined by the ZIMSEC Ordinary Level syllabus for each subject
- **Interventions:** Teacher-logged classroom-level interventions in response to weakness signals
- **Success criteria:**
  - ≥ 90% learner code completeness
  - ≥ 85% assessment metadata completeness
  - ≥ 80% question-topic mapping coverage
  - ≥ 1 intervention recorded per flagged weakness signal
  - Teacher satisfaction survey ≥ 3.5 / 5

## Future Scaling Path

1. **Term 2 expansion** — extend to additional subjects (History, Geography, Agriculture) and class groups within pilot schools
2. **Term 3–4 scale** — onboard 10–30 schools across all 10 provinces, with emphasis on underserved districts
3. **Year 2: National pilot** — 50–100 schools, all core ZIMSEC subjects, primary + secondary, formal partnership with MoPSE
4. **Year 3: AI4I Data Track** — full dataset publication as an AI4I-recognised data resource, training data for education-specific AI models
5. **Year 3–5: Learning intelligence infrastructure** — standards alignment (Ed-Fi inspired vocabulary, 1EdTech CASE-inspired topic modelling, xAPI-inspired event logging), integration with national EMIS, open dataset for approved research

---

*ZimLearnGraph is designed as an AI-ready education assessment data layer — converting teacher-marked tests into structured learning evidence. The dashboard is a proof/interface layer. The core innovation is the structured dataset pipeline.*
