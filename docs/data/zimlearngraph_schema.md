# ZimLearnGraph Data Schema

> **Formal schema specification for the ZimLearnGraph education assessment dataset, defining entities, relationships, constraints, and data types.**

**Version:** 0.1.0 — Pilot Scope  
**Standards Alignment:** Ed-Fi-inspired shared education data vocabulary; 1EdTech CASE-inspired topic modelling (inspiration only; no formal certification)

---

## Schema Notation

- **PK:** Primary Key
- **FK:** Foreign Key
- **UQ:** Unique Constraint
- **NN:** Not Null
- **FK → Entity.field:** References the specified field in another entity

---

## Entity-Relationship Diagram (Text)

```
┌────────────────┐       ┌───────────────────┐
│    school      │──1:N──│   class_group     │
│ (school_code)  │       │  (class_id)       │
└───────┬────────┘       └────────┬──────────┘
        │                         │
        │1:N                      │1:N
        │                         │
        ▼                         ▼
┌───────────────┐       ┌───────────────────┐       ┌────────────────────┐
│   teacher     │       │     learner       │──1:N──│   assessment       │
│(teacher_code) │       │ (learner_code)    │       │ (assessment_id)    │
└───────┬───────┘       └───────────────────┘       └─────────┬──────────┘
        │                                                     │
        │1:N                                                  │1:N
        │                                                     │
        ▼                                                     ▼
┌───────────────┐                                   ┌────────────────────┐
│   subject     │──1:N──┐                           │ assessment_question│
│(subject_code) │       │                           │ (question_id)      │
└───────────────┘       │                           └─────────┬──────────┘
                        │                                     │
                        ▼                                     │1:N
               ┌────────────────┐                             │
               │    topic       │◄────────────────────────────┘
               │  (topic_id)    │   (FK: topic_id)
               └────────┬───────┘
                        │
                        │1:N
                        ▼
               ┌────────────────────┐
               │ derived_topic_     │
               │ performance        │
               │ (performance_id)   │
               └────────┬───────────┘
                        │
                        │1:1
                        ▼
               ┌────────────────────┐       ┌────────────────────┐
               │ learner_risk_signal│──1:N──│   intervention     │
               │ (signal_id)        │       │ (intervention_id)  │
               └────────────────────┘       └─────────┬──────────┘
                                                       │
                                                       │1:N
                                                       ▼
                                              ┌────────────────────┐
                                              │follow_up_assessment│
                                              │_result             │
                                              │(follow_up_id)      │
                                              └────────────────────┘

┌────────────────────┐
│ programme_metadata │
│ (dataset_version)  │
└────────────────────┘

mark_entry ── N:1 ── assessment
          ── N:1 ── assessment_question
          ── N:1 ── learner
```

---

## Table: `school`

Stores registered educational institutions.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `school_code` | VARCHAR(16) | NO | — | PK | Unique school identifier: `ZLG-SCH-{NNNN}` |
| `school_name` | VARCHAR(200) | NO | — | — | Official institution name |
| `sector` | VARCHAR(20) | NO | — | CHECK IN (`government`, `private`, `mission`, `community`) | Governance type |
| `province` | VARCHAR(50) | NO | — | — | Zimbabwe province |
| `district` | VARCHAR(100) | NO | — | — | Administrative district |
| `location_type` | VARCHAR(15) | NO | — | CHECK IN (`urban`, `peri-urban`, `rural`) | Setting classification |
| `enrollment_count` | INTEGER | YES | NULL | CHECK ≥ 0 | Total enrolled learners |
| `onboarded_date` | DATE | NO | — | — | When school joined pilot |

**Indexes:** PK on `school_code`; Index on `province`, `district`

---

## Table: `class_group`

A specific class or stream within a school.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `class_id` | VARCHAR(16) | NO | — | PK | Unique class identifier: `ZLG-CLS-{NNNNNN}` |
| `school_code` | VARCHAR(16) | NO | — | FK → `school.school_code` | Parent school |
| `year_level` | SMALLINT | NO | — | CHECK 1-6 (sec) or 1-7 (primary) | Form / grade level |
| `stream` | VARCHAR(20) | YES | NULL | — | Stream label (A, B, etc.) |
| `class_group_name` | VARCHAR(50) | NO | — | — | Display name |
| `academic_year` | SMALLINT | NO | — | CHECK ≥ 2000 | Enrolment year |

**Indexes:** PK on `class_id`; FK on `school_code`; UQ on `(school_code, class_group_name, academic_year)`

---

## Table: `teacher`

Anonymised teacher record.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `teacher_code` | VARCHAR(16) | NO | — | PK | Staff identifier: `ZLG-TCH-{NNNN}` |
| `school_code` | VARCHAR(16) | NO | — | FK → `school.school_code` | Associated school |
| `subjects` | TEXT[] | NO | — | — | Array of subject codes |
| `assigned_classes` | TEXT[] | YES | NULL | — | Array of class IDs |
| `role` | VARCHAR(30) | NO | — | CHECK IN (`class_teacher`, `subject_teacher`, `head_of_department`) | Teacher function |

**Indexes:** PK on `teacher_code`; FK on `school_code`

---

## Table: `learner`

Anonymised learner records.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `learner_code` | VARCHAR(24) | NO | — | PK | Anonymised learner ID: `ZLG-{YYYY}-S{sq}-C{cq}-L{lq}` |
| `school_code` | VARCHAR(16) | NO | — | FK → `school.school_code` | Enrolling school |
| `class_id` | VARCHAR(16) | NO | — | FK → `class_group.class_id` | Current class |
| `enrolment_date` | DATE | NO | — | — | System enrolment date |
| `academic_year` | SMALLINT | NO | — | CHECK ≥ 2000 | Academic year |
| `is_active` | BOOLEAN | NO | TRUE | — | Currently enrolled |

**Indexes:** PK on `learner_code`; FK on `school_code`, `class_id`; Index on `class_id`

---

## Table: `subject`

Curriculum subject definitions.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `subject_code` | VARCHAR(16) | NO | — | PK | Subject ID: `ZLG-SUB-{NNN}` |
| `subject_name` | VARCHAR(100) | NO | — | — | Full subject name |
| `syllabus_level` | VARCHAR(20) | NO | — | CHECK IN (`primary`, `junior_secondary`, `ordinary_level`, `advanced_level`) | Curriculum level |
| `syllabus_reference` | VARCHAR(50) | YES | NULL | — | ZIMSEC syllabus number |

**Indexes:** PK on `subject_code`

---

## Table: `topic`

Curriculum topics aligned to subject syllabuses. *CASE-inspired competency alignment (inspiration only).*

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `topic_id` | VARCHAR(16) | NO | — | PK | Topic ID: `ZLG-TOP-{NNNNN}` |
| `subject_code` | VARCHAR(16) | NO | — | FK → `subject.subject_code` | Parent subject |
| `topic_name` | VARCHAR(200) | NO | — | — | Topic display name |
| `topic_code` | VARCHAR(30) | YES | NULL | — | Curriculum topic code |
| `parent_topic_id` | VARCHAR(16) | YES | NULL | FK → `topic.topic_id` | Hierarchical parent |
| `topic_level` | SMALLINT | YES | NULL | CHECK 1 ≤ level ≤ 5 | Depth in hierarchy |
| `year_level` | SMALLINT | YES | NULL | — | Typical year level |

**Indexes:** PK on `topic_id`; FK on `subject_code`; FK on `parent_topic_id`; Index on `(subject_code, topic_code)`

---

## Table: `assessment`

Assessment instances.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `assessment_id` | VARCHAR(20) | NO | — | PK | Assessment ID: `ZLG-ASM-{NNNNNNNN}` |
| `school_code` | VARCHAR(16) | NO | — | FK → `school.school_code` | Administering school |
| `class_id` | VARCHAR(16) | NO | — | FK → `class_group.class_id` | Target class |
| `teacher_code` | VARCHAR(16) | NO | — | FK → `teacher.teacher_code` | Assessing teacher |
| `subject_code` | VARCHAR(16) | NO | — | FK → `subject.subject_code` | Subject |
| `assessment_type` | VARCHAR(20) | NO | — | CHECK IN (`test`, `exam`, `topic_exercise`, `assignment`, `quiz`, `practical`) | Category |
| `assessment_date` | DATE | NO | — | — | Administration date |
| `total_marks` | NUMERIC(6,1) | NO | — | CHECK > 0 | Overall maximum |
| `duration_minutes` | SMALLINT | YES | NULL | CHECK > 0 | Time allowed |
| `term` | SMALLINT | NO | — | CHECK IN (1, 2, 3) | Academic term |
| `academic_year` | SMALLINT | NO | — | CHECK ≥ 2000 | Academic year |
| `notes` | TEXT | YES | NULL | — | Teacher notes |

**Indexes:** PK on `assessment_id`; FK on `school_code`, `class_id`, `teacher_code`, `subject_code`; Index on `(school_code, class_id, subject_code, assessment_date)`

---

## Table: `assessment_question`

Questions or question groups within an assessment.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `question_id` | VARCHAR(22) | NO | — | PK | Question ID: `ZLG-QST-{NNNNNNNNNN}` |
| `assessment_id` | VARCHAR(20) | NO | — | FK → `assessment.assessment_id` | Parent assessment |
| `question_number` | SMALLINT | NO | — | CHECK > 0 | Sequencing on paper |
| `question_text` | TEXT | YES | NULL | — | Question content |
| `max_score` | NUMERIC(6,1) | NO | — | CHECK > 0 | Maximum mark |
| `topic_id` | VARCHAR(16) | NO | — | FK → `topic.topic_id` | Primary topic |
| `secondary_topic_id` | VARCHAR(16) | YES | NULL | FK → `topic.topic_id` | Secondary topic |
| `question_type` | VARCHAR(20) | YES | NULL | CHECK IN (`multiple_choice`, `short_answer`, `essay`, `practical`, `problem_solving`) | Question format |
| `difficulty` | VARCHAR(10) | YES | NULL | CHECK IN (`easy`, `medium`, `hard`) | Teacher-assessed difficulty |

**Indexes:** PK on `question_id`; FK on `assessment_id`, `topic_id`, `secondary_topic_id`; UQ on `(assessment_id, question_number)`

---

## Table: `mark_entry`

Individual learner-question marks.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `mark_id` | VARCHAR(24) | NO | — | PK | Mark record ID: `ZLG-MRK-{NNNNNNNNNNNN}` |
| `assessment_id` | VARCHAR(20) | NO | — | FK → `assessment.assessment_id` | Parent assessment |
| `question_id` | VARCHAR(22) | NO | — | FK → `assessment_question.question_id` | Question |
| `learner_code` | VARCHAR(24) | NO | — | FK → `learner.learner_code` | Learner |
| `score` | NUMERIC(6,1) | YES | NULL | CHECK 0 ≤ score ≤ max_score | Mark awarded |
| `score_percentage` | NUMERIC(5,2) | YES | NULL | CHECK 0 ≤ 100 | Computed percentage |
| `is_absent` | BOOLEAN | NO | FALSE | — | Learner absent |
| `entry_timestamp` | TIMESTAMP | NO | NOW() | — | When entered |
| `entered_by` | VARCHAR(16) | NO | — | FK → `teacher.teacher_code` | Entering teacher |

**Indexes:** PK on `mark_id`; FK on `assessment_id`, `question_id`, `learner_code`, `entered_by`; UQ on `(assessment_id, question_id, learner_code)`; Index on `(learner_code, topic_id)` for performance derivation

---

## Table: `derived_topic_performance`

Computed learner-topic performance summaries. Generated by analytics pipeline.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `performance_id` | VARCHAR(24) | NO | — | PK | Performance ID: `ZLG-PRF-{NNNNNNNNNNNN}` |
| `learner_code` | VARCHAR(24) | NO | — | FK → `learner.learner_code` | Learner |
| `topic_id` | VARCHAR(16) | NO | — | FK → `topic.topic_id` | Topic |
| `subject_code` | VARCHAR(16) | NO | — | FK → `subject.subject_code` | Subject |
| `assessment_ids` | TEXT[] | NO | — | — | Contributing assessment IDs |
| `total_score_pct` | NUMERIC(5,2) | NO | — | CHECK 0 ≤ 100 | Weighted average |
| `question_count` | INTEGER | NO | — | CHECK ≥ 0 | Questions analysed |
| `weakness_flag` | BOOLEAN | NO | — | — | < 50% threshold |
| `trend_direction` | VARCHAR(20) | YES | NULL | CHECK IN (`improving`, `declining`, `stable`, `insufficient_data`) | Performance trend |
| `calculated_at` | TIMESTAMP | NO | NOW() | — | Computation timestamp |
| `calculation_version` | VARCHAR(20) | NO | — | — | Pipeline version |

**Indexes:** PK on `performance_id`; FK on `learner_code`, `topic_id`, `subject_code`; UQ on `(learner_code, topic_id)`; Index on `(learner_code, subject_code)`

---

## Table: `learner_risk_signal`

Automated weakness notifications generated from topic performance.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `signal_id` | VARCHAR(24) | NO | — | PK | Signal ID: `ZLG-SIG-{NNNNNNNNNNNN}` |
| `learner_code` | VARCHAR(24) | NO | — | FK → `learner.learner_code` | Learner |
| `topic_id` | VARCHAR(16) | NO | — | FK → `topic.topic_id` | Weak topic |
| `subject_code` | VARCHAR(16) | NO | — | FK → `subject.subject_code` | Subject |
| `current_performance_pct` | NUMERIC(5,2) | NO | — | CHECK 0 ≤ 100 | Current topic score |
| `severity` | VARCHAR(20) | NO | — | CHECK IN (`at_risk`, `needs_support`, `monitor`) | Severity level |
| `signal_generated_at` | TIMESTAMP | NO | NOW() | — | Generation timestamp |
| `acknowledged_by_teacher` | BOOLEAN | NO | FALSE | — | Teacher reviewed |
| `acknowledged_at` | TIMESTAMP | YES | NULL | — | Acknowledgement timestamp |

**Indexes:** PK on `signal_id`; FK on `learner_code`, `topic_id`, `subject_code`; Index on `(learner_code, severity)`; Index on `(acknowledged_by_teacher)`

---

## Table: `intervention`

Teacher-recorded remediation actions linked to risk signals.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `intervention_id` | VARCHAR(22) | NO | — | PK | Intervention ID: `ZLG-INT-{NNNNNNNNNN}` |
| `signal_id` | VARCHAR(24) | NO | — | FK → `learner_risk_signal.signal_id` | Source signal |
| `teacher_code` | VARCHAR(16) | NO | — | FK → `teacher.teacher_code` | Conducting teacher |
| `intervention_type` | VARCHAR(25) | NO | — | CHECK IN (`reteaching`, `targeted_exercise`, `peer_tutoring`, `individual_remediation`, `homework_focus`, `resource_provision`) | Remediation category |
| `intervention_date` | DATE | NO | — | — | When conducted |
| `duration_minutes` | SMALLINT | YES | NULL | CHECK > 0 | Time spent |
| `scope` | VARCHAR(15) | NO | — | CHECK IN (`individual`, `small_group`, `whole_class`) | Target scope |
| `notes` | TEXT | YES | NULL | — | Teacher notes |
| `recorded_at` | TIMESTAMP | NO | NOW() | — | Record creation |

**Indexes:** PK on `intervention_id`; FK on `signal_id`, `teacher_code`; Index on `(teacher_code, intervention_date)`

---

## Table: `follow_up_assessment_result`

Post-intervention re-assessment outcomes.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `follow_up_id` | VARCHAR(22) | NO | — | PK | Follow-up ID: `ZLG-FUP-{NNNNNNNNNN}` |
| `assessment_id` | VARCHAR(20) | NO | — | FK → `assessment.assessment_id` | Follow-up assessment |
| `intervention_id` | VARCHAR(22) | NO | — | FK → `intervention.intervention_id` | Evaluated intervention |
| `learner_code` | VARCHAR(24) | NO | — | FK → `learner.learner_code` | Learner |
| `topic_id` | VARCHAR(16) | NO | — | FK → `topic.topic_id` | Re-assessed topic |
| `pre_intervention_score_pct` | NUMERIC(5,2) | NO | — | CHECK 0 ≤ 100 | Baseline score |
| `post_intervention_score_pct` | NUMERIC(5,2) | NO | — | CHECK 0 ≤ 100 | Follow-up score |
| `score_change_pct` | NUMERIC(5,2) | NO | — | — | Computed difference |
| `intervention_effective` | BOOLEAN | NO | — | — | Improvement ≥ 10 pp |

**Indexes:** PK on `follow_up_id`; FK on `assessment_id`, `intervention_id`, `learner_code`, `topic_id`; UQ on `(assessment_id, intervention_id, learner_code, topic_id)`

---

## Table: `programme_metadata`

Dataset-level versioning and provenance.

| Column | Type | Nullable | Default | Constraints | Description |
|---|---|---|---|---|---|
| `dataset_version` | VARCHAR(10) | NO | — | PK | Semantic version |
| `export_date` | TIMESTAMP | NO | NOW() | — | Export timestamp |
| `pilot_phase` | VARCHAR(20) | NO | — | — | Phase identifier |
| `school_count` | INTEGER | NO | — | CHECK ≥ 0 | Participating schools |
| `learner_count` | INTEGER | NO | — | CHECK ≥ 0 | Active learners |
| `assessment_count` | INTEGER | NO | — | CHECK ≥ 0 | Assessments recorded |
| `mark_count` | INTEGER | NO | — | CHECK ≥ 0 | Mark entries |
| `quality_score` | NUMERIC(5,2) | YES | NULL | CHECK 0 ≤ 100 | Composite quality metric |

**Indexes:** PK on `dataset_version`

---

## Referential Integrity Summary

| FK | Source Table | Source Column | Target Table | Target Column | On Delete |
|---|---|---|---|---|---|
| FK1 | `class_group` | `school_code` | `school` | `school_code` | CASCADE |
| FK2 | `teacher` | `school_code` | `school` | `school_code` | CASCADE |
| FK3 | `learner` | `school_code` | `school` | `school_code` | CASCADE |
| FK4 | `learner` | `class_id` | `class_group` | `class_id` | RESTRICT |
| FK5 | `topic` | `subject_code` | `subject` | `subject_code` | CASCADE |
| FK6 | `topic` | `parent_topic_id` | `topic` | `topic_id` | SET NULL |
| FK7 | `assessment` | `school_code` | `school` | `school_code` | RESTRICT |
| FK8 | `assessment` | `class_id` | `class_group` | `class_id` | RESTRICT |
| FK9 | `assessment` | `teacher_code` | `teacher` | `teacher_code` | RESTRICT |
| FK10 | `assessment` | `subject_code` | `subject` | `subject_code` | RESTRICT |
| FK11 | `assessment_question` | `assessment_id` | `assessment` | `assessment_id` | CASCADE |
| FK12 | `assessment_question` | `topic_id` | `topic` | `topic_id` | RESTRICT |
| FK13 | `assessment_question` | `secondary_topic_id` | `topic` | `topic_id` | SET NULL |
| FK14 | `mark_entry` | `assessment_id` | `assessment` | `assessment_id` | CASCADE |
| FK15 | `mark_entry` | `question_id` | `assessment_question` | `question_id` | CASCADE |
| FK16 | `mark_entry` | `learner_code` | `learner` | `learner_code` | RESTRICT |
| FK17 | `mark_entry` | `entered_by` | `teacher` | `teacher_code` | RESTRICT |
| FK18 | `derived_topic_performance` | `learner_code` | `learner` | `learner_code` | CASCADE |
| FK19 | `derived_topic_performance` | `topic_id` | `topic` | `topic_id` | RESTRICT |
| FK20 | `derived_topic_performance` | `subject_code` | `subject` | `subject_code` | RESTRICT |
| FK21 | `learner_risk_signal` | `learner_code` | `learner` | `learner_code` | CASCADE |
| FK22 | `learner_risk_signal` | `topic_id` | `topic` | `topic_id` | RESTRICT |
| FK23 | `learner_risk_signal` | `subject_code` | `subject` | `subject_code` | RESTRICT |
| FK24 | `intervention` | `signal_id` | `learner_risk_signal` | `signal_id` | RESTRICT |
| FK25 | `intervention` | `teacher_code` | `teacher` | `teacher_code` | RESTRICT |
| FK26 | `follow_up_assessment_result` | `assessment_id` | `assessment` | `assessment_id` | RESTRICT |
| FK27 | `follow_up_assessment_result` | `intervention_id` | `intervention` | `intervention_id` | CASCADE |
| FK28 | `follow_up_assessment_result` | `learner_code` | `learner` | `learner_code` | RESTRICT |
| FK29 | `follow_up_assessment_result` | `topic_id` | `topic` | `topic_id` | RESTRICT |

---

## SQL DDL (SQLite-Compliant Reference)

```sql
-- school
CREATE TABLE school (
    school_code      VARCHAR(16)  PRIMARY KEY,
    school_name      VARCHAR(200) NOT NULL,
    sector           VARCHAR(20)  NOT NULL CHECK (sector IN ('government','private','mission','community')),
    province         VARCHAR(50)  NOT NULL,
    district         VARCHAR(100) NOT NULL,
    location_type    VARCHAR(15)  NOT NULL CHECK (location_type IN ('urban','peri-urban','rural')),
    enrollment_count INTEGER      CHECK (enrollment_count >= 0),
    onboarded_date   DATE         NOT NULL
);

-- class_group
CREATE TABLE class_group (
    class_id         VARCHAR(16)  PRIMARY KEY,
    school_code      VARCHAR(16)  NOT NULL REFERENCES school(school_code) ON DELETE CASCADE,
    year_level       SMALLINT     NOT NULL CHECK (year_level BETWEEN 1 AND 7),
    stream           VARCHAR(20),
    class_group_name VARCHAR(50)  NOT NULL,
    academic_year    SMALLINT     NOT NULL CHECK (academic_year >= 2000),
    UNIQUE (school_code, class_group_name, academic_year)
);

-- teacher
CREATE TABLE teacher (
    teacher_code     VARCHAR(16)  PRIMARY KEY,
    school_code      VARCHAR(16)  NOT NULL REFERENCES school(school_code) ON DELETE CASCADE,
    subjects         TEXT         NOT NULL,  -- JSON array
    assigned_classes TEXT,                   -- JSON array
    role             VARCHAR(30)  NOT NULL CHECK (role IN ('class_teacher','subject_teacher','head_of_department'))
);

-- learner
CREATE TABLE learner (
    learner_code     VARCHAR(24)  PRIMARY KEY,
    school_code      VARCHAR(16)  NOT NULL REFERENCES school(school_code) ON DELETE CASCADE,
    class_id         VARCHAR(16)  NOT NULL REFERENCES class_group(class_id),
    enrolment_date   DATE         NOT NULL,
    academic_year    SMALLINT     NOT NULL CHECK (academic_year >= 2000),
    is_active        BOOLEAN      NOT NULL DEFAULT 1
);

-- subject
CREATE TABLE subject (
    subject_code     VARCHAR(16)  PRIMARY KEY,
    subject_name     VARCHAR(100) NOT NULL,
    syllabus_level   VARCHAR(20)  NOT NULL CHECK (syllabus_level IN ('primary','junior_secondary','ordinary_level','advanced_level')),
    syllabus_reference VARCHAR(50)
);

-- topic
CREATE TABLE topic (
    topic_id         VARCHAR(16)  PRIMARY KEY,
    subject_code     VARCHAR(16)  NOT NULL REFERENCES subject(subject_code) ON DELETE CASCADE,
    topic_name       VARCHAR(200) NOT NULL,
    topic_code       VARCHAR(30),
    parent_topic_id  VARCHAR(16)  REFERENCES topic(topic_id),
    topic_level      SMALLINT     CHECK (topic_level BETWEEN 1 AND 5),
    year_level       SMALLINT
);

-- assessment
CREATE TABLE assessment (
    assessment_id    VARCHAR(20)  PRIMARY KEY,
    school_code      VARCHAR(16)  NOT NULL REFERENCES school(school_code),
    class_id         VARCHAR(16)  NOT NULL REFERENCES class_group(class_id),
    teacher_code     VARCHAR(16)  NOT NULL REFERENCES teacher(teacher_code),
    subject_code     VARCHAR(16)  NOT NULL REFERENCES subject(subject_code),
    assessment_type  VARCHAR(20)  NOT NULL CHECK (assessment_type IN ('test','exam','topic_exercise','assignment','quiz','practical')),
    assessment_date  DATE         NOT NULL,
    total_marks      NUMERIC(6,1) NOT NULL CHECK (total_marks > 0),
    duration_minutes SMALLINT     CHECK (duration_minutes > 0),
    term             SMALLINT     NOT NULL CHECK (term IN (1, 2, 3)),
    academic_year    SMALLINT     NOT NULL CHECK (academic_year >= 2000),
    notes            TEXT
);

-- assessment_question
CREATE TABLE assessment_question (
    question_id      VARCHAR(22)  PRIMARY KEY,
    assessment_id    VARCHAR(20)  NOT NULL REFERENCES assessment(assessment_id) ON DELETE CASCADE,
    question_number  SMALLINT     NOT NULL CHECK (question_number > 0),
    question_text    TEXT,
    max_score        NUMERIC(6,1) NOT NULL CHECK (max_score > 0),
    topic_id         VARCHAR(16)  NOT NULL REFERENCES topic(topic_id),
    secondary_topic_id VARCHAR(16) REFERENCES topic(topic_id),
    question_type    VARCHAR(20)  CHECK (question_type IN ('multiple_choice','short_answer','essay','practical','problem_solving')),
    difficulty       VARCHAR(10)  CHECK (difficulty IN ('easy','medium','hard')),
    UNIQUE (assessment_id, question_number)
);

-- mark_entry
CREATE TABLE mark_entry (
    mark_id          VARCHAR(24)  PRIMARY KEY,
    assessment_id    VARCHAR(20)  NOT NULL REFERENCES assessment(assessment_id) ON DELETE CASCADE,
    question_id      VARCHAR(22)  NOT NULL REFERENCES assessment_question(question_id) ON DELETE CASCADE,
    learner_code     VARCHAR(24)  NOT NULL REFERENCES learner(learner_code),
    score            NUMERIC(6,1) CHECK (score >= 0),
    score_percentage NUMERIC(5,2) CHECK (score_percentage BETWEEN 0 AND 100),
    is_absent        BOOLEAN      NOT NULL DEFAULT 0,
    entry_timestamp  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    entered_by       VARCHAR(16)  NOT NULL REFERENCES teacher(teacher_code),
    UNIQUE (assessment_id, question_id, learner_code)
);

-- derived_topic_performance
CREATE TABLE derived_topic_performance (
    performance_id   VARCHAR(24)  PRIMARY KEY,
    learner_code     VARCHAR(24)  NOT NULL REFERENCES learner(learner_code) ON DELETE CASCADE,
    topic_id         VARCHAR(16)  NOT NULL REFERENCES topic(topic_id),
    subject_code     VARCHAR(16)  NOT NULL REFERENCES subject(subject_code),
    assessment_ids   TEXT         NOT NULL,  -- JSON array
    total_score_pct  NUMERIC(5,2) NOT NULL CHECK (total_score_pct BETWEEN 0 AND 100),
    question_count   INTEGER      NOT NULL CHECK (question_count >= 0),
    weakness_flag    BOOLEAN      NOT NULL,
    trend_direction  VARCHAR(20)  CHECK (trend_direction IN ('improving','declining','stable','insufficient_data')),
    calculated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    calculation_version VARCHAR(20) NOT NULL,
    UNIQUE (learner_code, topic_id)
);

-- learner_risk_signal
CREATE TABLE learner_risk_signal (
    signal_id                VARCHAR(24)  PRIMARY KEY,
    learner_code             VARCHAR(24)  NOT NULL REFERENCES learner(learner_code) ON DELETE CASCADE,
    topic_id                 VARCHAR(16)  NOT NULL REFERENCES topic(topic_id),
    subject_code             VARCHAR(16)  NOT NULL REFERENCES subject(subject_code),
    current_performance_pct  NUMERIC(5,2) NOT NULL CHECK (current_performance_pct BETWEEN 0 AND 100),
    severity                 VARCHAR(20)  NOT NULL CHECK (severity IN ('at_risk','needs_support','monitor')),
    signal_generated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_by_teacher  BOOLEAN      NOT NULL DEFAULT 0,
    acknowledged_at          TIMESTAMP
);

-- intervention
CREATE TABLE intervention (
    intervention_id   VARCHAR(22)  PRIMARY KEY,
    signal_id         VARCHAR(24)  NOT NULL REFERENCES learner_risk_signal(signal_id),
    teacher_code      VARCHAR(16)  NOT NULL REFERENCES teacher(teacher_code),
    intervention_type VARCHAR(25)  NOT NULL CHECK (intervention_type IN ('reteaching','targeted_exercise','peer_tutoring','individual_remediation','homework_focus','resource_provision')),
    intervention_date DATE         NOT NULL,
    duration_minutes  SMALLINT    CHECK (duration_minutes > 0),
    scope             VARCHAR(15)  NOT NULL CHECK (scope IN ('individual','small_group','whole_class')),
    notes             TEXT,
    recorded_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- follow_up_assessment_result
CREATE TABLE follow_up_assessment_result (
    follow_up_id                VARCHAR(22)  PRIMARY KEY,
    assessment_id               VARCHAR(20)  NOT NULL REFERENCES assessment(assessment_id),
    intervention_id             VARCHAR(22)  NOT NULL REFERENCES intervention(intervention_id) ON DELETE CASCADE,
    learner_code                VARCHAR(24)  NOT NULL REFERENCES learner(learner_code),
    topic_id                    VARCHAR(16)  NOT NULL REFERENCES topic(topic_id),
    pre_intervention_score_pct  NUMERIC(5,2) NOT NULL CHECK (pre_intervention_score_pct BETWEEN 0 AND 100),
    post_intervention_score_pct NUMERIC(5,2) NOT NULL CHECK (post_intervention_score_pct BETWEEN 0 AND 100),
    score_change_pct            NUMERIC(5,2) NOT NULL,
    intervention_effective      BOOLEAN      NOT NULL,
    UNIQUE (assessment_id, intervention_id, learner_code, topic_id)
);

-- programme_metadata
CREATE TABLE programme_metadata (
    dataset_version   VARCHAR(10)  PRIMARY KEY,
    export_date       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    pilot_phase       VARCHAR(20)  NOT NULL,
    school_count      INTEGER      NOT NULL CHECK (school_count >= 0),
    learner_count     INTEGER      NOT NULL CHECK (learner_count >= 0),
    assessment_count  INTEGER      NOT NULL CHECK (assessment_count >= 0),
    mark_count        INTEGER      NOT NULL CHECK (mark_count >= 0),
    quality_score     NUMERIC(5,2) CHECK (quality_score BETWEEN 0 AND 100)
);
```

---

## Versioning Notes

- All identifiers use the `ZLG-{PREFIX}-{SEQUENCE}` pattern for namespace clarity
- The schema is designed to be implementable across PostgreSQL, SQLite, and SurrealDB with minimal adaptation
- JSON arrays (`TEXT` with JSON encoding) are used for list fields to support databases without native array types; native array types should be preferred where available (PostgreSQL)
- The schema is versioned in lockstep with the dataset version (`0.1.0`). Schema changes increment the dataset version and are tracked in `programme_metadata`.

---

*This schema is designed for future interoperability with education data standards. It draws inspiration from the Ed-Fi data standard for entity naming and relationships, and from 1EdTech CASE for topic/competency modelling. It is not formally certified under any standard.*
