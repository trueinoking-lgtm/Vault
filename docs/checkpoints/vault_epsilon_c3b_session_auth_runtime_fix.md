# Epsilon C3b — Session Auth Runtime Fix

## Root Cause

`POST /api/auth/login` failed with a 500 error when writing the `auth_session` record:

```
Found 'user:xxcl16qnvsr4qc14g5r7' for field `user_id`, with record
`auth_session:fp7p2ya3x49hg8uuhsgq`, but expected a record<user>
```

**The chain:**

1. `create_session_for_user()` in `api/auth.py` called `AuthSession(user_id=str(user.id), ...)` passing `user_id` as a **plain string** like `"user:xxcl16qnvsr4qc14g5r7"`.
2. `AuthSession.save()` → `ObjectModel.save()` → `_prepare_save_data()` → `model_dump()` serialised the string as-is.
3. `repo_create()` called the SurrealDB Python driver's `connection.insert(table, data)` which received `{"user_id": "user:xxcl...", ...}`.
4. The SurrealDB driver expects **`RecordID` objects** (from `surrealdb.RecordID`) for fields typed as `record<user>` in the schema — plain strings are rejected.

**Why it only affected session auth:**

Older models (notebook, source, note) either have no `record<xxx>`-typed data fields in their `save()` path, or use raw SurrealQL queries via `repo_query()` with manually constructed `ensure_record_id()` calls. The `AuthSession` was the first model to attempt writing a `record<user>` field through the `ObjectModel.save()` → `repo_create` path.

## Fix

**File:** `vault_core/database/repository.py`

Added `ensure_record_refs()`, a new helper function that recursively walks a data dictionary and converts string values matching the SurrealDB record ID pattern (`table:id`) to `RecordID` objects — but only for keys ending in `_id` to minimise false positives.

```python
_RECORD_ID_PATTERN = re.compile(r"^[a-z][a-z_]*:[a-zA-Z0-9][a-zA-Z0-9_\-]*$")

def ensure_record_refs(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert string record references to RecordID objects for SurrealDB."""
```

Called from both `repo_create()` and `repo_insert()` **before** the data is passed to `connection.insert()`:

```python
async def repo_create(table: str, data: Dict[str, Any]) -> Dict[str, Any]:
    ...
    data = ensure_record_refs(data)   # <-- new
    async with db_connection() as connection:
        result = parse_record_ids(await connection.insert(table, data))
```

### Why a code-only fix is sufficient

The fix is at the repository layer — the single choke point for all `INSERT` operations. Any future model that writes a `record<xxx>` field through `ObjectModel.save()` will automatically get its string record references normalised to `RecordID` objects. No schema change, no migration 19 needed.

### What the regex matches

- Must start with a lowercase letter
- Followed by zero or more lowercase letters/underscores (the table name)
- A colon separator
- An alphanumeric ID (letters, digits, underscores, hyphens)
- Key must end with `_id` (e.g. `user_id`, `school_id`, `notebook_id`)

## Files Changed

| File | Change |
|------|--------|
| `vault_core/database/repository.py` | Added `import re`, `ensure_record_refs()` function, called from `repo_create()` and `repo_insert()` |
| `tests/test_repository_config.py` | Added 7 tests for `ensure_record_refs` |
| `tests/test_auth_api.py` | Added `user_id` format assertion to existing test |

## Validation

### Backend tests

```
314 passed, 2 warnings in 3.87s
```

(307 existing + 7 new `ensure_record_refs` tests)

### Frontend tests

```
57 passed
```

### Frontend build

```
Clean — /owner/schools in route manifest
```

### Scrub check

```
Only README attribution matches
```

## Runtime Smoke Results

### Session auth flow

| Step | Result |
|------|--------|
| `POST /api/auth/login` with owner password | ✅ Returns `token`, `is_owner: true`, `user.is_global_owner: true` |
| `GET /api/auth/me` with session token | ✅ Returns user with `owner_access: true` |
| `POST /api/auth/logout` with session token | ✅ Returns `{"ok": true}` |
| `GET /api/auth/me` with logged-out token | ✅ 401 `"Invalid password"` |
| `POST /api/auth/login` with wrong password | ✅ 401 |

### School API with session token

| Step | Result |
|------|--------|
| `GET /api/schools` with session token | ✅ 200, returns school list |
| `POST /api/schools` with session token | ✅ 200, creates school |

### Legacy auth compatibility

| Step | Result |
|------|--------|
| `GET /api/schools` with legacy owner password Bearer | ✅ 200 |
| No auth header | ✅ 401 |

## Migration 19

**Not needed.** The fix is entirely code-level (`ensure_record_refs` in `repo_create`/`repo_insert`). No schema change is required because the `record<user>` type on `auth_session.user_id` was already correct — the code just wasn't sending the right Python type.

## Compatibility Notes

- **Legacy password auth**: Unchanged. The `PasswordAuthMiddleware` still works.
- **Session auth**: Now works end-to-end against the running SurrealDB.
- **All existing models**: Unaffected by the normalization logic because they either don't write `record<xxx>` fields via `repo_create`, or their fields don't match the `_id`+`table:id` pattern.
- **Backward compatibility**: The fix only applies to new `INSERT` operations. Existing `auth_session` records (none existed before this fix) are not affected.
