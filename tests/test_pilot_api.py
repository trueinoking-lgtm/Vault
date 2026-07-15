"""Phase C pilot API contract tests written before router implementation."""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from api.auth import hash_account_password, verify_account_password


@pytest.fixture
def client():
    from api.main import app

    return TestClient(app)


def test_pilot_mode_endpoint_is_explicit_and_separate(client):
    with patch("api.routers.pilot.require_pilot_actor", new=AsyncMock(return_value={"id": "user:owner", "role": "owner"})):
        response = client.get("/api/impact/pilot/mode")
    assert response.status_code == 200
    assert response.json() == {
        "dataset_mode": "pilot",
        "label": "Pilot Mode",
        "disclosure": "Verified pilot workspace. Data entered by participating school staff.",
    }


def test_workspace_create_has_required_onboarding_fields_and_audit(client):
    payload = {
        "school_name": "Mbare Pilot Secondary",
        "district": "Harare South",
        "province": "Harare",
        "school_type": "secondary",
        "primary_contact": "Pilot coordinator",
        "academic_year": "2026",
        "term": "Term 2",
        "pilot_start_date": "2026-07-15T00:00:00Z",
        "status": "onboarding",
    }
    with (
        patch("api.routers.pilot.require_pilot_actor", new=AsyncMock(return_value={"id": "user:owner", "role": "owner"})),
        patch("api.routers.pilot.repo_create", new=AsyncMock(side_effect=[{"id": "pilot_workspace:one", **payload}, {"id": "pilot_audit_event:a1"}])) as create,
    ):
        response = client.post("/api/impact/pilot/workspaces", json=payload)
    assert response.status_code == 201
    assert response.json()["dataset_mode"] == "pilot"
    assert create.await_args_list[0].args[0] == "pilot_workspace"
    assert create.await_args_list[1].args[0] == "pilot_audit_event"


def test_pilot_workspace_list_query_never_reads_demo_tables(client):
    with (
        patch("api.routers.pilot.require_pilot_actor", new=AsyncMock(return_value={"id": "user:owner", "role": "owner"})),
        patch("api.routers.pilot.repo_query", new=AsyncMock(return_value=[])) as query,
    ):
        response = client.get("/api/impact/pilot/workspaces")
    assert response.status_code == 200
    statements = " ".join(call.args[0] for call in query.await_args_list)
    assert "pilot_workspace" in statements
    assert "impact_school" not in statements
    assert "impact_learner" not in statements


def test_pilot_account_passwords_use_salted_hashes():
    first = hash_account_password("PilotAccess!2026")
    second = hash_account_password("PilotAccess!2026")
    assert first.startswith("scrypt$")
    assert first != second
    assert verify_account_password("PilotAccess!2026", first)
    assert not verify_account_password("wrong-password", first)


def test_pilot_templates_are_downloadable(client):
    with patch("api.routers.pilot.require_pilot_actor", new=AsyncMock(return_value={"id": "user:owner", "role": "owner"})):
        learner = client.get("/api/impact/pilot/templates/learners.csv")
        structure = client.get("/api/impact/pilot/templates/assessment-structure.csv")
        marks = client.get("/api/impact/pilot/templates/marks.csv")
    assert learner.status_code == structure.status_code == marks.status_code == 200
    assert learner.text.startswith("learner_code,class_name")
    assert structure.text.startswith("question_number,topic,max_marks")
    assert marks.text.startswith("learner_code,question_number,score")


def test_teacher_cannot_create_workspace(client):
    with patch("api.routers.pilot.require_pilot_actor", new=AsyncMock(return_value={"id": "user:t1", "role": "teacher"})):
        response = client.post(
            "/api/impact/pilot/workspaces",
            json={
                "school_name": "Denied",
                "district": "Harare",
                "province": "Harare",
                "school_type": "secondary",
                "primary_contact": "Coordinator",
                "academic_year": "2026",
                "term": "Term 2",
                "pilot_start_date": "2026-07-15T00:00:00Z",
                "status": "draft",
            },
        )
    assert response.status_code == 403


def test_pilot_report_disclosure_is_non_causal():
    from api.routers.pilot import PILOT_REPORT_DISCLOSURE

    assert PILOT_REPORT_DISCLOSURE == (
        "This report summarizes data entered during a controlled school pilot. "
        "It does not establish causal impact and is not Ministry-verified evidence."
    )
