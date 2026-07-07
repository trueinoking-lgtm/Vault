# ZimLearnGraph: Data Asset Features

> **Detailed specification of the ZimLearnGraph dataset as an AI-ready data asset.**

---

## Dataset Identity

| Attribute | Value |
|---|---|
| **Name** | ZimLearnGraph Education Assessment Dataset |
| **Version** | 0.1.0 (pilot) |
| **Type** | Relational — 11 core entities, 14 total tables |
| **Subject domain** | Education assessment data (ZIMSEC Ordinary Level) |
| **Geographic scope** | Zimbabwe (pilot: Harare and peri-urban schools) |
| **Language** | English |
| **License** | Research/AI4I use — governed by data processing agreement with participating schools |

---

## Dataset Versioning

Every dataset snapshot carries a semantic version identifier (`major.minor.patch`):

- **Major** — schema changes that break backward compatibility
- **Minor** — new entities, new quality metrics, expanded topic registries
- **Patch** — data corrections, quality improvements, re-exports

Version metadata is stored in a dedicated `programme_metadata` table and included in every export header.

---

## Dataset Card

A published dataset card (Datasheet-style) documents:
- Motivation — why the dataset was created
- Intended use — appropriate applications
- Non-intended use — explicitly prohibited applications
- Data sources — how data enters the pipeline
- Collection method — step-by-step protocol
- Fields collected — complete catalogue
- Anonymization — learner-code-first, no PII
- Quality checks — 10 automated metrics
- Known limitations — pilot scale, teacher-driven quality, topic mapping variation
- Ethical risks — 7 identified with specific mitigations
- Governance — controller/processor model, access control, retention
- Pilot scope — what the current version covers
- Future scaling path — five-phase expansion plan

---

## Data Dictionary

Complete field-level specification across 14 entities:

| Entity | Fields | Key Relationships |
|---|---|---|
| `school` | 8 fields | Parent of class_group, teacher, learner |
| `class_group` | 6 fields | FK → school, parent of learner |
| `teacher` | 5 fields | FK → school |
| `learner` | 6 fields | FK → school, class_group; identified by anonymised learner code |
| `subject` | 4 fields | Parent of topic |
| `topic` | 7 fields | FK → subject; supports hierarchical parent_topic |
| `assessment` | 12 fields | FK → school, class_group, teacher, subject |
| `assessment_question` | 9 fields | FK → assessment, topic (primary + secondary) |
| `mark_entry` | 9 fields | FK → assessment, question, learner, teacher |
| `derived_topic_performance` | 11 fields | FK → learner, topic, subject; computed by analytics pipeline |
| `learner_risk_signal` | 9 fields | FK → learner, topic, subject; auto-generated from performance |
| `intervention` | 9 fields | FK → learner_risk_signal, teacher |
| `follow_up_assessment_result` | 9 fields | FK → assessment, intervention, learner, topic |
| `programme_metadata` | 8 fields | Dataset-level versioning and provenance |

Every field includes: name, type, required flag, description, and constraints.

---

## Schema

Formal DDL (SQLite-compliant) with:
- 14 CREATE TABLE statements
- 29 foreign key constraints with ON DELETE actions
- CHECK constraints for enumerations and ranges
- UNIQUE constraints for business rules
- Indexes on frequently queried columns
- Complete referential integrity summary table

The schema is implementable in PostgreSQL, SQLite, and SurrealDB with minimal adaptation.

---

## Data Lineage

Every data point in ZimLearnGraph has a traceable origin:

```
Source (teacher marks paper) 
  → CSV upload or web form entry by identified teacher
    → System validation (range, completeness, uniqueness) 
      → Stored mark_entry record with timestamp and entered_by
        → Analytics engine derives topic_performance
          → Risk signal generated from performance threshold
            → Intervention recorded by teacher, linked to signal
              → Follow-up assessment result linked to intervention
```

Every record carries `entry_timestamp` and `entered_by` for full auditability.

---

## Learner-Code Privacy Model

The privacy model is architecture-enforced, not policy-only:

- **Learner codes generated at onboarding** — pattern: `ZLG-{YYYY}-S{school_seq}-C{class_seq}-L{learner_seq}`
- **School holds the code-to-name mapping** — never enters the dataset
- **No PII fields in schema** — no `learner_name`, `date_of_birth`, `national_id`, `guardian_name`, or `address`
- **Role-based access** — teachers see own classes, administrators see aggregates, programme see cross-school
- **School is data controller** — platform processes anonymised data under school instruction
- **Retention and deletion** — defined per data type, school may request full deletion

---

## Question-Topic Mapping

Every assessment question is linked to at least one curriculum topic. This enables:

- Topic-level performance derivation
- Weakness detection at topic granularity
- Cross-assessment topic tracking
- Intervention targeting on specific topics
- Follow-up assessment on previously weak topics

The topic registry is aligned to ZIMSEC Ordinary Level syllabuses for English, Mathematics, and Science.

---

## Intervention Linkage

Each intervention record links back to the originating `learner_risk_signal`, which in turn links to the specific `topic_id` and `learner_code`. This preserves the full chain:

```
Weak topic → Learner below threshold → Risk signal generated 
  → Teacher acknowledges → Teacher records intervention 
    → Follow-up assessment → Pre/post comparison
```

---

## Follow-Up Assessment Loop

The dataset captures the complete intervention feedback loop:

| Field | Purpose |
|---|---|
| `pre_intervention_score_pct` | Baseline topic score before intervention |
| `post_intervention_score_pct` | Topic score after intervention |
| `score_change_pct` | Difference (post - pre) |
| `intervention_effective` | True if improvement ≥ 10 percentage points |

This enables evidence-based teaching decisions: which intervention types are most effective for which topics.

---

## Quality Scoring

Ten automated metrics produce a quality score for every dataset snapshot:

| Metric | What It Measures | Formula |
|---|---|---|
| Q1 | Learner code completeness | (Learners with marks / Total learners) × 100 |
| Q2 | Metadata completeness | (Complete assessment records / Total) × 100 |
| Q3 | Question-topic mapping | (Mapped questions / Total questions) × 100 |
| Q4 | Mark completion rate | (Actual marks / Expected marks) × 100 |
| Q5 | Missing score rate | (Null scores / Non-absent entries) × 100 |
| Q6 | Invalid score rate | (Invalid scores / Total entries) × 100 |
| Q7 | Duplicate rate | (Duplicate assessments / Total) × 100 |
| Q8 | Intervention linkage | (Signals with interventions / Total signals) × 100 |
| Q9 | Follow-up coverage | (Interventions with follow-ups / Total) × 100 |
| Q10 | Dataset versioning | Version presence on all artefacts |

Each metric has Good / Warning / Critical thresholds with automated alerts and remediation protocols.

---

## AI-Readiness Levels

ZimLearnGraph defines a six-level maturity model for education assessment data:

| Level | Label | Description | AI Capability |
|---|---|---|---|
| **L0** | Raw marks | Paper mark books, isolated spreadsheets, term reports | No structured data for AI |
| **L1** | Learner-coded | Anonymised learner codes replace names; PII removed | Basic aggregate statistics possible |
| **L2** | Question-linked | Each mark connects to a specific question on a specific assessment | Per-question performance analysis |
| **L3** | Topic-mapped | Questions linked to curriculum topics; topic-level performance derived | Weakness detection, topic gap analysis |
| **L4** | Intervention-linked | Weakness signals connected to recorded interventions with follow-up tracking | Intervention effectiveness measurement, recommendation support |
| **L5** | Validated improvement | Pre/post comparisons with quality scoring; longitudinal learner trajectories | Predictive modelling, personalised learning pathways |

**Most schools today operate at L0.** ZimLearnGraph takes data from collection to **L3–L5** within a single workflow.

---

## Export Formats

The dataset supports multiple export formats:

| Format | Use Case |
|---|---|
| SQL DDL | Direct database instantiation |
| CSV | Spreadsheet analysis, import into other tools |
| JSON | API consumption, programmatic access |
| Quality report | Human-readable quality scorecard per export |

---

## Benchmark Tasks the Dataset Supports

The ZimLearnGraph dataset is designed to support the following benchmark tasks:

| Task | Description | Depends On |
|---|---|---|
| Weak topic classification | Identify topics where a learner or class is below proficiency | L3: topic mapping |
| Risk signal prediction | Predict which learners will need support based on early assessment data | L4: intervention linkage |
| Intervention effectiveness ranking | Rank intervention types by effectiveness for specific topics | L4: intervention linkage |
| Longitudinal performance forecasting | Forecast learner performance trajectory across terms | L5: validated improvement |
| Cross-school equity analysis | Compare topic-level performance across schools while preserving privacy | L3: topic mapping + anonymisation |

---

*ZimLearnGraph is an AI-ready education assessment data layer. These features make it a serious Data Track asset, not a dashboard project.*
