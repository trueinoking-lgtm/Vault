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
