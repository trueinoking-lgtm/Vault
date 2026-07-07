# Judge Alignment Matrix: ZimLearnGraph

> **Mapping the project to likely AI4I judging concerns — with evidence of what exists and what a pilot would prove.**

---

## Problem Relevance

| What judges may care about | How ZimLearnGraph answers it | Proof we already have | Next evidence needed |
|---|---|---|---|
| Is the problem real and significant? | Zimbabwean schools generate millions of assessment records every term — all trapped in paper/unstructured formats. This is not a hypothetical problem. | Dataset card: motivation section; Problem statement in application draft | Pilot data would provide concrete examples of lost signals |
| Is it a Zimbabwe/Africa problem specifically? | Designed for Zimbabwe's classroom reality: paper assessments, teacher-driven marking, low connectivity, ZIMSEC curriculum | Collection protocol: offline CSV workflow; Topic registry aligned to ZIMSEC syllabus | Pilot would demonstrate protocol works in target schools |
| Does the applicant understand local constraints? | Teacher-first design, minimal overhead (15 min per assessment), school champion model, cluster-based training | Collection protocol; Budget (25% training/onboarding) | Teacher satisfaction data from pilot |

---

## Data Track Fit

| What judges may care about | How ZimLearnGraph answers it | Proof we already have | Next evidence needed |
|---|---|---|---|
| Is this genuinely a Data Track project? | The dataset itself is the innovation — schema, privacy model, quality framework, AI-readiness levels. Dashboard is proof layer only. | Data asset features doc; Data track fit doc; 7 docs in docs/data/ | Pilot dataset export would demonstrate the data asset |
| Could this also work as Design Track? | Design Track is secondary because the dashboard proves data utility, not the core innovation. The hard/valuable part is the data pipeline. | Data track fit doc; Application draft positioning | — |
| What makes this a dataset contribution vs a tool? | Dataset is versioned, quality-scored, documented, reusable across many AI applications. | Data asset features: dataset versioning, quality scoring, export formats | Pilot dataset with quality scorecard |

---

## Innovation

| What judges may care about | How ZimLearnGraph answers it | Proof we already have | Next evidence needed |
|---|---|---|---|
| Is the solution novel? | First structured, privacy-preserving, AI-ready education assessment dataset purpose-built for Zimbabwe's constraints | Schema; Privacy governance; AI-readiness levels | Comparison with existing EMIS data |
| Is this just "apply AI to existing data"? | The innovation is creating the data that does not exist — not applying AI to data that already does. AI is advisory only. | Data track fit doc; Responsible AI safeguards | — |
| Is the innovation technical or structural? | Structural: privacy architecture, collection protocol for low-connectivity, quality framework, intervention-outcome linkage | All 7 docs in docs/data/ | Pilot would validate structural decisions work in practice |
| Can the innovation be replicated? | Protocol, schema, and governance are transferable to any subject, school type, or country | Collection protocol; Schema DDL; Privacy governance | Replication guide after pilot |

---

## Feasibility

| What judges may care about | How ZimLearnGraph answers it | Proof we already have | Next evidence needed |
|---|---|---|---|
| Is the plan realistic? | 24-week pilot with phased milestones, clear deliverables, over-recruitment buffer | Application draft: pilot pathway; Budget doc | Pilot execution |
| Are risks identified? | 8 specific risks with likelihood, impact, and detailed mitigations | FAQ defense doc; AI4I strategy doc | Risk register updates during pilot |
| Is the timeline achievable? | MVP already exists — not starting from scratch. Pilot is validation, not construction. | Why us doc: what already exists | Pilot timeline tracking |
| Can the team deliver? | Full working MVP exists. Complete data package exists. Public landing page exists. | Why us doc; Live MVP dashboard | — |

---

## Evidence of Execution

| What judges may care about | How ZimLearnGraph answers it | Proof we already have | Next evidence needed |
|---|---|---|---|
| Has anything been built? | Complete data pipeline with seeded data. Live landing page. 7 documents. Analytics engine. | Why us doc: comprehensive table of existing deliverables | Pilot data collection |
| Is it real or just a concept? | Working MVP at public domain. Seeded dataset with full assessment-to-intervention flow. | Live dashboard; Seeded dataset | Real school data |
| What stage is the project at? | Post-MVP, pre-pilot. Pipeline is built and documented. Ready for real-school validation. | Why us doc: readiness table | Pilot kickoff |

---

## Responsible AI

| What judges may care about | How ZimLearnGraph answers it | Proof we already have | Next evidence needed |
|---|---|---|---|
| Is AI used appropriately? | AI is advisory only. Deterministic analytics are source of truth. AI generates natural-language briefs from computed data. | Privacy governance: AI summaries advisory only; Collection protocol footer | — |
| Are there safeguards against harm? | No automated high-stakes decisions. No pass/fail or promotion by system. Teacher-in-the-loop for all interventions. | Responsible AI safeguards in application draft; Non-intended use in dataset card | Pilot would demonstrate teacher-in-the-loop |
| Can the system be misused? | Non-intended uses explicitly documented. Governance limits use to advisory analytics. Data processing agreements per school. | Dataset card: non-intended use; Privacy governance | Deployment agreements |

---

## Privacy

| What judges may care about | How ZimLearnGraph answers it | Proof we already have | Next evidence needed |
|---|---|---|---|
| How is learner data protected? | Learner-code-first, no PII in schema, school controls mapping, RBAC enforced | Privacy governance; Schema (zero PII fields) | Privacy audit during pilot |
| What happens if there is a breach? | Breach response plan: 24-hour assessment, 72-hour notification, remediation, transparency report | Privacy governance: breach response section | — |
| Who controls the data? | School is data controller. Platform is data processor. School can withdraw and delete data. | Privacy governance: data governance structure | Data processing agreements executed |
| Is the privacy model transparent? | Complete published governance document. Data processing agreement template. Annual transparency report planned. | Privacy governance document | First transparency report |

---

## Scalability

| What judges may care about | How ZimLearnGraph answers it | Proof we already have | Next evidence needed |
|---|---|---|---|
| Can this grow beyond a pilot? | Each school is an independent data unit. Protocol does not change between 5 schools and 500. | Dataset card: future scaling path; Data asset features | Pilot demonstrates per-school onboarding efficiency |
| Does it work in different school types? | Protocol is school-type agnostic (government, private, mission). Offline CSV works in rural areas. | Collection protocol; Privacy governance works for any school type | Pilot includes diverse school types |
| Can it handle more subjects? | Topic registry is expandable. Schema supports any ZIMSEC subject. Adding subjects means extending the registry. | Schema; Data dictionary | Expanded topic registry for additional subjects |

---

## Public Value

| What judges may care about | How ZimLearnGraph answers it | Proof we already have | Next evidence needed |
|---|---|---|---|
| Who benefits from this? | Teachers get topic-level weakness data. School leaders get aggregate analytics. Learners get targeted interventions. | Application draft: problem statement; Impact model doc | Pilot impact report |
| Does it align with national priorities? | Maps to National AI Policy Framework (data infrastructure, privacy, home-grown AI data) and MoPSE education data strategy | AI4I strategy doc: national alignment section | — |
| Is the value equitably distributed? | Pilot includes peri-urban schools. Offline design ensures connectivity is not a barrier. Privacy protects all learners equally. | Collection protocol: offline workflow; Pilot scope includes diverse schools | Equity analysis in pilot report |

---

## Measurable Outcomes

| What judges may care about | How ZimLearnGraph answers it | Proof we already have | Next evidence needed |
|---|---|---|---|
| Can outcomes be measured? | 9 primary impact metrics with defined formulas, targets, and collection methods | Impact model doc; Quality framework | Pilot metric reports |
| Are targets realistic? | Pilot targets are achievable (90% completeness, 80% mapping, 70% linkage) with stretch goals | Quality framework: pilot targets summary | Quality metric trends during pilot |
| Is measurement built into the system? | Quality framework is automated — metrics computed from database. No self-report bias for core indicators. | Quality framework: automated computation | — |

---

## Sustainability

| What judges may care about | How ZimLearnGraph answers it | Proof we already have | Next evidence needed |
|---|---|---|---|
| Can this continue after AI4I support? | Low infrastructure cost. Data collection uses existing teacher duties. Open schema, no proprietary lock-in. | Application draft: sustainability section | Post-pilot continuation data |
| Are skills transferred to local teams? | Training and onboarding build teacher capability. School champion model creates local ownership. | Collection protocol: training; Budget: school champion stipends | Teacher capability assessment |
| Is the model financially sustainable? | Operational costs are low (CSV upload, cloud analytics). Government or donor funding for national scale. | Budget doc: cost containment notes | Cost-per-school analysis after pilot |

---

## Summary

| Criterion | Strength | Key Evidence |
|---|---|---|
| Problem relevance | ★★★ Real, significant, well-understood | Dataset card problem statement |
| Data Track fit | ★★★ Dataset is the product | Data track fit doc, 7 data documents |
| Innovation | ★★★ Structural, not algorithmic | AI-readiness levels, privacy architecture |
| Feasibility | ★★★ MVP exists, plan is realistic | Why us doc, pilot pathway |
| Evidence of execution | ★★★ Live MVP, complete docs | Why us doc, live dashboard |
| Responsible AI | ★★★ Advisory-only, deterministic truth | Privacy governance, safeguard sections |
| Privacy | ★★★ Architecture-enforced | Privacy governance, schema-zero PII |
| Scalability | ★★★ Designed for scale | Future scaling path, independent school units |
| Public value | ★★★ Multi-stakeholder, nationally aligned | AI4I strategy national alignment |
| Measurable outcomes | ★★★ 9 metrics, formula-defined, automated | Quality framework, impact model |
| Sustainability | ★★★ Low cost, open, transferable | Budget notes, open schema |

---

*This matrix is designed to help judges evaluate ZimLearnGraph against the AI4I Data Track criteria. Every claim is supported by specific evidence from existing deliverables.*
