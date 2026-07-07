# Executive Summary: ZimLearnGraph

> **Turning School Assessment Records into AI-Ready Learning Evidence**

**AI for International Impact (AI4I) — Data Track Application**

---

## The Problem

Zimbabwe's schools produce millions of assessment records every term — test scores, exam results, topic exercises — containing rich, granular signals about what learners know and where they struggle. This data is **trapped**: in paper mark books, teacher notebooks, isolated spreadsheets, and end-of-term reports. It is not standardised, not anonymised, not linked to curriculum topics, and not structured for any analytical or AI use.

The consequence: teachers make intervention decisions from memory, school leaders lack evidence for resource allocation, education researchers have no granular longitudinal dataset, and AI applications cannot be built because the foundational training data does not exist in structured, privacy-preserving form.

## The Solution

ZimLearnGraph is a structured data pipeline that converts Zimbabwe's existing teacher-marked assessments into a privacy-preserving, topic-linked, longitudinal dataset. It is designed for the country's classroom reality:

- **Paper-based assessments** — works with existing teacher marking, no platform migration
- **Offline-friendly** — CSV upload, batch processing, no real-time requirement
- **Low connectivity** — works in peri-urban and rural schools where internet is intermittent
- **National curriculum** — topic registry aligned with ZIMSEC Ordinary Level syllabuses

## Core Innovation

The innovation is structural, not algorithmic. ZimLearnGraph provides the **data layer** — the collection protocol, schema, quality framework, and privacy governance — that converts scattered marks into machine-readable learning evidence. The live dashboard is a proof/interface layer. AI summaries are explicitly advisory; deterministic analytics remain the source of truth.

## Current State

An MVP exists demonstrating the complete data flow with seeded data:
- Data Track: 7 documentation documents (dataset card, data dictionary, collection protocol, quality framework, privacy governance, schema, AI4I strategy)
- Design Track: Live landing page visualising the data layer
- Full schema with 11 core entities, 29 foreign key constraints, and SQL DDL
- 10 quality metrics with automated monitoring framework
- Privacy governance with learner-code-first anonymisation

## Ask

Funding to deploy a real pilot across 5–10 Zimbabwean schools (500–1,000 learners, 3 subjects, 2 academic terms), validating the pipeline with genuine classroom data, refining quality thresholds, training teachers, and producing verifiable impact evidence.

## Expected Outcomes

| Outcome | Target |
|---|---|
| Structured dataset | ≥ 500 learners across 5–10 schools |
| Data quality | ≥ 90% on all core metrics |
| Teacher adoption | ≥ 80% regularly submitting data |
| Intervention linkage | ≥ 70% of weakness signals linked to interventions |
| Intervention effectiveness | ≥ 60% of follow-ups show improvement |
| Scalable template | Validated pipeline ready for national deployment |

## Why Data Track

The Data Track is primary because the structural innovation is the **dataset itself** — its privacy-by-design architecture, teacher-centred collection protocol, deterministic analytics pipeline, and readiness for AI-augmented education intelligence. Without the data layer, there is no AI, no dashboard, no impact. The dashboard proves usefulness but is not the core innovation.

## Alignment

ZimLearnGraph directly aligns with Zimbabwe's National AI Policy Framework priorities (data as a national asset, privacy-preserving infrastructure, home-grown AI training data) and MoPSE's education data strategy outcomes (evidence-based teaching, intervention effectiveness measurement, longitudinal tracking).

---

*ZimLearnGraph is an AI4I Data Track submission. The data layer is the core innovation. The dashboard is the proof. AI is advisory. Impact is measurable.*
