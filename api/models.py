from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# Notebook models
class NotebookCreate(BaseModel):
    name: str = Field(..., description="Name of the notebook")
    description: str = Field(default="", description="Description of the notebook")


class NotebookUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Name of the notebook")
    description: Optional[str] = Field(None, description="Description of the notebook")
    archived: Optional[bool] = Field(
        None, description="Whether the notebook is archived"
    )


class NotebookResponse(BaseModel):
    id: str
    name: str
    description: str
    archived: bool
    created: str
    updated: str
    source_count: int
    note_count: int


# Search models
class SearchRequest(BaseModel):
    query: str = Field(..., description="Search query")
    type: Literal["text", "vector"] = Field("text", description="Search type")
    limit: int = Field(100, description="Maximum number of results", ge=1, le=1000)
    search_sources: bool = Field(True, description="Include sources in search")
    search_notes: bool = Field(True, description="Include notes in search")
    minimum_score: float = Field(
        0.2, description="Minimum score for vector search", ge=0, le=1
    )


class SearchResponse(BaseModel):
    results: List[Dict[str, Any]] = Field(..., description="Search results")
    total_count: int = Field(..., description="Total number of results")
    search_type: str = Field(..., description="Type of search performed")


class AskRequest(BaseModel):
    question: str = Field(..., description="Question to ask the knowledge base")
    strategy_model: Optional[str] = Field(None, description="Model ID for query strategy (resolves to default chat model if omitted)")
    answer_model: Optional[str] = Field(None, description="Model ID for individual answers (resolves to default chat model if omitted)")
    final_answer_model: Optional[str] = Field(None, description="Model ID for final answer (resolves to default chat model if omitted)")


class AskResponse(BaseModel):
    answer: str = Field(..., description="Final answer from the knowledge base")
    question: str = Field(..., description="Original question")


# Models API models
class ModelCreate(BaseModel):
    name: str = Field(..., description="Model name (e.g., gpt-5-mini, claude, gemini)")
    provider: str = Field(
        ..., description="Provider name (e.g., openai, anthropic, gemini)"
    )
    type: str = Field(
        ...,
        description="Model type (language, embedding, text_to_speech, speech_to_text)",
    )
    credential: Optional[str] = Field(
        None, description="Credential ID to link this model to"
    )


class ModelResponse(BaseModel):
    id: str
    name: str
    provider: str
    type: str
    credential: Optional[str] = None
    created: str
    updated: str


class DefaultModelsResponse(BaseModel):
    default_chat_model: Optional[str] = None
    default_transformation_model: Optional[str] = None
    large_context_model: Optional[str] = None
    default_text_to_speech_model: Optional[str] = None
    default_speech_to_text_model: Optional[str] = None
    default_embedding_model: Optional[str] = None
    default_tools_model: Optional[str] = None


class ProviderAvailabilityResponse(BaseModel):
    available: List[str] = Field(..., description="List of available providers")
    unavailable: List[str] = Field(..., description="List of unavailable providers")
    supported_types: Dict[str, List[str]] = Field(
        ..., description="Provider to supported model types mapping"
    )


# Transformations API models
class TransformationCreate(BaseModel):
    name: str = Field(..., description="Transformation name")
    title: str = Field(..., description="Display title for the transformation")
    description: str = Field(
        ..., description="Description of what this transformation does"
    )
    prompt: str = Field(..., description="The transformation prompt")
    apply_default: bool = Field(
        False, description="Whether to apply this transformation by default"
    )


class TransformationUpdate(BaseModel):
    name: Optional[str] = Field(None, description="Transformation name")
    title: Optional[str] = Field(
        None, description="Display title for the transformation"
    )
    description: Optional[str] = Field(
        None, description="Description of what this transformation does"
    )
    prompt: Optional[str] = Field(None, description="The transformation prompt")
    apply_default: Optional[bool] = Field(
        None, description="Whether to apply this transformation by default"
    )


class TransformationResponse(BaseModel):
    id: str
    name: str
    title: str
    description: str
    prompt: str
    apply_default: bool
    created: str
    updated: str


class TransformationExecuteRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    transformation_id: str = Field(
        ..., description="ID of the transformation to execute"
    )
    input_text: str = Field(..., description="Text to transform")
    model_id: str = Field(..., description="Model ID to use for the transformation")


class TransformationExecuteResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    output: str = Field(..., description="Transformed text")
    transformation_id: str = Field(..., description="ID of the transformation used")
    model_id: str = Field(..., description="Model ID used")


# Default Prompt API models
class DefaultPromptResponse(BaseModel):
    transformation_instructions: str = Field(
        ..., description="Default transformation instructions"
    )


class DefaultPromptUpdate(BaseModel):
    transformation_instructions: str = Field(
        ..., description="Default transformation instructions"
    )


# Notes API models
class NoteCreate(BaseModel):
    title: Optional[str] = Field(None, description="Note title")
    content: str = Field(..., description="Note content")
    note_type: Optional[str] = Field("human", description="Type of note (human, ai)")
    notebook_id: Optional[str] = Field(
        None, description="Notebook ID to add the note to"
    )


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(None, description="Note title")
    content: Optional[str] = Field(None, description="Note content")
    note_type: Optional[str] = Field(None, description="Type of note (human, ai)")


class NoteResponse(BaseModel):
    id: str
    title: Optional[str]
    content: Optional[str]
    note_type: Optional[str]
    created: str
    updated: str
    command_id: Optional[str] = None


# Embedding API models
class EmbedRequest(BaseModel):
    item_id: str = Field(..., description="ID of the item to embed")
    item_type: str = Field(..., description="Type of item (source, note)")
    async_processing: bool = Field(
        False, description="Process asynchronously in background"
    )


class EmbedResponse(BaseModel):
    success: bool = Field(..., description="Whether embedding was successful")
    message: str = Field(..., description="Result message")
    item_id: str = Field(..., description="ID of the item that was embedded")
    item_type: str = Field(..., description="Type of item that was embedded")
    command_id: Optional[str] = Field(
        None, description="Command ID for async processing"
    )


# Rebuild request/response models
class RebuildRequest(BaseModel):
    mode: Literal["existing", "all"] = Field(
        ...,
        description="Rebuild mode: 'existing' only re-embeds items with embeddings, 'all' embeds everything",
    )
    include_sources: bool = Field(True, description="Include sources in rebuild")
    include_notes: bool = Field(True, description="Include notes in rebuild")
    include_insights: bool = Field(True, description="Include insights in rebuild")


class RebuildResponse(BaseModel):
    command_id: str = Field(..., description="Command ID to track progress")
    total_items: int = Field(..., description="Estimated number of items to process")
    message: str = Field(..., description="Status message")


class RebuildProgress(BaseModel):
    processed: int = Field(..., description="Number of items processed")
    total: int = Field(..., description="Total items to process")
    percentage: float = Field(..., description="Progress percentage")


class RebuildStats(BaseModel):
    sources: int = Field(0, description="Sources processed")
    notes: int = Field(0, description="Notes processed")
    insights: int = Field(0, description="Insights processed")
    failed: int = Field(0, description="Failed items")


class RebuildStatusResponse(BaseModel):
    command_id: str = Field(..., description="Command ID")
    status: str = Field(..., description="Status: queued, running, completed, failed")
    progress: Optional[RebuildProgress] = None
    stats: Optional[RebuildStats] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    error_message: Optional[str] = None


# Settings API models
class SettingsResponse(BaseModel):
    default_content_processing_engine_doc: Optional[str] = None
    default_content_processing_engine_url: Optional[str] = None
    default_embedding_option: Optional[str] = None
    auto_delete_files: Optional[str] = None
    youtube_preferred_languages: Optional[List[str]] = None


class SettingsUpdate(BaseModel):
    default_content_processing_engine_doc: Optional[str] = None
    default_content_processing_engine_url: Optional[str] = None
    default_embedding_option: Optional[str] = None
    auto_delete_files: Optional[str] = None
    youtube_preferred_languages: Optional[List[str]] = None


# Sources API models
class AssetModel(BaseModel):
    file_path: Optional[str] = None
    url: Optional[str] = None


class SourceCreate(BaseModel):
    # Backward compatibility: support old single notebook_id
    notebook_id: Optional[str] = Field(
        None, description="Notebook ID to add the source to (deprecated, use notebooks)"
    )
    # New multi-notebook support
    notebooks: Optional[List[str]] = Field(
        None, description="List of notebook IDs to add the source to"
    )
    # Required fields
    type: str = Field(..., description="Source type: link, upload, or text")
    url: Optional[str] = Field(None, description="URL for link type")
    file_path: Optional[str] = Field(None, description="File path for upload type")
    content: Optional[str] = Field(None, description="Text content for text type")
    title: Optional[str] = Field(None, description="Source title")
    transformations: Optional[List[str]] = Field(
        default_factory=list, description="Transformation IDs to apply"
    )
    embed: bool = Field(False, description="Whether to embed content for vector search")
    delete_source: bool = Field(
        False, description="Whether to delete uploaded file after processing"
    )
    # New async processing support
    async_processing: bool = Field(
        False, description="Whether to process source asynchronously"
    )

    @model_validator(mode="after")
    def validate_notebook_fields(self):
        # Ensure only one of notebook_id or notebooks is provided
        if self.notebook_id is not None and self.notebooks is not None:
            raise ValueError(
                "Cannot specify both 'notebook_id' and 'notebooks'. Use 'notebooks' for multi-notebook support."
            )

        # Convert single notebook_id to notebooks array for internal processing
        if self.notebook_id is not None:
            self.notebooks = [self.notebook_id]
            # Keep notebook_id for backward compatibility in response

        # Set empty array if no notebooks specified (allow sources without notebooks)
        if self.notebooks is None:
            self.notebooks = []

        return self


class SourceUpdate(BaseModel):
    title: Optional[str] = Field(None, description="Source title")
    topics: Optional[List[str]] = Field(None, description="Source topics")


class SourceResponse(BaseModel):
    id: str
    title: Optional[str]
    topics: Optional[List[str]]
    asset: Optional[AssetModel]
    full_text: Optional[str]
    embedded: bool
    embedded_chunks: int
    file_available: Optional[bool] = None
    created: str
    updated: str
    # New fields for async processing
    command_id: Optional[str] = None
    status: Optional[str] = None
    processing_info: Optional[Dict] = None
    # Notebook associations
    notebooks: Optional[List[str]] = None


class SourceListResponse(BaseModel):
    id: str
    title: Optional[str]
    topics: Optional[List[str]]
    asset: Optional[AssetModel]
    embedded: bool  # Boolean flag indicating if source has embeddings
    embedded_chunks: int  # Number of embedded chunks
    insights_count: int
    created: str
    updated: str
    file_available: Optional[bool] = None
    # Status fields for async processing
    command_id: Optional[str] = None
    status: Optional[str] = None
    processing_info: Optional[Dict[str, Any]] = None


# Context API models
class ContextConfig(BaseModel):
    sources: Dict[str, str] = Field(
        default_factory=dict, description="Source inclusion config {source_id: level}"
    )
    notes: Dict[str, str] = Field(
        default_factory=dict, description="Note inclusion config {note_id: level}"
    )


class ContextRequest(BaseModel):
    notebook_id: str = Field(..., description="Notebook ID to get context for")
    context_config: Optional[ContextConfig] = Field(
        None, description="Context configuration"
    )


class ContextResponse(BaseModel):
    notebook_id: str
    sources: List[Dict[str, Any]] = Field(..., description="Source context data")
    notes: List[Dict[str, Any]] = Field(..., description="Note context data")
    total_tokens: Optional[int] = Field(None, description="Estimated token count")


# Insights API models
class SourceInsightResponse(BaseModel):
    id: str
    source_id: str
    insight_type: str
    content: str
    created: str
    updated: str


class InsightCreationResponse(BaseModel):
    """Response for async insight creation."""

    status: Literal["pending"] = "pending"
    message: str = "Insight generation started"
    source_id: str
    transformation_id: str
    command_id: Optional[str] = None


class SaveAsNoteRequest(BaseModel):
    notebook_id: Optional[str] = Field(None, description="Notebook ID to add note to")


class CreateSourceInsightRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    transformation_id: str = Field(..., description="ID of transformation to apply")
    model_id: Optional[str] = Field(
        None, description="Model ID (uses default if not provided)"
    )


# Source status response
class SourceStatusResponse(BaseModel):
    status: Optional[str] = Field(None, description="Processing status")
    message: str = Field(..., description="Descriptive message about the status")
    processing_info: Optional[Dict[str, Any]] = Field(
        None, description="Detailed processing information"
    )
    command_id: Optional[str] = Field(None, description="Command ID if available")


# Error response
class ErrorResponse(BaseModel):
    error: str
    message: str


# API Key Configuration models
class SetApiKeyRequest(BaseModel):
    """Request to set an API key for a provider."""

    api_key: Optional[str] = Field(None, description="API key for the provider")
    base_url: Optional[str] = Field(
        None, description="Base URL for URL-based providers (Ollama, OpenAI-compatible)"
    )
    endpoint: Optional[str] = Field(
        None, description="Endpoint URL for Azure OpenAI"
    )
    api_version: Optional[str] = Field(
        None, description="API version for Azure OpenAI"
    )
    endpoint_llm: Optional[str] = Field(
        None, description="Service-specific endpoint for LLM (Azure)"
    )
    endpoint_embedding: Optional[str] = Field(
        None, description="Service-specific endpoint for embedding (Azure)"
    )
    endpoint_stt: Optional[str] = Field(
        None, description="Service-specific endpoint for STT (Azure)"
    )
    endpoint_tts: Optional[str] = Field(
        None, description="Service-specific endpoint for TTS (Azure)"
    )
    service_type: Optional[Literal["llm", "embedding", "stt", "tts"]] = Field(
        None,
        description="Service type for OpenAI-compatible providers (llm, embedding, stt, tts)",
    )
    # Vertex AI specific fields
    vertex_project: Optional[str] = Field(
        None, description="Google Cloud Project ID for Vertex AI"
    )
    vertex_location: Optional[str] = Field(
        None, description="Google Cloud Region for Vertex AI (e.g., us-central1)"
    )
    vertex_credentials_path: Optional[str] = Field(
        None, description="Path to Google Cloud service account JSON file"
    )

    @field_validator(
        "api_key",
        "base_url",
        "endpoint",
        "api_version",
        "endpoint_llm",
        "endpoint_embedding",
        "endpoint_stt",
        "endpoint_tts",
        "vertex_project",
        "vertex_location",
        "vertex_credentials_path",
        mode="before",
    )
    @classmethod
    def validate_not_empty_string(cls, v: Optional[str]) -> Optional[str]:
        """Reject empty strings - convert to None or raise error."""
        if v is not None:
            stripped = v.strip()
            if not stripped:
                return None  # Treat empty/whitespace-only as None
            return stripped
        return v


class ApiKeyStatusResponse(BaseModel):
    """Response showing which providers are configured and their source."""

    configured: Dict[str, bool] = Field(
        ..., description="Map of provider name to whether it is configured"
    )
    source: Dict[str, Literal["database", "environment", "none"]] = Field(
        ...,
        description="Map of provider name to configuration source (database, environment, or none)",
    )
    encryption_configured: bool = Field(
        ...,
        description="Whether VAULT_ENCRYPTION_KEY is set (required to store keys in database)",
    )


class TestConnectionResponse(BaseModel):
    """Response from testing a provider connection."""

    provider: str = Field(..., description="Provider name that was tested")
    success: bool = Field(..., description="Whether connection test succeeded")
    message: str = Field(..., description="Result message with details")


class MigrateFromEnvRequest(BaseModel):
    """Request to migrate API keys from environment variables to database."""

    force: bool = Field(
        False, description="Force overwrite existing database configurations"
    )


class MigrationResult(BaseModel):
    """Response from migrating API keys from environment to database."""

    message: str = Field(..., description="Summary message")
    migrated: List[str] = Field(
        default_factory=list, description="Providers successfully migrated"
    )
    skipped: List[str] = Field(
        default_factory=list, description="Providers skipped (already in DB)"
    )
    errors: List[str] = Field(
        default_factory=list, description="Migration errors by provider"
    )


# Notebook delete cascade models
# Credential models
class CreateCredentialRequest(BaseModel):
    """Request to create a new credential."""

    name: str = Field(..., description="Credential name")
    provider: str = Field(..., description="Provider name (openai, anthropic, etc.)")
    modalities: List[str] = Field(
        default_factory=list,
        description="Supported modalities (language, embedding, text_to_speech, speech_to_text)",
    )
    api_key: Optional[str] = Field(None, description="API key (stored encrypted)")
    base_url: Optional[str] = Field(None, description="Base URL")
    endpoint: Optional[str] = Field(None, description="Endpoint URL (Azure)")
    api_version: Optional[str] = Field(None, description="API version (Azure)")
    endpoint_llm: Optional[str] = Field(None, description="LLM endpoint")
    endpoint_embedding: Optional[str] = Field(None, description="Embedding endpoint")
    endpoint_stt: Optional[str] = Field(None, description="STT endpoint")
    endpoint_tts: Optional[str] = Field(None, description="TTS endpoint")
    project: Optional[str] = Field(None, description="Project ID (Vertex)")
    location: Optional[str] = Field(None, description="Location (Vertex)")
    credentials_path: Optional[str] = Field(
        None, description="Credentials file path (Vertex)"
    )
    num_ctx: Optional[int] = Field(
        None, description="Context window size (Ollama only; defaults to 8192)"
    )


class UpdateCredentialRequest(BaseModel):
    """Request to update an existing credential."""

    name: Optional[str] = Field(None, description="Credential name")
    modalities: Optional[List[str]] = Field(None, description="Supported modalities")
    api_key: Optional[str] = Field(None, description="API key (stored encrypted)")
    base_url: Optional[str] = Field(None, description="Base URL")
    endpoint: Optional[str] = Field(None, description="Endpoint URL")
    api_version: Optional[str] = Field(None, description="API version")
    endpoint_llm: Optional[str] = Field(None, description="LLM endpoint")
    endpoint_embedding: Optional[str] = Field(None, description="Embedding endpoint")
    endpoint_stt: Optional[str] = Field(None, description="STT endpoint")
    endpoint_tts: Optional[str] = Field(None, description="TTS endpoint")
    project: Optional[str] = Field(None, description="Project ID")
    location: Optional[str] = Field(None, description="Location")
    credentials_path: Optional[str] = Field(None, description="Credentials path")
    num_ctx: Optional[int] = Field(
        None, description="Context window size (Ollama only; defaults to 8192)"
    )


class CredentialResponse(BaseModel):
    """Response for a credential (never includes api_key)."""

    id: str
    name: str
    provider: str
    modalities: List[str]
    base_url: Optional[str] = None
    endpoint: Optional[str] = None
    api_version: Optional[str] = None
    endpoint_llm: Optional[str] = None
    endpoint_embedding: Optional[str] = None
    endpoint_stt: Optional[str] = None
    endpoint_tts: Optional[str] = None
    project: Optional[str] = None
    location: Optional[str] = None
    credentials_path: Optional[str] = None
    num_ctx: Optional[int] = None
    has_api_key: bool = False
    created: str
    updated: str
    model_count: int = 0
    decryption_error: Optional[str] = None


class CredentialDeleteResponse(BaseModel):
    """Response for credential deletion."""

    message: str
    deleted_models: int = 0


class DiscoveredModelResponse(BaseModel):
    """A model discovered from a provider."""

    name: str
    provider: str
    model_type: Optional[str] = None
    description: Optional[str] = None


class DiscoverModelsResponse(BaseModel):
    """Response from model discovery."""

    credential_id: str
    provider: str
    discovered: List[DiscoveredModelResponse]


class RegisterModelData(BaseModel):
    """A model to register with user-specified type."""

    name: str
    provider: str
    model_type: str  # Required: user specifies the type


class RegisterModelsRequest(BaseModel):
    """Request to register discovered models."""

    models: List[RegisterModelData]


class RegisterModelsResponse(BaseModel):
    """Response from model registration."""

    created: int
    existing: int


class NotebookDeletePreview(BaseModel):
    notebook_id: str = Field(..., description="ID of the notebook")
    notebook_name: str = Field(..., description="Name of the notebook")
    note_count: int = Field(..., description="Number of notes that will be deleted")
    exclusive_source_count: int = Field(
        ..., description="Number of sources only in this notebook"
    )
    shared_source_count: int = Field(
        ..., description="Number of sources shared with other notebooks"
    )


class NotebookDeleteResponse(BaseModel):
    message: str = Field(..., description="Success message")
    deleted_notes: int = Field(..., description="Number of notes deleted")
    deleted_sources: int = Field(..., description="Number of exclusive sources deleted")
    unlinked_sources: int = Field(
        ..., description="Number of sources unlinked from notebook"
    )


# ── Study / Review Persistence Models (Delta F) ──────────────────────────────


class StudySessionCreate(BaseModel):
    """Request to start or resume a study session."""

    notebook_id: str = Field(..., description="Library (notebook) to study")


class StudySessionUpdate(BaseModel):
    """Request to update a study session (close it)."""

    status: Literal["completed", "abandoned"] = Field(
        ..., description="New status for the session"
    )


class StudySessionResponse(BaseModel):
    """Response for a study session."""

    id: str
    notebook_id: str
    status: str
    started_at: str
    ended_at: Optional[str] = None
    leaf_count: int = 0
    created: str
    updated: str


class LeafReviewEventCreate(BaseModel):
    """Request to log a leaf review event."""

    session_id: str = Field(..., description="Study session ID")
    note_id: str = Field(..., description="Leaf (note) ID")
    notebook_id: str = Field(..., description="Library (notebook) ID")
    event_type: Literal[
        "opened",
        "check_started",
        "remembered",
        "needs_review",
        "listened",
    ] = Field(..., description="Type of review event")
    event_metadata: Optional[Dict[str, Any]] = Field(
        None, description="Optional flexible metadata"
    )


class LeafReviewEventResponse(BaseModel):
    """Response for a leaf review event."""

    id: str
    session_id: str
    note_id: str
    notebook_id: str
    event_type: str
    event_metadata: Optional[Dict[str, Any]] = None
    created: str


class ReviewQueueItem(BaseModel):
    """A single item in the review queue."""

    note_id: str
    notebook_id: Optional[str] = None
    title: Optional[str] = None
    content_preview: Optional[str] = None
    needs_review: bool
    last_reviewed: Optional[str] = None
    review_count: int = 0
    is_weak_spot: bool = False
    weak_spot_label: Optional[str] = None


class ReviewQueueResponse(BaseModel):
    """Response for the review queue endpoint."""

    items: List[ReviewQueueItem] = Field(default_factory=list)
    total: int = 0


class StudySessionListResponse(BaseModel):
    """Response for listing study sessions."""

    items: List[StudySessionResponse] = Field(default_factory=list)
    total: int = 0


# ============================================================================
# School / Classroom API Models (Epsilon C1 — dormant, no tenancy enforcement)
# ============================================================================


class SchoolCreate(BaseModel):
    """Request to create a school."""

    name: str = Field(..., description="School display name")
    slug: str = Field(
        ..., description="URL-safe identifier", min_length=2, max_length=32
    )
    description: Optional[str] = Field(None, description="Optional description")
    settings: Optional[Dict[str, Any]] = Field(
        None, description="Flexible school-level settings"
    )


class SchoolUpdate(BaseModel):
    """Request to update a school."""

    name: Optional[str] = Field(None, description="School display name")
    slug: Optional[str] = Field(None, description="URL-safe identifier")
    description: Optional[str] = Field(None, description="Optional description")
    settings: Optional[Dict[str, Any]] = Field(
        None, description="Flexible school-level settings"
    )
    active: Optional[bool] = Field(None, description="Soft-deactivate school")


class SchoolResponse(BaseModel):
    """Response for a school."""

    id: str
    name: str
    slug: str
    description: Optional[str] = None
    active: bool = True
    created: str
    updated: str


class SchoolMembershipCreate(BaseModel):
    """Request to add a member to a school."""

    user_id: str = Field(..., description="User ID to add")
    role: str = Field(
        ..., description="Role: owner, teacher, or learner", pattern=r"^(owner|teacher|learner)$"
    )


class SchoolMembershipUpdate(BaseModel):
    """Request to update a school membership."""

    role: Optional[str] = Field(
        None, description="Role: owner, teacher, or learner",
        pattern=r"^(owner|teacher|learner)$",
    )
    active: Optional[bool] = Field(None, description="Soft-deactivate membership")


class SchoolMembershipResponse(BaseModel):
    """Response for a school membership."""

    id: str
    school_id: str
    user_id: str
    role: str
    active: bool = True
    joined_at: Optional[str] = None


class ClassroomCreate(BaseModel):
    """Request to create a classroom."""

    teacher_id: str = Field(..., description="Teacher's school_membership ID")
    name: str = Field(..., description="Classroom display name")
    description: Optional[str] = Field(None, description="Optional description")
    subject: Optional[str] = Field(None, description="Subject area")
    grade_level: Optional[str] = Field(None, description="Grade or form level")


class ClassroomUpdate(BaseModel):
    """Request to update a classroom."""

    name: Optional[str] = Field(None, description="Classroom display name")
    description: Optional[str] = Field(None, description="Optional description")
    subject: Optional[str] = Field(None, description="Subject area")
    grade_level: Optional[str] = Field(None, description="Grade or form level")
    active: Optional[bool] = Field(None, description="Soft-deactivate classroom")


class ClassroomResponse(BaseModel):
    """Response for a classroom."""

    id: str
    school_id: str
    teacher_id: str
    name: str
    description: Optional[str] = None
    subject: Optional[str] = None
    grade_level: Optional[str] = None
    active: bool = True
    created: str
    updated: str


class ClassEnrollmentCreate(BaseModel):
    """Request to enroll a learner in a classroom."""

    learner_id: str = Field(..., description="Learner's school_membership ID")


class ClassEnrollmentResponse(BaseModel):
    """Response for a class enrollment."""

    id: str
    classroom_id: str
    learner_id: str
    enrolled_at: Optional[str] = None
    active: bool = True


class ClassroomAssignmentCreate(BaseModel):
    """Request to assign a learning object to a classroom."""

    notebook_id: Optional[str] = Field(None, description="Legacy notebook ID (optional)")
    target_type: Optional[str] = Field(
        None, description="Target type: material, leaf, or notebook"
    )
    target_id: Optional[str] = Field(None, description="Target record ID")
    title: Optional[str] = Field(None, description="Assignment title")
    instructions: Optional[str] = Field(None, description="Instructions for learners")
    due_at: Optional[str] = Field(None, description="Due date (ISO 8601)")
    assigned_by: str = Field(
        ..., description="school_membership ID of the assigner"
    )


class ClassroomAssignmentResponse(BaseModel):
    """Response for a classroom assignment."""

    id: str
    classroom_id: str
    notebook_id: Optional[str] = None
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    title: Optional[str] = None
    instructions: Optional[str] = None
    due_at: Optional[str] = None
    assigned_by: str
    assigned_at: Optional[str] = None
    archived_at: Optional[str] = None
    active: bool = True


class AssignmentProgressCreate(BaseModel):
    """Request to mark an assignment as completed."""

    assignment_id: str = Field(..., description="Assignment ID")
    classroom_id: str = Field(..., description="Classroom ID")
    learner_id: str = Field(..., description="school_membership ID of the learner")


class AssignmentProgressResponse(BaseModel):
    """Response for assignment progress."""

    id: str
    assignment_id: str
    classroom_id: str
    learner_id: str
    status: str
    completed_at: Optional[str] = None
    created: Optional[str] = None
    updated: Optional[str] = None


class LearnerAssignmentResponse(BaseModel):
    """Learner-facing assignment view with progress."""

    id: str
    classroom_id: str
    classroom_name: Optional[str] = None
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    title: Optional[str] = None
    instructions: Optional[str] = None
    due_at: Optional[str] = None
    assigned_at: Optional[str] = None
    status: str = "not_started"
    completed_at: Optional[str] = None
    progress_id: Optional[str] = None


class ClassroomAssignmentListResponse(BaseModel):
    """Teacher-facing assignment list with completion stats."""

    assignments: list
    total: int


# ============================================================================
# Auth API Models (Epsilon C3a — bootstrap session auth)
# ============================================================================


class AuthLoginRequest(BaseModel):
    """Request to log in with a password."""

    password: str = Field(..., description="Password for authentication")


class AuthUserResponse(BaseModel):
    """Public user profile — never exposes password_hash or token_hash."""

    id: str
    display_name: str
    email: str
    is_global_owner: bool = False
    active: bool = True


class AuthLoginResponse(BaseModel):
    """Response from a successful login."""

    token: str = Field(..., description="Raw session token (one-time return)")
    expires_at: str = Field(..., description="ISO-8601 expiry timestamp")
    user: AuthUserResponse = Field(..., description="Authenticated user profile")
    is_owner: bool = Field(
        False, description="Whether the user has global owner privileges"
    )


class AuthMeResponse(BaseModel):
    """Response from GET /api/auth/me."""

    authenticated: bool
    auth_mode: str = Field(
        ..., description="One of: session, password, disabled"
    )
    user: Optional[AuthUserResponse] = None
    owner_access: bool = False
    memberships: list["AuthMembershipResponse"] = Field(
        default_factory=list,
        description="Active school memberships for role derivation",
    )


class AuthMembershipResponse(BaseModel):
    """Safe membership data — never exposes password_hash or token_hash."""

    membership_id: str
    school_id: str
    role: str
    active: bool = True


# ============================================================================
# Teacher / Class Progress Read Models (Epsilon E2)
# ============================================================================


class TeacherClassSummary(BaseModel):
    """Summary of a classroom for the teacher class list view."""

    classroom_id: str
    classroom_name: str
    subject: Optional[str] = None
    grade_level: Optional[str] = None
    school_id: str
    learner_count: int = 0
    active_learner_count: int = 0
    assignment_count: int = 0
    active_assignment_count: int = 0
    recent_study_session_count: int = 0
    needs_practice_leaf_count: int = 0
    needs_review_leaf_count: int = 0
    remembered_leaf_count: int = 0
    last_activity_at: Optional[str] = None
    data_status: str = "ok"


class ClassProgressSummary(BaseModel):
    """Aggregate progress summary for a single classroom."""

    classroom_id: str
    classroom_name: str
    subject: Optional[str] = None
    grade_level: Optional[str] = None
    school_id: str
    learner_count: int = 0
    active_learner_count: int = 0
    assignment_count: int = 0
    active_assignment_count: int = 0
    recent_study_session_count: int = 0
    needs_practice_leaf_count: int = 0
    needs_review_leaf_count: int = 0
    remembered_leaf_count: int = 0
    last_activity_at: Optional[str] = None
    data_status: str = "ok"


class LearnerProgressSummary(BaseModel):
    """Per-learner progress summary — safe fields only."""

    learner_id: str
    learner_display_name: Optional[str] = None
    enrollment_id: str
    enrollment_active: bool = True
    needs_practice_leaf_count: int = 0
    needs_review_leaf_count: int = 0
    remembered_leaf_count: int = 0
    last_activity_at: Optional[str] = None


class ClassActivityEntry(BaseModel):
    """A single review event in the class activity feed.

    Contains only metadata — no reflection text, no AI diagnosis.
    """

    event_id: str
    learner_id: Optional[str] = None
    notebook_id: str
    note_id: str
    event_type: str
    event_time: str


# =========================================================================
# Impact Intelligence — Assessment Analytics
# =========================================================================


class ImpactSchoolCreate(BaseModel):
    """Request to create an Impact School."""

    name: str = Field(..., description="School display name")
    district: Optional[str] = Field(None, description="District name")
    province: Optional[str] = Field(None, description="Province name")
    school_type: Optional[str] = Field(
        None, description="School type: primary, secondary, or tertiary",
        pattern=r"^(primary|secondary|tertiary)$"
    )


class ImpactSchoolUpdate(BaseModel):
    """Request to update an Impact School."""

    name: Optional[str] = Field(None, description="School display name")
    district: Optional[str] = Field(None, description="District name")
    province: Optional[str] = Field(None, description="Province name")
    school_type: Optional[str] = Field(
        None, description="School type: primary, secondary, or tertiary",
        pattern=r"^(primary|secondary|tertiary)$"
    )
    active: Optional[bool] = Field(None, description="Soft-deactivate school")


class ImpactSchoolResponse(BaseModel):
    """Response for an Impact School."""

    id: str
    name: str
    district: Optional[str] = None
    province: Optional[str] = None
    school_type: Optional[str] = None
    active: bool = True
    created: str
    updated: str


class ImpactClassGroupCreate(BaseModel):
    """Request to create an Impact Class Group."""

    school_id: str = Field(..., description="School ID")
    name: str = Field(..., description="Class group name")
    grade_level: Optional[str] = Field(None, description="Grade level")
    academic_year: Optional[str] = Field(None, description="Academic year (e.g. 2026)")
    teacher_name: Optional[str] = Field(None, description="Teacher name")


class ImpactClassGroupUpdate(BaseModel):
    """Request to update an Impact Class Group."""

    name: Optional[str] = Field(None, description="Class group name")
    grade_level: Optional[str] = Field(None, description="Grade level")
    academic_year: Optional[str] = Field(None, description="Academic year")
    teacher_name: Optional[str] = Field(None, description="Teacher name")
    active: Optional[bool] = Field(None, description="Soft-deactivate class group")


class ImpactClassGroupResponse(BaseModel):
    """Response for an Impact Class Group."""

    id: str
    school_id: str
    name: str
    grade_level: Optional[str] = None
    academic_year: Optional[str] = None
    teacher_name: Optional[str] = None
    active: bool = True
    created: str
    updated: str


class ImpactLearnerCreate(BaseModel):
    """Request to create an Impact Learner."""

    school_id: str = Field(..., description="School ID")
    class_group_id: str = Field(..., description="Class Group ID")
    learner_code: str = Field(..., description="School-assigned learner code")
    display_name: Optional[str] = Field(None, description="Display name")
    status: str = Field(
        "active", description="Learner status: active, inactive, or transferred",
        pattern=r"^(active|inactive|transferred)$"
    )


class ImpactLearnerUpdate(BaseModel):
    """Request to update an Impact Learner."""

    display_name: Optional[str] = Field(None, description="Display name")
    status: Optional[str] = Field(
        None, description="Learner status: active, inactive, or transferred",
        pattern=r"^(active|inactive|transferred)$"
    )


class ImpactLearnerResponse(BaseModel):
    """Response for an Impact Learner."""

    id: str
    school_id: str
    class_group_id: str
    learner_code: str
    display_name: Optional[str] = None
    status: str = "active"
    created: str
    updated: str


class ImpactSubjectCreate(BaseModel):
    """Request to create an Impact Subject."""

    name: str = Field(..., description="Subject name")
    level: Optional[str] = Field(None, description="Level (e.g. O-Level, A-Level)")
    curriculum: Optional[str] = Field(None, description="Curriculum (e.g. ZIMSEC, Cambridge)")


class ImpactSubjectUpdate(BaseModel):
    """Request to update an Impact Subject."""

    name: Optional[str] = Field(None, description="Subject name")
    level: Optional[str] = Field(None, description="Level")
    curriculum: Optional[str] = Field(None, description="Curriculum")


class ImpactSubjectResponse(BaseModel):
    """Response for an Impact Subject."""

    id: str
    name: str
    level: Optional[str] = None
    curriculum: Optional[str] = None
    created: str
    updated: str


class ImpactTopicCreate(BaseModel):
    """Request to create an Impact Topic."""

    subject_id: str = Field(..., description="Subject ID")
    name: str = Field(..., description="Topic name")
    strand: Optional[str] = Field(None, description="Strand")
    syllabus_code: Optional[str] = Field(None, description="Syllabus code")


class ImpactTopicUpdate(BaseModel):
    """Request to update an Impact Topic."""

    name: Optional[str] = Field(None, description="Topic name")
    strand: Optional[str] = Field(None, description="Strand")
    syllabus_code: Optional[str] = Field(None, description="Syllabus code")


class ImpactTopicResponse(BaseModel):
    """Response for an Impact Topic."""

    id: str
    subject_id: str
    name: str
    strand: Optional[str] = None
    syllabus_code: Optional[str] = None
    created: str
    updated: str


class ImpactAssessmentCreate(BaseModel):
    """Request to create an Impact Assessment."""

    school_id: str = Field(..., description="School ID")
    class_group_id: str = Field(..., description="Class Group ID")
    subject_id: str = Field(..., description="Subject ID")
    title: str = Field(..., description="Assessment title")
    assessment_type: str = Field(
        ..., description="Type: test, exam, quiz, or assignment",
        pattern=r"^(test|exam|quiz|assignment)$"
    )
    term: Optional[str] = Field(None, description="Term (e.g. Term 1)")
    date_written: Optional[str] = Field(None, description="Date written (ISO format)")
    total_marks: int = Field(..., description="Total marks", gt=0)
    pass_mark: Optional[int] = Field(None, description="Pass mark", gt=0)
    status: str = Field(
        "draft", description="Status: draft, published, or graded",
        pattern=r"^(draft|published|graded)$"
    )


class ImpactAssessmentUpdate(BaseModel):
    """Request to update an Impact Assessment."""

    title: Optional[str] = Field(None, description="Assessment title")
    assessment_type: Optional[str] = Field(
        None, description="Type: test, exam, quiz, or assignment",
        pattern=r"^(test|exam|quiz|assignment)$"
    )
    term: Optional[str] = Field(None, description="Term")
    date_written: Optional[str] = Field(None, description="Date written (ISO format)")
    total_marks: Optional[int] = Field(None, description="Total marks", gt=0)
    pass_mark: Optional[int] = Field(None, description="Pass mark", gt=0)
    status: Optional[str] = Field(
        None, description="Status: draft, published, or graded",
        pattern=r"^(draft|published|graded)$"
    )


class ImpactAssessmentResponse(BaseModel):
    """Response for an Impact Assessment."""

    id: str
    school_id: str
    class_group_id: str
    subject_id: str
    title: str
    assessment_type: str
    term: Optional[str] = None
    date_written: Optional[str] = None
    total_marks: int
    pass_mark: Optional[int] = None
    status: str = "draft"
    created: str
    updated: str


class ImpactAssessmentQuestionCreate(BaseModel):
    """Request to create an Impact Assessment Question."""

    assessment_id: str = Field(..., description="Assessment ID")
    question_number: int = Field(..., description="Question number", gt=0)
    label: Optional[str] = Field(None, description="Question label (e.g. Q1)")
    max_marks: int = Field(..., description="Maximum marks", gt=0)
    topic_id: Optional[str] = Field(None, description="Topic ID")
    skill_type: str = Field(
        ..., description="Skill type: knowledge, comprehension, application, or analysis",
        pattern=r"^(knowledge|comprehension|application|analysis)$"
    )
    difficulty: Optional[str] = Field(
        None, description="Difficulty: easy, medium, or hard",
        pattern=r"^(easy|medium|hard)$"
    )


class ImpactAssessmentQuestionUpdate(BaseModel):
    """Request to update an Impact Assessment Question."""

    question_number: Optional[int] = Field(None, description="Question number", gt=0)
    label: Optional[str] = Field(None, description="Question label")
    max_marks: Optional[int] = Field(None, description="Maximum marks", gt=0)
    topic_id: Optional[str] = Field(None, description="Topic ID")
    skill_type: Optional[str] = Field(
        None, description="Skill type",
        pattern=r"^(knowledge|comprehension|application|analysis)$"
    )
    difficulty: Optional[str] = Field(
        None, description="Difficulty",
        pattern=r"^(easy|medium|hard)$"
    )


class ImpactAssessmentQuestionResponse(BaseModel):
    """Response for an Impact Assessment Question."""

    id: str
    assessment_id: str
    question_number: int
    label: Optional[str] = None
    max_marks: int
    topic_id: Optional[str] = None
    skill_type: str
    difficulty: Optional[str] = None
    created: str
    updated: str


class ImpactMarkEntryCreate(BaseModel):
    """Request to create an Impact Mark Entry."""

    assessment_id: str = Field(..., description="Assessment ID")
    question_id: str = Field(..., description="Question ID")
    learner_id: str = Field(..., description="Learner ID")
    score: float = Field(..., description="Score achieved", ge=0)
    max_score: float = Field(..., description="Maximum score", gt=0)


class ImpactMarkEntryUpdate(BaseModel):
    """Request to update an Impact Mark Entry."""

    score: Optional[float] = Field(None, description="Score achieved", ge=0)


class ImpactMarkEntryResponse(BaseModel):
    """Response for an Impact Mark Entry."""

    id: str
    assessment_id: str
    question_id: str
    learner_id: str
    score: float
    max_score: float
    created: str
    updated: str


class ImpactInterventionCreate(BaseModel):
    """Request to create an Impact Intervention."""

    assessment_id: str = Field(..., description="Assessment ID")
    class_group_id: str = Field(..., description="Class Group ID")
    topic_id: str = Field(..., description="Topic ID")
    severity: str = Field(
        ..., description="Severity: low, medium, high, or critical",
        pattern=r"^(low|medium|high|critical)$"
    )
    recommendation: Optional[str] = Field(None, description="Recommendation text")
    status: str = Field(
        "pending", description="Status: pending, in_progress, completed, or dismissed",
        pattern=r"^(pending|in_progress|completed|dismissed)$"
    )


class ImpactInterventionUpdate(BaseModel):
    """Request to update an Impact Intervention."""

    severity: Optional[str] = Field(
        None, description="Severity",
        pattern=r"^(low|medium|high|critical)$"
    )
    recommendation: Optional[str] = Field(None, description="Recommendation text")
    status: Optional[str] = Field(
        None, description="Status",
        pattern=r"^(pending|in_progress|completed|dismissed)$"
    )


class ImpactInterventionResponse(BaseModel):
    """Response for an Impact Intervention."""

    id: str
    assessment_id: str
    class_group_id: str
    topic_id: str
    severity: str
    recommendation: Optional[str] = None
    status: str = "pending"
    created: str
    updated: str


# =========================================================================
# Impact Intelligence — List Responses
# =========================================================================


class ImpactSchoolListResponse(BaseModel):
    """List response for Impact Schools."""

    schools: List[ImpactSchoolResponse]
    total: int


class ImpactClassGroupListResponse(BaseModel):
    """List response for Impact Class Groups."""

    class_groups: List[ImpactClassGroupResponse]
    total: int


class ImpactLearnerListResponse(BaseModel):
    """List response for Impact Learners."""

    learners: List[ImpactLearnerResponse]
    total: int


class ImpactSubjectListResponse(BaseModel):
    """List response for Impact Subjects."""

    subjects: List[ImpactSubjectResponse]
    total: int


class ImpactTopicListResponse(BaseModel):
    """List response for Impact Topics."""

    topics: List[ImpactTopicResponse]
    total: int


class ImpactAssessmentListResponse(BaseModel):
    """List response for Impact Assessments."""

    assessments: List[ImpactAssessmentResponse]
    total: int


class ImpactAssessmentQuestionListResponse(BaseModel):
    """List response for Impact Assessment Questions."""

    questions: List[ImpactAssessmentQuestionResponse]
    total: int


class ImpactMarkEntryListResponse(BaseModel):
    """List response for Impact Mark Entries."""

    mark_entries: List[ImpactMarkEntryResponse]
    total: int


class ImpactInterventionListResponse(BaseModel):
    """List response for Impact Interventions."""

    interventions: List[ImpactInterventionResponse]
    total: int


# =========================================================================
# Impact Intelligence — Analytics Response Schemas
# =========================================================================


class QuestionPerformanceResponse(BaseModel):
    """Performance metrics for a single question."""

    question_id: str
    question_number: int
    label: Optional[str] = None
    max_marks: float
    topic_id: Optional[str] = None
    skill_type: str
    difficulty: Optional[str] = None
    total_score: float
    num_learners: int
    average_score: float
    average_percentage: float
    is_critical: bool


class TopicPerformanceResponse(BaseModel):
    """Performance metrics for a topic across questions."""

    topic_id: str
    topic_name: str
    total_score: float
    total_max_marks: float
    percentage: float
    num_questions: int
    num_learners: int
    is_weak: bool
    is_critical: bool


class LearnerPerformanceResponse(BaseModel):
    """Performance metrics for a single learner."""

    learner_id: str
    learner_code: str
    display_name: Optional[str] = None
    total_score: float
    total_max_marks: float
    percentage: float
    passed: bool
    risk_level: str  # "low" | "medium" | "high"
    questions_answered: int
    total_questions: int


class InterventionRecommendationResponse(BaseModel):
    """Recommended intervention based on performance."""

    intervention_type: str  # "critical" | "weak" | "stable"
    entity_type: str  # "topic" | "learner"
    entity_id: str
    entity_name: str
    severity: str  # "low" | "medium" | "high" | "critical"
    recommendation: str
    percentage: float


class AssessmentAnalyticsResponse(BaseModel):
    """Complete analytics for an assessment."""

    assessment_id: str
    assessment_title: str
    assessment_type: str
    total_marks: float
    pass_mark: Optional[float] = None
    term: Optional[str] = None

    # Summary statistics
    total_learners: int
    learners_assessed: int
    mark_completion_rate: float
    class_average_percentage: float
    pass_rate: float
    failure_rate: float

    # Detailed performance
    question_performance: List[QuestionPerformanceResponse]
    topic_performance: List[TopicPerformanceResponse]
    learner_performance: List[LearnerPerformanceResponse]

    # Weaknesses and interventions
    weak_topics: List[TopicPerformanceResponse]
    at_risk_learners: List[LearnerPerformanceResponse]
    interventions: List[InterventionRecommendationResponse]


class ImpactReportEntitySnapshot(BaseModel):
    """Typed report snapshot with audit fields intentionally omitted."""

    model_config = ConfigDict(extra="allow")
    id: str


class ImpactAssessmentReportResponse(BaseModel):
    """Validated assessment report assembled at the API boundary."""

    assessment: ImpactReportEntitySnapshot
    questions: List[ImpactReportEntitySnapshot]
    learners: List[ImpactReportEntitySnapshot]
    analytics: AssessmentAnalyticsResponse
    school: Optional[ImpactReportEntitySnapshot] = None
    class_group: Optional[ImpactReportEntitySnapshot] = None
    subject: Optional[ImpactReportEntitySnapshot] = None


class ImpactSchoolReportResponse(BaseModel):
    """Validated school aggregate report assembled at the API boundary."""

    school: ImpactReportEntitySnapshot
    classes: List[ImpactReportEntitySnapshot]
    assessments: List[ImpactReportEntitySnapshot]
    pass_rate_by_class: List[dict]
    recent_interventions: List[ImpactReportEntitySnapshot]
    total_learners: int
    total_learners_assessed: int
    overall_pass_rate: float
