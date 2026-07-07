# ZimLearnGraph Privacy & Governance Framework

> **Privacy-by-design principles, data governance structure, and ethical safeguards for the ZimLearnGraph education assessment dataset.**

**Version:** 0.1.0 — Pilot Scope  
**Last Updated:** 2026-07-07

---

## Core Principle

**Privacy is not a compliance checkbox — it is the architectural foundation of the dataset.**

ZimLearnGraph is designed from the ground up so that no personally identifiable information (PII) ever enters the analytical dataset. Learner codes are the primary identifier; the name-to-code mapping is held exclusively by the school, outside the system boundary. This eliminates the most common vector for education data breaches before it exists.

---

## Privacy by Design: Seven Principles

### 1. Proactive Not Reactive; Preventative Not Remedial

- Learner codes are generated at onboarding, before any data collection begins
- No PII fields exist in the schema — there is nowhere to accidentally put a learner name
- Data entry interfaces accept learner codes only, not names
- System architecture prevents PII collection at the schema and application layers, not through policy alone

### 2. Privacy as the Default Setting

- **Learner codes first** — every learner is identified by an anonymised code; this is the default and only option
- **No public learner names** — learner names never appear in dashboards, exports, analytics, or AI summaries
- **Aggregate-first dashboards** — all dashboard views default to class-group or school-level aggregation; individual learner drill-down requires explicit teacher authentication and intent
- **Minimal data collection** — only assessment-related data is collected; no attendance, behaviour, health, demographic, or socio-economic data in MVP

### 3. Privacy Embedded into Design

- **Schema-level enforcement** — the data schema has no `learner_name`, `date_of_birth`, `national_id`, `guardian_name`, or `address` fields. PII cannot be stored because there is nowhere to store it.
- **Role-based access control** — teachers see their assigned classes only; school administrators see school-level aggregates; programme administrators see cross-school aggregate data only
- **Audit logging** — every data entry, modification, and export is logged with timestamp, actor, and action

### 4. Full Functionality — Positive-Sum, Not Zero-Sum

Privacy does not come at the expense of analytical utility:

- Learner codes support longitudinal tracking across terms and years
- Topic-level performance derivation works without knowing learner identities
- Intervention effectiveness analysis operates on anonymised data
- Schools maintain full control of their local code-to-name mapping for any necessary de-anonymisation (e.g., printing a personalised learning report for a parent-teacher meeting)

### 5. End-to-End Security

- All data in transit is encrypted (TLS 1.3 minimum)
- All data at rest is encrypted (AES-256)
- Access tokens are short-lived and scoped to role
- Bulk data exports require elevated authorisation
- No API endpoint returns raw learner-level data without authentication and authorisation

### 6. Visibility and Transparency

- The data dictionary, collection protocol, and quality framework are published and openly documented
- Participating schools receive a data processing agreement explaining exactly what data is collected, why, and how it is protected
- An annual transparency report summarises data access events, breach attempts (if any), and governance changes
- Schools may request a full export of their data at any time

### 7. Respect for User Privacy — Teacher- and School-Centric

- Teachers own their assessment records; the school controls participation
- Schools may withdraw from the pilot at any time and request deletion of their data
- No data is shared with third parties without explicit school consent
- Programme funders receive only anonymised, aggregate cross-school analytics

---

## Learner Codes: The Foundation

### Code Structure

```
ZLG-{YYYY}-S{school_seq}-C{class_seq}-L{learner_seq}
```

**Example:** `ZLG-2026-S01-C03-L042`

| Segment | Description | Example |
|---|---|---|
| `ZLG` | ZimLearnGraph namespace | `ZLG` |
| `YYYY` | Academic year of enrolment | `2026` |
| `S{school_seq}` | School sequence within the programme | `S01` |
| `C{class_seq}` | Class sequence within the school | `C03` |
| `L{learner_seq}` | Learner sequence within the class | `L042` |

### Code Management

- Codes are generated deterministically at school onboarding
- The school receives a local mapping document: learner name ↔ learner code
- This mapping is the **school's responsibility** to maintain, store securely, and update when learners transfer or leave
- The ZimLearnGraph system never receives or stores the mapping
- If a learner transfers to another pilot school, a new code is generated at the receiving school; the two codes cannot be linked without school-side intervention
- A learner returning in a subsequent academic year retains their code if enrolled at the same school (based on the school's local mapping)

---

## Data Governance Structure

### Data Controller

**Role:** The school  
**Responsibility:** Determines the purposes and means of processing assessment data; maintains the learner code-to-name mapping; controls data sharing and withdrawal

### Data Processor

**Role:** ZimLearnGraph platform operator  
**Responsibility:** Processes anonymised assessment data according to school instructions; maintains platform security; provides data export and deletion facilities

### Data Steward

**Role:** Programme Administrator  
**Responsibility:** Monitors data quality; enforces governance policies; conducts audits; manages role-based access; publishes transparency reports

---

## Access Control Model

| Role | Data Visibility | Actions |
|---|---|---|
| **Teacher** | Own classes only: mark entry, learner risk signals, intervention records, follow-up results | Create, read, update for own classes; view individual learner data within class |
| **School Administrator** | School-wide aggregate data; no individual learner-level data for other teachers' classes | Read school-level summaries; manage teacher and learner registrations |
| **Programme Administrator** | Cross-school aggregate data only | Read aggregate analytics; manage school onboarding; quality monitoring |
| **Researcher (future)** | Anonymised, aggregated, exported dataset with no school-identifying details | Read-only access to research snapshot |
| **Funder** | Cross-school aggregate trend data only | Read-only programme-level dashboards |

---

## Data Retention and Deletion

| Data Type | Retention Period | Deletion Process |
|---|---|---|
| Anonymised assessment data | Duration of learner participation + 2 academic years | School request or programme termination triggers full deletion |
| Audit logs | 3 years | Automated anonymisation after 3 years |
| School local code-name mapping | As determined by the school | Not in scope — maintained by school outside the system |
| Aggregate analytics (derived) | Indefinite (anonymised, non-re-identifiable) | N/A — no personal data present |

---

## Stakeholder Data Policy

### What Stakeholders See

| Stakeholder | Sees |
|---|---|
| **Teacher** | Class-level and individual learner analytics for their assigned classes |
| **School Head / Administrator** | School-level aggregate performance summaries across all classes |
| **Learners / Parents** | Teacher-shared individual reports generated from the school's local code-name mapping (via the school, not directly from the system) |
| **District / Ministry** | Aggregate trend data at district or national level (with school opt-in) |
| **Programme Funders** | Cross-school programme-level impact metrics (no individual learners, no identifiable schools) |

### AI Summaries: Advisory Only

- All AI-generated summaries are explicitly labelled as **advisory**, **non-authoritative**, and **teacher-check-required**
- AI summaries are grounded in deterministic analytics — the system computes topic performance and weakness signals algorithmically; the AI only rephrases these in natural language
- No AI makes decisions about learners, including pass/fail, promotion, or intervention assignment
- Teachers are trained to treat AI summaries as a starting point for their own professional judgement, not as truth
- AI summary headers include the message: *"This summary is AI-generated and advisory only. Always verify against the underlying data."*

---

## Ethical Safeguards

### No High-Stakes Automated Decisions

ZimLearnGraph explicitly prohibits:
- Automated pass/fail or grade promotion decisions
- Automated labelling or ranking of learners
- Automated referral to special programmes or interventions
- Algorithmic teacher performance evaluation
- Any decision that materially affects a learner's education trajectory without human judgement

### No PII in MVP

The MVP collects **no**:
- Learner names
- Dates of birth
- National ID numbers
- Guardian or parent details
- Home addresses
- Health or medical information
- Socio-economic data
- Behaviour or disciplinary records

### Anti-Stigmatisation

- No public leaderboards, rankings, or colour-coded individual performance displays
- Weakness signals use constructive language: "Needs Support" and "Monitor" rather than "Failing" or "Below Standard"
- Individual learner data is teacher-facing only; peers cannot see each other's results in the system
- Reports emphasise growth and improvement, not deficit

---

## Data Sharing and Third-Party Access

- **No data is sold.** ZimLearnGraph data is not a commercial asset.
- **No third-party data brokerage.** No data is transferred to marketing, analytics, or advertising platforms.
- **Approved research access.** Anonymised, aggregated dataset exports may be shared with approved education researchers under a data-sharing agreement that prohibits re-identification and commercial use.
- **Funder reporting.** Programme funders receive aggregate, cross-school trend data only — no individual learner or school-identifying data.

---

## Breach Response

In the event of a data breach:

1. **Immediate containment** — revoke compromised access tokens; isolate affected systems
2. **Assessment** — determine scope, affected records, and potential for re-identification within 24 hours
3. **Notification** — notify affected schools and programme funders within 72 hours
4. **Remediation** — close the vulnerability; strengthen controls
5. **Reporting** — include in the annual transparency report
6. **Review** — update governance framework to prevent recurrence

> **Because no PII is stored in the dataset, the breach impact is limited to anonymised assessment records. The most significant risk is re-identification via triangulation, which is mitigated by coarse school-class granularity and controlled access.**

---

## Governance Review Cycle

| Cadence | Review | Participants |
|---|---|---|
| Monthly | Privacy & governance checklist review | Data Steward |
| Per term | Full governance framework audit | Data Steward + external reviewer |
| Annual | Transparency report publication | Programme Lead |
| As needed | Policy updates for regulatory changes | Programme Lead + Legal Counsel |

---

*This privacy and governance framework is designed to be audit-ready for education sector data protection requirements. It aligns with the principles of the Zimbabwe Data Protection Act and international best practices for education data ethics, while remaining practical for a pilot-scale implementation.*
