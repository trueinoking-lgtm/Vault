"""
Tests for school and classroom management API endpoints (Epsilon C1).

Uses mocked domain models following the pattern from test_study_api.py.
No tenancy enforcement; no auth-wiring tested here.
"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from api.main import app

    return TestClient(app)


# =========================================================================
# Schools
# =========================================================================


class TestCreateSchool:
    """POST /api/schools"""

    @patch("api.routers.schools.School")
    def test_creates_school(self, mock_school_cls, client):
        """Create a school with all fields."""
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
        assert data["slug"] == "zimbabwe-high"
        assert data["description"] == "A test school"
        assert data["active"] is True
        mock_school.save.assert_called_once()

    @patch("api.routers.schools.School")
    def test_creates_minimal_school(self, mock_school_cls, client):
        """Create a school with only required fields."""
        mock_school = AsyncMock()
        mock_school.id = "school:min"
        mock_school.name = "Minimal"
        mock_school.slug = "min"
        mock_school.description = None
        mock_school.active = True
        mock_school.created = "2026-07-05T12:00:00Z"
        mock_school.updated = "2026-07-05T12:00:00Z"

        mock_school_cls.return_value = mock_school

        response = client.post(
            "/api/schools",
            json={"name": "Minimal", "slug": "min"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Minimal"
        assert data["slug"] == "min"
        assert data["description"] is None

    @patch("api.routers.schools.School")
    def test_returns_500_on_error(self, mock_school_cls, client):
        """On unexpected error, returns 500."""
        mock_school_cls.return_value.save.side_effect = RuntimeError("DB fail")

        response = client.post(
            "/api/schools",
            json={"name": "Fail", "slug": "fail"},
        )

        assert response.status_code == 500


class TestListSchools:
    """GET /api/schools"""

    @patch("api.routers.schools.School")
    def test_lists_schools(self, mock_school_cls, client):
        """List all schools."""
        mock_school1 = AsyncMock()
        mock_school1.id = "school:a"
        mock_school1.name = "Alpha"
        mock_school1.slug = "alpha"
        mock_school1.description = None
        mock_school1.active = True
        mock_school1.created = "2026-07-05T12:00:00Z"
        mock_school1.updated = "2026-07-05T12:00:00Z"

        mock_school2 = AsyncMock()
        mock_school2.id = "school:b"
        mock_school2.name = "Beta"
        mock_school2.slug = "beta"
        mock_school2.description = "Second"
        mock_school2.active = True
        mock_school2.created = "2026-07-05T12:00:00Z"
        mock_school2.updated = "2026-07-05T12:00:00Z"

        mock_school_cls.get_all = AsyncMock(return_value=[mock_school1, mock_school2])

        response = client.get("/api/schools")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["name"] == "Alpha"
        assert data[1]["slug"] == "beta"

    @patch("api.routers.schools.School")
    def test_filters_by_active(self, mock_school_cls, client):
        """Filter schools by active status."""
        mock_active = AsyncMock()
        mock_active.id = "school:a"
        mock_active.name = "Active"
        mock_active.slug = "active"
        mock_active.description = None
        mock_active.active = True
        mock_active.created = "2026-07-05T12:00:00Z"
        mock_active.updated = "2026-07-05T12:00:00Z"

        mock_school_cls.get_all = AsyncMock(return_value=[mock_active])

        response = client.get("/api/schools?active=true")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Active"

    @patch("api.routers.schools.School")
    def test_returns_500_on_error(self, mock_school_cls, client):
        """On unexpected error, returns 500."""
        mock_school_cls.get_all.side_effect = RuntimeError("DB fail")

        response = client.get("/api/schools")

        assert response.status_code == 500


class TestGetSchool:
    """GET /api/schools/{school_id}"""

    @patch("api.routers.schools.School")
    def test_gets_school(self, mock_school_cls, client):
        """Get a school by ID."""
        mock_school = AsyncMock()
        mock_school.id = "school:abc123"
        mock_school.name = "Test School"
        mock_school.slug = "test-school"
        mock_school.description = "Desc"
        mock_school.active = True
        mock_school.created = "2026-07-05T12:00:00Z"
        mock_school.updated = "2026-07-05T12:00:00Z"

        mock_school_cls.get = AsyncMock(return_value=mock_school)

        response = client.get("/api/schools/abc123")

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test School"
        mock_school_cls.get.assert_called_once_with("school:abc123")

    @patch("api.routers.schools.School")
    def test_returns_404_for_missing(self, mock_school_cls, client):
        """When school not found, returns 404."""
        from vault_core.exceptions import NotFoundError

        mock_school_cls.get.side_effect = NotFoundError("not found")

        response = client.get("/api/schools/nonexistent")

        assert response.status_code == 404


class TestUpdateSchool:
    """PATCH /api/schools/{school_id}"""

    @patch("api.routers.schools.School")
    def test_updates_school(self, mock_school_cls, client):
        """Update school fields."""
        mock_school = AsyncMock()
        mock_school.id = "school:abc"
        mock_school.name = "Old Name"
        mock_school.slug = "old-slug"
        mock_school.description = "Old desc"
        mock_school.active = True
        mock_school.created = "2026-07-05T12:00:00Z"
        mock_school.updated = "2026-07-05T12:00:00Z"

        mock_school_cls.get = AsyncMock(return_value=mock_school)

        response = client.patch(
            "/api/schools/abc",
            json={"name": "New Name", "description": "New desc"},
        )

        assert response.status_code == 200
        assert mock_school.name == "New Name"
        assert mock_school.description == "New desc"
        mock_school.save.assert_called_once()

    @patch("api.routers.schools.School")
    def test_deactivates_school(self, mock_school_cls, client):
        """Soft-deactivate a school."""
        mock_school = AsyncMock()
        mock_school.id = "school:abc"
        mock_school.name = "School"
        mock_school.slug = "school"
        mock_school.description = None
        mock_school.active = True
        mock_school.created = "2026-07-05T12:00:00Z"
        mock_school.updated = "2026-07-05T12:00:00Z"

        mock_school_cls.get = AsyncMock(return_value=mock_school)

        response = client.patch(
            "/api/schools/abc",
            json={"active": False},
        )

        assert response.status_code == 200
        assert mock_school.active is False
        mock_school.save.assert_called_once()

    @patch("api.routers.schools.School")
    def test_returns_404_for_missing(self, mock_school_cls, client):
        """When school not found, returns 404."""
        from vault_core.exceptions import NotFoundError

        mock_school_cls.get.side_effect = NotFoundError("not found")

        response = client.patch(
            "/api/schools/nonexistent",
            json={"name": "Nope"},
        )

        assert response.status_code == 404


# =========================================================================
# Memberships
# =========================================================================


class TestCreateMembership:
    """POST /api/schools/{school_id}/members"""

    @patch("api.routers.schools.SchoolMembership")
    def test_creates_membership(self, mock_mem_cls, client):
        """Add a teacher member to a school."""
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
        assert data["user_id"] == "u1"
        mock_mem.save.assert_called_once()

    @patch("api.routers.schools.SchoolMembership")
    def test_rejects_invalid_role(self, mock_mem_cls, client):
        """Invalid role returns 400."""
        response = client.post(
            "/api/schools/abc/members",
            json={"user_id": "u1", "role": "invalid-role"},
        )

        assert response.status_code == 422  # Pydantic validation


class TestListMemberships:
    """GET /api/schools/{school_id}/members"""

    @patch("api.routers.schools.repo_query")
    def test_lists_memberships(self, mock_query, client):
        """List members of a school."""
        mock_query.return_value = [
            {
                "id": "school_membership:m1",
                "school_id": "school:abc",
                "user_id": "user:u1",
                "role": "teacher",
                "active": True,
                "joined_at": "2026-07-05T12:00:00Z",
            },
            {
                "id": "school_membership:m2",
                "school_id": "school:abc",
                "user_id": "user:u2",
                "role": "learner",
                "active": True,
                "joined_at": "2026-07-05T13:00:00Z",
            },
        ]

        response = client.get("/api/schools/abc/members")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["role"] == "teacher"
        assert data[1]["user_id"] == "u2"

    @patch("api.routers.schools.repo_query")
    def test_filters_by_role(self, mock_query, client):
        """Filter memberships by role."""
        mock_query.return_value = [
            {
                "id": "school_membership:m1",
                "school_id": "school:abc",
                "user_id": "user:u1",
                "role": "teacher",
                "active": True,
                "joined_at": "2026-07-05T12:00:00Z",
            }
        ]

        response = client.get("/api/schools/abc/members?role=teacher")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["role"] == "teacher"


class TestUpdateMembership:
    """PATCH /api/schools/{school_id}/members/{membership_id}"""

    @patch("api.routers.schools.SchoolMembership")
    def test_updates_role(self, mock_mem_cls, client):
        """Change a member's role."""
        mock_mem = AsyncMock()
        mock_mem.id = "school_membership:m1"
        mock_mem.school_id = "school:abc"
        mock_mem.user_id = "user:u1"
        mock_mem.role = "teacher"
        mock_mem.active = True

        mock_mem_cls.get = AsyncMock(return_value=mock_mem)

        response = client.patch(
            "/api/schools/abc/members/m1",
            json={"role": "learner"},
        )

        assert response.status_code == 200
        assert mock_mem.role == "learner"
        mock_mem.save.assert_called_once()

    @patch("api.routers.schools.SchoolMembership")
    def test_deactivates_membership(self, mock_mem_cls, client):
        """Soft-deactivate a membership."""
        mock_mem = AsyncMock()
        mock_mem.id = "school_membership:m1"
        mock_mem.school_id = "school:abc"
        mock_mem.user_id = "user:u1"
        mock_mem.role = "learner"
        mock_mem.active = True

        mock_mem_cls.get = AsyncMock(return_value=mock_mem)

        response = client.patch(
            "/api/schools/abc/members/m1",
            json={"active": False},
        )

        assert response.status_code == 200
        assert mock_mem.active is False
        mock_mem.save.assert_called_once()


# =========================================================================
# Classrooms
# =========================================================================


class TestCreateClassroom:
    """POST /api/schools/{school_id}/classrooms"""

    @patch("api.routers.schools.Classroom")
    def test_creates_classroom(self, mock_cls_cls, client):
        """Create a classroom within a school."""
        mock_cls = AsyncMock()
        mock_cls.id = "classroom:c1"
        mock_cls.school_id = "school:abc"
        mock_cls.teacher_id = "school_membership:t1"
        mock_cls.name = "Form 4A Mathematics"
        mock_cls.description = "Math class"
        mock_cls.subject = "Mathematics"
        mock_cls.grade_level = "Form 4"
        mock_cls.active = True
        mock_cls.created = "2026-07-05T12:00:00Z"
        mock_cls.updated = "2026-07-05T12:00:00Z"

        mock_cls_cls.return_value = mock_cls

        response = client.post(
            "/api/schools/abc/classrooms",
            json={
                "teacher_id": "t1",
                "name": "Form 4A Mathematics",
                "subject": "Mathematics",
                "grade_level": "Form 4",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Form 4A Mathematics"
        assert data["subject"] == "Mathematics"
        mock_cls.save.assert_called_once()


class TestListClassrooms:
    """GET /api/schools/{school_id}/classrooms"""

    @patch("api.routers.schools.repo_query")
    def test_lists_classrooms(self, mock_query, client):
        """List classrooms in a school."""
        mock_query.return_value = [
            {
                "id": "classroom:c1",
                "school_id": "school:abc",
                "teacher_id": "school_membership:t1",
                "name": "Form 4A",
                "description": None,
                "subject": "Math",
                "grade_level": "Form 4",
                "active": True,
                "created": "2026-07-05T12:00:00Z",
                "updated": "2026-07-05T12:00:00Z",
            }
        ]

        response = client.get("/api/schools/abc/classrooms")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Form 4A"
        assert data[0]["school_id"] == "abc"


class TestGetClassroom:
    """GET /api/classrooms/{classroom_id}"""

    @patch("api.routers.schools.Classroom")
    def test_gets_classroom(self, mock_cls_cls, client):
        """Get a classroom by ID."""
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
        data = response.json()
        assert data["name"] == "Form 4A"
        mock_cls_cls.get.assert_called_once_with("classroom:c1")

    @patch("api.routers.schools.Classroom")
    def test_returns_404_for_missing(self, mock_cls_cls, client):
        """When classroom not found, returns 404."""
        from vault_core.exceptions import NotFoundError

        mock_cls_cls.get.side_effect = NotFoundError("not found")

        response = client.get("/api/classrooms/nonexistent")

        assert response.status_code == 404


class TestUpdateClassroom:
    """PATCH /api/classrooms/{classroom_id}"""

    @patch("api.routers.schools.Classroom")
    def test_updates_classroom(self, mock_cls_cls, client):
        """Update classroom fields."""
        mock_cls = AsyncMock()
        mock_cls.id = "classroom:c1"
        mock_cls.school_id = "school:abc"
        mock_cls.teacher_id = "school_membership:t1"
        mock_cls.name = "Old Name"
        mock_cls.description = None
        mock_cls.subject = "Math"
        mock_cls.grade_level = "Form 4"
        mock_cls.active = True
        mock_cls.created = "2026-07-05T12:00:00Z"
        mock_cls.updated = "2026-07-05T12:00:00Z"

        mock_cls_cls.get = AsyncMock(return_value=mock_cls)

        response = client.patch(
            "/api/classrooms/c1",
            json={"name": "New Name"},
        )

        assert response.status_code == 200
        assert mock_cls.name == "New Name"
        mock_cls.save.assert_called_once()

    @patch("api.routers.schools.Classroom")
    def test_deactivates_classroom(self, mock_cls_cls, client):
        """Soft-deactivate a classroom."""
        mock_cls = AsyncMock()
        mock_cls.id = "classroom:c1"
        mock_cls.school_id = "school:abc"
        mock_cls.teacher_id = "school_membership:t1"
        mock_cls.name = "Class"
        mock_cls.description = None
        mock_cls.subject = None
        mock_cls.grade_level = None
        mock_cls.active = True
        mock_cls.created = "2026-07-05T12:00:00Z"
        mock_cls.updated = "2026-07-05T12:00:00Z"

        mock_cls_cls.get = AsyncMock(return_value=mock_cls)

        response = client.patch(
            "/api/classrooms/c1",
            json={"active": False},
        )

        assert response.status_code == 200
        assert mock_cls.active is False


# =========================================================================
# Enrollments
# =========================================================================


class TestCreateEnrollment:
    """POST /api/classrooms/{classroom_id}/enrollments"""

    @patch("api.routers.schools.ClassEnrollment")
    def test_creates_enrollment(self, mock_enr_cls, client):
        """Enroll a learner in a classroom."""
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
        data = response.json()
        assert data["learner_id"] == "l1"
        mock_enr.save.assert_called_once()


class TestListEnrollments:
    """GET /api/classrooms/{classroom_id}/enrollments"""

    @patch("api.routers.schools.repo_query")
    def test_lists_enrollments(self, mock_query, client):
        """List enrollments for a classroom."""
        mock_query.return_value = [
            {
                "id": "class_enrollment:e1",
                "classroom_id": "classroom:c1",
                "learner_id": "school_membership:l1",
                "enrolled_at": "2026-07-05T12:00:00Z",
                "active": True,
            }
        ]

        response = client.get("/api/classrooms/c1/enrollments")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["learner_id"] == "l1"


class TestDeactivateEnrollment:
    """DELETE /api/classrooms/{classroom_id}/enrollments/{enrollment_id}"""

    @patch("api.routers.schools.ClassEnrollment")
    def test_deactivates_enrollment(self, mock_enr_cls, client):
        """Soft-deactivate an enrollment."""
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
    def test_returns_404_for_missing(self, mock_enr_cls, client):
        """When enrollment not found, returns 404."""
        from vault_core.exceptions import NotFoundError

        mock_enr_cls.get.side_effect = NotFoundError("not found")

        response = client.delete("/api/classrooms/c1/enrollments/nonexistent")

        assert response.status_code == 404


# =========================================================================
# Assignments
# =========================================================================


class TestCreateAssignment:
    """POST /api/classrooms/{classroom_id}/assignments"""

    @patch("api.routers.schools.ClassroomAssignment")
    def test_creates_assignment(self, mock_assn_cls, client):
        """Assign a notebook to a classroom."""
        mock_assn = AsyncMock()
        mock_assn.id = "classroom_assignment:a1"
        mock_assn.classroom_id = "classroom:c1"
        mock_assn.notebook_id = "notebook:n1"
        mock_assn.assigned_by = "school_membership:t1"
        mock_assn.assigned_at = "2026-07-05T12:00:00Z"
        mock_assn.active = True

        mock_assn_cls.return_value = mock_assn

        response = client.post(
            "/api/classrooms/c1/assignments",
            json={"notebook_id": "n1", "assigned_by": "t1"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["notebook_id"] == "n1"
        assert data["assigned_by"] == "t1"
        mock_assn.save.assert_called_once()


class TestListAssignments:
    """GET /api/classrooms/{classroom_id}/assignments"""

    @patch("api.routers.schools.repo_query")
    def test_lists_assignments(self, mock_query, client):
        """List assignments for a classroom."""
        mock_query.return_value = [
            {
                "id": "classroom_assignment:a1",
                "classroom_id": "classroom:c1",
                "notebook_id": "notebook:n1",
                "assigned_by": "school_membership:t1",
                "assigned_at": "2026-07-05T12:00:00Z",
                "active": True,
            }
        ]

        response = client.get("/api/classrooms/c1/assignments")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["notebook_id"] == "n1"


class TestDeactivateAssignment:
    """DELETE /api/classrooms/{classroom_id}/assignments/{assignment_id}"""

    @patch("api.routers.schools.ClassroomAssignment")
    def test_deactivates_assignment(self, mock_assn_cls, client):
        """Soft-deactivate an assignment."""
        mock_assn = AsyncMock()
        mock_assn.id = "classroom_assignment:a1"
        mock_assn.classroom_id = "classroom:c1"
        mock_assn.notebook_id = "notebook:n1"
        mock_assn.assigned_by = "school_membership:t1"
        mock_assn.assigned_at = "2026-07-05T12:00:00Z"
        mock_assn.active = True

        mock_assn_cls.get = AsyncMock(return_value=mock_assn)

        response = client.delete("/api/classrooms/c1/assignments/a1")

        assert response.status_code == 200
        assert mock_assn.active is False
        mock_assn.save.assert_called_once()

    @patch("api.routers.schools.ClassroomAssignment")
    def test_returns_404_for_missing(self, mock_assn_cls, client):
        """When assignment not found, returns 404."""
        from vault_core.exceptions import NotFoundError

        mock_assn_cls.get.side_effect = NotFoundError("not found")

        response = client.delete("/api/classrooms/c1/assignments/nonexistent")

        assert response.status_code == 404
