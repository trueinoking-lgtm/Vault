"""
Domain models for school, classroom, and enrollment primitives.

Epsilon B — dormant until Epsilon C+ wires API/UI.
Single-tenant mode is unaffected; all these tables remain empty
until school management is activated.
"""

from datetime import datetime
from typing import ClassVar, Optional

from vault_core.domain.base import ObjectModel


class School(ObjectModel):
    """A school or deploying organisation."""

    table_name: ClassVar[str] = "school"
    nullable_fields: ClassVar[set[str]] = {"description", "settings"}
    name: str
    slug: str
    description: Optional[str] = None
    settings: Optional[dict] = None
    active: bool = True

    def __repr__(self) -> str:
        return f"School(id={self.id}, name={self.name}, slug={self.slug})"


class SchoolMembership(ObjectModel):
    """Links a user to a school with a specific role."""

    table_name: ClassVar[str] = "school_membership"
    school_id: str
    user_id: str
    role: str  # "owner" | "teacher" | "learner"
    joined_at: Optional[datetime] = None
    active: bool = True

    def __repr__(self) -> str:
        return (
            f"SchoolMembership(id={self.id}, school={self.school_id}, "
            f"user={self.user_id}, role={self.role})"
        )


class Classroom(ObjectModel):
    """A teaching group within a school, owned by a teacher."""

    table_name: ClassVar[str] = "classroom"
    nullable_fields: ClassVar[set[str]] = {"description", "subject", "grade_level"}
    school_id: str
    teacher_id: str
    name: str
    description: Optional[str] = None
    subject: Optional[str] = None
    grade_level: Optional[str] = None
    active: bool = True

    def __repr__(self) -> str:
        return f"Classroom(id={self.id}, name={self.name}, school={self.school_id})"


class ClassEnrollment(ObjectModel):
    """Links a learner membership to a classroom."""

    table_name: ClassVar[str] = "class_enrollment"
    classroom_id: str
    learner_id: str
    enrolled_at: Optional[datetime] = None
    active: bool = True

    def __repr__(self) -> str:
        return (
            f"ClassEnrollment(id={self.id}, classroom={self.classroom_id}, "
            f"learner={self.learner_id})"
        )


class ClassroomAssignment(ObjectModel):
    """Links a notebook to a classroom (teacher-assigned material)."""

    table_name: ClassVar[str] = "classroom_assignment"
    classroom_id: str
    notebook_id: str
    assigned_by: str
    assigned_at: Optional[datetime] = None
    active: bool = True

    def __repr__(self) -> str:
        return (
            f"ClassroomAssignment(id={self.id}, classroom={self.classroom_id}, "
            f"notebook={self.notebook_id})"
        )


class AuthSession(ObjectModel):
    """Authentication session token. Dormant — not wired into current auth."""

    table_name: ClassVar[str] = "auth_session"
    user_id: str
    token_hash: str
    expires_at: datetime

    def __repr__(self) -> str:
        return f"AuthSession(id={self.id}, user={self.user_id})"
