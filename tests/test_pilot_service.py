"""Phase C pilot-domain tests written before implementation."""

import pytest


def test_pilot_tables_are_physically_separate_from_seeded_demo_tables():
    from vault_core.domain.pilot import PILOT_TABLES

    assert PILOT_TABLES
    assert all(name.startswith("pilot_") for name in PILOT_TABLES)
    assert not any(name.startswith("impact_") for name in PILOT_TABLES)


def test_learner_csv_preview_accepts_anonymous_codes_and_rejects_duplicates():
    from api.services.pilot import validate_learner_csv

    preview = validate_learner_csv(
        "learner_code,class_name,gender,support_note,status\n"
        "L001,Form 3A,F,,active\n"
        "L001,Form 3A,M,,active\n"
        ",Form 3A,,,active\n",
        existing_codes={"L099"},
        allowed_classes={"Form 3A"},
    )

    assert preview.accepted_count == 1
    assert preview.rejected_count == 2
    assert preview.rows[0].data["learner_code"] == "L001"
    assert any("Duplicate learner code" in error for row in preview.rows for error in row.errors)
    assert all("name" not in row.data for row in preview.rows)


def test_learner_csv_rejects_sensitive_name_columns():
    from api.services.pilot import validate_learner_csv

    preview = validate_learner_csv(
        "learner_code,class_name,full_name\nL001,Form 3A,Jane Doe\n",
        existing_codes=set(),
        allowed_classes={"Form 3A"},
    )
    assert preview.accepted_count == 0
    assert any("unsupported sensitive column" in error.lower() for error in preview.errors)


def test_marks_preview_rejects_scores_over_max_and_duplicate_rows():
    from api.services.pilot import validate_marks_csv

    preview = validate_marks_csv(
        "learner_code,question_number,score\n"
        "L001,1,8\n"
        "L001,1,7\n"
        "L002,2,12\n"
        "L003,1,\n",
        learner_codes={"L001", "L002", "L003"},
        question_maxima={1: 10.0, 2: 10.0},
        existing_pairs=set(),
    )

    assert preview.accepted_count == 1
    assert preview.rejected_count == 3
    errors = [error for row in preview.rows for error in row.errors]
    assert any("Duplicate learner/question" in error for error in errors)
    assert any("exceeds maximum" in error for error in errors)
    assert any("incomplete" in error.lower() for error in errors)


def test_follow_up_comparison_uses_qualified_non_causal_language():
    from api.services.pilot import compare_assessment_summaries

    result = compare_assessment_summaries(
        diagnostic={"average": 48.0, "pass_rate": 40.0, "participation": 28, "topics": {"Algebra": 42.0}},
        follow_up={"average": 61.0, "pass_rate": 63.0, "participation": 27, "topics": {"Algebra": 58.0}},
        diagnostic_coverage={"Algebra", "Geometry"},
        follow_up_coverage={"Algebra"},
        intervention_status="completed",
    )

    assert result["average_change"] == 13.0
    assert result["statement"] == "Performance changed after the intervention period."
    assert "difficulty and participation may differ" in result["comparability_warning"]
    assert result["coverage_differences"] == {"diagnostic_only": ["Geometry"], "follow_up_only": []}
    assert "caused" not in str(result).lower()


def test_readiness_checklist_reports_blockers_and_completed_items():
    from api.services.pilot import build_readiness

    readiness = build_readiness(
        {
            "school_created": True,
            "teacher_added": True,
            "class_created": True,
            "learners_imported": True,
            "topics_configured": True,
            "diagnostic_added": True,
            "marks_entered": False,
            "intervention_recorded": False,
            "follow_up_completed": False,
            "report_generated": False,
        }
    )
    assert readiness["state"] == "Blocked"
    assert readiness["progress_percent"] == 60
    assert "Marks entered" in readiness["blockers"]


def test_permission_matrix_is_least_privilege():
    from api.services.pilot import can

    assert can("owner", "release_controls")
    assert can("pilot_admin", "school_setup")
    assert can("teacher", "marks_write")
    assert can("teacher", "intervention_update")
    assert not can("teacher", "school_setup")
    assert can("viewer", "reports_read")
    assert not can("viewer", "marks_write")
    assert not can("pilot_admin", "release_controls")


def test_audit_summary_redacts_secrets_and_limits_length():
    from api.services.pilot import sanitize_audit_summary

    summary = sanitize_audit_summary(
        "Imported marks token=secret-value password=hunter2 " + ("x" * 600)
    )
    assert "secret-value" not in summary
    assert "hunter2" not in summary
    assert len(summary) <= 240
