# ZimLearnGraph Data Collection Protocol

> **Standard operating procedure for collecting, structuring, and processing education assessment data.**

**Version:** 0.1.0 — Pilot Scope  
**Last Updated:** 2026-07-07

---

## Overview

This protocol defines the end-to-end process for converting teacher-marked assessments into structured, AI-ready data. Every step is designed for minimal teacher burden, maximum data integrity, and privacy-preserving anonymisation from the point of collection.

The protocol follows the core data chain:

```
School → Class → Learner Code → Subject → Topic → Assessment → Question → Mark
→ Weakness Signal → Intervention → Follow-up Result
```

---

## Step 1: School Onboarding

**Who:** Programme administrator + school administration  
**When:** Before any data collection begins  
**Output:** School configuration record, class group registry, teacher registry

### 1.1 Register School Profile

- Collect school name, sector (government/private/mission/community), province, district, location type (urban/peri-urban/rural)
- Assign a unique `school_code` (pattern: `ZLG-SCH-{NNNN}`)
- Record the onboarding date

### 1.2 Register Class Groups

- For each participating class group, record: year level (Form/Grade), stream label, and academic year
- Assign a unique `class_id` (pattern: `ZLG-CLS-{NNNNNN}`)
- Link each class group to the parent school

### 1.3 Register Teachers

- For each participating teacher, record: assigned subjects and class groups
- Assign an anonymised `teacher_code` (pattern: `ZLG-TCH-{NNNN}`)
- The school retains the teacher-code-to-name mapping locally; it never enters the analytical dataset

### 1.4 Register Learners and Assign Learner Codes

- School administration provides a class register with learner names
- The system generates anonymised learner codes (pattern: `ZLG-{YYYY}-S{school_seq}-C{class_seq}-L{learner_seq}`)
- The school receives a local-only mapping document: learner name → learner code
- **No learner names, date of birth, national ID, or any other PII enters the ZimLearnGraph dataset**
- Learner codes are deterministic per school-class sequence for cross-term continuity

**Key constraint:** The learner code is the only learner identifier in the dataset. The school is the sole controller of the code-to-name mapping.

---

## Step 2: Assessment Metadata Entry

**Who:** Teacher or school administrator  
**When:** Before or at the time of mark entry  
**Output:** Assessment record with metadata

### 2.1 Create Assessment Record

- Enter assessment metadata:
  - Subject (selected from registered subjects)
  - Class group
  - Assessment type (test, exam, topic exercise, assignment, quiz, practical)
  - Assessment date
  - Total marks
  - Duration (optional)
  - Term and academic year

### 2.2 Define Questions and Topic Mapping

- For each question or question group on the assessment:
  - Enter question number
  - Enter maximum score for the question
  - Map the question to the relevant curriculum **topic** from the topic registry
  - Optionally note question type and difficulty

**Topic mapping is critical** — this is what enables weakness-signal analytics. Each question must map to at least one topic. A question spanning multiple topics may optionally map to a secondary topic.

---

## Step 3: Mark Entry

**Who:** Teacher  
**When:** After marking is complete  
**Output:** Structured mark records per learner per question

### 3.1 Prepare Mark Data

The teacher may enter marks via:
- **Web form interface** — one learner per row, one question per column
- **CSV bulk upload** — structured spreadsheet matching the question grid
- **Paper-to-digital** — marks transcribed from paper mark sheets by the teacher or admin assistant

### 3.2 Enter Marks

- For each learner (identified by **learner code**, not name):
  - Enter the score for each question
  - Mark learners absent where applicable
- The system validates:
  - Learner code exists and is active in the class group
  - Score does not exceed the question's max_score
  - No duplicate entries for the same learner-question combination
  - Expected learner count matches the class register (completeness check)

### 3.3 Bulk Upload Workflow (Recommended for Scale)

- Teacher downloads a pre-formatted CSV template with learner codes pre-populated for the class
- Teacher fills in marks offline
- Upload the completed CSV
- System validates row-by-row and reports any errors with precise location and suggested fix

---

## Step 4: Topic Performance Derivation

**Who:** System (automated analytics pipeline)  
**When:** After mark entry is complete for an assessment  
**Output:** Derived topic performance records per learner per topic

### 4.1 Aggregate by Learner-Topic

- For each learner, collect all marks across questions mapped to the same topic (potentially across multiple assessments within the same academic period)
- Calculate weighted average percentage: `sum(scores) / sum(max_scores) * 100`

### 4.2 Generate Performance Records

- Create a `derived_topic_performance` record per learner per topic
- Include contributing assessment IDs for full traceability
- Flag topics where the learner is below the proficiency threshold (< 50%)

---

## Step 5: Weakness Signal Generation

**Who:** System (automated analytics pipeline)  
**When:** After topic performance derivation  
**Output:** Learner risk signal records

### 5.1 Evaluate Against Thresholds

- **At Risk:** Score < 40% on a topic
- **Needs Support:** Score 40–50% on a topic
- **Monitor:** Score 50–65% on a topic (teacher judgement call)

### 5.2 Generate Signals

- For each learner-topic combination below the proficiency threshold (< 50%), generate a `learner_risk_signal`
- Severity is assigned based on the score bands above
- Signals are surfaced to the teacher via dashboard and actionable summary

---

## Step 6: Intervention Recording

**Who:** Teacher  
**When:** After reviewing weakness signals and taking action  
**Output:** Intervention records linked to risk signals

### 6.1 Teacher Reviews Signals

- Teacher accesses the dashboard or summary showing learner risk signals
- Teacher acknowledges receipt of each signal

### 6.2 Teacher Records the Intervention

- After conducting remediation, the teacher logs:
  - Which risk signal triggered the intervention
  - Intervention type (reteaching, targeted exercise, peer tutoring, individual remediation, homework focus, resource provision)
  - Date of intervention
  - Duration (optional)
  - Scope (individual, small group, whole class)
  - Optional notes

### 6.3 Linking

- Each intervention is linked to the originating `learner_risk_signal` via `signal_id`
- A single intervention may address multiple learners if scope is `small_group` or `whole_class` (by linking multiple signals)

---

## Step 7: Follow-Up Assessment

**Who:** Teacher (assess) + system (link)  
**When:** After intervention has been completed  
**Output:** Follow-up assessment result records

### 7.1 Design the Follow-Up

- Teacher creates a new assessment (or uses a dedicated follow-up assessment) targeting the same topics that were identified as weak
- Follow-up questions are mapped to the same topic IDs for direct comparison

### 7.2 Enter Follow-Up Marks

- Follow the standard mark entry workflow (Step 3)
- The system recognises the follow-up assessment when the same topic IDs and learner codes appear after a recorded intervention

### 7.3 Compare Pre/Post Performance

- The system pre-fills the `pre_intervention_score_pct` from the last `derived_topic_performance` before the intervention date
- Calculates `post_intervention_score_pct` from the follow-up marks
- Computes `score_change_pct` and flags whether the intervention was effective (improvement ≥ 10 percentage points)

---

## Step 8: Data Quality Monitoring

**Who:** System (automated) + Programme administrator (periodic)  
**When:** Continuous + weekly quality check  
**Output:** Quality metrics dashboard (see Quality Framework)

### 8.1 Automated Checks

Every data submission triggers:
- Learner code completeness
- Assessment metadata presence
- Question-topic mapping coverage
- Mark range validation
- Duplicate detection
- Missing score rate calculation

### 8.2 Threshold Alerts

- Any metric below the quality threshold (see Quality Framework) generates an alert
- Alerts are routed to the programme administrator and relevant teacher for remediation

---

## Offline-Friendly Workflow

For schools with limited or intermittent internet connectivity:

1. **Batch CSV download** — teacher downloads pre-populated learner code template at school or via mobile
2. **Offline mark entry** — teacher fills marks in spreadsheet during/after class
3. **Batch upload** — teacher uploads completed CSV when connectivity is available
4. **Deferred validation** — uploaded data is validated server-side; error report returned on next connection

This design ensures the protocol works in low-connectivity environments without requiring real-time data entry.

---

## Roles and Responsibilities

| Role | Responsibilities |
|---|---|
| **School Administrator** | Register class groups, teachers, and learners; maintain local code-to-name mapping |
| **Teacher** | Enter assessment metadata, map questions to topics, enter marks, review weakness signals, record interventions, administer follow-ups |
| **Programme Administrator** | Onboard schools, monitor data quality, provide training and support, manage programme-level configuration |
| **System (automated)** | Validate entry, derive topic performance, generate risk signals, compute quality metrics, generate summaries |

---

## Data Flow Diagram (Summary)

```
School Onboarding
      ↓
Learner Code Generation ──────────────────────────┐
      ↓                                             │
Assessment Metadata + Question-Topic Mapping        │
      ↓                                             │
Mark Entry ←─── Learner Code Lookup (school-side)  │
      ↓                                             │
Data Validation ───→ Error? → Correct & Resubmit   │
      ↓                                             │
Topic Performance Derivation                        │
      ↓                                             │
Weakness Signal Generation                          │
      ↓                                             │
Teacher Reviews → Acknowledges                      │
      ↓                                             │
Teacher Records Intervention                         │
      ↓                                             │
Follow-Up Assessment ───────────────────────────────┘
      ↓
Pre/Post Comparison
      ↓
Quality Metrics & Aggregate Analytics
```

---

*This protocol is designed for deterministic, teacher-driven data collection. No AI is involved in collection, validation, or derivation — AI operates only at the advisory summary (dashboard interpretation) layer, which is explicitly labelled as non-authoritative.*
