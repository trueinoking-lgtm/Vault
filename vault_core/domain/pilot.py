"""Physically isolated domain records for controlled ZimLearnGraph pilots.

Pilot records deliberately use ``pilot_*`` tables.  The seeded demonstration
continues to use ``impact_*`` tables and frontend fixtures, making accidental
cross-mode aggregation structurally difficult rather than convention-based.
"""

from datetime import datetime
from typing import Any, ClassVar, Optional

from vault_core.domain.base import ObjectModel

PILOT_TABLES = frozenset(
    {
        "pilot_workspace",
        "pilot_membership",
        "pilot_class",
        "pilot_learner",
        "pilot_subject",
        "pilot_topic",
        "pilot_assessment",
        "pilot_question",
        "pilot_mark",
        "pilot_import_batch",
        "pilot_intervention",
        "pilot_audit_event",
        "pilot_report",
    }
)


class PilotWorkspace(ObjectModel):
    table_name: ClassVar[str] = "pilot_workspace"
    nullable_fields: ClassVar[set[str]] = {"primary_contact", "district", "province", "school_type"}
    dataset_mode: str = "pilot"
    school_name: str
    district: Optional[str] = None
    province: Optional[str] = None
    school_type: Optional[str] = None
    primary_contact: Optional[str] = None
    academic_year: str
    term: str
    pilot_start_date: datetime
    status: str = "draft"


class PilotMembership(ObjectModel):
    table_name: ClassVar[str] = "pilot_membership"
    workspace_id: str
    user_id: str
    role: str
    assigned_class_ids: list[str] = []
    active: bool = True


class PilotClass(ObjectModel):
    table_name: ClassVar[str] = "pilot_class"
    workspace_id: str
    name: str
    grade_level: Optional[str] = None
    academic_year: str
    teacher_user_id: Optional[str] = None
    active: bool = True


class PilotLearner(ObjectModel):
    table_name: ClassVar[str] = "pilot_learner"
    nullable_fields: ClassVar[set[str]] = {"gender", "support_note"}
    workspace_id: str
    class_id: str
    learner_code: str
    gender: Optional[str] = None
    support_note: Optional[str] = None
    status: str = "active"
    import_batch_id: Optional[str] = None


class PilotSubject(ObjectModel):
    table_name: ClassVar[str] = "pilot_subject"
    workspace_id: str
    name: str


class PilotTopic(ObjectModel):
    table_name: ClassVar[str] = "pilot_topic"
    workspace_id: str
    subject_id: str
    name: str


class PilotAssessment(ObjectModel):
    table_name: ClassVar[str] = "pilot_assessment"
    nullable_fields: ClassVar[set[str]] = {"follow_up_to", "date_written"}
    workspace_id: str
    class_id: str
    subject_id: str
    title: str
    kind: str
    term: str
    date_written: Optional[datetime] = None
    total_marks: float
    pass_mark: float
    follow_up_to: Optional[str] = None
    status: str = "draft"


class PilotQuestion(ObjectModel):
    table_name: ClassVar[str] = "pilot_question"
    workspace_id: str
    assessment_id: str
    question_number: int
    topic_id: str
    label: Optional[str] = None
    max_marks: float


class PilotMark(ObjectModel):
    table_name: ClassVar[str] = "pilot_mark"
    workspace_id: str
    assessment_id: str
    question_id: str
    learner_id: str
    score: float
    corrected: bool = False
    import_batch_id: Optional[str] = None


class PilotImportBatch(ObjectModel):
    table_name: ClassVar[str] = "pilot_import_batch"
    workspace_id: str
    import_type: str
    status: str
    accepted_count: int
    rejected_count: int
    created_by: str


class PilotIntervention(ObjectModel):
    table_name: ClassVar[str] = "pilot_intervention"
    nullable_fields: ClassVar[set[str]] = {"planned_date", "completed_date", "teacher_note"}
    workspace_id: str
    school_label: str
    class_id: str
    subject_id: str
    topic_id: str
    source_assessment_id: str
    recommendation: str
    assigned_teacher_id: str
    planned_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    status: str = "suggested"
    teacher_note: Optional[str] = None
    verification_status: str = "unverified"


class PilotAuditEvent(ObjectModel):
    table_name: ClassVar[str] = "pilot_audit_event"
    workspace_id: str
    actor_id: str
    action: str
    entity_type: str
    entity_id: str
    summary: str


class PilotReport(ObjectModel):
    table_name: ClassVar[str] = "pilot_report"
    workspace_id: str
    diagnostic_assessment_id: str
    follow_up_assessment_id: str
    version: int
    school_review_status: str
    generated_by: str
    snapshot: dict[str, Any]
