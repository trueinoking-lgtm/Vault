"""
Simple permission helpers for Vault school/class APIs.

Epsilon C4 — not full RBAC.  Tenancy filtering on learner data is still
deferred.  Global owners pass all checks automatically.
"""

from typing import Optional

from fastapi import HTTPException, Request
from loguru import logger

from api.auth import (
    _format_user,
    get_or_create_legacy_user,
    get_or_create_owner_user,
    resolve_session,
)
from vault_core.database.repository import ensure_record_id, repo_query
from vault_core.domain.school import (
    Classroom,
    SchoolMembership,
)
from vault_core.domain.user import User
from vault_core.exceptions import NotFoundError
from vault_core.utils.encryption import get_secret_from_env

# Role rank for hierarchical permission checks.
ROLE_RANK = {"owner": 3, "teacher": 2, "learner": 1}


# ---------------------------------------------------------------------------
# Helpers (reused from schools router)
# ---------------------------------------------------------------------------
def _strip_prefix(value: str) -> str:
    if ":" in value:
        return value.split(":", 1)[1]
    return value


def _ensure_prefixed(value: str, prefix: str) -> str:
    if ":" not in value:
        return f"{prefix}:{value}"
    return value


# ---------------------------------------------------------------------------
# User resolution
# ---------------------------------------------------------------------------
async def get_current_user(request: Request) -> Optional[User]:
    """Resolve the authenticated user from the request, or ``None``.

    Tries, in order:
    1. Session token (``auth_session`` lookup)
    2. ``VAULT_OWNER_PASSWORD`` (resolves to / creates global-owner User)
    3. ``VAULT_PASSWORD`` (resolves to / creates legacy User)
    """
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[7:]

    # 1) Session token
    try:
        user = await resolve_session(token)
        if user is not None:
            return user
    except Exception:
        logger.warning("Session resolution failed, falling back to password check")

    # 2) Owner password → global owner user
    owner_pw = get_secret_from_env("VAULT_OWNER_PASSWORD")
    if owner_pw and token == owner_pw:
        return await get_or_create_owner_user(token)

    # 3) API password → legacy user
    api_pw = get_secret_from_env("VAULT_PASSWORD")
    if api_pw and token == api_pw:
        return await get_or_create_legacy_user(token)

    return None


async def require_user(request: Request) -> User:
    """FastAPI dependency — require an authenticated user.

    Returns the ``User`` or raises ``401``.
    """
    user = await get_current_user(request)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


# ---------------------------------------------------------------------------
# Role checks (call inside endpoint handlers)
# ---------------------------------------------------------------------------
def require_global_owner(user: Optional[User]) -> User:
    """Check *user* is a global owner.  Raises ``401`` / ``403`` otherwise."""
    if user is None:
        raise HTTPException(
            status_code=401, detail="Not authenticated"
        )
    if not user.is_global_owner:
        raise HTTPException(
            status_code=403, detail="Global owner access required"
        )
    return user


async def check_school_role(
    school_id: str, user: Optional[User], min_role: str
) -> Optional[SchoolMembership]:
    """Verify *user* has at least *min_role* at *school_id*.

    Global owners always pass and return ``None``.
    Raises ``401`` if *user* is ``None``, ``403`` (or ``404``) otherwise.
    """
    if user is None:
        raise HTTPException(
            status_code=401, detail="Not authenticated"
        )
    if user.is_global_owner:
        return None

    full_sid = _ensure_prefixed(school_id, "school")
    user_id_str = _ensure_prefixed(str(user.id), "user")

    result = await repo_query(
        "SELECT * FROM school_membership WHERE "
        "school_id = $sid AND user_id = $uid AND active = true LIMIT 1",
        {
            "sid": ensure_record_id(full_sid),
            "uid": ensure_record_id(user_id_str),
        },
    )
    if not result:
        raise HTTPException(
            status_code=403, detail="Not a member of this school"
        )

    membership = SchoolMembership(**result[0])
    if ROLE_RANK.get(membership.role, 0) < ROLE_RANK.get(min_role, 0):
        raise HTTPException(
            status_code=403,
            detail=f"Requires '{min_role}' role or higher at this school",
        )
    return membership


async def check_classroom_access(
    classroom_id: str, user: Optional[User], min_role: str = "teacher"
) -> Classroom:
    """Verify *user* has at least *min_role* for the classroom's school.

    For ``min_role='teacher'`` also checks whether the user is the specific
    teacher assigned to this classroom (even if their school-level role is
    ``learner`` — although that would be unusual).

    Returns the ``Classroom`` if authorized.  Raises ``403`` / ``404``.
    """
    if user is None:
        raise HTTPException(
            status_code=401, detail="Not authenticated"
        )
    if user.is_global_owner:
        full_cid = _ensure_prefixed(classroom_id, "classroom")
        try:
            return await Classroom.get(full_cid)
        except NotFoundError:
            raise HTTPException(status_code=404, detail="Classroom not found")

    full_cid = _ensure_prefixed(classroom_id, "classroom")
    try:
        classroom = await Classroom.get(full_cid)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Classroom not found")

    school_id = _strip_prefix(str(classroom.school_id))

    # School-level role check
    try:
        await check_school_role(school_id, user, min_role)
        return classroom
    except HTTPException:
        if min_role != "teacher":
            raise
        # Fall through to teacher-specific check below

    # Teacher-of-classroom check: resolve teacher_id (school_membership)
    # and compare its user_id to the current user.
    teacher_mem_result = await repo_query(
        "SELECT * FROM school_membership WHERE id = $tid AND active = true LIMIT 1",
        {"tid": ensure_record_id(classroom.teacher_id)},
    )
    if teacher_mem_result:
        teacher_user_id = str(teacher_mem_result[0].get("user_id", ""))
        if _strip_prefix(teacher_user_id) == _strip_prefix(str(user.id)):
            return classroom

    raise HTTPException(
        status_code=403, detail="Not authorized for this classroom"
    )


async def check_membership_belongs_to_school(
    membership_id: str, school_id: str, user: Optional[User]
) -> SchoolMembership:
    """Verify a membership record exists at the given school and is manageable.

    Global owners pass.  School owners / teachers can manage memberships
    within their school.
    """
    if user is None:
        raise HTTPException(
            status_code=401, detail="Not authenticated"
        )
    if user.is_global_owner:
        full_mid = _ensure_prefixed(membership_id, "school_membership")
        try:
            return await SchoolMembership.get(full_mid)
        except NotFoundError:
            raise HTTPException(status_code=404, detail="Membership not found")

    # First verify the caller has the right role at the school
    await check_school_role(school_id, user, "owner")

    full_mid = _ensure_prefixed(membership_id, "school_membership")
    try:
        membership = await SchoolMembership.get(full_mid)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Membership not found")

    # Verify the membership actually belongs to this school
    mem_school_id = _strip_prefix(str(membership.school_id))
    if mem_school_id != _strip_prefix(school_id):
        raise HTTPException(
            status_code=404, detail="Membership not found at this school"
        )

    return membership
