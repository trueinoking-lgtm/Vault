"""Tests for /search/ask default model resolution (H4 hardening).

Verifies that:
- Ask succeeds when model IDs are omitted (resolves to default chat model)
- Explicit model IDs still override defaults
- Missing defaults returns a clear 422, not a 500
- No secrets are exposed in error responses
"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    """Create test client after environment variables have been cleared by conftest."""
    from api.main import app

    return TestClient(app)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _fake_model(model_id: str = "model:test123", model_type: str = "language"):
    """Return a lightweight Model-like object for mocking."""
    m = AsyncMock()
    m.id = model_id
    m.type = model_type
    m.name = "test-model"
    return m


def _fake_defaults(chat_model_id: str | None = "model:default_chat"):
    """Return a DefaultModels-like object for mocking."""
    d = AsyncMock()
    d.default_chat_model = chat_model_id
    d.default_transformation_model = chat_model_id
    d.large_context_model = chat_model_id
    d.default_embedding_model = "model:default_embed"
    d.default_tools_model = chat_model_id
    return d


# ---------------------------------------------------------------------------
# Tests — /search/ask (streaming)
# ---------------------------------------------------------------------------

class TestAskDefaultModelResolution:
    """POST /search/ask resolves omitted model IDs to the default chat model."""

    @pytest.mark.asyncio
    async def test_omitted_models_resolve_to_default(self, client):
        """When strategy_model/answer_model/final_answer_model are all None,
        the endpoint should fall back to the default chat model."""
        fake_model = _fake_model("model:default_chat")
        fake_defaults = _fake_defaults()

        with (
            patch("api.routers.search.Model.get", new_callable=AsyncMock, return_value=fake_model),
            patch("api.routers.search.model_manager.get_defaults", new_callable=AsyncMock, return_value=fake_defaults),
            patch("api.routers.search.model_manager.get_embedding_model", new_callable=AsyncMock, return_value=fake_model),
            patch("api.routers.search.ask_graph.astream", new_callable=AsyncMock) as mock_stream,
        ):
            # Mock the streaming response
            async def fake_astream(**kwargs):
                yield {"write_final_answer": {"final_answer": "Test answer"}}
            mock_stream.side_effect = fake_astream

            response = client.post(
                "/api/search/ask",
                json={"question": "What is Emberfall?"},
            )
            # Should succeed (200) — not 422 or 500
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_explicit_models_override_defaults(self, client):
        """Explicit model IDs should be used as-is, not resolved from defaults."""
        explicit_model = _fake_model("model:explicit_model")
        fake_defaults = _fake_defaults()

        with (
            patch("api.routers.search.Model.get", new_callable=AsyncMock, return_value=explicit_model) as mock_get,
            patch("api.routers.search.model_manager.get_defaults", new_callable=AsyncMock, return_value=fake_defaults),
            patch("api.routers.search.model_manager.get_embedding_model", new_callable=AsyncMock, return_value=explicit_model),
            patch("api.routers.search.ask_graph.astream", new_callable=AsyncMock) as mock_stream,
        ):
            async def fake_astream(**kwargs):
                yield {"write_final_answer": {"final_answer": "Test answer"}}
            mock_stream.side_effect = fake_astream

            response = client.post(
                "/api/search/ask",
                json={
                    "question": "What is Emberfall?",
                    "strategy_model": "model:explicit_model",
                    "answer_model": "model:explicit_model",
                    "final_answer_model": "model:explicit_model",
                },
            )
            assert response.status_code == 200
            # Model.get should have been called with the explicit ID
            mock_get.assert_any_await("model:explicit_model")

    @pytest.mark.asyncio
    async def test_invalid_explicit_model_returns_422(self, client):
        """An explicit model ID that doesn't exist should return 422."""
        with (
            patch("api.routers.search.Model.get", new_callable=AsyncMock, return_value=None),
            patch("api.routers.search.model_manager.get_defaults", new_callable=AsyncMock, return_value=_fake_defaults()),
        ):
            response = client.post(
                "/api/search/ask",
                json={
                    "question": "What is Emberfall?",
                    "strategy_model": "model:nonexistent",
                    "answer_model": "model:nonexistent",
                    "final_answer_model": "model:nonexistent",
                },
            )
            assert response.status_code == 422
            detail = response.json().get("detail", "")
            assert "not found" in detail.lower()

    @pytest.mark.asyncio
    async def test_no_defaults_and_no_models_returns_422(self, client):
        """When no models are specified and no default is configured,
        should return 422 with a clear message (not 500)."""
        no_defaults = _fake_defaults(chat_model_id=None)

        with (
            patch("api.routers.search.model_manager.get_defaults", new_callable=AsyncMock, return_value=no_defaults),
            patch("api.routers.search.Model.get", new_callable=AsyncMock, return_value=None),
        ):
            response = client.post(
                "/api/search/ask",
                json={"question": "What is Emberfall?"},
            )
            assert response.status_code == 422
            detail = response.json().get("detail", "")
            assert "default chat model" in detail.lower() or "no" in detail.lower()
            # Ensure no stack trace or secret leakage
            assert "FIREWORKS_API_KEY" not in response.text
            assert "traceback" not in response.text.lower()


# ---------------------------------------------------------------------------
# Tests — /search/ask/simple (non-streaming)
# ---------------------------------------------------------------------------

class TestAskSimpleDefaultModelResolution:
    """POST /search/ask/simple resolves omitted model IDs to the default chat model."""

    @pytest.mark.asyncio
    async def test_omitted_models_resolve_to_default(self, client):
        """When all model IDs are omitted, should use default chat model."""
        fake_model = _fake_model("model:default_chat")
        fake_defaults = _fake_defaults()

        async def fake_astream(**kwargs):
            yield {"write_final_answer": {"final_answer": "Test answer from defaults"}}

        with (
            patch("api.routers.search.Model.get", new_callable=AsyncMock, return_value=fake_model),
            patch("api.routers.search.model_manager.get_defaults", new_callable=AsyncMock, return_value=fake_defaults),
            patch("api.routers.search.model_manager.get_embedding_model", new_callable=AsyncMock, return_value=fake_model),
            patch("api.routers.search.ask_graph.astream", side_effect=fake_astream),
        ):
            response = client.post(
                "/api/search/ask/simple",
                json={"question": "What is Emberfall?"},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["answer"] == "Test answer from defaults"

    @pytest.mark.asyncio
    async def test_no_defaults_returns_422(self, client):
        """Missing defaults should return 422, not 500."""
        no_defaults = _fake_defaults(chat_model_id=None)

        with (
            patch("api.routers.search.model_manager.get_defaults", new_callable=AsyncMock, return_value=no_defaults),
            patch("api.routers.search.Model.get", new_callable=AsyncMock, return_value=None),
        ):
            response = client.post(
                "/api/search/ask/simple",
                json={"question": "What is Emberfall?"},
            )
            assert response.status_code == 422
            # No secrets in response
            assert "FIREWORKS_API_KEY" not in response.text
