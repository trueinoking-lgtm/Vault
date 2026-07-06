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
