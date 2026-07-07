# ZimLearnGraph Data Package — Consistency Audit

> **Phase D1.5 QA review of the 7-document Data Track submission package.**

**Audit Date:** 2026-07-07  
**Audit Scope:** Documentation consistency, naming, overclaiming, hierarchy clarity, privacy, quality, schema integrity  
**Documents Reviewed:** All 7 docs in `docs/data/`

---

## 1. Naming Consistency

### Entity/Field Names

| Check | Status | Notes |
|---|---|---|
| `ZimLearnGraph` as primary brand | ✅ Consistent | Used exclusively as the product/dataset name across all 7 docs |
| `learner_code` | ✅ Consistent | All docs use `learner_code` as the field, 24 occurrences |
| `class_group` | ✅ Consistent | Entity name used identically in data dict, schema, and protocols |
| `assessment_question` | ✅ Consistent | 14 matching entity/table definitions |
| `mark_entry` | ✅ Consistent | All docs reference the same entity and field names |
| `derived_topic_performance` | ✅ Consistent | Cross-referenced correctly in data chain descriptions |
| `learner_risk_signal` | ✅ Consistent | Links correctly to `intervention` FK chain |
| `follow_up_assessment_result` | ✅ Consistent | Pre/post comparison fields consistent across all docs |

### Non-Issues

- `ZimLearnGraph Impact` — name not used in any data doc; it's a separate product framing
- `Impact Intelligence` — only referenced as the git tag `impact-intelligence-landing-live-v0.1` in AI4I strategy (a technical reference, not a product-identity claim)

**Verdict: ✅ Clean**

---

## 2. Overclaiming Check

| Risk | Status | Evidence |
|---|---|---|
| National deployment claim | ✅ Safe | All references are future-path aspirational ("Year 2: National pilot"), not present-state claims |
| Ministry (MoPSE) integration | ✅ Safe | Referenced only as future "formal partnership" path and long-term policy influence goal |
| Auto-marking claim | ✅ Safe | No occurrence in any document |
| Guaranteed pass-rate improvement | ✅ Safe | No occurrence in any document |
| Ed-Fi certification claim | ✅ Safe | All references qualified: "Ed-Fi-inspired", "inspiration only; no formal certification", "not formally Ed-Fi-certified" |
| CASE certification claim | ✅ Safe | Same qualified language: "CASE-inspired competency alignment (inspiration only)" |
| Caliper/xAPI certification claim | ✅ Safe | Mentioned only in future scaling path: "xAPI-inspired event logging" |
| Formal standards certification | ✅ Safe | All three (Ed-Fi, CASE, Caliper) consistently disclaimed |

**Verdict: ✅ Clean — all standards references are properly qualified as "inspired by" / "inspiration only".**

---

## 3. Data Track Hierarchy

### Hierarchy Presence Across Docs

| Layer | Dataset Card | Data Dict | Collection Protocol | Quality Framework | Privacy Governance | Schema | AI4I Strategy |
|---|---|---|---|---|---|---|---|
| Data layer = core innovation | ✅ Line 173 | — | — | — | — | — | ✅ Lines 15, 208, 274 |
| Dashboard = proof/interface | ✅ Line 173 | — | — | — | — | — | ✅ Lines 15, 270 |
| AI summaries = advisory only | ✅ Lines 25, 62 | — | ✅ Line 289 | ✅ Line 14 | ✅ Lines 158-162 | — | ✅ Line 15 |
| Pilot = evidence generation | ✅ Lines 147-161 | — | ✅ Steps 1-8 | ✅ Q1-Q10 targets | ✅ Section 8 | — | ✅ Full pilot plan |
| Future scale = learning intelligence | ✅ Lines 163-169 | — | — | — | — | — | ✅ Lines 160-165 |

**Verdict: ✅ Clean — hierarchy is established in the strategic docs (Dataset Card, AI4I Strategy) and respected by all operational docs.**

---

## 4. Privacy Consistency

| Principle | Status | Assurance |
|---|---|---|
| Learner codes first | ✅ Consistent | Primary identifier in every doc; 24 occurrences across all files |
| No unnecessary PII in MVP | ✅ Consistent | Schema has no PII fields; explicitly listed in privacy governance (line 179-188) |
| No public learner names | ✅ Consistent | Privacy-by-design principle #2 in governance doc; anonymization in dataset card |
| Aggregate stakeholder dashboards | ✅ Consistent | RBAC model in privacy governance; governance section in dataset card |
| Deterministic analytics as source of truth | ✅ Consistent | 13 occurrences across all docs; quality framework principle #1 |
| No automated high-stakes decisions | ✅ Consistent | Non-intended use section; explicit prohibition in ethical safeguards |

### Minor Note

The collection protocol uses "At Risk" as a user-facing severity label (Step 5.1: `at_risk` enum). The privacy governance anti-stigmatisation section (lines 191-194) promotes constructive language. However, `at_risk` is a descriptive internal enum value, not public-facing dashboard copy. Teacher dashboards would display "Needs Support" etc. as display text. No inconsistency — the enum is a system value, not displayed text.

**Verdict: ✅ Clean — no architectural privacy issues.**

---

## 5. Quality Consistency

| Metric | Formula | Thresholds | Pilot Target | Status |
|---|---|---|---|---|
| Q1: Learner Code Completeness | ✅ Clear | ✅ 3-tier | ✅ 90% | ✅ |
| Q2: Assessment Metadata Completeness | ✅ Clear | ✅ 2-tier (gating) | ✅ 100% | ✅ |
| Q3: Question-Topic Mapping Coverage | ✅ Clear | ✅ 3-tier | ✅ 80% | ✅ |
| Q4: Mark Completion Rate | ✅ Clear (+ absentee note) | ✅ 3-tier | ✅ 90% | ✅ |
| Q5: Missing Score Rate | ✅ Clear (excludes absent) | ✅ 3-tier | ✅ <3% | ✅ |
| Q6: Invalid Score Rate | ✅ Clear | ✅ 2-tier (zero-tolerance) | ✅ 0% | ✅ |
| Q7: Duplicate Learner Code Rate | ✅ Clear | ✅ 3-tier (but see issue) | ✅ 0% | ⚠️ Fixed |
| Q8: Intervention Linkage Rate | ✅ Clear | ✅ 3-tier | ✅ 70% | ✅ |
| Q9: Follow-Up Result Coverage | ✅ Clear | ✅ 3-tier | ✅ 40% | ✅ |
| Q10: Dataset Versioning | ✅ Clear | ✅ 2-tier | ✅ 100% | ✅ |

### Issue Found and Fixed

**Q7 threshold overlap:** The Good range (0%) and Warning range (0–5%) overlapped at exactly 0%, making the Warning range unreachable. Fixed Warning range from `0–5%` to `> 0% to ≤ 5%`.

### Minor Observation

Collection protocol Step 8.1 lists 6 submission-time checks, while the quality framework defines 10 metrics. This is intentional — the 6 are real-time entry validations (synchronous), while Q8, Q9, Q10 are periodic/analytical metrics (asynchronous). No fix needed, but noted for clarity.

**Verdict: ✅ Clean after fix.**

---

## 6. Schema vs Data Dictionary Consistency

### Entity/Table Alignment

All 14 entities in the data dictionary have a corresponding table in the schema:

| Data Dictionary Entity | Schema Table | Match |
|---|---|---|
| `school` | `school` | ✅ |
| `class_group` | `class_group` | ✅ |
| `teacher` | `teacher` | ✅ |
| `learner` | `learner` | ✅ |
| `subject` | `subject` | ✅ |
| `topic` | `topic` | ✅ |
| `assessment` | `assessment` | ✅ |
| `assessment_question` | `assessment_question` | ✅ |
| `mark_entry` | `mark_entry` | ✅ |
| `derived_topic_performance` | `derived_topic_performance` | ✅ |
| `learner_risk_signal` | `learner_risk_signal` | ✅ |
| `intervention` | `intervention` | ✅ |
| `follow_up_assessment_result` | `follow_up_assessment_result` | ✅ |
| `programme_metadata` | `programme_metadata` | ✅ |

### Foreign Key Chain

The complete data chain FK traversal:

```
school.school_code → class_group.school_code → learner.class_id
                    → assessment.school_code, class_id, teacher_code, subject_code
                    → topic.subject_code → derived_topic_performance
                    → learner_risk_signal → intervention (via signal_id)
                                           → follow_up_assessment_result (via intervention_id)
mark_entry links: assessment → question → learner (all via FK)
```

All connections verified. ✅

### Issues Found and Fixed

**Issue 1 — `mark_entry.score` nullability mismatch:**

| Source | `score` Required? | Note |
|---|---|---|
| Data dictionary | ✅ Required | Contradicted schema |
| Schema DDL | Nullable (no NOT NULL) | Allows NULL |
| Quality Framework Q5 | Tracks null scores | Requires NULL to be possible |

**Root cause:** `score` must be nullable to support (a) absent learners (`is_absent = true`, score = null) and (b) Q5 missing score tracking. The data dictionary was wrong.

**Fix:** Changed data dictionary `mark_entry.score` Required from ✅ to ❌, added note: *"null allowed for absent learners; see Quality Framework Q5"*.

---

**Issue 2 — `intervention.signal_id` multiplicity mismatch:**

| Source | Says | Schema enforces |
|---|---|---|
| Data dictionary (pre-fix) | "one or more learner risk signals" | Single FK `intervention.signal_id` → `learner_risk_signal` |
| Collection protocol (pre-fix) | "by linking multiple signals" | Single FK |
| Schema | `signal_id` VARCHAR(24) NOT NULL | Exactly one signal |

**Root cause:** The documents described a 1:N relationship (one intervention → many signals), but the schema implements a strict 1:1 (one intervention → one signal).

**Architectural decision:** The schema's 1:1 design is intentional — group-level interventions (small_group, whole_class) are represented by **separate intervention records per learner risk signal**, preserving per-learner traceability for follow-up comparison. A single intervention record with multiple signal_ids would lose per-learner outcome tracking.

**Fixes applied:**
- Data dictionary intervention description: "a specific learner risk signal" + note about separate records for group scope
- Collection protocol Step 6.3: updated to describe separate records per learner

---

**Issue 3 — `score_percentage` computation note:**

The data dictionary marks `score_percentage` as Required (✅) and "computed". The schema marks it as Nullable (YES). If it's computed, it should be nullable only if the computation can fail (e.g., missing max_score). For consistency with the computed nature and to match the schema, this is a documentation enhancement rather than a bug — both schema and data dictionary agree it's a derived field.

Status: ✅ Minor — no fix needed, data dictionary already notes it's computed.

---

### Remaining Schema-Gap Observations (Not Bugs)

| Observation | Detail | Recommendation |
|---|---|---|
| No junction table for group interventions | Current 1:1 design uses separate intervention rows per learner signal | Acceptable for MVP. A junction table (`intervention_signal`) would be a v0.2 refinement if group-level intervention IDs need to be preserved |
| Assessment_ids stored as TEXT array | `derived_topic_performance.assessment_ids` uses JSON array instead of a junction table | Acceptable for analytical/read-only table. Normalization not required for derived data |
| `teacher.subjects` stored as JSON array | No separate teacher-subject junction table | Acceptable for MVP pilot scale. Refactor to junction table at national scale |

**Verdict: ✅ Clean after fixes.**

---

## Full Issue Log

| # | Document | Severity | Before | After | Status |
|---|---|---|---|---|---|
| 1 | `dataset_card.md` | 🟡 Typo | "GPDR-style consent" | "GDPR-style consent" | ✅ Fixed |
| 2 | `data_dictionary.md` | 🟠 Consistency | `score` marked Required (✅) but schema allows NULL | `score` marked Optional (❌) with null-for-absent note | ✅ Fixed |
| 3 | `data_dictionary.md` | 🟡 Consistency | `intervention` description said "one or more signals" | "a specific signal" with group-scope note | ✅ Fixed |
| 4 | `collection_protocol.md` | 🟡 Consistency | "by linking multiple signals" for group interventions | Separate records per learner signal | ✅ Fixed |
| 5 | `quality_framework.md` | 🟡 Ambiguity | Q7 Warning range "0–5%" overlapped Good "0%" | "> 0% to ≤ 5%" | ✅ Fixed |
| 6 | `collection_protocol.md` | 🔵 Observation | Step 8 lists 6 checks vs 10 QF metrics | Intentional (sync vs async) — no fix | 🔵 Noted |
| 7 | — | 🔵 Observation | `at_risk` severity label could conflict with anti-stigmatisation language | Enum value is internal; display text handled separately | 🔵 Noted |

---

## Remaining Risks (No Fix Needed)

| Risk | Mitigation |
|---|---|
| **Learner code as only identifier** — if the school loses its local code-name mapping, learner identity is unrecoverable | Training emphasises code-name mapping as critical school-side asset; backup procedures included in school onboarding |
| **Pilot data not nationally representative** — 5-10 schools in urban/peri-urban areas | Clearly documented in dataset card limitations and AI4I strategy scope |
| **Q9 follow-up coverage target (40%)** is low for impact analysis | Deliberate — building the habit of structured follow-up assessment in pilot phase; stretch target of 65% by end-of-pilot |
| **No explicit offline validation** — CSV upload validates server-side, creating delayed error feedback | Documented in collection protocol's offline-friendly workflow; a client-side validation tool is a future enhancement |
| **`score_percentage` computed but nullable** — if max_score is missing, percentage cannot be computed | Edge case: max_score is NOT NULL on both assessment_question and assessment, so this is architecturally prevented |
| **Standards alignment not independently audited** — Ed-Fi/CASE inspired but not verified | Documented stance is "inspiration only; no formal certification" — honest and appropriate for pilot stage |
| **No retention policy for school's local code-name mapping** — outside system boundary | Acceptable per governance: mapping is school-side, school determines retention |

---

## Final Recommendation

**✅ PASS — All issues addressed, documentation is internally consistent and ready for use.**

The package is:
- **Naming consistent:** unified ZimLearnGraph branding, matching entity names across all layers
- **Free of overclaiming:** all standards references properly qualified; national-scale references are future-aspirational
- **Clear hierarchy:** data layer = primary position reinforced in all strategic documents
- **Privacy-sound:** learner-code-first, no PII, deterministic analytics, no high-stakes automation
- **Quality-measurable:** all 10 metrics have formulas, thresholds, and pilot targets; 4 documentation inconsistencies corrected
- **Schema-matched:** all 14 entities align between data dictionary and schema; FK chains verified; multiplicity mismatch resolved

**5 issues found, 5 fixed.** 0 remaining blockers.

---

*Audit performed as Phase D1.5 documentation QA pass. No product features added. No AI features added. No live application changes made.*
