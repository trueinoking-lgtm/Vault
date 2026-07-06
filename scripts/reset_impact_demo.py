#!/usr/bin/env python3
"""
Impact Intelligence Demo Reset Script

Removes all Impact Intelligence demo data from the database.
Use this to reset the demo state before re-seeding.

Usage:
    python scripts/reset_impact_demo.py

Requirements:
    - SurrealDB must be running
    - Environment variables must be set (SURREAL_URL, etc.)
"""

import asyncio
import sys
from pathlib import Path

# Add the project root to the path
sys.path.insert(0, str(Path(__file__).parent.parent))

from vault_core.database.repository import repo_query


# ---------------------------------------------------------------------------
# Reset Functions
# ---------------------------------------------------------------------------

async def reset_demo_data():
    """Remove all Impact Intelligence demo data."""
    print("=" * 60)
    print("🗑️  Impact Intelligence Demo Reset Script")
    print("=" * 60)
    print()
    
    try:
        # Remove data in reverse dependency order
        tables = [
            "impact_intervention",
            "impact_mark_entry",
            "impact_assessment_question",
            "impact_assessment",
            "impact_topic",
            "impact_learner",
            "impact_class_group",
            "impact_subject",
            "impact_school",
        ]
        
        for table in tables:
            print(f"🗑️  Removing {table}...")
            await repo_query(f"REMOVE TABLE IF EXISTS {table}")
            print(f"   ✅ Removed {table}")
        
        print()
        print("=" * 60)
        print("✅ Reset completed successfully!")
        print("=" * 60)
        print()
        print("🚀 Next Steps:")
        print("   1. Run seed script: python scripts/seed_impact_demo.py")
        print("   2. Navigate to http://localhost:3000/impact")
        print()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(reset_demo_data())
