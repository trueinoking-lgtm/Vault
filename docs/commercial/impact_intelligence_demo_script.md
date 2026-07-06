# Impact Intelligence — Demo Script

This script guides you through a 10-minute live demo of Impact Intelligence.

---

## Setup (1 minute)

**Before starting, ensure:**
- SurrealDB is running on port 8000
- Demo data is seeded (run `python scripts/seed_impact_demo.py`)
- API server is running on port 5055
- Frontend is running on port 3000

---

## Demo Flow

### 1. Landing Page (30 seconds)

Navigate to `/impact`

**Say:** *"This is the Impact Intelligence landing page. From here, teachers can set up their school, create classes, add learners, create assessments, enter marks, and view insights."*

**Show:**
- "Create assessment" primary CTA
- "View school dashboard" secondary CTA
- 6 navigation cards

---

### 2. Assessment List (30 seconds)

Click **"Create assessment"** or navigate to `/impact/assessments`

**Say:** *"Here is the assessment list. Our seeded demo has a Term 1 Diagnostic Test for Mathematics."*

**Click on:** "Term 1 Diagnostic Test"

---

### 3. Assessment Detail — Setup Tab (30 seconds)

**Say:** *"The assessment detail page has five tabs. The Setup tab shows assessment details: type, total marks, pass mark, term, and status."*

**Show:**
- Assessment title: Term 1 Diagnostic Test
- Type: Test, 100 marks
- Pass mark: 50
- Status: Graded
- Export buttons (Marks, Analytics)
- View Report link

---

### 4. Assessment Detail — Questions Tab (30 seconds)

Click the **Questions** tab

**Say:** *"The Questions tab shows how each question is mapped to a topic with its max marks, skill type, and difficulty."*

**Show:**
- 8 questions mapped to 5 topics
- Total marks assigned: 100/100

---

### 5. Assessment Detail — Marks Tab (30 seconds)

Click the **Marks** tab

**Say:** *"The Marks tab shows the mark entry grid. Rows are learners, columns are questions. Teachers enter scores in each cell with keyboard navigation and validation."*

**Show:**
- 30 learners (L001-L030) as rows
- 8 questions as columns
- Scores in each cell
- Total per learner
- Mark completion: 240/240 (100%)

---

### 6. Assessment Detail — Results Tab (2 minutes)

Click the **Results** tab

**Say:** *"This is the most important tab. Results shows the analytics calculated from the marks automatically."*

**Point to summary stats:**
- **Class average:** ~45% *(point to number)*
- **Pass rate:** ~40% *(point to number)*
- **Failure rate:** ~60% *(point to number)*
- **Learners assessed:** 30/30

**Say:** *"All numbers are calculated deterministically from the marks. No AI is needed for these analytics."*

**Point to Weak Topics:**
- *"The system automatically identifies topics where learners scored below 55%. These need revision."*
- Example: Fractions (35%, Critical), Word Problems (38%, Critical)

**Point to Question Performance table:**
- *"Each question shows its average score and percentage. Critical questions are flagged in red."*

**Point to At-Risk Learners:**
- *"Learners scoring below 40% are flagged as high risk. The system identifies who needs support."*

---

### 7. AI Summaries — Optional (1 minute)

Scroll to **AI-Generated Insights**

**Say:** *"Optionally, teachers can generate AI summaries to help interpret the data."*

**Click "Generate Teacher Summary":**
- Wait for generation (few seconds)
- *"This gives a narrative overview of the assessment results."*

**Say:** *"AI summaries are advisory only. The numbers above remain the source of truth. AI never changes the pass rate or risk levels."*

---

### 8. Interventions Tab (30 seconds)

Click the **Interventions** tab

**Say:** *"The Interventions tab shows recommended actions. Critical items need immediate attention."*

**Show:**
- Critical interventions (red)
- High priority (amber)
- Recommended actions for each

---

### 9. Exports (30 seconds)

Go back to the header, click **"Export Analytics"**

**Say:** *"Teachers can export marks and analytics as CSV files that open cleanly in Excel or Google Sheets."*

**Also show:** "View Report" → browser Print → Save as PDF

---

### 10. School Dashboard (1 minute)

Navigate to `/impact/school-dashboard` and select "Pilot School"

**Say:** *"The school dashboard gives school heads an aggregated view across all assessments."*

**Show:**
- Total classes: 1
- Learners assessed: 30
- Overall pass rate: ~40%
- Pass rate by subject
- Topics needing revision
- Classes needing support
- Intervention priority

**Say:** *"This dashboard helps school heads identify which classes and subjects need support, without requiring manual data aggregation."*

---

### 11. Ministry Demo (30 seconds)

Navigate to `/impact/ministry-demo`

**Say:** *"The ministry demo shows a high-level aggregate view suitable for education officials."*

**Show:**
- Schools, learners, assessments counts
- Average pass rate
- Weak topics by subject
- Schools needing support
- All data is aggregate — no learner names visible

---

### 12. Closing (30 seconds)

**Say:** *"Impact Intelligence turns marked assessments into learning evidence. Teachers get weak topic analysis, learner risk flags, and intervention recommendations — all from marks they already collect."*

**Key messages:**
- Deterministic analytics (no AI required)
- Teacher support tool (does not replace teachers)
- Privacy-aware (learner codes, not names)
- Exportable reports (CSV + PDF)
- Ready for pilot in one school, one class, one subject

---

## Demo Checklist

- [ ] SurrealDB running
- [ ] Demo data seeded
- [ ] API server running
- [ ] Frontend running
- [ ] Landing page loads
- [ ] Assessment list loads
- [ ] Assessment detail (all 5 tabs) works
- [ ] Results show analytics numbers
- [ ] AI summary generates (if configured)
- [ ] CSV export downloads
- [ ] Print report shows clean layout
- [ ] School dashboard loads
- [ ] Ministry demo loads

---

## Troubleshooting During Demo

| Problem | Fix |
|---------|-----|
| Page doesn't load | Check API server is running on port 5055 |
| No data | Run `python scripts/seed_impact_demo.py` |
| AI summary fails | "AI summaries are unavailable" — move on gracefully |
| CSV won't download | Check browser popup blocker |
| Print layout broken | Use Chrome/Firefox, not Safari |
