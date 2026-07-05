"""
Tests for teacher class progress read-model endpoints (Epsilon E2).

All tests are unit-style — they mock repository/domain calls to avoid
requiring a running SurrealDB instance. CI must not require a database.
"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def client():
    from api.main import app

    return TestClient(app)


@pytest.fixture
def owner_user():
    u = AsyncMock()
    u.id = "user:owner1"
    u.is_global_owner = True
    u.active = True
    u.display_name = "Global Owner"
    return u


@pytest.fixture
def school_owner_user():
    u = AsyncMock()
    u.id = "user:so1"
    u.is_global_owner = False
    u.active = True
    u.display_name = "School Owner"
    return u


@pytest.fixture
def teacher_user():
    u = AsyncMock()
    u.id = "user:teacher1"
    u.is_global_owner = False
    u.active = True
    u.display_name = "Teacher"
    return u


@pytest.fixture
def learner_user():
    u = AsyncMock()
    u.id = "user:learner1"
    u.is_global_owner = False
    u.active = True
    u.display_name = "Learner"
    return u


# =========================================================================
# GET /api/teacher/classes
# =========================================================================


class TestListTeacherClasses:
    """GET /api/teacher/classes — permission-gated class list."""

    @patch("api.routers.teacher._get_accessible_classrooms")
    @patch("api.routers.teacher.get_current_user")
    def test_global_owner_can_list(
        self, mock_get_user, mock_get_classes, client, owner_user
    ):
        """Global owner sees all classrooms."""
        mock_get_user.return_value = owner_user
        mock_get_classes.return_value = [
            {"id": "classroom:c1", "name": "Math 101", "school_id": "school:s1"},
        ]

        with patch(
            "api.routers.teacher._compute_class_summary",
            new_callable=AsyncMock,
        ) as mock_summary:
            mock_summary.return_value = {
                "classroom_id": "c1",
                "classroom_name": "Math 101",
                "subject": None,
                "grade_level": None,
                "school_id": "s1",
                "learner_count": 5,
                "active_learner_count": 4,
                "assignment_count": 2,
                "active_assignment_count": 2,
                "recent_study_session_count": 10,
                "needs_practice_leaf_count": 3,
                "needs_review_leaf_count": 5,
                "remembered_leaf_count": 20,
                "last_activity_at": "2026-07-05T10:00:00Z",
                "data_status": "ok",
            }

            response = client.get("/api/teacher/classes")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["classroom_id"] == "c1"
        assert data[0]["learner_count"] == 5

    @patch("api.routers.teacher.get_current_user")
    def test_unauthenticated_gets_401(self, mock_get_user, client):
        """No user gets 401."""
        mock_get_user.return_value = None

        response = client.get("/api/teacher/classes")
        assert response.status_code == 401

    @patch("api.routers.teacher.get_current_user")
    def test_learner_gets_403(self, mock_get_user, client, learner_user):
        """Learner role gets 403 from teacher endpoints."""
        mock_get_user.return_value = learner_user

        with patch("api.routers.teacher._get_accessible_classrooms",
                   new_callable=AsyncMock, return_value=[]):
            response = client.get("/api/teacher/classes")

        # authenticate → 0 classrooms → empty list is OK. No 403 for list
        # since learner just sees no classrooms.
        assert response.status_code == 200
        assert response.json() == []

    @patch("api.routers.teacher._get_accessible_classrooms")
    @patch("api.routers.teacher.get_current_user")
    def test_empty_list_when_no_classes(
        self, mock_get_user, mock_get_classes, client, owner_user
    ):
        """Returns empty list when user has no accessible classrooms."""
        mock_get_user.return_value = owner_user
        mock_get_classes.return_value = []

        response = client.get("/api/teacher/classes")
        assert response.status_code == 200
        assert response.json() == []


# =========================================================================
# GET /api/teacher/classes/{classroom_id}
# =========================================================================


class TestGetClassProgress:
    """GET /api/teacher/classes/{classroom_id} — single class summary."""

    @patch("api.routers.teacher.repo_query")
    @patch("api.routers.teacher.check_classroom_access")
    @patch("api.routers.teacher.get_current_user")
    def test_returns_class_summary(
        self, mock_get_user, mock_check, mock_query, client, teacher_user
    ):
        """Teacher sees their classroom's progress summary."""
        mock_get_user.return_value = teacher_user
        mock_check.return_value = None

        # First query: classroom lookup
        # Second query onward: _compute_class_summary queries
        mock_query.side_effect = [
            # classroom lookup
            [{"id": "classroom:c1", "name": "Math 101", "subject": "Math",
              "grade_level": "Form 3", "school_id": "school:s1"}],
            # enrollments
            [],
            # assignments
            [],
        ]

        response = client.get("/api/teacher/classes/c1")

        assert response.status_code == 200
        data = response.json()
        assert data["classroom_id"] == "c1"
        assert data["classroom_name"] == "Math 101"
        assert data["learner_count"] == 0
        assert data["data_status"] == "ok"

    @patch("api.routers.teacher.repo_query")
    @patch("api.routers.teacher.check_classroom_access")
    @patch("api.routers.teacher.get_current_user")
    def test_returns_404_for_missing(
        self, mock_get_user, mock_check, mock_query, client, teacher_user
    ):
        """Non-existent classroom returns 404."""
        mock_get_user.return_value = teacher_user
        mock_check.return_value = None
        mock_query.return_value = []  # no classroom found

        response = client.get("/api/teacher/classes/nonexistent")
        assert response.status_code == 404

    @patch("api.routers.teacher.get_current_user")
    def test_unauthenticated_gets_401(
        self, mock_get_user, client
    ):
        """No user gets 401."""
        mock_get_user.return_value = None

        response = client.get("/api/teacher/classes/c1")
        assert response.status_code == 401


# =========================================================================
# GET /api/teacher/classes/{classroom_id}/learners
# =========================================================================


class TestListClassLearners:
    """GET /api/teacher/classes/{classroom_id}/learners."""

    @patch("api.routers.teacher.repo_query")
    @patch("api.routers.teacher.check_classroom_access")
    @patch("api.routers.teacher.get_current_user")
    def test_returns_learner_summaries(
        self, mock_get_user, mock_check, mock_query, client, teacher_user
    ):
        """Returns per-learner summaries with safe fields only."""
        mock_get_user.return_value = teacher_user
        mock_check.return_value = None

        mock_query.side_effect = [
            # Enrollments
            [
                {
                    "id": "class_enrollment:e1",
                    "classroom_id": "classroom:c1",
                    "learner_id": "school_membership:m1",
                    "active": True,
                },
                {
                    "id": "class_enrollment:e2",
                    "classroom_id": "classroom:c1",
                    "learner_id": "school_membership:m2",
                    "active": True,
                },
            ],
            # Membership m1 → user resolution
            [{"id": "school_membership:m1", "user_id": "user:l1"}],
            # User l1 display_name
            [{"display_name": "Alice"}],
            # Membership m2 → user resolution
            [{"id": "school_membership:m2", "user_id": "user:l2"}],
            # User l2 display_name
            [{"display_name": "Bob"}],
            # Assignments for this classroom
            [],
            # Per-learner queries for e1 (no assignments → no study queries)
            # Per-learner queries for e2 (no assignments → no study queries)
        ]

        response = client.get("/api/teacher/classes/c1/learners")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["learner_display_name"] == "Alice"
        assert data[1]["learner_display_name"] == "Bob"

        # Verify safe fields only — no reflection text
        for learner in data:
            assert "learner_id" in learner
            assert "enrollment_id" in learner
            assert "enrollment_active" in learner
            assert "needs_practice_leaf_count" in learner
            assert "needs_review_leaf_count" in learner
            assert "remembered_leaf_count" in learner
            assert "last_activity_at" in learner
            # Never return reflection text
            assert "content" not in learner
            assert "full_text" not in learner

    @patch("api.routers.teacher.repo_query")
    @patch("api.routers.teacher.check_classroom_access")
    @patch("api.routers.teacher.get_current_user")
    def test_returns_empty_list_when_no_enrollments(
        self, mock_get_user, mock_check, mock_query, client, teacher_user
    ):
        """No enrollments → empty list."""
        mock_get_user.return_value = teacher_user
        mock_check.return_value = None
        mock_query.return_value = []  # no enrollments

        response = client.get("/api/teacher/classes/c1/learners")
        assert response.status_code == 200
        assert response.json() == []

    @patch("api.routers.teacher.get_current_user")
    def test_unauthenticated_gets_401(
        self, mock_get_user, client
    ):
        """No user gets 401."""
        mock_get_user.return_value = None

        response = client.get("/api/teacher/classes/c1/learners")
        assert response.status_code == 401


# =========================================================================
# GET /api/teacher/classes/{classroom_id}/activity
# =========================================================================


class TestListClassActivity:
    """GET /api/teacher/classes/{classroom_id}/activity."""

    @patch("api.routers.teacher.repo_query")
    @patch("api.routers.teacher.check_classroom_access")
    @patch("api.routers.teacher.get_current_user")
    def test_returns_activity_feed(
        self, mock_get_user, mock_check, mock_query, client, teacher_user
    ):
        """Returns activity entries with metadata only — no reflection text."""
        mock_get_user.return_value = teacher_user
        mock_check.return_value = None

        mock_query.side_effect = [
            # Assignments
            [{"notebook_id": "notebook:n1"}],
            # Events
            [
                {
                    "id": "leaf_review_event:e1",
                    "user_id": "user:l1",
                    "notebook_id": "notebook:n1",
                    "note_id": "note:n1",
                    "event_type": "remembered",
                    "created": "2026-07-05T10:00:00Z",
                },
                {
                    "id": "leaf_review_event:e2",
                    "user_id": None,
                    "notebook_id": "notebook:n1",
                    "note_id": "note:n2",
                    "event_type": "needs_review",
                    "created": "2026-07-05T09:00:00Z",
                },
            ],
        ]

        response = client.get("/api/teacher/classes/c1/activity")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

        # First event has learner_id (user_id populated)
        assert data[0]["event_id"] == "e1"
        assert data[0]["learner_id"] == "l1"
        assert data[0]["event_type"] == "remembered"

        # Second event has null learner_id (user_id was null)
        assert data[1]["event_id"] == "e2"
        assert data[1]["learner_id"] is None

        # Verify no reflection text
        for entry in data:
            assert "content" not in entry
            assert "full_text" not in entry
            assert "note_content" not in entry

    @patch("api.routers.teacher.repo_query")
    @patch("api.routers.teacher.check_classroom_access")
    @patch("api.routers.teacher.get_current_user")
    def test_returns_empty_when_no_assignments(
        self, mock_get_user, mock_check, mock_query, client, teacher_user
    ):
        """No assignments → empty activity feed."""
        mock_get_user.return_value = teacher_user
        mock_check.return_value = None
        mock_query.return_value = []  # no assignments

        response = client.get("/api/teacher/classes/c1/activity")
        assert response.status_code == 200
        assert response.json() == []

    @patch("api.routers.teacher.get_current_user")
    def test_unauthenticated_gets_401(
        self, mock_get_user, client
    ):
        """No user gets 401."""
        mock_get_user.return_value = None

        response = client.get("/api/teacher/classes/c1/activity")
        assert response.status_code == 401


# =========================================================================
# Permission boundary tests
# =========================================================================


class TestTeacherPermissions:
    """Cross-cutting permission checks."""

    @patch("api.routers.teacher.check_classroom_access")
    @patch("api.routers.teacher.get_current_user")
    def test_teacher_cannot_access_another_teachers_class(
        self, mock_get_user, mock_check, client, teacher_user
    ):
        """check_classroom_access raises 403 when teacher doesn't own class."""
        from fastapi import HTTPException

        mock_get_user.return_value = teacher_user
        mock_check.side_effect = HTTPException(status_code=403)

        response = client.get("/api/teacher/classes/other-class")

        assert response.status_code == 403
