# Impact Intelligence — Demo Script (5-Minute Flow)

**Product:** Impact Intelligence (ZimLearnGraph Impact)
**Audience:** School principal, head of department, or teacher
**Delivery:** Live browser demo at `https://vault-lms.duckdns.org/impact`

---

## 0. Setup (before the demo)

- Ensure the demo seed data is loaded (Pilot School, Form 1A, 30 learners, Term 1 Diagnostic Test graded)
- Open Chrome/Chromium in incognito mode
- Navigate to `https://vault-lms.duckdns.org/impact`
- Close any browser dev tools

---

## 1. Open Impact Landing Page (30 seconds)

| Narrator says | Screen shows |
|---------------|--------------|
| "This is **Impact Intelligence** — a tool that turns teacher-marked tests into learning evidence. No AI magic, no replacing teachers, just clear reports from the marks you already collect." | The Impact landing page with gradient header, "Impact Intelligence" title, three primary CTAs, and Pilot Readiness panel showing live data. |

**Key points to make:**
- No extra work for teachers — uses existing test marks
- Everything is calculated deterministically from marks
- Learner privacy: only codes (L001, L002), no full names required

---

## 2. Explain the Problem (30 seconds)

| Narrator says | Screen shows |
|---------------|--------------|
| "Schools test learners regularly — weekly tests, exams, diagnostics. But the data sits in a mark book. Which topics did the class struggle with? Which learners need help? Which questions were too hard? A teacher with 30+ learners can't see these patterns by hand." | Point to the "Pilot Readiness" panel on the landing page. Wave at the 6-step workflow. |

**Transition:** "Impact Intelligence solves this. Let me show you how."

---

## 3. Show Pilot School Dashboard (60 seconds)

Navigate to: `https://vault-lms.duckdns.org/impact/school-dashboard?school=PilotSchool`

| Narrator says | Screen shows |
|---------------|--------------|
| "This is the **Pilot School Dashboard**. At a glance: one class, thirty learners assessed, one assessment, and an overall pass rate of 50%. Half the learners passed the diagnostic test." | Four summary cards: Classes (1), Learners Assessed (30), Assessments (1), Pass Rate (50%) |
| "Below that, pass rate by subject — Mathematics at 50%. And pass rate by class — Form 1A, also 50%." | Pass Rate by Subject and Pass Rate by Class cards |
| "Further down, **Topics Needing Revision**. Five topics came up as weak — Word Problems at 46%, Fractions at 46%, Percentages at 47%. This tells the teacher exactly what to re-teach." | Topics Needing Revision section with 5 topics listed |

**Key points to make:**
- This data comes from ONE diagnostic test
- The teacher doesn't need to guess which topics to revise
- Everything updated automatically when marks are entered

---

## 4. Show Form 1A Learners (30 seconds)

Navigate to: `https://vault-lms.duckdns.org/impact/classes`

Click into Form 1A → "Manage learners"

| Narrator says | Screen shows |
|---------------|--------------|
| "Learners are identified by codes, not names — L001 through L030. This protects learner privacy. The teacher can add learners with a simple code in seconds." | Learners table: 30 rows of learner codes with status badges. "Add learner" button highlighted. |

**Key point:** "No full student names needed for the pilot."

---

## 5. Show Diagnostic Assessment (30 seconds)

Navigate to: `https://vault-lms.duckdns.org/impact/assessments`

Click into "Term 1 Diagnostic Test"

| Narrator says | Screen shows |
|---------------|--------------|
| "This is the Term 1 Diagnostic Test — 100 marks, pass mark 50, graded. The teacher created this assessment, added 8 questions mapped to topics, entered marks for 30 learners, and the system did the rest." | Assessment detail page with tabs: Setup, Questions, Marks, Results, Interventions |

**Navigate tabs briefly:**
- "Questions" tab shows the 8 questions with topic mapping
- "Marks" tab shows the mark entry grid (teacher enters scores per learner per question)

---

## 6. Show Results Tab (45 seconds)

Click the "Results" tab

| Narrator says | Screen shows |
|---------------|--------------|
| "Here are the **assessment results**. Class average: 47%. Pass rate: 50%. Failure rate: 50%. 30 out of 30 learners assessed — full completion." | Summary stats: Class Average, Pass Rate, Failure Rate, Learners Assessed |
| "Below that, **weak topics** are highlighted — Fractions, Ratios, Percentages, Graphs, Word Problems — all below 50%. The teacher knows exactly what to re-teach." | Weak Topics section with percentage scores |
| "**Question Performance** shows each question's average score. Q8 (Word Problems, hard, analysis) was toughest at 21%. Q1 (Fractions, easy, knowledge) was best at 67%." | Question Performance table with per-question breakdown |
| "**At-Risk Learners** — 15 learners flagged as medium risk. Learner L001 scored 83% (pass), but learner L030 scored 21% (high risk). The teacher sees who needs help." | At-Risk Learners section |

---

## 7. Show Intervention Plan (30 seconds)

Click the "Interventions" tab

| Narrator says | Screen shows |
|--------------|--------------|
| "Based on the analytics, Impact Intelligence generates **intervention recommendations**. Critical topics need re-teaching within 7 days. Weak topics need targeted revision. High-risk learners need one-on-one attention." | Interventions tab listing recommendations sorted by severity |

**Example script:**
- "Re-teach Word Problems before moving forward — run a follow-up check within 7 days."
- "Learner L030 is at high risk (21%). Immediate intervention required."

---

## 8. Show School Report (30 seconds)

Navigate to: `https://vault-lms.duckdns.org/impact/schools/PilotSchoolId/report`

| Narrator says | Screen shows |
|---------------|--------------|
| "The **School Impact Report** is a print-ready document with the school name, summary stats, pass rate by class, assessment list, and interventions. Teachers can print this for staff meetings or save as PDF." | Print-friendly report page with school header, stats, tables |

---

## 9. Show Ministry-Style Aggregate Demo (30 seconds)

Navigate to: `https://vault-lms.duckdns.org/impact/ministry-demo`

| Narrator says | Screen shows |
|---------------|--------------|
| "For education officials, the **Ministry Demo Dashboard** shows aggregate data across schools — without learner names. As more schools join, this view shows regional trends, weak subjects, and schools needing support." | Ministry dashboard: Schools, Learners Assessed, Assessments Captured, Average Pass Rate |

**Privacy note:** "No learner names are visible at this level — just aggregate statistics."

---

## 10. Pilot Next Step (15 seconds)

| Narrator says | Screen shows |
|---------------|--------------|
| "That's the 5-minute tour. The next step is the pilot: one school, one teacher, one class, one subject. We'll run a diagnostic assessment, generate the reports, then run a follow-up to measure improvement. The school gets: weak-topic report, learner risk report, intervention plan, and improvement comparison — at no cost." | Landing page (any view) |

**Close:** "Questions?"

---

## Appendix: URL Quick Reference

| Destination | URL |
|-------------|-----|
| Landing page | `/impact` |
| School dashboard | `/impact/school-dashboard?school=ID` |
| Classes | `/impact/classes` |
| Learners | `/impact/classes/{id}/learners` |
| Assessments | `/impact/assessments` |
| Assessment detail | `/impact/assessments/{id}` |
| Assessment report | `/impact/assessments/{id}/report` |
| School report | `/impact/schools/{id}/report` |
| Ministry demo | `/impact/ministry-demo` |
| Schools | `/impact/schools` |
| Subjects | `/impact/subjects` |
