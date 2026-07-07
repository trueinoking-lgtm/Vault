# Judge Alignment Matrix: ZimLearnGraph

> **AI4I Data Track — Mapping the Project to AI4I Judging Criteria**

---

## Scoring Legend

| Score | Meaning |
|---|---|
| ★★★ | Strong alignment — evidence provided, central to the project |
| ★★☆ | Moderate alignment — present but not primary |
| ★☆☆ | Minimal alignment — ancillary or future-state |
| ☆☆☆ | Not applicable or absent |

---

## Criteria: Problem Relevance — ★★★

| Sub-criterion | Score | Evidence |
|---|---|---|
| Is the problem clearly defined? | ★★★ | Five interlocking barriers documented with specific, observable consequences per stakeholder group |
| Is the problem significant for Zimbabwe/Africa? | ★★★ | Affects every school, every learner; assessment data is universally generated and universally trapped |
| Does the applicant demonstrate local understanding? | ★★★ | Designed specifically for Zimbabwe's classroom reality (paper assessments, teacher-driven marking, low connectivity, ZIMSEC curriculum) |
| Is the timing right? | ★★★ | National AI Policy Framework prioritises data infrastructure; MoPSE seeks evidence-based tools; MVP exists now |

**Judge note:** The problem is not speculative — it describes a structural failure in how every school in Zimbabwe handles assessment data. The applicant demonstrates specific, on-the-ground understanding of Zimbabwe's education system constraints.

---

## Criteria: Innovation — ★★★

| Sub-criterion | Score | Evidence |
|---|---|---|
| Is the solution novel? | ★★★ | First structured, privacy-preserving, AI-ready education assessment dataset purpose-built for Zimbabwe's constraints |
| Is the innovation technical, social, or both? | ★★☆ | Primarily structural/technical (privacy architecture, collection protocol, quality framework); social innovation in teacher-centred design |
| Does it go beyond "apply AI to existing data"? | ★★★ | Core innovation is the data infrastructure itself — AI is an advisory layer built on top of deterministic analytics |
| Is the innovation replicable? | ★★★ | Protocol, schema, and governance are transferable to any subject, school, or country |

**Judge note:** The innovation is creating the dataset that doesn't exist — not applying AI to data that already does. This is a genuine structural innovation for education data in developing contexts.

---

## Criteria: Data Readiness — ★★★

| Sub-criterion | Score | Evidence |
|---|---|---|
| Is the data pipeline specified? | ★★★ | Complete data dictionary (14 entities), formal schema (SQL DDL, 29 FK constraints), 8-step collection protocol |
| Is data quality addressed? | ★★★ | 10 quality metrics with formulas, 3-tier thresholds, automated monitoring, remediation protocols |
| Is privacy incorporated from the start? | ★★★ | Learner-code-first design; no PII fields in schema; school holds the only identifier mapping; RBAC model |
| Is the data pipeline feasible in context? | ★★★ | Offline CSV workflow, batch upload, teacher-first design, topic registry aligned to existing curriculum |
| Is the dataset documented? | ★★★ | Complete dataset card, data dictionary, collection protocol, quality framework, privacy governance — all published |

**Judge note:** Data readiness is exceptionally strong. The entire pipeline is documented, specified, and ready for deployment. This is the project's core strength.

---

## Criteria: Feasibility — ★★★

| Sub-criterion | Score | Evidence |
|---|---|---|
| Is the implementation plan realistic? | ★★★ | 24-week pilot with phased milestones (4-week setup, 12-week collection, 8-week analysis); no unrealistic assumptions |
| Are risks identified and mitigated? | ★★★ | 8 specific risks with likelihood, impact, and detailed mitigation strategies documented in AI4I strategy |
| Is the team capable? | ★★☆ | MVP exists demonstrating technical capability; pilot would build operational capacity |
| Is the budget realistic for the scope? | ★★★ | $75,000 budget aligns with 5–10 schools, 1–2 staff, 24-week deployment; lean with clear value-for-money metrics |

**Judge note:** Feasibility is well-demonstrated by the existing MVP. The 24-week timeline is aggressive but achievable with the over-recruitment and risk mitigation strategies described.

---

## Criteria: Responsible AI — ★★★

| Sub-criterion | Score | Evidence |
|---|---|---|
| Are ethical risks identified? | ★★★ | Dataset card documents 7 ethical risks with specific mitigations; privacy governance dedicates full section |
| Is AI positioned appropriately? | ★★★ | AI is explicitly advisory only; summaries labelled as non-authoritative; deterministic analytics are source of truth |
| Are high-stakes automated decisions prohibited? | ★★★ | Explicitly prohibited in non-intended use, privacy governance, and ethical safeguards |
| Is there a human-in-the-loop? | ★★★ | Teacher reviews all weakness signals before action; acknowledges each signal; records professional judgement |

**Judge note:** Exemplary approach to responsible AI. The project is architecturally designed so that AI cannot make decisions — it can only summarise what deterministic analytics have already computed. This is a defensible, trustworthy design.

---

## Criteria: Privacy — ★★★

| Sub-criterion | Score | Evidence |
|---|---|---|
| Is privacy built into the architecture? | ★★★ | Learner codes from day one; no PII fields in schema; no place for a learner name |
| Is the privacy model transparent? | ★★★ | Complete privacy governance document; published data processing agreement template; annual transparency report |
| Who controls the data? | ★★★ | School is data controller; platform is data processor; school can withdraw and delete data at any time |
| Are data retention and deletion defined? | ★★★ | 2-year retention for anonymised data; 3-year audit logs; school-side mapping per school policy |

**Judge note:** Privacy is the project's strongest architectural feature. The learner-code-first approach is not bolted on — it is schema-enforced. No PII can be stored because there is nowhere to put it.

---

## Criteria: Scalability — ★★★

| Sub-criterion | Score | Evidence |
|---|---|---|
| Can the solution grow horizontally? | ★★★ | Adding schools is a procedural onboarding process; per-school cost decreases with scale |
| Can it grow vertically? | ★★★ | Adding subjects means extending the topic registry; schema supports any curriculum subject |
| Can it grow geographically? | ★★★ | Offline CSV workflow works in rural areas; protocol is school-type agnostic (government, private, mission) |
| Is there a national-scale pathway? | ★★★ | Documented 5-phase scaling path: Term 2 → Term 3–4 → Year 2 (national pilot) → Year 3 (AI4I Data Track) → Year 3–5 (learning intelligence infrastructure) |

**Judge note:** Scalability is designed-in from the start. Each school is an independent unit; expanding means onboarding more units, not redesigning the system. The scaling path is concrete and phased.

---

## Criteria: Local/National Impact — ★★★

| Sub-criterion | Score | Evidence |
|---|---|---|
| Does the project benefit Zimbabwean learners? | ★★★ | Directly: teachers get topic-level weakness data, learners get targeted interventions. Indirectly: longitudinal dataset enables systemic improvement |
| Does it benefit teachers? | ★★★ | Reduces reliance on memory; provides actionable data for intervention decisions; structured data reduces end-of-term reporting burden |
| Does it benefit school leaders? | ★★★ | Aggregate performance dashboards by class, subject, topic for data-driven resource allocation |
| Does it align with national priorities? | ★★★ | Maps to National AI Policy Framework (4 priorities) and MoPSE education data strategy outcomes (4 outcomes) |

**Judge note:** Impact is multi-stakeholder — learners, teachers, school leaders, and national planners all benefit. The project does not extract value; it builds local capacity.

---

## Criteria: Sustainability — ★★★

| Sub-criterion | Score | Evidence |
|---|---|---|
| Can the project continue without ongoing funding? | ★★★ | Low infrastructure cost; data collection protocol works with existing teacher duties; schools retain capability post-pilot |
| Is the model financially sustainable? | ★★☆ | Pilot requires funding; national scale would require government or donor partnership; open-source design minimises licensing costs |
| Is there institutional buy-in? | ★☆☆ | District engagement planned in pilot; MoPSE alignment is Year 2 goal — not yet achieved |
| Is the knowledge/skill transferable? | ★★★ | Teachers learn structured data entry, topic mapping, intervention tracking — skills that outlast the pilot |

**Judge note:** Operational sustainability is strong (low cost, existing staff, open tools). Financial sustainability beyond pilot requires a transition plan — a reasonable expectation at this stage.

---

## Criteria: Measurable Outcomes — ★★★

| Sub-criterion | Score | Evidence |
|---|---|---|
| Are outcome metrics defined? | ★★★ | 9 primary metrics + 5 secondary + 4 long-term — all with formulas, targets, and collection methods |
| Are targets realistic? | ★★★ | Pilot targets are achievable (90% completeness, 80% mapping coverage, 70% intervention linkage) with stretch goals |
| Is measurement built into the system? | ★★★ | Quality framework is automated; metrics computed from database; no self-report bias for most metrics |
| Is there an evaluation plan? | ★★★ | Mid-pilot evaluation + end-of-pilot impact report + teacher survey + independent quality audit |

**Judge note:** Measurement is a strength. Every metric has a defined computation, an automated collection method, and a transparent reporting process. Judges can verify the claims.

---

## Overall Scoring Summary

| Criteria | Rating | Key Strength |
|---|---|---|
| Problem Relevance | ★★★ | Specific, significant, well-understood |
| Innovation | ★★★ | Structural, not algorithmic; dataset-first |
| Data Readiness | ★★★ | Complete, documented, deployment-ready |
| Feasibility | ★★★ | MVP exists; realistic plan and budget |
| Responsible AI | ★★★ | Advisory-only; deterministic source of truth |
| Privacy | ★★★ | Architecture-enforced; learner-code-first |
| Scalability | ★★★ | Designed for scale; independent school units |
| Local/National Impact | ★★★ | Multi-stakeholder; aligned with national priorities |
| Sustainability | ★★☆ | Operational yes; financial transition needed |
| Measurable Outcomes | ★★★ | Quantified, automated, verifiable |

**Overall Assessment:** ★★★ (9/10 criteria at highest rating)

---

## Recommended Messaging for Each Criterion

| Criteria | Key Message |
|---|---|
| Problem Relevance | "Zimbabwe's assessment data is trapped — we free it." |
| Innovation | "This is not an AI wrapper. This is data infrastructure that makes AI possible." |
| Data Readiness | "Complete pipeline. MVP live. Schema, protocol, quality, governance — all documented." |
| Feasibility | "Low risk. Teacher-first design. Offline workflow. Over-recruitment buffer." |
| Responsible AI | "AI advises. Teachers decide. Deterministic analytics are the truth." |
| Privacy | "No learner name ever touches the dataset. Schema-enforced. School-controlled." |
| Scalability | "One school works. A thousand works the same way. Protocol doesn't change." |
| Local/National Impact | "Teachers get usable data. Leaders get dashboards. MoPSE gets a national template." |
| Sustainability | "Low cost. Open schema. Skills stay in schools. Data outlasts the pilot." |
| Measurable Outcomes | "9 primary metrics, all formula-defined, all automatically collected, all transparent." |

---

*This alignment matrix is designed to help judges evaluate ZimLearnGraph against the AI4I Data Track criteria. Every claim is supported by specific evidence from the application package or existing deliverables.*
