# Impact Intelligence Demo Runbook

## Overview

This runbook provides step-by-step instructions for running the Impact Intelligence demo, from database reset through full end-to-end verification.

---

## Prerequisites

- SurrealDB running on port 8000
- Python 3.11+ with project dependencies
- Node.js 18+ with frontend dependencies
- (Optional) AI provider configured for AI summaries

---

## Quick Start

### 1. Reset Database

```bash
cd /path/to/vault-open-notebook
python scripts/reset_impact_demo.py
```

This removes all existing Impact Intelligence data.

### 2. Seed Demo Data

```bash
python scripts/seed_impact_demo.py
```

This creates:
- **School**: Pilot School (Harare South, Harare)
- **Class**: Form 1A
- **Subject**: Mathematics (O-Level, ZIMSEC)
- **Topics**: Fractions, Ratios, Percentages, Graphs, Word Problems
- **Learners**: L001-L030 (30 learners)
- **Assessment**: Term 1 Diagnostic Test (100 marks, 50 pass mark)
- **Questions**: 8 questions mapped to topics
- **Marks**: 240 mark entries with realistic mixed scores

### 3. Start API Server

```bash
python run_api.py
```

API runs on http://localhost:5055

### 4. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on http://localhost:3000

---

## Demo Routes

| Route | Description |
|-------|-------------|
| `/impact` | Main landing page with navigation cards |
| `/impact/schools` | School management |
| `/impact/classes` | Class management |
| `/impact/subjects` | Subject and topic management |
| `/impact/assessments` | Assessment list |
| `/impact/assessments/[id]` | Assessment detail with 5 tabs |
| `/impact/assessments/[id]/report` | Print-friendly assessment report |
| `/impact/school-dashboard` | School-level analytics dashboard |
| `/impact/schools/[id]/report` | Print-friendly school report |
| `/impact/ministry-demo` | Ministry aggregate demo |

---

## Demo Click Path

### Full Workflow Demo

1. **Navigate to Impact Intelligence**
   - Go to `http://localhost:3000/impact`
   - Show landing page with navigation cards

2. **View School Dashboard**
   - Click "View school dashboard" or navigate to `/impact/school-dashboard`
   - Select "Pilot School"
   - Show aggregated metrics:
     - Total classes: 1
     - Learners assessed: 30
     - Assessments: 1
     - Overall pass rate: ~35-50%

3. **View Assessment**
   - Navigate to `/impact/assessments`
   - Click on "Term 1 Diagnostic Test"
   - Show 5 tabs: Setup, Questions, Marks, Results, Interventions

4. **Results Tab**
   - Show summary stats:
     - Class average: ~40-50%
     - Pass rate: ~35-50%
     - Failure rate: ~50-65%
     - Learners assessed: 30/30
   - Show weak topics (2-3 topics below 55%)
   - Show question performance table
   - Show at-risk learners (5-10 learners)

5. **Interventions Tab**
   - Show intervention recommendations
   - Grouped by severity (critical, high, medium, low)

6. **AI Summaries (Optional)**
   - If AI provider configured:
     - Click "Generate Teacher Summary"
     - Show generated narrative
     - Click "Generate Intervention Plan"
     - Show structured plan
     - Click "Generate Remedial Lesson"
     - Show lesson outline and mini-test idea
   - If AI not configured:
     - Show fallback message: "AI summaries are unavailable"

7. **Exports**
   - Click "Export Marks" - download CSV
   - Click "Export Analytics" - download CSV
   - Open CSVs in spreadsheet software

8. **Print Reports**
   - Click "View Report" on assessment
   - Use browser Print → Save as PDF
   - Show print-friendly layout

---

## Expected Dashboard Numbers

### School Dashboard (Pilot School)

| Metric | Expected Value |
|--------|----------------|
| Total classes | 1 |
| Total learners | 30 |
| Learners assessed | 30 |
| Total assessments | 1 |
| Overall pass rate | 35-50% |

### Assessment Results (Term 1 Diagnostic Test)

| Metric | Expected Value |
|--------|----------------|
| Class average | 40-50% |
| Pass rate | 35-50% |
| Failure rate | 50-65% |
| Weak topics | 2-3 topics |
| At-risk learners | 5-10 learners |
| Critical interventions | 1-2 |

---

## Export/Report Steps

### CSV Exports

1. **Marks CSV**
   - Navigate to assessment detail
   - Click "Export Marks"
   - File downloads as `marks_Term_1_Diagnostic_Test.csv`
   - Opens cleanly in Excel/Google Sheets

2. **Analytics CSV**
   - Navigate to assessment detail
   - Click "Export Analytics"
   - File downloads as `analytics_Term_1_Diagnostic_Test.csv`
   - Contains: Summary, Question Performance, Topic Performance, Learner Performance

3. **School Report CSV**
   - Navigate to school dashboard
   - Click "Export Report CSV"
   - File downloads as `school_report_Pilot_School.csv`
   - Contains: School Summary, Pass Rate by Class, Interventions

### Print Reports

1. **Assessment Report**
   - Navigate to `/impact/assessments/[id]/report`
   - Use browser Print (Ctrl+P / Cmd+P)
   - Select "Save as PDF"
   - Report hides navigation, sidebar, buttons

2. **School Report**
   - Navigate to `/impact/schools/[id]/report?school=[schoolId]`
   - Use browser Print (Ctrl+P / Cmd+P)
   - Select "Save as PDF"
   - Report hides navigation, sidebar, buttons

---

## AI Summary Behavior

### Manual Generation

- AI summaries are **NOT** auto-generated on page load
- User must click "Generate" button to trigger AI call
- Each summary type has its own button:
  - Generate Teacher Summary
  - Generate Intervention Plan
  - Generate Remedial Lesson

### Timeout Handling

- AI requests timeout after 30 seconds
- UI shows loading spinner during generation
- On timeout, fallback message is displayed

### Failure Handling

- If no AI provider configured:
  - Message: "AI summaries are unavailable. Assessment analytics are still available."
- If AI call fails:
  - Fallback content is shown
  - No provider/model details exposed to user

### Privacy

- AI prompts use learner codes only (L001, L002, etc.)
- Full student names are NOT sent to AI provider
- Ministry views remain aggregate only

### Caching

- Summaries are cached in component state
- No repeated AI calls from tab switching
- User can click "Regenerate" to refresh

---

## Known Limitations

1. **Single School Demo**: Demo seeded with one school only
2. **Single Assessment**: Only one assessment seeded
3. **No Real-time Updates**: Dashboard requires refresh for new data
4. **AI Provider Required**: AI summaries need configured provider
5. **Print Layout**: Browser print varies by browser/OS

---

## Troubleshooting

### Database Issues

**Problem**: "Table not found" errors
**Solution**: Run seed script again:
```bash
python scripts/reset_impact_demo.py
python scripts/seed_impact_demo.py
```

### API Issues

**Problem**: API won't start
**Solution**: Check SurrealDB is running on port 8000

### Frontend Issues

**Problem**: Frontend shows errors
**Solution**: Clear browser cache and restart frontend:
```bash
cd frontend
npm run dev
```

### AI Summary Issues

**Problem**: "AI summaries are unavailable"
**Solution**: Configure AI provider in Settings → Models

**Problem**: AI summary times out
**Solution**: Check AI provider status, try simpler prompt

### Export Issues

**Problem**: CSV won't open
**Solution**: Ensure file extension is .csv, open with Excel/Sheets

---

## Verification Checklist

- [ ] Database reset successfully
- [ ] Demo data seeded successfully
- [ ] API server starts without errors
- [ ] Frontend builds without errors
- [ ] All routes load correctly
- [ ] Assessment Results tab shows analytics
- [ ] Weak topics identified correctly
- [ ] At-risk learners identified correctly
- [ ] Interventions generated correctly
- [ ] CSV exports download cleanly
- [ ] CSVs open in spreadsheet software
- [ ] Print reports hide navigation
- [ ] Print to PDF works
- [ ] AI summaries generate manually
- [ ] AI failure shows fallback message
- [ ] No provider/model details exposed

---

## Support

For issues not covered here, check:
- API logs: Console output from `python run_api.py`
- Frontend logs: Browser developer console
- Database: SurrealDB logs on port 8000
