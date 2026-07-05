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

        mock_session_cls.close_stale_sessions_for_notebook = AsyncMock(return_value=0)
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
        mock_session_cls.close_stale_sessions_for_notebook.assert_called_once()

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

        mock_session_cls.close_stale_sessions_for_notebook = AsyncMock(return_value=0)
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
    def test_abandons_stale_and_creates_new_session(self, mock_session_cls, client):
        """When stale active session exists, closes it and creates fresh."""
        mock_session_cls.close_stale_sessions_for_notebook = AsyncMock(return_value=1)
        mock_session_cls.get_active_for_notebook = AsyncMock(return_value=None)

        fresh_session = AsyncMock()
        fresh_session.id = "study_session:fresh1"
        fresh_session.notebook_id = "notebook:lib1"
        fresh_session.status = "active"
        fresh_session.started_at = "2026-07-04T14:00:00Z"
        fresh_session.ended_at = None
        fresh_session.leaf_count = 0
        fresh_session.created = "2026-07-04T14:00:00Z"
        fresh_session.updated = "2026-07-04T14:00:00Z"
        mock_session_cls.return_value = fresh_session

        response = client.post(
            "/api/study/sessions",
            json={"notebook_id": "notebook:lib1"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "study_session:fresh1"
        assert data["status"] == "active"
        mock_session_cls.close_stale_sessions_for_notebook.assert_called_once_with(
            "notebook:lib1"
        )

    @patch("api.routers.study.StudySession")
    def test_returns_500_on_error(self, mock_session_cls, client):
        """On unexpected error, returns 500."""
        mock_session_cls.close_stale_sessions_for_notebook = AsyncMock(return_value=0)
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
        from vault_core.exceptions import NotFoundError

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

    @patch("api.routers.study.LeafReviewEvent")
    @patch("api.routers.study.LeafReviewState")
    @patch("api.routers.study.Note")
    def test_returns_queue_items(self, mock_note_cls, mock_state_cls, mock_event_cls, client):
        """Returns formatted review queue items with note data and weak-spot fields."""
        mock_state = AsyncMock()
        mock_state.note_id = "note:n1"
        mock_state.notebook_id = "notebook:lib1"
        mock_state.needs_review = False
        mock_state.last_event_at = "2026-07-04T12:00:00Z"
        mock_state.review_count = 3

        mock_state_cls.get_for_notebook = AsyncMock(return_value=[mock_state])

        mock_note = AsyncMock()
        mock_note.title = "Trigonometric Identities"
        mock_note.content = "sin\u00b2\u03b8 + cos\u00b2\u03b8 = 1 is a fundamental identity"
        # get() is a classmethod that must be awaitable
        mock_note_cls.get = AsyncMock(return_value=mock_note)

        mock_event_cls.compute_weak_spot_for_note = AsyncMock(return_value=(False, None))

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
        # Weak-spot fields present
        assert item["is_weak_spot"] is False
        assert item["weak_spot_label"] is None

    @patch("api.routers.study.LeafReviewState")
    def test_returns_empty_when_no_notebook(self, mock_state_cls, client):
        """Without notebook_id, fetches all states (still no items if none exist)."""
        mock_state_cls.get_all = AsyncMock(return_value=[])

        response = client.get("/api/study/review-queue")
        assert response.status_code == 200
        assert response.json() == {"items": [], "total": 0}


class TestWeakSpotHeuristic:
    """Delta J: Weak-spot heuristic derivation from events."""

    def test_below_threshold_returns_false(self):
        """One needs_review event -> is_weak_spot false."""
        from types import SimpleNamespace
        from vault_core.domain.study import LeafReviewEvent

        events = [
            SimpleNamespace(event_type="needs_review", created="2026-07-04T14:00:00Z"),
        ]
        is_weak, label = LeafReviewEvent._compute_weak_spot_from_events(events)
        assert is_weak is False
        assert label is None

    def test_two_needs_review_within_cooldown_returns_false(self):
        """Two needs_review events within 1h cooldown -> false."""
        from datetime import datetime, timezone, timedelta
        from types import SimpleNamespace
        from vault_core.domain.study import LeafReviewEvent

        now = datetime.now(timezone.utc)
        thirty_min_ago = now - timedelta(minutes=30)
        fifteen_min_ago = now - timedelta(minutes=15)

        events = [
            SimpleNamespace(event_type="needs_review", created=thirty_min_ago.isoformat()),
            SimpleNamespace(event_type="needs_review", created=fifteen_min_ago.isoformat()),
        ]
        is_weak, label = LeafReviewEvent._compute_weak_spot_from_events(events)
        assert is_weak is False
        assert label is None

    def test_two_needs_review_past_cooldown_no_remembered_returns_true(self):
        """Two needs_review events older than 1h, no later remembered -> weak spot."""
        from datetime import datetime, timezone, timedelta
        from types import SimpleNamespace
        from vault_core.domain.study import LeafReviewEvent

        # Create timestamps >1h ago
        now = datetime.now(timezone.utc)
        old = now - timedelta(hours=2)
        oldest = now - timedelta(hours=3)

        events = [
            SimpleNamespace(event_type="needs_review", created=oldest.isoformat()),
            SimpleNamespace(event_type="needs_review", created=old.isoformat()),
        ]
        is_weak, label = LeafReviewEvent._compute_weak_spot_from_events(events)
        assert is_weak is True
        assert label == "needs_practice"

    def test_remembered_after_needs_review_clears_weak_spot(self):
        """Remembered event after most recent needs_review -> not weak."""
        from datetime import datetime, timezone, timedelta
        from types import SimpleNamespace
        from vault_core.domain.study import LeafReviewEvent

        now = datetime.now(timezone.utc)
        two_hours_ago = now - timedelta(hours=2)
        three_hours_ago = now - timedelta(hours=3)
        one_hour_ago = now - timedelta(hours=1)  # most recent: remembered

        events = [
            SimpleNamespace(event_type="needs_review", created=three_hours_ago.isoformat()),
            SimpleNamespace(event_type="needs_review", created=two_hours_ago.isoformat()),
            SimpleNamespace(event_type="remembered", created=one_hour_ago.isoformat()),
        ]
        is_weak, label = LeafReviewEvent._compute_weak_spot_from_events(events)
        assert is_weak is False
        assert label is None

    def test_zero_events_returns_false(self):
        """No events at all -> not weak."""
        from vault_core.domain.study import LeafReviewEvent

        is_weak, label = LeafReviewEvent._compute_weak_spot_from_events([])
        assert is_weak is False
        assert label is None

    def test_only_remembered_events_returns_false(self):
        """Only remembered events -> not weak."""
        from types import SimpleNamespace
        from vault_core.domain.study import LeafReviewEvent

        events = [
            SimpleNamespace(event_type="remembered", created="2026-07-04T14:00:00Z"),
            SimpleNamespace(event_type="remembered", created="2026-07-04T15:00:00Z"),
        ]
        is_weak, label = LeafReviewEvent._compute_weak_spot_from_events(events)
        assert is_weak is False
        assert label is None


# =========================================================================
# LeafReviewState upsert integration tests (repository-level)
# =========================================================================


class TestLeafReviewStateUpsert:
    """Validates the actual repo_upsert target and review_count logic.

    Unlike the mocked router tests above, these test the domain model's
    ``upsert_from_event`` method with mocked ``repo_upsert`` / ``repo_query``
    to verify the correct SurrealDB UPSERT target is used and that the
    state record is properly created/updated.
    """

    # ------------------------------------------------------------------
    # Helper: build a minimal state dict that can round-trip through .save()
    # ------------------------------------------------------------------

    def _state_record(
        self,
        note_id: str,
        needs_review: bool,
        last_event_type: str,
        review_count: int = 0,
    ) -> dict:
        return {
            "id": f"leaf_review_state:note_{note_id}",
            "note_id": f"note:{note_id}",
            "notebook_id": "notebook:test_nb",
            "needs_review": needs_review,
            "last_event_type": last_event_type,
            "review_count": review_count,
            "created": "2026-07-05T12:00:00Z",
            "updated": "2026-07-05T12:00:00Z",
        }

    def _run(self, fn, *args, **kwargs):
        import asyncio
        return asyncio.run(fn(*args, **kwargs))

    @patch("vault_core.domain.study.repo_query")
    @patch("vault_core.database.repository.repo_upsert")
    def test_upsert_targets_correct_table(self, mock_repo_upsert, mock_repo_query):
        """UPSERT targets ``leaf_review_state:note_<id>`` not bare ``note_<id>``."""
        from vault_core.domain.study import LeafReviewState

        mock_repo_upsert.return_value = []
        mock_repo_query.side_effect = [[], []]  # SELECT then save()

        self._run(
            LeafReviewState.upsert_from_event,
            "note:test_note_a",
            "notebook:test_nb",
            "needs_review",
        )

        assert mock_repo_upsert.called, "repo_upsert should have been called"
        call_table, call_id, call_data = mock_repo_upsert.call_args[0]
        assert call_table == "leaf_review_state"
        assert call_id.startswith(
            "leaf_review_state:"
        ), f"UPSERT target should include table prefix, got '{call_id}'"
        assert (
            "note_test_note_a" in call_id
        ), f"UPSERT target should include note key, got '{call_id}'"
        # Verify the old bug pattern is NOT present
        assert call_id != "note_test_note_a", (
            f"UPSERT target should NOT be bare 'note_test_note_a' "
            f"(which SurrealDB treats as a table name)"
        )

    @patch("vault_core.domain.base.repo_update")
    @patch("vault_core.domain.study.repo_query")
    @patch("vault_core.database.repository.repo_upsert")
    def test_needs_review_sets_needs_review_true(
        self, mock_repo_upsert, mock_repo_query, mock_repo_update
    ):
        """needs_review event creates state with needs_review=True."""
        from vault_core.domain.study import LeafReviewState

        mock_repo_upsert.return_value = []
        rec = self._state_record("test_note_b", True, "needs_review")
        mock_repo_update.return_value = [rec]
        mock_repo_query.return_value = [rec]

        result = self._run(
            LeafReviewState.upsert_from_event,
            "note:test_note_b",
            "notebook:test_nb",
            "needs_review",
        )

        assert result is not None
        assert result.needs_review is True
        assert result.last_event_type == "needs_review"
        call_data = mock_repo_upsert.call_args[0][2]
        assert call_data.get("needs_review") is True

    @patch("vault_core.domain.base.repo_update")
    @patch("vault_core.domain.study.repo_query")
    @patch("vault_core.database.repository.repo_upsert")
    def test_remembered_sets_needs_review_false(
        self, mock_repo_upsert, mock_repo_query, mock_repo_update
    ):
        """remembered event updates state with needs_review=False."""
        from vault_core.domain.study import LeafReviewState

        mock_repo_upsert.return_value = []
        rec = self._state_record("test_note_c", False, "remembered")
        mock_repo_update.return_value = [rec]
        mock_repo_query.return_value = [rec]

        result = self._run(
            LeafReviewState.upsert_from_event,
            "note:test_note_c",
            "notebook:test_nb",
            "remembered",
        )

        assert result.needs_review is False
        assert result.last_event_type == "remembered"
        call_data = mock_repo_upsert.call_args[0][2]
        assert call_data.get("needs_review") is False

    @patch("vault_core.domain.base.repo_update")
    @patch("vault_core.domain.study.repo_query")
    @patch("vault_core.database.repository.repo_upsert")
    def test_review_count_increments_on_second_event(
        self, mock_repo_upsert, mock_repo_query, mock_repo_update
    ):
        """Second event for same note increments review_count."""
        from vault_core.domain.study import LeafReviewState

        mock_repo_upsert.return_value = []
        # Simulate existing review_count=2; after increment should be 3
        rec = self._state_record("test_note_d", True, "needs_review", review_count=2)
        mock_repo_update.return_value = [{**rec, "review_count": 3}]
        mock_repo_query.return_value = [rec]

        result = self._run(
            LeafReviewState.upsert_from_event,
            "note:test_note_d",
            "notebook:test_nb",
            "needs_review",
        )

        assert result is not None
        assert result.review_count == 3  # 2 + 1

    @patch("vault_core.domain.base.repo_update")
    @patch("vault_core.domain.study.repo_query")
    @patch("vault_core.database.repository.repo_upsert")
    def test_same_note_upsert_is_idempotent(
        self, mock_repo_upsert, mock_repo_query, mock_repo_update
    ):
        """Two upserts for the same note target the same record key."""
        from vault_core.domain.study import LeafReviewState

        mock_repo_upsert.return_value = []

        rec_a = self._state_record("test_note_e", True, "needs_review")
        rec_b = self._state_record("test_note_e", False, "remembered")

        # First call (needs_review) → SELECT + save()
        mock_repo_update.return_value = [rec_a]
        mock_repo_query.return_value = [rec_a]
        self._run(
            LeafReviewState.upsert_from_event,
            "note:test_note_e",
            "notebook:test_nb",
            "needs_review",
        )
        first_call_id = mock_repo_upsert.call_args[0][1]

        # Second call (remembered) → SELECT + save()
        mock_repo_update.return_value = [rec_b]
        mock_repo_query.return_value = [rec_b]
        self._run(
            LeafReviewState.upsert_from_event,
            "note:test_note_e",
            "notebook:test_nb",
            "remembered",
        )
        second_call_id = mock_repo_upsert.call_args[0][1]

        assert first_call_id == second_call_id, (
            f"Same note should produce same UPSERT target: "
            f"first='{first_call_id}', second='{second_call_id}'"
        )

    @patch("vault_core.database.repository.repo_upsert")
    def test_empty_assigned_nids_skips_weak_spot_queries(self, mock_repo_upsert):
        """No callbacks issued when there are no assigned notebooks."""
        from api.routers.teacher import _compute_weak_spots_for_notebooks
        self._run(_compute_weak_spots_for_notebooks, [])
        mock_repo_upsert.assert_not_called()


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
