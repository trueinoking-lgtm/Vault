"""
Domain models for study sessions and leaf review persistence.

Implements the Delta E design for Vault's learner-loop:
- StudySession: groups review events into a contiguous study period
- LeafReviewEvent: append-only log of learner interactions with a leaf
- LeafReviewState: denormalized current review state per leaf
"""

from datetime import datetime, timedelta, timezone
from typing import Any, ClassVar, Dict, List, Literal, Optional

from loguru import logger

from vault_core.database.repository import ensure_record_id, repo_query
from vault_core.domain.base import ObjectModel

# Allowed event types for leaf review events
REVIEW_EVENT_TYPES = Literal[
    "opened",
    "check_started",
    "remembered",
    "needs_review",
    "listened",
]

# Session status values
SESSION_STATUS = Literal[
    "active",
    "completed",
    "abandoned",
]

# Sessions older than this threshold are considered stale and auto-closed
# as abandoned when a new POST /api/study/sessions arrives for the same
# notebook. This prevents unbounded accumulation of active sessions when
# the frontend's best-effort completion fires unreliably (e.g. tab closed).
STALE_SESSION_HOURS = 12


class StudySession(ObjectModel):
    table_name: ClassVar[str] = "study_session"
    nullable_fields: ClassVar[set[str]] = {"ended_at", "school_id", "user_id"}
    notebook_id: str
    status: str = "active"
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    leaf_count: int = 0
    school_id: Optional[str] = None
    user_id: Optional[str] = None

    @classmethod
    async def get_active_for_notebook(cls, notebook_id: str) -> Optional["StudySession"]:
        """Return the most recent active session for a notebook, if any."""
        try:
            result = await repo_query(
                "SELECT * FROM study_session WHERE notebook_id = $nbid "
                "AND status = 'active' ORDER BY started_at DESC LIMIT 1",
                {"nbid": ensure_record_id(notebook_id)},
            )
            if result:
                return cls(**result[0])
            return None
        except Exception as e:
            logger.error(f"Error fetching active session for {notebook_id}: {e}")
            return None

    @classmethod
    async def close_stale_sessions_for_notebook(cls, notebook_id: str) -> int:
        """
        Close active sessions older than *STALE_SESSION_HOURS* as abandoned.

        Called before creating a new session so that sessions orphaned by a
        closed tab or failed best-effort frontend completion do not accumulate.

        Returns the number of sessions closed.
        """
        try:
            cutoff = (
                datetime.now(timezone.utc) - timedelta(hours=STALE_SESSION_HOURS)
            ).strftime("%Y-%m-%d %H:%M:%S")
            result = await repo_query(
                "SELECT * FROM study_session WHERE notebook_id = $nbid "
                "AND status = 'active' AND started_at < $cutoff "
                "ORDER BY started_at DESC",
                {
                    "nbid": ensure_record_id(notebook_id),
                    "cutoff": cutoff,
                },
            )
            count = 0
            for row in result:
                session = cls(**row)
                session.status = "abandoned"
                session.ended_at = datetime.now()
                await session.save()
                count += 1
            if count:
                logger.info(
                    f"Closed {count} stale session(s) for notebook {notebook_id}"
                )
            return count
        except Exception as e:
            logger.error(
                f"Error closing stale sessions for {notebook_id}: {e}"
            )
            return 0

    async def update_leaf_count(self) -> int:
        """Recalculate leaf_count from distinct note_ids in this session."""
        try:
            result = await repo_query(
                "SELECT count() AS cnt FROM (SELECT note_id FROM leaf_review_event "
                "WHERE session_id = $sid GROUP BY note_id) GROUP ALL",
                {"sid": ensure_record_id(self.id)},
            )
            count = result[0]["cnt"] if result else 0
            self.leaf_count = count
            await self.save()
            return count
        except Exception as e:
            logger.error(f"Error updating leaf count for session {self.id}: {e}")
            return self.leaf_count


class LeafReviewEvent(ObjectModel):
    table_name: ClassVar[str] = "leaf_review_event"
    nullable_fields: ClassVar[set[str]] = {"event_metadata", "user_id"}
    session_id: str
    note_id: str
    notebook_id: str
    event_type: str
    event_metadata: Optional[Dict[str, Any]] = None
    user_id: Optional[str] = None

    @classmethod
    async def get_for_note(cls, note_id: str, limit: int = 50) -> List["LeafReviewEvent"]:
        """Return review events for a specific leaf, most recent first."""
        try:
            result = await repo_query(
                "SELECT * FROM leaf_review_event WHERE note_id = $nid "
                "ORDER BY created DESC LIMIT $limit",
                {"nid": ensure_record_id(note_id), "limit": limit},
            )
            return [cls(**ev) for ev in result]
        except Exception as e:
            logger.error(f"Error fetching review events for {note_id}: {e}")
            return []

    @classmethod
    async def compute_weak_spot_for_note(
        cls, note_id: str
    ) -> tuple[bool, Optional[str]]:
        """
        Query-time weak-spot heuristic derivation for a single leaf.

        A leaf is a weak spot when ALL of the following hold:
        - At least 2 ``needs_review`` events have been logged
        - No ``remembered`` event after the most recent ``needs_review``
        - The most recent ``needs_review`` is at least 1 hour old (cooldown)

        Returns (is_weak_spot, label).
        label is ``"needs_practice"`` when a weak spot, otherwise None.

        TODO: If per-item querying becomes a bottleneck (>500ms for 20 items),
        consider caching or adding a ``consecutive_needs_review`` field to
        ``leaf_review_state``.
        """
        events = await cls.get_for_note(note_id, limit=50)
        return cls._compute_weak_spot_from_events(events)

    @staticmethod
    def _compute_weak_spot_from_events(
        events: list,
    ) -> tuple[bool, Optional[str]]:
        """
        Core heuristic logic, testable without database access.

        Each event must have ``.event_type`` (str) and ``.created`` (str or
        datetime) attributes.
        """
        needs_review_times: List[datetime] = []
        remembered_times: List[datetime] = []

        for event in events:
            created_str = str(event.created) if event.created else ""
            created_dt = _parse_event_time(created_str)
            if created_dt is None:
                continue

            if event.event_type == "needs_review":
                needs_review_times.append(created_dt)
            elif event.event_type == "remembered":
                remembered_times.append(created_dt)

        if len(needs_review_times) < 2:
            return False, None

        last_needs_review = max(needs_review_times)
        last_remembered = max(remembered_times) if remembered_times else None

        # Learner improved since last struggle
        if last_remembered and last_remembered > last_needs_review:
            return False, None

        # Cooldown: needs_review must be at least 1 hour old
        now = datetime.now(timezone.utc)
        if (now - last_needs_review) < timedelta(hours=1):
            return False, None

        return True, "needs_practice"


def _parse_event_time(created_str: str) -> Optional[datetime]:
    """Parse an event timestamp string to an aware datetime.

    Handles ISO-8601 with 'Z' suffix, timezone offsets, and naive datetimes
    (assumed UTC). Returns None on parse failure.
    """
    try:
        normalized = created_str.replace("Z", "+00:00")
        dt = datetime.fromisoformat(normalized)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, AttributeError):
        return None


class LeafReviewState(ObjectModel):
    table_name: ClassVar[str] = "leaf_review_state"
    nullable_fields: ClassVar[set[str]] = {"user_id"}
    note_id: str
    notebook_id: str
    needs_review: bool = False
    last_event_type: str = ""
    last_event_at: Optional[datetime] = None
    review_count: int = 0
    user_id: Optional[str] = None

    @classmethod
    async def get_for_notebook(
        cls,
        notebook_id: str,
        limit: int = 20,
        needs_review_only: bool = False,
    ) -> List["LeafReviewState"]:
        """Return review states for a notebook, ordered by most recently updated."""
        try:
            conditions = ["notebook_id = $nbid"]
            if needs_review_only:
                conditions.append("needs_review = true")
            where_clause = " AND ".join(conditions)
            result = await repo_query(
                f"SELECT * FROM leaf_review_state WHERE {where_clause} "
                f"ORDER BY updated DESC LIMIT $limit",
                {"nbid": ensure_record_id(notebook_id), "limit": limit},
            )
            return [cls(**rs) for rs in result]
        except Exception as e:
            logger.error(f"Error fetching review states for {notebook_id}: {e}")
            return []

    @classmethod
    async def upsert_from_event(
        cls,
        note_id: str,
        notebook_id: str,
        event_type: str,
    ) -> "LeafReviewState":
        """
        Create or update the review state for a leaf based on a review event.

        Called after every terminal event (remembered, needs_review).
        Uses SurrealDB UPSERT semantics via repo_upsert.
        """
        from vault_core.database.repository import repo_upsert

        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        needs_review = event_type == "needs_review"

        data = {
            "note_id": ensure_record_id(note_id),
            "notebook_id": ensure_record_id(notebook_id),
            "needs_review": needs_review,
            "last_event_type": event_type,
            "last_event_at": now,
            "updated": now,
        }

        # Use the note_id as the primary identifier for upsert
        # The table has UNIQUE constraint on note_id
        try:
            result = await repo_upsert(
                cls.table_name,
                note_id.replace(":", "_"),  # safe id for upsert
                data,
                add_timestamp=False,
            )

            # Now fetch the full state record to return it
            existing = await repo_query(
                "SELECT * FROM leaf_review_state WHERE note_id = $nid LIMIT 1",
                {"nid": ensure_record_id(note_id)},
            )
            if existing:
                obj = cls(**existing[0])
                # Increment review_count
                obj.review_count = (obj.review_count or 0) + 1
                await obj.save()
                return obj

            return cls(note_id=note_id, notebook_id=notebook_id, needs_review=needs_review)
        except Exception as e:
            logger.error(f"Error upserting review state for {note_id}: {e}")
            raise
