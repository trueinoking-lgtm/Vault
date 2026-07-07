# Problem & Solution: ZimLearnGraph

> **AI4I Data Track — Detailed Problem Analysis and Solution Architecture**

---

## Part 1: The Problem

### 1.1 Zimbabwe's Assessment Data Is Trapped

Zimbabwe's education system runs on assessment. Every term, teachers across the country set and mark thousands of tests, exams, topic exercises, and assignments. These assessments contain the most granular signal available about what learners know — question by question, topic by topic, learner by learner.

This data is systematically lost.

**The data is trapped in:**
- **Paper mark books** — locked in a teacher's desk, illegible after a term, lost when the teacher transfers schools
- **Isolated spreadsheets** — one file per teacher, per class, per term, with no standardised format or naming convention
- **End-of-term report cards** — aggregated to a single subject grade, destroying all topic-level granularity
- **Teacher memory** — the most detailed signal lives in the teacher's head and leaves when they do

### 1.2 Five Interlocking Barriers

**Barrier 1: No structured collection protocol**
Teachers record marks in whatever format works for their classroom. There is no standardised template, no required fields, no validation. The data that exists is structurally incompatible across classrooms, subjects, and schools.

**Barrier 2: No learner-level longitudinal view**
A learner's performance trajectory across terms and years is invisible. Teachers inherit a class with no data on what each learner knows. By the time patterns emerge, the learner has moved to the next form.

**Barrier 3: No topic-level granularity**
A learner gets "Mathematics: 45%" on a report. The teacher knows from the marked paper that the learner failed Algebraic Expressions but passed Statistics. That knowledge is never captured in structured form. The 45% aggregates away every useful signal.

**Barrier 4: No privacy infrastructure**
Schools cannot centralise assessment records because paper documents carry learner names. Any centralisation requires anonymisation, but there is no standard anonymisation protocol. Fear of data exposure keeps assessment data distributed and inaccessible.

**Barrier 5: No feedback loop**
Teachers intervene when they see a learner struggling — extra exercises, re-teaching, peer tutoring. But the effect of that intervention is never systematically measured because there is no structured way to link a follow-up assessment result back to the original weakness.

### 1.3 The Consequence

| Stakeholder | Current Reality | What They Need |
|---|---|---|
| **Teacher** | Intervention decisions from memory and intuition | Topic-level weakness data per learner |
| **School leader** | No evidence for resource allocation | Aggregate performance trends by class, subject, topic |
| **Education researcher** | No granular, longitudinal dataset | Structured, anonymised data on learning outcomes |
| **AI developer** | Cannot build education AI | Training data from Zimbabwean classrooms |
| **Ministry / MoPSE** | National decisions from high-level aggregates | Topic-level learning evidence across the system |

### 1.4 Why This Is an AI4I Problem

The AI for International Impact challenge is about using AI to create impact in developing contexts. In Zimbabwe, the fundamental barrier to AI in education is not model capability — it is **data infrastructure**. You cannot build, train, or deploy education AI without structured, privacy-preserving, representative education data. Solving the data infrastructure problem is the essential first step — and it is the step ZimLearnGraph takes.

---

## Part 2: The Solution

### 2.1 What ZimLearnGraph Does

ZimLearnGraph is a complete data pipeline that converts existing teacher-marked assessments into structured, AI-ready learning evidence:

```
School → Class → Learner Code → Subject → Topic 
→ Assessment → Question → Mark 
→ Weakness Signal → Intervention → Follow-up Result
```

### 2.2 How It Works

**Step 1 — School Onboarding:**
A school registers its class groups, teachers, and learners. The system generates anonymised learner codes. The school retains the name-to-code mapping locally. No PII enters the dataset.

**Step 2 — Assessment Entry:**
For each assessment, the teacher enters metadata (subject, date, type, total marks) and maps each question to a curriculum topic from the ZIMSEC-aligned topic registry.

**Step 3 — Mark Entry:**
The teacher enters each learner's marks per question via web form or bulk CSV upload. The system validates range, completeness, and uniqueness automatically.

**Step 4 — Topic Performance:**
The analytics pipeline derives weighted topic-level performance per learner. A learner who scored 30% on Algebra questions across all assessments is flagged with a weakness signal.

**Step 5 — Intervention:**
The teacher reviews weakness signals, acknowledges them, and logs any remediation action taken (reteaching, targeted exercises, peer tutoring, etc.).

**Step 6 — Follow-Up:**
The teacher administers a follow-up assessment on the same topics. The system computes pre/post comparison and flags whether the intervention was effective.

### 2.3 Design Decisions

| Decision | Rationale |
|---|---|
| **Teacher-first, not system-first** | Teachers already mark assessments; the pipeline captures what they already do, adding minimal overhead |
| **Anonymised learner codes** | Privacy-by-design from day one; school holds the only identifier mapping |
| **Question-topic mapping** | Provides topic-level granularity that no aggregate score can match |
| **CSV-first upload** | Works offline; teacher fills spreadsheet during class, uploads when connected |
| **Deterministic analytics** | Every derived metric has a defined formula; no AI involved in core analytics |
| **AI advisory only** | AI summarises what the deterministic layer has computed; labelled as non-authoritative |

### 2.4 Innovation: Structural, Not Algorithmic

The innovation is in the **structure**, not the model:

- **Privacy architecture** — learner codes from day one; no PII anywhere in the schema
- **Collection protocol** — designed for Zimbabwe's classroom reality, not Silicon Valley
- **Quality framework** — 10 measurable, automated metrics; transparent, no data hidden
- **Data dictionary + schema** — 14 entities, 29 foreign keys, complete SQL DDL
- **Governance model** — school as data controller, platform as processor, funder sees aggregate only

This is not "apply AI to the problem." This is "build the infrastructure that makes AI possible."

### 2.5 What Exists Today

**MVP, live and functional:**
- Complete data track documentation (7 documents)
- Live dashboard landing page demonstrating visualisation layer
- SQL-compliant schema with DDL for 14 tables
- Seeded data demonstrating the full flow from school onboarding through follow-up assessment

**What is ready for pilot:**
- Onboarding protocol
- Learner code generation system
- Data entry templates (CSV)
- Quality monitoring framework
- Privacy governance agreements

### 2.6 What Pilot Funding Provides

- **Real data** — genuine classroom assessments replacing seeded data
- **Validation** — quality thresholds tested against real conditions
- **Teacher training** — building capability for structured data collection
- **Evidence** — measurable impact data for scaling decisions
- **Refinement** — protocol, schema, and framework improved through real use

---

## Part 3: Why This Solution Works for Zimbabwe

### Fits Existing Practice

Zimbabwean teachers already mark assessments. ZimLearnGraph does not ask them to change how they teach or assess. It asks them to capture what they already know in a structured format.

### Works Without Connectivity

CSV batch upload means a teacher in a rural school with intermittent internet can fill marks offline and upload when connected. No real-time requirement.

### Uses the Existing Curriculum

The topic registry is aligned with ZIMSEC Ordinary Level syllabuses. Teachers map questions to topics they already teach. No new curriculum framework needed.

### Respects Privacy and Autonomy

Schools control their data. Teachers control their class records. The system enforces privacy at the schema level — there is nowhere to put a learner name.

### Scales Incrementally

One school works. Ten schools work better. The protocol, schema, and governance are the same at every scale. National deployment is a matter of onboarding more schools, not redesigning the system.

---

*Problem defined. Solution architected. MVP live. Pilot ready.*
