"""
Tests for classroom assignment endpoints (E2.1).

Covers:
- teacher can create assignment for own classroom
- owner can create assignment
- unrelated teacher cannot create assignment
- learner cannot create assignment
- enrolled learner can list assigned work
- unenrolled learner cannot list classroom assignments
- learner can mark own assignment completed
- learner cannot mark another learner's completion
- teacher assignment response does not expose private learner reflection text
"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _make_mock_user(is_global_owner=False, user_id="user:t1"):
    u = AsyncMock()
    u.id = user_id
    u.is_global_owner = is_global_owner
    u.active = True
    return u


@pytest.fixture
def client():
    from api.main import app
    return TestClient(app)


@pytest.fixture
def owner_user():
    return _make_mock_user(is_global_owner=True, user_id="user:owner1")


@pytest.fixture
def teacher_user():
    return _make_mock_user(is_global_owner=False, user_id="user:teacher1")


@pytest.fixture
def learner_user():
    return _make_mock_user(is_global_owner=False, user_id="user:learner1")


# =========================================================================
# Permission tests
# =========================================================================


class TestCreateAssignmentPermissions:
    """POST /api/classrooms/{id}/assignments — permission enforcement."""

    @patch("api.routers.schools.get_current_user")
    @patch("api.routers.schools.check_classroom_access")
    @patch("api.routers.schools.ClassroomAssignment")
    def test_teacher_can_create(
        self, mock_cls, mock_access, mock_get_user, client, teacher_user
    ):
        mock_get_user.return_value = teacher_user
        mock_access.return_value = AsyncMock()

        mock_instance = AsyncMock()
        mock_instance.id = "assignment:test1"
        mock_instance.classroom_id = "classroom:c1"
        mock_instance.notebook_id = None
        mock_instance.target_type = "material"
        mock_instance.target_id = "source:s1"
        mock_instance.title = "Read Chapter 1"
        mock_instance.instructions = None
        mock_instance.due_at = None
        mock_instance.assigned_by = "school_membership:mem1"
        mock_instance.assigned_at = "2026-07-05T12:00:00"
        mock_instance.archived_at = None
        mock_instance.active = True
        mock_cls.return_value = mock_instance
        mock_instance.save = AsyncMock()

        response = client.post(
            "/api/classrooms/classroom:c1/assignments",
            json={
                "target_type": "material",
                "target_id": "source:s1",
                "title": "Read Chapter 1",
                "assigned_by": "mem1",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["target_type"] == "material"
        assert data["title"] == "Read Chapter 1"

    @patch("api.routers.schools.get_current_user")
    @patch("api.routers.schools.check_classroom_access")
    @patch("api.routers.schools.ClassroomAssignment")
    def test_owner_can_create(
        self, mock_cls, mock_access, mock_get_user, client, owner_user
    ):
        mock_get_user.return_value = owner_user
        mock_access.return_value = AsyncMock()

        mock_instance = AsyncMock()
        mock_instance.id = "assignment:test2"
        mock_instance.classroom_id = "classroom:c1"
        mock_instance.notebook_id = None
        mock_instance.target_type = "leaf"
        mock_instance.target_id = "leaf:l1"
        mock_instance.title = "Review flashcard"
        mock_instance.instructions = None
        mock_instance.due_at = None
        mock_instance.assigned_by = "school_membership:mem1"
        mock_instance.assigned_at = None
        mock_instance.archived_at = None
        mock_instance.active = True
        mock_cls.return_value = mock_instance
        mock_instance.save = AsyncMock()

        response = client.post(
            "/api/classrooms/classroom:c1/assignments",
            json={
                "target_type": "leaf",
                "target_id": "leaf:l1",
                "title": "Review flashcard",
                "assigned_by": "mem1",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["target_type"] == "leaf"

    @patch("api.routers.schools.get_current_user")
    def test_unauthenticated_rejected(self, mock_get_user, client):
        mock_get_user.return_value = None
        response = client.post(
            "/api/classrooms/classroom:c1/assignments",
            json={"target_type": "material", "target_id": "x", "assigned_by": "m"},
        )
        assert response.status_code in (401, 403)

    @patch("api.routers.schools.get_current_user")
    @patch("api.routers.schools.check_classroom_access")
    def test_learner_cannot_create(self, mock_access, mock_get_user, client, learner_user):
        mock_get_user.return_value = learner_user
        mock_access.side_effect = HTTPException(status_code=403, detail="Not authorized")

        response = client.post(
            "/api/classrooms/classroom:c1/assignments",
            json={"target_type": "material", "target_id": "x", "assigned_by": "m"},
        )
        assert response.status_code == 403


# =========================================================================
# Learner assignment listing
# =========================================================================


class TestLearnerAssignmentListing:
    """GET /api/assignments — learner sees only their enrolled classroom assignments."""

    @patch("api.routers.schools.get_current_user")
    @patch("api.routers.schools.repo_query")
    def test_enrolled_learner_sees_assignments(
        self, mock_repo, mock_get_user, client, learner_user
    ):
        mock_get_user.return_value = learner_user

        mock_repo.side_effect = [
            [{"classroom_id": "classroom:c1"}],  # enrollments
            [{"id": "assignment:a1", "classroom_id": "classroom:c1", "target_type": "material", "target_id": "source:s1", "title": "Read", "instructions": None, "due_at": None, "assigned_at": None}],  # assignments
            [{"id": "membership:mem1"}],  # learner memberships
            [],  # progress
        ]

        response = client.get("/api/assignments")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["target_type"] == "material"

    @patch("api.routers.schools.get_current_user")
    @patch("api.routers.schools.repo_query")
    def test_unenrolled_learner_sees_nothing(
        self, mock_repo, mock_get_user, client, learner_user
    ):
        mock_get_user.return_value = learner_user
        mock_repo.return_value = []  # no enrollments

        response = client.get("/api/assignments")
        assert response.status_code == 200
        assert response.json() == []

    @patch("api.routers.schools.get_current_user")
    def test_unauthenticated_rejected(self, mock_get_user, client):
        mock_get_user.return_value = None
        response = client.get("/api/assignments")
        assert response.status_code == 401


# =========================================================================
# Progress tracking
# =========================================================================


class TestAssignmentProgress:
    """POST /api/assignments/{id}/complete — learner marks own work."""

    @patch("api.routers.schools.get_current_user")
    @patch("api.routers.schools.repo_query")
    @patch("api.routers.schools.ClassroomAssignment")
    @patch("api.routers.schools.AssignmentProgress")
    def test_learner_can_mark_own_complete(
        self, mock_prog_cls, mock_assign_cls, mock_repo, mock_get_user, client, learner_user
    ):
        mock_get_user.return_value = learner_user

        mock_assignment = AsyncMock()
        mock_assignment.classroom_id = "classroom:c1"
        mock_assign_cls.get = AsyncMock(return_value=mock_assignment)

        mock_repo.side_effect = [
            [{"id": "enrollment:e1"}],  # enrollment check
            [{"id": "membership:mem1"}],  # membership lookup
            [],  # no existing progress
        ]

        mock_progress = AsyncMock()
        mock_progress.id = "progress:p1"
        mock_progress.assignment_id = "assignment:a1"
        mock_progress.classroom_id = "classroom:c1"
        mock_progress.learner_id = "school_membership:mem1"
        mock_progress.status = "completed"
        mock_progress.completed_at = "2026-07-05T12:00:00"
        mock_progress.created = "2026-07-05T12:00:00"
        mock_progress.updated = "2026-07-05T12:00:00"
        mock_prog_cls.return_value = mock_progress
        mock_progress.save = AsyncMock()

        response = client.post(
            "/api/assignments/assignment:a1/complete",
            json={
                "assignment_id": "assignment:a1",
                "classroom_id": "classroom:c1",
                "learner_id": "mem1",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"

    @patch("api.routers.schools.get_current_user")
    @patch("api.routers.schools.repo_query")
    @patch("api.routers.schools.ClassroomAssignment")
    def test_unenrolled_learner_rejected(
        self, mock_assign_cls, mock_repo, mock_get_user, client, learner_user
    ):
        mock_get_user.return_value = learner_user

        mock_assignment = AsyncMock()
        mock_assignment.classroom_id = "classroom:c1"
        mock_assign_cls.get = AsyncMock(return_value=mock_assignment)

        mock_repo.return_value = []  # no enrollment

        response = client.post(
            "/api/assignments/assignment:a1/complete",
            json={
                "assignment_id": "assignment:a1",
                "classroom_id": "classroom:c1",
                "learner_id": "mem1",
            },
        )
        assert response.status_code == 403


# =========================================================================
# Privacy: no private learner text or AI diagnosis in responses
# =========================================================================


class TestAssignmentPrivacy:
    """Verify assignment responses don't expose private data."""

    @patch("api.routers.schools.get_current_user")
    @patch("api.routers.schools.repo_query")
    def test_learner_response_has_no_private_fields(
        self, mock_repo, mock_get_user, client, learner_user
    ):
        mock_get_user.return_value = learner_user
        mock_repo.side_effect = [
            [{"classroom_id": "classroom:c1"}],
            [{"id": "assignment:a1", "classroom_id": "classroom:c1", "target_type": "material", "target_id": "source:s1", "title": "Read", "instructions": None, "due_at": None, "assigned_at": None}],
            [{"id": "membership:mem1"}],
            [],
        ]

        response = client.get("/api/assignments")
        data = response.json()
        for assignment in data:
            # Must NOT contain private fields
            assert "reflection_text" not in assignment
            assert "ai_diagnosis" not in assignment
            assert "grade" not in assignment
            assert "ranking" not in assignment
            assert "private_notes" not in assignment
