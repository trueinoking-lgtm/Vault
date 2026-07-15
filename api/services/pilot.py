"""Business rules for controlled ZimLearnGraph pilot workspaces."""

from __future__ import annotations

import csv
import io
import re
from dataclasses import dataclass, field
from typing import Any, Iterable

ROLE_PERMISSIONS: dict[str, frozenset[str]] = {
    "owner": frozenset({"*"}),
    "pilot_admin": frozenset(
        {
            "school_setup",
            "dashboards_read",
            "assigned_classes_read",
            "members_manage",
            "classes_write",
            "learners_write",
            "assessments_write",
            "marks_write",
            "interventions_write",
            "intervention_update",
            "reports_read",
            "reports_generate",
            "audit_read",
        }
    ),
    "teacher": frozenset(
        {
            "dashboards_read",
            "assigned_classes_read",
            "assessments_write",
            "marks_write",
            "support_indicators_write",
            "intervention_update",
            "reports_read",
        }
    ),
    "viewer": frozenset({"dashboards_read", "reports_read"}),
}


def can(role: str, permission: str) -> bool:
    permissions = ROLE_PERMISSIONS.get(role, frozenset())
    return "*" in permissions or permission in permissions


@dataclass
class PreviewRow:
    row_number: int
    data: dict[str, Any]
    errors: list[str] = field(default_factory=list)

    @property
    def accepted(self) -> bool:
        return not self.errors


@dataclass
class ImportPreview:
    rows: list[PreviewRow]
    errors: list[str] = field(default_factory=list)

    @property
    def accepted_count(self) -> int:
        return sum(row.accepted for row in self.rows) if not self.errors else 0

    @property
    def rejected_count(self) -> int:
        if self.errors:
            return max(1, len(self.rows))
        return sum(not row.accepted for row in self.rows)


_ALLOWED_LEARNER_COLUMNS = {
    "learner_code",
    "class_name",
    "gender",
    "support_note",
    "status",
}
_SENSITIVE_NAME_COLUMNS = {"name", "full_name", "first_name", "last_name", "learner_name"}


def _read_csv(text: str) -> tuple[list[str], list[dict[str, str]]]:
    reader = csv.DictReader(io.StringIO(text.lstrip("\ufeff")))
    headers = [str(value or "").strip() for value in (reader.fieldnames or [])]
    rows = [
        {str(key or "").strip(): str(value or "").strip() for key, value in row.items()}
        for row in reader
    ]
    return headers, rows


def validate_learner_csv(
    text: str,
    *,
    existing_codes: set[str],
    allowed_classes: set[str],
) -> ImportPreview:
    headers, raw_rows = _read_csv(text)
    global_errors: list[str] = []
    lower_headers = {header.lower() for header in headers}
    if not {"learner_code", "class_name"}.issubset(lower_headers):
        global_errors.append("CSV requires learner_code and class_name columns.")
    sensitive = sorted(lower_headers & _SENSITIVE_NAME_COLUMNS)
    if sensitive:
        global_errors.append(
            f"Unsupported sensitive column(s): {', '.join(sensitive)}. Use anonymous learner codes only."
        )
    unsupported = sorted(lower_headers - _ALLOWED_LEARNER_COLUMNS - _SENSITIVE_NAME_COLUMNS)
    if unsupported:
        global_errors.append(f"Unsupported column(s): {', '.join(unsupported)}.")

    seen = set(existing_codes)
    rows: list[PreviewRow] = []
    for index, raw in enumerate(raw_rows, start=2):
        data = {key: value for key, value in raw.items() if key in _ALLOWED_LEARNER_COLUMNS}
        errors: list[str] = []
        code = data.get("learner_code", "").strip()
        class_name = data.get("class_name", "").strip()
        status = data.get("status") or "active"
        data["status"] = status
        if not code:
            errors.append("learner_code is required.")
        elif not re.fullmatch(r"[A-Za-z0-9._-]{1,64}", code):
            errors.append("learner_code must be 1-64 letters, numbers, dots, underscores or hyphens.")
        elif code.casefold() in {value.casefold() for value in seen}:
            errors.append("Duplicate learner code.")
        if not class_name:
            errors.append("class_name is required.")
        elif class_name not in allowed_classes:
            errors.append("class_name does not match this pilot workspace.")
        if status not in {"active", "inactive", "transferred"}:
            errors.append("status must be active, inactive or transferred.")
        if not errors:
            seen.add(code)
        rows.append(PreviewRow(index, data, errors))
    return ImportPreview(rows=rows, errors=global_errors)


def validate_marks_csv(
    text: str,
    *,
    learner_codes: set[str],
    question_maxima: dict[int, float],
    existing_pairs: set[tuple[str, int]],
) -> ImportPreview:
    headers, raw_rows = _read_csv(text)
    errors: list[str] = []
    required = {"learner_code", "question_number", "score"}
    if not required.issubset(set(headers)):
        errors.append("CSV requires learner_code, question_number and score columns.")
    seen = set(existing_pairs)
    rows: list[PreviewRow] = []
    for index, raw in enumerate(raw_rows, start=2):
        data: dict[str, Any] = dict(raw)
        row_errors: list[str] = []
        code = raw.get("learner_code", "").strip()
        try:
            question_number = int(raw.get("question_number", ""))
            data["question_number"] = question_number
        except ValueError:
            question_number = -1
            row_errors.append("question_number must be an integer.")
        score_text = raw.get("score", "").strip()
        if not score_text:
            score = 0.0
            row_errors.append("Score is incomplete.")
        else:
            try:
                score = float(score_text)
                data["score"] = score
            except ValueError:
                score = 0.0
                row_errors.append("score must be numeric.")
        if code not in learner_codes:
            row_errors.append("Unknown learner_code.")
        if question_number not in question_maxima:
            row_errors.append("Unknown question_number.")
        elif score < 0 or score > question_maxima[question_number]:
            row_errors.append(
                f"Score exceeds maximum marks ({question_maxima[question_number]:g}) or is below zero."
            )
        pair = (code, question_number)
        if pair in seen:
            row_errors.append("Duplicate learner/question row; no silent overwrite allowed.")
        if not row_errors:
            seen.add(pair)
        rows.append(PreviewRow(index, data, row_errors))
    return ImportPreview(rows=rows, errors=errors)


def compare_assessment_summaries(
    *,
    diagnostic: dict[str, Any],
    follow_up: dict[str, Any],
    diagnostic_coverage: set[str],
    follow_up_coverage: set[str],
    intervention_status: str,
) -> dict[str, Any]:
    before_topics = diagnostic.get("topics", {})
    after_topics = follow_up.get("topics", {})
    common_topics = sorted(set(before_topics) & set(after_topics))
    return {
        "average_before": diagnostic["average"],
        "average_after": follow_up["average"],
        "average_change": round(follow_up["average"] - diagnostic["average"], 2),
        "pass_rate_before": diagnostic["pass_rate"],
        "pass_rate_after": follow_up["pass_rate"],
        "pass_rate_change": round(follow_up["pass_rate"] - diagnostic["pass_rate"], 2),
        "participation_before": diagnostic["participation"],
        "participation_after": follow_up["participation"],
        "participation_change": follow_up["participation"] - diagnostic["participation"],
        "topic_changes": [
            {
                "topic": topic,
                "before": before_topics[topic],
                "after": after_topics[topic],
                "change": round(after_topics[topic] - before_topics[topic], 2),
            }
            for topic in common_topics
        ],
        "coverage_differences": {
            "diagnostic_only": sorted(diagnostic_coverage - follow_up_coverage),
            "follow_up_only": sorted(follow_up_coverage - diagnostic_coverage),
        },
        "intervention_status": intervention_status,
        "statement": "Performance changed after the intervention period.",
        "comparability_warning": (
            "Results should be reviewed by the teacher because assessment difficulty and participation may differ."
        ),
    }


_READINESS_LABELS = {
    "school_created": "School created",
    "teacher_added": "Teacher added",
    "class_created": "Class created",
    "learners_imported": "Learners imported",
    "topics_configured": "Subject/topics configured",
    "diagnostic_added": "Diagnostic assessment added",
    "marks_entered": "Marks entered",
    "intervention_recorded": "Intervention recorded",
    "follow_up_completed": "Follow-up assessment completed",
    "report_generated": "Report generated",
}


def build_readiness(values: dict[str, bool]) -> dict[str, Any]:
    items = [
        {
            "key": key,
            "label": label,
            "state": "Completed" if values.get(key, False) else "Not started",
        }
        for key, label in _READINESS_LABELS.items()
    ]
    completed = sum(values.get(key, False) for key in _READINESS_LABELS)
    blockers = [item["label"] for item in items if item["state"] != "Completed"]
    if completed == len(items):
        state = "Completed"
    elif completed == 0:
        state = "Not started"
    elif not values.get("marks_entered", False) and completed >= 5:
        state = "Blocked"
    else:
        state = "In progress"
    return {
        "state": state,
        "progress_percent": round((completed / len(items)) * 100),
        "items": items,
        "blockers": blockers,
    }


_SECRET_PATTERN = re.compile(
    r"(?i)\b(token|password|secret|api[_-]?key|authorization)\s*[:=]\s*[^\s,;]+"
)


def sanitize_audit_summary(summary: str) -> str:
    redacted = _SECRET_PATTERN.sub(lambda match: f"{match.group(1)}=[REDACTED]", summary)
    return redacted.strip()[:240]


def csv_text(headers: Iterable[str], rows: Iterable[Iterable[Any]]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows(rows)
    return output.getvalue()
