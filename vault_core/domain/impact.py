"""
Domain models for Impact Intelligence — assessment analytics and interventions.

Phase 1 — adds backend primitives for assessment intelligence
(schools, classes, learners, subjects, topics, assessments, questions,
mark entries, and interventions).

Single-tenant mode is unaffected; these tables remain empty until
school management is activated.
"""

from datetime import datetime
from typing import ClassVar, Optional

from vault_core.domain.base import ObjectModel


class ImpactSchool(ObjectModel):
    """A school or deploying organisation for Impact Intelligence."""

    table_name: ClassVar[str] = "impact_school"
    nullable_fields: ClassVar[set[str]] = {"district", "province", "school_type"}
    name: str
    district: Optional[str] = None
    province: Optional[str] = None
    school_type: Optional[str] = None  # "primary" | "secondary" | "tertiary"
    active: bool = True

    def __repr__(self) -> str:
        return f"ImpactSchool(id={self.id}, name={self.name})"


class ImpactClassGroup(ObjectModel):
    """A teaching group within a school, owned by a teacher."""

    table_name: ClassVar[str] = "impact_class_group"
    nullable_fields: ClassVar[set[str]] = {"teacher_name", "academic_year"}
    school_id: str
    name: str
    grade_level: Optional[str] = None
    academic_year: Optional[str] = None  # e.g. "2026"
    teacher_name: Optional[str] = None
    active: bool = True

    def __repr__(self) -> str:
        return f"ImpactClassGroup(id={self.id}, name={self.name}, school={self.school_id})"


class ImpactLearner(ObjectModel):
    """A learner enrolled in a class group."""

    table_name: ClassVar[str] = "impact_learner"
    nullable_fields: ClassVar[set[str]] = {"display_name"}
    school_id: str
    class_group_id: str
    learner_code: str  # school-assigned identifier
    display_name: Optional[str] = None
    status: str = "active"  # "active" | "inactive" | "transferred"

    def __repr__(self) -> str:
        return (
            f"ImpactLearner(id={self.id}, code={self.learner_code}, "
            f"class={self.class_group_id})"
        )


class ImpactSubject(ObjectModel):
    """A subject offered in the curriculum."""

    table_name: ClassVar[str] = "impact_subject"
    nullable_fields: ClassVar[set[str]] = {"level", "curriculum"}
    name: str
    level: Optional[str] = None  # e.g. "O-Level", "A-Level"
    curriculum: Optional[str] = None  # e.g. "ZIMSEC", "Cambridge"

    def __repr__(self) -> str:
        return f"ImpactSubject(id={self.id}, name={self.name})"


class ImpactTopic(ObjectModel):
    """A topic within a subject."""

    table_name: ClassVar[str] = "impact_topic"
    nullable_fields: ClassVar[set[str]] = {"strand", "syllabus_code"}
    subject_id: str
    name: str
    strand: Optional[str] = None
    syllabus_code: Optional[str] = None

    def __repr__(self) -> str:
        return f"ImpactTopic(id={self.id}, name={self.name}, subject={self.subject_id})"


class ImpactAssessment(ObjectModel):
    """An assessment (test, exam, quiz) for a class group."""

    table_name: ClassVar[str] = "impact_assessment"
    nullable_fields: ClassVar[set[str]] = {
        "term",
        "date_written",
        "pass_mark",
    }
    school_id: str
    class_group_id: str
    subject_id: str
    title: str
    assessment_type: str  # "test" | "exam" | "quiz" | "assignment"
    term: Optional[str] = None  # e.g. "Term 1"
    date_written: Optional[datetime] = None
    total_marks: int
    pass_mark: Optional[int] = None
    status: str = "draft"  # "draft" | "published" | "graded"

    def __repr__(self) -> str:
        return (
            f"ImpactAssessment(id={self.id}, title={self.title}, "
            f"type={self.assessment_type})"
        )


class ImpactAssessmentQuestion(ObjectModel):
    """A question within an assessment."""

    table_name: ClassVar[str] = "impact_assessment_question"
    nullable_fields: ClassVar[set[str]] = {"label", "difficulty", "topic_id"}
    assessment_id: str
    question_number: int
    label: Optional[str] = None  # e.g. "Q1", "Multiple Choice"
    max_marks: int
    topic_id: Optional[str] = None
    skill_type: str  # "knowledge" | "comprehension" | "application" | "analysis"
    difficulty: Optional[str] = None  # "easy" | "medium" | "hard"

    def __repr__(self) -> str:
        return (
            f"ImpactAssessmentQuestion(id={self.id}, "
            f"question={self.question_number}, assessment={self.assessment_id})"
        )


class ImpactMarkEntry(ObjectModel):
    """A mark entry for a learner on a specific question."""

    table_name: ClassVar[str] = "impact_mark_entry"
    assessment_id: str
    question_id: str
    learner_id: str
    score: float
    max_score: float

    def __repr__(self) -> str:
        return (
            f"ImpactMarkEntry(id={self.id}, score={self.score}, "
            f"learner={self.learner_id})"
        )


class ImpactIntervention(ObjectModel):
    """A recommended intervention based on assessment performance."""

    table_name: ClassVar[str] = "impact_intervention"
    nullable_fields: ClassVar[set[str]] = {"recommendation"}
    assessment_id: str
    class_group_id: str
    topic_id: str
    severity: str  # "low" | "medium" | "high" | "critical"
    recommendation: Optional[str] = None
    status: str = "pending"  # "pending" | "in_progress" | "completed" | "dismissed"

    def __repr__(self) -> str:
        return (
            f"ImpactIntervention(id={self.id}, severity={self.severity}, "
            f"topic={self.topic_id})"
        )
