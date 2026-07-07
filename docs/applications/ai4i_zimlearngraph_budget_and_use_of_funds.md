# Budget & Use of Funds: ZimLearnGraph

> **AI4I Data Track — Pilot Budget Breakdown and Allocation Rationale**

**Pilot Duration:** 2 academic terms (24 weeks)  
**Pilot Scope:** 5–10 schools, 500–1,000 learners, 3 subjects  
**Currency:** USD

---

## Budget Summary

| Category | Amount (USD) | % of Total |
|---|---|---|
| School Onboarding & Training | $18,750 | 25% |
| Data Collection & Cleaning | $11,250 | 15% |
| Teacher & Stakeholder Workshops | $7,500 | 10% |
| Data Quality Validation | $7,500 | 10% |
| Infrastructure & Hosting | $6,000 | 8% |
| Privacy & Governance Work | $6,000 | 8% |
| Product & Data Engineering | $11,250 | 15% |
| Reporting & Evaluation | $6,750 | 9% |
| **Total** | **$75,000** | **100%** |

---

## Detailed Breakdown

### 1. School Onboarding & Training — $18,750 (25%)

| Item | Detail | Cost | Notes |
|---|---|---|---|
| School recruitment | 10–12 school identification, application processing, selection | $1,500 | Over-recruit to ensure 5–10 active |
| Onboarding visits | In-person school visits (2 days each, 10 schools) | $6,000 | Travel, accommodation, per diem |
| Learner code generation | System setup, code generation, local mapping documents | $1,500 | Automated; minimal per-school cost |
| Teacher training workshops | 2-day workshop per school cluster (5 clusters × 5 teachers) | $5,000 | Training materials, venue, facilitator |
| School champion stipends | 1 champion per school, 10 schools × 24 weeks | $3,600 | $15/week local coordinator stipend |
| Training materials | Printed guides, quick-reference cards, CSV templates | $1,150 | Print + laminate for durability |

**Rationale:** Teacher training is the highest-leverage investment in the pilot. Well-trained teachers produce high-quality data, adopt the protocol consistently, and become advocates for the system within their schools. In-person onboarding builds trust and demonstrates commitment.

### 2. Data Collection & Cleaning — $11,250 (15%)

| Item | Detail | Cost |
|---|---|---|
| Data entry support | Part-time data entry administrator (24 weeks × $200/week) | $4,800 |
| Bulk CSV processing | OCR scanning assistance for paper-to-digital transcription | $2,000 |
| Data cleaning & validation | Manual review of flagged records, error correction support | $2,500 |
| Interviewer/assistant travel | School visits for data collection support (monthly, 5 months) | $1,950 |

**Rationale:** During pilot phase, manual data cleaning and support are necessary to establish quality baselines and refine validation rules. This investment decreases as automated validation improves.

### 3. Teacher & Stakeholder Workshops — $7,500 (10%)

| Item | Detail | Cost |
|---|---|---|
| Mid-pilot review workshop | Cluster-based half-day workshop, 5 locations | $2,500 |
| End-of-pilot feedback session | Full-day session with teacher representatives from all schools | $2,000 |
| School leadership briefing | Half-day session for school heads and administrators | $1,500 |
| District education office briefing | Stakeholder engagement with district education officials | $1,500 |

**Rationale:** Workshops serve dual purposes: (a) improving data quality through shared learning, and (b) building stakeholder buy-in for scaling. District office engagement is critical for future MoPSE alignment.

### 4. Data Quality Validation — $7,500 (10%)

| Item | Detail | Cost |
|---|---|---|
| Quality monitoring system | Automated dashboard development and maintenance | $2,500 |
| Weekly quality reviews | Programme administrator time for weekly quality assessment | $2,500 |
| Remediation support | Targeted teacher support for quality improvement | $1,500 |
| End-of-pilot quality audit | Independent data quality review | $1,000 |

**Rationale:** Quality is the credibility of the dataset. Investment in quality monitoring ensures the pilot produces trusted, defensible data.

### 5. Infrastructure & Hosting — $6,000 (8%)

| Item | Detail | Cost |
|---|---|---|
| Cloud hosting (24 weeks) | Application server, database, file storage, backup | $2,400 |
| Domain & SSL | Domain registration and TLS certificates | $200 |
| CSV storage & backup | Secure storage for uploaded CSV files and exports | $600 |
| SMS notification service | For school connectivity fallback communication | $800 |
| Contingency infrastructure | Scaling buffer, unexpected traffic or storage needs | $2,000 |

**Rationale:** Infrastructure is deliberately modest — offline CSV design minimises server load. SMS fallback ensures communication with low-connectivity schools.

### 6. Privacy & Governance Work — $6,000 (8%)

| Item | Detail | Cost |
|---|---|---|
| Data processing agreements | Legal drafting for school-platform data processing agreements | $1,500 |
| Privacy audit | External privacy review (mid-pilot) | $2,000 |
| School data governance training | Briefing sessions for school administrators on data handling | $1,000 |
| Transparency report production | End-of-pilot transparency report | $1,500 |

**Rationale:** Privacy is the foundation of the dataset. Legal agreements protect schools and the platform. External audit provides independent assurance.

### 7. Product & Data Engineering — $11,250 (15%)

| Item | Detail | Cost |
|---|---|---|
| Data entry interface | Web form development and maintenance | $3,000 |
| CSV upload module | Bulk upload validation and error reporting | $2,000 |
| Analytics pipeline | Topic performance derivation, signal generation | $2,500 |
| Quality dashboard | Real-time quality metric visualisation | $2,000 |
| Integration & API | Data export, reporting, dashboard API endpoints | $1,750 |

**Rationale:** The MVP demonstrates the flow; pilot requires a robust, user-friendly data entry interface that teachers can use reliably. Engineering investment focuses on UX and data integrity.

### 8. Reporting & Evaluation — $6,750 (9%)

| Item | Detail | Cost |
|---|---|---|
| Mid-pilot evaluation report | Progress assessment, quality review, course corrections | $1,500 |
| End-of-pilot impact report | Full pilot analysis, outcomes, recommendations | $2,500 |
| Impact metrics computation | Automated and manual metric collection and analysis | $1,250 |
| Teacher satisfaction survey | Design, deployment, analysis of teacher survey | $500 |
| Stakeholder presentation | Synthesis and presentation for funders and MoPSE | $1,000 |

**Rationale:** Transparent, comprehensive reporting builds the evidence base for scaling decisions and demonstrates accountability to funders.

---

## Budget Notes

### Personnel Assumptions
- Programme administrator is funded separately or is a founding-team role
- Teachers enter data as part of their existing duties (no additional salary)
- School champion stipend is a token recognition, not a salary
- Engineering is contracted/part-time (not a full-time hire)

### Cost Containment
- Offline CSV design minimises data entry infrastructure
- Cluster-based training reduces travel costs
- Open-source tooling where possible
- School champion model leverages existing school staff

### Value for Money

| Cost per output | Estimate |
|---|---|
| Cost per school (total ÷ 7.5 avg schools) | ~$10,000 |
| Cost per learner (total ÷ 750 avg learners) | ~$100 |
| Cost per assessment entry (est. 3,000 assessments) | ~$25 |
| Cost per data quality metric (10 metrics) | ~$7,500 |

### Future Funding Needs

If pilot is successful, scaling to national level (50–100 schools) would require approximately $250,000–$500,000 for:
- Regional training teams (vs. centralised)
- Scalable infrastructure (potentially MoPSE-hosted)
- Extended topic registry for all O-Level and primary subjects
- Standards alignment consulting
- District-level stakeholder engagement
- Full-time engineering and QA team

---

*This budget is designed for lean, accountable deployment. Every dollar is allocated to verifiable deliverables with measurable outcomes. Overhead is minimised; investment is concentrated on school-facing activity and data quality.*
