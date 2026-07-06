"""
Impact Intelligence Analytics Engine — deterministic assessment analytics.

Calculates class performance, topic weaknesses, question weaknesses,
learner risk, and intervention recommendations from assessment data.

No AI provider required — all calculations are deterministic.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple

from loguru import logger

from vault_core.database.repository import repo_query
from vault_core.domain.impact import (
    ImpactAssessment,
    ImpactAssessmentQuestion,
    ImpactLearner,
    ImpactMarkEntry,
    ImpactTopic,
)


# ---------------------------------------------------------------------------
# Data classes for analytics results
# ---------------------------------------------------------------------------


@dataclass
class QuestionPerformance:
    """Performance metrics for a single question."""

    question_id: str
    question_number: int
    label: Optional[str]
    max_marks: float
    topic_id: Optional[str]
    skill_type: str
    difficulty: Optional[str]
    total_score: float = 0.0
    num_learners: int = 0
    average_score: float = 0.0
    average_percentage: float = 0.0
    is_critical: bool = False


@dataclass
class TopicPerformance:
    """Performance metrics for a topic across questions."""

    topic_id: str
    topic_name: str
    total_score: float = 0.0
    total_max_marks: float = 0.0
    percentage: float = 0.0
    num_questions: int = 0
    num_learners: int = 0
    is_weak: bool = False
    is_critical: bool = False


@dataclass
class LearnerPerformance:
    """Performance metrics for a single learner."""

    learner_id: str
    learner_code: str
    display_name: Optional[str]
    total_score: float = 0.0
    total_max_marks: float = 0.0
    percentage: float = 0.0
    passed: bool = False
    risk_level: str = "low"  # "low" | "medium" | "high"
    questions_answered: int = 0
    total_questions: int = 0


@dataclass
class InterventionRecommendation:
    """Recommended intervention based on performance."""

    intervention_type: str  # "critical" | "weak" | "stable"
    entity_type: str  # "topic" | "learner"
    entity_id: str
    entity_name: str
    severity: str  # "low" | "medium" | "high" | "critical"
    recommendation: str
    percentage: float


@dataclass
class AssessmentAnalytics:
    """Complete analytics for an assessment."""

    assessment_id: str
    assessment_title: str
    assessment_type: str
    total_marks: float
    pass_mark: Optional[float]
    term: Optional[str]

    # Summary statistics
    total_learners: int = 0
    learners_assessed: int = 0
    mark_completion_rate: float = 0.0
    class_average_percentage: float = 0.0
    pass_rate: float = 0.0
    failure_rate: float = 0.0

    # Detailed performance
    question_performance: List[QuestionPerformance] = field(default_factory=list)
    topic_performance: List[TopicPerformance] = field(default_factory=list)
    learner_performance: List[LearnerPerformance] = field(default_factory=list)

    # Weaknesses and interventions
    weak_topics: List[TopicPerformance] = field(default_factory=list)
    at_risk_learners: List[LearnerPerformance] = field(default_factory=list)
    interventions: List[InterventionRecommendation] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Analytics Engine
# ---------------------------------------------------------------------------


class ImpactAnalyticsEngine:
    """
    Deterministic analytics engine for Impact Intelligence.

    Calculates assessment performance metrics without requiring AI providers.
    """

    # Thresholds for topic performance
    CRITICAL_TOPIC_THRESHOLD = 40.0
    WEAK_TOPIC_THRESHOLD = 55.0

    # Thresholds for question performance
    CRITICAL_QUESTION_THRESHOLD = 35.0

    # Thresholds for learner risk
    HIGH_RISK_THRESHOLD = 40.0
    MEDIUM_RISK_THRESHOLD = 100.0  # Pass mark is checked separately

    @classmethod
    async def calculate_analytics(cls, assessment_id: str) -> AssessmentAnalytics:
        """
        Calculate complete analytics for an assessment.

        Args:
            assessment_id: The assessment ID (with or without table prefix)

        Returns:
            AssessmentAnalytics with all calculated metrics

        Raises:
            ValueError: If assessment not found
        """
        # Normalize assessment ID
        if ":" not in assessment_id:
            assessment_id = f"impact_assessment:{assessment_id}"

        # Fetch assessment
        assessment = await ImpactAssessment.get(assessment_id)
        if not assessment:
            raise ValueError(f"Assessment {assessment_id} not found")

        # Fetch all related data
        questions = await cls._fetch_questions(assessment_id)
        marks = await cls._fetch_marks(assessment_id)
        learners = await cls._fetch_learners(assessment.school_id)
        topics = await cls._fetch_topics(assessment.subject_id)

        # Build lookup maps (filter out None keys)
        question_map = {q.id: q for q in questions if q.id is not None}
        topic_map = {t.id: t for t in topics if t.id is not None}
        learner_map = {l.id: l for l in learners if l.id is not None}

        # Calculate per-learner performance
        learner_perfs = cls._calculate_learner_performance(
            marks, question_map, learner_map, assessment.total_marks, assessment.pass_mark
        )

        # Calculate per-question performance
        question_perfs = cls._calculate_question_performance(
            marks, question_map, assessment.total_marks
        )

        # Calculate per-topic performance
        topic_perfs = cls._calculate_topic_performance(
            marks, question_map, topic_map
        )

        # Identify weak topics and at-risk learners
        weak_topics = [t for t in topic_perfs if t.is_weak or t.is_critical]
        at_risk = [l for l in learner_perfs if l.risk_level in ("medium", "high")]

        # Generate interventions
        interventions = cls._generate_interventions(
            weak_topics, at_risk, assessment.total_marks
        )

        # Calculate summary statistics
        assessed_count = len(learner_perfs)
        total_learners = len(learners)
        completion_rate = (assessed_count / total_learners * 100) if total_learners > 0 else 0.0

        avg_percentage = 0.0
        pass_rate = 0.0
        failure_rate = 0.0
        if assessed_count > 0:
            avg_percentage = sum(l.percentage for l in learner_perfs) / assessed_count
            passed_count = sum(1 for l in learner_perfs if l.passed)
            pass_rate = (passed_count / assessed_count) * 100
            failure_rate = 100.0 - pass_rate

        return AssessmentAnalytics(
            assessment_id=assessment_id,
            assessment_title=assessment.title,
            assessment_type=assessment.assessment_type,
            total_marks=assessment.total_marks,
            pass_mark=assessment.pass_mark,
            term=assessment.term,
            total_learners=total_learners,
            learners_assessed=assessed_count,
            mark_completion_rate=completion_rate,
            class_average_percentage=round(avg_percentage, 2),
            pass_rate=round(pass_rate, 2),
            failure_rate=round(failure_rate, 2),
            question_performance=question_perfs,
            topic_performance=topic_perfs,
            learner_performance=learner_perfs,
            weak_topics=weak_topics,
            at_risk_learners=at_risk,
            interventions=interventions,
        )

    @classmethod
    async def _fetch_questions(cls, assessment_id: str) -> List[ImpactAssessmentQuestion]:
        """Fetch all questions for an assessment."""
        result = await repo_query(
            "SELECT * FROM impact_assessment_question WHERE assessment_id = $assessment_id ORDER BY question_number",
            {"assessment_id": assessment_id},
        )
        return [ImpactAssessmentQuestion(**r) for r in result]

    @classmethod
    async def _fetch_marks(cls, assessment_id: str) -> List[ImpactMarkEntry]:
        """Fetch all mark entries for an assessment."""
        result = await repo_query(
            "SELECT * FROM impact_mark_entry WHERE assessment_id = $assessment_id",
            {"assessment_id": assessment_id},
        )
        return [ImpactMarkEntry(**r) for r in result]

    @classmethod
    async def _fetch_learners(cls, school_id: str) -> List[ImpactLearner]:
        """Fetch all learners in a school."""
        result = await repo_query(
            "SELECT * FROM impact_learner WHERE school_id = $school_id",
            {"school_id": school_id},
        )
        return [ImpactLearner(**r) for r in result]

    @classmethod
    async def _fetch_topics(cls, subject_id: str) -> List[ImpactTopic]:
        """Fetch all topics for a subject."""
        result = await repo_query(
            "SELECT * FROM impact_topic WHERE subject_id = $subject_id",
            {"subject_id": subject_id},
        )
        return [ImpactTopic(**r) for r in result]

    @classmethod
    def _calculate_learner_performance(
        cls,
        marks: List[ImpactMarkEntry],
        question_map: Dict[str, ImpactAssessmentQuestion],
        learner_map: Dict[str, ImpactLearner],
        total_marks: float,
        pass_mark: Optional[float],
    ) -> List[LearnerPerformance]:
        """
        Calculate performance for each learner.

        Rules:
        - learner total = sum question scores
        - learner percentage = total / assessment total_marks * 100
        - pass if learner total >= pass_mark
        """
        # Group marks by learner
        marks_by_learner: Dict[str, List[ImpactMarkEntry]] = {}
        for mark in marks:
            learner_id = mark.learner_id
            if learner_id not in marks_by_learner:
                marks_by_learner[learner_id] = []
            marks_by_learner[learner_id].append(mark)

        # Calculate total questions
        total_questions = len(question_map)

        # Calculate performance for each learner
        performances = []
        for learner_id, learner_marks in marks_by_learner.items():
            learner = learner_map.get(learner_id)
            if not learner:
                continue

            # Sum scores
            total_score = sum(m.score for m in learner_marks)
            questions_answered = len(learner_marks)

            # Calculate percentage
            percentage = (total_score / total_marks * 100) if total_marks > 0 else 0.0

            # Determine pass/fail
            passed = False
            if pass_mark is not None:
                passed = total_score >= pass_mark
            else:
                # Default: pass if >= 50%
                passed = percentage >= 50.0

            # Determine risk level
            risk_level = "low"
            if percentage < cls.HIGH_RISK_THRESHOLD:
                risk_level = "high"
            elif total_score < (pass_mark or total_marks * 0.5):
                risk_level = "medium"

            performances.append(
                LearnerPerformance(
                    learner_id=learner_id,
                    learner_code=learner.learner_code,
                    display_name=learner.display_name,
                    total_score=total_score,
                    total_max_marks=total_marks,
                    percentage=round(percentage, 2),
                    passed=passed,
                    risk_level=risk_level,
                    questions_answered=questions_answered,
                    total_questions=total_questions,
                )
            )

        # Sort by learner code
        performances.sort(key=lambda x: x.learner_code)
        return performances

    @classmethod
    def _calculate_question_performance(
        cls,
        marks: List[ImpactMarkEntry],
        question_map: Dict[str, ImpactAssessmentQuestion],
        total_marks: float,
    ) -> List[QuestionPerformance]:
        """
        Calculate performance for each question.

        Rules:
        - question is critical if average percentage < 35
        """
        # Group marks by question
        marks_by_question: Dict[str, List[ImpactMarkEntry]] = {}
        for mark in marks:
            question_id = mark.question_id
            if question_id not in marks_by_question:
                marks_by_question[question_id] = []
            marks_by_question[question_id].append(mark)

        # Calculate performance for each question
        performances = []
        for question_id, question_marks in marks_by_question.items():
            question = question_map.get(question_id)
            if not question:
                continue

            # Sum scores
            total_score = sum(m.score for m in question_marks)
            num_learners = len(question_marks)

            # Calculate average score and percentage
            average_score = total_score / num_learners if num_learners > 0 else 0.0
            average_percentage = (average_score / question.max_marks * 100) if question.max_marks > 0 else 0.0

            # Determine if critical
            is_critical = average_percentage < cls.CRITICAL_QUESTION_THRESHOLD

            performances.append(
                QuestionPerformance(
                    question_id=question_id,
                    question_number=question.question_number,
                    label=question.label,
                    max_marks=question.max_marks,
                    topic_id=question.topic_id,
                    skill_type=question.skill_type,
                    difficulty=question.difficulty,
                    total_score=total_score,
                    num_learners=num_learners,
                    average_score=round(average_score, 2),
                    average_percentage=round(average_percentage, 2),
                    is_critical=is_critical,
                )
            )

        # Sort by question number
        performances.sort(key=lambda x: x.question_number)
        return performances

    @classmethod
    def _calculate_topic_performance(
        cls,
        marks: List[ImpactMarkEntry],
        question_map: Dict[str, ImpactAssessmentQuestion],
        topic_map: Dict[str, ImpactTopic],
    ) -> List[TopicPerformance]:
        """
        Calculate performance for each topic.

        Rules:
        - topic percentage = sum scores for questions in topic / sum max marks for those questions
        - critical weak topic if topic percentage < 40
        - weak topic if topic percentage >= 40 and < 55
        """
        # Group questions by topic
        questions_by_topic: Dict[str, List[ImpactAssessmentQuestion]] = {}
        for question in question_map.values():
            topic_id = question.topic_id
            if topic_id and topic_id is not None:
                if topic_id not in questions_by_topic:
                    questions_by_topic[topic_id] = []
                questions_by_topic[topic_id].append(question)

        # Group marks by question
        marks_by_question: Dict[str, List[ImpactMarkEntry]] = {}
        for mark in marks:
            question_id = mark.question_id
            if question_id not in marks_by_question:
                marks_by_question[question_id] = []
            marks_by_question[question_id].append(mark)

        # Calculate performance for each topic
        performances = []
        for topic_id, questions in questions_by_topic.items():
            topic = topic_map.get(topic_id)
            if not topic:
                continue

            # Aggregate scores for all questions in this topic
            total_score = 0.0
            total_max_marks = 0.0
            num_learners = 0

            for question in questions:
                question_marks = marks_by_question.get(question.id, [])
                total_score += sum(m.score for m in question_marks)
                total_max_marks += question.max_marks * len(question_marks)
                num_learners = max(num_learners, len(question_marks))

            # Calculate percentage
            percentage = (total_score / total_max_marks * 100) if total_max_marks > 0 else 0.0

            # Determine weakness level
            is_critical = percentage < cls.CRITICAL_TOPIC_THRESHOLD
            is_weak = cls.CRITICAL_TOPIC_THRESHOLD <= percentage < cls.WEAK_TOPIC_THRESHOLD

            performances.append(
                TopicPerformance(
                    topic_id=topic_id,
                    topic_name=topic.name,
                    total_score=total_score,
                    total_max_marks=total_max_marks,
                    percentage=round(percentage, 2),
                    num_questions=len(questions),
                    num_learners=num_learners,
                    is_weak=is_weak,
                    is_critical=is_critical,
                )
            )

        # Sort by percentage (worst first)
        performances.sort(key=lambda x: x.percentage)
        return performances

    @classmethod
    def _generate_interventions(
        cls,
        weak_topics: List[TopicPerformance],
        at_risk_learners: List[LearnerPerformance],
        total_marks: float,
    ) -> List[InterventionRecommendation]:
        """
        Generate intervention recommendations.

        Rules:
        - Critical topic: "Re-teach {topic} before moving forward. Run a short follow-up check within 7 days."
        - Weak topic: "Revise {topic} with targeted practice and monitor next assessment."
        - Stable: "No urgent intervention needed."
        """
        interventions = []

        # Topic-based interventions
        for topic in weak_topics:
            if topic.is_critical:
                intervention_type = "critical"
                severity = "critical"
                recommendation = (
                    f"Re-teach {topic.topic_name} before moving forward. "
                    f"Run a short follow-up check within 7 days."
                )
            else:  # is_weak
                intervention_type = "weak"
                severity = "high"
                recommendation = (
                    f"Revise {topic.topic_name} with targeted practice "
                    f"and monitor next assessment."
                )

            interventions.append(
                InterventionRecommendation(
                    intervention_type=intervention_type,
                    entity_type="topic",
                    entity_id=topic.topic_id,
                    entity_name=topic.topic_name,
                    severity=severity,
                    recommendation=recommendation,
                    percentage=topic.percentage,
                )
            )

        # Learner-based interventions
        for learner in at_risk_learners:
            if learner.risk_level == "high":
                intervention_type = "critical"
                severity = "critical"
                name = learner.display_name or learner.learner_code
                recommendation = (
                    f"Learner {name} is at high risk ({learner.percentage:.1f}%). "
                    f"Immediate intervention required. Consider one-on-one tutoring."
                )
            else:  # medium risk
                intervention_type = "weak"
                severity = "high"
                name = learner.display_name or learner.learner_code
                recommendation = (
                    f"Learner {name} is at medium risk ({learner.percentage:.1f}%). "
                    f"Monitor progress and provide additional support."
                )

            interventions.append(
                InterventionRecommendation(
                    intervention_type=intervention_type,
                    entity_type="learner",
                    entity_id=learner.learner_id,
                    entity_name=name,
                    severity=severity,
                    recommendation=recommendation,
                    percentage=learner.percentage,
                )
            )

        # Sort: critical first, then by severity
        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        interventions.sort(key=lambda x: severity_order.get(x.severity, 4))

        return interventions

    @classmethod
    def calculate_learner_total(
        cls,
        marks: List[ImpactMarkEntry],
    ) -> float:
        """Calculate total score for a learner from their marks."""
        return sum(m.score for m in marks)

    @classmethod
    def calculate_learner_percentage(
        cls,
        learner_total: float,
        total_marks: float,
    ) -> float:
        """Calculate percentage score for a learner."""
        if total_marks <= 0:
            return 0.0
        return (learner_total / total_marks) * 100

    @classmethod
    def check_learner_pass(
        cls,
        learner_total: float,
        pass_mark: Optional[float],
        total_marks: float,
    ) -> bool:
        """Check if a learner passed based on their total score."""
        if pass_mark is not None:
            return learner_total >= pass_mark
        # Default: pass if >= 50%
        return (learner_total / total_marks * 100) >= 50.0 if total_marks > 0 else False

    @classmethod
    def calculate_topic_percentage(
        cls,
        topic_scores: List[Tuple[float, float]],  # List of (score, max_marks)
    ) -> float:
        """
        Calculate percentage for a topic.

        Args:
            topic_scores: List of (score, max_marks) tuples for each question in topic

        Returns:
            Percentage score (0-100)
        """
        if not topic_scores:
            return 0.0

        total_score = sum(score for score, _ in topic_scores)
        total_max = sum(max_marks for _, max_marks in topic_scores)

        if total_max <= 0:
            return 0.0

        return (total_score / total_max) * 100

    @classmethod
    def classify_topic(cls, topic_percentage: float) -> Tuple[bool, bool]:
        """
        Classify a topic's performance level.

        Returns:
            Tuple of (is_weak, is_critical)
        """
        is_critical = topic_percentage < cls.CRITICAL_TOPIC_THRESHOLD
        is_weak = cls.CRITICAL_TOPIC_THRESHOLD <= topic_percentage < cls.WEAK_TOPIC_THRESHOLD
        return is_weak, is_critical

    @classmethod
    def classify_learner_risk(
        cls,
        percentage: float,
        total_score: float,
        pass_mark: Optional[float],
    ) -> str:
        """
        Classify a learner's risk level.

        Returns:
            Risk level: "low", "medium", or "high"
        """
        if percentage < cls.HIGH_RISK_THRESHOLD:
            return "high"
        elif pass_mark is not None and total_score < pass_mark:
            return "medium"
        else:
            return "low"
