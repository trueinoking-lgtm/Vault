# ZimLearnGraph Data Quality Framework

> **Metrics, thresholds, monitoring procedures, and remediation protocols for the ZimLearnGraph education assessment dataset.**

**Version:** 0.1.0 — Pilot Scope  
**Last Updated:** 2026-07-07

---

## Purpose

This framework defines how ZimLearnGraph measures, monitors, and maintains data quality across the entire collection pipeline. Quality is not an afterthought — it is engineered into the collection protocol through automated validation, periodic auditing, and clear escalation paths.

All metrics are computed deterministically from the data at rest. No AI or subjective scoring is used in quality assessment.

---

## Quality Principles

1. **Deterministic measurement** — every metric is computed from a defined formula; no subjective quality scoring
2. **Threshold-driven alerts** — each metric has an acceptable threshold; violations generate automated alerts
3. **Progressive improvement** — quality targets tighten as the pilot matures
4. **Transparent reporting** — all quality metrics are visible to data contributors (schools, teachers) and programme administrators
5. **No data-hidden quality** — records below threshold are flagged but never silently dropped; transparency over censorship

---

## Metric Definitions

### Q1: Learner Code Completeness

**Definition:** The percentage of enrolled learners in a class group who have at least one mark entry in the dataset for the current assessment period.

**Formula:**
```
Learner Code Completeness = (Learners with ≥ 1 mark entry / Total enrolled learners) × 100
```

**Thresholds:**

| Level | Range | Action |
|---|---|---|
| ✅ Good | ≥ 95% | No action required |
| ⚠️ Warning | 80–94% | Programme administrator notified; teacher asked to review missing entries |
| 🔴 Critical | < 80% | Data submission paused for that class; teacher contacted for remediation |

**Pilot target:** ≥ 90%

---

### Q2: Assessment Metadata Completeness

**Definition:** The percentage of assessment records that have all required metadata fields populated.

**Required metadata fields:** `assessment_date`, `subject_code`, `assessment_type`, `total_marks`, `term`, `academic_year`, `teacher_code`, `class_id`

**Formula:**
```
Assessment Metadata Completeness = (Assessments with all required fields / Total assessments) × 100
```

**Thresholds:**

| Level | Range | Action |
|---|---|---|
| ✅ Good | 100% | No action required |
| 🔴 Critical | < 100% | Assessment record flagged; teacher prompted to complete fields |

**Pilot target:** 100% (this is a gating metric — incomplete records are rejected at entry)

---

### Q3: Question-Topic Mapping Coverage

**Definition:** The percentage of assessment questions that are mapped to at least one curriculum topic.

**Formula:**
```
Question-Topic Mapping Coverage = (Questions with ≥ 1 topic mapping / Total questions) × 100
```

**Thresholds:**

| Level | Range | Action |
|---|---|---|
| ✅ Good | ≥ 95% | No action required |
| ⚠️ Warning | 80–94% | Teacher notified; topic mappings required for analytics accuracy |
| 🔴 Critical | < 80% | Topic performance derivation disabled for affected assessments |

**Pilot target:** ≥ 80% (relaxed for initial adoption, targeting 95% by end of pilot)

---

### Q4: Mark Completion Rate

**Definition:** The percentage of expected mark entries (learner × question combinations) that are actually recorded for an assessment.

**Formula:**
```
Mark Completion Rate = (Actual mark entries / (Learners in class × Questions on assessment)) × 100
```
*Absent learners (marked `is_absent = true`) count as completed entries.*

**Thresholds:**

| Level | Range | Action |
|---|---|---|
| ✅ Good | ≥ 95% | No action required |
| ⚠️ Warning | 85–94% | Teacher asked to review and complete missing entries |
| 🔴 Critical | < 85% | Assessment flagged; aggregate analytics exclude this assessment until resolved |

**Pilot target:** ≥ 90%

---

### Q5: Missing Score Rate

**Definition:** The percentage of mark entries where the score field is null or blank (excluding absent learners).

**Formula:**
```
Missing Score Rate = (Mark entries with null score / Total non-absent mark entries) × 100
```

**Thresholds:**

| Level | Range | Action |
|---|---|---|
| ✅ Good | < 2% | No action required |
| ⚠️ Warning | 2–5% | Teacher notified of specific null entries |
| 🔴 Critical | > 5% | Assessment excluded from topic performance derivation |

**Pilot target:** < 3%

---

### Q6: Invalid Score Rate

**Definition:** The percentage of mark entries where the recorded score exceeds the question's `max_score`, is negative, or is otherwise invalid.

**Formula:**
```
Invalid Score Rate = (Invalid mark entries / Total mark entries) × 100
```

**Thresholds:**

| Level | Range | Action |
|---|---|---|
| ✅ Good | 0% | No action required |
| 🔴 Critical | > 0% | Invalid entries blocked at entry point; zero-tolerance policy |

**Pilot target:** 0% (enforced by system validation at point of entry)

---

### Q7: Duplicate Learner Code Rate

**Definition:** The percentage of assessments where duplicate learner code entries exist for the same question within a single assessment.

**Formula:**
```
Duplicate Learner Code Rate = (Assessments with ≥ 1 duplicate / Total assessments) × 100
```

**Thresholds:**

| Level | Range | Action |
|---|---|---|
| ✅ Good | 0% | No action required |
| ⚠️ Warning | 0–5% | Duplicates flagged; teacher asked to resolve |
| 🔴 Critical | > 5% | Repeated issues trigger teacher retraining |

**Pilot target:** 0% (enforced at entry — duplicates are auto-rejected with clear error messaging)

---

### Q8: Intervention Linkage Rate

**Definition:** The percentage of `learner_risk_signal` records (severity `at_risk` or `needs_support`) that have at least one linked `intervention` record.

**Formula:**
```
Intervention Linkage Rate = (Signals with ≥ 1 intervention / Total eligible signals) × 100
```

**Thresholds:**

| Level | Range | Action |
|---|---|---|
| ✅ Good | ≥ 80% | No action required |
| ⚠️ Warning | 50–79% | Teacher reminded to record interventions for flagged weaknesses |
| 🔴 Critical | < 50% | Programme administrator reviews data collection engagement |

**Pilot target:** ≥ 70% (recognising that some weaknesses may be addressed informally without explicit recording)

---

### Q9: Follow-Up Result Coverage

**Definition:** The percentage of interventions that have a linked `follow_up_assessment_result` record.

**Formula:**
```
Follow-Up Result Coverage = (Interventions with ≥ 1 follow-up result / Total interventions) × 100
```

**Thresholds:**

| Level | Range | Action |
|---|---|---|
| ✅ Good | ≥ 60% | No action required |
| ⚠️ Warning | 30–59% | Programme administrator encourages follow-up assessment scheduling |
| 🔴 Critical | < 30% | Data-driven effectiveness analysis limited for low-coverage periods |

**Pilot target:** ≥ 40% (pilot phase — building the habit of follow-up assessment)

---

### Q10: Dataset Versioning

**Definition:** Every dataset snapshot (export, analysis run, dashboard data load) carries a semantic version identifier. This metric tracks whether versioning is consistently applied.

**Metric:** Version presence on all dataset artefacts

**Thresholds:**

| Level | Range | Action |
|---|---|---|
| ✅ Good | 100% | No action required |
| 🔴 Critical | < 100% | Versioning is gating — all exports must include version metadata |

**Pilot target:** 100% (enforced by system — all automated exports include version field)

---

## Quality Dashboard

A real-time quality dashboard exposes the following for each school, class, and assessment:

| Metric | Current Value | Threshold | Status | Trend |
|---|---|---|---|---|
| Q1: Learner Code Completeness | 94.2% | ≥ 90% | ✅ Good | 📈 Improving |
| Q2: Metadata Completeness | 100% | 100% | ✅ Good | ✅ Stable |
| Q3: Question-Topic Mapping | 85.7% | ≥ 80% | ⚠️ Warning | 📈 Improving |
| Q4: Mark Completion Rate | 96.1% | ≥ 90% | ✅ Good | ✅ Stable |
| Q5: Missing Score Rate | 1.2% | < 3% | ✅ Good | ✅ Stable |
| Q6: Invalid Score Rate | 0% | 0% | ✅ Good | ✅ Stable |
| Q7: Duplicate Rate | 0% | 0% | ✅ Good | ✅ Stable |
| Q8: Intervention Linkage | 72.3% | ≥ 70% | ✅ Good | 📈 Improving |
| Q9: Follow-Up Coverage | 45.8% | ≥ 40% | ✅ Good | 📈 Improving |
| Q10: Dataset Versioning | 100% | 100% | ✅ Good | ✅ Stable |

**Overall Quality Score:** Weighted composite of all metrics (weights proportional to criticality).

---

## Monitoring Schedule

| Cadence | Action | Responsible |
|---|---|---|
| Per submission | Automated validation of Q2, Q4, Q5, Q6, Q7 | System |
| Daily | Quality score computation for all active classes | System |
| Weekly | Quality trend report for programme administrator | System → Admin |
| Monthly | Quality review meeting with school coordinators | Programme Administrator |
| Per term | Full quality audit and framework review | Programme Lead |

---

## Remediation Protocols

### Green (Good)
- Continuous monitoring only
- No intervention required

### Yellow (Warning)
- Automated notification to the teacher or school administrator
- Specific, actionable guidance on what needs to be corrected
- 7-day resolution window before escalation
- Remediation support offered (training materials, one-on-one assistance)

### Red (Critical)
- Immediate notification to programme administrator
- Data from the affected source is quarantined from aggregate analytics
- Teacher and school administrator contacted within 1 business day
- Root cause investigation launched
- Corrective action plan required before data flow resumes

---

## Quality Improvement Cycle

```
Periodic Quality Assessment
        ↓
Identify Low-Performing Metrics
        ↓
Root Cause Analysis
        ↓
Targeted Training / Process Improvement
        ↓
Implement Fix
        ↓
Monitor Next Period
        ↓
Thresholds Tightened (if consistently met)
```

Thresholds are reviewed at the end of each academic term. Consistently green metrics may have their thresholds tightened to drive continuous improvement.

---

## Pilot Quality Targets Summary

| Metric | Pilot Target | End-of-Pilot Stretch Target |
|---|---|---|
| Learner Code Completeness | ≥ 90% | ≥ 95% |
| Assessment Metadata Completeness | 100% | 100% |
| Question-Topic Mapping Coverage | ≥ 80% | ≥ 95% |
| Mark Completion Rate | ≥ 90% | ≥ 95% |
| Missing Score Rate | < 3% | < 2% |
| Invalid Score Rate | 0% | 0% |
| Duplicate Learner Code Rate | 0% | 0% |
| Intervention Linkage Rate | ≥ 70% | ≥ 85% |
| Follow-Up Result Coverage | ≥ 40% | ≥ 65% |
| Dataset Versioning | 100% | 100% |

---

*This quality framework is designed for deterministic, automated monitoring. Every metric is computed from structured data with no subjective or AI-based quality assessment. Quality transparency is a core principle of the ZimLearnGraph Data Track.*
