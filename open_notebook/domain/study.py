"""
Domain models for study sessions and leaf review persistence.

Implements the Delta E design for Vault's learner-loop:
- StudySession: groups review events into a contiguous study period
- LeafReviewEvent: append-only log of learner interactions with a leaf
- LeafReviewState: denormalized current review state per leaf
"""

from datetime import datetime
from typing import Any, ClassVar, Dict, List, Literal, Optional

from loguru import logger

from open_notebook.database.repository import ensure_record_id, repo_query
from open_notebook.domain.base import ObjectModel

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


class StudySession(ObjectModel):
    table_name: ClassVar[str] = "study_session"
    nullable_fields: ClassVar[set[str]] = {"ended_at"}
    notebook_id: str
    status: str = "active"
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    leaf_count: int = 0

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
    nullable_fields: ClassVar[set[str]] = {"event_metadata"}
    session_id: str
    note_id: str
    notebook_id: str
    event_type: str
    event_metadata: Optional[Dict[str, Any]] = None

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


class LeafReviewState(ObjectModel):
    table_name: ClassVar[str] = "leaf_review_state"
    note_id: str
    notebook_id: str
    needs_review: bool = False
    last_event_type: str = ""
    last_event_at: Optional[datetime] = None
    review_count: int = 0

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
        from open_notebook.database.repository import repo_upsert

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
