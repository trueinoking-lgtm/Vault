# Scripts Documentation

## backup_vault_surrealdb.sh

Performs a hot export of SurrealDB via the HTTP endpoint. Creates a timestamped `.surql` file in the `backups/` directory.

### What It Does

- Reads `SURREAL_USER`, `SURREAL_PASSWORD`, `SURREAL_NAMESPACE`, `SURREAL_DATABASE` from `.env`
- Runs `surreal export --endpoint http://localhost:8000 ...`
- Saves output to `backups/surreal_export_YYYYMMDD_HHMMSS.surql`
- Reports the export file path and size
- Exits non-zero if anything fails

### Usage

```bash
# Basic usage:
bash scripts/backup_vault_surrealdb.sh

# With custom backup directory:
BACKUP_DIR=/path/to/backups bash scripts/backup_vault_surrealdb.sh

# With custom env file:
bash scripts/backup_vault_surrealdb.sh /path/to/.env
```

### Safety

- Does **not** stop any services (hot export, zero downtime)
- Does **not** delete old backups
- Fails safely if SurrealDB is unreachable
- Requires no interactive input (suitable for cron)

---

## restore_vault_surrealdb.sh

Restores a SurrealDB database from a `.surql` export file.

### What It Does

1. Validates the backup file exists and has content
2. Reads credentials from `.env` file (never from command line)
3. Displays a warning about the destructive nature of the operation
4. Confirms with the user (unless `--yes` is passed)
5. Stops the Vault backend (graceful kill with timeout)
6. Runs `surreal import --endpoint http://localhost:8000 ...`
7. Restarts the Vault backend
8. Verifies the restore via health check
9. Reports completion

### Usage

```bash
# Interactive (requires typing 'RESTORE' to confirm):
bash scripts/restore_vault_surrealdb.sh backups/surreal_export_20260705_120000.surql

# Auto-confirm (for scripted use):
bash scripts/restore_vault_surrealdb.sh backups/surreal_export_20260705_120000.surql --yes

# With custom env file:
bash scripts/restore_vault_surrealdb.sh backups/surreal_export_20260705_120000.surql --env /path/to/.env

# Show help:
bash scripts/restore_vault_surrealdb.sh --help
```

### Safety Guards

1. **Requires explicit backup file path** — no default file
2. **Validates file exists and is non-empty**
3. **Warns loudly** before destructive operation
4. **Requires interactive confirmation** — user must type `RESTORE` (unless `--yes`)
5. **Stops Vault backend** before import to prevent writes
6. **Restarts backend** after restore completes
7. **Exits non-zero** if any step fails
8. **No secrets on command line** — all credentials from `.env`

---

## export_docs.py

Consolidates markdown documentation files for use with ChatGPT or other platforms with file upload limits.

### What It Does

- Scans all subdirectories in the `docs/` folder
- For each subdirectory, combines all `.md` files (excluding `index.md` files)
- Creates one consolidated markdown file per subdirectory
- Saves all exported files to `doc_exports/` in the project root

### Usage

```bash
# Using Makefile (recommended)
make export-docs

# Or run directly with uv
uv run python scripts/export_docs.py

# Or run with standard Python
python scripts/export_docs.py
```

### Output

The script creates `doc_exports/` directory with consolidated files like:

- `getting-started.md` - All getting-started documentation
- `user-guide.md` - All user guide content
- `features.md` - All feature documentation
- `development.md` - All development documentation
- etc.

Each exported file includes:
- A main header with the folder name
- Section headers for each source file
- Source file attribution
- The complete content from each markdown file
- Visual separators between sections

### Example Output Structure

```markdown
# Getting Started

This document consolidates all content from the getting-started documentation folder.

---

## Installation

*Source: installation.md*

[Full content of installation.md]

---

## Quick Start

*Source: quick-start.md*

[Full content of quick-start.md]

---
```

### Notes

- The `doc_exports/` directory is gitignored and safe to regenerate anytime
- Index files (`index.md`) are automatically excluded
- Files are sorted alphabetically for consistent output
- The script handles subdirectories only (ignores files in the root `docs/` folder)

---

## seed_impact_demo.py

Creates realistic sample data for demonstrating the Impact Intelligence module.

### What It Does

1. Creates a pilot school (Pilot School, Harare South)
2. Creates a class (Form 1A)
3. Creates Mathematics subject with 5 topics
4. Creates 30 learners (L001-L030)
5. Creates an assessment (Term 1 Diagnostic Test)
6. Creates 8 questions mapped to topics
7. Generates realistic marks with mixed performance levels

### Expected Results

- Overall pass rate: ~35-50%
- Weak topics: Fractions, Ratios, Word Problems
- At-risk learners: ~10-15
- Critical interventions: 1-2

### Usage

```bash
# Basic usage:
python scripts/seed_impact_demo.py

# Or with uv:
uv run python scripts/seed_impact_demo.py
```

### Requirements

- SurrealDB must be running
- Environment variables must be set (SURREAL_URL, etc.)

### Demo Data Structure

```
Pilot School (Harare South, Harare)
└── Form 1A (Grade 1, 2026)
    ├── 30 Learners (L001-L030)
    └── Term 1 Diagnostic Test (100 marks, pass mark: 50)
        ├── Q1: Fractions (10 marks, knowledge, easy)
        ├── Q2: Fractions (10 marks, comprehension, medium)
        ├── Q3: Ratios (10 marks, knowledge, easy)
        ├── Q4: Ratios (10 marks, application, medium)
        ├── Q5: Percentages (15 marks, knowledge, easy)
        ├── Q6: Percentages (15 marks, application, hard)
        ├── Q7: Graphs (15 marks, application, hard)
        └── Q8: Word Problems (15 marks, analysis, hard)
```

### Learner Performance Levels

- **Top 30%** (L001-L009): Good performers (60-90%)
- **Middle 40%** (L010-L021): Average performers (40-70%)
- **Bottom 30%** (L022-L030): Struggling learners (20-50%)

---

## reset_impact_demo.py

Removes all Impact Intelligence demo data from the database.

### What It Does

1. Removes all impact_intervention records
2. Removes all impact_mark_entry records
3. Removes all impact_assessment_question records
4. Removes all impact_assessment records
5. Removes all impact_topic records
6. Removes all impact_learner records
7. Removes all impact_class_group records
8. Removes all impact_subject records
9. Removes all impact_school records

### Usage

```bash
# Basic usage:
python scripts/reset_impact_demo.py

# Or with uv:
uv run python scripts/reset_impact_demo.py
```

### Requirements

- SurrealDB must be running
- Environment variables must be set (SURREAL_URL, etc.)

### Typical Workflow

```bash
# 1. Reset demo data
python scripts/reset_impact_demo.py

# 2. Seed fresh demo data
python scripts/seed_impact_demo.py

# 3. Navigate to Impact Intelligence
# http://localhost:3000/impact
```
