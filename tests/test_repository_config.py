from surrealdb import RecordID

from vault_core.database.repository import (
    ensure_record_refs,
    get_database_name,
    get_database_namespace,
    get_database_password,
)


def test_database_namespace_defaults_when_unset(monkeypatch):
    monkeypatch.delenv("SURREAL_NAMESPACE", raising=False)

    assert get_database_namespace() == "vault_core"


def test_database_namespace_defaults_when_empty(monkeypatch):
    monkeypatch.setenv("SURREAL_NAMESPACE", "")

    assert get_database_namespace() == "vault_core"


def test_database_name_defaults_when_unset(monkeypatch):
    monkeypatch.delenv("SURREAL_DATABASE", raising=False)

    assert get_database_name() == "vault_core"


def test_database_name_defaults_when_empty(monkeypatch):
    monkeypatch.setenv("SURREAL_DATABASE", "")

    assert get_database_name() == "vault_core"


def test_database_password_defaults_when_empty(monkeypatch):
    monkeypatch.setenv("SURREAL_PASSWORD", "")
    monkeypatch.setenv("SURREAL_PASS", "")

    assert get_database_password() == "root"


# =========================================================================
# ensure_record_refs
# =========================================================================


def test_ensure_record_refs_converts_string_record_ids():
    """String values matching ``table:id`` pattern become RecordID objects."""
    data = {"user_id": "user:abc123", "token_hash": "abc", "expires_at": "2026-01-01"}
    result = ensure_record_refs(data)
    assert isinstance(result["user_id"], RecordID)
    assert str(result["user_id"]) == "user:abc123"


def test_ensure_record_refs_leaves_non_id_keys():
    """Strings not ending in ``_id`` are left as plain strings."""
    data = {"description": "hello world", "slug": "my-slug"}
    result = ensure_record_refs(data)
    assert isinstance(result["description"], str)
    assert isinstance(result["slug"], str)


def test_ensure_record_refs_leaves_non_record_strings():
    """Strings ending in ``_id`` that don't match the record pattern are left alone."""
    data = {"external_id": "plain-string", "some_id": "12345"}
    result = ensure_record_refs(data)
    assert isinstance(result["external_id"], str)
    assert isinstance(result["some_id"], str)


def test_ensure_record_refs_handles_nested_dicts():
    """Nested dict values are also processed."""
    data = {"auth": {"user_id": "user:abc123", "role": "owner"}}
    result = ensure_record_refs(data)
    assert isinstance(result["auth"]["user_id"], RecordID)
    assert str(result["auth"]["user_id"]) == "user:abc123"
    assert result["auth"]["role"] == "owner"


def test_ensure_record_refs_handles_none():
    """None values pass through unchanged."""
    data = {"user_id": None, "name": "test"}
    result = ensure_record_refs(data)
    assert result["user_id"] is None
    assert result["name"] == "test"


def test_ensure_record_refs_multi_char_table_name():
    """Multi-word table names like ``school_membership`` are recognised."""
    data = {"membership_id": "school_membership:xyz789"}
    result = ensure_record_refs(data)
    assert isinstance(result["membership_id"], RecordID)
    assert str(result["membership_id"]) == "school_membership:xyz789"


def test_ensure_record_refs_already_recordid():
    """Existing RecordID objects pass through unchanged."""
    from surrealdb import RecordID

    rid = RecordID.parse("user:existing")
    data = {"user_id": rid}
    result = ensure_record_refs(data)
    assert result["user_id"] is rid


def test_ensure_record_refs_various_id_fields():
    """school_id, teacher_id, classroom_id, notebook_id, etc. all convert."""
    data = {
        "school_id": "school:abc",
        "teacher_id": "school_membership:t1",
        "classroom_id": "classroom:c1",
        "notebook_id": "notebook:n1",
        "user_id": "user:u1",
    }
    result = ensure_record_refs(data)
    for key in data:
        assert isinstance(result[key], RecordID), f"{key} should be RecordID"
        assert str(result[key]) == data[key]


def test_ensure_record_refs_id_fields_with_hyphenated_ids():
    """Record IDs with hyphens in the id portion are valid."""
    data = {"user_id": "user:abc-def-123"}
    result = ensure_record_refs(data)
    assert isinstance(result["user_id"], RecordID)
    assert result["user_id"].id == "abc-def-123"


def test_ensure_record_refs_colon_string_not_id():
    """A string with a colon that does not end in ``_id`` is left alone."""
    data = {"uri": "http://example.com/path", "description": "note: important"}
    result = ensure_record_refs(data)
    assert isinstance(result["uri"], str)
    assert result["uri"] == "http://example.com/path"
    assert isinstance(result["description"], str)
    assert result["description"] == "note: important"


def test_ensure_record_refs_list_values():
    """List values are not processed (not dicts), left as-is."""
    data = {"tag_ids": ["user:a", "user:b"], "name": "test"}
    result = ensure_record_refs(data)
    assert isinstance(result["tag_ids"], list)
    assert result["tag_ids"] == ["user:a", "user:b"]


def test_ensure_record_refs_underscore_in_table_name():
    """Table names with underscores like school_membership are valid."""
    data = {"membership_id": "school_membership:abc123"}
    result = ensure_record_refs(data)
    assert isinstance(result["membership_id"], RecordID)
    assert str(result["membership_id"]) == "school_membership:abc123"


# =========================================================================
# repo_update — RecordID normalization
# =========================================================================


async def _test_repo_update_normalizes_record_refs():
    """repo_update calls ensure_record_refs before passing data to SurrealDB."""
    from unittest.mock import AsyncMock, patch

    from vault_core.database.repository import repo_update

    # Mock repo_query to capture what gets sent
    with patch("vault_core.database.repository.repo_query", new_callable=AsyncMock) as mock_query:
        mock_query.return_value = [{"id": "school:abc", "name": "Updated"}]

        await repo_update(
            "school",
            "school:abc",
            {
                "name": "Updated School",
                "school_id": "school:abc",
                "user_id": "user:owner1",
            },
        )

        # Verify repo_query was called
        mock_query.assert_called_once()
        call_args = mock_query.call_args
        # call_args[0][0] is the query string, call_args[0][1] is the vars dict
        vars_dict = call_args[0][1]
        data_dict = vars_dict.get("data", {})

        # school_id and user_id should be RecordID objects (normalized)
        assert isinstance(data_dict.get("school_id"), RecordID), "school_id not normalized"
        assert isinstance(data_dict.get("user_id"), RecordID), "user_id not normalized"
        assert str(data_dict["school_id"]) == "school:abc"
        assert str(data_dict["user_id"]) == "user:owner1"

        # name should remain a plain string
        assert data_dict.get("name") == "Updated School"
        assert isinstance(data_dict["name"], str)

        # Verify the query is UPDATE ... MERGE
        assert "UPDATE" in str(call_args[0][0])
        assert "MERGE" in str(call_args[0][0])


def test_repo_update_normalizes_record_refs():
    """Wrapper to run the async test."""
    import asyncio
    asyncio.run(_test_repo_update_normalizes_record_refs())


async def _test_repo_update_skips_non_id_fields():
    """repo_update leaves non-ID and non-record strings untouched."""
    from unittest.mock import AsyncMock, patch

    from vault_core.database.repository import repo_update

    with patch("vault_core.database.repository.repo_query", new_callable=AsyncMock) as mock_query:
        mock_query.return_value = [{"id": "school:abc", "name": "Updated"}]

        await repo_update(
            "school",
            "school:abc",
            {
                "name": "My School",
                "slug": "my-school",
                "description": "some description",
                "external_id": "not-a-record",
            },
        )

        mock_query.assert_called_once()
        vars_dict = mock_query.call_args[0][1]
        data_dict = vars_dict.get("data", {})

        # All values should remain plain strings
        for key in ("name", "slug", "description", "external_id"):
            assert isinstance(data_dict[key], str), f"{key} should be a string"
        assert data_dict["external_id"] == "not-a-record"


def test_repo_update_skips_non_id_fields():
    """Wrapper to run the async test."""
    import asyncio
    asyncio.run(_test_repo_update_skips_non_id_fields())


# =========================================================================
# repo_upsert — RecordID normalization
# =========================================================================


async def _test_repo_upsert_normalizes_record_refs():
    """repo_upsert calls ensure_record_refs before passing data to SurrealDB."""
    from unittest.mock import AsyncMock, patch

    from vault_core.database.repository import repo_upsert

    with patch("vault_core.database.repository.repo_query", new_callable=AsyncMock) as mock_query:
        mock_query.return_value = [{"id": "school:abc", "name": "Created"}]

        await repo_upsert(
            "school",
            "school:abc",
            {
                "name": "New School",
                "school_id": "school:abc",
                "user_id": "user:owner1",
                "teacher_id": "school_membership:t1",
            },
            add_timestamp=True,
        )

        mock_query.assert_called_once()
        call_args = mock_query.call_args
        vars_dict = call_args[0][1]
        data_dict = vars_dict.get("data", {})

        # Record reference fields should be RecordID objects
        assert isinstance(data_dict.get("school_id"), RecordID), "school_id not normalized"
        assert isinstance(data_dict.get("user_id"), RecordID), "user_id not normalized"
        assert isinstance(data_dict.get("teacher_id"), RecordID), "teacher_id not normalized"
        assert str(data_dict["school_id"]) == "school:abc"
        assert str(data_dict["user_id"]) == "user:owner1"
        assert str(data_dict["teacher_id"]) == "school_membership:t1"

        # Non-ID fields should remain strings
        assert data_dict.get("name") == "New School"
        assert isinstance(data_dict["name"], str)

        # Verify the query is UPSERT ... MERGE
        assert "UPSERT" in str(call_args[0][0])
        assert "MERGE" in str(call_args[0][0])


def test_repo_upsert_normalizes_record_refs():
    """Wrapper to run the async test."""
    import asyncio
    asyncio.run(_test_repo_upsert_normalizes_record_refs())


async def _test_repo_upsert_handles_empty_data():
    """repo_upsert with no record reference fields still works."""
    from unittest.mock import AsyncMock, patch

    from vault_core.database.repository import repo_upsert

    with patch("vault_core.database.repository.repo_query", new_callable=AsyncMock) as mock_query:
        mock_query.return_value = [{"id": "settings:1", "value": "on"}]

        await repo_upsert(
            "settings",
            "settings:1",
            {"value": "on"},
        )

        mock_query.assert_called_once()
        vars_dict = mock_query.call_args[0][1]
        data_dict = vars_dict.get("data", {})
        assert data_dict.get("value") == "on"
        assert isinstance(data_dict["value"], str)


def test_repo_upsert_handles_empty_data():
    """Wrapper to run the async test."""
    import asyncio
    asyncio.run(_test_repo_upsert_handles_empty_data())
