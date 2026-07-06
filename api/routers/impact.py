"""
API router for Impact Intelligence — assessment analytics and interventions.

Phase 1 — CRUD endpoints for impact entities:
schools, class groups, learners, subjects, topics,
assessments, assessment questions, mark entries, and interventions.
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from loguru import logger

from api.models import (
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
)
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
