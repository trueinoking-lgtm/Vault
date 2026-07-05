"""
Tests for school and classroom management API endpoints (Epsilon C1 + C4).

Epsilon C1: basic CRUD (mocked domain models).
Epsilon C4: permission guards added to all endpoints.
"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _make_mock_user(is_global_owner: bool = False, user_id: str = "user:t1"):
    """Build a mock User-like object for permission tests."""
    u = AsyncMock()
    u.id = user_id
    u.is_global_owner = is_global_owner
    u.active = True
    return u


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def client():
    from api.main import app

    return TestClient(app)


@pytest.fixture
def owner_user():
    """Mock global-owner user."""
    return _make_mock_user(is_global_owner=True, user_id="user:owner1")


@pytest.fixture
def non_owner_user():
    """Mock non-owner user."""
    return _make_mock_user(is_global_owner=False, user_id="user:learner1")


# =========================================================================
# Schools — CRUD with permission enforcement
# =========================================================================


class TestCreateSchool:
    """POST /api/schools — global owner only."""

    @patch("api.routers.schools.School")
    @patch("api.routers.schools.get_current_user")
    def test_owner_can_create(self, mock_get_user, mock_school_cls, client, owner_user):
        """Global owner can create a school."""
        mock_get_user.return_value = owner_user

        mock_school = AsyncMock()
        mock_school.id = "school:abc123"
        mock_school.name = "Zimbabwe High School"
        mock_school.slug = "zimbabwe-high"
        mock_school.description = "A test school"
        mock_school.active = True
        mock_school.created = "2026-07-05T12:00:00Z"
        mock_school.updated = "2026-07-05T12:00:00Z"

        mock_school_cls.return_value = mock_school

        response = client.post(
            "/api/schools",
            json={
                "name": "Zimbabwe High School",
                "slug": "zimbabwe-high",
                "description": "A test school",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Zimbabwe High School"
        assert data["active"] is True
        mock_school.save.assert_called_once()

    @patch("api.routers.schools.get_current_user")
    def test_non_owner_cannot_create(self, mock_get_user, client, non_owner_user):
        """Non-owner gets 403 when trying to create a school."""
        mock_get_user.return_value = non_owner_user

        response = client.post(
            "/api/schools",
            json={"name": "Fail", "slug": "fail"},
        )

        assert response.status_code == 403

    @patch("api.routers.schools.get_current_user")
    def test_unauthenticated_user_cannot_create(self, mock_get_user, client):
        """No user (None from get_current_user) gets 401."""
        mock_get_user.return_value = None

        response = client.post(
            "/api/schools",
            json={"name": "Fail", "slug": "fail"},
        )

        assert response.status_code == 401

    @patch("api.routers.schools.School")
    @patch("api.routers.schools.get_current_user")
    def test_returns_500_on_error(self, mock_get_user, mock_school_cls, client, owner_user):
        """On unexpected error, returns 500."""
        mock_get_user.return_value = owner_user
        mock_school_cls.return_value.save.side_effect = RuntimeError("DB fail")

        response = client.post(
            "/api/schools",
            json={"name": "Fail", "slug": "fail"},
        )

        assert response.status_code == 500


class TestListSchools:
    """GET /api/schools — global owner only."""

    @patch("api.routers.schools.School")
    @patch("api.routers.schools.get_current_user")
    def test_owner_can_list(self, mock_get_user, mock_school_cls, client, owner_user):
        """Global owner can list all schools."""
        mock_get_user.return_value = owner_user

        mock_school1 = AsyncMock()
        mock_school1.id = "school:a"
        mock_school1.name = "Alpha"
        mock_school1.slug = "alpha"
        mock_school1.description = None
        mock_school1.active = True
        mock_school1.created = "2026-07-05T12:00:00Z"
        mock_school1.updated = "2026-07-05T12:00:00Z"

        mock_school_cls.get_all = AsyncMock(return_value=[mock_school1])

        response = client.get("/api/schools")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Alpha"

    @patch("api.routers.schools.get_current_user")
    def test_non_owner_cannot_list(self, mock_get_user, client, non_owner_user):
        """Non-owner gets 403."""
        mock_get_user.return_value = non_owner_user

        response = client.get("/api/schools")
        assert response.status_code == 403


class TestGetSchool:
    """GET /api/schools/{school_id} — global owner or school member."""

    @patch("api.routers.schools.School")
    @patch("api.routers.schools.check_school_role")
    @patch("api.routers.schools.get_current_user")
    def test_owner_can_get(
        self, mock_get_user, mock_check_role, mock_school_cls, client, owner_user
    ):
        """Global owner can get any school."""
        mock_get_user.return_value = owner_user

        mock_school = AsyncMock()
        mock_school.id = "school:abc123"
        mock_school.name = "Test School"
        mock_school.slug = "test"
        mock_school.description = "Desc"
        mock_school.active = True
        mock_school.created = "2026-07-05T12:00:00Z"
        mock_school.updated = "2026-07-05T12:00:00Z"

        mock_school_cls.get = AsyncMock(return_value=mock_school)

        response = client.get("/api/schools/abc123")

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test School"

    @patch("api.routers.schools.School")
    @patch("api.routers.schools.check_school_role")
    @patch("api.routers.schools.get_current_user")
    def test_returns_404_for_missing(
        self, mock_get_user, mock_check_role, mock_school_cls, client, owner_user
    ):
        """When school not found, returns 404."""
        from vault_core.exceptions import NotFoundError

        mock_get_user.return_value = owner_user
        mock_school_cls.get.side_effect = NotFoundError("not found")

        response = client.get("/api/schools/nonexistent")
        assert response.status_code == 404


class TestUpdateSchool:
    """PATCH /api/schools/{school_id} — global owner or school owner."""

    @patch("api.routers.schools.School")
    @patch("api.routers.schools.check_school_role")
    @patch("api.routers.schools.get_current_user")
    def test_owner_can_update(
        self, mock_get_user, mock_check_role, mock_school_cls, client, owner_user
    ):
        """Global owner can update a school."""
        mock_get_user.return_value = owner_user

        mock_school = AsyncMock()
        mock_school.id = "school:abc"
        mock_school.name = "Old Name"
        mock_school.slug = "old"
        mock_school.description = "Old desc"
        mock_school.active = True
        mock_school.created = "2026-07-05T12:00:00Z"
        mock_school.updated = "2026-07-05T12:00:00Z"

        mock_school_cls.get = AsyncMock(return_value=mock_school)

        response = client.patch(
            "/api/schools/abc",
            json={"name": "New Name"},
        )

        assert response.status_code == 200
        assert mock_school.name == "New Name"
        mock_school.save.assert_called_once()

    @patch("api.routers.schools.check_school_role")
    @patch("api.routers.schools.get_current_user")
    def test_returns_404_for_missing(
        self, mock_get_user, mock_check_role, client, owner_user
    ):
        """When school not found, returns 404."""
        from vault_core.exceptions import NotFoundError

        mock_get_user.return_value = owner_user
        # Make the update handler's School.get raise NotFoundError
        with patch("api.routers.schools.School.get") as mock_get:
            mock_get.side_effect = NotFoundError("not found")
            response = client.patch(
                "/api/schools/nonexistent",
                json={"name": "Nope"},
            )

        assert response.status_code == 404


# =========================================================================
# Permissions — school-level role enforcement
# =========================================================================


class TestSchoolPermissions:
    """Permission denial scenarios for school/class endpoints."""

    @patch("api.routers.schools.get_current_user")
    def test_unauthenticated_gets_401_list_schools(self, mock_get_user, client):
        """No user set → 401 on GET /api/schools."""
        mock_get_user.return_value = None
        response = client.get("/api/schools")
        assert response.status_code == 401

    @patch("api.routers.schools.get_current_user")
    def test_unauthenticated_gets_401_get_school(self, mock_get_user, client):
        """No user set → 401 on GET /api/schools/{id}."""
        mock_get_user.return_value = None
        response = client.get("/api/schools/abc")
        assert response.status_code == 401

    @patch("api.permissions.repo_query")
    @patch("api.routers.schools.get_current_user")
    def test_non_member_gets_403_get_school(self, mock_get_user, mock_query, client, non_owner_user):
        """Authenticated but non-member gets 403.

        Unit-style permission test — must not reach the database.
        """
        mock_get_user.return_value = non_owner_user
        mock_query.return_value = []  # no membership → check_school_role raises 403
        # check_school_role will raise 403 because the user has no membership
        response = client.get("/api/schools/some-school")
        assert response.status_code == 403

    @patch("api.routers.schools.check_school_role")
    @patch("api.routers.schools.get_current_user")
    def test_school_owner_can_update(
        self, mock_get_user, mock_check_role, client
    ):
        """School owner (not global owner) can update their school."""
        school_owner = _make_mock_user(is_global_owner=False, user_id="user:so1")
        mock_get_user.return_value = school_owner
        # check_school_role("owner") passes → check returns mock membership
        mock_check_role.return_value = AsyncMock()

        with patch("api.routers.schools.School") as mock_cls:
            mock_school = AsyncMock()
            mock_school.id = "school:abc"
            mock_school.name = "My School"
            mock_school.slug = "my-school"
            mock_school.description = None
            mock_school.active = True
            mock_school.created = "2026-07-05T12:00:00Z"
            mock_school.updated = "2026-07-05T12:00:00Z"
            mock_cls.get = AsyncMock(return_value=mock_school)

            response = client.patch(
                "/api/schools/abc",
                json={"name": "Updated"},
            )

        assert response.status_code == 200
        assert mock_school.name == "Updated"


# =========================================================================
# Memberships
# =========================================================================


class TestCreateMembership:
    """POST /api/schools/{school_id}/members — school owner only."""

    @patch("api.routers.schools.SchoolMembership")
    @patch("api.routers.schools.check_school_role")
    @patch("api.routers.schools.get_current_user")
    def test_owner_can_create(
        self, mock_get_user, mock_check_role, mock_mem_cls, client, owner_user
    ):
        """Global owner can add a member."""
        mock_get_user.return_value = owner_user
        mock_mem = AsyncMock()
        mock_mem.id = "school_membership:m1"
        mock_mem.school_id = "school:abc"
        mock_mem.user_id = "user:u1"
        mock_mem.role = "teacher"
        mock_mem.active = True
        mock_mem.joined_at = "2026-07-05T12:00:00Z"
        mock_mem_cls.return_value = mock_mem

        response = client.post(
            "/api/schools/abc/members",
            json={"user_id": "u1", "role": "teacher"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["role"] == "teacher"

    @patch("api.permissions.repo_query")
    @patch("api.routers.schools.get_current_user")
    def test_non_owner_cannot_create(self, mock_get_user, mock_query, client, non_owner_user):
        """Non-owner gets 403.

        Unit-style permission test — must not reach the database.
        """
        mock_get_user.return_value = non_owner_user
        mock_query.return_value = []  # no membership → check_school_role raises 403

        response = client.post(
            "/api/schools/abc/members",
            json={"user_id": "u1", "role": "teacher"},
        )

        assert response.status_code == 403


class TestListMemberships:
    """GET /api/schools/{school_id}/members — school owner only."""

    @patch("api.routers.schools.check_school_role")
    @patch("api.routers.schools.repo_query")
    @patch("api.routers.schools.get_current_user")
    def test_owner_can_list(
        self, mock_get_user, mock_query, mock_check_role, client, owner_user
    ):
        """Global owner can list members."""
        mock_get_user.return_value = owner_user
        mock_query.return_value = [
            {"id": "school_membership:m1", "school_id": "school:abc",
             "user_id": "user:u1", "role": "teacher", "active": True,
             "joined_at": "2026-07-05T12:00:00Z"}
        ]

        response = client.get("/api/schools/abc/members")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["role"] == "teacher"


class TestUpdateMembership:
    """PATCH /api/schools/{school_id}/members/{membership_id} — school owner."""

    @patch("api.routers.schools.check_membership_belongs_to_school")
    @patch("api.routers.schools.check_school_role")
    @patch("api.routers.schools.get_current_user")
    def test_owner_can_update(
        self, mock_get_user, mock_check_role, mock_check_belongs, client, owner_user
    ):
        """Global owner can update membership."""
        mock_get_user.return_value = owner_user
        mock_mem = AsyncMock()
        mock_mem.id = "school_membership:m1"
        mock_mem.school_id = "school:abc"
        mock_mem.user_id = "user:u1"
        mock_mem.role = "teacher"
        mock_mem.active = True
        mock_check_belongs.return_value = mock_mem

        response = client.patch(
            "/api/schools/abc/members/m1",
            json={"role": "learner"},
        )

        assert response.status_code == 200
        assert mock_mem.role == "learner"
        mock_mem.save.assert_called_once()


# =========================================================================
# Classrooms
# =========================================================================


class TestCreateClassroom:
    """POST /api/schools/{school_id}/classrooms — school owner or teacher."""

    @patch("api.routers.schools.Classroom")
    @patch("api.routers.schools.check_school_role")
    @patch("api.routers.schools.get_current_user")
    def test_owner_can_create(
        self, mock_get_user, mock_check_role, mock_cls_cls, client, owner_user
    ):
        """Global owner can create a classroom."""
        mock_get_user.return_value = owner_user
        mock_cls = AsyncMock()
        mock_cls.id = "classroom:c1"
        mock_cls.school_id = "school:abc"
        mock_cls.teacher_id = "school_membership:t1"
        mock_cls.name = "Form 4A Mathematics"
        mock_cls.description = None
        mock_cls.subject = "Mathematics"
        mock_cls.grade_level = "Form 4"
        mock_cls.active = True
        mock_cls.created = "2026-07-05T12:00:00Z"
        mock_cls.updated = "2026-07-05T12:00:00Z"
        mock_cls_cls.return_value = mock_cls

        response = client.post(
            "/api/schools/abc/classrooms",
            json={"teacher_id": "t1", "name": "Form 4A Mathematics",
                  "subject": "Mathematics", "grade_level": "Form 4"},
        )

        assert response.status_code == 200
        assert response.json()["name"] == "Form 4A Mathematics"


class TestGetClassroom:
    """GET /api/classrooms/{classroom_id} — school member."""

    @patch("api.routers.schools.Classroom")
    @patch("api.routers.schools.check_classroom_access")
    @patch("api.routers.schools.get_current_user")
    def test_owner_can_get(
        self, mock_get_user, mock_access, mock_cls_cls, client, owner_user
    ):
        """Global owner can get a classroom."""
        mock_get_user.return_value = owner_user
        mock_cls = AsyncMock()
        mock_cls.id = "classroom:c1"
        mock_cls.school_id = "school:abc"
        mock_cls.teacher_id = "school_membership:t1"
        mock_cls.name = "Form 4A"
        mock_cls.description = None
        mock_cls.subject = "Math"
        mock_cls.grade_level = "Form 4"
        mock_cls.active = True
        mock_cls.created = "2026-07-05T12:00:00Z"
        mock_cls.updated = "2026-07-05T12:00:00Z"

        mock_cls_cls.get = AsyncMock(return_value=mock_cls)

        response = client.get("/api/classrooms/c1")

        assert response.status_code == 200
        assert response.json()["name"] == "Form 4A"


class TestUpdateClassroom:
    """PATCH /api/classrooms/{classroom_id} — school owner or classroom teacher."""

    @patch("api.routers.schools.check_classroom_access")
    @patch("api.routers.schools.get_current_user")
    def test_teacher_can_update(
        self, mock_get_user, mock_access, client
    ):
        """Classroom teacher can update their classroom."""
        teacher_user = _make_mock_user(is_global_owner=False, user_id="user:t1")
        mock_get_user.return_value = teacher_user
        # check_classroom_access("teacher") passes
        mock_classroom = AsyncMock()
        mock_classroom.id = "classroom:c1"
        mock_classroom.school_id = "school:abc"
        mock_classroom.teacher_id = "school_membership:t1"
        mock_classroom.name = "Old Name"
        mock_classroom.description = None
        mock_classroom.subject = "Math"
        mock_classroom.grade_level = "Form 4"
        mock_classroom.active = True
        mock_classroom.created = "2026-07-05T12:00:00Z"
        mock_classroom.updated = "2026-07-05T12:00:00Z"
        mock_access.return_value = mock_classroom

        response = client.patch(
            "/api/classrooms/c1",
            json={"name": "New Name"},
        )

        assert response.status_code == 200
        assert mock_classroom.name == "New Name"
        mock_classroom.save.assert_called_once()


# =========================================================================
# Enrollments
# =========================================================================


class TestCreateEnrollment:
    """POST /api/classrooms/{classroom_id}/enrollments — teacher."""

    @patch("api.routers.schools.ClassEnrollment")
    @patch("api.routers.schools.check_classroom_access")
    @patch("api.routers.schools.get_current_user")
    def test_teacher_can_create(
        self, mock_get_user, mock_access, mock_enr_cls, client, owner_user
    ):
        """Global owner can enroll a learner."""
        mock_get_user.return_value = owner_user

        mock_enr = AsyncMock()
        mock_enr.id = "class_enrollment:e1"
        mock_enr.classroom_id = "classroom:c1"
        mock_enr.learner_id = "school_membership:l1"
        mock_enr.enrolled_at = "2026-07-05T12:00:00Z"
        mock_enr.active = True
        mock_enr_cls.return_value = mock_enr

        response = client.post(
            "/api/classrooms/c1/enrollments",
            json={"learner_id": "l1"},
        )

        assert response.status_code == 200
        assert response.json()["learner_id"] == "l1"


class TestListEnrollments:
    """GET /api/classrooms/{classroom_id}/enrollments — teacher."""

    @patch("api.routers.schools.check_classroom_access")
    @patch("api.routers.schools.repo_query")
    @patch("api.routers.schools.get_current_user")
    def test_teacher_can_list(
        self, mock_get_user, mock_query, mock_access, client, owner_user
    ):
        """Global owner can list enrollments."""
        mock_get_user.return_value = owner_user
        mock_query.return_value = [
            {"id": "class_enrollment:e1", "classroom_id": "classroom:c1",
             "learner_id": "school_membership:l1",
             "enrolled_at": "2026-07-05T12:00:00Z", "active": True}
        ]

        response = client.get("/api/classrooms/c1/enrollments")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["learner_id"] == "l1"


class TestDeactivateEnrollment:
    """DELETE /api/classrooms/{classroom_id}/enrollments/{id} — teacher."""

    @patch("api.routers.schools.ClassEnrollment")
    @patch("api.routers.schools.check_classroom_access")
    @patch("api.routers.schools.get_current_user")
    def test_owner_can_deactivate(
        self, mock_get_user, mock_access, mock_enr_cls, client, owner_user
    ):
        """Global owner can deactivate enrollment."""
        mock_get_user.return_value = owner_user

        mock_enr = AsyncMock()
        mock_enr.id = "class_enrollment:e1"
        mock_enr.classroom_id = "classroom:c1"
        mock_enr.learner_id = "school_membership:l1"
        mock_enr.enrolled_at = "2026-07-05T12:00:00Z"
        mock_enr.active = True
        mock_enr_cls.get = AsyncMock(return_value=mock_enr)

        response = client.delete("/api/classrooms/c1/enrollments/e1")

        assert response.status_code == 200
        assert mock_enr.active is False
        mock_enr.save.assert_called_once()

    @patch("api.routers.schools.ClassEnrollment")
    @patch("api.routers.schools.check_classroom_access")
    @patch("api.routers.schools.get_current_user")
    def test_returns_404_for_missing(
        self, mock_get_user, mock_access, mock_enr_cls, client, owner_user
    ):
        """When enrollment not found, returns 404."""
        from vault_core.exceptions import NotFoundError

        mock_get_user.return_value = owner_user
        mock_enr_cls.get.side_effect = NotFoundError("not found")

        response = client.delete("/api/classrooms/c1/enrollments/nonexistent")

        assert response.status_code == 404


# =========================================================================
# Assignments
# =========================================================================


class TestCreateAssignment:
    """POST /api/classrooms/{classroom_id}/assignments — teacher."""

    @patch("api.routers.schools.ClassroomAssignment")
    @patch("api.routers.schools.check_classroom_access")
    @patch("api.routers.schools.get_current_user")
    def test_owner_can_create(
        self, mock_get_user, mock_access, mock_assn_cls, client, owner_user
    ):
        """Global owner can create assignment."""
        mock_get_user.return_value = owner_user

        mock_assn = AsyncMock()
        mock_assn.id = "classroom_assignment:a1"
        mock_assn.classroom_id = "classroom:c1"
        mock_assn.notebook_id = None
        mock_assn.target_type = "material"
        mock_assn.target_id = "source:s1"
        mock_assn.title = "Read Chapter 1"
        mock_assn.instructions = None
        mock_assn.due_at = None
        mock_assn.assigned_by = "school_membership:t1"
        mock_assn.assigned_at = "2026-07-05T12:00:00Z"
        mock_assn.archived_at = None
        mock_assn.active = True
        mock_assn_cls.return_value = mock_assn

        response = client.post(
            "/api/classrooms/c1/assignments",
            json={"target_type": "material", "target_id": "source:s1", "title": "Read Chapter 1", "assigned_by": "t1"},
        )

        assert response.status_code == 200
        assert response.json()["target_type"] == "material"


class TestListAssignments:
    """GET /api/classrooms/{classroom_id}/assignments — school member."""

    @patch("api.routers.schools.check_classroom_access")
    @patch("api.routers.schools.repo_query")
    @patch("api.routers.schools.get_current_user")
    def test_owner_can_list(
        self, mock_get_user, mock_query, mock_access, client, owner_user
    ):
        """Global owner can list assignments."""
        mock_get_user.return_value = owner_user
        mock_query.return_value = [
            {"id": "classroom_assignment:a1", "classroom_id": "classroom:c1",
             "notebook_id": None, "target_type": "material", "target_id": "source:s1",
             "title": "Read", "instructions": None, "due_at": None,
             "assigned_by": "school_membership:t1",
             "assigned_at": "2026-07-05T12:00:00Z", "archived_at": None, "active": True}
        ]

        response = client.get("/api/classrooms/c1/assignments")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["target_type"] == "material"


class TestDeactivateAssignment:
    """DELETE /api/classrooms/{classroom_id}/assignments/{id} — teacher."""

    @patch("api.routers.schools.ClassroomAssignment")
    @patch("api.routers.schools.check_classroom_access")
    @patch("api.routers.schools.get_current_user")
    def test_owner_can_deactivate(
        self, mock_get_user, mock_access, mock_assn_cls, client, owner_user
    ):
        """Global owner can deactivate assignment."""
        mock_get_user.return_value = owner_user

        mock_assn = AsyncMock()
        mock_assn.id = "classroom_assignment:a1"
        mock_assn.classroom_id = "classroom:c1"
        mock_assn.notebook_id = None
        mock_assn.target_type = "material"
        mock_assn.target_id = "source:s1"
        mock_assn.title = "Read"
        mock_assn.instructions = None
        mock_assn.due_at = None
        mock_assn.assigned_by = "school_membership:t1"
        mock_assn.assigned_at = "2026-07-05T12:00:00Z"
        mock_assn.archived_at = None
        mock_assn.active = True
        mock_assn_cls.get = AsyncMock(return_value=mock_assn)

        response = client.delete("/api/classrooms/c1/assignments/a1")

        assert response.status_code == 200
        assert mock_assn.active is False

    @patch("api.routers.schools.ClassroomAssignment")
    @patch("api.routers.schools.check_classroom_access")
    @patch("api.routers.schools.get_current_user")
    def test_returns_404_for_missing(
        self, mock_get_user, mock_access, mock_assn_cls, client, owner_user
    ):
        """When assignment not found, returns 404."""
        from vault_core.exceptions import NotFoundError

        mock_get_user.return_value = owner_user
        mock_assn_cls.get.side_effect = NotFoundError("not found")

        response = client.delete("/api/classrooms/c1/assignments/nonexistent")

        assert response.status_code == 404
