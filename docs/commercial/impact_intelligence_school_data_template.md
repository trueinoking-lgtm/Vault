# Impact Intelligence — School Data Template

Use this template to prepare the data needed for the Impact Intelligence pilot.

---

## 1. School Information

| Field | Value |
|-------|-------|
| School name | |
| District | |
| Province | |
| School type | Primary / Secondary / Tertiary |

---

## 2. Class Information

| Field | Value |
|-------|-------|
| Class name | |
| Grade level | |
| Academic year | |
| Teacher name (optional) | |

---

## 3. Subject Information

| Field | Value |
|-------|-------|
| Subject name | |
| Level | e.g. O-Level, A-Level |
| Curriculum | e.g. ZIMSEC, Cambridge |

---

## 4. Learner Codes

Provide learner codes only (no full names required for the pilot).

```
L001
L002
L003
...
```

**Privacy note:** Learner codes (e.g., L001, L002) are used instead of full student names to protect learner privacy. The system can add display names later if needed, but codes are sufficient for analytics.

---

## 5. Topic List

| Topic Name | Strand (optional) | Syllabus Code (optional) |
|------------|-------------------|-------------------------|
| Fractions | Number | MATH-001 |
| Ratios | Number | MATH-002 |
| Percentages | Number | MATH-003 |
| Graphs | Geometry | MATH-004 |
| Word Problems | Applied | MATH-005 |

---

## 6. Assessment Setup

| Field | Value |
|-------|-------|
| Assessment title | |
| Assessment type | Test / Exam / Quiz / Assignment |
| Term | e.g. Term 1 |
| Date written | |
| Total marks | |
| Pass mark | |

---

## 7. Assessment Questions

Each question must have a maximum mark and a topic mapping.

| Q# | Label (optional) | Max Marks | Topic | Skill Type | Difficulty |
|----|------------------|-----------|-------|------------|------------|
| 1 | Multiple choice | 10 | Fractions | Knowledge | Easy |
| 2 | Short answer | 10 | Fractions | Comprehension | Medium |
| 3 | Problem solving | 10 | Ratios | Application | Medium |
| 4 | Word problem | 15 | Word Problems | Analysis | Hard |
| ... | | | | | |

**Skill types:** Knowledge, Comprehension, Application, Analysis
**Difficulty:** Easy, Medium, Hard

---

## 8. Learner Marks

Format: One row per learner, one column per question.

| Learner Code | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 |
|-------------|----|----|----|----|----|----|----|----|
| L001 | 7 | 8 | 6 | 9 | 12 | 10 | 8 | 11 |
| L002 | 5 | 6 | 4 | 7 | 9 | 8 | 5 | 8 |
| L003 | ... | ... | ... | ... | ... | ... | ... | ... |

**Validation rules:**
- Each score must be ≤ the question's max marks
- Scores can be whole numbers or decimals (e.g., 7.5)
- Empty cells = not attempted (treated as 0)

---

## Quick Start CSV

If you prefer to send data as CSV files, use these column headers:

**learners.csv:**
```csv
learner_code,display_name
L001,Optional Name
L002,
```

**topics.csv:**
```csv
name,strand,syllabus_code
Fractions,Number,MATH-001
```

**questions.csv:**
```csv
question_number,label,max_marks,topic_name,skill_type,difficulty
1,Multiple choice,10,Fractions,knowledge,easy
```

**marks.csv:**
```csv
learner_code,q1,q2,q3,q4,q5,q6,q7,q8
L001,7,8,6,9,12,10,8,11
```

---

## Data Checklist

- [ ] School name, district, province, type provided
- [ ] Class name and grade provided
- [ ] Subject name and level provided
- [ ] Learner codes provided (minimum 15-30 recommended)
- [ ] Topics listed with at least 3-5 topics
- [ ] Assessment questions defined with max marks per question
- [ ] Marks entered for every learner and every question
- [ ] All scores within valid range (≤ max marks)
