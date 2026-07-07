# FAQ & Defense: ZimLearnGraph

> **AI4I Data Track — Anticipated Questions**

---

## Q1: Is this just a dashboard?

**No.** The dashboard is the visible layer of a deeper data infrastructure.

ZimLearnGraph's core contribution is the dataset — its privacy architecture, collection protocol, quality framework, schema, and governance model. Behind the dashboard:

- A **data schema** with 14 entities, 29 foreign key constraints, and SQL DDL
- A **collection protocol** that works in low-connectivity, paper-based classrooms
- A **quality framework** with 10 automated metrics and 3-tier thresholds
- A **privacy governance** model with learner-code-first anonymisation and schema-enforced no-PII design
- A **dataset card** documenting intended use, limitations, and ethical risks

The dashboard is what you see. The data infrastructure is everything below the waterline.

---

## Q2: Why Data Track?

Because the dataset is the product. The structural innovation of ZimLearnGraph is not graphical — it is structural: how data is collected, linked, governed, and quality-controlled.

The Data Track is primary because:

- The dataset creates the value. The dashboard demonstrates the value.
- A dashboard without data is an empty interface.
- The data pipeline without a dashboard is still a functioning, impact-generating dataset.
- AI depends on data quality. ZimLearnGraph's Data Track contribution is the quality-controlled dataset that makes AI possible downstream.

The Design Track is secondary relevance, not primary focus.

---

## Q3: Where does AI fit?

AI is an advisory layer on top of deterministic analytics — not the core decision-making engine.

- **Deterministic analytics come first** — topic performance, weakness signals, and pre/post comparisons are computed algorithmically using defined formulas. No AI is involved.
- **AI summarises what analytics computed** — AI takes deterministic outputs and generates natural-language briefs for teachers and school leaders.
- **AI is labelled as advisory** — every AI-generated summary carries the message: "This summary is AI-generated and advisory only. Always verify against the underlying data."

AI is not required for ZimLearnGraph to generate value. The deterministic analytics layer — topic performance, weakness signals, intervention effectiveness — delivers standalone impact. AI adds interpretation on top.

---

## Q4: What data do you collect?

Only assessment-related data. No personal data.

| Collected | Not Collected |
|---|---|
| Assessment marks per question per learner | Learner names |
| Question-to-topic mappings | Dates of birth |
| Intervention records linked to weak topics | National ID numbers |
| Follow-up assessment results | Guardian or parent details |
| School metadata (type, district, province) | Home addresses |
| Teacher staff codes (anonymised) | Health or medical information |
| Learner codes (anonymised, school holds mapping) | Socio-economic data |

The schema has no PII fields. There is nowhere to store a learner name.

---

## Q5: How do you protect learners?

Privacy is not a policy on top of the system. It is the system's architectural foundation.

1. **Learner codes first** — each learner receives an anonymised code at school onboarding. The school holds the name-to-code mapping locally; it never enters the dataset.
2. **No PII fields in schema** — there is no field for learner name, date of birth, national ID, guardian name, or address.
3. **Role-based access** — teachers see only their own classes; school administrators see aggregates; programme administrators see cross-school aggregates only.
4. **School-controlled participation** — the school is the data controller. Schools may withdraw and request deletion at any time.
5. **Published governance** — complete privacy governance document, data processing agreement template, annual transparency report.

---

## Q6: What makes it AI-ready?

ZimLearnGraph defines six levels of AI-readiness for education assessment data:

| Level | State | What It Enables |
|---|---|---|
| L0 | Raw marks | Data exists but is inaccessible |
| L1 | Learner-coded | Privacy-preserving basic stats |
| L2 | Question-linked | Per-question analysis |
| L3 | Topic-mapped | Weakness detection, topic gap analysis |
| L4 | Intervention-linked | Intervention effectiveness measurement |
| L5 | Validated improvement | Predictive modelling, personalised pathways |

Most schools operate at L0. ZimLearnGraph takes data to L3–L5 within a single collection workflow. The dataset is AI-ready because it is structured, privacy-preserving, deterministically derived, quality-scored, versioned, and documented.

---

## Q7: What prevents poor data?

A multi-layered quality system that detects, alerts, and remediates — transparently.

- **Level 1 — Automated validation at entry:** Every submission checks learner codes, metadata, topic mappings, score ranges, duplicates, and expected counts.
- **Level 2 — 10 quality metrics with tiered thresholds:** Good/Warning/Critical. Warnings trigger notification. Critical triggers data quarantine and mandatory remediation.
- **Level 3 — Weekly human review:** A programme administrator reviews metrics per school per week, contacting teachers before issues compound.
- **Level 4 — Remediation protocol:** Green = monitor. Yellow = 7-day resolution window with support. Red = immediate quarantine, root cause analysis, corrective plan.

Bad data is not hidden. The quality dashboard is transparent. Remediation is supportive, not punitive.

---

## Q8: Why would teachers use this?

Because it does not ask them to do new work. It asks them to capture what they already know in a structured format.

- **Fifteen minutes per assessment class** — the estimated time to enter marks using a pre-populated CSV template
- **Offline CSV workflow** — download template, fill during class, upload when connected
- **No platform migration** — works with existing paper-based assessment practice
- **Immediate value** — teachers get topic-level weakness data, learner support lists, and intervention tracking in return for their data entry

Teachers already record marks. ZimLearnGraph makes that recording produce structured insight instead of a forgotten number.

---

## Q9: How does it scale?

Each school is an independent data unit. Scaling is procedural, not architectural.

- **Independent school units** — onboarding the 50th school uses the same protocol as onboarding the first
- **No cross-school dependency** — schools do not need to coordinate. Scaling is additive.
- **Curriculum-aligned topic registry** — the same topics work at any school following the ZIMSEC curriculum
- **Offline-friendly protocol** — rural schools without reliable internet participate via CSV upload. The protocol is identical.

The protocol does not change between 5 schools and 500. Only the number of onboarding cycles changes.

---

## Q10: What exists already?

A complete, working MVP:

- **Data pipeline** — full schema with 14 entities, 29 foreign key constraints, SQL DDL
- **Collection protocol** — 8-step SOP designed for Zimbabwe's classroom constraints
- **Quality framework** — 10 automated metrics with tiered thresholds
- **Privacy governance** — learner-code-first, schema-enforced, school-controlled
- **Analytics engine** — deterministic topic performance, weakness signals, intervention tracking
- **Public landing page** — live with seeded data showing full assessment-to-intervention flow
- **Complete documentation** — seven documents specifying every layer

We are not starting from zero. We are ready to turn a validated prototype into a real pilot dataset.

---

## Q11: What can be delivered during AI4I?

The AI4I support window enables the step from validated prototype to real-school pilot:

- Data collection pipeline deployed in 5–10 Zimbabwean schools
- Teachers trained on structured data entry and topic mapping
- Full assessment-to-intervention-to-follow-up cycle running with real data
- Quality thresholds calibrated against real classroom conditions
- Structured, quality-scored dataset exported and documented
- Pilot report with impact metrics, outcomes, and recommendations

Everything that can be built has been built. What remains is real-school validation.

---

## Q12: What is the long-term dream?

ZimLearnGraph's long-term vision is a national learning intelligence infrastructure — a structured, privacy-preserving education dataset that serves as a foundational resource for:

- **Evidence-based teaching** — every teacher has topic-level visibility into learner performance
- **School-level planning** — leaders allocate resources based on data, not intuition
- **Education research** — researchers access granular, longitudinal learning data
- **Zimbabwe-specific AI** — AI models trained on Zimbabwean education data, not generic foreign datasets
- **Policy decisions** — MoPSE has topic-level learning evidence across the system

The path: pilot (5–10 schools) → multi-school scale (10–50) → national pilot (50–100) → learning intelligence infrastructure. Each step uses the same protocol. The architecture does not change. Only the number of schools changes.

---

*ZimLearnGraph: data infrastructure first. AI second. Impact always.*
