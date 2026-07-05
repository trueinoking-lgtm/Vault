"""
API router for school and classroom management endpoints.

Epsilon C4 — permission guards added.  Only authenticated users can
access these endpoints; school/class operations check the caller's
``school_membership`` role.

Legacy password auth (``VAULT_PASSWORD`` / ``VAULT_OWNER_PASSWORD``) is
resolved to a ``User`` record so permissions work the same way for both
session-based and password-based callers.
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Request
from loguru import logger

from api.models import (
    AssignmentProgressCreate,
    AssignmentProgressResponse,
    ClassEnrollmentCreate,
    ClassEnrollmentResponse,
    ClassroomAssignmentCreate,
    ClassroomAssignmentResponse,
    ClassroomCreate,
    ClassroomResponse,
    ClassroomUpdate,
    LearnerAssignmentResponse,
    SchoolCreate,
    SchoolMembershipCreate,
    SchoolMembershipResponse,
    SchoolMembershipUpdate,
    SchoolResponse,
    SchoolUpdate,
)
from api.permissions import (
    check_classroom_access,
    check_membership_belongs_to_school,
    check_school_role,
    get_current_user,
    require_global_owner,
)
from vault_core.database.repository import ensure_record_id, repo_query
from vault_core.domain.school import (
    AssignmentProgress,
    ClassEnrollment,
    Classroom,
    ClassroomAssignment,
    School,
    SchoolMembership,
)
from vault_core.exceptions import NotFoundError

router = APIRouter()

VALID_ROLES = frozenset({"owner", "teacher", "learner"})


# ---------------------------------------------------------------------------
# Helper: strip table prefix from a SurrealDB record ID string
# ---------------------------------------------------------------------------
def _strip_prefix(value: str) -> str:
    if ":" in value:
        return value.split(":", 1)[1]
    return value


# ---------------------------------------------------------------------------
# Helper: ensure a bare ID gets the expected prefix
# ---------------------------------------------------------------------------
def _ensure_prefixed(value: str, prefix: str) -> str:
    if ":" not in value:
        return f"{prefix}:{value}"
    return value


# ---------------------------------------------------------------------------
# Formatters
# ---------------------------------------------------------------------------
def _format_school(school: School) -> SchoolResponse:
    return SchoolResponse(
        id=_strip_prefix(str(school.id or "")),
        name=school.name,
        slug=school.slug,
        description=school.description,
        active=school.active,
        created=str(school.created) if school.created else "",
        updated=str(school.updated) if school.updated else "",
    )


def _format_classroom(clsroom: Classroom) -> ClassroomResponse:
    return ClassroomResponse(
        id=_strip_prefix(str(clsroom.id or "")),
        school_id=_strip_prefix(str(clsroom.school_id)),
        teacher_id=_strip_prefix(str(clsroom.teacher_id)),
        name=clsroom.name,
        description=clsroom.description,
        subject=clsroom.subject,
        grade_level=clsroom.grade_level,
        active=clsroom.active,
        created=str(clsroom.created) if clsroom.created else "",
        updated=str(clsroom.updated) if clsroom.updated else "",
    )


def _format_membership(mem: SchoolMembership) -> SchoolMembershipResponse:
    return SchoolMembershipResponse(
        id=_strip_prefix(str(mem.id or "")),
        school_id=_strip_prefix(str(mem.school_id)),
        user_id=_strip_prefix(str(mem.user_id)),
        role=mem.role,
        active=mem.active,
        joined_at=str(mem.joined_at) if mem.joined_at else None,
    )


def _format_enrollment(enr: ClassEnrollment) -> ClassEnrollmentResponse:
    return ClassEnrollmentResponse(
        id=_strip_prefix(str(enr.id or "")),
        classroom_id=_strip_prefix(str(enr.classroom_id)),
        learner_id=_strip_prefix(str(enr.learner_id)),
        enrolled_at=str(enr.enrolled_at) if enr.enrolled_at else None,
        active=enr.active,
    )


def _format_assignment(assn: ClassroomAssignment) -> ClassroomAssignmentResponse:
    return ClassroomAssignmentResponse(
        id=_strip_prefix(str(assn.id or "")),
        classroom_id=_strip_prefix(str(assn.classroom_id)),
        notebook_id=_strip_prefix(str(assn.notebook_id)) if assn.notebook_id else None,
        target_type=assn.target_type,
        target_id=_strip_prefix(str(assn.target_id)) if assn.target_id else None,
        title=assn.title,
        instructions=assn.instructions,
        due_at=str(assn.due_at) if assn.due_at else None,
        assigned_by=_strip_prefix(str(assn.assigned_by)),
        assigned_at=str(assn.assigned_at) if assn.assigned_at else None,
        archived_at=str(assn.archived_at) if assn.archived_at else None,
        active=assn.active,
    )


def _format_progress(prog: AssignmentProgress) -> AssignmentProgressResponse:
    return AssignmentProgressResponse(
        id=_strip_prefix(str(prog.id or "")),
        assignment_id=_strip_prefix(str(prog.assignment_id)),
        classroom_id=_strip_prefix(str(prog.classroom_id)),
        learner_id=_strip_prefix(str(prog.learner_id)),
        status=prog.status,
        completed_at=str(prog.completed_at) if prog.completed_at else None,
        created=str(prog.created) if prog.created else None,
        updated=str(prog.updated) if prog.updated else None,
    )


# =========================================================================
# Schools
# =========================================================================


@router.post("/schools", response_model=SchoolResponse)
async def create_school(data: SchoolCreate, request: Request):
    """Create a new school.  Global owner only."""
    user = await get_current_user(request)
    require_global_owner(user)

    try:
        school = School(
            name=data.name,
            slug=data.slug,
            description=data.description,
            settings=data.settings,
        )
        await school.save()
        return _format_school(school)
    except Exception as e:
        logger.error(f"Error creating school: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/schools", response_model=List[SchoolResponse])
async def list_schools(
    request: Request,
    active: Optional[bool] = Query(None, description="Filter by active status"),
    order_by: str = Query("name asc", description="Order by field and direction"),
):
    """List schools.  Global owner only (member-scoped listing deferred)."""
    user = await get_current_user(request)
    require_global_owner(user)

    try:
        schools = await School.get_all(order_by=order_by)
        if active is not None:
            schools = [s for s in schools if s.active == active]
        return [_format_school(s) for s in schools]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing schools: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/schools/{school_id}", response_model=SchoolResponse)
async def get_school(school_id: str, request: Request):
    """Get a single school.  Global owner or school member."""
    user = await get_current_user(request)
    await check_school_role(school_id, user, "learner")

    try:
        full_id = _ensure_prefixed(school_id, "school")
        school = await School.get(full_id)
        return _format_school(school)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="School not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching school {school_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/schools/{school_id}", response_model=SchoolResponse)
async def update_school(school_id: str, data: SchoolUpdate, request: Request):
    """Update a school.  Global owner or school owner."""
    user = await get_current_user(request)
    await check_school_role(school_id, user, "owner")

    try:
        full_id = _ensure_prefixed(school_id, "school")
        school = await School.get(full_id)

        update_fields = data.model_dump(exclude_unset=True)
        for field, value in update_fields.items():
            setattr(school, field, value)

        await school.save()
        return _format_school(school)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="School not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating school {school_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================================
# Memberships
# =========================================================================


@router.post(
    "/schools/{school_id}/members",
    response_model=SchoolMembershipResponse,
)
async def create_membership(school_id: str, data: SchoolMembershipCreate, request: Request):
    """Add a member to a school.  Global owner or school owner."""
    user = await get_current_user(request)
    await check_school_role(school_id, user, "owner")

    try:
        if data.role not in VALID_ROLES:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid role '{data.role}'. Must be one of: {sorted(VALID_ROLES)}",
            )

        membership = SchoolMembership(
            school_id=_ensure_prefixed(school_id, "school"),
            user_id=_ensure_prefixed(data.user_id, "user"),
            role=data.role,
        )
        await membership.save()
        return _format_membership(membership)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating membership: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/schools/{school_id}/members",
    response_model=List[SchoolMembershipResponse],
)
async def list_memberships(
    school_id: str,
    request: Request,
    role: Optional[str] = Query(None, description="Filter by role"),
    active: Optional[bool] = Query(None, description="Filter by active status"),
):
    """List members of a school.  Global owner or school owner."""
    user = await get_current_user(request)
    await check_school_role(school_id, user, "owner")

    try:
        full_school_id = _ensure_prefixed(school_id, "school")
        conditions = ["school_id = $sid"]
        params: Dict[str, Any] = {"sid": ensure_record_id(full_school_id)}
        if role:
            conditions.append("role = $role")
            params["role"] = role
        if active is not None:
            conditions.append("active = $active")
            params["active"] = active

        where_clause = " AND ".join(conditions)
        result = await repo_query(
            f"SELECT * FROM school_membership WHERE {where_clause} ORDER BY role, id",
            params,
        )
        members = [SchoolMembership(**r) for r in result]
        return [_format_membership(m) for m in members]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing memberships for school {school_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch(
    "/schools/{school_id}/members/{membership_id}",
    response_model=SchoolMembershipResponse,
)
async def update_membership(
    school_id: str,
    membership_id: str,
    data: SchoolMembershipUpdate,
    request: Request,
):
    """Update a school membership.  Global owner or school owner."""
    user = await get_current_user(request)
    await check_school_role(school_id, user, "owner")

    try:
        membership = await check_membership_belongs_to_school(
            membership_id, school_id, user
        )

        update_fields = data.model_dump(exclude_unset=True)
        for field, value in update_fields.items():
            if field == "role" and value is not None and value not in VALID_ROLES:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid role '{value}'. Must be one of: {sorted(VALID_ROLES)}",
                )
            setattr(membership, field, value)

        await membership.save()
        return _format_membership(membership)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Membership not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating membership {membership_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================================
# Classrooms
# =========================================================================


@router.post(
    "/schools/{school_id}/classrooms",
    response_model=ClassroomResponse,
)
async def create_classroom(school_id: str, data: ClassroomCreate, request: Request):
    """Create a classroom within a school.  Global owner, school owner, or teacher."""
    user = await get_current_user(request)
    await check_school_role(school_id, user, "teacher")

    try:
        clsroom = Classroom(
            school_id=_ensure_prefixed(school_id, "school"),
            teacher_id=_ensure_prefixed(data.teacher_id, "school_membership"),
            name=data.name,
            description=data.description,
            subject=data.subject,
            grade_level=data.grade_level,
        )
        await clsroom.save()
        return _format_classroom(clsroom)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating classroom: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/schools/{school_id}/classrooms",
    response_model=List[ClassroomResponse],
)
async def list_classrooms(
    school_id: str,
    request: Request,
    active: Optional[bool] = Query(None, description="Filter by active status"),
):
    """List classrooms in a school.  Global owner or school member."""
    user = await get_current_user(request)
    await check_school_role(school_id, user, "learner")

    try:
        full_school_id = _ensure_prefixed(school_id, "school")
        conditions = ["school_id = $sid"]
        params: Dict[str, Any] = {"sid": ensure_record_id(full_school_id)}
        if active is not None:
            conditions.append("active = $active")
            params["active"] = active

        where_clause = " AND ".join(conditions)
        result = await repo_query(
            f"SELECT * FROM classroom WHERE {where_clause} ORDER BY name",
            params,
        )
        classrooms = [Classroom(**r) for r in result]
        return [_format_classroom(c) for c in classrooms]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing classrooms for school {school_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/classrooms/{classroom_id}",
    response_model=ClassroomResponse,
)
async def get_classroom(classroom_id: str, request: Request):
    """Get a single classroom.  Global owner or school member."""
    user = await get_current_user(request)
    # Resolve classroom to get school_id for membership check
    await check_classroom_access(classroom_id, user, "learner")

    try:
        full_id = _ensure_prefixed(classroom_id, "classroom")
        clsroom = await Classroom.get(full_id)
        return _format_classroom(clsroom)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Classroom not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching classroom {classroom_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch(
    "/classrooms/{classroom_id}",
    response_model=ClassroomResponse,
)
async def update_classroom(classroom_id: str, data: ClassroomUpdate, request: Request):
    """Update a classroom.  Global owner, school owner, or classroom teacher."""
    user = await get_current_user(request)
    classroom = await check_classroom_access(classroom_id, user, "teacher")

    try:
        update_fields = data.model_dump(exclude_unset=True)
        for field, value in update_fields.items():
            setattr(classroom, field, value)

        await classroom.save()
        return _format_classroom(classroom)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Classroom not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating classroom {classroom_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================================
# Enrollments
# =========================================================================


@router.post(
    "/classrooms/{classroom_id}/enrollments",
    response_model=ClassEnrollmentResponse,
)
async def create_enrollment(classroom_id: str, data: ClassEnrollmentCreate, request: Request):
    """Enroll a learner in a classroom.  Global owner, school owner, or teacher."""
    user = await get_current_user(request)
    await check_classroom_access(classroom_id, user, "teacher")

    try:
        enrollment = ClassEnrollment(
            classroom_id=_ensure_prefixed(classroom_id, "classroom"),
            learner_id=_ensure_prefixed(data.learner_id, "school_membership"),
        )
        await enrollment.save()
        return _format_enrollment(enrollment)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating enrollment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/classrooms/{classroom_id}/enrollments",
    response_model=List[ClassEnrollmentResponse],
)
async def list_enrollments(
    classroom_id: str,
    request: Request,
    active: Optional[bool] = Query(None, description="Filter by active status"),
):
    """List enrollments for a classroom.  Global owner, school owner, or teacher."""
    user = await get_current_user(request)
    await check_classroom_access(classroom_id, user, "teacher")

    try:
        full_classroom_id = _ensure_prefixed(classroom_id, "classroom")
        conditions = ["classroom_id = $cid"]
        params: Dict[str, Any] = {"cid": ensure_record_id(full_classroom_id)}
        if active is not None:
            conditions.append("active = $active")
            params["active"] = active

        where_clause = " AND ".join(conditions)
        result = await repo_query(
            f"SELECT * FROM class_enrollment WHERE {where_clause} ORDER BY id",
            params,
        )
        enrollments = [ClassEnrollment(**r) for r in result]
        return [_format_enrollment(e) for e in enrollments]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing enrollments for classroom {classroom_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete(
    "/classrooms/{classroom_id}/enrollments/{enrollment_id}",
    response_model=ClassEnrollmentResponse,
)
async def deactivate_enrollment(
    classroom_id: str,
    enrollment_id: str,
    request: Request,
):
    """Soft-deactivate an enrollment.  Global owner, school owner, or teacher."""
    user = await get_current_user(request)
    await check_classroom_access(classroom_id, user, "teacher")

    try:
        full_id = _ensure_prefixed(enrollment_id, "class_enrollment")
        enrollment = await ClassEnrollment.get(full_id)
        enrollment.active = False
        await enrollment.save()
        return _format_enrollment(enrollment)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deactivating enrollment {enrollment_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================================
# Assignments
# =========================================================================


@router.post(
    "/classrooms/{classroom_id}/assignments",
    response_model=ClassroomAssignmentResponse,
)
async def create_assignment(
    classroom_id: str,
    data: ClassroomAssignmentCreate,
    request: Request,
):
    """Assign a learning object to a classroom. Global owner, school owner, or teacher."""
    user = await get_current_user(request)
    await check_classroom_access(classroom_id, user, "teacher")

    try:
        # Build assignment fields
        kwargs: Dict[str, Any] = {
            "classroom_id": _ensure_prefixed(classroom_id, "classroom"),
            "assigned_by": _ensure_prefixed(data.assigned_by, "school_membership"),
        }
        # Legacy notebook support
        if data.notebook_id:
            kwargs["notebook_id"] = _ensure_prefixed(data.notebook_id, "notebook")
        # New target-based assignment
        if data.target_type:
            kwargs["target_type"] = data.target_type
        if data.target_id:
            kwargs["target_id"] = data.target_id
        if data.title:
            kwargs["title"] = data.title
        if data.instructions:
            kwargs["instructions"] = data.instructions
        if data.due_at:
            from datetime import datetime as _dt, timezone

            kwargs["due_at"] = _dt.fromisoformat(data.due_at.replace("Z", "+00:00"))

        assignment = ClassroomAssignment(**kwargs)
        await assignment.save()
        return _format_assignment(assignment)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating assignment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/classrooms/{classroom_id}/assignments",
    response_model=List[ClassroomAssignmentResponse],
)
async def list_assignments(
    classroom_id: str,
    request: Request,
    active: Optional[bool] = Query(None, description="Filter by active status"),
):
    """List assignments for a classroom.  Global owner or school member."""
    user = await get_current_user(request)
    await check_classroom_access(classroom_id, user, "learner")

    try:
        full_classroom_id = _ensure_prefixed(classroom_id, "classroom")
        conditions = ["classroom_id = $cid"]
        params: Dict[str, Any] = {"cid": ensure_record_id(full_classroom_id)}
        if active is not None:
            conditions.append("active = $active")
            params["active"] = active

        where_clause = " AND ".join(conditions)
        result = await repo_query(
            f"SELECT * FROM classroom_assignment WHERE {where_clause} ORDER BY assigned_at",
            params,
        )
        assignments = [ClassroomAssignment(**r) for r in result]
        return [_format_assignment(a) for a in assignments]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing assignments for classroom {classroom_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete(
    "/classrooms/{classroom_id}/assignments/{assignment_id}",
    response_model=ClassroomAssignmentResponse,
)
async def deactivate_assignment(
    classroom_id: str,
    assignment_id: str,
    request: Request,
):
    """Soft-deactivate an assignment. Global owner, school owner, or teacher."""
    user = await get_current_user(request)
    await check_classroom_access(classroom_id, user, "teacher")

    try:
        full_id = _ensure_prefixed(assignment_id, "classroom_assignment")
        assignment = await ClassroomAssignment.get(full_id)
        assignment.active = False
        await assignment.save()
        return _format_assignment(assignment)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Assignment not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deactivating assignment {assignment_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =========================================================================
# Learner Assignment Endpoints (E2.1)
# =========================================================================


@router.get(
    "/assignments",
    response_model=List[LearnerAssignmentResponse],
)
async def list_my_assignments(request: Request):
    """List assignments for the current learner across all enrolled classrooms."""
    user = await get_current_user(request)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        user_id_str = _ensure_prefixed(str(user.id), "user")

        # Find all classroom_ids where this user is an enrolled learner
        enrollments = await repo_query(
            "SELECT classroom_id FROM class_enrollment "
            "WHERE learner_id IN "
            "(SELECT id FROM school_membership WHERE user_id = $uid AND active = true) "
            "AND active = true",
            {"uid": ensure_record_id(user_id_str)},
        )

        if not enrollments:
            return []

        classroom_ids = [
            ensure_record_id(_ensure_prefixed(str(e["classroom_id"]), "classroom"))
            for e in enrollments
        ]

        # Fetch active assignments for those classrooms
        placeholders = ", ".join(f"$cid{i}" for i in range(len(classroom_ids)))
        params: Dict[str, Any] = {
            f"cid{i}": cid for i, cid in enumerate(classroom_ids)
        }
        assignments = await repo_query(
            f"SELECT * FROM classroom_assignment "
            f"WHERE classroom_id IN [{placeholders}] AND active = true "
            f"ORDER BY assigned_at DESC",
            params,
        )

        # Fetch progress records for this learner
        learner_memberships = await repo_query(
            "SELECT id FROM school_membership "
            "WHERE user_id = $uid AND active = true",
            {"uid": ensure_record_id(user_id_str)},
        )
        membership_ids = [
            _strip_prefix(str(m["id"])) for m in learner_memberships
        ]

        progress_map: Dict[str, Any] = {}
        if membership_ids and assignments:
            prog_placeholders = ", ".join(f"$lid{i}" for i in range(len(membership_ids)))
            prog_params: Dict[str, Any] = {
                f"lid{i}": ensure_record_id(_ensure_prefixed(mid, "school_membership"))
                for i, mid in enumerate(membership_ids)
            }
            assignment_ids = [
                ensure_record_id(_ensure_prefixed(str(a["id"]), "classroom_assignment"))
                for a in assignments
            ]
            assign_placeholders = ", ".join(f"$aid{i}" for i in range(len(assignment_ids)))
            prog_params.update({
                f"aid{i}": aid for i, aid in enumerate(assignment_ids)
            })
            progress_records = await repo_query(
                f"SELECT * FROM assignment_progress "
                f"WHERE learner_id IN [{prog_placeholders}] "
                f"AND assignment_id IN [{assign_placeholders}]",
                prog_params,
            )
            for p in progress_records:
                aid = _strip_prefix(str(p.get("assignment_id", "")))
                progress_map[aid] = p

        # Build learner-facing response (no private learner text, no AI diagnosis)
        result: List[LearnerAssignmentResponse] = []
        for a in assignments:
            a_id = _strip_prefix(str(a.get("id", "")))
            prog = progress_map.get(a_id)
            result.append(LearnerAssignmentResponse(
                id=a_id,
                classroom_id=_strip_prefix(str(a.get("classroom_id", ""))),
                target_type=a.get("target_type"),
                target_id=a.get("target_id"),
                title=a.get("title"),
                instructions=a.get("instructions"),
                due_at=str(a["due_at"]) if a.get("due_at") else None,
                assigned_at=str(a["assigned_at"]) if a.get("assigned_at") else None,
                status=prog.get("status", "not_started") if prog else "not_started",
                completed_at=str(prog["completed_at"]) if prog and prog.get("completed_at") else None,
                progress_id=_strip_prefix(str(prog["id"])) if prog else None,
            ))

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing learner assignments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post(
    "/assignments/{assignment_id}/complete",
    response_model=AssignmentProgressResponse,
)
async def mark_assignment_complete(
    assignment_id: str,
    data: AssignmentProgressCreate,
    request: Request,
):
    """Mark an assignment as completed. Learner can only mark their own work."""
    user = await get_current_user(request)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        # Verify the assignment exists
        full_assignment_id = _ensure_prefixed(assignment_id, "classroom_assignment")
        assignment = await ClassroomAssignment.get(full_assignment_id)

        # Verify the learner is enrolled in this classroom
        user_id_str = _ensure_prefixed(str(user.id), "user")
        enrollments = await repo_query(
            "SELECT id FROM class_enrollment "
            "WHERE classroom_id = $cid AND active = true "
            "AND learner_id IN "
            "(SELECT id FROM school_membership WHERE user_id = $uid AND active = true)",
            {
                "cid": ensure_record_id(
                    _ensure_prefixed(str(assignment.classroom_id), "classroom")
                ),
                "uid": ensure_record_id(user_id_str),
            },
        )
        if not enrollments:
            raise HTTPException(
                status_code=403, detail="Not enrolled in this classroom"
            )

        # Find the learner's school_membership ID
        learner_memberships = await repo_query(
            "SELECT id FROM school_membership "
            "WHERE user_id = $uid AND active = true",
            {"uid": ensure_record_id(user_id_str)},
        )
        if not learner_memberships:
            raise HTTPException(
                status_code=403, detail="No school membership found"
            )
        learner_mem_id = _strip_prefix(str(learner_memberships[0]["id"]))

        # Check if progress already exists
        existing = await repo_query(
            "SELECT * FROM assignment_progress "
            "WHERE assignment_id = $aid AND learner_id = $lid LIMIT 1",
            {
                "aid": ensure_record_id(full_assignment_id),
                "lid": ensure_record_id(
                    _ensure_prefixed(learner_mem_id, "school_membership")
                ),
            },
        )

        if existing:
            # Update existing progress
            prog_id = _strip_prefix(str(existing[0]["id"]))
            prog = await AssignmentProgress.get(
                _ensure_prefixed(prog_id, "assignment_progress")
            )
            prog.status = "completed"
            from datetime import datetime as _dt, timezone

            prog.completed_at = _dt.now(tz=timezone.utc)
            await prog.save()
        else:
            # Create new progress record
            prog = AssignmentProgress(
                assignment_id=full_assignment_id,
                classroom_id=_ensure_prefixed(
                    str(assignment.classroom_id), "classroom"
                ),
                learner_id=_ensure_prefixed(learner_mem_id, "school_membership"),
                status="completed",
            )
            from datetime import datetime as _dt, timezone

            prog.completed_at = _dt.now(tz=timezone.utc)
            await prog.save()

        return _format_progress(prog)
    except HTTPException:
        raise
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Assignment not found")
    except Exception as e:
        logger.error(f"Error marking assignment complete: {e}")
        raise HTTPException(status_code=500, detail=str(e))
