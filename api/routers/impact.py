"""
API router for Impact Intelligence — assessment analytics and interventions.

Phase 1 — CRUD endpoints for impact entities:
schools, class groups, learners, subjects, topics,
assessments, assessment questions, mark entries, and interventions.
"""

import csv
import io
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from loguru import logger

from api.models import (
    AssessmentAnalyticsResponse,
    ImpactAssessmentCreate,
    ImpactAssessmentListResponse,
    ImpactAssessmentQuestionCreate,
    ImpactAssessmentQuestionListResponse,
    ImpactAssessmentQuestionResponse,
    ImpactAssessmentQuestionUpdate,
    ImpactAssessmentResponse,
    ImpactAssessmentUpdate,
    ImpactClassGroupCreate,
    ImpactClassGroupListResponse,
    ImpactClassGroupResponse,
    ImpactClassGroupUpdate,
    ImpactInterventionCreate,
    ImpactInterventionListResponse,
    ImpactInterventionResponse,
    ImpactInterventionUpdate,
    ImpactLearnerCreate,
    ImpactLearnerListResponse,
    ImpactLearnerResponse,
    ImpactLearnerUpdate,
    ImpactMarkEntryCreate,
    ImpactMarkEntryListResponse,
    ImpactMarkEntryResponse,
    ImpactMarkEntryUpdate,
    ImpactSchoolCreate,
    ImpactSchoolListResponse,
    ImpactSchoolResponse,
    ImpactSchoolUpdate,
    ImpactSubjectCreate,
    ImpactSubjectListResponse,
    ImpactSubjectResponse,
    ImpactSubjectUpdate,
    ImpactTopicCreate,
    ImpactTopicListResponse,
    ImpactTopicResponse,
    ImpactTopicUpdate,
    InterventionRecommendationResponse,
    LearnerPerformanceResponse,
    QuestionPerformanceResponse,
    TopicPerformanceResponse,
)
from vault_core.analytics.impact import ImpactAnalyticsEngine
from vault_core.database.repository import repo_query
from vault_core.domain.impact import (
    ImpactAssessment,
    ImpactAssessmentQuestion,
    ImpactClassGroup,
    ImpactIntervention,
    ImpactLearner,
    ImpactMarkEntry,
    ImpactSchool,
    ImpactSubject,
    ImpactTopic,
)
from vault_core.exceptions import NotFoundError

router = APIRouter(prefix="/impact", tags=["impact"])


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


# =========================================================================
# Schools
# =========================================================================


@router.get("/schools", response_model=ImpactSchoolListResponse)
async def list_schools() -> ImpactSchoolListResponse:
    """List all Impact Schools."""
    schools = await ImpactSchool.get_all(order_by="name")
    return ImpactSchoolListResponse(
        schools=[
            ImpactSchoolResponse(
                id=_strip_prefix(str(s.id or "")),
                name=s.name,
                district=s.district,
                province=s.province,
                school_type=s.school_type,
                active=s.active,
                created=str(s.created) if s.created else "",
                updated=str(s.updated) if s.updated else "",
            )
            for s in schools
        ],
        total=len(schools),
    )


@router.get("/schools/{school_id}", response_model=ImpactSchoolResponse)
async def get_school(school_id: str) -> ImpactSchoolResponse:
    """Get an Impact School by ID."""
    school_id = _ensure_prefixed(school_id, "impact_school")
    school = await ImpactSchool.get(school_id)
    if not school:
        raise NotFoundError(f"School {school_id} not found")
    return ImpactSchoolResponse(
        id=_strip_prefix(str(school.id or "")),
        name=school.name,
        district=school.district,
        province=school.province,
        school_type=school.school_type,
        active=school.active,
        created=str(school.created) if school.created else "",
        updated=str(school.updated) if school.updated else "",
    )


@router.post("/schools", response_model=ImpactSchoolResponse)
async def create_school(data: ImpactSchoolCreate) -> ImpactSchoolResponse:
    """Create a new Impact School."""
    school = ImpactSchool(
        name=data.name,
        district=data.district,
        province=data.province,
        school_type=data.school_type,
    )
    await school.save()
    logger.info(f"Created Impact School: {school.id}")
    return ImpactSchoolResponse(
        id=_strip_prefix(str(school.id or "")),
        name=school.name,
        district=school.district,
        province=school.province,
        school_type=school.school_type,
        active=school.active,
        created=str(school.created) if school.created else "",
        updated=str(school.updated) if school.updated else "",
    )


@router.put("/schools/{school_id}", response_model=ImpactSchoolResponse)
async def update_school(
    school_id: str, data: ImpactSchoolUpdate
) -> ImpactSchoolResponse:
    """Update an Impact School."""
    school_id = _ensure_prefixed(school_id, "impact_school")
    school = await ImpactSchool.get(school_id)
    if not school:
        raise NotFoundError(f"School {school_id} not found")

    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        for key, value in update_data.items():
            setattr(school, key, value)
        await school.save()
        logger.info(f"Updated Impact School: {school_id}")

    return ImpactSchoolResponse(
        id=_strip_prefix(str(school.id or "")),
        name=school.name,
        district=school.district,
        province=school.province,
        school_type=school.school_type,
        active=school.active,
        created=str(school.created) if school.created else "",
        updated=str(school.updated) if school.updated else "",
    )


@router.delete("/schools/{school_id}")
async def delete_school(school_id: str) -> Dict[str, str]:
    """Delete an Impact School."""
    school_id = _ensure_prefixed(school_id, "impact_school")
    school = await ImpactSchool.get(school_id)
    if not school:
        raise NotFoundError(f"School {school_id} not found")
    await school.delete()
    logger.info(f"Deleted Impact School: {school_id}")
    return {"message": f"School {school_id} deleted"}


# =========================================================================
# Class Groups
# =========================================================================


@router.get("/classes", response_model=ImpactClassGroupListResponse)
async def list_class_groups(
    school_id: Optional[str] = Query(None, description="Filter by school ID")
) -> ImpactClassGroupListResponse:
    """List Impact Class Groups, optionally filtered by school."""
    if school_id:
        school_id = _ensure_prefixed(school_id, "impact_school")
        result = await repo_query(
            "SELECT * FROM impact_class_group WHERE school_id = $school_id ORDER BY name",
            {"school_id": school_id},
        )
        class_groups = [ImpactClassGroup(**r) for r in result]
    else:
        class_groups = await ImpactClassGroup.get_all(order_by="name")
    return ImpactClassGroupListResponse(
        class_groups=[
            ImpactClassGroupResponse(
                id=_strip_prefix(str(c.id or "")),
                school_id=_strip_prefix(str(c.school_id)),
                name=c.name,
                grade_level=c.grade_level,
                academic_year=c.academic_year,
                teacher_name=c.teacher_name,
                active=c.active,
                created=str(c.created) if c.created else "",
                updated=str(c.updated) if c.updated else "",
            )
            for c in class_groups
        ],
        total=len(class_groups),
    )


@router.get("/classes/{class_group_id}", response_model=ImpactClassGroupResponse)
async def get_class_group(class_group_id: str) -> ImpactClassGroupResponse:
    """Get an Impact Class Group by ID."""
    class_group_id = _ensure_prefixed(class_group_id, "impact_class_group")
    class_group = await ImpactClassGroup.get(class_group_id)
    if not class_group:
        raise NotFoundError(f"Class Group {class_group_id} not found")
    return ImpactClassGroupResponse(
        id=_strip_prefix(str(class_group.id or "")),
        school_id=_strip_prefix(str(class_group.school_id)),
        name=class_group.name,
        grade_level=class_group.grade_level,
        academic_year=class_group.academic_year,
        teacher_name=class_group.teacher_name,
        active=class_group.active,
        created=str(class_group.created) if class_group.created else "",
        updated=str(class_group.updated) if class_group.updated else "",
    )


@router.post("/classes", response_model=ImpactClassGroupResponse)
async def create_class_group(data: ImpactClassGroupCreate) -> ImpactClassGroupResponse:
    """Create a new Impact Class Group."""
    class_group = ImpactClassGroup(
        school_id=_ensure_prefixed(data.school_id, "impact_school"),
        name=data.name,
        grade_level=data.grade_level,
        academic_year=data.academic_year,
        teacher_name=data.teacher_name,
    )
    await class_group.save()
    logger.info(f"Created Impact Class Group: {class_group.id}")
    return ImpactClassGroupResponse(
        id=_strip_prefix(str(class_group.id or "")),
        school_id=_strip_prefix(str(class_group.school_id)),
        name=class_group.name,
        grade_level=class_group.grade_level,
        academic_year=class_group.academic_year,
        teacher_name=class_group.teacher_name,
        active=class_group.active,
        created=str(class_group.created) if class_group.created else "",
        updated=str(class_group.updated) if class_group.updated else "",
    )


@router.put("/classes/{class_group_id}", response_model=ImpactClassGroupResponse)
async def update_class_group(
    class_group_id: str, data: ImpactClassGroupUpdate
) -> ImpactClassGroupResponse:
    """Update an Impact Class Group."""
    class_group_id = _ensure_prefixed(class_group_id, "impact_class_group")
    class_group = await ImpactClassGroup.get(class_group_id)
    if not class_group:
        raise NotFoundError(f"Class Group {class_group_id} not found")

    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        for key, value in update_data.items():
            setattr(class_group, key, value)
        await class_group.save()
        logger.info(f"Updated Impact Class Group: {class_group_id}")

    return ImpactClassGroupResponse(
        id=_strip_prefix(str(class_group.id or "")),
        school_id=_strip_prefix(str(class_group.school_id)),
        name=class_group.name,
        grade_level=class_group.grade_level,
        academic_year=class_group.academic_year,
        teacher_name=class_group.teacher_name,
        active=class_group.active,
        created=str(class_group.created) if class_group.created else "",
        updated=str(class_group.updated) if class_group.updated else "",
    )


@router.delete("/classes/{class_group_id}")
async def delete_class_group(class_group_id: str) -> Dict[str, str]:
    """Delete an Impact Class Group."""
    class_group_id = _ensure_prefixed(class_group_id, "impact_class_group")
    class_group = await ImpactClassGroup.get(class_group_id)
    if not class_group:
        raise NotFoundError(f"Class Group {class_group_id} not found")
    await class_group.delete()
    logger.info(f"Deleted Impact Class Group: {class_group_id}")
    return {"message": f"Class Group {class_group_id} deleted"}


# =========================================================================
# Learners
# =========================================================================


@router.get("/learners", response_model=ImpactLearnerListResponse)
async def list_learners(
    class_group_id: Optional[str] = Query(None, description="Filter by class group ID")
) -> ImpactLearnerListResponse:
    """List Impact Learners, optionally filtered by class group."""
    if class_group_id:
        class_group_id = _ensure_prefixed(class_group_id, "impact_class_group")
        result = await repo_query(
            "SELECT * FROM impact_learner WHERE class_group_id = $class_group_id ORDER BY learner_code",
            {"class_group_id": class_group_id},
        )
        learners = [ImpactLearner(**r) for r in result]
    else:
        learners = await ImpactLearner.get_all(order_by="learner_code")
    return ImpactLearnerListResponse(
        learners=[
            ImpactLearnerResponse(
                id=_strip_prefix(str(l.id or "")),
                school_id=_strip_prefix(str(l.school_id)),
                class_group_id=_strip_prefix(str(l.class_group_id)),
                learner_code=l.learner_code,
                display_name=l.display_name,
                status=l.status,
                created=str(l.created) if l.created else "",
                updated=str(l.updated) if l.updated else "",
            )
            for l in learners
        ],
        total=len(learners),
    )


@router.get("/learners/{learner_id}", response_model=ImpactLearnerResponse)
async def get_learner(learner_id: str) -> ImpactLearnerResponse:
    """Get an Impact Learner by ID."""
    learner_id = _ensure_prefixed(learner_id, "impact_learner")
    learner = await ImpactLearner.get(learner_id)
    if not learner:
        raise NotFoundError(f"Learner {learner_id} not found")
    return ImpactLearnerResponse(
        id=_strip_prefix(str(learner.id or "")),
        school_id=_strip_prefix(str(learner.school_id)),
        class_group_id=_strip_prefix(str(learner.class_group_id)),
        learner_code=learner.learner_code,
        display_name=learner.display_name,
        status=learner.status,
        created=str(learner.created) if learner.created else "",
        updated=str(learner.updated) if learner.updated else "",
    )


@router.post("/learners", response_model=ImpactLearnerResponse)
async def create_learner(data: ImpactLearnerCreate) -> ImpactLearnerResponse:
    """Create a new Impact Learner."""
    learner = ImpactLearner(
        school_id=_ensure_prefixed(data.school_id, "impact_school"),
        class_group_id=_ensure_prefixed(data.class_group_id, "impact_class_group"),
        learner_code=data.learner_code,
        display_name=data.display_name,
        status=data.status,
    )
    await learner.save()
    logger.info(f"Created Impact Learner: {learner.id}")
    return ImpactLearnerResponse(
        id=_strip_prefix(str(learner.id or "")),
        school_id=_strip_prefix(str(learner.school_id)),
        class_group_id=_strip_prefix(str(learner.class_group_id)),
        learner_code=learner.learner_code,
        display_name=learner.display_name,
        status=learner.status,
        created=str(learner.created) if learner.created else "",
        updated=str(learner.updated) if learner.updated else "",
    )


@router.put("/learners/{learner_id}", response_model=ImpactLearnerResponse)
async def update_learner(
    learner_id: str, data: ImpactLearnerUpdate
) -> ImpactLearnerResponse:
    """Update an Impact Learner."""
    learner_id = _ensure_prefixed(learner_id, "impact_learner")
    learner = await ImpactLearner.get(learner_id)
    if not learner:
        raise NotFoundError(f"Learner {learner_id} not found")

    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        for key, value in update_data.items():
            setattr(learner, key, value)
        await learner.save()
        logger.info(f"Updated Impact Learner: {learner_id}")

    return ImpactLearnerResponse(
        id=_strip_prefix(str(learner.id or "")),
        school_id=_strip_prefix(str(learner.school_id)),
        class_group_id=_strip_prefix(str(learner.class_group_id)),
        learner_code=learner.learner_code,
        display_name=learner.display_name,
        status=learner.status,
        created=str(learner.created) if learner.created else "",
        updated=str(learner.updated) if learner.updated else "",
    )


@router.delete("/learners/{learner_id}")
async def delete_learner(learner_id: str) -> Dict[str, str]:
    """Delete an Impact Learner."""
    learner_id = _ensure_prefixed(learner_id, "impact_learner")
    learner = await ImpactLearner.get(learner_id)
    if not learner:
        raise NotFoundError(f"Learner {learner_id} not found")
    await learner.delete()
    logger.info(f"Deleted Impact Learner: {learner_id}")
    return {"message": f"Learner {learner_id} deleted"}


# =========================================================================
# Subjects
# =========================================================================


@router.get("/subjects", response_model=ImpactSubjectListResponse)
async def list_subjects() -> ImpactSubjectListResponse:
    """List all Impact Subjects."""
    subjects = await ImpactSubject.get_all(order_by="name")
    return ImpactSubjectListResponse(
        subjects=[
            ImpactSubjectResponse(
                id=_strip_prefix(str(s.id or "")),
                name=s.name,
                level=s.level,
                curriculum=s.curriculum,
                created=str(s.created) if s.created else "",
                updated=str(s.updated) if s.updated else "",
            )
            for s in subjects
        ],
        total=len(subjects),
    )


@router.get("/subjects/{subject_id}", response_model=ImpactSubjectResponse)
async def get_subject(subject_id: str) -> ImpactSubjectResponse:
    """Get an Impact Subject by ID."""
    subject_id = _ensure_prefixed(subject_id, "impact_subject")
    subject = await ImpactSubject.get(subject_id)
    if not subject:
        raise NotFoundError(f"Subject {subject_id} not found")
    return ImpactSubjectResponse(
        id=_strip_prefix(str(subject.id or "")),
        name=subject.name,
        level=subject.level,
        curriculum=subject.curriculum,
        created=str(subject.created) if subject.created else "",
        updated=str(subject.updated) if subject.updated else "",
    )


@router.post("/subjects", response_model=ImpactSubjectResponse)
async def create_subject(data: ImpactSubjectCreate) -> ImpactSubjectResponse:
    """Create a new Impact Subject."""
    subject = ImpactSubject(
        name=data.name,
        level=data.level,
        curriculum=data.curriculum,
    )
    await subject.save()
    logger.info(f"Created Impact Subject: {subject.id}")
    return ImpactSubjectResponse(
        id=_strip_prefix(str(subject.id or "")),
        name=subject.name,
        level=subject.level,
        curriculum=subject.curriculum,
        created=str(subject.created) if subject.created else "",
        updated=str(subject.updated) if subject.updated else "",
    )


@router.put("/subjects/{subject_id}", response_model=ImpactSubjectResponse)
async def update_subject(
    subject_id: str, data: ImpactSubjectUpdate
) -> ImpactSubjectResponse:
    """Update an Impact Subject."""
    subject_id = _ensure_prefixed(subject_id, "impact_subject")
    subject = await ImpactSubject.get(subject_id)
    if not subject:
        raise NotFoundError(f"Subject {subject_id} not found")

    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        for key, value in update_data.items():
            setattr(subject, key, value)
        await subject.save()
        logger.info(f"Updated Impact Subject: {subject_id}")

    return ImpactSubjectResponse(
        id=_strip_prefix(str(subject.id or "")),
        name=subject.name,
        level=subject.level,
        curriculum=subject.curriculum,
        created=str(subject.created) if subject.created else "",
        updated=str(subject.updated) if subject.updated else "",
    )


@router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str) -> Dict[str, str]:
    """Delete an Impact Subject."""
    subject_id = _ensure_prefixed(subject_id, "impact_subject")
    subject = await ImpactSubject.get(subject_id)
    if not subject:
        raise NotFoundError(f"Subject {subject_id} not found")
    await subject.delete()
    logger.info(f"Deleted Impact Subject: {subject_id}")
    return {"message": f"Subject {subject_id} deleted"}


# =========================================================================
# Topics
# =========================================================================


@router.get("/topics", response_model=ImpactTopicListResponse)
async def list_topics(
    subject_id: Optional[str] = Query(None, description="Filter by subject ID")
) -> ImpactTopicListResponse:
    """List Impact Topics, optionally filtered by subject."""
    if subject_id:
        subject_id = _ensure_prefixed(subject_id, "impact_subject")
        result = await repo_query(
            "SELECT * FROM impact_topic WHERE subject_id = $subject_id ORDER BY name",
            {"subject_id": subject_id},
        )
        topics = [ImpactTopic(**r) for r in result]
    else:
        topics = await ImpactTopic.get_all(order_by="name")
    return ImpactTopicListResponse(
        topics=[
            ImpactTopicResponse(
                id=_strip_prefix(str(t.id or "")),
                subject_id=_strip_prefix(str(t.subject_id)),
                name=t.name,
                strand=t.strand,
                syllabus_code=t.syllabus_code,
                created=str(t.created) if t.created else "",
                updated=str(t.updated) if t.updated else "",
            )
            for t in topics
        ],
        total=len(topics),
    )


@router.get("/topics/{topic_id}", response_model=ImpactTopicResponse)
async def get_topic(topic_id: str) -> ImpactTopicResponse:
    """Get an Impact Topic by ID."""
    topic_id = _ensure_prefixed(topic_id, "impact_topic")
    topic = await ImpactTopic.get(topic_id)
    if not topic:
        raise NotFoundError(f"Topic {topic_id} not found")
    return ImpactTopicResponse(
        id=_strip_prefix(str(topic.id or "")),
        subject_id=_strip_prefix(str(topic.subject_id)),
        name=topic.name,
        strand=topic.strand,
        syllabus_code=topic.syllabus_code,
        created=str(topic.created) if topic.created else "",
        updated=str(topic.updated) if topic.updated else "",
    )


@router.post("/topics", response_model=ImpactTopicResponse)
async def create_topic(data: ImpactTopicCreate) -> ImpactTopicResponse:
    """Create a new Impact Topic."""
    topic = ImpactTopic(
        subject_id=_ensure_prefixed(data.subject_id, "impact_subject"),
        name=data.name,
        strand=data.strand,
        syllabus_code=data.syllabus_code,
    )
    await topic.save()
    logger.info(f"Created Impact Topic: {topic.id}")
    return ImpactTopicResponse(
        id=_strip_prefix(str(topic.id or "")),
        subject_id=_strip_prefix(str(topic.subject_id)),
        name=topic.name,
        strand=topic.strand,
        syllabus_code=topic.syllabus_code,
        created=str(topic.created) if topic.created else "",
        updated=str(topic.updated) if topic.updated else "",
    )


@router.put("/topics/{topic_id}", response_model=ImpactTopicResponse)
async def update_topic(
    topic_id: str, data: ImpactTopicUpdate
) -> ImpactTopicResponse:
    """Update an Impact Topic."""
    topic_id = _ensure_prefixed(topic_id, "impact_topic")
    topic = await ImpactTopic.get(topic_id)
    if not topic:
        raise NotFoundError(f"Topic {topic_id} not found")

    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        for key, value in update_data.items():
            setattr(topic, key, value)
        await topic.save()
        logger.info(f"Updated Impact Topic: {topic_id}")

    return ImpactTopicResponse(
        id=_strip_prefix(str(topic.id or "")),
        subject_id=_strip_prefix(str(topic.subject_id)),
        name=topic.name,
        strand=topic.strand,
        syllabus_code=topic.syllabus_code,
        created=str(topic.created) if topic.created else "",
        updated=str(topic.updated) if topic.updated else "",
    )


@router.delete("/topics/{topic_id}")
async def delete_topic(topic_id: str) -> Dict[str, str]:
    """Delete an Impact Topic."""
    topic_id = _ensure_prefixed(topic_id, "impact_topic")
    topic = await ImpactTopic.get(topic_id)
    if not topic:
        raise NotFoundError(f"Topic {topic_id} not found")
    await topic.delete()
    logger.info(f"Deleted Impact Topic: {topic_id}")
    return {"message": f"Topic {topic_id} deleted"}


# =========================================================================
# Assessments
# =========================================================================


@router.get("/assessments", response_model=ImpactAssessmentListResponse)
async def list_assessments(
    class_group_id: Optional[str] = Query(None, description="Filter by class group ID"),
    subject_id: Optional[str] = Query(None, description="Filter by subject ID"),
) -> ImpactAssessmentListResponse:
    """List Impact Assessments, optionally filtered by class group or subject."""
    conditions = []
    params: Dict[str, str] = {}
    if class_group_id:
        conditions.append("class_group_id = $class_group_id")
        params["class_group_id"] = _ensure_prefixed(class_group_id, "impact_class_group")
    if subject_id:
        conditions.append("subject_id = $subject_id")
        params["subject_id"] = _ensure_prefixed(subject_id, "impact_subject")

    if conditions:
        where_clause = " AND ".join(conditions)
        result = await repo_query(
            f"SELECT * FROM impact_assessment WHERE {where_clause} ORDER BY created DESC",
            params,
        )
        assessments = [ImpactAssessment(**r) for r in result]
    else:
        assessments = await ImpactAssessment.get_all(order_by="created desc")
    return ImpactAssessmentListResponse(
        assessments=[
            ImpactAssessmentResponse(
                id=_strip_prefix(str(a.id or "")),
                school_id=_strip_prefix(str(a.school_id)),
                class_group_id=_strip_prefix(str(a.class_group_id)),
                subject_id=_strip_prefix(str(a.subject_id)),
                title=a.title,
                assessment_type=a.assessment_type,
                term=a.term,
                date_written=str(a.date_written) if a.date_written else None,
                total_marks=a.total_marks,
                pass_mark=a.pass_mark,
                status=a.status,
                created=str(a.created) if a.created else "",
                updated=str(a.updated) if a.updated else "",
            )
            for a in assessments
        ],
        total=len(assessments),
    )


@router.get("/assessments/{assessment_id}", response_model=ImpactAssessmentResponse)
async def get_assessment(assessment_id: str) -> ImpactAssessmentResponse:
    """Get an Impact Assessment by ID."""
    assessment_id = _ensure_prefixed(assessment_id, "impact_assessment")
    assessment = await ImpactAssessment.get(assessment_id)
    if not assessment:
        raise NotFoundError(f"Assessment {assessment_id} not found")
    return ImpactAssessmentResponse(
        id=_strip_prefix(str(assessment.id or "")),
        school_id=_strip_prefix(str(assessment.school_id)),
        class_group_id=_strip_prefix(str(assessment.class_group_id)),
        subject_id=_strip_prefix(str(assessment.subject_id)),
        title=assessment.title,
        assessment_type=assessment.assessment_type,
        term=assessment.term,
        date_written=str(assessment.date_written) if assessment.date_written else None,
        total_marks=assessment.total_marks,
        pass_mark=assessment.pass_mark,
        status=assessment.status,
        created=str(assessment.created) if assessment.created else "",
        updated=str(assessment.updated) if assessment.updated else "",
    )


@router.post("/assessments", response_model=ImpactAssessmentResponse)
async def create_assessment(data: ImpactAssessmentCreate) -> ImpactAssessmentResponse:
    """Create a new Impact Assessment."""
    assessment = ImpactAssessment(
        school_id=_ensure_prefixed(data.school_id, "impact_school"),
        class_group_id=_ensure_prefixed(data.class_group_id, "impact_class_group"),
        subject_id=_ensure_prefixed(data.subject_id, "impact_subject"),
        title=data.title,
        assessment_type=data.assessment_type,
        term=data.term,
        date_written=data.date_written,
        total_marks=data.total_marks,
        pass_mark=data.pass_mark,
        status=data.status,
    )
    await assessment.save()
    logger.info(f"Created Impact Assessment: {assessment.id}")
    return ImpactAssessmentResponse(
        id=_strip_prefix(str(assessment.id or "")),
        school_id=_strip_prefix(str(assessment.school_id)),
        class_group_id=_strip_prefix(str(assessment.class_group_id)),
        subject_id=_strip_prefix(str(assessment.subject_id)),
        title=assessment.title,
        assessment_type=assessment.assessment_type,
        term=assessment.term,
        date_written=str(assessment.date_written) if assessment.date_written else None,
        total_marks=assessment.total_marks,
        pass_mark=assessment.pass_mark,
        status=assessment.status,
        created=str(assessment.created) if assessment.created else "",
        updated=str(assessment.updated) if assessment.updated else "",
    )


@router.put("/assessments/{assessment_id}", response_model=ImpactAssessmentResponse)
async def update_assessment(
    assessment_id: str, data: ImpactAssessmentUpdate
) -> ImpactAssessmentResponse:
    """Update an Impact Assessment."""
    assessment_id = _ensure_prefixed(assessment_id, "impact_assessment")
    assessment = await ImpactAssessment.get(assessment_id)
    if not assessment:
        raise NotFoundError(f"Assessment {assessment_id} not found")

    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        for key, value in update_data.items():
            setattr(assessment, key, value)
        await assessment.save()
        logger.info(f"Updated Impact Assessment: {assessment_id}")

    return ImpactAssessmentResponse(
        id=_strip_prefix(str(assessment.id or "")),
        school_id=_strip_prefix(str(assessment.school_id)),
        class_group_id=_strip_prefix(str(assessment.class_group_id)),
        subject_id=_strip_prefix(str(assessment.subject_id)),
        title=assessment.title,
        assessment_type=assessment.assessment_type,
        term=assessment.term,
        date_written=str(assessment.date_written) if assessment.date_written else None,
        total_marks=assessment.total_marks,
        pass_mark=assessment.pass_mark,
        status=assessment.status,
        created=str(assessment.created) if assessment.created else "",
        updated=str(assessment.updated) if assessment.updated else "",
    )


@router.delete("/assessments/{assessment_id}")
async def delete_assessment(assessment_id: str) -> Dict[str, str]:
    """Delete an Impact Assessment."""
    assessment_id = _ensure_prefixed(assessment_id, "impact_assessment")
    assessment = await ImpactAssessment.get(assessment_id)
    if not assessment:
        raise NotFoundError(f"Assessment {assessment_id} not found")
    await assessment.delete()
    logger.info(f"Deleted Impact Assessment: {assessment_id}")
    return {"message": f"Assessment {assessment_id} deleted"}


@router.get(
    "/assessments/{assessment_id}/analytics",
    response_model=AssessmentAnalyticsResponse,
)
async def get_assessment_analytics(
    assessment_id: str,
) -> AssessmentAnalyticsResponse:
    """
    Get deterministic analytics for an assessment.

    Calculates class performance, topic weaknesses, question weaknesses,
    learner risk, and intervention recommendations.
    """
    assessment_id = _ensure_prefixed(assessment_id, "impact_assessment")
    try:
        analytics = await ImpactAnalyticsEngine.calculate_analytics(assessment_id)
    except ValueError as e:
        raise NotFoundError(str(e))

    return AssessmentAnalyticsResponse(
        assessment_id=analytics.assessment_id,
        assessment_title=analytics.assessment_title,
        assessment_type=analytics.assessment_type,
        total_marks=analytics.total_marks,
        pass_mark=analytics.pass_mark,
        term=analytics.term,
        total_learners=analytics.total_learners,
        learners_assessed=analytics.learners_assessed,
        mark_completion_rate=analytics.mark_completion_rate,
        class_average_percentage=analytics.class_average_percentage,
        pass_rate=analytics.pass_rate,
        failure_rate=analytics.failure_rate,
        question_performance=[
            QuestionPerformanceResponse(
                question_id=q.question_id,
                question_number=q.question_number,
                label=q.label,
                max_marks=q.max_marks,
                topic_id=q.topic_id,
                skill_type=q.skill_type,
                difficulty=q.difficulty,
                total_score=q.total_score,
                num_learners=q.num_learners,
                average_score=q.average_score,
                average_percentage=q.average_percentage,
                is_critical=q.is_critical,
            )
            for q in analytics.question_performance
        ],
        topic_performance=[
            TopicPerformanceResponse(
                topic_id=t.topic_id,
                topic_name=t.topic_name,
                total_score=t.total_score,
                total_max_marks=t.total_max_marks,
                percentage=t.percentage,
                num_questions=t.num_questions,
                num_learners=t.num_learners,
                is_weak=t.is_weak,
                is_critical=t.is_critical,
            )
            for t in analytics.topic_performance
        ],
        learner_performance=[
            LearnerPerformanceResponse(
                learner_id=l.learner_id,
                learner_code=l.learner_code,
                display_name=l.display_name,
                total_score=l.total_score,
                total_max_marks=l.total_max_marks,
                percentage=l.percentage,
                passed=l.passed,
                risk_level=l.risk_level,
                questions_answered=l.questions_answered,
                total_questions=l.total_questions,
            )
            for l in analytics.learner_performance
        ],
        weak_topics=[
            TopicPerformanceResponse(
                topic_id=t.topic_id,
                topic_name=t.topic_name,
                total_score=t.total_score,
                total_max_marks=t.total_max_marks,
                percentage=t.percentage,
                num_questions=t.num_questions,
                num_learners=t.num_learners,
                is_weak=t.is_weak,
                is_critical=t.is_critical,
            )
            for t in analytics.weak_topics
        ],
        at_risk_learners=[
            LearnerPerformanceResponse(
                learner_id=l.learner_id,
                learner_code=l.learner_code,
                display_name=l.display_name,
                total_score=l.total_score,
                total_max_marks=l.total_max_marks,
                percentage=l.percentage,
                passed=l.passed,
                risk_level=l.risk_level,
                questions_answered=l.questions_answered,
                total_questions=l.total_questions,
            )
            for l in analytics.at_risk_learners
        ],
        interventions=[
            InterventionRecommendationResponse(
                intervention_type=i.intervention_type,
                entity_type=i.entity_type,
                entity_id=i.entity_id,
                entity_name=i.entity_name,
                severity=i.severity,
                recommendation=i.recommendation,
                percentage=i.percentage,
            )
            for i in analytics.interventions
        ],
    )


# =========================================================================
# Assessment Questions
# =========================================================================


@router.get(
    "/assessments/{assessment_id}/questions",
    response_model=ImpactAssessmentQuestionListResponse,
)
async def list_assessment_questions(
    assessment_id: str,
) -> ImpactAssessmentQuestionListResponse:
    """List questions for an assessment."""
    assessment_id = _ensure_prefixed(assessment_id, "impact_assessment")
    result = await repo_query(
        "SELECT * FROM impact_assessment_question WHERE assessment_id = $assessment_id ORDER BY question_number",
        {"assessment_id": assessment_id},
    )
    questions = [ImpactAssessmentQuestion(**r) for r in result]
    return ImpactAssessmentQuestionListResponse(
        questions=[
            ImpactAssessmentQuestionResponse(
                id=_strip_prefix(str(q.id or "")),
                assessment_id=_strip_prefix(str(q.assessment_id)),
                question_number=q.question_number,
                label=q.label,
                max_marks=q.max_marks,
                topic_id=_strip_prefix(str(q.topic_id)) if q.topic_id else None,
                skill_type=q.skill_type,
                difficulty=q.difficulty,
                created=str(q.created) if q.created else "",
                updated=str(q.updated) if q.updated else "",
            )
            for q in questions
        ],
        total=len(questions),
    )


@router.get(
    "/questions/{question_id}", response_model=ImpactAssessmentQuestionResponse
)
async def get_assessment_question(
    question_id: str,
) -> ImpactAssessmentQuestionResponse:
    """Get an assessment question by ID."""
    question_id = _ensure_prefixed(question_id, "impact_assessment_question")
    question = await ImpactAssessmentQuestion.get(question_id)
    if not question:
        raise NotFoundError(f"Question {question_id} not found")
    return ImpactAssessmentQuestionResponse(
        id=_strip_prefix(str(question.id or "")),
        assessment_id=_strip_prefix(str(question.assessment_id)),
        question_number=question.question_number,
        label=question.label,
        max_marks=question.max_marks,
        topic_id=_strip_prefix(str(question.topic_id)) if question.topic_id else None,
        skill_type=question.skill_type,
        difficulty=question.difficulty,
        created=str(question.created) if question.created else "",
        updated=str(question.updated) if question.updated else "",
    )


@router.post("/questions", response_model=ImpactAssessmentQuestionResponse)
async def create_assessment_question(
    data: ImpactAssessmentQuestionCreate,
) -> ImpactAssessmentQuestionResponse:
    """Create a new assessment question."""
    question = ImpactAssessmentQuestion(
        assessment_id=_ensure_prefixed(data.assessment_id, "impact_assessment"),
        question_number=data.question_number,
        label=data.label,
        max_marks=data.max_marks,
        topic_id=_ensure_prefixed(data.topic_id, "impact_topic") if data.topic_id else None,
        skill_type=data.skill_type,
        difficulty=data.difficulty,
    )
    await question.save()
    logger.info(f"Created Impact Assessment Question: {question.id}")
    return ImpactAssessmentQuestionResponse(
        id=_strip_prefix(str(question.id or "")),
        assessment_id=_strip_prefix(str(question.assessment_id)),
        question_number=question.question_number,
        label=question.label,
        max_marks=question.max_marks,
        topic_id=_strip_prefix(str(question.topic_id)) if question.topic_id else None,
        skill_type=question.skill_type,
        difficulty=question.difficulty,
        created=str(question.created) if question.created else "",
        updated=str(question.updated) if question.updated else "",
    )


@router.put("/questions/{question_id}", response_model=ImpactAssessmentQuestionResponse)
async def update_assessment_question(
    question_id: str, data: ImpactAssessmentQuestionUpdate
) -> ImpactAssessmentQuestionResponse:
    """Update an assessment question."""
    question_id = _ensure_prefixed(question_id, "impact_assessment_question")
    question = await ImpactAssessmentQuestion.get(question_id)
    if not question:
        raise NotFoundError(f"Question {question_id} not found")

    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        for key, value in update_data.items():
            setattr(question, key, value)
        await question.save()
        logger.info(f"Updated Impact Assessment Question: {question_id}")

    return ImpactAssessmentQuestionResponse(
        id=_strip_prefix(str(question.id or "")),
        assessment_id=_strip_prefix(str(question.assessment_id)),
        question_number=question.question_number,
        label=question.label,
        max_marks=question.max_marks,
        topic_id=_strip_prefix(str(question.topic_id)) if question.topic_id else None,
        skill_type=question.skill_type,
        difficulty=question.difficulty,
        created=str(question.created) if question.created else "",
        updated=str(question.updated) if question.updated else "",
    )


@router.delete("/questions/{question_id}")
async def delete_assessment_question(question_id: str) -> Dict[str, str]:
    """Delete an assessment question."""
    question_id = _ensure_prefixed(question_id, "impact_assessment_question")
    question = await ImpactAssessmentQuestion.get(question_id)
    if not question:
        raise NotFoundError(f"Question {question_id} not found")
    await question.delete()
    logger.info(f"Deleted Impact Assessment Question: {question_id}")
    return {"message": f"Question {question_id} deleted"}


# =========================================================================
# Mark Entries
# =========================================================================


@router.get("/mark-entries", response_model=ImpactMarkEntryListResponse)
async def list_mark_entries(
    assessment_id: Optional[str] = Query(None, description="Filter by assessment ID"),
    learner_id: Optional[str] = Query(None, description="Filter by learner ID"),
) -> ImpactMarkEntryListResponse:
    """List mark entries, optionally filtered by assessment or learner."""
    conditions = []
    params: Dict[str, str] = {}
    if assessment_id:
        conditions.append("assessment_id = $assessment_id")
        params["assessment_id"] = _ensure_prefixed(assessment_id, "impact_assessment")
    if learner_id:
        conditions.append("learner_id = $learner_id")
        params["learner_id"] = _ensure_prefixed(learner_id, "impact_learner")

    if conditions:
        where_clause = " AND ".join(conditions)
        result = await repo_query(
            f"SELECT * FROM impact_mark_entry WHERE {where_clause} ORDER BY created DESC",
            params,
        )
        mark_entries = [ImpactMarkEntry(**r) for r in result]
    else:
        mark_entries = await ImpactMarkEntry.get_all(order_by="created desc")
    return ImpactMarkEntryListResponse(
        mark_entries=[
            ImpactMarkEntryResponse(
                id=_strip_prefix(str(m.id or "")),
                assessment_id=_strip_prefix(str(m.assessment_id)),
                question_id=_strip_prefix(str(m.question_id)),
                learner_id=_strip_prefix(str(m.learner_id)),
                score=m.score,
                max_score=m.max_score,
                created=str(m.created) if m.created else "",
                updated=str(m.updated) if m.updated else "",
            )
            for m in mark_entries
        ],
        total=len(mark_entries),
    )


@router.get("/mark-entries/{mark_entry_id}", response_model=ImpactMarkEntryResponse)
async def get_mark_entry(mark_entry_id: str) -> ImpactMarkEntryResponse:
    """Get a mark entry by ID."""
    mark_entry_id = _ensure_prefixed(mark_entry_id, "impact_mark_entry")
    mark_entry = await ImpactMarkEntry.get(mark_entry_id)
    if not mark_entry:
        raise NotFoundError(f"Mark Entry {mark_entry_id} not found")
    return ImpactMarkEntryResponse(
        id=_strip_prefix(str(mark_entry.id or "")),
        assessment_id=_strip_prefix(str(mark_entry.assessment_id)),
        question_id=_strip_prefix(str(mark_entry.question_id)),
        learner_id=_strip_prefix(str(mark_entry.learner_id)),
        score=mark_entry.score,
        max_score=mark_entry.max_score,
        created=str(mark_entry.created) if mark_entry.created else "",
        updated=str(mark_entry.updated) if mark_entry.updated else "",
    )


@router.post("/mark-entries", response_model=ImpactMarkEntryResponse)
async def create_mark_entry(data: ImpactMarkEntryCreate) -> ImpactMarkEntryResponse:
    """Create a new mark entry."""
    mark_entry = ImpactMarkEntry(
        assessment_id=_ensure_prefixed(data.assessment_id, "impact_assessment"),
        question_id=_ensure_prefixed(data.question_id, "impact_assessment_question"),
        learner_id=_ensure_prefixed(data.learner_id, "impact_learner"),
        score=data.score,
        max_score=data.max_score,
    )
    await mark_entry.save()
    logger.info(f"Created Impact Mark Entry: {mark_entry.id}")
    return ImpactMarkEntryResponse(
        id=_strip_prefix(str(mark_entry.id or "")),
        assessment_id=_strip_prefix(str(mark_entry.assessment_id)),
        question_id=_strip_prefix(str(mark_entry.question_id)),
        learner_id=_strip_prefix(str(mark_entry.learner_id)),
        score=mark_entry.score,
        max_score=mark_entry.max_score,
        created=str(mark_entry.created) if mark_entry.created else "",
        updated=str(mark_entry.updated) if mark_entry.updated else "",
    )


@router.put("/mark-entries/{mark_entry_id}", response_model=ImpactMarkEntryResponse)
async def update_mark_entry(
    mark_entry_id: str, data: ImpactMarkEntryUpdate
) -> ImpactMarkEntryResponse:
    """Update a mark entry."""
    mark_entry_id = _ensure_prefixed(mark_entry_id, "impact_mark_entry")
    mark_entry = await ImpactMarkEntry.get(mark_entry_id)
    if not mark_entry:
        raise NotFoundError(f"Mark Entry {mark_entry_id} not found")

    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        for key, value in update_data.items():
            setattr(mark_entry, key, value)
        await mark_entry.save()
        logger.info(f"Updated Impact Mark Entry: {mark_entry_id}")

    return ImpactMarkEntryResponse(
        id=_strip_prefix(str(mark_entry.id or "")),
        assessment_id=_strip_prefix(str(mark_entry.assessment_id)),
        question_id=_strip_prefix(str(mark_entry.question_id)),
        learner_id=_strip_prefix(str(mark_entry.learner_id)),
        score=mark_entry.score,
        max_score=mark_entry.max_score,
        created=str(mark_entry.created) if mark_entry.created else "",
        updated=str(mark_entry.updated) if mark_entry.updated else "",
    )


@router.delete("/mark-entries/{mark_entry_id}")
async def delete_mark_entry(mark_entry_id: str) -> Dict[str, str]:
    """Delete a mark entry."""
    mark_entry_id = _ensure_prefixed(mark_entry_id, "impact_mark_entry")
    mark_entry = await ImpactMarkEntry.get(mark_entry_id)
    if not mark_entry:
        raise NotFoundError(f"Mark Entry {mark_entry_id} not found")
    await mark_entry.delete()
    logger.info(f"Deleted Impact Mark Entry: {mark_entry_id}")
    return {"message": f"Mark Entry {mark_entry_id} deleted"}


# =========================================================================
# Interventions
# =========================================================================


@router.get("/interventions", response_model=ImpactInterventionListResponse)
async def list_interventions(
    class_group_id: Optional[str] = Query(None, description="Filter by class group ID"),
    severity: Optional[str] = Query(None, description="Filter by severity level"),
) -> ImpactInterventionListResponse:
    """List interventions, optionally filtered by class group or severity."""
    conditions = []
    params: Dict[str, str] = {}
    if class_group_id:
        conditions.append("class_group_id = $class_group_id")
        params["class_group_id"] = _ensure_prefixed(class_group_id, "impact_class_group")
    if severity:
        conditions.append("severity = $severity")
        params["severity"] = severity

    if conditions:
        where_clause = " AND ".join(conditions)
        result = await repo_query(
            f"SELECT * FROM impact_intervention WHERE {where_clause} ORDER BY created DESC",
            params,
        )
        interventions = [ImpactIntervention(**r) for r in result]
    else:
        interventions = await ImpactIntervention.get_all(order_by="created desc")
    return ImpactInterventionListResponse(
        interventions=[
            ImpactInterventionResponse(
                id=_strip_prefix(str(i.id or "")),
                assessment_id=_strip_prefix(str(i.assessment_id)),
                class_group_id=_strip_prefix(str(i.class_group_id)),
                topic_id=_strip_prefix(str(i.topic_id)),
                severity=i.severity,
                recommendation=i.recommendation,
                status=i.status,
                created=str(i.created) if i.created else "",
                updated=str(i.updated) if i.updated else "",
            )
            for i in interventions
        ],
        total=len(interventions),
    )


@router.get("/interventions/{intervention_id}", response_model=ImpactInterventionResponse)
async def get_intervention(intervention_id: str) -> ImpactInterventionResponse:
    """Get an intervention by ID."""
    intervention_id = _ensure_prefixed(intervention_id, "impact_intervention")
    intervention = await ImpactIntervention.get(intervention_id)
    if not intervention:
        raise NotFoundError(f"Intervention {intervention_id} not found")
    return ImpactInterventionResponse(
        id=_strip_prefix(str(intervention.id or "")),
        assessment_id=_strip_prefix(str(intervention.assessment_id)),
        class_group_id=_strip_prefix(str(intervention.class_group_id)),
        topic_id=_strip_prefix(str(intervention.topic_id)),
        severity=intervention.severity,
        recommendation=intervention.recommendation,
        status=intervention.status,
        created=str(intervention.created) if intervention.created else "",
        updated=str(intervention.updated) if intervention.updated else "",
    )


@router.post("/interventions", response_model=ImpactInterventionResponse)
async def create_intervention(data: ImpactInterventionCreate) -> ImpactInterventionResponse:
    """Create a new intervention."""
    intervention = ImpactIntervention(
        assessment_id=_ensure_prefixed(data.assessment_id, "impact_assessment"),
        class_group_id=_ensure_prefixed(data.class_group_id, "impact_class_group"),
        topic_id=_ensure_prefixed(data.topic_id, "impact_topic"),
        severity=data.severity,
        recommendation=data.recommendation,
        status=data.status,
    )
    await intervention.save()
    logger.info(f"Created Impact Intervention: {intervention.id}")
    return ImpactInterventionResponse(
        id=_strip_prefix(str(intervention.id or "")),
        assessment_id=_strip_prefix(str(intervention.assessment_id)),
        class_group_id=_strip_prefix(str(intervention.class_group_id)),
        topic_id=_strip_prefix(str(intervention.topic_id)),
        severity=intervention.severity,
        recommendation=intervention.recommendation,
        status=intervention.status,
        created=str(intervention.created) if intervention.created else "",
        updated=str(intervention.updated) if intervention.updated else "",
    )


@router.put(
    "/interventions/{intervention_id}", response_model=ImpactInterventionResponse
)
async def update_intervention(
    intervention_id: str, data: ImpactInterventionUpdate
) -> ImpactInterventionResponse:
    """Update an intervention."""
    intervention_id = _ensure_prefixed(intervention_id, "impact_intervention")
    intervention = await ImpactIntervention.get(intervention_id)
    if not intervention:
        raise NotFoundError(f"Intervention {intervention_id} not found")

    update_data = data.model_dump(exclude_unset=True)
    if update_data:
        for key, value in update_data.items():
            setattr(intervention, key, value)
        await intervention.save()
        logger.info(f"Updated Impact Intervention: {intervention_id}")

    return ImpactInterventionResponse(
        id=_strip_prefix(str(intervention.id or "")),
        assessment_id=_strip_prefix(str(intervention.assessment_id)),
        class_group_id=_strip_prefix(str(intervention.class_group_id)),
        topic_id=_strip_prefix(str(intervention.topic_id)),
        severity=intervention.severity,
        recommendation=intervention.recommendation,
        status=intervention.status,
        created=str(intervention.created) if intervention.created else "",
        updated=str(intervention.updated) if intervention.updated else "",
    )


@router.delete("/interventions/{intervention_id}")
async def delete_intervention(intervention_id: str) -> Dict[str, str]:
    """Delete an intervention."""
    intervention_id = _ensure_prefixed(intervention_id, "impact_intervention")
    intervention = await ImpactIntervention.get(intervention_id)
    if not intervention:
        raise NotFoundError(f"Intervention {intervention_id} not found")
    await intervention.delete()
    logger.info(f"Deleted Impact Intervention: {intervention_id}")
    return {"message": f"Intervention {intervention_id} deleted"}


# =========================================================================
# Dashboard Endpoints
# =========================================================================


@router.get("/dashboards/school/{school_id}")
async def get_school_dashboard(school_id: str) -> Dict[str, Any]:
    """
    Get aggregated school dashboard data.

    Returns:
    - total classes
    - total learners assessed
    - total assessments
    - overall pass rate
    - pass rate by subject
    - pass rate by class
    - weakest topics across school
    - classes needing support
    - recent interventions
    """
    school_id = _ensure_prefixed(school_id, "impact_school")

    # Fetch school data
    school = await ImpactSchool.get(school_id)
    if not school:
        raise NotFoundError(f"School {school_id} not found")

    # Fetch classes
    classes_result = await repo_query(
        "SELECT * FROM impact_class_group WHERE school_id = $school_id",
        {"school_id": school_id},
    )
    classes = [ImpactClassGroup(**r) for r in classes_result]
    class_ids = [c.id for c in classes if c.id]

    # Fetch learners
    learners_result = await repo_query(
        "SELECT * FROM impact_learner WHERE school_id = $school_id",
        {"school_id": school_id},
    )
    learners = [ImpactLearner(**r) for r in learners_result]

    # Fetch assessments
    assessments_result = await repo_query(
        "SELECT * FROM impact_assessment WHERE school_id = $school_id",
        {"school_id": school_id},
    )
    assessments = [ImpactAssessment(**r) for r in assessments_result]
    assessment_ids = [a.id for a in assessments if a.id]

    # Fetch all marks for this school's assessments
    marks_result = await repo_query(
        "SELECT * FROM impact_mark_entry WHERE assessment_id INSIDE $assessment_ids",
        {"assessment_ids": assessment_ids},
    )
    marks = [ImpactMarkEntry(**r) for r in marks_result]

    # Calculate pass rates
    total_learners_assessed = len(set(m.learner_id for m in marks))
    passed_count = 0
    for assessment in assessments:
        assessment_marks = [m for m in marks if m.assessment_id == assessment.id]
        learner_totals: Dict[str, float] = {}
        for mark in assessment_marks:
            if mark.learner_id not in learner_totals:
                learner_totals[mark.learner_id] = 0
            learner_totals[mark.learner_id] += mark.score

        for learner_id, total in learner_totals.items():
            if assessment.pass_mark and total >= assessment.pass_mark:
                passed_count += 1
            elif not assessment.pass_mark and (total / assessment.total_marks * 100) >= 50:
                passed_count += 1

    overall_pass_rate = (passed_count / total_learners_assessed * 100) if total_learners_assessed > 0 else 0

    # Pass rate by subject
    subject_result = await repo_query(
        "SELECT * FROM impact_subject WHERE id IN $subject_ids",
        {"subject_ids": list(set(a.subject_id for a in assessments if a.subject_id))},
    )
    subjects = [ImpactSubject(**r) for r in subject_result]

    pass_rate_by_subject = []
    for subject in subjects:
        subject_assessments = [a for a in assessments if a.subject_id == subject.id]
        subject_marks = [m for m in marks if m.assessment_id in [a.id for a in subject_assessments]]
        subject_learners = len(set(m.learner_id for m in subject_marks))
        subject_passed = 0
        for assessment in subject_assessments:
            assessment_marks = [m for m in subject_marks if m.assessment_id == assessment.id]
            learner_totals: Dict[str, float] = {}
            for mark in assessment_marks:
                if mark.learner_id not in learner_totals:
                    learner_totals[mark.learner_id] = 0
                learner_totals[mark.learner_id] += mark.score
            for total in learner_totals.values():
                if assessment.pass_mark and total >= assessment.pass_mark:
                    subject_passed += 1
                elif not assessment.pass_mark and (total / assessment.total_marks * 100) >= 50:
                    subject_passed += 1

        pass_rate_by_subject.append({
            "subject_id": _strip_prefix(str(subject.id or "")),
            "subject_name": subject.name,
            "total_learners": subject_learners,
            "pass_rate": round((subject_passed / subject_learners * 100) if subject_learners > 0 else 0, 2),
        })

    # Pass rate by class
    pass_rate_by_class = []
    for cls in classes:
        class_learners = [l for l in learners if l.class_group_id == cls.id]
        class_marks = [m for m in marks if m.learner_id in [l.id for l in class_learners]]
        class_learners_assessed = len(set(m.learner_id for m in class_marks))
        class_passed = 0
        for assessment in assessments:
            if assessment.class_group_id == cls.id:
                assessment_marks = [m for m in class_marks if m.assessment_id == assessment.id]
                learner_totals: Dict[str, float] = {}
                for mark in assessment_marks:
                    if mark.learner_id not in learner_totals:
                        learner_totals[mark.learner_id] = 0
                    learner_totals[mark.learner_id] += mark.score
                for total in learner_totals.values():
                    if assessment.pass_mark and total >= assessment.pass_mark:
                        class_passed += 1
                    elif not assessment.pass_mark and (total / assessment.total_marks * 100) >= 50:
                        class_passed += 1

        pass_rate_by_class.append({
            "class_id": _strip_prefix(str(cls.id or "")),
            "class_name": cls.name,
            "total_learners": class_learners_assessed,
            "pass_rate": round((class_passed / class_learners_assessed * 100) if class_learners_assessed > 0 else 0, 2),
        })

    # Weakest topics across school
    topics_result = await repo_query(
        "SELECT * FROM impact_topic WHERE subject_id IN $subject_ids",
        {"subject_ids": list(set(a.subject_id for a in assessments if a.subject_id))},
    )
    topics = [ImpactTopic(**r) for r in topics_result]

    weakest_topics = []
    for topic in topics:
        topic_questions_result = await repo_query(
            "SELECT * FROM impact_assessment_question WHERE topic_id = $topic_id",
            {"topic_id": topic.id},
        )
        topic_questions = [ImpactAssessmentQuestion(**r) for r in topic_questions_result]
        topic_question_ids = [q.id for q in topic_questions]

        if not topic_question_ids:
            continue

        topic_marks = [m for m in marks if m.question_id in topic_question_ids]
        total_score = sum(m.score for m in topic_marks)
        total_max = sum(m.max_score for m in topic_marks)
        percentage = (total_score / total_max * 100) if total_max > 0 else 0

        if percentage < 55:  # Weak or critical
            weakest_topics.append({
                "topic_id": _strip_prefix(str(topic.id or "")),
                "topic_name": topic.name,
                "percentage": round(percentage, 2),
                "is_critical": percentage < 40,
                "num_questions": len(topic_questions),
            })

    weakest_topics.sort(key=lambda x: x["percentage"])

    # Classes needing support (pass rate < 50%)
    classes_needing_support = [
        c for c in pass_rate_by_class if c["pass_rate"] < 50 and c["total_learners"] > 0
    ]

    # Recent interventions
    interventions_result = await repo_query(
        "SELECT * FROM impact_intervention WHERE assessment_id IN $assessment_ids ORDER BY created DESC LIMIT 5",
        {"assessment_ids": assessment_ids},
    )
    recent_interventions = [ImpactIntervention(**r) for r in interventions_result]

    return {
        "school_id": _strip_prefix(str(school.id or "")),
        "school_name": school.name,
        "total_classes": len(classes),
        "total_learners": len(learners),
        "total_learners_assessed": total_learners_assessed,
        "total_assessments": len(assessments),
        "overall_pass_rate": round(overall_pass_rate, 2),
        "pass_rate_by_subject": pass_rate_by_subject,
        "pass_rate_by_class": pass_rate_by_class,
        "weakest_topics": weakest_topics,
        "classes_needing_support": classes_needing_support,
        "recent_interventions": [
            {
                "id": _strip_prefix(str(i.id or "")),
                "severity": i.severity,
                "recommendation": i.recommendation,
                "status": i.status,
                "created": str(i.created) if i.created else "",
            }
            for i in recent_interventions
        ],
    }


@router.get("/dashboards/ministry")
async def get_ministry_dashboard() -> Dict[str, Any]:
    """
    Get ministry-style aggregate dashboard data.

    Returns:
    - schools registered
    - learners assessed
    - assessments captured
    - average pass rate
    - weak topics by subject
    - schools/classes needing support

    Privacy: No learner names, aggregate data only.
    """
    # Fetch all schools
    schools_result = await repo_query("SELECT * FROM impact_school")
    schools = [ImpactSchool(**r) for r in schools_result]

    # Fetch all learners
    learners_result = await repo_query("SELECT * FROM impact_learner")
    learners = [ImpactLearner(**r) for r in learners_result]

    # Fetch all assessments
    assessments_result = await repo_query("SELECT * FROM impact_assessment")
    assessments = [ImpactAssessment(**r) for r in assessments_result]

    # Fetch all marks
    marks_result = await repo_query("SELECT * FROM impact_mark_entry")
    marks = [ImpactMarkEntry(**r) for r in marks_result]

    # Calculate aggregate statistics
    total_learners_assessed = len(set(m.learner_id for m in marks))
    passed_count = 0
    for assessment in assessments:
        assessment_marks = [m for m in marks if m.assessment_id == assessment.id]
        learner_totals: Dict[str, float] = {}
        for mark in assessment_marks:
            if mark.learner_id not in learner_totals:
                learner_totals[mark.learner_id] = 0
            learner_totals[mark.learner_id] += mark.score

        for total in learner_totals.values():
            if assessment.pass_mark and total >= assessment.pass_mark:
                passed_count += 1
            elif not assessment.pass_mark and (total / assessment.total_marks * 100) >= 50:
                passed_count += 1

    average_pass_rate = (passed_count / total_learners_assessed * 100) if total_learners_assessed > 0 else 0

    # Weak topics by subject
    subjects_result = await repo_query("SELECT * FROM impact_subject")
    subjects = [ImpactSubject(**r) for r in subjects_result]

    topics_result = await repo_query("SELECT * FROM impact_topic")
    topics = [ImpactTopic(**r) for r in topics_result]

    weak_topics_by_subject = []
    for subject in subjects:
        subject_topics = [t for t in topics if t.subject_id == subject.id]
        subject_weak_topics = []

        for topic in subject_topics:
            topic_questions_result = await repo_query(
                "SELECT * FROM impact_assessment_question WHERE topic_id = $topic_id",
                {"topic_id": topic.id},
            )
            topic_questions = [ImpactAssessmentQuestion(**r) for r in topic_questions_result]
            topic_question_ids = [q.id for q in topic_questions]

            if not topic_question_ids:
                continue

            topic_marks = [m for m in marks if m.question_id in topic_question_ids]
            total_score = sum(m.score for m in topic_marks)
            total_max = sum(m.max_score for m in topic_marks)
            percentage = (total_score / total_max * 100) if total_max > 0 else 0

            if percentage < 55:  # Weak or critical
                subject_weak_topics.append({
                    "topic_name": topic.name,
                    "percentage": round(percentage, 2),
                    "is_critical": percentage < 40,
                })

        if subject_weak_topics:
            weak_topics_by_subject.append({
                "subject_id": _strip_prefix(str(subject.id or "")),
                "subject_name": subject.name,
                "weak_topics": sorted(subject_weak_topics, key=lambda x: x["percentage"]),
            })

    # Schools needing support (average pass rate < 50%)
    schools_needing_support = []
    for school in schools:
        school_assessments = [a for a in assessments if a.school_id == school.id]
        school_marks = [m for m in marks if m.assessment_id in [a.id for a in school_assessments]]
        school_learners_assessed = len(set(m.learner_id for m in school_marks))
        school_passed = 0
        for assessment in school_assessments:
            assessment_marks = [m for m in school_marks if m.assessment_id == assessment.id]
            learner_totals: Dict[str, float] = {}
            for mark in assessment_marks:
                if mark.learner_id not in learner_totals:
                    learner_totals[mark.learner_id] = 0
                learner_totals[mark.learner_id] += mark.score
            for total in learner_totals.values():
                if assessment.pass_mark and total >= assessment.pass_mark:
                    school_passed += 1
                elif not assessment.pass_mark and (total / assessment.total_marks * 100) >= 50:
                    school_passed += 1

        school_pass_rate = (school_passed / school_learners_assessed * 100) if school_learners_assessed > 0 else 0

        if school_pass_rate < 50 and school_learners_assessed > 0:
            schools_needing_support.append({
                "school_id": _strip_prefix(str(school.id or "")),
                "school_name": school.name,
                "pass_rate": round(school_pass_rate, 2),
                "total_assessments": len(school_assessments),
            })

    # Classes needing support
    classes_result = await repo_query("SELECT * FROM impact_class_group")
    classes = [ImpactClassGroup(**r) for r in classes_result]

    classes_needing_support = []
    for cls in classes:
        class_learners = [l for l in learners if l.class_group_id == cls.id]
        class_assessments = [a for a in assessments if a.class_group_id == cls.id]
        class_marks = [m for m in marks if m.learner_id in [l.id for l in class_learners]]
        class_learners_assessed = len(set(m.learner_id for m in class_marks))
        class_passed = 0
        for assessment in class_assessments:
            assessment_marks = [m for m in class_marks if m.assessment_id == assessment.id]
            learner_totals: Dict[str, float] = {}
            for mark in assessment_marks:
                if mark.learner_id not in learner_totals:
                    learner_totals[mark.learner_id] = 0
                learner_totals[mark.learner_id] += mark.score
            for total in learner_totals.values():
                if assessment.pass_mark and total >= assessment.pass_mark:
                    class_passed += 1
                elif not assessment.pass_mark and (total / assessment.total_marks * 100) >= 50:
                    class_passed += 1

        class_pass_rate = (class_passed / class_learners_assessed * 100) if class_learners_assessed > 0 else 0

        if class_pass_rate < 50 and class_learners_assessed > 0:
            classes_needing_support.append({
                "class_id": _strip_prefix(str(cls.id or "")),
                "class_name": cls.name,
                "school_id": _strip_prefix(str(cls.school_id)),
                "pass_rate": round(class_pass_rate, 2),
                "total_learners": class_learners_assessed,
            })

    return {
        "total_schools": len(schools),
        "total_learners": len(learners),
        "total_learners_assessed": total_learners_assessed,
        "total_assessments": len(assessments),
        "average_pass_rate": round(average_pass_rate, 2),
        "weak_topics_by_subject": weak_topics_by_subject,
        "schools_needing_support": schools_needing_support,
        "classes_needing_support": classes_needing_support[:10],  # Limit to 10 for ministry view
    }


# =========================================================================
# Report Endpoints
# =========================================================================


@router.get("/reports/assessment/{assessment_id}")
async def get_assessment_report(assessment_id: str) -> Dict[str, Any]:
    """Get comprehensive assessment report data."""
    # Get assessment
    assessment_result = await repo_query(
        f"SELECT * FROM impact_assessment WHERE id = '{assessment_id}'"
    )
    if not assessment_result:
        raise HTTPException(status_code=404, detail="Assessment not found")

    assessment = ImpactAssessment(**assessment_result[0])

    # Get questions
    questions_result = await repo_query(
        f"SELECT * FROM impact_assessment_question WHERE assessment_id = '{assessment_id}' ORDER BY question_number"
    )
    questions = [ImpactAssessmentQuestion(**r) for r in questions_result]

    # Get learners
    learners_result = await repo_query(
        f"SELECT * FROM impact_learner WHERE class_group_id = '{assessment.class_group_id}'"
    )
    learners = [ImpactLearner(**r) for r in learners_result]

    # Get marks
    marks_result = await repo_query(
        f"SELECT * FROM impact_mark_entry WHERE assessment_id = '{assessment_id}'"
    )
    marks = [ImpactMarkEntry(**r) for r in marks_result]

    # Get analytics
    engine = ImpactAnalyticsEngine()
    analytics = await engine.calculate_analytics(assessment, questions, learners, marks)

    # Get school, class, subject
    school_result = await repo_query(
        f"SELECT * FROM impact_school WHERE id = '{assessment.school_id}'"
    )
    school = ImpactSchool(**school_result[0]) if school_result else None

    class_result = await repo_query(
        f"SELECT * FROM impact_class_group WHERE id = '{assessment.class_group_id}'"
    )
    class_group = ImpactClassGroup(**class_result[0]) if class_result else None

    subject_result = await repo_query(
        f"SELECT * FROM impact_subject WHERE id = '{assessment.subject_id}'"
    )
    subject = ImpactSubject(**subject_result[0]) if subject_result else None

    return {
        "assessment": {
            "id": _strip_prefix(str(assessment.id or "")),
            "title": assessment.title,
            "assessment_type": assessment.assessment_type,
            "total_marks": assessment.total_marks,
            "pass_mark": assessment.pass_mark,
            "term": assessment.term,
            "status": assessment.status,
            "date_written": assessment.date_written,
        },
        "questions": [
            {
                "id": _strip_prefix(str(q.id or "")),
                "question_number": q.question_number,
                "label": q.label,
                "max_marks": q.max_marks,
                "topic_id": q.topic_id,
                "skill_type": q.skill_type,
                "difficulty": q.difficulty,
            }
            for q in questions
        ],
        "learners": [
            {
                "id": _strip_prefix(str(l.id or "")),
                "learner_code": l.learner_code,
                "display_name": l.display_name,
                "status": l.status,
            }
            for l in learners
        ],
        "analytics": analytics,
        "school": {
            "id": _strip_prefix(str(school.id or "")),
            "name": school.name,
            "district": school.district,
            "province": school.province,
        } if school else None,
        "class_group": {
            "id": _strip_prefix(str(class_group.id or "")),
            "name": class_group.name,
            "grade_level": class_group.grade_level,
            "teacher_name": class_group.teacher_name,
        } if class_group else None,
        "subject": {
            "id": _strip_prefix(str(subject.id or "")),
            "name": subject.name,
            "level": subject.level,
            "curriculum": subject.curriculum,
        } if subject else None,
    }


@router.get("/reports/school/{school_id}")
async def get_school_report(school_id: str) -> Dict[str, Any]:
    """Get comprehensive school report data."""
    # Get school
    school_result = await repo_query(
        f"SELECT * FROM impact_school WHERE id = '{school_id}'"
    )
    if not school_result:
        raise HTTPException(status_code=404, detail="School not found")

    school = ImpactSchool(**school_result[0])

    # Get classes
    classes_result = await repo_query(
        f"SELECT * FROM impact_class_group WHERE school_id = '{school_id}'"
    )
    classes = [ImpactClassGroup(**r) for r in classes_result]

    # Get assessments
    assessments_result = await repo_query(
        f"SELECT * FROM impact_assessment WHERE school_id = '{school_id}'"
    )
    assessments = [ImpactAssessment(**a) for a in assessments_result]

    # Get all marks for school assessments
    assessment_ids = [str(a.id) for a in assessments]
    if assessment_ids:
        quoted_ids = ','.join(['"' + aid + '"' for aid in assessment_ids])
        marks_result = await repo_query(
            f"SELECT * FROM impact_mark_entry WHERE assessment_id IN [{quoted_ids}]"
        )
    else:
        marks_result = []
    marks = [ImpactMarkEntry(**m) for m in marks_result]

    # Get learners
    learners_result = await repo_query(
        f"SELECT * FROM impact_learner WHERE school_id = '{school_id}'"
    )
    learners = [ImpactLearner(**r) for r in learners_result]

    # Calculate pass rates by class
    pass_rate_by_class = []
    total_learners_assessed = 0

    for cls in classes:
        class_learners = [l for l in learners if l.class_group_id == cls.id]
        class_marks = [m for m in marks if m.learner_id in [l.id for l in class_learners]]
        class_learners_assessed = len(set(m.learner_id for m in class_marks))
        total_learners_assessed += class_learners_assessed

        class_passed = 0
        for assessment in [a for a in assessments if a.class_group_id == cls.id]:
            assessment_marks = [m for m in class_marks if m.assessment_id == assessment.id]
            learner_totals: Dict[str, float] = {}
            for mark in assessment_marks:
                if mark.learner_id not in learner_totals:
                    learner_totals[mark.learner_id] = 0
                learner_totals[mark.learner_id] += mark.score

            for total in learner_totals.values():
                if assessment.pass_mark and total >= assessment.pass_mark:
                    class_passed += 1
                elif not assessment.pass_mark and (total / assessment.total_marks * 100) >= 50:
                    class_passed += 1

        class_pass_rate = (class_passed / class_learners_assessed * 100) if class_learners_assessed > 0 else 0

        pass_rate_by_class.append({
            "class_id": _strip_prefix(str(cls.id or "")),
            "class_name": cls.name,
            "total_learners": class_learners_assessed,
            "pass_rate": round(class_pass_rate, 2),
        })

    # Overall pass rate
    total_passed = sum(
        c["total_learners"] * c["pass_rate"] / 100
        for c in pass_rate_by_class
        if c["total_learners"] > 0
    )
    overall_pass_rate = (total_passed / total_learners_assessed * 100) if total_learners_assessed > 0 else 0

    # Recent interventions
    quoted_class_ids_interventions = ','.join(['"' + str(cls.id) + '"' for cls in classes]) if classes else ''
    interventions_result = await repo_query(
        f"SELECT * FROM impact_intervention WHERE class_group_id IN [{quoted_class_ids_interventions}] ORDER BY created DESC LIMIT 10"
    ) if classes else []
    recent_interventions = [
        {
            "id": _strip_prefix(str(InterventionRecommendationResponse(**i).id or "")),
            "severity": i.get("severity", "low"),
            "recommendation": i.get("recommendation", ""),
            "status": i.get("status", "pending"),
            "created": i.get("created", ""),
        }
        for i in interventions_result
    ]

    return {
        "school": {
            "id": _strip_prefix(str(school.id or "")),
            "name": school.name,
            "district": school.district,
            "province": school.province,
            "school_type": school.school_type,
        },
        "classes": [
            {
                "id": _strip_prefix(str(c.id or "")),
                "name": c.name,
                "grade_level": c.grade_level,
                "teacher_name": c.teacher_name,
            }
            for c in classes
        ],
        "assessments": [
            {
                "id": _strip_prefix(str(a.id or "")),
                "title": a.title,
                "assessment_type": a.assessment_type,
                "total_marks": a.total_marks,
                "pass_mark": a.pass_mark,
                "status": a.status,
            }
            for a in assessments
        ],
        "pass_rate_by_class": pass_rate_by_class,
        "recent_interventions": recent_interventions,
        "total_learners": len(learners),
        "total_learners_assessed": total_learners_assessed,
        "overall_pass_rate": round(overall_pass_rate, 2),
    }


# =========================================================================
# CSV Export Endpoints
# =========================================================================


@router.get("/assessments/{assessment_id}/export/marks")
async def export_assessment_marks_csv(assessment_id: str) -> StreamingResponse:
    """Export assessment marks as CSV."""
    # Get assessment details
    assessment_result = await repo_query(
        f"SELECT * FROM impact_assessment WHERE id = '{assessment_id}'"
    )
    if not assessment_result:
        raise HTTPException(status_code=404, detail="Assessment not found")

    assessment = ImpactAssessment(**assessment_result[0])

    # Get questions
    questions_result = await repo_query(
        f"SELECT * FROM impact_assessment_question WHERE assessment_id = '{assessment_id}' ORDER BY question_number"
    )
    questions = [ImpactAssessmentQuestion(**r) for r in questions_result]

    # Get learners in the class
    learners_result = await repo_query(
        f"SELECT * FROM impact_learner WHERE class_group_id = '{assessment.class_group_id}'"
    )
    learners = [ImpactLearner(**r) for r in learners_result]

    # Get mark entries
    marks_result = await repo_query(
        f"SELECT * FROM impact_mark_entry WHERE assessment_id = '{assessment_id}'"
    )
    marks = [ImpactMarkEntry(**r) for r in marks_result]

    # Build CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Header row
    header = ["Learner Code", "Display Name"]
    for q in questions:
        header.append(f"Q{q.question_number} (/{q.max_marks})")
    header.extend(["Total", "Percentage", "Status"])
    writer.writerow(header)

    # Data rows
    for learner in learners:
        row = [learner.learner_code, learner.display_name or ""]
        total_score = 0
        total_max = 0

        for question in questions:
            mark = next(
                (m for m in marks if m.question_id == question.id and m.learner_id == learner.id),
                None,
            )
            if mark:
                row.append(str(mark.score))
                total_score += mark.score
                total_max += mark.max_score
            else:
                row.append("")
                total_max += question.max_marks

        percentage = (total_score / total_max * 100) if total_max > 0 else 0
        passed = percentage >= 50 if not assessment.pass_mark else total_score >= assessment.pass_mark
        row.extend([
            str(total_score),
            f"{percentage:.1f}",
            "Pass" if passed else "Fail",
        ])
        writer.writerow(row)

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="marks_{assessment.title.replace(" ", "_")}.csv"'
        },
    )


@router.get("/assessments/{assessment_id}/export/analytics")
async def export_assessment_analytics_csv(assessment_id: str) -> StreamingResponse:
    """Export assessment analytics as CSV."""
    # Get analytics data
    assessment_result = await repo_query(
        f"SELECT * FROM impact_assessment WHERE id = '{assessment_id}'"
    )
    if not assessment_result:
        raise HTTPException(status_code=404, detail="Assessment not found")

    assessment = ImpactAssessment(**assessment_result[0])

    # Get questions
    questions_result = await repo_query(
        f"SELECT * FROM impact_assessment_question WHERE assessment_id = '{assessment_id}' ORDER BY question_number"
    )
    questions = [ImpactAssessmentQuestion(**r) for r in questions_result]

    # Get marks
    marks_result = await repo_query(
        f"SELECT * FROM impact_mark_entry WHERE assessment_id = '{assessment_id}'"
    )
    marks = [ImpactMarkEntry(**r) for r in marks_result]

    # Get topics
    topics_result = await repo_query("SELECT * FROM impact_topic")
    topics = [ImpactTopic(**r) for r in topics_result]

    # Build CSV with multiple sections
    output = io.StringIO()
    writer = csv.writer(output)

    # Section 1: Assessment Summary
    writer.writerow(["Assessment Summary"])
    writer.writerow(["Title", assessment.title])
    writer.writerow(["Type", assessment.assessment_type])
    writer.writerow(["Total Marks", assessment.total_marks])
    writer.writerow(["Pass Mark", assessment.pass_mark or "Not set"])
    writer.writerow(["Term", assessment.term or "Not set"])
    writer.writerow([])

    # Section 2: Question Performance
    writer.writerow(["Question Performance"])
    writer.writerow(["Question #", "Label", "Max Marks", "Skill Type", "Difficulty", "Average Score", "Average %", "Status"])

    for q in questions:
        q_marks = [m for m in marks if m.question_id == q.id]
        avg_score = sum(m.score for m in q_marks) / len(q_marks) if q_marks else 0
        avg_pct = (avg_score / q.max_marks * 100) if q.max_marks > 0 else 0
        is_critical = avg_pct < 35

        writer.writerow([
            q.question_number,
            q.label or "",
            q.max_marks,
            q.skill_type,
            q.difficulty or "",
            f"{avg_score:.1f}",
            f"{avg_pct:.1f}",
            "Critical" if is_critical else "OK",
        ])

    writer.writerow([])

    # Section 3: Topic Performance
    writer.writerow(["Topic Performance"])
    writer.writerow(["Topic", "Total Score", "Total Max", "Percentage", "# Questions", "Status"])

    topic_stats: Dict[str, Dict[str, Any]] = {}
    for q in questions:
        if q.topic_id:
            if q.topic_id not in topic_stats:
                topic_stats[q.topic_id] = {"score": 0, "max": 0, "count": 0}
            q_marks = [m for m in marks if m.question_id == q.id]
            topic_stats[q.topic_id]["score"] += sum(m.score for m in q_marks)
            topic_stats[q.topic_id]["max"] += sum(m.max_score for m in q_marks)
            topic_stats[q.topic_id]["count"] += 1

    for topic_id, stats in topic_stats.items():
        topic = next((t for t in topics if t.id == topic_id), None)
        percentage = (stats["score"] / stats["max"] * 100) if stats["max"] > 0 else 0
        is_weak = percentage < 55
        is_critical = percentage < 40

        writer.writerow([
            topic.name if topic else topic_id,
            f"{stats['score']:.1f}",
            stats["max"],
            f"{percentage:.1f}",
            stats["count"],
            "Critical" if is_critical else "Weak" if is_weak else "OK",
        ])

    writer.writerow([])

    # Section 4: Learner Performance
    writer.writerow(["Learner Performance"])
    writer.writerow(["Learner Code", "Display Name", "Total Score", "Total Max", "Percentage", "Status", "Risk Level"])

    # Get learners
    learners_result = await repo_query(
        f"SELECT * FROM impact_learner WHERE class_group_id = '{assessment.class_group_id}'"
    )
    learners = [ImpactLearner(**r) for r in learners_result]

    for learner in learners:
        l_marks = [m for m in marks if m.learner_id == learner.id]
        total_score = sum(m.score for m in l_marks)
        total_max = sum(m.max_score for m in l_marks)
        percentage = (total_score / total_max * 100) if total_max > 0 else 0
        passed = percentage >= 50 if not assessment.pass_mark else total_score >= assessment.pass_mark

        if percentage < 40:
            risk_level = "High"
        elif percentage < 55:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        writer.writerow([
            learner.learner_code,
            learner.display_name or "",
            f"{total_score:.1f}",
            total_max,
            f"{percentage:.1f}",
            "Pass" if passed else "Fail",
            risk_level,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="analytics_{assessment.title.replace(" ", "_")}.csv"'
        },
    )


@router.get("/schools/{school_id}/export/report")
async def export_school_report_csv(school_id: str) -> StreamingResponse:
    """Export school impact report as CSV."""
    # Get school details
    school_result = await repo_query(
        f"SELECT * FROM impact_school WHERE id = '{school_id}'"
    )
    if not school_result:
        raise HTTPException(status_code=404, detail="School not found")

    school = ImpactSchool(**school_result[0])

    # Get classes
    classes_result = await repo_query(
        f"SELECT * FROM impact_class_group WHERE school_id = '{school_id}'"
    )
    classes = [ImpactClassGroup(**r) for r in classes_result]

    # Get all assessments for this school
    assessments_result = await repo_query(
        f"SELECT * FROM impact_assessment WHERE school_id = '{school_id}'"
    )
    assessments = [ImpactAssessment(**a) for a in assessments_result]

    # Get all marks for school assessments
    assessment_ids = [str(a.id) for a in assessments]
    quoted_ids = ','.join(['"' + aid + '"' for aid in assessment_ids])
    marks_result = await repo_query(
        f"SELECT * FROM impact_mark_entry WHERE assessment_id IN [{quoted_ids}]"
    )
    marks = [ImpactMarkEntry(**m) for m in marks_result]

    # Build CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Section 1: School Summary
    writer.writerow(["School Report"])
    writer.writerow(["School", school.name])
    writer.writerow(["District", school.district or ""])
    writer.writerow(["Province", school.province or ""])
    writer.writerow(["Type", school.school_type or ""])
    writer.writerow(["Total Classes", len(classes)])
    writer.writerow(["Total Assessments", len(assessments)])
    writer.writerow([])

    # Section 2: Pass Rate by Class
    writer.writerow(["Pass Rate by Class"])
    writer.writerow(["Class Name", "Total Learners", "Pass Rate %"])

    for cls in classes:
        class_learners_result = await repo_query(
            f"SELECT * FROM impact_learner WHERE class_group_id = '{cls.id}'"
        )
        class_learners = [ImpactLearner(**l) for l in class_learners_result]
        class_learners_assessed = len(set(
            m.learner_id for m in marks
            if any(
                m.learner_id == l.id
                for l in class_learners
            )
        ))

        class_passed = 0
        for assessment in [a for a in assessments if a.class_group_id == cls.id]:
            assessment_marks = [m for m in marks if m.assessment_id == assessment.id]
            learner_totals: Dict[str, float] = {}
            for mark in assessment_marks:
                if mark.learner_id not in learner_totals:
                    learner_totals[mark.learner_id] = 0
                learner_totals[mark.learner_id] += mark.score

            for total in learner_totals.values():
                if assessment.pass_mark and total >= assessment.pass_mark:
                    class_passed += 1
                elif not assessment.pass_mark and (total / assessment.total_marks * 100) >= 50:
                    class_passed += 1

        class_pass_rate = (class_passed / class_learners_assessed * 100) if class_learners_assessed > 0 else 0

        writer.writerow([
            cls.name,
            class_learners_assessed,
            f"{class_pass_rate:.1f}",
        ])

    writer.writerow([])

    # Section 3: Recent Interventions
    writer.writerow(["Recent Interventions"])
    writer.writerow(["Severity", "Recommendation", "Status", "Date"])

    quoted_class_ids = ','.join(['"' + str(cls.id) + '"' for cls in classes])
    interventions_result = await repo_query(
        f"SELECT * FROM impact_intervention WHERE class_group_id IN [{quoted_class_ids}]"
    )
    for intervention_data in interventions_result:
        intervention = ImpactIntervention(**intervention_data)
        writer.writerow([
            intervention.severity,
            intervention.recommendation or "",
            intervention.status,
            intervention.created or "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="school_report_{school.name.replace(" ", "_")}.csv"'
        },
    )


# =========================================================================
# AI Summary Endpoints
# =========================================================================


@router.get("/assessments/{assessment_id}/ai/teacher-summary")
async def generate_teacher_summary(assessment_id: str) -> Dict[str, Any]:
    """Generate AI-powered teacher summary for an assessment."""
    from vault_core.analytics.impact import ImpactAnalyticsEngine
    from vault_core.analytics.impact_ai import ImpactAISummaryService

    try:
        # Get analytics
        analytics = await ImpactAnalyticsEngine.calculate_analytics(assessment_id)

        # Generate summary
        summary = await ImpactAISummaryService.generate_teacher_summary(analytics)

        return {
            "summary": summary.summary,
            "revision_sequence": summary.revision_sequence,
            "source": summary.source,
        }
    except Exception as e:
        logger.error(f"Failed to generate teacher summary: {e}")
        # Return graceful fallback
        return {
            "summary": "AI summary unavailable. Please check the analytics data above.",
            "revision_sequence": "",
            "source": "fallback",
            "error": str(e),
        }


@router.get("/assessments/{assessment_id}/ai/intervention-plan")
async def generate_intervention_plan(assessment_id: str) -> Dict[str, Any]:
    """Generate AI-powered intervention plan for an assessment."""
    from vault_core.analytics.impact import ImpactAnalyticsEngine
    from vault_core.analytics.impact_ai import ImpactAISummaryService

    try:
        # Get analytics
        analytics = await ImpactAnalyticsEngine.calculate_analytics(assessment_id)

        # Generate plan
        plan = await ImpactAISummaryService.generate_intervention_plan(analytics)

        return {
            "plan": plan.plan,
            "source": plan.source,
        }
    except Exception as e:
        logger.error(f"Failed to generate intervention plan: {e}")
        # Return graceful fallback
        return {
            "plan": "AI intervention plan unavailable. Please review the interventions above.",
            "source": "fallback",
            "error": str(e),
        }


@router.get("/assessments/{assessment_id}/ai/remedial-lesson")
async def generate_remedial_lesson(assessment_id: str) -> Dict[str, Any]:
    """Generate AI-powered remedial lesson outline for an assessment."""
    from vault_core.analytics.impact import ImpactAnalyticsEngine
    from vault_core.analytics.impact_ai import ImpactAISummaryService

    try:
        # Get assessment details for subject/class names
        assessment_result = await repo_query(
            f"SELECT * FROM impact_assessment WHERE id = '{assessment_id}'"
        )
        if not assessment_result:
            raise HTTPException(status_code=404, detail="Assessment not found")

        assessment = ImpactAssessment(**assessment_result[0])

        # Get class name
        class_result = await repo_query(
            f"SELECT * FROM impact_class_group WHERE id = '{assessment.class_group_id}'"
        )
        class_name = class_result[0].get("name", "Class") if class_result else "Class"

        # Get subject name
        subject_result = await repo_query(
            f"SELECT * FROM impact_subject WHERE id = '{assessment.subject_id}'"
        )
        subject_name = subject_result[0].get("name", "Subject") if subject_result else "Subject"

        # Get analytics
        analytics = await ImpactAnalyticsEngine.calculate_analytics(assessment_id)

        # Generate lesson
        lesson = await ImpactAISummaryService.generate_remedial_lesson(
            analytics,
            subject_name=subject_name,
            class_name=class_name,
        )

        return {
            "outline": lesson.outline,
            "mini_test_idea": lesson.mini_test_idea,
            "source": lesson.source,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate remedial lesson: {e}")
        # Return graceful fallback
        return {
            "outline": "AI remedial lesson unavailable. Please review the weak topics above.",
            "mini_test_idea": "",
            "source": "fallback",
            "error": str(e),
        }
