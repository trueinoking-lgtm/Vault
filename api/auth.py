"""
Authentication middleware and session management for Vault API.

Provides:
- PasswordAuthMiddleware: dual-mode (password OR session token)
- create_session_for_user(): create a new auth session
- resolve_session(): validate a session token and return the User
- delete_session(): invalidate a session token
- get_or_create_owner_user(): bootstrap the global owner User record
"""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Request
from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from vault_core.database.repository import repo_query
from vault_core.domain.school import AuthSession
from vault_core.domain.user import User
from vault_core.utils.encryption import get_secret_from_env


def hash_account_password(password: str) -> str:
    """Hash a pilot-account password with scrypt and an independent salt."""
    if len(password) < 12:
        raise ValueError("Pilot account passwords must contain at least 12 characters")
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=2**14, r=8, p=1)
    return f"scrypt$16384$8$1${salt.hex()}${digest.hex()}"


def verify_account_password(password: str, encoded: str) -> bool:
    """Verify a pilot-account scrypt hash without exposing timing information."""
    try:
        algorithm, n, r, p, salt_hex, digest_hex = encoded.split("$", 5)
        if algorithm != "scrypt":
            return False
        actual = hashlib.scrypt(
            password.encode(),
            salt=bytes.fromhex(salt_hex),
            n=int(n),
            r=int(r),
            p=int(p),
        )
        return hmac.compare_digest(actual, bytes.fromhex(digest_hex))
    except (ValueError, TypeError):
        return False


async def resolve_session(token: str) -> Optional[User]:
    """Validate a session token and return the associated User, or None."""
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    result = await repo_query(
        "SELECT * FROM auth_session WHERE token_hash = $hash "
        "AND expires_at > time::now() LIMIT 1",
        {"hash": token_hash},
    )
    if not result:
        return None

    session_user_id = result[0].get("user_id")
    if not session_user_id:
        return None

    try:
        user = await User.get(str(session_user_id))
        if user and user.active:
            return user
    except Exception:
        logger.warning(f"Failed to resolve user for session {session_user_id}")
    return None


async def create_session_for_user(
    user: User, ttl_days: int = 30
) -> dict:
    """Create a new auth session.

    Returns dict with ``token`` (raw, one-time return) and
    ``expires_at`` (ISO-8601 string).
    """
    raw_token = secrets.token_hex(64)  # 128 hex chars
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(days=ttl_days)

    session = AuthSession(
        user_id=str(user.id),
        token_hash=token_hash,
        expires_at=expires_at,
    )
    await session.save()

    return {
        "token": raw_token,
        "expires_at": expires_at.isoformat(),
    }


async def delete_session(token: str) -> bool:
    """Delete/invalidate a session token. Best-effort; returns True."""
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    await repo_query(
        "DELETE auth_session WHERE token_hash = $hash",
        {"hash": token_hash},
    )
    return True


async def get_or_create_owner_user(password: str) -> User:
    """Find or create the global-owner User record.

    On first call, creates a new ``User`` with ``is_global_owner = true``.
    Subsequent calls return the existing record.
    """
    result = await repo_query(
        "SELECT * FROM user WHERE is_global_owner = true LIMIT 1"
    )
    if result:
        return User(**result[0])

    password_hash = hashlib.sha256(password.encode()).hexdigest()
    user = User(
        display_name="Administrator",
        email="admin@vault.local",
        password_hash=password_hash,
        is_global_owner=True,
        active=True,
    )
    await user.save()
    logger.info(
        f"Bootstrapped global owner user: {user.id} "
        f"(email=admin@vault.local)"
    )
    return user


async def get_or_create_legacy_user(password: str) -> User:
    """Find or create a generic legacy User for ``VAULT_PASSWORD`` auth.

    Returns a single shared non-owner User record.
    """
    result = await repo_query(
        "SELECT * FROM user WHERE email = 'user@vault.local' "
        "AND is_global_owner = false LIMIT 1"
    )
    if result:
        return User(**result[0])

    password_hash = hashlib.sha256(password.encode()).hexdigest()
    user = User(
        display_name="Vault User",
        email="user@vault.local",
        password_hash=password_hash,
        is_global_owner=False,
        active=True,
    )
    await user.save()
    return user


def _format_user(user: User) -> dict:
    """Convert a User domain model to a safe public dict."""
    user_id_str = str(user.id) if user.id else ""
    # Strip table prefix for consistency with other API responses
    clean_id = user_id_str.split(":", 1)[1] if ":" in user_id_str else user_id_str
    return {
        "id": clean_id,
        "display_name": user.display_name,
        "email": user.email,
        "is_global_owner": user.is_global_owner,
        "active": user.active,
    }


class PasswordAuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware to check authentication for all API requests.

    Dual-mode: accepts either a legacy ``VAULT_PASSWORD`` bearer token
    or a valid session token (both via ``Authorization: Bearer {value}``).
    Also supports ``VAULT_OWNER_PASSWORD`` for owner-level access.

    When a session token is validated, ``request.state.user`` is set to
    the resolved ``User`` object. Legacy password auth does not set
    ``request.state.user`` (no user identity).
    """

    def __init__(self, app, excluded_paths: Optional[list] = None):
        super().__init__(app)
        self.password = get_secret_from_env("VAULT_PASSWORD")
        self.owner_password = get_secret_from_env("VAULT_OWNER_PASSWORD")
        self.excluded_paths = excluded_paths or []

    async def dispatch(self, request: Request, call_next):
        # No password configured — skip auth entirely
        if not self.password and not self.owner_password:
            return await call_next(request)

        # Excluded paths (login, status, docs, etc.)
        if request.url.path in self.excluded_paths:
            return await call_next(request)

        # CORS preflight
        if request.method == "OPTIONS":
            return await call_next(request)

        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return JSONResponse(
                status_code=401,
                content={"detail": "Missing authorization header"},
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            scheme, credentials = auth_header.split(" ", 1)
            if scheme.lower() != "bearer":
                raise ValueError("Invalid authentication scheme")
        except ValueError:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid authorization header format"},
                headers={"WWW-Authenticate": "Bearer"},
            )

        # 1) Try session token
        try:
            user = await resolve_session(credentials)
            if user is not None:
                request.state.user = user
                return await call_next(request)
        except Exception:
            # Session lookup failure is non-fatal; fall through to password check
            pass

        # 2) Fallback: check against configured passwords
        if credentials == self.password or credentials == self.owner_password:
            return await call_next(request)

        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid password"},
            headers={"WWW-Authenticate": "Bearer"},
        )


# Legacy security scheme reference (for OpenAPI docs)
from fastapi.security import HTTPBearer  # noqa: E402

security = HTTPBearer(auto_error=False)

