"""
Tests for Impact Intelligence Analytics Engine (Phase 2).

Tests deterministic analytics calculations:
- class average calculation
- pass rate calculation
- topic performance calculation
- weak topic detection
- learner risk detection
- incomplete marks handling
- max-score validation
- intervention generation
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from vault_core.analytics.impact import (
    ImpactAnalyticsEngine,
    AssessmentAnalytics,
    InterventionRecommendation,
    LearnerPerformance,
    QuestionPerformance,
    TopicPerformance,
)
from vault_core.domain.impact import (
    ImpactAssessment,
    ImpactAssessmentQuestion,
    ImpactLearner,
    ImpactMarkEntry,
    ImpactTopic,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def sample_assessment():
    """Create a sample assessment."""
    assessment = MagicMock(spec=ImpactAssessment)
    assessment.id = "impact_assessment:1"
    assessment.title = "Mid-Term Exam"
    assessment.assessment_type = "exam"
    assessment.total_marks = 100
    assessment.pass_mark = 50
    assessment.term = "Term 1"
    assessment.school_id = "impact_school:1"
    assessment.subject_id = "impact_subject:1"
    return assessment


@pytest.fixture
def sample_questions():
    """Create sample questions."""
    q1 = MagicMock(spec=ImpactAssessmentQuestion)
    q1.id = "impact_assessment_question:1"
    q1.question_number = 1
    q1.label = "Q1"
    q1.max_marks = 20
    q1.topic_id = "impact_topic:1"
    q1.skill_type = "knowledge"
    q1.difficulty = "easy"

    q2 = MagicMock(spec=ImpactAssessmentQuestion)
    q2.id = "impact_assessment_question:2"
    q2.question_number = 2
    q2.label = "Q2"
    q2.max_marks = 30
    q2.topic_id = "impact_topic:1"
    q2.skill_type = "comprehension"
    q2.difficulty = "medium"

    q3 = MagicMock(spec=ImpactAssessmentQuestion)
    q3.id = "impact_assessment_question:3"
    q3.question_number = 3
    q3.label = "Q3"
    q3.max_marks = 50
    q3.topic_id = "impact_topic:2"
    q3.skill_type = "application"
    q3.difficulty = "hard"

    return [q1, q2, q3]


@pytest.fixture
def sample_learners():
    """Create sample learners."""
    l1 = MagicMock(spec=ImpactLearner)
    l1.id = "impact_learner:1"
    l1.learner_code = "L001"
    l1.display_name = "John Doe"
    l1.school_id = "impact_school:1"

    l2 = MagicMock(spec=ImpactLearner)
    l2.id = "impact_learner:2"
    l2.learner_code = "L002"
    l2.display_name = "Jane Smith"
    l2.school_id = "impact_school:1"

    l3 = MagicMock(spec=ImpactLearner)
    l3.id = "impact_learner:3"
    l3.learner_code = "L003"
    l3.display_name = "Bob Wilson"
    l3.school_id = "impact_school:1"

    return [l1, l2, l3]


@pytest.fixture
def sample_topics():
    """Create sample topics."""
    t1 = MagicMock(spec=ImpactTopic)
    t1.id = "impact_topic:1"
    t1.name = "Algebra"
    t1.subject_id = "impact_subject:1"

    t2 = MagicMock(spec=ImpactTopic)
    t2.id = "impact_topic:2"
    t2.name = "Geometry"
    t2.subject_id = "impact_subject:1"

    return [t1, t2]


@pytest.fixture
def sample_marks():
    """Create sample marks for testing."""
    marks = []

    # Learner 1: Good performance
    marks.append(MagicMock(spec=ImpactMarkEntry, assessment_id="impact_assessment:1", question_id="impact_assessment_question:1", learner_id="impact_learner:1", score=18.0, max_score=20.0))
    marks.append(MagicMock(spec=ImpactMarkEntry, assessment_id="impact_assessment:1", question_id="impact_assessment_question:2", learner_id="impact_learner:1", score=25.0, max_score=30.0))
    marks.append(MagicMock(spec=ImpactMarkEntry, assessment_id="impact_assessment:1", question_id="impact_assessment_question:3", learner_id="impact_learner:1", score=40.0, max_score=50.0))

    # Learner 2: Borderline performance
    marks.append(MagicMock(spec=ImpactMarkEntry, assessment_id="impact_assessment:1", question_id="impact_assessment_question:1", learner_id="impact_learner:2", score=15.0, max_score=20.0))
    marks.append(MagicMock(spec=ImpactMarkEntry, assessment_id="impact_assessment:1", question_id="impact_assessment_question:2", learner_id="impact_learner:2", score=20.0, max_score=30.0))
    marks.append(MagicMock(spec=ImpactMarkEntry, assessment_id="impact_assessment:1", question_id="impact_assessment_question:3", learner_id="impact_learner:2", score=25.0, max_score=50.0))

    # Learner 3: Poor performance
    marks.append(MagicMock(spec=ImpactMarkEntry, assessment_id="impact_assessment:1", question_id="impact_assessment_question:1", learner_id="impact_learner:3", score=10.0, max_score=20.0))
    marks.append(MagicMock(spec=ImpactMarkEntry, assessment_id="impact_assessment:1", question_id="impact_assessment_question:2", learner_id="impact_learner:3", score=12.0, max_score=30.0))
    marks.append(MagicMock(spec=ImpactMarkEntry, assessment_id="impact_assessment:1", question_id="impact_assessment_question:3", learner_id="impact_learner:3", score=15.0, max_score=50.0))

    return marks


# =========================================================================
# Test Class Average Calculation
# =========================================================================


class TestClassAverageCalculation:
    """Test class average percentage calculation."""

    def test_class_average_calculation(self, sample_marks, sample_learners, sample_questions, sample_topics):
        """Test that class average is calculated correctly."""
        # Learner 1: (18+25+40)/100 = 83%
        # Learner 2: (15+20+25)/100 = 60%
        # Learner 3: (10+12+15)/100 = 37%
        # Average: (83+60+37)/3 = 60%

        learner_map = {l.id: l for l in sample_learners}
        question_map = {q.id: q for q in sample_questions}

        learner_perfs = ImpactAnalyticsEngine._calculate_learner_performance(
            sample_marks, question_map, learner_map, 100.0, 50.0
        )

        avg_percentage = sum(l.percentage for l in learner_perfs) / len(learner_perfs)
        assert avg_percentage == pytest.approx(60.0, rel=0.01)

    def test_class_average_with_no_marks(self):
        """Test class average with no marks."""
        learner_perfs = ImpactAnalyticsEngine._calculate_learner_performance(
            [], {}, {}, 100.0, 50.0
        )
        assert len(learner_perfs) == 0


# =========================================================================
# Test Pass Rate Calculation
# =========================================================================


class TestPassRateCalculation:
    """Test pass rate calculation."""

    def test_pass_rate_calculation(self, sample_marks, sample_learners, sample_questions):
        """Test that pass rate is calculated correctly."""
        # Learner 1: 83% (pass)
        # Learner 2: 60% (pass)
        # Learner 3: 37% (fail)
        # Pass rate: 2/3 = 66.67%

        learner_map = {l.id: l for l in sample_learners}
        question_map = {q.id: q for q in sample_questions}

        learner_perfs = ImpactAnalyticsEngine._calculate_learner_performance(
            sample_marks, question_map, learner_map, 100.0, 50.0
        )

        passed_count = sum(1 for l in learner_perfs if l.passed)
        pass_rate = (passed_count / len(learner_perfs)) * 100

        assert pass_rate == pytest.approx(66.67, rel=0.01)

    def test_all_learners_pass(self, sample_learners, sample_questions):
        """Test when all learners pass."""
        marks = [
            MagicMock(spec=ImpactMarkEntry, question_id="impact_assessment_question:1", learner_id="impact_learner:1", score=20.0, max_score=20.0),
            MagicMock(spec=ImpactMarkEntry, question_id="impact_assessment_question:2", learner_id="impact_learner:1", score=30.0, max_score=30.0),
            MagicMock(spec=ImpactMarkEntry, question_id="impact_assessment_question:3", learner_id="impact_learner:1", score=50.0, max_score=50.0),
            MagicMock(spec=ImpactMarkEntry, question_id="impact_assessment_question:1", learner_id="impact_learner:2", score=18.0, max_score=20.0),
            MagicMock(spec=ImpactMarkEntry, question_id="impact_assessment_question:2", learner_id="impact_learner:2", score=28.0, max_score=30.0),
            MagicMock(spec=ImpactMarkEntry, question_id="impact_assessment_question:3", learner_id="impact_learner:2", score=45.0, max_score=50.0),
        ]

        learner_map = {l.id: l for l in sample_learners}
        question_map = {q.id: q for q in sample_questions}

        learner_perfs = ImpactAnalyticsEngine._calculate_learner_performance(
            marks, question_map, learner_map, 100.0, 50.0
        )

        passed_count = sum(1 for l in learner_perfs if l.passed)
        pass_rate = (passed_count / len(learner_perfs)) * 100

        assert pass_rate == 100.0

    def test_no_learners_pass(self, sample_learners, sample_questions):
        """Test when no learners pass."""
        marks = [
            MagicMock(spec=ImpactMarkEntry, question_id="impact_assessment_question:1", learner_id="impact_learner:1", score=10.0, max_score=20.0),
            MagicMock(spec=ImpactMarkEntry, question_id="impact_assessment_question:2", learner_id="impact_learner:1", score=15.0, max_score=30.0),
            MagicMock(spec=ImpactMarkEntry, question_id="impact_assessment_question:3", learner_id="impact_learner:1", score=10.0, max_score=50.0),
        ]

        learner_map = {l.id: l for l in sample_learners}
        question_map = {q.id: q for q in sample_questions}

        learner_perfs = ImpactAnalyticsEngine._calculate_learner_performance(
            marks, question_map, learner_map, 100.0, 50.0
        )

        passed_count = sum(1 for l in learner_perfs if l.passed)
        pass_rate = (passed_count / len(learner_perfs)) * 100

        assert pass_rate == 0.0


# =========================================================================
# Test Topic Performance Calculation
# =========================================================================


class TestTopicPerformanceCalculation:
    """Test topic performance calculation."""

    def test_topic_percentage_calculation(self, sample_marks, sample_questions, sample_topics):
        """Test that topic percentage is calculated correctly."""
        question_map = {q.id: q for q in sample_questions}
        topic_map = {t.id: t for t in sample_topics}

        topic_perfs = ImpactAnalyticsEngine._calculate_topic_performance(
            sample_marks, question_map, topic_map
        )

        # Topic 1 (Algebra): Q1 + Q2
        # Learner 1: 18+25 = 43/50
        # Learner 2: 15+20 = 35/50
        # Learner 3: 10+12 = 22/50
        # Total: 100/150 = 66.67%

        algebra = next(t for t in topic_perfs if t.topic_name == "Algebra")
        assert algebra.percentage == pytest.approx(66.67, rel=0.01)

    def test_topic_with_no_marks(self, sample_questions, sample_topics):
        """Test topic with no marks."""
        question_map = {q.id: q for q in sample_questions}
        topic_map = {t.id: t for t in sample_topics}

        topic_perfs = ImpactAnalyticsEngine._calculate_topic_performance(
            [], question_map, topic_map
        )

        for topic in topic_perfs:
            assert topic.percentage == 0.0

    def test_topic_percentage_formula(self):
        """Test topic percentage formula."""
        topic_scores = [(10.0, 20.0), (15.0, 30.0)]
        percentage = ImpactAnalyticsEngine.calculate_topic_percentage(topic_scores)
        # (10+15)/(20+30) = 25/50 = 50%
        assert percentage == 50.0


# =========================================================================
# Test Weak Topic Detection
# =========================================================================


class TestWeakTopicDetection:
    """Test weak topic detection."""

    def test_critical_topic_detection(self):
        """Test critical topic detection (< 40%)."""
        is_weak, is_critical = ImpactAnalyticsEngine.classify_topic(35.0)
        assert is_critical is True
        assert is_weak is False

    def test_weak_topic_detection(self):
        """Test weak topic detection (40-55%)."""
        is_weak, is_critical = ImpactAnalyticsEngine.classify_topic(47.5)
        assert is_critical is False
        assert is_weak is True

    def test_stable_topic_detection(self):
        """Test stable topic detection (>= 55%)."""
        is_weak, is_critical = ImpactAnalyticsEngine.classify_topic(65.0)
        assert is_critical is False
        assert is_weak is False

    def test_boundary_critical_weak(self):
        """Test boundary between critical and weak (40%)."""
        is_weak, is_critical = ImpactAnalyticsEngine.classify_topic(40.0)
        assert is_critical is False
        assert is_weak is True

    def test_boundary_weak_stable(self):
        """Test boundary between weak and stable (55%)."""
        is_weak, is_critical = ImpactAnalyticsEngine.classify_topic(55.0)
        assert is_critical is False
        assert is_weak is False


# =========================================================================
# Test Learner Risk Detection
# =========================================================================


class TestLearnerRiskDetection:
    """Test learner risk detection."""

    def test_high_risk_detection(self):
        """Test high risk detection (< 40%)."""
        risk = ImpactAnalyticsEngine.classify_learner_risk(35.0, 35.0, 50.0)
        assert risk == "high"

    def test_medium_risk_detection(self):
        """Test medium risk detection (40-100% but below pass mark)."""
        risk = ImpactAnalyticsEngine.classify_learner_risk(45.0, 45.0, 50.0)
        assert risk == "medium"

    def test_low_risk_detection(self):
        """Test low risk detection (>= pass mark)."""
        risk = ImpactAnalyticsEngine.classify_learner_risk(60.0, 60.0, 50.0)
        assert risk == "low"

    def test_boundary_high_medium(self):
        """Test boundary between high and medium (40%)."""
        risk = ImpactAnalyticsEngine.classify_learner_risk(40.0, 40.0, 50.0)
        assert risk == "medium"

    def test_boundary_medium_low(self):
        """Test boundary between medium and low (at pass mark)."""
        risk = ImpactAnalyticsEngine.classify_learner_risk(50.0, 50.0, 50.0)
        assert risk == "low"


# =========================================================================
# Test Incomplete Marks Handling
# =========================================================================


class TestIncompleteMarksHandling:
    """Test handling of incomplete marks."""

    def test_learner_with_incomplete_marks(self, sample_learners, sample_questions):
        """Test learner with only some questions answered."""
        marks = [
            MagicMock(spec=ImpactMarkEntry, question_id="impact_assessment_question:1", learner_id="impact_learner:1", score=18.0, max_score=20.0),
            # Missing Q2 and Q3
        ]

        learner_map = {l.id: l for l in sample_learners}
        question_map = {q.id: q for q in sample_questions}

        learner_perfs = ImpactAnalyticsEngine._calculate_learner_performance(
            marks, question_map, learner_map, 100.0, 50.0
        )

        learner1 = next(l for l in learner_perfs if l.learner_id == "impact_learner:1")
        assert learner1.total_score == 18.0
        assert learner1.questions_answered == 1
        assert learner1.total_questions == 3
        assert learner1.percentage == 18.0  # 18/100 * 100

    def test_question_with_no_marks(self, sample_learners, sample_questions):
        """Test question with no marks."""
        marks = []  # No marks at all

        question_map = {q.id: q for q in sample_questions}

        question_perfs = ImpactAnalyticsEngine._calculate_question_performance(
            marks, question_map, 100.0
        )

        # No question performance since no marks
        assert len(question_perfs) == 0


# =========================================================================
# Test Max-Score Validation
# =========================================================================


class TestMaxScoreValidation:
    """Test max-score validation."""

    def test_zero_total_marks(self, sample_learners, sample_questions):
        """Test handling of zero total marks."""
        marks = [
            MagicMock(spec=ImpactMarkEntry, question_id="impact_assessment_question:1", learner_id="impact_learner:1", score=18.0, max_score=20.0),
        ]

        learner_map = {l.id: l for l in sample_learners}
        question_map = {q.id: q for q in sample_questions}

        learner_perfs = ImpactAnalyticsEngine._calculate_learner_performance(
            marks, question_map, learner_map, 0.0, 50.0
        )

        # Should handle division by zero gracefully
        assert len(learner_perfs) == 1
        assert learner_perfs[0].percentage == 0.0

    def test_zero_max_marks_question(self, sample_learners):
        """Test handling of question with zero max marks."""
        q1 = MagicMock(spec=ImpactAssessmentQuestion)
        q1.id = "impact_assessment_question:1"
        q1.question_number = 1
        q1.max_marks = 0  # Invalid
        q1.label = "Q1"
        q1.topic_id = None
        q1.skill_type = "knowledge"
        q1.difficulty = None

        marks = [
            MagicMock(spec=ImpactMarkEntry, question_id="impact_assessment_question:1", learner_id="impact_learner:1", score=10.0, max_score=0.0),
        ]

        learner_map = {l.id: l for l in sample_learners}
        question_map = {q1.id: q1}

        question_perfs = ImpactAnalyticsEngine._calculate_question_performance(
            marks, question_map, 100.0
        )

        # Should handle division by zero gracefully
        assert len(question_perfs) == 1
        assert question_perfs[0].average_percentage == 0.0


# =========================================================================
# Test Intervention Generation
# =========================================================================


class TestInterventionGeneration:
    """Test intervention recommendation generation."""

    def test_critical_topic_intervention(self):
        """Test intervention for critical topic."""
        weak_topics = [
            TopicPerformance(
                topic_id="impact_topic:1",
                topic_name="Algebra",
                total_score=30.0,
                total_max_marks=100.0,
                percentage=30.0,
                num_questions=2,
                num_learners=10,
                is_weak=False,
                is_critical=True,
            )
        ]

        interventions = ImpactAnalyticsEngine._generate_interventions(weak_topics, [], 100.0)

        assert len(interventions) == 1
        assert interventions[0].intervention_type == "critical"
        assert interventions[0].severity == "critical"
        assert "Re-teach Algebra" in interventions[0].recommendation

    def test_weak_topic_intervention(self):
        """Test intervention for weak topic."""
        weak_topics = [
            TopicPerformance(
                topic_id="impact_topic:1",
                topic_name="Geometry",
                total_score=45.0,
                total_max_marks=100.0,
                percentage=45.0,
                num_questions=2,
                num_learners=10,
                is_weak=True,
                is_critical=False,
            )
        ]

        interventions = ImpactAnalyticsEngine._generate_interventions(weak_topics, [], 100.0)

        assert len(interventions) == 1
        assert interventions[0].intervention_type == "weak"
        assert interventions[0].severity == "high"
        assert "Revise Geometry" in interventions[0].recommendation

    def test_high_risk_learner_intervention(self):
        """Test intervention for high-risk learner."""
        at_risk = [
            LearnerPerformance(
                learner_id="impact_learner:1",
                learner_code="L001",
                display_name="John Doe",
                total_score=35.0,
                total_max_marks=100.0,
                percentage=35.0,
                passed=False,
                risk_level="high",
                questions_answered=3,
                total_questions=3,
            )
        ]

        interventions = ImpactAnalyticsEngine._generate_interventions([], at_risk, 100.0)

        assert len(interventions) == 1
        assert interventions[0].intervention_type == "critical"
        assert interventions[0].entity_type == "learner"
        assert "high risk" in interventions[0].recommendation

    def test_medium_risk_learner_intervention(self):
        """Test intervention for medium-risk learner."""
        at_risk = [
            LearnerPerformance(
                learner_id="impact_learner:1",
                learner_code="L001",
                display_name="John Doe",
                total_score=45.0,
                total_max_marks=100.0,
                percentage=45.0,
                passed=False,
                risk_level="medium",
                questions_answered=3,
                total_questions=3,
            )
        ]

        interventions = ImpactAnalyticsEngine._generate_interventions([], at_risk, 100.0)

        assert len(interventions) == 1
        assert interventions[0].intervention_type == "weak"
        assert interventions[0].entity_type == "learner"
        assert "medium risk" in interventions[0].recommendation

    def test_mixed_interventions_sorted_by_severity(self):
        """Test that interventions are sorted by severity."""
        weak_topics = [
            TopicPerformance(
                topic_id="impact_topic:1",
                topic_name="Algebra",
                total_score=30.0,
                total_max_marks=100.0,
                percentage=30.0,
                num_questions=2,
                num_learners=10,
                is_weak=False,
                is_critical=True,
            )
        ]

        at_risk = [
            LearnerPerformance(
                learner_id="impact_learner:1",
                learner_code="L001",
                display_name="John Doe",
                total_score=35.0,
                total_max_marks=100.0,
                percentage=35.0,
                passed=False,
                risk_level="high",
                questions_answered=3,
                total_questions=3,
            )
        ]

        interventions = ImpactAnalyticsEngine._generate_interventions(weak_topics, at_risk, 100.0)

        # Should be sorted: critical first
        assert len(interventions) == 2
        assert interventions[0].severity == "critical"
        assert interventions[1].severity == "critical"


# =========================================================================
# Test Learner Total and Percentage Calculation
# =========================================================================


class TestLearnerCalculations:
    """Test learner total and percentage calculations."""

    def test_learner_total_calculation(self):
        """Test learner total score calculation."""
        marks = [
            MagicMock(spec=ImpactMarkEntry, score=10.0),
            MagicMock(spec=ImpactMarkEntry, score=15.0),
            MagicMock(spec=ImpactMarkEntry, score=20.0),
        ]

        total = ImpactAnalyticsEngine.calculate_learner_total(marks)
        assert total == 45.0

    def test_learner_percentage_calculation(self):
        """Test learner percentage calculation."""
        percentage = ImpactAnalyticsEngine.calculate_learner_percentage(75.0, 100.0)
        assert percentage == 75.0

    def test_learner_percentage_with_zero_total_marks(self):
        """Test learner percentage with zero total marks."""
        percentage = ImpactAnalyticsEngine.calculate_learner_percentage(50.0, 0.0)
        assert percentage == 0.0

    def test_learner_pass_check_with_pass_mark(self):
        """Test learner pass check with explicit pass mark."""
        assert ImpactAnalyticsEngine.check_learner_pass(50.0, 50.0, 100.0) is True
        assert ImpactAnalyticsEngine.check_learner_pass(49.0, 50.0, 100.0) is False

    def test_learner_pass_check_without_pass_mark(self):
        """Test learner pass check without explicit pass mark (default 50%)."""
        assert ImpactAnalyticsEngine.check_learner_pass(50.0, None, 100.0) is True
        assert ImpactAnalyticsEngine.check_learner_pass(49.0, None, 100.0) is False


# =========================================================================
# Test Question Performance
# =========================================================================


class TestQuestionPerformance:
    """Test question performance calculation."""

    def test_question_average_calculation(self, sample_marks, sample_questions):
        """Test question average score calculation."""
        question_map = {q.id: q for q in sample_questions}

        question_perfs = ImpactAnalyticsEngine._calculate_question_performance(
            sample_marks, question_map, 100.0
        )

        # Q1: (18+15+10)/3 = 14.33/20 = 71.67%
        q1 = next(q for q in question_perfs if q.question_number == 1)
        assert q1.average_score == pytest.approx(14.33, rel=0.01)
        assert q1.average_percentage == pytest.approx(71.67, rel=0.01)

    def test_critical_question_detection(self, sample_learners, sample_questions):
        """Test critical question detection (< 35%)."""
        # Create marks where Q3 has very low performance
        marks = [
            MagicMock(spec=ImpactMarkEntry, question_id="impact_assessment_question:3", learner_id="impact_learner:1", score=5.0, max_score=50.0),
            MagicMock(spec=ImpactMarkEntry, question_id="impact_assessment_question:3", learner_id="impact_learner:2", score=8.0, max_score=50.0),
            MagicMock(spec=ImpactMarkEntry, question_id="impact_assessment_question:3", learner_id="impact_learner:3", score=10.0, max_score=50.0),
        ]

        question_map = {q.id: q for q in sample_questions}

        question_perfs = ImpactAnalyticsEngine._calculate_question_performance(
            marks, question_map, 100.0
        )

        q3 = next(q for q in question_perfs if q.question_number == 3)
        # Average: (5+8+10)/3 = 7.67/50 = 15.33%
        assert q3.average_percentage == pytest.approx(15.33, rel=0.01)
        assert q3.is_critical is True


# =========================================================================
# Test Dashboard Aggregation Helpers
# =========================================================================


class TestBuildThingConditions:
    """Test _build_thing_conditions helper for RecordId queries."""

    def test_build_thing_conditions_basic(self):
        """Test basic type::thing condition building."""
        from api.routers.impact import _build_thing_conditions, _strip_prefix

        ids = ["impact_assessment:abc123", "impact_assessment:def456"]
        result = _build_thing_conditions(ids, "impact_assessment", "assessment_id")
        assert "type::thing('impact_assessment', 'abc123')" in result
        assert "type::thing('impact_assessment', 'def456')" in result
        assert "OR" in result
        assert result.startswith("assessment_id =")

    def test_build_thing_conditions_strips_prefix(self):
        """Test that _build_thing_conditions strips table prefix."""
        from api.routers.impact import _build_thing_conditions

        ids = ["impact_assessment:xyz789"]
        result = _build_thing_conditions(ids, "impact_assessment", "assessment_id")
        assert "type::thing('impact_assessment', 'xyz789')" in result
        assert "impact_assessment:xyz789" not in result

    def test_build_thing_conditions_empty(self):
        """Test empty list returns FALSE."""
        from api.routers.impact import _build_thing_conditions

        result = _build_thing_conditions([], "impact_assessment", "assessment_id")
        assert result == "FALSE"

    def test_build_thing_conditions_default_field(self):
        """Test default field name is 'id'."""
        from api.routers.impact import _build_thing_conditions

        ids = ["impact_school:1"]
        result = _build_thing_conditions(ids, "impact_school")
        assert result.startswith("id =")
        assert "impact_school" in result

    def test_build_thing_conditions_none_items_filtered(self):
        """Test that None items are filtered out."""
        from api.routers.impact import _build_thing_conditions

        ids = ["impact_assessment:abc", None, "impact_assessment:def"]
        result = _build_thing_conditions(ids, "impact_assessment", "assessment_id")
        assert "type::thing('impact_assessment', 'abc')" in result
        assert "type::thing('impact_assessment', 'def')" in result


class TestDashboardAggregationLogic:
    """Test the dashboard aggregation calculation logic.

    These tests verify the aggregation semantics using mocked data,
    covering pass rate, subject breakdown, class breakdown, and weakest topics.
    """

    def test_aggregation_learners_assessed_count(self):
        """Test total_learners_assessed counts unique learners across marks."""
        from api.routers.impact import _build_thing_conditions

        # Use Python-level logic to verify aggregation semantics
        marks = [
            type("Mark", (), {"learner_id": "impact_learner:1", "assessment_id": "impact_assessment:1", "question_id": "q1", "score": 10.0})(),
            type("Mark", (), {"learner_id": "impact_learner:1", "assessment_id": "impact_assessment:1", "question_id": "q2", "score": 8.0})(),
            type("Mark", (), {"learner_id": "impact_learner:2", "assessment_id": "impact_assessment:1", "question_id": "q1", "score": 6.0})(),
            type("Mark", (), {"learner_id": "impact_learner:3", "assessment_id": "impact_assessment:1", "question_id": "q1", "score": 4.0})(),
        ]
        total_learners_assessed = len(set(m.learner_id for m in marks))
        assert total_learners_assessed == 3

    def test_aggregation_pass_rate_calculation(self):
        """Test pass rate calculation across assessments."""
        marks = [
            type("Mark", (), {"learner_id": "impact_learner:1", "assessment_id": "impact_assessment:1", "score": 60.0})(),
            type("Mark", (), {"learner_id": "impact_learner:2", "assessment_id": "impact_assessment:1", "score": 45.0})(),
            type("Mark", (), {"learner_id": "impact_learner:3", "assessment_id": "impact_assessment:1", "score": 30.0})(),
        ]
        assessment = type("Assessment", (), {"id": "impact_assessment:1", "pass_mark": 50, "total_marks": 100})()

        # Group marks by learner for this assessment
        learner_totals = {}
        for m in marks:
            if m.learner_id not in learner_totals:
                learner_totals[m.learner_id] = 0
            learner_totals[m.learner_id] += m.score

        passed_count = 0
        for total in learner_totals.values():
            if assessment.pass_mark and total >= assessment.pass_mark:
                passed_count += 1

        total_assessed = len(learner_totals)
        pass_rate = (passed_count / total_assessed * 100) if total_assessed > 0 else 0

        # Learner 1: 60 >= 50 pass, Learner 2: 45 < 50 fail, Learner 3: 30 < 50 fail
        assert passed_count == 1
        assert pass_rate == pytest.approx(33.33, rel=0.01)

    def test_aggregation_pass_rate_default_threshold(self):
        """Test pass rate uses 50% default when no pass_mark."""
        marks = [
            type("Mark", (), {"learner_id": "impact_learner:1", "assessment_id": "impact_assessment:1", "score": 50.0})(),
            type("Mark", (), {"learner_id": "impact_learner:2", "assessment_id": "impact_assessment:1", "score": 49.0})(),
        ]
        assessment = type("Assessment", (), {"id": "impact_assessment:1", "pass_mark": None, "total_marks": 100})()

        learner_totals = {}
        for m in marks:
            if m.learner_id not in learner_totals:
                learner_totals[m.learner_id] = 0
            learner_totals[m.learner_id] += m.score

        passed = 0
        for total in learner_totals.values():
            if not assessment.pass_mark and (total / assessment.total_marks * 100) >= 50:
                passed += 1

        assert passed == 1

    def test_aggregation_subject_breakdown(self):
        """Test pass rate is correct per subject."""
        assessments = [
            type("A", (), {"id": "impact_assessment:1", "subject_id": "impact_subject:1", "pass_mark": 50, "total_marks": 100})(),
            type("A", (), {"id": "impact_assessment:2", "subject_id": "impact_subject:2", "pass_mark": 50, "total_marks": 100})(),
        ]
        marks = [
            type("M", (), {"assessment_id": "impact_assessment:1", "learner_id": "l1", "score": 60.0})(),
            type("M", (), {"assessment_id": "impact_assessment:1", "learner_id": "l2", "score": 30.0})(),
            type("M", (), {"assessment_id": "impact_assessment:2", "learner_id": "l3", "score": 70.0})(),
        ]

        # Subject 1: 1 pass / 2 learners = 50%
        s1_assessments = [a for a in assessments if a.subject_id == "impact_subject:1"]
        s1_marks = [m for m in marks if m.assessment_id in [a.id for a in s1_assessments]]
        s1_learners = len(set(m.learner_id for m in s1_marks))
        s1_passed = 0
        for a in s1_assessments:
            lt = {}
            for m in s1_marks:
                if m.assessment_id == a.id:
                    lt.setdefault(m.learner_id, 0)
                    lt[m.learner_id] += m.score
            for t in lt.values():
                if t >= a.pass_mark:
                    s1_passed += 1

        assert s1_learners == 2
        assert s1_passed == 1

    def test_aggregation_weakest_topics_detection(self):
        """Test weakest topics are those below 55%."""
        topics_data = [
            {"name": "Fractions", "percentage": 45.0, "is_critical": False},
            {"name": "Ratios", "percentage": 30.0, "is_critical": True},
            {"name": "Graphs", "percentage": 65.0, "is_critical": False},
            {"name": "Word Problems", "percentage": 50.0, "is_critical": False},
        ]

        weakest = [t for t in topics_data if t["percentage"] < 55]
        assert len(weakest) == 3
        assert weakest[0]["name"] == "Fractions"
        assert weakest[1]["name"] == "Ratios"
        assert weakest[2]["name"] == "Word Problems"

        # Sort by percentage ascending
        weakest.sort(key=lambda x: x["percentage"])
        assert weakest[0]["name"] == "Ratios"  # 30%
        assert weakest[1]["name"] == "Fractions"  # 45%
        assert weakest[2]["name"] == "Word Problems"  # 50%

    def test_aggregation_classes_needing_support(self):
        """Test classes needing support (pass rate < 50%)."""
        classes = [
            {"name": "Form 1A", "pass_rate": 45.0, "total_learners": 30},
            {"name": "Form 1B", "pass_rate": 65.0, "total_learners": 28},
            {"name": "Form 1C", "pass_rate": 30.0, "total_learners": 25},
            {"name": "Form 2A", "pass_rate": 0.0, "total_learners": 0},
        ]

        needing = [c for c in classes if c["pass_rate"] < 50 and c["total_learners"] > 0]
        assert len(needing) == 2
        assert needing[0]["name"] == "Form 1A"
        assert needing[1]["name"] == "Form 1C"


# =========================================================================
# End-to-end calculate_analytics (the production path)
# =========================================================================
#
# Before this test the suite only exercised the private helper methods
# (classify_topic / classify_learner_risk / calculate_topic_percentage),
# which were NOT called by calculate_analytics(). This test drives the real
# entry point with mocked data-fetch methods and asserts the full
# AssessmentAnalytics output, including the summary statistics and that the
# production classification now matches the unit-tested helpers.

import asyncio  # noqa: E402


class TestCalculateAnalyticsEndToEnd:
    """Drive ImpactAnalyticsEngine.calculate_analytics() end-to-end."""

    @pytest.fixture
    def assessment(self):
        a = MagicMock(spec=ImpactAssessment)
        a.id = "impact_assessment:1"
        a.title = "Mid-Term Exam"
        a.assessment_type = "exam"
        a.total_marks = 100
        a.pass_mark = 50
        a.term = "Term 1"
        a.school_id = "impact_school:1"
        a.subject_id = "impact_subject:1"
        a.class_group_id = "impact_class_group:1"
        return a

    @pytest.fixture
    def questions(self):
        q1 = MagicMock(spec=ImpactAssessmentQuestion)
        q1.id = "impact_assessment_question:1"
        q1.question_number = 1
        q1.label = "Q1"
        q1.max_marks = 20
        q1.topic_id = "impact_topic:1"
        q1.skill_type = "knowledge"
        q1.difficulty = "easy"

        q2 = MagicMock(spec=ImpactAssessmentQuestion)
        q2.id = "impact_assessment_question:2"
        q2.question_number = 2
        q2.label = "Q2"
        q2.max_marks = 30
        q2.topic_id = "impact_topic:1"
        q2.skill_type = "application"
        q2.difficulty = "medium"

        q3 = MagicMock(spec=ImpactAssessmentQuestion)
        q3.id = "impact_assessment_question:3"
        q3.question_number = 3
        q3.label = "Q3"
        q3.max_marks = 50
        q3.topic_id = "impact_topic:2"
        q3.skill_type = "application"
        q3.difficulty = "hard"
        return [q1, q2, q3]

    @pytest.fixture
    def topics(self):
        t1 = MagicMock(spec=ImpactTopic)
        t1.id = "impact_topic:1"
        t1.name = "Algebra"
        t1.subject_id = "impact_subject:1"
        t2 = MagicMock(spec=ImpactTopic)
        t2.id = "impact_topic:2"
        t2.name = "Geometry"
        t2.subject_id = "impact_subject:1"
        return [t1, t2]

    @pytest.fixture
    def learners(self):
        out = []
        for i in (1, 2, 3):
            l = MagicMock(spec=ImpactLearner)
            l.id = f"impact_learner:{i}"
            l.learner_code = f"L00{i}"
            l.display_name = f"Learner {i}"
            l.school_id = "impact_school:1"
            out.append(l)
        return out

    @pytest.fixture
    def marks(self):
        # Learner 1: 68% (pass, low)
        # Learner 2: 36% (fail, high risk)
        # Learner 3: 60% (pass, low)
        rows = [
            ("impact_learner:1", "impact_assessment_question:1", 8.0),
            ("impact_learner:1", "impact_assessment_question:2", 15.0),
            ("impact_learner:1", "impact_assessment_question:3", 45.0),
            ("impact_learner:2", "impact_assessment_question:1", 6.0),
            ("impact_learner:2", "impact_assessment_question:2", 10.0),
            ("impact_learner:2", "impact_assessment_question:3", 20.0),
            ("impact_learner:3", "impact_assessment_question:1", 10.0),
            ("impact_learner:3", "impact_assessment_question:2", 20.0),
            ("impact_learner:3", "impact_assessment_question:3", 30.0),
        ]
        return [
            MagicMock(
                spec=ImpactMarkEntry,
                assessment_id="impact_assessment:1",
                question_id=qid,
                learner_id=lid,
                score=score,
                max_score=None,
            )
            for lid, qid, score in rows
        ]

    def test_full_pipeline(self, assessment, questions, topics, learners, marks):
        with patch("vault_core.analytics.impact.ImpactAssessment") as MockAssess, patch.object(
            ImpactAnalyticsEngine, "_fetch_questions", return_value=questions
        ), patch.object(
            ImpactAnalyticsEngine, "_fetch_marks", return_value=marks
        ), patch.object(
            ImpactAnalyticsEngine, "_fetch_learners_by_class", return_value=learners
        ), patch.object(
            ImpactAnalyticsEngine, "_fetch_topics", return_value=topics
        ):
            MockAssess.get = AsyncMock(return_value=assessment)
            result = asyncio.run(
                ImpactAnalyticsEngine.calculate_analytics("impact_assessment:1")
            )

        # Summary statistics
        assert result.total_learners == 3
        assert result.learners_assessed == 3
        assert result.mark_completion_rate == 100.0
        assert result.pass_rate == pytest.approx(66.67, rel=0.01)
        assert result.failure_rate == pytest.approx(33.33, rel=0.01)
        assert result.class_average_percentage == pytest.approx(55.0, rel=0.01)

        # Every learner is present and classified correctly
        by_code = {lp.learner_code: lp for lp in result.learner_performance}
        assert by_code["L001"].risk_level == "low"
        assert by_code["L002"].risk_level == "high"
        assert by_code["L003"].risk_level == "low"
        assert len(result.at_risk_learners) == 1

        # Topic aggregation: Algebra = 46% (weak), Geometry = 63% (stable)
        by_topic = {tp.topic_id: tp for tp in result.topic_performance}
        assert by_topic["impact_topic:1"].percentage == pytest.approx(46.0, rel=0.01)
        assert by_topic["impact_topic:1"].is_weak is True
        assert by_topic["impact_topic:1"].is_critical is False
        assert by_topic["impact_topic:2"].is_weak is False
        assert by_topic["impact_topic:2"].is_critical is False
        # Weak topics list must include the weak Algebra topic
        weak_ids = {t.topic_id for t in result.weak_topics}
        assert "impact_topic:1" in weak_ids

        # Interventions: 1 weak topic + 1 at-risk learner
        assert len(result.interventions) == 2

    def test_completion_rate_uses_class_population(
        self, assessment, questions, topics, marks
    ):
        """Completion rate is against the assessed class group, not the whole
        school. Here the class has 3 learners and all 3 are marked => 100%."""
        class_learners = []
        for i in (1, 2, 3):
            l = MagicMock(spec=ImpactLearner)
            l.id = f"impact_learner:{i}"
            l.learner_code = f"L00{i}"
            l.display_name = f"Learner {i}"
            l.school_id = "impact_school:1"
            class_learners.append(l)

        with patch("vault_core.analytics.impact.ImpactAssessment") as MockAssess, patch.object(
            ImpactAnalyticsEngine, "_fetch_questions", return_value=questions
        ), patch.object(
            ImpactAnalyticsEngine, "_fetch_marks", return_value=marks
        ), patch.object(
            ImpactAnalyticsEngine, "_fetch_learners_by_class", return_value=class_learners
        ), patch.object(
            ImpactAnalyticsEngine, "_fetch_topics", return_value=topics
        ):
            MockAssess.get = AsyncMock(return_value=assessment)
            result = asyncio.run(
                ImpactAnalyticsEngine.calculate_analytics("impact_assessment:1")
            )

        assert result.total_learners == 3
        assert result.mark_completion_rate == 100.0
