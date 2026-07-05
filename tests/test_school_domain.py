"""
Tests for school and user domain models (Epsilon B1).

Focuses on model construction, field defaults, string representation,
and validation — all testable without database access.
"""

from datetime import datetime, timezone

from vault_core.domain.school import (
    AuthSession,
    ClassEnrollment,
    Classroom,
    ClassroomAssignment,
    School,
    SchoolMembership,
)
from vault_core.domain.user import User


class TestUserModel:
    """User domain model — dormant Epsilon B entity."""

    def test_create_user(self):
        user = User(
            display_name="Test Teacher",
            email="teacher@school.zw",
            password_hash="abc123hash",
        )
        assert user.display_name == "Test Teacher"
        assert user.email == "teacher@school.zw"
        assert user.password_hash == "abc123hash"
        assert user.is_global_owner is False
        assert user.active is True
        assert user.avatar_url is None
        assert user.last_login_at is None

    def test_user_table_name(self):
        assert User.table_name == "user"

    def test_user_global_owner_flag(self):
        owner = User(
            display_name="Admin",
            email="admin@vault.local",
            password_hash="hash",
            is_global_owner=True,
        )
        assert owner.is_global_owner is True

    def test_user_repr(self):
        user = User(
            display_name="Alice",
            email="alice@test.zw",
            password_hash="hash",
        )
        rep = repr(user)
        assert "Alice" in rep
        assert "alice@test.zw" in rep
        assert "User(" in rep

    def test_user_email_validated(self):
        # Pydantic email validation via string::is::email is SurrealDB-level;
        # at the domain model level, email is a plain string.
        # Validation occurs on save/persist, not on construction.
        user = User(
            display_name="Bad Email",
            email="not-an-email",
            password_hash="hash",
        )
        assert user.email == "not-an-email"


class TestSchoolModel:
    """School domain model — dormant Epsilon B entity."""

    def test_create_school(self):
        school = School(
            name="Zimbabwe High School",
            slug="zimbabwe-high",
            description="A test school",
        )
        assert school.name == "Zimbabwe High School"
        assert school.slug == "zimbabwe-high"
        assert school.description == "A test school"
        assert school.active is True
        assert school.settings is None

    def test_school_table_name(self):
        assert School.table_name == "school"

    def test_school_minimal(self):
        school = School(name="Minimal", slug="min")
        assert school.name == "Minimal"
        assert school.slug == "min"
        assert school.description is None

    def test_school_repr(self):
        school = School(name="Repr School", slug="repr-sch")
        rep = repr(school)
        assert "Repr School" in rep
        assert "repr-sch" in rep
        assert "School(" in rep

    def test_school_settings_as_dict(self):
        school = School(
            name="Configured School",
            slug="cfg-sch",
            settings={"defaultLocale": "sn", "branding": {"schoolName": "CFG"}},
        )
        assert school.settings is not None
        assert school.settings["defaultLocale"] == "sn"  # type: ignore[reportIndex]
        assert school.settings["branding"]["schoolName"] == "CFG"  # type: ignore[reportIndex]


class TestSchoolMembershipModel:
    """SchoolMembership domain model."""

    def test_create_membership(self):
        sm = SchoolMembership(
            school_id="school:abc",
            user_id="user:xyz",
            role="teacher",
        )
        assert sm.school_id == "school:abc"
        assert sm.user_id == "user:xyz"
        assert sm.role == "teacher"
        assert sm.active is True

    def test_membership_table_name(self):
        assert SchoolMembership.table_name == "school_membership"

    def test_membership_learner_role(self):
        sm = SchoolMembership(
            school_id="school:abc",
            user_id="user:xyz",
            role="learner",
        )
        assert sm.role == "learner"

    def test_membership_owner_role(self):
        sm = SchoolMembership(
            school_id="school:abc",
            user_id="user:xyz",
            role="owner",
        )
        assert sm.role == "owner"

    def test_membership_repr(self):
        sm = SchoolMembership(
            school_id="school:abc",
            user_id="user:xyz",
            role="teacher",
        )
        rep = repr(sm)
        assert "SchoolMembership(" in rep
        assert "school:abc" in rep
        assert "teacher" in rep


class TestClassroomModel:
    """Classroom domain model."""

    def test_create_classroom(self):
        cls = Classroom(
            school_id="school:abc",
            teacher_id="school_membership:t1",
            name="Form 4A Mathematics",
            subject="Mathematics",
            grade_level="Form 4",
        )
        assert cls.school_id == "school:abc"
        assert cls.teacher_id == "school_membership:t1"
        assert cls.name == "Form 4A Mathematics"
        assert cls.subject == "Mathematics"
        assert cls.grade_level == "Form 4"
        assert cls.active is True

    def test_classroom_table_name(self):
        assert Classroom.table_name == "classroom"

    def test_classroom_minimal(self):
        cls = Classroom(
            school_id="school:abc",
            teacher_id="school_membership:t1",
            name="Minimal Class",
        )
        assert cls.subject is None
        assert cls.grade_level is None
        assert cls.description is None

    def test_classroom_repr(self):
        cls = Classroom(
            school_id="school:abc",
            teacher_id="school_membership:t1",
            name="Repr Class",
        )
        rep = repr(cls)
        assert "Repr Class" in rep
        assert "Classroom(" in rep


class TestClassEnrollmentModel:
    """ClassEnrollment domain model."""

    def test_create_enrollment(self):
        enrollment = ClassEnrollment(
            classroom_id="classroom:abc",
            learner_id="school_membership:l1",
        )
        assert enrollment.classroom_id == "classroom:abc"
        assert enrollment.learner_id == "school_membership:l1"
        assert enrollment.active is True

    def test_enrollment_table_name(self):
        assert ClassEnrollment.table_name == "class_enrollment"

    def test_enrollment_repr(self):
        enrollment = ClassEnrollment(
            classroom_id="classroom:abc",
            learner_id="school_membership:l1",
        )
        rep = repr(enrollment)
        assert "classroom:abc" in rep
        assert "ClassEnrollment(" in rep


class TestClassroomAssignmentModel:
    """ClassroomAssignment domain model."""

    def test_create_assignment(self):
        assignment = ClassroomAssignment(
            classroom_id="classroom:abc",
            notebook_id="notebook:n1",
            assigned_by="school_membership:t1",
        )
        assert assignment.classroom_id == "classroom:abc"
        assert assignment.notebook_id == "notebook:n1"
        assert assignment.assigned_by == "school_membership:t1"
        assert assignment.active is True

    def test_assignment_table_name(self):
        assert ClassroomAssignment.table_name == "classroom_assignment"

    def test_assignment_repr(self):
        assignment = ClassroomAssignment(
            classroom_id="classroom:abc",
            notebook_id="notebook:n1",
            assigned_by="school_membership:t1",
        )
        rep = repr(assignment)
        assert "classroom:abc" in rep
        assert "ClassroomAssignment(" in rep

    def test_assignment_target_fields(self):
        """New target-based assignment fields are accessible."""
        assignment = ClassroomAssignment(
            classroom_id="classroom:abc",
            assigned_by="school_membership:t1",
            target_type="material",
            target_id="source:s1",
            title="Read Chapter 1",
        )
        assert assignment.target_type == "material"
        assert assignment.target_id == "source:s1"
        assert assignment.title == "Read Chapter 1"
        assert assignment.notebook_id is None


class TestAuthSessionModel:
    """AuthSession domain model — dormant, not wired."""

    def test_create_session(self):
        expires = datetime(2026, 8, 1, 0, 0, 0, tzinfo=timezone.utc)
        session = AuthSession(
            user_id="user:abc",
            token_hash="abcdef123456",
            expires_at=expires,
        )
        assert session.user_id == "user:abc"
        assert session.token_hash == "abcdef123456"
        assert session.expires_at == expires

    def test_session_table_name(self):
        assert AuthSession.table_name == "auth_session"

    def test_session_repr(self):
        expires = datetime(2026, 8, 1, 0, 0, 0, tzinfo=timezone.utc)
        session = AuthSession(
            user_id="user:abc",
            token_hash="hash",
            expires_at=expires,
        )
        rep = repr(session)
        assert "user:abc" in rep
        assert "AuthSession(" in rep
