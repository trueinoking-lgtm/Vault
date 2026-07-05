"""
Teacher / class progress read-model endpoints (Epsilon E2).

Read-only aggregate views over existing school/class/study/review data.
No writes, no side effects, no learner reflection text exposure.
"""

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from loguru import logger

from api.permissions import (
    check_classroom_access,
    check_school_role,
    get_current_user,
)
from api.models import (
    ClassActivityEntry,
    ClassProgressSummary,
    LearnerProgressSummary,
    TeacherClassSummary,
)
from vault_core.database.repository import ensure_record_id, repo_query
from vault_core.domain.school import Classroom, SchoolMembership
from vault_core.domain.study import LeafReviewEvent as LeafReviewEventDomain
from vault_core.domain.user import User

router = APIRouter(tags=["teacher"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _strip_prefix(value: str) -> str:
    """Strip the table prefix from a SurrealDB record ID string."""
    if ":" in value:
        return value.split(":", 1)[1]
    return value


def _ensure_prefixed(value: str, prefix: str) -> str:
    """Ensure a bare ID gets the expected table prefix."""
    if ":" not in value:
        return f"{prefix}:{value}"
    return value


def _now_iso() -> str:
    """Return current UTC time as ISO-8601 string."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


async def _compute_weak_spots_for_notebooks(
    notebook_ids: List[str],
    user_id_filter: Optional[str] = None,
) -> int:
    """Count notes meeting the Delta weak-spot heuristic across notebooks.

    A note is a weak spot when ALL of the following hold:
    - At least 2 ``needs_review`` events
    - No ``remembered`` event after the most recent ``needs_review``
    - The most recent ``needs_review`` is at least 1 hour old

    Reuses ``LeafReviewEvent._compute_weak_spot_from_events()`` to avoid
    duplicating the heuristic logic.
    """
    count = 0
    for raw_nid in notebook_ids:
        nid = _strip_prefix(raw_nid)
        full_nid = _ensure_prefixed(nid, "notebook")

        params: Dict[str, Any] = {
            "nid": ensure_record_id(full_nid),
        }
        user_clause = ""
        if user_id_filter:
            user_clause = " AND user_id = $uid"
            params["uid"] = ensure_record_id(
                _ensure_prefixed(user_id_filter, "user")
            )

        rows = await repo_query(
            f"SELECT * FROM leaf_review_event "
            f"WHERE notebook_id = $nid{user_clause} "
            f"ORDER BY created DESC LIMIT 500",
            params,
        )

        # Group by note_id
        note_groups: Dict[str, list] = defaultdict(list)
        for ev in rows:
            note_groups[str(ev.get("note_id", ""))].append(ev)

        for note_evs in note_groups.values():
            try:
                # Use a lightweight wrapper to avoid Pydantic validation overhead.
                # Only .created and .event_type are needed by the heuristic.
                class _EventProxy:
                    __slots__ = ("created", "event_type")

                    def __init__(self, d):
                        self.created = d.get("created")
                        self.event_type = d.get("event_type", "")

                typed = [_EventProxy(e) for e in note_evs]
                is_weak, _ = LeafReviewEventDomain._compute_weak_spot_from_events(
                    typed
                )
                if is_weak:
                    count += 1
            except Exception:
                continue

    return count


async def _get_accessible_classrooms(
    user: User,
) -> List[Dict[str, Any]]:
    """Return classrooms the user can access based on their role.

    Global owner → all classrooms.
    School owner → classrooms in owned schools.
    Teacher → classrooms where they have the teacher role.
    """
    if user.is_global_owner:
        # All classrooms across all schools
        result = await repo_query(
            "SELECT *, school_id FROM classroom ORDER BY school_id, name"
        )
        return result

    # Find memberships for this user
    memberships = await repo_query(
        "SELECT * FROM school_membership WHERE user_id = $uid",
        {"uid": ensure_record_id(str(user.id))},
    )

    if not memberships:
        return []

    classroom_results: List[Dict[str, Any]] = []

    for membership in memberships:
        role = membership.get("role", "")
        school_id = membership.get("school_id", "")
        school_id_str = str(school_id) if school_id else ""

        if role == "owner" or user.is_global_owner:
            # School owner — all classrooms in this school
            rows = await repo_query(
                "SELECT *, school_id FROM classroom WHERE school_id = $sid ORDER BY name",
                {"sid": ensure_record_id(school_id_str)},
            )
            classroom_results.extend(rows)
        elif role == "teacher":
            # Teacher — classrooms where their membership is the teacher
            mem_id = str(membership.get("id", ""))
            rows = await repo_query(
                "SELECT *, school_id FROM classroom WHERE teacher_id = $tid ORDER BY name",
                {"tid": ensure_record_id(mem_id)},
            )
            classroom_results.extend(rows)

    return classroom_results


async def _compute_class_summary(
    classroom: Dict[str, Any],
) -> Dict[str, Any]:
    """Compute aggregate progress counters for a single classroom.

    All counts default to zero when no scoped study data exists.
    """
    classroom_id = _strip_prefix(str(classroom.get("id", "")))
    school_id = _strip_prefix(str(classroom.get("school_id", "")))
    classroom_name = classroom.get("name", "")

    # Enrollments
    enrollments = await repo_query(
        "SELECT * FROM class_enrollment WHERE classroom_id = $cid",
        {"cid": ensure_record_id(_ensure_prefixed(classroom_id, "classroom"))},
    )
    learner_count = len(enrollments)
    active_learner_count = sum(1 for e in enrollments if e.get("active", False))

    # Assignments
    assignments = await repo_query(
        "SELECT * FROM classroom_assignment WHERE classroom_id = $cid",
        {"cid": ensure_record_id(_ensure_prefixed(classroom_id, "classroom"))},
    )
    assignment_count = len(assignments)
    active_assignment_count = sum(1 for a in assignments if a.get("active", False))

    # Collect assigned notebook IDs for study/review scoping
    assigned_notebook_ids = []
    for a in assignments:
        nid = a.get("notebook_id")
        if nid:
            assigned_notebook_ids.append(str(nid))

    # Study/review counts (notebook-scoped since user_id may be null)
    recent_study_count = 0
    needs_practice_count = 0
    needs_review_count = 0
    remembered_count = 0
    last_activity: Optional[str] = None
    data_status = "ok"

    for raw_nid in assigned_notebook_ids:
        nid = _strip_prefix(raw_nid)
        full_nid = _ensure_prefixed(nid, "notebook")

        # Study sessions
        sessions = await repo_query(
            "SELECT count() AS cnt FROM study_session "
            "WHERE notebook_id = $nid AND status != 'abandoned' "
            "AND started_at > time::now() - 7d GROUP ALL",
            {"nid": ensure_record_id(full_nid)},
        )
        if sessions:
            recent_study_count += sessions[0].get("cnt", 0)

        # Leaf review state — needs_review
        review_states = await repo_query(
            "SELECT count() AS cnt FROM leaf_review_state "
            "WHERE notebook_id = $nid AND needs_review = true GROUP ALL",
            {"nid": ensure_record_id(full_nid)},
        )
        if review_states:
            needs_review_count += review_states[0].get("cnt", 0)

        # Leaf review events — remembered
        remembered_events = await repo_query(
            "SELECT count() AS cnt FROM leaf_review_event "
            "WHERE notebook_id = $nid AND event_type = 'remembered' "
            "AND created > time::now() - 7d GROUP ALL",
            {"nid": ensure_record_id(full_nid)},
        )
        if remembered_events:
            remembered_count += remembered_events[0].get("cnt", 0)

        # Last activity timestamp across all enrolled learners
        last_events = await repo_query(
            "SELECT created FROM leaf_review_event "
            "WHERE notebook_id = $nid ORDER BY created DESC LIMIT 1",
            {"nid": ensure_record_id(full_nid)},
        )
        if last_events:
            ts = str(last_events[0].get("created", ""))
            if ts and (last_activity is None or ts > last_activity):
                last_activity = ts

    # Check data scoping
    # If user_id fields are consistently null, note limited scoping
    if assigned_notebook_ids:
        sample = await repo_query(
            "SELECT user_id FROM leaf_review_event "
            "WHERE notebook_id = $nid LIMIT 1",
            {"nid": ensure_record_id(_ensure_prefixed(assigned_notebook_ids[0], "notebook"))},
        )
        if sample and not sample[0].get("user_id"):
            data_status = "limited_user_scoping"

    # Needs-practice: Delta weak-spot heuristic via event history.
    # Reuses LeafReviewEvent._compute_weak_spot_from_events() for semantic
    # consistency with ReviewQueue — ≥2 needs_review, no later remembered,
    # latest needs_review ≥ 1 hour old.
    needs_practice_count = await _compute_weak_spots_for_notebooks(
        assigned_notebook_ids
    )

    return {
        "classroom_id": classroom_id,
        "classroom_name": classroom_name,
        "subject": classroom.get("subject"),
        "grade_level": classroom.get("grade_level"),
        "school_id": school_id,
        "learner_count": learner_count,
        "active_learner_count": active_learner_count,
        "assignment_count": assignment_count,
        "active_assignment_count": active_assignment_count,
        "recent_study_session_count": recent_study_count,
        "needs_practice_leaf_count": needs_practice_count,
        "needs_review_leaf_count": needs_review_count,
        "remembered_leaf_count": remembered_count,
        "last_activity_at": last_activity,
        "data_status": data_status,
    }


# ============================================================================
# GET /api/teacher/classes
# ============================================================================


@router.get("/teacher/classes", response_model=List[TeacherClassSummary])
async def list_teacher_classes(request: Request):
    """List classrooms accessible to the current user with progress summaries.

    Global owner: all classrooms across all schools.
    School owner: classrooms in owned schools.
    Teacher: own classrooms only.
    """
    user = await get_current_user(request)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    classrooms = await _get_accessible_classrooms(user)
    results = []
    for cls in classrooms:
        summary = await _compute_class_summary(cls)
        results.append(TeacherClassSummary(**summary))

    return results


# ============================================================================
# GET /api/teacher/classes/{classroom_id}
# ============================================================================


@router.get("/teacher/classes/{classroom_id}", response_model=ClassProgressSummary)
async def get_class_progress(classroom_id: str, request: Request):
    """Get aggregate progress summary for a single classroom."""
    user = await get_current_user(request)
    await check_classroom_access(classroom_id, user, "teacher")

    full_id = _ensure_prefixed(classroom_id, "classroom")
    rows = await repo_query(
        "SELECT *, school_id FROM classroom WHERE id = $cid LIMIT 1",
        {"cid": ensure_record_id(full_id)},
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Classroom not found")

    summary = await _compute_class_summary(rows[0])
    return ClassProgressSummary(**summary)


# ============================================================================
# GET /api/teacher/classes/{classroom_id}/learners
# ============================================================================


@router.get(
    "/teacher/classes/{classroom_id}/learners",
    response_model=List[LearnerProgressSummary],
)
async def list_class_learners(classroom_id: str, request: Request):
    """List enrolled learners with per-learner progress summaries.

    Safe fields only — no reflection text, no auth data, no AI diagnosis.
    """
    user = await get_current_user(request)
    await check_classroom_access(classroom_id, user, "teacher")

    full_cid = _ensure_prefixed(classroom_id, "classroom")

    # Fetch enrollments
    enrollments = await repo_query(
        "SELECT * FROM class_enrollment WHERE classroom_id = $cid ORDER BY id",
        {"cid": ensure_record_id(full_cid)},
    )
    if not enrollments:
        return []

    # Collect membership IDs for learner identity
    membership_ids = []
    for enr in enrollments:
        mid = enr.get("learner_id")
        if mid:
            membership_ids.append(str(mid))

    # Resolve membership → user
    memberships_by_id: Dict[str, Dict[str, Any]] = {}
    user_display_names: Dict[str, str] = {}
    for raw_mid in membership_ids:
        mid = _strip_prefix(raw_mid)
        rows = await repo_query(
            "SELECT * FROM school_membership WHERE id = $mid LIMIT 1",
            {"mid": ensure_record_id(_ensure_prefixed(mid, "school_membership"))},
        )
        if rows:
            m = rows[0]
            memberships_by_id[mid] = m
            uid = m.get("user_id")
            if uid:
                uid_str = _strip_prefix(str(uid))
                user_rows = await repo_query(
                    "SELECT display_name FROM user WHERE id = $uid LIMIT 1",
                    {"uid": ensure_record_id(_ensure_prefixed(uid_str, "user"))},
                )
                if user_rows and user_rows[0].get("display_name"):
                    user_display_names[uid_str] = user_rows[0]["display_name"]

    # Get assigned notebook IDs for this classroom
    assignments = await repo_query(
        "SELECT notebook_id FROM classroom_assignment "
        "WHERE classroom_id = $cid AND active = true",
        {"cid": ensure_record_id(full_cid)},
    )
    assigned_nids = []
    for a in assignments:
        nid = a.get("notebook_id")
        if nid:
            assigned_nids.append(str(nid))

    results: List[LearnerProgressSummary] = []
    for enr in enrollments:
        enr_id = _strip_prefix(str(enr.get("id", "")))
        raw_learner_id = enr.get("learner_id", "")
        learner_id = _strip_prefix(str(raw_learner_id)) if raw_learner_id else ""
        membership = memberships_by_id.get(learner_id, {})
        uid_str = _strip_prefix(str(membership.get("user_id", ""))) if membership.get("user_id") else ""
        display_name = user_display_names.get(uid_str)

        # Per-learner counts scoped to assigned notebooks
        needs_review = 0
        remembered = 0
        last_act: Optional[str] = None

        for raw_nid in assigned_nids:
            nid = _strip_prefix(raw_nid)
            full_nid = _ensure_prefixed(nid, "notebook")

            # Filter by user_id if available
            user_filter = ""
            params: Dict[str, Any] = {"nid": ensure_record_id(full_nid)}

            if uid_str:
                user_filter = " AND user_id = $uid"
                params["uid"] = ensure_record_id(_ensure_prefixed(uid_str, "user"))

            # Needs review count
            rs = await repo_query(
                f"SELECT count() AS cnt FROM leaf_review_state "
                f"WHERE notebook_id = $nid AND needs_review = true{user_filter} GROUP ALL",
                params,
            )
            if rs:
                needs_review += rs[0].get("cnt", 0)

            # Remembered count (7 days)
            rem_params = {**params}
            rs2 = await repo_query(
                f"SELECT count() AS cnt FROM leaf_review_event "
                f"WHERE notebook_id = $nid AND event_type = 'remembered' "
                f"AND created > time::now() - 7d{user_filter} GROUP ALL",
                rem_params,
            )
            if rs2:
                remembered += rs2[0].get("cnt", 0)

            # Last activity
            act_params = {**params}
            rs3 = await repo_query(
                f"SELECT created FROM leaf_review_event "
                f"WHERE notebook_id = $nid{user_filter} "
                f"ORDER BY created DESC LIMIT 1",
                act_params,
            )
            if rs3:
                ts = str(rs3[0].get("created", ""))
                if ts and (last_act is None or ts > last_act):
                    last_act = ts

        # Needs-practice: Delta weak-spot heuristic using event history.
        # Reuses LeafReviewEvent._compute_weak_spot_from_events() — same
        # semantics as class-level summary and ReviewQueue.
        needs_practice = await _compute_weak_spots_for_notebooks(
            assigned_nids, uid_str if uid_str else None
        )

        results.append(LearnerProgressSummary(
            learner_id=learner_id,
            learner_display_name=display_name,
            enrollment_id=enr_id,
            enrollment_active=enr.get("active", True),
            needs_practice_leaf_count=needs_practice,
            needs_review_leaf_count=needs_review,
            remembered_leaf_count=remembered,
            last_activity_at=last_act,
        ))

    return results


# ============================================================================
# GET /api/teacher/classes/{classroom_id}/activity
# ============================================================================


@router.get(
    "/teacher/classes/{classroom_id}/activity",
    response_model=List[ClassActivityEntry],
)
async def list_class_activity(
    classroom_id: str,
    request: Request,
    limit: int = Query(50, ge=1, le=200, description="Max events to return"),
):
    """List recent review events for a classroom.

    Returns metadata only — no reflection text, no AI diagnosis.
    Learner IDs are included only when ``user_id`` is populated on the event.
    """
    user = await get_current_user(request)
    await check_classroom_access(classroom_id, user, "teacher")

    full_cid = _ensure_prefixed(classroom_id, "classroom")

    # Get assigned notebook IDs
    assignments = await repo_query(
        "SELECT notebook_id FROM classroom_assignment "
        "WHERE classroom_id = $cid AND active = true",
        {"cid": ensure_record_id(full_cid)},
    )
    assigned_nids = [str(a["notebook_id"]) for a in assignments if a.get("notebook_id")]

    if not assigned_nids:
        return []

    # Build OR filter for notebook IDs using SurrealDB-safe named params
    # ($0, $1 … are not valid SurrealDB identifiers — use $nid_0, $nid_1 …)
    filters: List[str] = []
    params: Dict[str, Any] = {}
    for i, nid in enumerate(assigned_nids):
        pname = f"nid_{i}"
        filters.append(f"notebook_id = ${pname}")
        params[pname] = ensure_record_id(str(nid))
    params["lim"] = limit
    notebook_filters = " OR ".join(filters)

    events = await repo_query(
        f"SELECT * FROM leaf_review_event "
        f"WHERE ({notebook_filters}) "
        f"ORDER BY created DESC LIMIT $lim",
        params,
    )

    results = []
    for ev in events:
        learner_id = None
        raw_uid = ev.get("user_id")
        if raw_uid:
            learner_id = _strip_prefix(str(raw_uid))

        results.append(ClassActivityEntry(
            event_id=_strip_prefix(str(ev.get("id", ""))),
            learner_id=learner_id,
            notebook_id=_strip_prefix(str(ev.get("notebook_id", ""))),
            note_id=_strip_prefix(str(ev.get("note_id", ""))),
            event_type=ev.get("event_type", ""),
            event_time=str(ev.get("created", "")),
        ))

    return results
