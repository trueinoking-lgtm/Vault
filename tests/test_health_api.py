"""Tests for the /api/health endpoint.

Phase G2 — backend service health hardening.
"""

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from api.main import app

    return TestClient(app)


def test_health_endpoint_returns_ok(client: TestClient):
    """GET /api/health returns status ok with service name."""
    response = client.get("/api/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "vault-api"
    # Must not leak secrets, paths, or env values
    sensitive_keys = {"VAULT_", "PATH", "SECRET", "TOKEN", "PASSWORD", "KEY"}
    for key in data:
        upper = key.upper()
        for sensitive in sensitive_keys:
            assert sensitive not in upper, f"Response leaks sensitive key: {key}"


def test_health_endpoint_does_not_require_auth(client: TestClient):
    """GET /api/health is excluded from auth middleware."""
    response = client.get("/api/health", headers={})
    assert response.status_code == 200


def test_health_response_shape_is_stable(client: TestClient):
    """The response shape should be a minimal JSON object."""
    response = client.get("/api/health")
    data = response.json()

    # Only the expected keys
    assert set(data.keys()) == {"status", "service"}
    # Types
    assert isinstance(data["status"], str)
    assert isinstance(data["service"], str)


def test_existing_health_still_works(client: TestClient):
    """The existing /health (non-api) endpoint is unchanged."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}
