"""
Tests for Impact Intelligence API endpoints (Phase 1).

Tests CRUD operations for:
- impact_school
- impact_class_group
- impact_learner
- impact_subject
- impact_topic
- impact_assessment
- impact_assessment_question
- impact_mark_entry
"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def client():
    from api.main import app

    return TestClient(app)


# =========================================================================
# Impact Schools — CRUD
# =========================================================================


class TestImpactSchoolCRUD:
    """POST/GET/PUT/DELETE /api/impact/schools."""

    @patch("api.routers.impact.ImpactSchool")
    def test_create_school(self, mock_cls, client):
        """Create a school and verify response."""
        mock_instance = AsyncMock()
        mock_instance.id = "impact_school:1"
        mock_instance.name = "Zimbabwe High"
        mock_instance.district = "Harare"
        mock_instance.province = "Harare"
        mock_instance.school_type = "secondary"
        mock_instance.active = True
        mock_instance.created = "2026-07-06T12:00:00Z"
        mock_instance.updated = "2026-07-06T12:00:00Z"
        mock_cls.return_value = mock_instance

        response = client.post(
            "/api/impact/schools",
            json={
                "name": "Zimbabwe High",
                "district": "Harare",
                "province": "Harare",
                "school_type": "secondary",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Zimbabwe High"
        assert data["school_type"] == "secondary"
        mock_instance.save.assert_called_once()

    @patch("api.routers.impact.ImpactSchool")
    def test_list_schools(self, mock_cls, client):
        """List schools returns empty list."""
        mock_cls.get_all = AsyncMock(return_value=[])
        response = client.get("/api/impact/schools")
        assert response.status_code == 200
        data = response.json()
        assert data["schools"] == []
        assert data["total"] == 0

    @patch("api.routers.impact.ImpactSchool")
    def test_get_school(self, mock_cls, client):
        """Get a school by ID."""
        mock_instance = AsyncMock()
        mock_instance.id = "impact_school:1"
        mock_instance.name = "Zimbabwe High"
        mock_instance.district = "Harare"
        mock_instance.province = "Harare"
        mock_instance.school_type = "secondary"
        mock_instance.active = True
        mock_instance.created = "2026-07-06T12:00:00Z"
        mock_instance.updated = "2026-07-06T12:00:00Z"
        mock_cls.get = AsyncMock(return_value=mock_instance)

        response = client.get("/api/impact/schools/1")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Zimbabwe High"

    @patch("api.routers.impact.ImpactSchool")
    def test_get_school_not_found(self, mock_cls, client):
        """Get a non-existent school returns 404."""
        mock_cls.get = AsyncMock(return_value=None)
        response = client.get("/api/impact/schools/nonexistent")
        assert response.status_code == 404

    @patch("api.routers.impact.ImpactSchool")
    def test_update_school(self, mock_cls, client):
        """Update a school."""
        mock_instance = AsyncMock()
        mock_instance.id = "impact_school:1"
        mock_instance.name = "Zimbabwe High"
        mock_instance.district = "Harare"
        mock_instance.province = "Harare"
        mock_instance.school_type = "secondary"
        mock_instance.active = True
        mock_instance.created = "2026-07-06T12:00:00Z"
        mock_instance.updated = "2026-07-06T12:00:00Z"
        mock_cls.get = AsyncMock(return_value=mock_instance)

        response = client.put(
            "/api/impact/schools/1",
            json={"name": "Zimbabwe High Updated"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Zimbabwe High Updated"
        mock_instance.save.assert_called_once()

    @patch("api.routers.impact.ImpactSchool")
    def test_delete_school(self, mock_cls, client):
        """Delete a school."""
        mock_instance = AsyncMock()
        mock_cls.get = AsyncMock(return_value=mock_instance)

        response = client.delete("/api/impact/schools/1")
        assert response.status_code == 200
        mock_instance.delete.assert_called_once()


# =========================================================================
# Impact Subjects — CRUD
# =========================================================================


class TestImpactSubjectCRUD:
    """POST/GET/PUT/DELETE /api/impact/subjects."""

    @patch("api.routers.impact.ImpactSubject")
    def test_create_subject(self, mock_cls, client):
        """Create a subject."""
        mock_instance = AsyncMock()
        mock_instance.id = "impact_subject:1"
        mock_instance.name = "Mathematics"
        mock_instance.level = "O-Level"
        mock_instance.curriculum = "ZIMSEC"
        mock_instance.created = "2026-07-06T12:00:00Z"
        mock_instance.updated = "2026-07-06T12:00:00Z"
        mock_cls.return_value = mock_instance

        response = client.post(
            "/api/impact/subjects",
            json={
                "name": "Mathematics",
                "level": "O-Level",
                "curriculum": "ZIMSEC",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Mathematics"
        assert data["level"] == "O-Level"
        mock_instance.save.assert_called_once()

    @patch("api.routers.impact.ImpactSubject")
    def test_list_subjects(self, mock_cls, client):
        """List subjects."""
        mock_cls.get_all = AsyncMock(return_value=[])
        response = client.get("/api/impact/subjects")
        assert response.status_code == 200
        data = response.json()
        assert data["subjects"] == []
        assert data["total"] == 0


# =========================================================================
# Impact Class Groups — CRUD
# =========================================================================


class TestImpactClassGroupCRUD:
    """POST/GET/PUT/DELETE /api/impact/classes."""

    @patch("api.routers.impact.ImpactClassGroup")
    def test_create_class_group(self, mock_cls, client):
        """Create a class group."""
        mock_instance = AsyncMock()
        mock_instance.id = "impact_class_group:1"
        mock_instance.school_id = "impact_school:1"
        mock_instance.name = "Form 4A"
        mock_instance.grade_level = "4"
        mock_instance.academic_year = "2026"
        mock_instance.teacher_name = "Mrs. Smith"
        mock_instance.active = True
        mock_instance.created = "2026-07-06T12:00:00Z"
        mock_instance.updated = "2026-07-06T12:00:00Z"
        mock_cls.return_value = mock_instance

        response = client.post(
            "/api/impact/classes",
            json={
                "school_id": "1",
                "name": "Form 4A",
                "grade_level": "4",
                "academic_year": "2026",
                "teacher_name": "Mrs. Smith",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Form 4A"
        mock_instance.save.assert_called_once()


# =========================================================================
# Impact Learners — CRUD
# =========================================================================


class TestImpactLearnerCRUD:
    """POST/GET/PUT/DELETE /api/impact/learners."""

    @patch("api.routers.impact.ImpactLearner")
    def test_create_learner(self, mock_cls, client):
        """Create a learner."""
        mock_instance = AsyncMock()
        mock_instance.id = "impact_learner:1"
        mock_instance.school_id = "impact_school:1"
        mock_instance.class_group_id = "impact_class_group:1"
        mock_instance.learner_code = "L001"
        mock_instance.display_name = "John Doe"
        mock_instance.status = "active"
        mock_instance.created = "2026-07-06T12:00:00Z"
        mock_instance.updated = "2026-07-06T12:00:00Z"
        mock_cls.return_value = mock_instance

        response = client.post(
            "/api/impact/learners",
            json={
                "school_id": "1",
                "class_group_id": "1",
                "learner_code": "L001",
                "display_name": "John Doe",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["learner_code"] == "L001"
        mock_instance.save.assert_called_once()


# =========================================================================
# Impact Topics — CRUD
# =========================================================================


class TestImpactTopicCRUD:
    """POST/GET/PUT/DELETE /api/impact/topics."""

    @patch("api.routers.impact.ImpactTopic")
    def test_create_topic(self, mock_cls, client):
        """Create a topic."""
        mock_instance = AsyncMock()
        mock_instance.id = "impact_topic:1"
        mock_instance.subject_id = "impact_subject:1"
        mock_instance.name = "Algebra"
        mock_instance.strand = "Number"
        mock_instance.syllabus_code = "MATH-001"
        mock_instance.created = "2026-07-06T12:00:00Z"
        mock_instance.updated = "2026-07-06T12:00:00Z"
        mock_cls.return_value = mock_instance

        response = client.post(
            "/api/impact/topics",
            json={
                "subject_id": "1",
                "name": "Algebra",
                "strand": "Number",
                "syllabus_code": "MATH-001",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Algebra"
        mock_instance.save.assert_called_once()


# =========================================================================
# Impact Assessments — CRUD
# =========================================================================


class TestImpactAssessmentCRUD:
    """POST/GET/PUT/DELETE /api/impact/assessments."""

    @patch("api.routers.impact.ImpactAssessment")
    def test_create_assessment(self, mock_cls, client):
        """Create an assessment."""
        mock_instance = AsyncMock()
        mock_instance.id = "impact_assessment:1"
        mock_instance.school_id = "impact_school:1"
        mock_instance.class_group_id = "impact_class_group:1"
        mock_instance.subject_id = "impact_subject:1"
        mock_instance.title = "Mid-Term Exam"
        mock_instance.assessment_type = "exam"
        mock_instance.term = "Term 1"
        mock_instance.date_written = None
        mock_instance.total_marks = 100
        mock_instance.pass_mark = 50
        mock_instance.status = "draft"
        mock_instance.created = "2026-07-06T12:00:00Z"
        mock_instance.updated = "2026-07-06T12:00:00Z"
        mock_cls.return_value = mock_instance

        response = client.post(
            "/api/impact/assessments",
            json={
                "school_id": "1",
                "class_group_id": "1",
                "subject_id": "1",
                "title": "Mid-Term Exam",
                "assessment_type": "exam",
                "total_marks": 100,
                "pass_mark": 50,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Mid-Term Exam"
        assert data["total_marks"] == 100
        mock_instance.save.assert_called_once()


# =========================================================================
# Impact Assessment Questions — CRUD
# =========================================================================


class TestImpactAssessmentQuestionCRUD:
    """POST/GET/PUT/DELETE /api/impact/questions."""

    @patch("api.routers.impact.ImpactAssessmentQuestion")
    def test_create_question(self, mock_cls, client):
        """Create an assessment question."""
        mock_instance = AsyncMock()
        mock_instance.id = "impact_assessment_question:1"
        mock_instance.assessment_id = "impact_assessment:1"
        mock_instance.question_number = 1
        mock_instance.label = "Q1"
        mock_instance.max_marks = 10
        mock_instance.topic_id = None
        mock_instance.skill_type = "knowledge"
        mock_instance.difficulty = "easy"
        mock_instance.created = "2026-07-06T12:00:00Z"
        mock_instance.updated = "2026-07-06T12:00:00Z"
        mock_cls.return_value = mock_instance

        response = client.post(
            "/api/impact/questions",
            json={
                "assessment_id": "1",
                "question_number": 1,
                "label": "Q1",
                "max_marks": 10,
                "skill_type": "knowledge",
                "difficulty": "easy",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["question_number"] == 1
        assert data["max_marks"] == 10
        mock_instance.save.assert_called_once()


# =========================================================================
# Impact Mark Entries — CRUD
# =========================================================================


class TestImpactMarkEntryCRUD:
    """POST/GET/PUT/DELETE /api/impact/mark-entries."""

    @patch("api.routers.impact.ImpactMarkEntry")
    def test_create_mark_entry(self, mock_cls, client):
        """Create a mark entry."""
        mock_instance = AsyncMock()
        mock_instance.id = "impact_mark_entry:1"
        mock_instance.assessment_id = "impact_assessment:1"
        mock_instance.question_id = "impact_assessment_question:1"
        mock_instance.learner_id = "impact_learner:1"
        mock_instance.score = 8.5
        mock_instance.max_score = 10.0
        mock_instance.created = "2026-07-06T12:00:00Z"
        mock_instance.updated = "2026-07-06T12:00:00Z"
        mock_cls.return_value = mock_instance

        response = client.post(
            "/api/impact/mark-entries",
            json={
                "assessment_id": "1",
                "question_id": "1",
                "learner_id": "1",
                "score": 8.5,
                "max_score": 10.0,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["score"] == 8.5
        assert data["max_score"] == 10.0
        mock_instance.save.assert_called_once()


# =========================================================================
# Impact Interventions — CRUD
# =========================================================================


class TestImpactInterventionCRUD:
    """POST/GET/PUT/DELETE /api/impact/interventions."""

    @patch("api.routers.impact.ImpactIntervention")
    def test_create_intervention(self, mock_cls, client):
        """Create an intervention."""
        mock_instance = AsyncMock()
        mock_instance.id = "impact_intervention:1"
        mock_instance.assessment_id = "impact_assessment:1"
        mock_instance.class_group_id = "impact_class_group:1"
        mock_instance.topic_id = "impact_topic:1"
        mock_instance.severity = "high"
        mock_instance.recommendation = "Provide extra tutoring"
        mock_instance.status = "pending"
        mock_instance.created = "2026-07-06T12:00:00Z"
        mock_instance.updated = "2026-07-06T12:00:00Z"
        mock_cls.return_value = mock_instance

        response = client.post(
            "/api/impact/interventions",
            json={
                "assessment_id": "1",
                "class_group_id": "1",
                "topic_id": "1",
                "severity": "high",
                "recommendation": "Provide extra tutoring",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["severity"] == "high"
        assert data["recommendation"] == "Provide extra tutoring"
        mock_instance.save.assert_called_once()


# =========================================================================
# Validation Tests
# =========================================================================


class TestImpactValidation:
    """Test input validation for Impact endpoints."""

    def test_create_school_missing_name(self, client):
        """Create school without name fails."""
        response = client.post("/api/impact/schools", json={})
        assert response.status_code == 422

    def test_create_subject_missing_name(self, client):
        """Create subject without name fails."""
        response = client.post("/api/impact/subjects", json={})
        assert response.status_code == 422

    def test_create_assessment_missing_fields(self, client):
        """Create assessment without required fields fails."""
        response = client.post(
            "/api/impact/assessments",
            json={"title": "Test"},
        )
        assert response.status_code == 422

    def test_create_question_invalid_skill_type(self, client):
        """Create question with invalid skill type fails."""
        response = client.post(
            "/api/impact/questions",
            json={
                "assessment_id": "1",
                "question_number": 1,
                "max_marks": 10,
                "skill_type": "invalid",
            },
        )
        assert response.status_code == 422

    def test_create_mark_entry_negative_score(self, client):
        """Create mark entry with negative score fails."""
        response = client.post(
            "/api/impact/mark-entries",
            json={
                "assessment_id": "1",
                "question_id": "1",
                "learner_id": "1",
                "score": -1,
                "max_score": 10,
            },
        )
        assert response.status_code == 422
