class VaultError(Exception):
    """Base exception class for Vault errors."""

    pass


class DatabaseOperationError(VaultError):
    """Raised when a database operation fails."""

    pass


class UnsupportedTypeException(VaultError):
    """Raised when an unsupported type is provided."""

    pass


class InvalidInputError(VaultError):
    """Raised when invalid input is provided."""

    pass


class NotFoundError(VaultError):
    """Raised when a requested resource is not found."""

    pass


class AuthenticationError(VaultError):
    """Raised when there's an authentication problem."""

    pass


class ConfigurationError(VaultError):
    """Raised when there's a configuration problem."""

    pass


class ExternalServiceError(VaultError):
    """Raised when an external service (e.g., AI model) fails."""

    pass


class RateLimitError(VaultError):
    """Raised when a rate limit is exceeded."""

    pass


class FileOperationError(VaultError):
    """Raised when a file operation fails."""

    pass


class NetworkError(VaultError):
    """Raised when a network operation fails."""

    pass


class NoTranscriptFound(VaultError):
    """Raised when no transcript is found for a video."""

    pass
