"""
Authentication router for Vault API.

Provides login, logout, and session-identity endpoints alongside the
existing /api/auth/status endpoint.  This is a **coexistence** layer:
the old ``PasswordAuthMiddleware`` still works, and the new session
auth is available but not required.

Epsilon C3a — bootstrap session auth.  No role enforcement yet.
"""

from fastapi import APIRouter, HTTPException, Request
from loguru import logger

from api.auth import (
    _format_user,
    create_session_for_user,
    delete_session,
    get_or_create_legacy_user,
    get_or_create_owner_user,
    resolve_session,
    verify_account_password,
)
from api.models import (
    AuthLoginRequest,
    AuthLoginResponse,
    AuthMembershipResponse,
    AuthMeResponse,
    AuthUserResponse,
)
from vault_core.database.repository import ensure_record_id, repo_query
from vault_core.domain.user import User
from vault_core.utils.encryption import get_secret_from_env

router = APIRouter(tags=["auth"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _check_password(password: str) -> tuple[bool, bool]:
    """Return (is_valid, is_owner).

    Checks ``VAULT_OWNER_PASSWORD`` first, then ``VAULT_PASSWORD``.
    """
    owner_pw = get_secret_from_env("VAULT_OWNER_PASSWORD")
    if owner_pw and password == owner_pw:
        return True, True

    api_pw = get_secret_from_env("VAULT_PASSWORD")
    if api_pw and password == api_pw:
        return True, False

    return False, False


async def _get_memberships(user_id_str: str) -> list[AuthMembershipResponse]:
    """Query active school memberships for the given user.

    Returns a list of ``AuthMembershipResponse`` safe for public exposure.
    Returns an empty list if the user has no memberships or the query fails.
    """
    try:
        prefixed = f"user:{user_id_str}" if ":" not in user_id_str else user_id_str
        result = await repo_query(
            "SELECT id, school_id, role, active "
            "FROM school_membership "
            "WHERE user_id = $uid AND active = true",
            {"uid": ensure_record_id(prefixed)},
        )
    except Exception:
        logger.warning("Failed to query memberships for user %s", user_id_str)
        return []

    memberships: list[AuthMembershipResponse] = []
    for row in result:
        mid_raw = str(row.get("id", ""))
        sid_raw = str(row.get("school_id", ""))
        mid = mid_raw.split(":", 1)[1] if ":" in mid_raw else mid_raw
        sid = sid_raw.split(":", 1)[1] if ":" in sid_raw else sid_raw
        memberships.append(
            AuthMembershipResponse(
                membership_id=mid,
                school_id=sid,
                role=str(row.get("role", "learner")),
                active=bool(row.get("active", True)),
            )
        )
    return memberships


# ---------------------------------------------------------------------------
# GET /api/auth/status  (existing — preserved exactly)
# ---------------------------------------------------------------------------
@router.get("/auth/status")
async def get_auth_status():
    """Check if authentication is enabled.

    Returns whether a password is required to access the API.
    Supports Docker secrets via VAULT_PASSWORD_FILE.
    """
    auth_enabled = bool(get_secret_from_env("VAULT_PASSWORD")) or bool(
        get_secret_from_env("VAULT_OWNER_PASSWORD")
    )

    return {
        "auth_enabled": auth_enabled,
        "message": "Authentication is required"
        if auth_enabled
        else "Authentication is disabled",
    }


# ---------------------------------------------------------------------------
# POST /api/auth/login
# ---------------------------------------------------------------------------
@router.post("/auth/login", response_model=AuthLoginResponse)
async def login(body: AuthLoginRequest):
    """Authenticate with a password and receive a session token.

    Accepts either ``VAULT_OWNER_PASSWORD`` (creates/returns a global-owner
    user record) or ``VAULT_PASSWORD`` (creates/returns a generic legacy user).

    On first successful owner login, a ``User`` record with
    ``is_global_owner = true`` is bootstrapped automatically.
    """
    password = body.password

    try:
        if body.email:
            result = await repo_query(
                "SELECT * FROM user WHERE string::lowercase(email) = string::lowercase($email) AND active = true LIMIT 1",
                {"email": body.email.strip()},
            )
            if not result:
                raise HTTPException(status_code=401, detail="Invalid email or password")
            user = User(**result[0])
            if not verify_account_password(password, user.password_hash):
                raise HTTPException(status_code=401, detail="Invalid email or password")
            is_owner = bool(user.is_global_owner)
        else:
            is_valid, is_owner = _check_password(password)
            if not is_valid:
                raise HTTPException(status_code=401, detail="Invalid password")
            if is_owner:
                user = await get_or_create_owner_user(password)
            else:
                user = await get_or_create_legacy_user(password)

        session = await create_session_for_user(user)

        # Build response
        user_data = _format_user(user)
        return AuthLoginResponse(
            token=session["token"],
            expires_at=session["expires_at"],
            user=AuthUserResponse(**user_data),
            is_owner=is_owner,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Login failed")


# ---------------------------------------------------------------------------
# POST /api/auth/logout
# ---------------------------------------------------------------------------
@router.post("/auth/logout")
async def logout(request: Request):
    """Invalidate the current session token.

    Extracts the bearer token from the ``Authorization`` header and
    deletes the matching session record.  Best-effort — always returns
    200 even if the token was already invalid.
    """
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        await delete_session(token)

    return {"ok": True}


# ---------------------------------------------------------------------------
# GET /api/auth/me
# ---------------------------------------------------------------------------
@router.get("/auth/me", response_model=AuthMeResponse)
async def get_me(request: Request):
    """Return information about the currently authenticated user.

    Three modes:
    - **session**: a valid session token was resolved to a ``User``.
    - **password**: a legacy env-var password was used (no user identity).
    - **disabled**: no auth is configured; the API is open.
    """
    auth_header = request.headers.get("Authorization", "")

    # 1) Try session token
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        user = await resolve_session(token)
        if user is not None:
            user_data = _format_user(user)
            memberships = await _get_memberships(str(user.id))
            return AuthMeResponse(
                authenticated=True,
                auth_mode="session",
                user=AuthUserResponse(**user_data),
                owner_access=user.is_global_owner,
                memberships=memberships,
            )

    # 2) Check legacy password auth
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        is_valid, is_owner = _check_password(token)
        if is_valid:
            return AuthMeResponse(
                authenticated=True,
                auth_mode="password",
                user=None,
                owner_access=is_owner,
            )

    # 3) Auth disabled (no password configured)
    owner_pw = get_secret_from_env("VAULT_OWNER_PASSWORD")
    api_pw = get_secret_from_env("VAULT_PASSWORD")
    if not owner_pw and not api_pw:
        return AuthMeResponse(
            authenticated=True,
            auth_mode="disabled",
            user=None,
            owner_access=False,
        )

    # 4) Not authenticated
    return AuthMeResponse(
        authenticated=False,
        auth_mode="password",
        user=None,
        owner_access=False,
    )
