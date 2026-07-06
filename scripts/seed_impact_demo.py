#!/usr/bin/env python3
"""
Impact Intelligence Demo Seed Script

Creates realistic sample data for demonstrating the Impact Intelligence module.
Run this script to populate the database with demo data.

Usage:
    python scripts/seed_impact_demo.py

Requirements:
    - SurrealDB must be running
    - Environment variables must be set (SURREAL_URL, etc.)
"""

import asyncio
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path

# Add the project root to the path
sys.path.insert(0, str(Path(__file__).parent.parent))

from vault_core.database.repository import repo_query, db_connection
from vault_core.domain.impact import (
    ImpactSchool,
    ImpactClassGroup,
    ImpactLearner,
    ImpactSubject,
    ImpactTopic,
    ImpactAssessment,
    ImpactAssessmentQuestion,
    ImpactMarkEntry,
    ImpactIntervention,
)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCHOOL_CONFIG = {
    "name": "Pilot School",
    "district": "Harare South",
    "province": "Harare",
    "school_type": "secondary",
}

CLASS_CONFIG = {
    "name": "Form 1A",
    "grade_level": "1",
    "academic_year": "2026",
    "teacher_name": "Mrs. Chidyausiku",
}

SUBJECT_CONFIG = {
    "name": "Mathematics",
    "level": "O-Level",
    "curriculum": "ZIMSEC",
}

TOPICS_CONFIG = [
    {"name": "Fractions", "strand": "Number", "syllabus_code": "MATH-001"},
    {"name": "Ratios", "strand": "Number", "syllabus_code": "MATH-002"},
    {"name": "Percentages", "strand": "Number", "syllabus_code": "MATH-003"},
    {"name": "Graphs", "strand": "Geometry", "syllabus_code": "MATH-004"},
    {"name": "Word Problems", "strand": "Applied", "syllabus_code": "MATH-005"},
]

ASSESSMENT_CONFIG = {
    "title": "Term 1 Diagnostic Test",
    "assessment_type": "test",
    "term": "Term 1",
    "total_marks": 100,
    "pass_mark": 50,
    "status": "graded",
}

QUESTIONS_CONFIG = [
    {"question_number": 1, "label": "Q1", "max_marks": 10, "topic_index": 0, "skill_type": "knowledge", "difficulty": "easy"},
    {"question_number": 2, "label": "Q2", "max_marks": 10, "topic_index": 0, "skill_type": "comprehension", "difficulty": "medium"},
    {"question_number": 3, "label": "Q3", "max_marks": 10, "topic_index": 1, "skill_type": "knowledge", "difficulty": "easy"},
    {"question_number": 4, "label": "Q4", "max_marks": 10, "topic_index": 1, "skill_type": "application", "difficulty": "medium"},
    {"question_number": 5, "label": "Q5", "max_marks": 15, "topic_index": 2, "skill_type": "knowledge", "difficulty": "easy"},
    {"question_number": 6, "label": "Q6", "max_marks": 15, "topic_index": 2, "skill_type": "application", "difficulty": "hard"},
    {"question_number": 7, "label": "Q7", "max_marks": 15, "topic_index": 3, "skill_type": "application", "difficulty": "hard"},
    {"question_number": 8, "label": "Q8", "max_marks": 15, "topic_index": 4, "skill_type": "analysis", "difficulty": "hard"},
]

NUM_LEARNERS = 30


# ---------------------------------------------------------------------------
# Mark Generation Strategy
# ---------------------------------------------------------------------------

def generate_learner_marks(learner_index: int, questions: list) -> dict:
    """
    Generate realistic marks for a learner based on their performance level.

    Strategy:
    - Top 30% (learners 0-8): Good performers (60-90%)
    - Middle 40% (learners 9-20): Average performers (40-70%)
    - Bottom 30% (learners 21-29): Struggling learners (20-50%)
    """
    marks = {}
    
    # Determine performance level
    if learner_index < 9:  # Top 30%
        base_performance = random.uniform(0.60, 0.90)
        consistency = 0.8  # More consistent
    elif learner_index < 21:  # Middle 40%
        base_performance = random.uniform(0.40, 0.70)
        consistency = 0.6  # Some variation
    else:  # Bottom 30%
        base_performance = random.uniform(0.20, 0.50)
        consistency = 0.4  # More variation
    
    for question in questions:
        q_id = question["id"]
        max_marks = question["max_marks"]
        
        # Add some variation per question
        performance = base_performance * random.uniform(consistency, 1.1)
        
        # Cap at 1.0
        performance = min(performance, 1.0)
        
        # Calculate score
        score = round(max_marks * performance, 1)
        
        # Ensure score is within bounds
        score = max(0, min(score, max_marks))
        
        marks[q_id] = score
    
    return marks


# ---------------------------------------------------------------------------
# Seed Functions
# ---------------------------------------------------------------------------

async def seed_school() -> ImpactSchool:
    """Create the pilot school."""
    print("📚 Creating school: Pilot School...")
    school = ImpactSchool(
        name=SCHOOL_CONFIG["name"],
        district=SCHOOL_CONFIG["district"],
        province=SCHOOL_CONFIG["province"],
        school_type=SCHOOL_CONFIG["school_type"],
    )
    await school.save()
    print(f"   ✅ Created school: {school.id}")
    return school


async def seed_class(school_id: str) -> ImpactClassGroup:
    """Create the pilot class."""
    print("🏫 Creating class: Form 1A...")
    class_group = ImpactClassGroup(
        school_id=school_id,
        name=CLASS_CONFIG["name"],
        grade_level=CLASS_CONFIG["grade_level"],
        academic_year=CLASS_CONFIG["academic_year"],
        teacher_name=CLASS_CONFIG["teacher_name"],
    )
    await class_group.save()
    print(f"   ✅ Created class: {class_group.id}")
    return class_group


async def seed_subject() -> ImpactSubject:
    """Create the Mathematics subject."""
    print("📖 Creating subject: Mathematics...")
    subject = ImpactSubject(
        name=SUBJECT_CONFIG["name"],
        level=SUBJECT_CONFIG["level"],
        curriculum=SUBJECT_CONFIG["curriculum"],
    )
    await subject.save()
    print(f"   ✅ Created subject: {subject.id}")
    return subject


async def seed_topics(subject_id: str) -> list:
    """Create topics for the subject."""
    print("📋 Creating topics...")
    topics = []
    for topic_config in TOPICS_CONFIG:
        topic = ImpactTopic(
            subject_id=subject_id,
            name=topic_config["name"],
            strand=topic_config["strand"],
            syllabus_code=topic_config["syllabus_code"],
        )
        await topic.save()
        topics.append(topic)
        print(f"   ✅ Created topic: {topic.name}")
    return topics


async def seed_learners(school_id: str, class_group_id: str) -> list:
    """Create 30 learners."""
    print("👥 Creating 30 learners...")
    learners = []
    for i in range(1, NUM_LEARNERS + 1):
        learner_code = f"L{i:03d}"
        learner = ImpactLearner(
            school_id=school_id,
            class_group_id=class_group_id,
            learner_code=learner_code,
            display_name=f"Learner {learner_code}",
            status="active",
        )
        await learner.save()
        learners.append(learner)
    print(f"   ✅ Created {len(learners)} learners")
    return learners


async def seed_assessment(school_id: str, class_group_id: str, subject_id: str) -> ImpactAssessment:
    """Create the assessment."""
    print("📝 Creating assessment: Term 1 Diagnostic Test...")
    assessment = ImpactAssessment(
        school_id=school_id,
        class_group_id=class_group_id,
        subject_id=subject_id,
        title=ASSESSMENT_CONFIG["title"],
        assessment_type=ASSESSMENT_CONFIG["assessment_type"],
        term=ASSESSMENT_CONFIG["term"],
        total_marks=ASSESSMENT_CONFIG["total_marks"],
        pass_mark=ASSESSMENT_CONFIG["pass_mark"],
        status=ASSESSMENT_CONFIG["status"],
    )
    await assessment.save()
    print(f"   ✅ Created assessment: {assessment.id}")
    return assessment


async def seed_questions(assessment_id: str, topics: list) -> list:
    """Create questions mapped to topics."""
    print("❓ Creating 8 questions...")
    questions = []
    for q_config in QUESTIONS_CONFIG:
        topic = topics[q_config["topic_index"]]
        question = ImpactAssessmentQuestion(
            assessment_id=assessment_id,
            question_number=q_config["question_number"],
            label=q_config["label"],
            max_marks=q_config["max_marks"],
            topic_id=topic.id,
            skill_type=q_config["skill_type"],
            difficulty=q_config["difficulty"],
        )
        await question.save()
        questions.append({
            "id": question.id,
            "max_marks": q_config["max_marks"],
            "topic_id": topic.id,
        })
        print(f"   ✅ Created question {q_config['question_number']}: {q_config['max_marks']} marks")
    return questions


async def seed_marks(assessment_id: str, learners: list, questions: list) -> int:
    """Generate and save marks for all learners."""
    print("📊 Generating marks for 30 learners...")
    total_marks = 0
    
    for i, learner in enumerate(learners):
        marks = generate_learner_marks(i, questions)
        
        for question in questions:
            q_id = question["id"]
            score = marks[q_id]
            
            mark_entry = ImpactMarkEntry(
                assessment_id=assessment_id,
                question_id=q_id,
                learner_id=learner.id,
                score=score,
                max_score=question["max_marks"],
            )
            await mark_entry.save()
            total_marks += 1
    
    print(f"   ✅ Created {total_marks} mark entries")
    return total_marks


async def main():
    """Main seed function."""
    print("=" * 60)
    print("🌱 Impact Intelligence Demo Seed Script")
    print("=" * 60)
    print()
    
    try:
        # Seed data
        school = await seed_school()
        if not school.id:
            raise ValueError("Failed to create school")
        
        class_group = await seed_class(school.id)
        if not class_group.id:
            raise ValueError("Failed to create class group")
        
        subject = await seed_subject()
        if not subject.id:
            raise ValueError("Failed to create subject")
        
        topics = await seed_topics(subject.id)
        learners = await seed_learners(school.id, class_group.id)
        
        assessment = await seed_assessment(school.id, class_group.id, subject.id)
        if not assessment.id:
            raise ValueError("Failed to create assessment")
        
        questions = await seed_questions(assessment.id, topics)
        total_marks = await seed_marks(assessment.id, learners, questions)
        
        print()
        print("=" * 60)
        print("✅ Seed completed successfully!")
        print("=" * 60)
        print()
        print("📊 Summary:")
        print(f"   - School: {school.name}")
        print(f"   - Class: {class_group.name}")
        print(f"   - Subject: {subject.name}")
        print(f"   - Topics: {len(topics)}")
        print(f"   - Learners: {len(learners)}")
        print(f"   - Assessment: {assessment.title}")
        print(f"   - Questions: {len(questions)}")
        print(f"   - Mark entries: {total_marks}")
        print()
        print("🎯 Expected Results:")
        print("   - Overall pass rate: ~35-50%")
        print("   - Weak topics: Fractions, Ratios, Word Problems")
        print("   - At-risk learners: ~10-15")
        print("   - Critical interventions: 1-2")
        print()
        print("🚀 Next Steps:")
        print("   1. Start the API server: python run_api.py")
        print("   2. Navigate to http://localhost:3000/impact")
        print("   3. View school dashboard: http://localhost:3000/impact/school-dashboard?school={school.id}")
        print("   4. View ministry demo: http://localhost:3000/impact/ministry-demo")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
