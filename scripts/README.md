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
