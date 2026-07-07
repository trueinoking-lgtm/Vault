# ZimLearnGraph Data Dictionary

> **Field-level specification for the ZimLearnGraph education assessment dataset.**

**Version:** 0.1.0 — Pilot Scope  
**Standards Alignment:** Ed-Fi-inspired shared education data vocabulary (inspiration only; no formal certification)

---

## Entity: `school`

A registered educational institution participating in the ZimLearnGraph pilot.

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `school_code` | string | ✅ | Unique institutional identifier | Pattern: `ZLG-SCH-\d{4}`; max 16 chars |
| `school_name` | string | ✅ | Official school name | Max 200 chars |
| `sector` | string | ✅ | School governance type | Enum: `government`, `private`, `mission`, `community` |
| `province` | string | ✅ | Zimbabwe province | Enum: 10 provinces |
| `district` | string | ✅ | Administrative district | Max 100 chars |
| `location_type` | string | ✅ | Urban/rural classification | Enum: `urban`, `peri-urban`, `rural` |
| `enrollment_count` | integer | ❌ | Total enrolled learners | Non-negative integer |
| `onboarded_date` | date | ✅ | Date school joined the pilot | ISO 8601 date |

---

## Entity: `class_group`

A specific class/stream within a school, representing a cohort that takes assessments together.

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `class_id` | string | ✅ | Unique class identifier | Pattern: `ZLG-CLS-\d{6}` |
| `school_code` | string | ✅ | Parent school | FK → `school.school_code` |
| `year_level` | integer | ✅ | Form / grade level | 1–7 (primary) or 1–6 (secondary Form 1–6) |
| `stream` | string | ❌ | Stream or division label | e.g., `A`, `B`, `Green`, `Science` |
| `class_group_name` | string | ✅ | Display name | e.g., `Form 2A`, `Grade 7` |
| `academic_year` | integer | ✅ | Year of enrolment | e.g., `2026` |

---

## Entity: `teacher`

A classroom teacher identified by anonymised staff code.

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `teacher_code` | string | ✅ | Anonymised staff identifier | Pattern: `ZLG-TCH-\d{4}` |
| `school_code` | string | ✅ | Associated school | FK → `school.school_code` |
| `subjects` | array[string] | ✅ | Subjects taught | Must match subject codes in `subject` entity |
| `assigned_classes` | array[string] | ❌ | Class groups taught | FK → `class_group.class_id` |
| `role` | string | ✅ | Teacher role | Enum: `class_teacher`, `subject_teacher`, `head_of_department` |

> **Note:** Teacher full names are stored only in the school's local records, never in the analytical dataset.

---

## Entity: `learner`

An individual learner identified only by anonymised learner code.

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `learner_code` | string | ✅ | Anonymised learner identifier | Pattern: `ZLG-\d{4}-S\d{2}-C\d{3}-L\d{3}` |
| `school_code` | string | ✅ | School of enrolment | FK → `school.school_code` |
| `class_id` | string | ✅ | Current class group | FK → `class_group.class_id` |
| `enrolment_date` | date | ✅ | Date of enrolment in the system | ISO 8601 date |
| `academic_year` | integer | ✅ | Year of enrolment | e.g., `2026` |
| `is_active` | boolean | ✅ | Currently enrolled | Default: true |

> **No PII collected:** learner names, date of birth, national ID, guardian details, address, or any other personally identifying information is never stored. The school holds the learner code-to-name mapping locally.

---

## Entity: `subject`

A curriculum subject as defined by the ZIMSEC syllabus.

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `subject_code` | string | ✅ | Subject identifier | Pattern: `ZLG-SUB-\d{3}` |
| `subject_name` | string | ✅ | Full subject name | e.g., `Mathematics`, `English Language` |
| `syllabus_level` | string | ✅ | Curriculum level | Enum: `primary`, `junior_secondary`, `ordinary_level`, `advanced_level` |
| `syllabus_reference` | string | ❌ | Official syllabus document ref | ZIMSEC syllabus number, e.g., `4004/1` |

---

## Entity: `topic`

A curriculum topic within a subject, aligned to the ZIMSEC syllabus structure. *1EdTech CASE-inspired curriculum/competency alignment (inspiration only).*

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `topic_id` | string | ✅ | Unique topic identifier | Pattern: `ZLG-TOP-\d{5}` |
| `subject_code` | string | ✅ | Parent subject | FK → `subject.subject_code` |
| `topic_name` | string | ✅ | Topic name | e.g., `Algebraic Expressions`, `Photosynthesis` |
| `topic_code` | string | ❌ | Curriculum topic code | ZIMSEC or school-defined code |
| `parent_topic_id` | string | ❌ | Parent topic for hierarchical structure | FK → `topic.topic_id` (self-referencing) |
| `topic_level` | integer | ❌ | Depth in topic hierarchy | 1 = broad domain, 2 = unit, 3 = sub-topic |
| `year_level` | integer | ❌ | Typical year level for this topic | e.g., `2` for Form 2 |

---

## Entity: `assessment`

A specific assessment instance (test, exam, topic exercise, assignment).

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `assessment_id` | string | ✅ | Unique assessment identifier | Pattern: `ZLG-ASM-\d{8}` |
| `school_code` | string | ✅ | School administering the assessment | FK → `school.school_code` |
| `class_id` | string | ✅ | Target class group | FK → `class_group.class_id` |
| `teacher_code` | string | ✅ | Teacher who set and marked | FK → `teacher.teacher_code` |
| `subject_code` | string | ✅ | Assessment subject | FK → `subject.subject_code` |
| `assessment_type` | string | ✅ | Category | Enum: `test`, `exam`, `topic_exercise`, `assignment`, `quiz`, `practical` |
| `assessment_date` | date | ✅ | Date administered | ISO 8601 date |
| `total_marks` | number | ✅ | Overall maximum possible mark | Positive number |
| `duration_minutes` | integer | ❌ | Time allowed | Positive integer |
| `term` | integer | ✅ | Academic term | 1, 2, or 3 |
| `academic_year` | integer | ✅ | Year | e.g., `2026` |
| `notes` | text | ❌ | Teacher's notes on the assessment | Free text |

---

## Entity: `assessment_question`

An individual question or question group within an assessment.

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `question_id` | string | ✅ | Unique question identifier | Pattern: `ZLG-QST-\d{10}` |
| `assessment_id` | string | ✅ | Parent assessment | FK → `assessment.assessment_id` |
| `question_number` | integer | ✅ | Question number on the paper | Positive integer |
| `question_text` | text | ❌ | Question content (optional) | Free text |
| `max_score` | number | ✅ | Maximum mark for this question | Positive number |
| `topic_id` | string | ✅ | Primary curriculum topic assessed | FK → `topic.topic_id` |
| `secondary_topic_id` | string | ❌ | Secondary topic if cross-topic | FK → `topic.topic_id` |
| `question_type` | string | ❌ | Format | Enum: `multiple_choice`, `short_answer`, `essay`, `practical`, `problem_solving` |
| `difficulty` | string | ❌ | Teacher-assessed difficulty | Enum: `easy`, `medium`, `hard` |

---

## Entity: `mark_entry`

An individual learner's mark on a specific question within a specific assessment.

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `mark_id` | string | ✅ | Unique mark record identifier | Pattern: `ZLG-MRK-\d{12}` |
| `assessment_id` | string | ✅ | Parent assessment | FK → `assessment.assessment_id` |
| `question_id` | string | ✅ | Question being marked | FK → `assessment_question.question_id` |
| `learner_code` | string | ✅ | Anonymised learner | FK → `learner.learner_code` |
| `score` | number | ❌ | Mark awarded (null allowed for absent learners; see Quality Framework Q5) | Must be 0 ≤ score ≤ question.max_score if present |
| `score_percentage` | number | ✅ | Calculated percentage | Computed: `(score / max_score) * 100` |
| `is_absent` | boolean | ✅ | Learner absent for assessment | Default: false |
| `entry_timestamp` | datetime | ✅ | When the mark was entered | ISO 8601 datetime |
| `entered_by` | string | ✅ | Teacher code who entered mark | FK → `teacher.teacher_code` |

---

## Entity: `derived_topic_performance`

Calculated performance summary for each learner on each topic. Generated by the analytics pipeline — not manually entered.

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `performance_id` | string | ✅ | Unique record identifier | Pattern: `ZLG-PRF-\d{12}` |
| `learner_code` | string | ✅ | Anonymised learner | FK → `learner.learner_code` |
| `topic_id` | string | ✅ | Curriculum topic | FK → `topic.topic_id` |
| `subject_code` | string | ✅ | Subject | FK → `subject.subject_code` |
| `assessment_ids` | array[string] | ✅ | Assessments contributing to this calculation | Array of FK → `assessment.assessment_id` |
| `total_score_pct` | number | ✅ | Weighted average across all assessments on this topic | 0–100 |
| `question_count` | integer | ✅ | Number of questions attempted on this topic | Non-negative |
| `weakness_flag` | boolean | ✅ | Below proficiency threshold | True if `total_score_pct < 50` |
| `trend_direction` | string | ❌ | Performance trend over time | Enum: `improving`, `declining`, `stable`, `insufficient_data` |
| `calculated_at` | datetime | ✅ | When the performance was derived | ISO 8601 datetime |
| `calculation_version` | string | ✅ | Analytics pipeline version | e.g., `zlg-analytics-v0.1.0` |

---

## Entity: `learner_risk_signal`

Automated flag indicating that a learner is below the mastery threshold on a topic, generated from `derived_topic_performance`.

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `signal_id` | string | ✅ | Unique signal identifier | Pattern: `ZLG-SIG-\d{12}` |
| `learner_code` | string | ✅ | Anonymised learner | FK → `learner.learner_code` |
| `topic_id` | string | ✅ | Weak topic | FK → `topic.topic_id` |
| `subject_code` | string | ✅ | Subject | FK → `subject.subject_code` |
| `current_performance_pct` | number | ✅ | Current score on this topic | 0–100 |
| `severity` | string | ✅ | Signal severity level | Enum: `at_risk` (< 40%), `needs_support` (40–50%), `monitor` (50–65%) |
| `signal_generated_at` | datetime | ✅ | When the signal was generated | ISO 8601 datetime |
| `acknowledged_by_teacher` | boolean | ✅ | Teacher has seen this signal | Default: false |
| `acknowledged_at` | datetime | ❌ | When teacher acknowledged | Set when `acknowledged_by_teacher = true` |

---

## Entity: `intervention`

A teacher-recorded remediation action taken in response to a specific learner risk signal. For group interventions (scope: small_group, whole_class), separate intervention records are created per learner risk signal.

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `intervention_id` | string | ✅ | Unique intervention identifier | Pattern: `ZLG-INT-\d{10}` |
| `signal_id` | string | ✅ | Source risk signal | FK → `learner_risk_signal.signal_id` |
| `teacher_code` | string | ✅ | Teacher who conducted the intervention | FK → `teacher.teacher_code` |
| `intervention_type` | string | ✅ | Remediation category | Enum: `reteaching`, `targeted_exercise`, `peer_tutoring`, `individual_remediation`, `homework_focus`, `resource_provision` |
| `intervention_date` | date | ✅ | When the intervention occurred | ISO 8601 date |
| `duration_minutes` | integer | ❌ | Time spent on intervention | Positive integer |
| `scope` | string | ✅ | Target of intervention | Enum: `individual`, `small_group`, `whole_class` |
| `notes` | text | ❌ | Teacher notes on the intervention | Free text |
| `recorded_at` | datetime | ✅ | When the record was created | ISO 8601 datetime |

---

## Entity: `follow_up_assessment_result`

The outcome of a re-assessment on topics previously identified as weak, linked back to the original intervention.

| Field | Type | Required | Description | Constraints |
|---|---|---|---|---|
| `follow_up_id` | string | ✅ | Unique follow-up identifier | Pattern: `ZLG-FUP-\d{10}` |
| `assessment_id` | string | ✅ | The follow-up assessment | FK → `assessment.assessment_id` |
| `intervention_id` | string | ✅ | The intervention being evaluated | FK → `intervention.intervention_id` |
| `learner_code` | string | ✅ | Anonymised learner | FK → `learner.learner_code` |
| `topic_id` | string | ✅ | Topic re-assessed | FK → `topic.topic_id` |
| `pre_intervention_score_pct` | number | ✅ | Topic score before intervention | 0–100 |
| `post_intervention_score_pct` | number | ✅ | Topic score after intervention | 0–100 |
| `score_change_pct` | number | ✅ | Difference (post - pre) | Computed; may be negative |
| `intervention_effective` | boolean | ✅ | Improvement ≥ meaningful threshold | True if `score_change_pct ≥ 10` |

---

## Entity: `programme_metadata`

Dataset-level metadata for versioning and provenance tracking.

| Field | Type | Required | Description |
|---|---|---|---|
| `dataset_version` | string | ✅ | Semantic version of the dataset |
| `export_date` | datetime | ✅ | When the dataset was exported |
| `pilot_phase` | string | ✅ | Phase identifier |
| `school_count` | integer | ✅ | Number of participating schools |
| `learner_count` | integer | ✅ | Number of active learners |
| `assessment_count` | integer | ✅ | Number of assessments recorded |
| `mark_count` | integer | ✅ | Number of individual mark entries |
| `quality_score` | number | ❌ | Aggregate quality metric (see Quality Framework) |

---

## Relationships Summary

```
school ──┬── class_group ──┬── learner
          │                │
          ├── teacher      ├── assessment ──┬── assessment_question ──┬── mark_entry
          │                │                │                          │
          │                │                └── follow_up_assessment   │
          │                │                                           └── learner
          ├── subject ──── topic ──── derived_topic_performance ──── learner_risk_signal ──── intervention
          │                                                                                     │
          └── programme_metadata                                                       follow_up_assessment_result
```

---

*This data dictionary follows an Ed-Fi-inspired shared education data vocabulary approach. It is not formally Ed-Fi-certified but is designed for future alignment with education data interoperability standards.*
