"""
API router for study session and leaf review persistence endpoints.

Delta F implementation of the Vault learner-loop persistence design.
All endpoints are under /api/study/ prefix.
"""

from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from loguru import logger

from api.models import (
    LeafReviewEventCreate,
    LeafReviewEventResponse,
    ReviewQueueItem,
    ReviewQueueResponse,
    StudySessionCreate,
    StudySessionListResponse,
    StudySessionResponse,
    StudySessionUpdate,
)
from vault_core.database.repository import ensure_record_id, repo_query
from vault_core.domain.study import LeafReviewEvent, LeafReviewState, StudySession
from vault_core.domain.notebook import Note
from vault_core.exceptions import NotFoundError

router = APIRouter()

ALLOWED_EVENT_TYPES = frozenset({
    "opened",
    "check_started",
    "remembered",
    "needs_review",
    "listened",
})

TERMINAL_EVENT_TYPES = frozenset({"remembered", "needs_review"})


def _format_session(session: StudySession) -> StudySessionResponse:
    return StudySessionResponse(
        id=session.id or "",
        notebook_id=str(session.notebook_id).replace("notebook:", ""),
        status=session.status,
        started_at=str(session.started_at) if session.started_at else "",
        ended_at=str(session.ended_at) if session.ended_at else None,
        leaf_count=session.leaf_count or 0,
        created=str(session.created) if session.created else "",
        updated=str(session.updated) if session.updated else "",
    )


def _format_event(event: LeafReviewEvent) -> LeafReviewEventResponse:
    return LeafReviewEventResponse(
        id=event.id or "",
        session_id=str(event.session_id).replace("study_session:", ""),
        note_id=str(event.note_id).replace("note:", ""),
        notebook_id=str(event.notebook_id).replace("notebook:", ""),
        event_type=event.event_type,
        event_metadata=event.event_metadata,
        created=str(event.created) if event.created else "",
    )


@router.post("/study/sessions", response_model=StudySessionResponse)
async def create_study_session(data: StudySessionCreate):
    """
    Start or resume a study session for a library.

    Before looking up an existing session, closes any stale active sessions
    (older than 12 hours) for this notebook to prevent unbounded accumulation.
    If a fresh active session exists, returns it. Otherwise creates a new one.
    """
    try:
        # Close any stale active sessions first (Delta L)
        await StudySession.close_stale_sessions_for_notebook(data.notebook_id)

        existing = await StudySession.get_active_for_notebook(data.notebook_id)
        if existing:
            return _format_session(existing)

        notebook_id_clean = data.notebook_id
        if ":" not in notebook_id_clean:
            notebook_id_clean = f"notebook:{notebook_id_clean}"

        session = StudySession(
            notebook_id=notebook_id_clean,
            status="active",
        )
        await session.save()
        return _format_session(session)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating study session: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/study/sessions/{session_id}", response_model=StudySessionResponse)
async def update_study_session(session_id: str, data: StudySessionUpdate):
    """
    Update a study session (close it with completed or abandoned status).

    When closing, also recalculates leaf_count from actual events.
    """
    try:
        full_id = session_id if ":" in session_id else f"study_session:{session_id}"
        session = await StudySession.get(full_id)

        session.status = data.status
        if data.status in ("completed", "abandoned"):
            from datetime import datetime

            session.ended_at = datetime.now()

        await session.save()

        # Update leaf count from actual events
        await session.update_leaf_count()

        return _format_session(session)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Study session not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating study session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/study/leaf-events", response_model=LeafReviewEventResponse)
async def create_leaf_review_event(data: LeafReviewEventCreate):
    """
    Log a leaf review event.

    For terminal events (remembered, needs_review), also upserts the
    leaf_review_state to keep the review queue fast.
    """
    try:
        if data.event_type not in ALLOWED_EVENT_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid event_type '{data.event_type}'. "
                f"Allowed: {sorted(ALLOWED_EVENT_TYPES)}",
            )

        # Normalize IDs to include table prefix if needed
        session_id = data.session_id if ":" in data.session_id else f"study_session:{data.session_id}"
        note_id = data.note_id if ":" in data.note_id else f"note:{data.note_id}"
        notebook_id = data.notebook_id if ":" in data.notebook_id else f"notebook:{data.notebook_id}"

        event = LeafReviewEvent(
            session_id=session_id,
            note_id=note_id,
            notebook_id=notebook_id,
            event_type=data.event_type,
            event_metadata=data.event_metadata,
        )
        await event.save()

        # For terminal events, upsert review state
        if data.event_type in TERMINAL_EVENT_TYPES:
            try:
                await LeafReviewState.upsert_from_event(
                    note_id=note_id,
                    notebook_id=notebook_id,
                    event_type=data.event_type,
                )
            except Exception as state_err:
                # Event is already persisted; state desync is recoverable
                logger.warning(
                    f"Failed to upsert review state for {note_id} "
                    f"after event {event.id}: {state_err}"
                )

        return _format_event(event)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating leaf review event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/study/review-queue", response_model=ReviewQueueResponse)
async def get_review_queue(
    notebook_id: Optional[str] = Query(None, description="Filter by notebook ID"),
    limit: int = Query(20, description="Max results", ge=1, le=100),
    needs_review_only: bool = Query(
        False, description="Only show leaves needing review"
    ),
):
    """
    Return leaves in the review queue, ordered by recency.

    Shows leaf review states joined with note data for display.
    If no leaves have been reviewed yet, returns an empty list.
    """
    try:
        if not notebook_id:
            # Fetch across all notebooks
            states = await LeafReviewState.get_all(order_by="updated desc")
            states = states[:limit]
        else:
            notebook_id_full = notebook_id if ":" in notebook_id else f"notebook:{notebook_id}"
            states = await LeafReviewState.get_for_notebook(
                notebook_id=notebook_id_full,
                limit=limit,
                needs_review_only=needs_review_only,
            )

        items: List[ReviewQueueItem] = []
        for state in states:
            note_id_str = str(state.note_id).replace("note:", "")

            # Fetch note title and content preview
            title = None
            content_preview = None
            try:
                full_note_id = str(state.note_id) if ":" in str(state.note_id) else f"note:{state.note_id}"
                note = await Note.get(full_note_id)
                title = note.title
                if note.content:
                    # Truncate to ~120 chars for preview
                    content_preview = note.content[:120]
                    if len(note.content) > 120:
                        content_preview += "…"
            except Exception:
                # Note might have been deleted; still show the state entry
                pass

            notebook_id_str = str(state.notebook_id).replace("notebook:", "")

            # Compute weak-spot flag from events (query-time derivation).
            # Short-circuit: if total review_count < 2, can't have 2+ needs_review.
            is_weak_spot = False
            weak_spot_label = None
            if (state.review_count or 0) >= 2:
                try:
                    is_weak_spot, weak_spot_label = (
                        await LeafReviewEvent.compute_weak_spot_for_note(
                            str(state.note_id)
                        )
                    )
                except Exception:
                    # Non-critical — degrade gracefully
                    pass

            items.append(ReviewQueueItem(
                note_id=note_id_str,
                notebook_id=notebook_id_str,
                title=title,
                content_preview=content_preview,
                needs_review=state.needs_review or False,
                last_reviewed=str(state.last_event_at) if state.last_event_at else None,
                review_count=state.review_count or 0,
                is_weak_spot=is_weak_spot,
                weak_spot_label=weak_spot_label,
            ))

        return ReviewQueueResponse(
            items=items,
            total=len(items),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching review queue: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/study/sessions", response_model=StudySessionListResponse)
async def list_study_sessions(
    notebook_id: Optional[str] = Query(None, description="Filter by notebook ID"),
    limit: int = Query(10, description="Max results", ge=1, le=100),
    status: Optional[str] = Query(None, description="Filter by status"),
):
    """
    List study sessions, optionally filtered by notebook and status.
    """
    try:
        conditions: List[str] = []
        params: dict = {}

        if notebook_id:
            nid = notebook_id if ":" in notebook_id else f"notebook:{notebook_id}"
            conditions.append("notebook_id = $nbid")
            params["nbid"] = ensure_record_id(nid)
        if status:
            conditions.append("status = $status")
            params["status"] = status

        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)

        result = await repo_query(
            f"SELECT * FROM study_session {where_clause} "
            f"ORDER BY started_at DESC LIMIT $limit",
            {**params, "limit": limit},
        )

        sessions = [StudySession(**r) for r in result]
        return StudySessionListResponse(
            items=[_format_session(s) for s in sessions],
            total=len(sessions),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing study sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))
