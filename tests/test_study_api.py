"""
Tests for study session and leaf review persistence API endpoints.

Delta F implementation — tests the backend skeleton with mocked
domain models, following the existing test patterns in test_notes_api.py.
"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from api.main import app

    return TestClient(app)


class TestCreateStudySession:
    """POST /api/study/sessions"""

    @patch("api.routers.study.StudySession")
    def test_creates_new_session_when_none_active(self, mock_session_cls, client):
        """When no active session exists, creates a new one."""
        mock_session = AsyncMock()
        mock_session.id = "study_session:abc123"
        mock_session.notebook_id = "notebook:lib1"
        mock_session.status = "active"
        mock_session.started_at = "2026-07-04T12:00:00Z"
        mock_session.ended_at = None
        mock_session.leaf_count = 0
        mock_session.created = "2026-07-04T12:00:00Z"
        mock_session.updated = "2026-07-04T12:00:00Z"

        mock_session_cls.get_active_for_notebook = AsyncMock(return_value=None)
        mock_session_cls.return_value = mock_session

        response = client.post(
            "/api/study/sessions",
            json={"notebook_id": "notebook:lib1"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "study_session:abc123"
        assert data["status"] == "active"
        assert data["notebook_id"] == "lib1"

    @patch("api.routers.study.StudySession")
    def test_resumes_existing_active_session(self, mock_session_cls, client):
        """When an active session exists, returns it instead of creating."""
        mock_session = AsyncMock()
        mock_session.id = "study_session:existing1"
        mock_session.notebook_id = "notebook:lib1"
        mock_session.status = "active"
        mock_session.started_at = "2026-07-04T10:00:00Z"
        mock_session.ended_at = None
        mock_session.leaf_count = 3
        mock_session.created = "2026-07-04T10:00:00Z"
        mock_session.updated = "2026-07-04T10:30:00Z"

        mock_session_cls.get_active_for_notebook = AsyncMock(return_value=mock_session)

        response = client.post(
            "/api/study/sessions",
            json={"notebook_id": "notebook:lib1"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "study_session:existing1"
        # Verify no new session was created
        mock_session_cls.assert_not_called()

    @patch("api.routers.study.StudySession")
    def test_returns_500_on_error(self, mock_session_cls, client):
        """On unexpected error, returns 500."""
        mock_session_cls.get_active_for_notebook = AsyncMock(
            side_effect=RuntimeError("DB connection failed")
        )

        response = client.post(
            "/api/study/sessions",
            json={"notebook_id": "notebook:lib1"},
        )

        assert response.status_code == 500


class TestUpdateStudySession:
    """PATCH /api/study/sessions/{id}"""

    @patch("api.routers.study.StudySession")
    def test_completes_session(self, mock_session_cls, client):
        """When completed, sets ended_at and recalculates leaf_count."""
        mock_session = AsyncMock()
        mock_session.id = "study_session:abc123"
        mock_session.notebook_id = "notebook:lib1"
        mock_session.status = "active"
        mock_session.started_at = "2026-07-04T12:00:00Z"
        mock_session.ended_at = None
        mock_session.leaf_count = 0
        mock_session.created = "2026-07-04T12:00:00Z"
        mock_session.updated = "2026-07-04T12:00:00Z"
        async def update_leaf_count_side():
            mock_session.leaf_count = 5
            return 5
        mock_session.update_leaf_count = AsyncMock(side_effect=update_leaf_count_side)

        # get() is a classmethod that must be awaitable
        mock_session_cls.get = AsyncMock(return_value=mock_session)

        response = client.patch(
            "/api/study/sessions/abc123",
            json={"status": "completed"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "study_session:abc123"
        assert data["leaf_count"] == 5
        # Verify session was saved with completed status
        assert mock_session.status == "completed"
        mock_session.save.assert_called_once()

    @patch("api.routers.study.StudySession")
    def test_returns_404_for_nonexistent_session(self, mock_session_cls, client):
        """When session not found, returns 404."""
        from open_notebook.exceptions import NotFoundError

        mock_session_cls.get.side_effect = NotFoundError("not found")

        response = client.patch(
            "/api/study/sessions/nonexistent",
            json={"status": "completed"},
        )

        assert response.status_code == 404


class TestCreateLeafReviewEvent:
    """POST /api/study/leaf-events"""

    @patch("api.routers.study.LeafReviewEvent")
    @patch("api.routers.study.LeafReviewState")
    def test_creates_event_with_terminal_state_upsert(
        self, mock_state_cls, mock_event_cls, client
    ):
        """Creating a 'remembered' event also upserts review state."""
        mock_event = AsyncMock()
        mock_event.id = "leaf_review_event:evt1"
        mock_event.session_id = "study_session:ss1"
        mock_event.note_id = "note:n1"
        mock_event.notebook_id = "notebook:lib1"
        mock_event.event_type = "remembered"
        mock_event.event_metadata = None
        mock_event.created = "2026-07-04T12:00:00Z"
        mock_event.save = AsyncMock()

        mock_event_cls.return_value = mock_event

        mock_state_cls.upsert_from_event = AsyncMock()

        response = client.post(
            "/api/study/leaf-events",
            json={
                "session_id": "study_session:ss1",
                "note_id": "note:n1",
                "notebook_id": "notebook:lib1",
                "event_type": "remembered",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "leaf_review_event:evt1"
        assert data["event_type"] == "remembered"
        # Verify state was upserted
        mock_state_cls.upsert_from_event.assert_called_once_with(
            note_id="note:n1",
            notebook_id="notebook:lib1",
            event_type="remembered",
        )

    @patch("api.routers.study.LeafReviewEvent")
    def test_creates_non_terminal_event_without_state_upsert(
        self, mock_event_cls, client
    ):
        """Creating an 'opened' event does NOT trigger state upsert."""
        mock_event = AsyncMock()
        mock_event.id = "leaf_review_event:evt2"
        mock_event.session_id = "study_session:ss1"
        mock_event.note_id = "note:n1"
        mock_event.notebook_id = "notebook:lib1"
        mock_event.event_type = "opened"
        mock_event.event_metadata = None
        mock_event.created = "2026-07-04T12:00:00Z"
        mock_event.save = AsyncMock()

        mock_event_cls.return_value = mock_event

        response = client.post(
            "/api/study/leaf-events",
            json={
                "session_id": "study_session:ss1",
                "note_id": "note:n1",
                "notebook_id": "notebook:lib1",
                "event_type": "opened",
            },
        )

        assert response.status_code == 200
        assert response.json()["event_type"] == "opened"

    def test_rejects_invalid_event_type(self, client):
        """Invalid event_type returns 422 from Pydantic validation."""
        response = client.post(
            "/api/study/leaf-events",
            json={
                "session_id": "study_session:ss1",
                "note_id": "note:n1",
                "notebook_id": "notebook:lib1",
                "event_type": "invalid",
            },
        )
        assert response.status_code == 422

    def test_rejects_missing_required_fields(self, client):
        """Missing required fields returns 422."""
        response = client.post(
            "/api/study/leaf-events",
            json={"event_type": "remembered"},
        )
        assert response.status_code == 422


class TestGetReviewQueue:
    """GET /api/study/review-queue"""

    @patch("api.routers.study.LeafReviewState")
    @patch("api.routers.study.Note")
    def test_returns_queue_items(self, mock_note_cls, mock_state_cls, client):
        """Returns formatted review queue items with note data."""
        mock_state = AsyncMock()
        mock_state.note_id = "note:n1"
        mock_state.notebook_id = "notebook:lib1"
        mock_state.needs_review = False
        mock_state.last_event_at = "2026-07-04T12:00:00Z"
        mock_state.review_count = 3

        mock_state_cls.get_for_notebook = AsyncMock(return_value=[mock_state])

        mock_note = AsyncMock()
        mock_note.title = "Trigonometric Identities"
        mock_note.content = "sin²θ + cos²θ = 1 is a fundamental identity"
        # get() is a classmethod that must be awaitable
        mock_note_cls.get = AsyncMock(return_value=mock_note)

        response = client.get(
            "/api/study/review-queue?notebook_id=notebook:lib1"
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        item = data["items"][0]
        assert item["note_id"] == "n1"
        assert item["title"] == "Trigonometric Identities"
        assert item["needs_review"] is False
        assert item["review_count"] == 3

    @patch("api.routers.study.LeafReviewState")
    def test_returns_empty_when_no_notebook(self, mock_state_cls, client):
        """Without notebook_id, fetches all states (still no items if none exist)."""
        mock_state_cls.get_all = AsyncMock(return_value=[])

        response = client.get("/api/study/review-queue")
        assert response.status_code == 200
        assert response.json() == {"items": [], "total": 0}


class TestListStudySessions:
    """GET /api/study/sessions"""

    @patch("api.routers.study.repo_query")
    def test_lists_sessions(self, mock_repo_query, client):
        """Returns list of study sessions."""
        mock_repo_query.return_value = [
            {
                "id": "study_session:ss1",
                "notebook_id": "notebook:lib1",
                "status": "completed",
                "started_at": "2026-07-04T10:00:00Z",
                "ended_at": "2026-07-04T11:00:00Z",
                "leaf_count": 5,
                "created": "2026-07-04T10:00:00Z",
                "updated": "2026-07-04T11:00:00Z",
            }
        ]

        response = client.get("/api/study/sessions?notebook_id=notebook:lib1")

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["status"] == "completed"
        assert data["items"][0]["leaf_count"] == 5
