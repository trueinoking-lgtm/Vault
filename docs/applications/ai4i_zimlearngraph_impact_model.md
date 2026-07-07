# Impact Model: ZimLearnGraph

> **AI4I Data Track — Theory of Change, Impact Metrics, and Evidence Framework**

---

## Theory of Change

### IF

- Schools adopt structured assessment data collection
- Teachers map questions to curriculum topics
- Learner codes enable privacy-preserving longitudinal tracking
- Quality metrics are monitored and maintained

### THEN

- Teachers gain topic-level visibility into learner performance
- Weakness signals focus intervention effort where it is needed
- Intervention effectiveness becomes measurable
- Schools have aggregate data for resource planning

### BECAUSE

- The data pipeline converts existing marks into structured, queryable records
- Topic-linked questions reveal granular competency gaps
- Pre/post follow-up comparison measures intervention impact
- Deterministic analytics provide trusted, transparent evidence

### SO THAT

- Teaching becomes evidence-based
- Learning gaps are detected and addressed earlier
- School leaders allocate resources based on data
- Education researchers have a longitudinal dataset
- AI applications can be built on representative local data

---

## Impact Chain: Inputs → Activities → Outputs → Outcomes → Impact

### Inputs

| Input | Description |
|---|---|
| Funding | Pilot deployment resources |
| Pilot schools | 5–10 volunteer schools across urban and peri-urban Zimbabwe |
| Topic registry | Structured curriculum topics for English, Mathematics, Science (O-Level) |
| Data platform | Analytics engine, quality dashboard, data entry interface |
| Teacher training | Onboarding workshops, data entry protocol training, quality awareness |
| Governance framework | Data processing agreements, privacy policies, RBAC configuration |

### Activities

| Activity | Description | Who |
|---|---|---|
| School onboarding | Register class groups, teachers, learners; generate learner codes | Programme admin |
| Teacher training | Train on data entry, question-topic mapping, intervention logging | Programme admin |
| Assessment data entry | Enter metadata, topic mapping, and marks per assessment | Teacher |
| Quality monitoring | Automated checks per submission; weekly human review | System + admin |
| Intervention tracking | Teacher reviews signals, logs remediation actions | Teacher |
| Follow-up assessment | Administer post-intervention assessment on weak topics | Teacher |
| Data export and analysis | Export structured dataset; compute impact metrics | Programme admin |

### Outputs (Direct Deliverables)

| Output | Target |
|---|---|
| Schools onboarded and active | 5–10 schools |
| Learners with structured assessment data | 500–1,000 learners |
| Assessments digitised with topic mapping | All pilot-subject assessments in pilot period |
| Mark entries recorded and validated | All learner-question combinations |
| Learner risk signals generated | All below-threshold learner-topic combinations |
| Interventions logged | ≥ 70% of eligible signals |
| Follow-up assessments completed | ≥ 40% of interventions |
| Quality reports | Weekly throughout pilot; comprehensive at end |
| Dataset export | Full structured dataset with versioning and quality score |

### Outcomes (Behavioural/System Changes)

| Outcome | Evidence |
|---|---|
| Teachers use topic-level data for intervention decisions | Teacher survey + intervention log analysis |
| Schools have aggregate performance dashboards | Dashboard usage analytics |
| Intervention effectiveness is measurable | Pre/post comparison across all follow-ups |
| Data quality practices are adopted by teachers | Quality metric trends (improving over pilot) |
| Data collection protocol is validated for real conditions | Protocol refinement log |
| Quality thresholds are calibrated to real data | Threshold adjustment record |

### Impact (Long-Term Change)

| Impact | Timeframe | Measurement |
|---|---|---|
| Evidence-based teaching practices | Year 1–2 | Teacher practice survey, observation |
| Privacy-preserving data infrastructure in Zimbabwean schools | Year 1–2 | Number of schools using learner code system |
| Reusable dataset template for national education data strategy | Year 2–3 | MoPSE reference in national strategy documents |
| AI applications trained on Zimbabwe-specific education data | Year 3–5 | Number of AI projects using ZimLearnGraph data |
| Reduced learning gaps through targeted intervention | Year 3–5 | Longitudinal topic performance trends |

---

## Impact Metrics

### Primary Indicators

| # | Metric | Target | Formula | Frequency | Owner |
|---|---|---|---|---|---|
| 1 | Data quality score (composite) | ≥ 90% | Weighted average of Q1–Q10 | Weekly | Programme admin |
| 2 | Teacher adoption rate | ≥ 80% | (Active teachers / Enrolled teachers) × 100 | Weekly | Programme admin |
| 3 | Learner code completeness | ≥ 90% | See Quality Framework Q1 | Per assessment | System |
| 4 | Question-topic mapping coverage | ≥ 80% | See Quality Framework Q3 | Per assessment | System |
| 5 | Intervention linkage rate | ≥ 70% | See Quality Framework Q8 | Weekly | System |
| 6 | Follow-up result coverage | ≥ 40% | See Quality Framework Q9 | Monthly | System |
| 7 | Intervention effectiveness rate | ≥ 60% | (Effective follow-ups / Total follow-ups) × 100 | Monthly | Programme admin |
| 8 | Teacher satisfaction | ≥ 3.5 / 5 | End-of-pilot survey | End of pilot | Programme admin |
| 9 | Assessment coverage | ≥ 85% | (Assessments entered / Total teacher-marked assessments) × 100 | Termly | Teacher self-report |

### Secondary Indicators

| # | Metric | Purpose |
|---|---|---|
| 10 | Learners with ≥ 2 assessment cycles of data | Measures longitudinal tracking capability |
| 11 | Topics with data across ≥ 2 schools | Measures cross-school comparability |
| 12 | Quality metric trend direction | Measures improvement over pilot duration |
| 13 | Teacher time per assessment entry (target ≤ 15 min) | Measures teacher burden |
| 14 | Data completeness by school | Identifies and addresses gaps |

### Long-Term Impact Indicators (Year 2+)

| # | Metric | Evidence Source |
|---|---|---|
| 15 | Schools continuing data submission post-pilot | Platform activity logs |
| 16 | Education researchers accessing dataset | Data access requests |
| 17 | AI models trained on ZimLearnGraph data | Published research / model cards |
| 18 | MoPSE policy reference | National education data strategy documents |

---

## Evidence Collection Plan

| Evidence Type | Collection Method | Frequency | Format |
|---|---|---|---|
| Data quality | Automated computation from database | Weekly | Dashboard + report |
| Teacher adoption | Login and submission logs | Weekly | Dashboard |
| Teacher satisfaction | Survey instrument | Mid-pilot + end | Structured survey |
| Intervention effectiveness | Database pre/post computation | Per follow-up | Dashboard |
| Assessment coverage | Teacher self-report + system comparison | Termly | Spreadsheet |
| Protocol fidelity | Observation during school visits | Monthly | Audit checklist |
| Cost per learner | Financial tracking | Monthly | Budget vs actual |

---

## Risks to Impact

| Risk | Impact on Outcomes | Mitigation |
|---|---|---|
| Low teacher adoption | Reduced data volume, weak output 1–3 | Over-recruit schools, teacher training, school champions |
| Poor data quality | Invalidated outcomes 1–6 | Automated validation, quality dashboard, remediation protocol |
| School dropout | Lost longitudinal data, weak outcome 1 | Positive engagement, value-demonstration reports, over-recruit |
| Connectivity issues | Delayed data, reduced timeliness | Offline CSV workflow, mobile-friendly upload |
| Intervention not recorded | Weak output 5, outcome 3 | Dashboard reminders, streamlined recording UI |
| Follow-up assessments skipped | Weak output 6, outcome 3 | Programme admin encouragement, scheduling support |

---

## Impact Visualisation

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     ZimLearnGraph Impact Pathway                │
  ├─────────────────────────────────────────────────────────────────┤
  │                                                                  │
  │  ┌─────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐  │
  │  │ Schools  │───▶│ Teachers  │───▶│Assessments│───▶│Structured│  │
  │  │onboarded │    │ trained   │    │ digitised │    │ dataset  │  │
  │  └─────────┘    └──────────┘    └───────────┘    └──────────┘  │
  │                                                      │          │
  │                                                      ▼          │
  │  ┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐  │
  │  │Learning  │◀───│Interven- │◀───│ Weakness  │◀───│ Topic    │  │
  │  │outcome   │    │tions     │    │ signals   │    │perf.     │  │
  │  │improved  │    │effective │    │ detected  │    │derived   │  │
  │  └──────────┘    └──────────┘    └───────────┘    └──────────┘  │
  │                                                                  │
  └─────────────────────────────────────────────────────────────────┘
```

---

*This impact model is designed for verifiable, measurable outcomes. Every metric has a defined formula, collection method, and owner. Progress is tracked transparently and reported to all stakeholders.*
