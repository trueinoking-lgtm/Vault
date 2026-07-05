"""
Tests for session authentication API endpoints (Epsilon C3a / Phase F3a).

Uses mocked env vars and domain models.  The existing conftest.py sets
VAULT_PASSWORD="" so the middleware is disabled during tests, allowing
us to test endpoints without interference.
"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from api.main import app

    return TestClient(app)


# =========================================================================
# GET /api/auth/status  (existing — must remain unchanged)
# =========================================================================


class TestAuthStatus:
    """GET /api/auth/status — existing endpoint preserved."""

    def test_returns_disabled_when_no_password(self, client):
        """When no password is configured, auth is disabled."""
        response = client.get("/api/auth/status")
        assert response.status_code == 200
        data = response.json()
        assert data["auth_enabled"] is False
        assert "disabled" in data["message"]

    @patch("api.routers.auth.get_secret_from_env")
    def test_returns_enabled_when_password_set(self, mock_get_secret, client):
        """When a password is configured, auth is enabled."""
        mock_get_secret.side_effect = lambda key: {
            "VAULT_OWNER_PASSWORD": None,
            "VAULT_PASSWORD": "secr3t",
        }.get(key)

        response = client.get("/api/auth/status")
        assert response.status_code == 200
        data = response.json()
        assert data["auth_enabled"] is True

    @patch("api.routers.auth.get_secret_from_env")
    def test_returns_enabled_for_owner_password(self, mock_get_secret, client):
        """When only owner password is set, auth is enabled."""
        mock_get_secret.side_effect = lambda key: {
            "VAULT_OWNER_PASSWORD": "owner-pw",
            "VAULT_PASSWORD": None,
        }.get(key)

        response = client.get("/api/auth/status")
        assert response.status_code == 200
        data = response.json()
        assert data["auth_enabled"] is True


# =========================================================================
# POST /api/auth/login
# =========================================================================


class TestLogin:
    """POST /api/auth/login"""

    @patch("api.routers.auth.get_secret_from_env")
    @patch("api.routers.auth.get_or_create_owner_user")
    @patch("api.routers.auth.create_session_for_user")
    def test_login_with_owner_password(
        self, mock_create_session, mock_get_or_create, mock_get_secret, client
    ):
        """Valid owner password returns session token and user info."""
        mock_get_secret.side_effect = lambda key: {
            "VAULT_OWNER_PASSWORD": "owner-pw",
            "VAULT_PASSWORD": "api-pw",
        }.get(key)

        mock_user = AsyncMock()
        mock_user.id = "user:owner1"
        mock_user.display_name = "Administrator"
        mock_user.email = "admin@vault.local"
        mock_user.is_global_owner = True
        mock_user.active = True
        mock_get_or_create.return_value = mock_user

        mock_create_session.return_value = {
            "token": "raw-session-token-abc123",
            "expires_at": "2026-08-04T12:00:00+00:00",
        }

        response = client.post("/api/auth/login", json={"password": "owner-pw"})

        assert response.status_code == 200
        data = response.json()
        assert data["token"] == "raw-session-token-abc123"
        assert data["is_owner"] is True
        assert data["user"]["display_name"] == "Administrator"
        assert data["user"]["is_global_owner"] is True
        assert data["user"]["email"] == "admin@vault.local"

        # Verify the owner user was created/reused
        mock_get_or_create.assert_called_once_with("owner-pw")
        mock_create_session.assert_called_once_with(mock_user)

    @patch("api.routers.auth.get_secret_from_env")
    @patch("api.routers.auth.get_or_create_legacy_user")
    @patch("api.routers.auth.create_session_for_user")
    def test_login_with_api_password(
        self, mock_create_session, mock_get_or_create, mock_get_secret, client
    ):
        """Valid API password creates a legacy session (non-owner)."""
        mock_get_secret.side_effect = lambda key: {
            "VAULT_OWNER_PASSWORD": "owner-pw",
            "VAULT_PASSWORD": "api-pw",
        }.get(key)

        mock_user = AsyncMock()
        mock_user.id = "user:legacy1"
        mock_user.display_name = "Vault User"
        mock_user.email = "user@vault.local"
        mock_user.is_global_owner = False
        mock_user.active = True
        mock_get_or_create.return_value = mock_user

        mock_create_session.return_value = {
            "token": "legacy-session-token",
            "expires_at": "2026-08-04T12:00:00+00:00",
        }

        response = client.post("/api/auth/login", json={"password": "api-pw"})

        assert response.status_code == 200
        data = response.json()
        assert data["token"] == "legacy-session-token"
        assert data["is_owner"] is False
        assert data["user"]["is_global_owner"] is False
        assert data["user"]["display_name"] == "Vault User"

    @patch("api.routers.auth.get_secret_from_env")
    def test_login_with_invalid_password(self, mock_get_secret, client):
        """Wrong password returns 401."""
        mock_get_secret.side_effect = lambda key: {
            "VAULT_OWNER_PASSWORD": "owner-pw",
            "VAULT_PASSWORD": "api-pw",
        }.get(key)

        response = client.post("/api/auth/login", json={"password": "wrong-password"})

        assert response.status_code == 401

    @patch("api.routers.auth.get_secret_from_env")
    def test_login_with_empty_password(self, mock_get_secret, client):
        """Empty password returns 401."""
        mock_get_secret.side_effect = lambda key: {
            "VAULT_OWNER_PASSWORD": "owner-pw",
            "VAULT_PASSWORD": "api-pw",
        }.get(key)

        response = client.post("/api/auth/login", json={"password": ""})

        assert response.status_code == 401


# =========================================================================
# GET /api/auth/me
# =========================================================================


class TestAuthMe:
    """GET /api/auth/me — existing session/password response."""

    @patch("api.routers.auth.resolve_session")
    @patch("api.routers.auth._get_memberships")
    def test_me_with_valid_session(self, mock_get_memberships, mock_resolve, client):
        """Valid session token returns user profile and empty memberships."""
        mock_user = AsyncMock()
        mock_user.id = "user:owner1"
        mock_user.display_name = "Administrator"
        mock_user.email = "admin@vault.local"
        mock_user.is_global_owner = True
        mock_user.active = True
        mock_resolve.return_value = mock_user
        mock_get_memberships.return_value = []

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer valid-session-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is True
        assert data["auth_mode"] == "session"
        assert data["user"]["display_name"] == "Administrator"
        assert data["owner_access"] is True
        assert data["memberships"] == []

    @patch("api.routers.auth.resolve_session")
    @patch("api.routers.auth._get_memberships")
    def test_me_with_non_owner_session(self, mock_get_memberships, mock_resolve, client):
        """Non-owner user session returns owner_access=False and memberships."""
        mock_user = AsyncMock()
        mock_user.id = "user:legacy1"
        mock_user.display_name = "Vault User"
        mock_user.email = "user@vault.local"
        mock_user.is_global_owner = False
        mock_user.active = True
        mock_resolve.return_value = mock_user
        mock_get_memberships.return_value = []

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer valid-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is True
        assert data["auth_mode"] == "session"
        assert data["user"]["is_global_owner"] is False
        assert data["owner_access"] is False
        assert data["memberships"] == []

    @patch("api.routers.auth.resolve_session")
    @patch("api.routers.auth._check_password")
    def test_me_with_legacy_password(
        self, mock_check_pw, mock_resolve, client
    ):
        """Legacy password auth returns password mode (no user, no memberships)."""
        mock_resolve.return_value = None
        mock_check_pw.return_value = (True, True)

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer owner-password-legacy"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is True
        assert data["auth_mode"] == "password"
        assert data["user"] is None
        assert data["owner_access"] is True
        assert data["memberships"] == []

    def test_me_when_auth_disabled(self, client):
        """When no password configured, returns disabled mode with no memberships."""
        response = client.get("/api/auth/me")

        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is True
        assert data["auth_mode"] == "disabled"
        assert data["user"] is None
        assert data["memberships"] == []

    @patch("api.routers.auth.resolve_session")
    @patch("api.routers.auth._check_password")
    @patch("api.routers.auth.get_secret_from_env")
    def test_me_not_authenticated(
        self, mock_get_secret, mock_check_pw, mock_resolve, client
    ):
        """No valid auth returns unauthenticated response."""
        mock_resolve.return_value = None
        mock_check_pw.return_value = (False, False)
        mock_get_secret.side_effect = lambda key: {
            "VAULT_OWNER_PASSWORD": "owner-pw",
            "VAULT_PASSWORD": "api-pw",
        }.get(key)

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is False
        assert data["auth_mode"] == "password"
        assert data["user"] is None
        assert data["memberships"] == []


# =========================================================================
# GET /api/auth/me — membership data (Phase F3a)
# =========================================================================


class TestAuthMeMemberships:
    """Verify that /api/auth/me returns safe membership data."""

    @patch("api.routers.auth.repo_query")
    @patch("api.routers.auth.resolve_session")
    def test_session_user_with_teacher_membership(
        self, mock_resolve_session, mock_repo_query, client
    ):
        """Session user with an active teacher membership sees it in response."""
        user = _make_mock_user(is_global_owner=False, user_id="user:teacher1")
        mock_resolve_session.return_value = user
        mock_repo_query.return_value = [
            _make_mock_membership_row(
                membership_id="school_membership:m1",
                school_id="school:s1",
                role="teacher",
                active=True,
            ),
        ]

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer test-session-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is True
        assert data["auth_mode"] == "session"
        assert data["owner_access"] is False
        assert len(data["memberships"]) == 1
        mem = data["memberships"][0]
        assert mem["membership_id"] == "m1"
        assert mem["school_id"] == "s1"
        assert mem["role"] == "teacher"
        assert mem["active"] is True

    @patch("api.routers.auth.repo_query")
    @patch("api.routers.auth.resolve_session")
    def test_session_user_with_school_owner_membership(
        self, mock_resolve_session, mock_repo_query, client
    ):
        """Session user with an active school-owner membership sees it."""
        user = _make_mock_user(is_global_owner=False, user_id="user:so1")
        mock_resolve_session.return_value = user
        mock_repo_query.return_value = [
            _make_mock_membership_row(
                membership_id="school_membership:m2",
                school_id="school:s2",
                role="owner",
                active=True,
            ),
        ]

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer test-session-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data["memberships"]) == 1
        mem = data["memberships"][0]
        assert mem["role"] == "owner"

    @patch("api.routers.auth.repo_query")
    @patch("api.routers.auth.resolve_session")
    def test_session_user_no_memberships(
        self, mock_resolve_session, mock_repo_query, client
    ):
        """Session user with no memberships gets empty list."""
        user = _make_mock_user(is_global_owner=False, user_id="user:learner1")
        mock_resolve_session.return_value = user
        mock_repo_query.return_value = []

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer test-session-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is True
        assert data["memberships"] == []

    @patch("api.routers.auth.repo_query")
    @patch("api.routers.auth.resolve_session")
    def test_global_owner_memberships_may_be_empty(
        self, mock_resolve_session, mock_repo_query, client
    ):
        """Global owner still works even with empty memberships."""
        user = _make_mock_user(is_global_owner=True, user_id="user:god")
        mock_resolve_session.return_value = user
        mock_repo_query.return_value = []  # No memberships needed

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer test-session-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is True
        assert data["owner_access"] is True
        assert data["user"]["is_global_owner"] is True
        # Global owners get empty memberships (not a blocker)
        assert data["memberships"] == []

    @patch("api.routers.auth.repo_query")
    @patch("api.routers.auth.resolve_session")
    def test_inactive_membership_excluded(
        self, mock_resolve_session, mock_repo_query, client
    ):
        """Inactive memberships are not returned (query filters active=true)."""
        user = _make_mock_user(is_global_owner=False, user_id="user:inactive1")
        mock_resolve_session.return_value = user
        # Only active memberships returned by the query
        mock_repo_query.return_value = []

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer test-session-token"},
        )

        assert response.status_code == 200
        data = response.json()
        # No inactive memberships in response
        assert data["memberships"] == []

    @patch("api.routers.auth.repo_query")
    @patch("api.routers.auth.resolve_session")
    def test_no_sensitive_fields_in_memberships(
        self, mock_resolve_session, mock_repo_query, client
    ):
        """Membership response never exposes sensitive fields."""
        user = _make_mock_user(is_global_owner=False, user_id="user:safe1")
        mock_resolve_session.return_value = user
        mock_repo_query.return_value = [
            _make_mock_membership_row(
                membership_id="school_membership:m1",
                school_id="school:s1",
                role="teacher",
                active=True,
            ),
        ]

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer test-session-token"},
        )

        assert response.status_code == 200
        data = response.json()
        mem = data["memberships"][0]
        # Only safe fields present
        assert "password_hash" not in mem
        assert "token_hash" not in mem
        assert "token" not in mem
        assert "user_id" not in mem
        assert "api_key" not in mem
        # Allowed fields
        assert "membership_id" in mem
        assert "school_id" in mem
        assert "role" in mem
        assert "active" in mem

    @patch("api.routers.auth._check_password")
    def test_legacy_password_empty_memberships(
        self, mock_check_password, client
    ):
        """Legacy password auth returns empty memberships."""
        mock_check_password.return_value = (True, False)  # valid, not owner

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer legacy-password"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is True
        assert data["auth_mode"] == "password"
        assert data["user"] is None
        assert data["memberships"] == []

    @patch("api.routers.auth.repo_query")
    @patch("api.routers.auth.resolve_session")
    def test_repo_query_failure_returns_empty(
        self, mock_resolve_session, mock_repo_query, client
    ):
        """If the membership query fails, an empty list is returned (graceful)."""
        user = _make_mock_user(is_global_owner=False, user_id="user:err1")
        mock_resolve_session.return_value = user
        mock_repo_query.side_effect = Exception("DB timeout")

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer test-session-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["authenticated"] is True
        # Graceful degradation: empty memberships on query failure
        assert data["memberships"] == []


# =========================================================================
# POST /api/auth/logout
# =========================================================================


class TestLogout:
    """POST /api/auth/logout"""

    @patch("api.routers.auth.delete_session")
    def test_logout_invalidates_session(self, mock_delete, client):
        """Logout with valid token calls delete_session."""
        response = client.post(
            "/api/auth/logout",
            headers={"Authorization": "Bearer some-token"},
        )

        assert response.status_code == 200
        assert response.json()["ok"] is True
        mock_delete.assert_called_once_with("some-token")

    @patch("api.routers.auth.delete_session")
    def test_logout_without_token(self, mock_delete, client):
        """Logout without token still returns 200."""
        response = client.post("/api/auth/logout")

        assert response.status_code == 200
        assert response.json()["ok"] is True
        mock_delete.assert_not_called()


# =========================================================================
# Unit-level: session token hashing (no DB)
# =========================================================================


class TestSessionTokenHashing:
    """Verify that the raw token is never stored — only the hash."""

    @patch("api.auth.AuthSession")
    def test_create_session_stores_hash_not_raw(self, mock_auth_session_cls):
        """create_session_for_user stores SHA-256 hash, never the raw token."""
        import asyncio
        import hashlib

        from api.auth import create_session_for_user

        mock_user = AsyncMock()
        mock_user.id = "user:test1"

        mock_session = AsyncMock()
        mock_auth_session_cls.return_value = mock_session

        result = None

        async def run():
            nonlocal result
            result = await create_session_for_user(mock_user)

        asyncio.run(run())

        raw_token = result["token"]
        # The raw token was never stored
        call_kwargs = mock_auth_session_cls.call_args.kwargs or {}
        stored_token_hash = call_kwargs.get("token_hash")
        assert stored_token_hash is not None
        # The stored hash should be SHA-256 of the raw token
        expected_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        assert stored_token_hash == expected_hash
        # The raw token itself should NOT be in the stored data
        assert stored_token_hash != raw_token
        # user_id is passed as table:id string (compatible with ensure_record_refs)
        assert call_kwargs.get("user_id") == "user:test1"

    def test_resolve_session_hashes_input(self):
        """resolve_session hashes the input token when querying."""
        import hashlib

        from api.auth import resolve_session

        raw_token = "some-raw-token"
        expected_hash = hashlib.sha256(raw_token.encode()).hexdigest()

        with patch("api.auth.repo_query", new_callable=AsyncMock) as mock_query:
            mock_query.return_value = []

            async def run():
                await resolve_session(raw_token)

            import asyncio

            asyncio.run(run())

            # Verify the query used the hash, not the raw token
            call_args = mock_query.call_args[0]
            vars_dict = call_args[1] if len(call_args) > 1 else {}
            assert vars_dict.get("hash") == expected_hash
            assert vars_dict.get("hash") != raw_token


# =========================================================================
# Helpers (shared across test classes)
# =========================================================================


def _make_mock_user(
    is_global_owner: bool = False,
    user_id: str = "user:t1",
    display_name: str = "Test User",
    email: str = "test@example.com",
):
    """Build a mock User-like object for auth tests."""
    u = AsyncMock()
    u.id = user_id
    u.is_global_owner = is_global_owner
    u.active = True
    u.display_name = display_name
    u.email = email
    return u


def _make_mock_membership_row(
    membership_id: str = "school_membership:m1",
    school_id: str = "school:s1",
    role: str = "teacher",
    active: bool = True,
) -> dict:
    """Build a mock SurrealDB result row for a school membership."""
    return {
        "id": membership_id,
        "school_id": school_id,
        "role": role,
        "active": active,
    }
