from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest
from surrealdb import RecordID

from api.routers.impact import _normalize_api_value, get_school_report


def test_normalize_api_value_preserves_internal_record_ids_but_serializes_boundary():
    school_id = RecordID.parse("impact_school:school-pilot")
    payload = {
        "id": school_id,
        "nested": [{"school_id": school_id}],
        "plain": "unchanged",
    }

    assert isinstance(payload["id"], RecordID)
    normalized = _normalize_api_value(payload)

    assert normalized == {
        "id": "impact_school:school-pilot",
        "nested": [{"school_id": "impact_school:school-pilot"}],
        "plain": "unchanged",
    }
    assert isinstance(payload["id"], RecordID)


@pytest.mark.asyncio
async def test_school_report_queries_record_foreign_keys_with_type_thing_and_normalizes_ids():
    school = SimpleNamespace(
        id=RecordID.parse("impact_school:school-pilot"),
        name="Pilot School",
        district="Harare South",
        province="Harare",
        school_type="secondary",
    )

    with (
        patch("api.routers.impact.ImpactSchool.get", AsyncMock(return_value=school)),
        patch("api.routers.impact.repo_query", AsyncMock(side_effect=[[], [], [], []])) as query,
    ):
        report = await get_school_report("school-pilot")

    assert report["school"]["id"] == "school-pilot"
    queries = [call.args[0] for call in query.await_args_list]
    assert all("type::thing" in statement for statement in queries[:3])
    assert "assessment_id IN $ids" not in "\n".join(queries)


def test_report_routes_keep_response_validation_enabled():
    from api.main import app

    routes = {
        route.path: route.response_model
        for route in app.routes
        if route.path in {
            "/api/impact/reports/assessment/{assessment_id}",
            "/api/impact/reports/school/{school_id}",
        }
    }

    assert routes["/api/impact/reports/assessment/{assessment_id}"] is not None
    assert routes["/api/impact/reports/school/{school_id}"] is not None
