"""
Impact Intelligence AI Summary Service — generates human-readable summaries
using deterministic analytics as input.

Uses the existing Vault AI infrastructure (provision_langchain_model) to
generate teacher summaries, intervention plans, and remedial lesson outlines.

Rules:
- AI must not change numeric results.
- AI can explain and recommend only.
- Always show deterministic numbers as source of truth.
- If AI fails, analytics dashboard still works.
"""

from dataclasses import dataclass
from typing import Optional

from langchain_core.messages import HumanMessage, SystemMessage
from loguru import logger

from vault_core.ai.provision import provision_langchain_model
from vault_core.analytics.impact import AssessmentAnalytics
from vault_core.utils.error_classifier import classify_error


# ---------------------------------------------------------------------------
# Output data classes
# ---------------------------------------------------------------------------


@dataclass
class TeacherSummary:
    """AI-generated summary for a teacher."""

    summary: str
    revision_sequence: str
    source: str = "ai-generated"


@dataclass
class InterventionPlan:
    """AI-generated intervention plan."""

    plan: str
    source: str = "ai-generated"


@dataclass
class RemedialLesson:
    """AI-generated remedial lesson outline."""

    outline: str
    mini_test_idea: str
    source: str = "ai-generated"


# ---------------------------------------------------------------------------
# Prompt templates
# ---------------------------------------------------------------------------

TEACHER_SUMMARY_SYSTEM = """You are an experienced education analyst helping teachers understand assessment results.

Your role is to explain the deterministic analytics data in plain, supportive language.
You must NOT invent or change any numbers — only interpret and explain them.

Guidelines:
- Use school-friendly language (not technical/AI terms)
- Be supportive and constructive, never punitive
- Reference specific numbers from the analytics
- Focus on actionable insights
- Keep the summary concise (2-3 paragraphs)
- Always present the deterministic numbers as the source of truth"""

TEACHER_SUMMARY_HUMAN = """Here are the assessment analytics for {assessment_title}:

ASSESSMENT DETAILS:
- Title: {assessment_title}
- Type: {assessment_type}
- Total Marks: {total_marks}
- Pass Mark: {pass_mark}
- Term: {term}

SUMMARY STATISTICS:
- Class Average: {class_average}%
- Pass Rate: {pass_rate}%
- Failure Rate: {failure_rate}%
- Learners Assessed: {learners_assessed} / {total_learners}

WEAK TOPICS (topics needing revision):
{weak_topics_text}

AT-RISK LEARNERS:
{at_risk_text}

Please provide:
1. A brief summary of overall class performance
2. Key areas of concern (weak topics)
3. Suggested revision sequence (which topics to address first, based on severity)
4. One encouraging observation

Keep the tone supportive and focused on improvement."""

INTERVENTION_PLAN_SYSTEM = """You are an education specialist creating intervention plans for teachers.

Your role is to create a structured intervention plan based on assessment analytics.
You must NOT invent or change any numbers — only use them as context for recommendations.

Guidelines:
- Create practical, actionable steps
- Prioritize by severity (critical topics first)
- Include specific activities and timeframes
- Be supportive and constructive
- Reference the actual data points
- Keep the plan concise and actionable"""

INTERVENTION_PLAN_HUMAN = """Here are the assessment analytics for {assessment_title}:

WEAK TOPICS:
{weak_topics_text}

AT-RISK LEARNERS:
{at_risk_text}

EXISTING INTERVENTIONS:
{interventions_text}

Please create a structured intervention plan with:
1. Priority actions (what to do first)
2. Specific activities for each weak topic
3. Support strategies for at-risk learners
4. Timeline and follow-up steps
5. Success indicators to monitor progress

Keep the plan practical and achievable."""

REMEDIAL_LESSON_SYSTEM = """You are an experienced teacher creating remedial lesson outlines.

Your role is to create a short remedial lesson plan based on assessment weaknesses.
You must NOT invent or change any numbers — only use them to guide content selection.

Guidelines:
- Create a focused lesson outline (30-45 minutes)
- Address the weakest topics first
- Include hands-on activities
- Provide a follow-up mini-test idea
- Be practical and classroom-ready
- Reference the specific topics and their performance levels"""

REMEDIAL_LESSON_HUMAN = """Here are the assessment analytics for {assessment_title}:

SUBJECT: {subject_name}
CLASS: {class_name}

WEAK TOPICS:
{weak_topics_text}

TOPIC PERFORMANCE DETAILS:
{topic_performance_text}

Please create:
1. A 30-45 minute remedial lesson outline targeting the weakest topics
2. Learning objectives for the lesson
3. Key activities (2-3 activities)
4. A follow-up mini-test idea (5-10 questions) to check understanding
5. Materials needed

Make it practical and ready to use in class."""


# ---------------------------------------------------------------------------
# AI Summary Service
# ---------------------------------------------------------------------------


class ImpactAISummaryService:
    """
    Service for generating AI-powered summaries of assessment analytics.

    Uses the existing Vault AI infrastructure to generate human-readable
    summaries while ensuring deterministic numbers remain the source of truth.
    """

    @staticmethod
    def _format_weak_topics(analytics: AssessmentAnalytics) -> str:
        """Format weak topics for prompt."""
        if not analytics.weak_topics:
            return "No weak topics identified."

        lines = []
        for topic in analytics.weak_topics:
            severity = "CRITICAL" if topic.is_critical else "Weak"
            lines.append(
                f"- {topic.topic_name}: {topic.percentage}% ({severity}) "
                f"[{topic.num_questions} questions]"
            )
        return "\n".join(lines)

    @staticmethod
    def _format_at_risk_learners(analytics: AssessmentAnalytics) -> str:
        """Format at-risk learners for prompt."""
        if not analytics.at_risk_learners:
            return "No at-risk learners identified."

        lines = []
        for learner in analytics.at_risk_learners:
            name = learner.display_name or learner.learner_code
            lines.append(
                f"- {name}: {learner.percentage}% "
                f"({learner.total_score}/{learner.total_max_marks}) "
                f"[{learner.risk_level} risk]"
            )
        return "\n".join(lines)

    @staticmethod
    def _format_interventions(analytics: AssessmentAnalytics) -> str:
        """Format existing interventions for prompt."""
        if not analytics.interventions:
            return "No interventions generated."

        lines = []
        for intervention in analytics.interventions:
            lines.append(
                f"- [{intervention.severity.upper()}] {intervention.entity_name}: "
                f"{intervention.recommendation}"
            )
        return "\n".join(lines)

    @staticmethod
    def _format_topic_performance(analytics: AssessmentAnalytics) -> str:
        """Format topic performance for prompt."""
        if not analytics.topic_performance:
            return "No topic performance data."

        lines = []
        for topic in analytics.topic_performance:
            status = "CRITICAL" if topic.is_critical else "Weak" if topic.is_weak else "OK"
            lines.append(
                f"- {topic.topic_name}: {topic.percentage}% ({status}) "
                f"[{topic.num_questions} questions, {topic.num_learners} learners]"
            )
        return "\n".join(lines)

    @classmethod
    async def generate_teacher_summary(
        cls,
        analytics: AssessmentAnalytics,
        model_id: Optional[str] = None,
    ) -> TeacherSummary:
        """
        Generate a teacher-friendly summary of assessment analytics.

        Args:
            analytics: Deterministic analytics data
            model_id: Optional specific model ID to use

        Returns:
            TeacherSummary with AI-generated narrative

        Raises:
            ConfigurationError: If no AI model is available
        """
        try:
            # Build prompt
            weak_topics_text = cls._format_weak_topics(analytics)
            at_risk_text = cls._format_at_risk_learners(analytics)

            human_content = TEACHER_SUMMARY_HUMAN.format(
                assessment_title=analytics.assessment_title,
                assessment_type=analytics.assessment_type,
                total_marks=analytics.total_marks,
                pass_mark=analytics.pass_mark or "Not set",
                term=analytics.term or "Not set",
                class_average=analytics.class_average_percentage,
                pass_rate=analytics.pass_rate,
                failure_rate=analytics.failure_rate,
                learners_assessed=analytics.learners_assessed,
                total_learners=analytics.total_learners,
                weak_topics_text=weak_topics_text,
                at_risk_text=at_risk_text,
            )

            # Provision model
            model = await provision_langchain_model(
                human_content,
                model_id,
                "chat",
                max_tokens=2048,
            )

            # Generate response
            messages = [
                SystemMessage(content=TEACHER_SUMMARY_SYSTEM),
                HumanMessage(content=human_content),
            ]
            response = await model.ainvoke(messages)
            summary_text = response.content

            # Generate revision sequence separately
            revision_prompt = f"""Based on these weak topics, suggest a revision sequence:

{weak_topics_text}

List the topics in order of priority (most critical first) with a brief reason for each."""

            revision_messages = [
                SystemMessage(content="You are an education specialist. Provide a concise revision sequence."),
                HumanMessage(content=revision_prompt),
            ]
            revision_response = await model.ainvoke(revision_messages)
            revision_text = revision_response.content

            return TeacherSummary(
                summary=summary_text,
                revision_sequence=revision_text,
            )

        except Exception as e:
            logger.error(f"Failed to generate teacher summary: {e}")
            error_class, user_message = classify_error(e)
            raise error_class(f"Could not generate AI summary: {user_message}") from e

    @classmethod
    async def generate_intervention_plan(
        cls,
        analytics: AssessmentAnalytics,
        model_id: Optional[str] = None,
    ) -> InterventionPlan:
        """
        Generate a structured intervention plan.

        Args:
            analytics: Deterministic analytics data
            model_id: Optional specific model ID to use

        Returns:
            InterventionPlan with AI-generated plan

        Raises:
            ConfigurationError: If no AI model is available
        """
        try:
            # Build prompt
            weak_topics_text = cls._format_weak_topics(analytics)
            at_risk_text = cls._format_at_risk_learners(analytics)
            interventions_text = cls._format_interventions(analytics)

            human_content = INTERVENTION_PLAN_HUMAN.format(
                assessment_title=analytics.assessment_title,
                weak_topics_text=weak_topics_text,
                at_risk_text=at_risk_text,
                interventions_text=interventions_text,
            )

            # Provision model
            model = await provision_langchain_model(
                human_content,
                model_id,
                "chat",
                max_tokens=2048,
            )

            # Generate response
            messages = [
                SystemMessage(content=INTERVENTION_PLAN_SYSTEM),
                HumanMessage(content=human_content),
            ]
            response = await model.ainvoke(messages)
            plan_text = response.content

            return InterventionPlan(plan=plan_text)

        except Exception as e:
            logger.error(f"Failed to generate intervention plan: {e}")
            error_class, user_message = classify_error(e)
            raise error_class(f"Could not generate AI intervention plan: {user_message}") from e

    @classmethod
    async def generate_remedial_lesson(
        cls,
        analytics: AssessmentAnalytics,
        subject_name: str = "Subject",
        class_name: str = "Class",
        model_id: Optional[str] = None,
    ) -> RemedialLesson:
        """
        Generate a remedial lesson outline.

        Args:
            analytics: Deterministic analytics data
            subject_name: Name of the subject
            class_name: Name of the class
            model_id: Optional specific model ID to use

        Returns:
            RemedialLesson with AI-generated outline

        Raises:
            ConfigurationError: If no AI model is available
        """
        try:
            # Build prompt
            weak_topics_text = cls._format_weak_topics(analytics)
            topic_performance_text = cls._format_topic_performance(analytics)

            human_content = REMEDIAL_LESSON_HUMAN.format(
                assessment_title=analytics.assessment_title,
                subject_name=subject_name,
                class_name=class_name,
                weak_topics_text=weak_topics_text,
                topic_performance_text=topic_performance_text,
            )

            # Provision model
            model = await provision_langchain_model(
                human_content,
                model_id,
                "chat",
                max_tokens=2048,
            )

            # Generate response
            messages = [
                SystemMessage(content=REMEDIAL_LESSON_SYSTEM),
                HumanMessage(content=human_content),
            ]
            response = await model.ainvoke(messages)
            outline_text = response.content

            # Generate mini-test idea
            mini_test_prompt = f"""Create a 5-10 question mini-test to check understanding of these weak topics:

{weak_topics_text}

Include a mix of question types (multiple choice, short answer, problem-solving)."""

            mini_test_messages = [
                SystemMessage(content="You are an experienced teacher creating assessment questions."),
                HumanMessage(content=mini_test_prompt),
            ]
            mini_test_response = await model.ainvoke(mini_test_messages)
            mini_test_text = mini_test_response.content

            return RemedialLesson(
                outline=outline_text,
                mini_test_idea=mini_test_text,
            )

        except Exception as e:
            logger.error(f"Failed to generate remedial lesson: {e}")
            error_class, user_message = classify_error(e)
            raise error_class(f"Could not generate AI remedial lesson: {user_message}") from e
