"""Controlled, school-scoped ZimLearnGraph pilot API.

This router never reads ``impact_*`` demo tables. All records are physically
isolated in ``pilot_*`` tables and every workspace query is membership scoped.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal

from fastapi import APIRouter, Body, HTTPException, Request, Response, status
from pydantic import BaseModel, Field, field_validator

from api.auth import hash_account_password
from api.services.pilot import (
    ImportPreview,
    build_readiness,
    can,
    compare_assessment_summaries,
    csv_text,
    sanitize_audit_summary,
    validate_learner_csv,
    validate_marks_csv,
)
from vault_core.database.repository import (
    repo_create,
    repo_delete,
    repo_insert,
    repo_query,
    repo_update,
)
from vault_core.domain.user import User

router = APIRouter(prefix="/impact/pilot", tags=["ZimLearnGraph Pilot"])

PILOT_DISCLOSURE = "Verified pilot workspace. Data entered by participating school staff."
PILOT_REPORT_DISCLOSURE = (
    "This report summarizes data entered during a controlled school pilot. "
    "It does not establish causal impact and is not Ministry-verified evidence."
)


class WorkspaceCreate(BaseModel):
    school_name: str = Field(min_length=2, max_length=160)
    district: str = Field(min_length=2, max_length=120)
    province: str = Field(min_length=2, max_length=120)
    school_type: Literal["primary", "secondary", "combined", "other"]
    primary_contact: str = Field(min_length=2, max_length=160)
    academic_year: str = Field(min_length=4, max_length=20)
    term: str = Field(min_length=2, max_length=40)
    pilot_start_date: datetime
    status: Literal["draft", "onboarding", "active", "paused", "completed"] = "draft"


class MemberCreate(BaseModel):
    user_id: str
    role: Literal["pilot_admin", "teacher", "viewer"]
    assigned_class_ids: list[str] = Field(default_factory=list)


class WorkspaceStatusUpdate(BaseModel):
    status: Literal["draft", "onboarding", "active", "paused", "completed"]


class MemberInvite(BaseModel):
    display_name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=254)
    temporary_password: str = Field(min_length=12, max_length=128)
    role: Literal["pilot_admin", "teacher", "viewer"]
    assigned_class_ids: list[str] = Field(default_factory=list)


class ClassCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    grade_level: str | None = Field(default=None, max_length=80)
    academic_year: str
    teacher_user_id: str | None = None


class SubjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    topics: list[str] = Field(min_length=1)


class QuestionCreate(BaseModel):
    question_number: int = Field(gt=0)
    topic_id: str
    label: str | None = None
    max_marks: float = Field(gt=0)


class AssessmentCreate(BaseModel):
    class_id: str
    subject_id: str
    title: str = Field(min_length=2, max_length=160)
    kind: Literal["diagnostic", "follow_up", "other"]
    term: str
    date_written: datetime | None = None
    pass_mark: float = Field(gt=0)
    follow_up_to: str | None = None
    questions: list[QuestionCreate] = Field(min_length=1)

    @field_validator("follow_up_to")
    @classmethod
    def require_link_for_follow_up(cls, value: str | None, info: Any) -> str | None:
        if info.data.get("kind") == "follow_up" and not value:
            raise ValueError("follow_up assessment must link to a diagnostic assessment")
        return value


class CsvPayload(BaseModel):
    csv_text: str = Field(min_length=1, max_length=2_000_000)


class MarkGridEntry(BaseModel):
    learner_id: str
    question_id: str
    score: float = Field(ge=0)
    correction_reason: str | None = Field(default=None, min_length=3, max_length=240)


class MarkGridPayload(BaseModel):
    rows: list[MarkGridEntry] = Field(min_length=1)


class InterventionCreate(BaseModel):
    class_id: str
    subject_id: str
    topic_id: str
    source_assessment_id: str
    recommendation: str = Field(min_length=4, max_length=1000)
    assigned_teacher_id: str
    planned_date: datetime | None = None
    status: Literal["suggested", "planned", "in_progress", "completed", "cancelled"] = "suggested"


class InterventionUpdate(BaseModel):
    status: Literal["suggested", "planned", "in_progress", "completed", "cancelled"] | None = None
    teacher_note: str | None = Field(default=None, max_length=2000)
    completed_date: datetime | None = None
    verification_status: Literal["teacher_confirmed", "school_reviewed", "unverified"] | None = None


class ReportCreate(BaseModel):
    diagnostic_assessment_id: str
    follow_up_assessment_id: str
    school_review_status: Literal["unreviewed", "school_reviewed"] = "unreviewed"
    teacher_notes: str | None = Field(default=None, max_length=4000)


def _first(result: Any) -> dict[str, Any] | None:
    if isinstance(result, list):
        return result[0] if result else None
    return result if isinstance(result, dict) else None


async def require_pilot_actor(request: Request) -> dict[str, Any]:
    """Require existing Vault authentication; anonymous/demo access is denied."""
    actor = getattr(request.state, "user", None)
    if not actor:
        raise HTTPException(status_code=401, detail="Pilot workspace authentication required")
    if hasattr(actor, "model_dump"):
        actor = actor.model_dump()
    else:
        actor = dict(actor)
    actor["id"] = str(actor.get("id", ""))
    if actor.get("is_global_owner") or actor.get("role") in {"owner", "admin"}:
        actor["role"] = "owner"
    return actor


def _require_permission(actor: dict[str, Any], permission: str) -> None:
    if not can(str(actor.get("role", "")), permission):
        raise HTTPException(status_code=403, detail=f"Permission required: {permission}")


async def _workspace_actor(actor: dict[str, Any], workspace_id: str, permission: str) -> dict[str, Any]:
    if actor.get("role") == "owner":
        return actor
    memberships = await repo_query(
        "SELECT role, assigned_class_ids FROM pilot_membership "
        "WHERE workspace_id = type::record($workspace_id) AND user_id = type::record($user_id) AND active = true LIMIT 1;",
        {"workspace_id": workspace_id, "user_id": actor["id"]},
    )
    membership = _first(memberships)
    if not membership:
        raise HTTPException(status_code=403, detail="Pilot workspace access denied")
    scoped = {**actor, **membership}
    _require_permission(scoped, permission)
    return scoped


async def _class_actor(actor: dict[str, Any], workspace_id: str, permission: str, class_id: str) -> dict[str, Any]:
    scoped = await _workspace_actor(actor, workspace_id, permission)
    if scoped.get("role") == "teacher" and class_id not in {str(value) for value in scoped.get("assigned_class_ids", [])}:
        raise HTTPException(status_code=403, detail="Teacher access is limited to assigned pilot classes")
    return scoped


async def _assessment_actor(actor: dict[str, Any], workspace_id: str, permission: str, assessment_id: str) -> dict[str, Any]:
    assessment = _first(await repo_query(
        "SELECT class_id FROM type::record($assessment_id) WHERE workspace_id = type::record($workspace_id) LIMIT 1;",
        {"assessment_id": assessment_id, "workspace_id": workspace_id},
    ))
    if not assessment:
        raise HTTPException(status_code=404, detail="Pilot assessment not found")
    return await _class_actor(actor, workspace_id, permission, str(assessment["class_id"]))


async def _intervention_actor(actor: dict[str, Any], workspace_id: str, permission: str, intervention_id: str) -> dict[str, Any]:
    intervention = _first(await repo_query(
        "SELECT class_id FROM type::record($intervention_id) WHERE workspace_id = type::record($workspace_id) LIMIT 1;",
        {"intervention_id": intervention_id, "workspace_id": workspace_id},
    ))
    if not intervention:
        raise HTTPException(status_code=404, detail="Pilot intervention not found")
    return await _class_actor(actor, workspace_id, permission, str(intervention["class_id"]))


async def _audit(workspace_id: str, actor_id: str, action: str, entity_type: str, entity_id: str, summary: str) -> None:
    await repo_create(
        "pilot_audit_event",
        {
            "workspace_id": workspace_id,
            "actor_id": actor_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "summary": sanitize_audit_summary(summary),
        },
    )


async def _workspace_record(workspace_id: str) -> dict[str, Any]:
    row = _first(await repo_query("SELECT * FROM type::record($id) WHERE dataset_mode = 'pilot';", {"id": workspace_id}))
    if not row or not str(row.get("id", "")).startswith("pilot_workspace:"):
        raise HTTPException(status_code=404, detail="Pilot workspace not found")
    return row


@router.get("/mode")
async def mode(request: Request) -> dict[str, str]:
    await require_pilot_actor(request)
    return {"dataset_mode": "pilot", "label": "Pilot Mode", "disclosure": PILOT_DISCLOSURE}


@router.get("/workspaces")
async def list_workspaces(request: Request) -> list[dict[str, Any]]:
    actor = await require_pilot_actor(request)
    if actor.get("role") == "owner":
        return await repo_query("SELECT * FROM pilot_workspace WHERE dataset_mode = 'pilot' ORDER BY created DESC;")
    return await repo_query(
        "SELECT workspace_id.* AS workspace, role, assigned_class_ids FROM pilot_membership "
        "WHERE user_id = type::record($user_id) AND active = true;",
        {"user_id": actor["id"]},
    )


@router.post("/workspaces", status_code=status.HTTP_201_CREATED)
async def create_workspace(request: Request, payload: WorkspaceCreate) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    _require_permission(actor, "school_setup")
    record = await repo_create("pilot_workspace", {"dataset_mode": "pilot", **payload.model_dump()})
    record = _first(record) or record
    record_id = str(record.get("id", "pilot_workspace:unknown"))
    await _audit(record_id, actor["id"], "record_created", "pilot_workspace", record_id, f"Created pilot school {payload.school_name}")
    return {**record, "dataset_mode": "pilot"}


@router.get("/workspaces/{workspace_id}")
async def get_workspace(request: Request, workspace_id: str) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "dashboards_read") if actor.get("role") != "owner" else None
    return await _workspace_record(workspace_id)


@router.put("/workspaces/{workspace_id}/status")
async def update_workspace_status(request: Request, workspace_id: str, payload: WorkspaceStatusUpdate) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "school_setup") if actor.get("role") != "owner" else None
    await _workspace_record(workspace_id)
    record = _first(await repo_update("pilot_workspace", workspace_id, {"status": payload.status})) or {}
    await _audit(workspace_id, actor["id"], "record_updated", "pilot_workspace", workspace_id, f"Pilot status changed to {payload.status}")
    return record


@router.post("/workspaces/{workspace_id}/members", status_code=201)
async def add_member(request: Request, workspace_id: str, payload: MemberCreate) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "members_manage")
    await _workspace_record(workspace_id)
    existing = await repo_query(
        "SELECT id FROM pilot_membership WHERE workspace_id = type::record($workspace_id) AND user_id = type::record($user_id) LIMIT 1;",
        {"workspace_id": workspace_id, "user_id": payload.user_id},
    )
    if existing:
        raise HTTPException(status_code=409, detail="User already belongs to this pilot workspace")
    record = await repo_create("pilot_membership", {"workspace_id": workspace_id, **payload.model_dump(), "active": True})
    record = _first(record) or record
    await _audit(workspace_id, actor["id"], "record_created", "pilot_membership", str(record.get("id")), f"Added {payload.role} access")
    return record


@router.post("/workspaces/{workspace_id}/members/invite", status_code=201)
async def invite_member(request: Request, workspace_id: str, payload: MemberInvite) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "members_manage")
    existing = await repo_query(
        "SELECT id FROM user WHERE string::lowercase(email) = string::lowercase($email) LIMIT 1;",
        {"email": payload.email.strip()},
    )
    if existing:
        raise HTTPException(status_code=409, detail="An account already uses this email")
    user = User(
        display_name=payload.display_name.strip(),
        email=payload.email.strip().lower(),
        password_hash=hash_account_password(payload.temporary_password),
        is_global_owner=False,
        active=True,
    )
    await user.save()
    user_id = str(user.id)
    membership = _first(
        await repo_create(
            "pilot_membership",
            {
                "workspace_id": workspace_id,
                "user_id": user_id,
                "role": payload.role,
                "assigned_class_ids": payload.assigned_class_ids,
                "active": True,
            },
        )
    ) or {}
    await _audit(
        workspace_id,
        actor["id"],
        "record_created",
        "pilot_membership",
        str(membership.get("id")),
        f"Created {payload.role} pilot access for {payload.email.strip().lower()}",
    )
    return {
        **membership,
        "user": {"id": user_id, "display_name": user.display_name, "email": user.email},
        "temporary_password_returned": False,
    }


@router.get("/workspaces/{workspace_id}/members")
async def list_members(request: Request, workspace_id: str) -> list[dict[str, Any]]:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "dashboards_read")
    return await repo_query(
        "SELECT *, user_id.email AS email, user_id.display_name AS display_name FROM pilot_membership "
        "WHERE workspace_id = type::record($workspace_id) AND active = true ORDER BY created;",
        {"workspace_id": workspace_id},
    )


@router.post("/workspaces/{workspace_id}/classes", status_code=201)
async def create_class(request: Request, workspace_id: str, payload: ClassCreate) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "classes_write")
    record = await repo_create("pilot_class", {"workspace_id": workspace_id, **payload.model_dump(), "active": True})
    record = _first(record) or record
    if payload.teacher_user_id:
        membership = _first(await repo_query(
            "SELECT id, assigned_class_ids FROM pilot_membership WHERE workspace_id = type::record($workspace_id) AND user_id = type::record($user_id) AND role = 'teacher' AND active = true LIMIT 1;",
            {"workspace_id": workspace_id, "user_id": payload.teacher_user_id},
        ))
        if membership:
            assigned = [str(value) for value in membership.get("assigned_class_ids", [])]
            assigned.append(str(record["id"]))
            await repo_update("pilot_membership", str(membership["id"]), {"assigned_class_ids": sorted(set(assigned))})
    await _audit(workspace_id, actor["id"], "record_created", "pilot_class", str(record.get("id")), f"Created class {payload.name}")
    return record


@router.get("/workspaces/{workspace_id}/classes")
async def list_classes(request: Request, workspace_id: str) -> list[dict[str, Any]]:
    actor = await require_pilot_actor(request)
    scoped = await _workspace_actor(actor, workspace_id, "assigned_classes_read" if actor.get("role") == "teacher" else "dashboards_read")
    query = "SELECT * FROM pilot_class WHERE workspace_id = type::record($workspace_id) AND active = true"
    variables: dict[str, Any] = {"workspace_id": workspace_id}
    if scoped.get("role") == "teacher":
        query += " AND id INSIDE $assigned_class_ids"
        variables["assigned_class_ids"] = scoped.get("assigned_class_ids", [])
    return await repo_query(query + " ORDER BY name;", variables)


@router.post("/workspaces/{workspace_id}/subjects", status_code=201)
async def create_subject(request: Request, workspace_id: str, payload: SubjectCreate) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "assessments_write")
    subject = _first(await repo_create("pilot_subject", {"workspace_id": workspace_id, "name": payload.name})) or {}
    topics = await repo_insert(
        "pilot_topic",
        [{"workspace_id": workspace_id, "subject_id": subject["id"], "name": name.strip()} for name in payload.topics],
    )
    await _audit(workspace_id, actor["id"], "record_created", "pilot_subject", str(subject.get("id")), f"Configured subject {payload.name} with {len(topics)} topics")
    return {**subject, "topics": topics}


@router.get("/workspaces/{workspace_id}/subjects")
async def list_subjects(request: Request, workspace_id: str) -> list[dict[str, Any]]:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "dashboards_read")
    return await repo_query(
        "SELECT *, (SELECT * FROM pilot_topic WHERE workspace_id = type::record($workspace_id) AND subject_id = $parent.id ORDER BY name) AS topics "
        "FROM pilot_subject AS $parent WHERE workspace_id = type::record($workspace_id) ORDER BY name;",
        {"workspace_id": workspace_id},
    )


def _preview_json(preview: ImportPreview) -> dict[str, Any]:
    return {
        "status": "pending_confirmation",
        "accepted_count": preview.accepted_count,
        "rejected_count": preview.rejected_count,
        "errors": preview.errors,
        "rows": [{"row_number": row.row_number, "data": row.data, "errors": row.errors, "accepted": row.accepted} for row in preview.rows],
    }


async def _learner_context(workspace_id: str) -> tuple[set[str], dict[str, str]]:
    classes = await repo_query("SELECT id, name FROM pilot_class WHERE workspace_id = type::record($workspace_id) AND active = true;", {"workspace_id": workspace_id})
    learners = await repo_query("SELECT learner_code FROM pilot_learner WHERE workspace_id = type::record($workspace_id);", {"workspace_id": workspace_id})
    return {str(row["learner_code"]) for row in learners}, {str(row["name"]): str(row["id"]) for row in classes}


@router.post("/workspaces/{workspace_id}/learners/import/preview")
async def preview_learners(request: Request, workspace_id: str, payload: CsvPayload) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "learners_write")
    codes, classes = await _learner_context(workspace_id)
    return _preview_json(validate_learner_csv(payload.csv_text, existing_codes=codes, allowed_classes=set(classes)))


@router.post("/workspaces/{workspace_id}/learners/import/confirm", status_code=201)
async def confirm_learners(request: Request, workspace_id: str, payload: CsvPayload) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "learners_write")
    codes, classes = await _learner_context(workspace_id)
    preview = validate_learner_csv(payload.csv_text, existing_codes=codes, allowed_classes=set(classes))
    if preview.errors or preview.rejected_count:
        raise HTTPException(status_code=422, detail=_preview_json(preview))
    batch = _first(await repo_create("pilot_import_batch", {"workspace_id": workspace_id, "import_type": "learners", "status": "confirmed", "accepted_count": preview.accepted_count, "rejected_count": 0, "created_by": actor["id"]})) or {}
    records = await repo_insert("pilot_learner", [{"workspace_id": workspace_id, "class_id": classes[row.data["class_name"]], "learner_code": row.data["learner_code"], "gender": row.data.get("gender") or None, "support_note": row.data.get("support_note") or None, "status": row.data["status"], "import_batch_id": batch["id"]} for row in preview.rows])
    await _audit(workspace_id, actor["id"], "learners_imported", "pilot_import_batch", str(batch.get("id")), f"Imported {len(records)} anonymous learner codes")
    return {"status": "confirmed", "batch_id": batch.get("id"), "created_count": len(records), "learners": records}


@router.get("/workspaces/{workspace_id}/learners")
async def list_learners(request: Request, workspace_id: str) -> list[dict[str, Any]]:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "assigned_classes_read" if actor.get("role") == "teacher" else "dashboards_read")
    return await repo_query("SELECT * FROM pilot_learner WHERE workspace_id = type::record($workspace_id) ORDER BY learner_code;", {"workspace_id": workspace_id})


@router.delete("/workspaces/{workspace_id}/imports/{batch_id}")
async def rollback_import(request: Request, workspace_id: str, batch_id: str) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "learners_write")
    batch = _first(await repo_query("SELECT * FROM type::record($batch_id) WHERE workspace_id = type::record($workspace_id);", {"batch_id": batch_id, "workspace_id": workspace_id}))
    if not batch:
        raise HTTPException(status_code=404, detail="Import batch not found")
    table = "pilot_learner" if batch.get("import_type") == "learners" else "pilot_mark"
    await repo_query(f"DELETE {table} WHERE workspace_id = type::record($workspace_id) AND import_batch_id = type::record($batch_id);", {"workspace_id": workspace_id, "batch_id": batch_id})
    await repo_update("pilot_import_batch", batch_id, {"status": "rolled_back"})
    await _audit(workspace_id, actor["id"], "record_updated", "pilot_import_batch", batch_id, "Rolled back confirmed import batch")
    return {"status": "rolled_back", "batch_id": batch_id}


@router.post("/workspaces/{workspace_id}/assessments", status_code=201)
async def create_assessment(request: Request, workspace_id: str, payload: AssessmentCreate) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    await _class_actor(actor, workspace_id, "assessments_write", payload.class_id)
    total_marks = sum(question.max_marks for question in payload.questions)
    if payload.pass_mark > total_marks:
        raise HTTPException(status_code=422, detail="pass_mark cannot exceed total marks")
    assessment_data = payload.model_dump(exclude={"questions"})
    assessment = _first(await repo_create("pilot_assessment", {"workspace_id": workspace_id, **assessment_data, "total_marks": total_marks, "status": "draft"})) or {}
    questions = await repo_insert("pilot_question", [{"workspace_id": workspace_id, "assessment_id": assessment["id"], **question.model_dump()} for question in payload.questions])
    await _audit(workspace_id, actor["id"], "record_created", "pilot_assessment", str(assessment.get("id")), f"Created {payload.kind} assessment {payload.title}")
    return {**assessment, "questions": questions}


@router.get("/workspaces/{workspace_id}/assessments")
async def list_assessments(request: Request, workspace_id: str) -> list[dict[str, Any]]:
    actor = await require_pilot_actor(request)
    scoped = await _workspace_actor(actor, workspace_id, "dashboards_read")
    query = "SELECT *, (SELECT * FROM pilot_question WHERE assessment_id = $parent.id ORDER BY question_number) AS questions FROM pilot_assessment AS $parent WHERE workspace_id = type::record($workspace_id)"
    variables: dict[str, Any] = {"workspace_id": workspace_id}
    if scoped.get("role") == "teacher":
        query += " AND class_id INSIDE $assigned_class_ids"
        variables["assigned_class_ids"] = scoped.get("assigned_class_ids", [])
    return await repo_query(query + " ORDER BY created DESC;", variables)


async def _marks_context(workspace_id: str, assessment_id: str) -> tuple[dict[str, str], dict[int, dict[str, Any]], set[tuple[str, int]]]:
    learners = await repo_query("SELECT id, learner_code FROM pilot_learner WHERE workspace_id = type::record($workspace_id) AND status = 'active';", {"workspace_id": workspace_id})
    questions = await repo_query("SELECT id, question_number, max_marks FROM pilot_question WHERE workspace_id = type::record($workspace_id) AND assessment_id = type::record($assessment_id);", {"workspace_id": workspace_id, "assessment_id": assessment_id})
    existing = await repo_query("SELECT learner_id.learner_code AS learner_code, question_id.question_number AS question_number FROM pilot_mark WHERE workspace_id = type::record($workspace_id) AND assessment_id = type::record($assessment_id);", {"workspace_id": workspace_id, "assessment_id": assessment_id})
    return ({str(row["learner_code"]): str(row["id"]) for row in learners}, {int(row["question_number"]): row for row in questions}, {(str(row["learner_code"]), int(row["question_number"])) for row in existing})


@router.post("/workspaces/{workspace_id}/assessments/{assessment_id}/marks/import/preview")
async def preview_marks(request: Request, workspace_id: str, assessment_id: str, payload: CsvPayload) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    await _assessment_actor(actor, workspace_id, "marks_write", assessment_id)
    learners, questions, existing = await _marks_context(workspace_id, assessment_id)
    preview = validate_marks_csv(payload.csv_text, learner_codes=set(learners), question_maxima={number: float(row["max_marks"]) for number, row in questions.items()}, existing_pairs=existing)
    return _preview_json(preview)


@router.post("/workspaces/{workspace_id}/assessments/{assessment_id}/marks/import/confirm", status_code=201)
async def confirm_marks(request: Request, workspace_id: str, assessment_id: str, payload: CsvPayload) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    await _assessment_actor(actor, workspace_id, "marks_write", assessment_id)
    learners, questions, existing = await _marks_context(workspace_id, assessment_id)
    preview = validate_marks_csv(payload.csv_text, learner_codes=set(learners), question_maxima={number: float(row["max_marks"]) for number, row in questions.items()}, existing_pairs=existing)
    if preview.errors or preview.rejected_count:
        raise HTTPException(status_code=422, detail=_preview_json(preview))
    batch = _first(await repo_create("pilot_import_batch", {"workspace_id": workspace_id, "import_type": "marks", "status": "confirmed", "accepted_count": preview.accepted_count, "rejected_count": 0, "created_by": actor["id"]})) or {}
    records = await repo_insert("pilot_mark", [{"workspace_id": workspace_id, "assessment_id": assessment_id, "question_id": questions[int(row.data["question_number"])]["id"], "learner_id": learners[row.data["learner_code"]], "score": row.data["score"], "corrected": False, "import_batch_id": batch["id"]} for row in preview.rows])
    await _audit(workspace_id, actor["id"], "marks_imported", "pilot_import_batch", str(batch.get("id")), f"Imported {len(records)} mark rows")
    return {"status": "confirmed", "batch_id": batch.get("id"), "created_count": len(records)}


@router.post("/workspaces/{workspace_id}/assessments/{assessment_id}/marks/grid")
async def save_mark_grid(request: Request, workspace_id: str, assessment_id: str, payload: MarkGridPayload) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    await _assessment_actor(actor, workspace_id, "marks_write", assessment_id)
    questions = await repo_query("SELECT id, max_marks FROM pilot_question WHERE workspace_id = type::record($workspace_id) AND assessment_id = type::record($assessment_id);", {"workspace_id": workspace_id, "assessment_id": assessment_id})
    maxima = {str(row["id"]): float(row["max_marks"]) for row in questions}
    for row in payload.rows:
        if row.question_id not in maxima or row.score > maxima[row.question_id]:
            raise HTTPException(status_code=422, detail=f"Invalid score for question {row.question_id}")
        existing = _first(await repo_query("SELECT id FROM pilot_mark WHERE workspace_id = type::record($workspace_id) AND assessment_id = type::record($assessment_id) AND question_id = type::record($question_id) AND learner_id = type::record($learner_id) LIMIT 1;", {"workspace_id": workspace_id, "assessment_id": assessment_id, "question_id": row.question_id, "learner_id": row.learner_id}))
        if existing:
            if not row.correction_reason:
                raise HTTPException(status_code=409, detail="Existing marks require an explicit correction reason; no silent overwrites")
            await repo_update("pilot_mark", str(existing["id"]), {"score": row.score, "corrected": True, "corrected_by": actor["id"], "correction_note": row.correction_reason})
            action = "marks_corrected"
        else:
            await repo_create("pilot_mark", {"workspace_id": workspace_id, "assessment_id": assessment_id, **row.model_dump(exclude={"correction_reason"}), "corrected": False})
            action = "marks_imported"
        await _audit(workspace_id, actor["id"], action, "pilot_mark", str(existing.get("id") if existing else "new"), "Saved one verified manual mark")
    return {"saved_count": len(payload.rows), "no_silent_overwrites": True}


async def _assessment_summary(workspace_id: str, assessment_id: str) -> dict[str, Any]:
    rows = await repo_query(
        "SELECT learner_id, math::sum(score) AS earned, math::sum(question_id.max_marks) AS available "
        "FROM pilot_mark WHERE workspace_id = type::record($workspace_id) AND assessment_id = type::record($assessment_id) GROUP BY learner_id;",
        {"workspace_id": workspace_id, "assessment_id": assessment_id},
    )
    assessment = _first(await repo_query("SELECT pass_mark, total_marks FROM type::record($assessment_id) WHERE workspace_id = type::record($workspace_id);", {"assessment_id": assessment_id, "workspace_id": workspace_id})) or {"pass_mark": 0, "total_marks": 1}
    percentages = [(float(row["earned"]) / float(assessment["total_marks"])) * 100 for row in rows]
    pass_threshold = (float(assessment["pass_mark"]) / float(assessment["total_marks"])) * 100
    topics = await repo_query(
        "SELECT question_id.topic_id.name AS topic, math::sum(score) AS earned, math::sum(question_id.max_marks) AS available FROM pilot_mark "
        "WHERE workspace_id = type::record($workspace_id) AND assessment_id = type::record($assessment_id) GROUP BY question_id.topic_id.name;",
        {"workspace_id": workspace_id, "assessment_id": assessment_id},
    )
    return {
        "average": round(sum(percentages) / len(percentages), 2) if percentages else 0.0,
        "pass_rate": round((sum(value >= pass_threshold for value in percentages) / len(percentages)) * 100, 2) if percentages else 0.0,
        "participation": len(percentages),
        "topics": {str(row["topic"]): round((float(row["earned"]) / float(row["available"])) * 100, 2) if row["available"] else 0.0 for row in topics},
    }


@router.get("/workspaces/{workspace_id}/assessments/{assessment_id}/analysis")
async def assessment_analysis(request: Request, workspace_id: str, assessment_id: str) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    await _assessment_actor(actor, workspace_id, "dashboards_read", assessment_id)
    summary = await _assessment_summary(workspace_id, assessment_id)
    summary["dataset_mode"] = "pilot"
    summary["support_indicator_label"] = "Needs teacher review"
    return summary


@router.post("/workspaces/{workspace_id}/interventions", status_code=201)
async def create_intervention(request: Request, workspace_id: str, payload: InterventionCreate) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "interventions_write")
    workspace = await _workspace_record(workspace_id)
    record = _first(await repo_create("pilot_intervention", {"workspace_id": workspace_id, "school_label": workspace["school_name"], **payload.model_dump(), "verification_status": "unverified"})) or {}
    await _audit(workspace_id, actor["id"], "record_created", "pilot_intervention", str(record.get("id")), "Suggested by the system; teacher verification pending")
    return {**record, "origin_label": "Suggested by the system"}


@router.get("/workspaces/{workspace_id}/interventions")
async def list_interventions(request: Request, workspace_id: str) -> list[dict[str, Any]]:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "reports_read")
    return await repo_query("SELECT * FROM pilot_intervention WHERE workspace_id = type::record($workspace_id) ORDER BY created DESC;", {"workspace_id": workspace_id})


@router.put("/workspaces/{workspace_id}/interventions/{intervention_id}")
async def update_intervention(request: Request, workspace_id: str, intervention_id: str, payload: InterventionUpdate) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    scoped = await _intervention_actor(actor, workspace_id, "intervention_update", intervention_id)
    data = payload.model_dump(exclude_none=True)
    if payload.verification_status == "school_reviewed" and scoped.get("role") not in {"owner", "pilot_admin"}:
        raise HTTPException(status_code=403, detail="School review requires pilot admin")
    if payload.verification_status == "teacher_confirmed":
        action, label = "intervention_verified", "Teacher verified"
    elif payload.verification_status == "school_reviewed":
        action, label = "intervention_verified", "School reviewed"
    else:
        action, label = "record_updated", "Unverified"
    record = _first(await repo_update("pilot_intervention", intervention_id, data)) or {}
    await _audit(workspace_id, actor["id"], action, "pilot_intervention", intervention_id, f"{label}; status {payload.status or record.get('status', 'unchanged')}")
    return {**record, "verification_label": label}


@router.get("/workspaces/{workspace_id}/assessments/{follow_up_id}/comparison")
async def comparison(request: Request, workspace_id: str, follow_up_id: str) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    await _assessment_actor(actor, workspace_id, "reports_read", follow_up_id)
    follow_up = _first(await repo_query("SELECT * FROM type::record($id) WHERE workspace_id = type::record($workspace_id) AND kind = 'follow_up';", {"id": follow_up_id, "workspace_id": workspace_id}))
    if not follow_up or not follow_up.get("follow_up_to"):
        raise HTTPException(status_code=422, detail="Follow-up assessment is not linked to a diagnostic")
    diagnostic_id = str(follow_up["follow_up_to"])
    before = await _assessment_summary(workspace_id, diagnostic_id)
    after = await _assessment_summary(workspace_id, follow_up_id)
    intervention = _first(await repo_query("SELECT status FROM pilot_intervention WHERE workspace_id = type::record($workspace_id) AND source_assessment_id = type::record($diagnostic_id) ORDER BY created DESC LIMIT 1;", {"workspace_id": workspace_id, "diagnostic_id": diagnostic_id})) or {"status": "not_recorded"}
    return compare_assessment_summaries(diagnostic=before, follow_up=after, diagnostic_coverage=set(before["topics"]), follow_up_coverage=set(after["topics"]), intervention_status=str(intervention["status"]))


@router.get("/workspaces/{workspace_id}/readiness")
async def readiness(request: Request, workspace_id: str) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    scoped = await _workspace_actor(actor, workspace_id, "dashboards_read")
    if scoped.get("role") not in {"owner", "pilot_admin"}:
        raise HTTPException(status_code=403, detail="Pilot readiness is limited to owner and pilot admin")
    counts = _first(await repo_query(
        "RETURN { membership: count((SELECT id FROM pilot_membership WHERE workspace_id = type::record($workspace_id) AND active = true)), class: count((SELECT id FROM pilot_class WHERE workspace_id = type::record($workspace_id))), learner: count((SELECT id FROM pilot_learner WHERE workspace_id = type::record($workspace_id))), subject: count((SELECT id FROM pilot_subject WHERE workspace_id = type::record($workspace_id))), diagnostic: count((SELECT id FROM pilot_assessment WHERE workspace_id = type::record($workspace_id) AND kind = 'diagnostic')), mark: count((SELECT id FROM pilot_mark WHERE workspace_id = type::record($workspace_id))), intervention: count((SELECT id FROM pilot_intervention WHERE workspace_id = type::record($workspace_id))), follow_up: count((SELECT id FROM pilot_assessment WHERE workspace_id = type::record($workspace_id) AND kind = 'follow_up')), report: count((SELECT id FROM pilot_report WHERE workspace_id = type::record($workspace_id))) };",
        {"workspace_id": workspace_id},
    )) or {}
    result = build_readiness({"school_created": True, "teacher_added": counts.get("membership", 0) > 0, "class_created": counts.get("class", 0) > 0, "learners_imported": counts.get("learner", 0) > 0, "topics_configured": counts.get("subject", 0) > 0, "diagnostic_added": counts.get("diagnostic", 0) > 0, "marks_entered": counts.get("mark", 0) > 0, "intervention_recorded": counts.get("intervention", 0) > 0, "follow_up_completed": counts.get("follow_up", 0) > 0, "report_generated": counts.get("report", 0) > 0})
    result["dataset_mode"] = "pilot"
    return result


@router.post("/workspaces/{workspace_id}/reports", status_code=201)
async def generate_report(request: Request, workspace_id: str, payload: ReportCreate) -> dict[str, Any]:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "reports_generate")
    workspace = await _workspace_record(workspace_id)
    diagnostic = await _assessment_summary(workspace_id, payload.diagnostic_assessment_id)
    follow_up = await _assessment_summary(workspace_id, payload.follow_up_assessment_id)
    comparison_data = compare_assessment_summaries(diagnostic=diagnostic, follow_up=follow_up, diagnostic_coverage=set(diagnostic["topics"]), follow_up_coverage=set(follow_up["topics"]), intervention_status="review_required")
    versions = _first(await repo_query("SELECT count() AS total FROM pilot_report WHERE workspace_id = type::record($workspace_id);", {"workspace_id": workspace_id})) or {"total": 0}
    snapshot = {"pilot_context": {"school": workspace["school_name"], "academic_year": workspace["academic_year"], "term": workspace["term"]}, "diagnostic": diagnostic, "intervention": {"verification": "Teacher verification required"}, "follow_up": follow_up, "interpretation": {**comparison_data, "teacher_notes": payload.teacher_notes}, "disclosure": PILOT_REPORT_DISCLOSURE, "report_date": datetime.now(timezone.utc).isoformat()}
    record = _first(await repo_create("pilot_report", {"workspace_id": workspace_id, **payload.model_dump(exclude={"teacher_notes"}), "version": int(versions.get("total", 0)) + 1, "generated_by": actor["id"], "snapshot": snapshot})) or {}
    await _audit(workspace_id, actor["id"], "report_generated", "pilot_report", str(record.get("id")), f"Generated pilot evidence report version {record.get('version', 1)}")
    return {**record, "snapshot": snapshot}


@router.get("/workspaces/{workspace_id}/reports")
async def list_reports(request: Request, workspace_id: str) -> list[dict[str, Any]]:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "reports_read")
    return await repo_query("SELECT * FROM pilot_report WHERE workspace_id = type::record($workspace_id) ORDER BY version DESC;", {"workspace_id": workspace_id})


@router.get("/workspaces/{workspace_id}/reports/{report_id}.csv")
async def export_report_csv(request: Request, workspace_id: str, report_id: str) -> Response:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "reports_read")
    report = _first(await repo_query(
        "SELECT * FROM type::record($report_id) WHERE workspace_id = type::record($workspace_id) LIMIT 1;",
        {"report_id": report_id, "workspace_id": workspace_id},
    ))
    if not report:
        raise HTTPException(status_code=404, detail="Pilot report not found")
    snapshot = report.get("snapshot", {})
    diagnostic = snapshot.get("diagnostic", {})
    follow_up = snapshot.get("follow_up", {})
    rows = [
        ["report_version", report.get("version", "")],
        ["school", snapshot.get("pilot_context", {}).get("school", "")],
        ["diagnostic_average", diagnostic.get("average", "")],
        ["diagnostic_pass_rate", diagnostic.get("pass_rate", "")],
        ["follow_up_average", follow_up.get("average", "")],
        ["follow_up_pass_rate", follow_up.get("pass_rate", "")],
        ["school_review_status", report.get("school_review_status", "")],
        ["disclosure", PILOT_REPORT_DISCLOSURE],
    ]
    return Response(csv_text(["metric", "value"], rows), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=zimlearngraph-pilot-report-v{report.get('version', 1)}.csv"})


@router.get("/workspaces/{workspace_id}/audit")
async def audit_trail(request: Request, workspace_id: str) -> list[dict[str, Any]]:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "audit_read")
    return await repo_query("SELECT * FROM pilot_audit_event WHERE workspace_id = type::record($workspace_id) ORDER BY created DESC LIMIT 250;", {"workspace_id": workspace_id})


@router.get("/templates/learners.csv")
async def learners_template(request: Request) -> Response:
    await require_pilot_actor(request)
    return Response(csv_text(["learner_code", "class_name", "gender", "support_note", "status"], [["L001", "Form 3A", "", "", "active"]]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=zimlearngraph-learners.csv"})


@router.get("/templates/assessment-structure.csv")
async def structure_template(request: Request) -> Response:
    await require_pilot_actor(request)
    return Response(csv_text(["question_number", "topic", "max_marks", "label"], [[1, "Algebra", 10, "Solve linear equations"]]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=zimlearngraph-assessment-structure.csv"})


@router.get("/templates/marks.csv")
async def marks_template(request: Request) -> Response:
    await require_pilot_actor(request)
    return Response(csv_text(["learner_code", "question_number", "score"], [["L001", 1, 7]]), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=zimlearngraph-marks.csv"})


@router.get("/workspaces/{workspace_id}/exports/learners.csv")
async def learners_export(request: Request, workspace_id: str) -> Response:
    actor = await require_pilot_actor(request)
    await _workspace_actor(actor, workspace_id, "reports_read")
    rows = await repo_query("SELECT learner_code, class_id.name AS class_name, gender, support_note, status FROM pilot_learner WHERE workspace_id = type::record($workspace_id) ORDER BY learner_code;", {"workspace_id": workspace_id})
    return Response(csv_text(["learner_code", "class_name", "gender", "support_note", "status"], [[row.get(key, "") for key in ("learner_code", "class_name", "gender", "support_note", "status")] for row in rows]), media_type="text/csv")
