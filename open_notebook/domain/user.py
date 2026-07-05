"""
Domain models for user accounts.

Epsilon B — dormant until auth is wired in a later phase.
The existing single-password owner gate is unchanged.
"""

from datetime import datetime
from typing import ClassVar, Optional

from open_notebook.domain.base import ObjectModel


class User(ObjectModel):
    """A Vault user account. Dormant until Epsilon C+ wires auth."""

    table_name: ClassVar[str] = "user"
    nullable_fields: ClassVar[set[str]] = {"avatar_url", "last_login_at"}
    display_name: str
    email: str
    password_hash: str
    avatar_url: Optional[str] = None
    is_global_owner: bool = False
    active: bool = True
    last_login_at: Optional[datetime] = None

    def __repr__(self) -> str:
        return f"User(id={self.id}, email={self.email}, display_name={self.display_name})"
