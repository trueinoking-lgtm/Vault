"""
Fireworks AI Bootstrap — seeds default models and credentials on startup.

When FIREWORKS_API_KEY is set, this module:
1. Creates a 'fireworks' credential record (if not exists)
2. Registers the default Fireworks models (deepseek-v4-flash, qwen3-embedding-8b)
3. Sets DefaultModels to point to these (only if no defaults exist yet,
   or if VAULT_FORCE_FIREWORKS_DEFAULTS=true)

This runs once at API startup and is idempotent — it never overwrites
user-customized defaults unless VAULT_FORCE_FIREWORKS_DEFAULTS=true.
"""

import os

from loguru import logger
from pydantic import SecretStr

from vault_core.ai.models import DefaultModels, Model
from vault_core.database.repository import repo_query
from vault_core.domain.credential import Credential

# =============================================================================
# Fireworks Model Defaults
# =============================================================================

FIREWORKS_BASE_URL = "https://api.fireworks.ai/inference/v1"

# Default text generation model
FIREWORKS_CHAT_MODEL = os.getenv(
    "VAULT_DEFAULT_CHAT_MODEL",
    "accounts/fireworks/models/deepseek-v4-flash",
)

# Default embedding model — Fireworks Qwen3 Embedding 8B
FIREWORKS_EMBEDDING_MODEL = os.getenv(
    "VAULT_DEFAULT_EMBEDDING_MODEL",
    "accounts/fireworks/models/qwen3-embedding-8b",
)

# Defaults for other model slots (all point to the same chat model)
FIREWORKS_FAST_MODEL = os.getenv(
    "VAULT_DEFAULT_FAST_MODEL",
    FIREWORKS_CHAT_MODEL,
)
FIREWORKS_LONG_CONTEXT_MODEL = os.getenv(
    "VAULT_DEFAULT_LONG_CONTEXT_MODEL",
    FIREWORKS_CHAT_MODEL,
)

# Provider label used in DB (display name)
FIREWORKS_PROVIDER = "fireworks"

# Credential name for the auto-created Fireworks credential
FIREWORKS_CREDENTIAL_NAME = "Fireworks (auto-bootstrapped)"

# Force overwrite existing defaults?
FORCE_DEFAULTS = os.getenv("VAULT_FORCE_FIREWORKS_DEFAULTS", "false").lower() in (
    "1",
    "true",
    "yes",
)


async def _ensure_fireworks_credential() -> Credential | None:
    """Create the Fireworks credential if it doesn't exist.

    Returns the credential, or None if FIREWORKS_API_KEY is not set.
    """
    api_key = os.getenv("FIREWORKS_API_KEY")
    if not api_key:
        return None

    # Check if a fireworks credential already exists
    existing = await Credential.get_by_provider(FIREWORKS_PROVIDER)
    if existing:
        logger.debug(
            f"Fireworks credential already exists ({len(existing)} record(s))"
        )
        return existing[0]

    # Create new credential
    cred = Credential(
        name=FIREWORKS_CREDENTIAL_NAME,
        provider=FIREWORKS_PROVIDER,
        modalities=["language", "embedding"],
        api_key=SecretStr(api_key),
        base_url=FIREWORKS_BASE_URL,
    )
    await cred.save()
    logger.info(
        f"Created Fireworks credential: {cred.id} "
        f"(provider={FIREWORKS_PROVIDER}, base_url={FIREWORKS_BASE_URL})"
    )
    return cred


async def _ensure_fireworks_models(cred: Credential) -> tuple[str, str]:
    """Register the default Fireworks models if they don't exist.

    Returns (chat_model_id, embedding_model_id).
    """
    # Check for existing chat model
    chat_models = await repo_query(
        "SELECT * FROM model WHERE string::lowercase(provider) = $provider "
        "AND string::lowercase(name) = $name AND string::lowercase(type) = 'language' LIMIT 1",
        {"provider": FIREWORKS_PROVIDER, "name": FIREWORKS_CHAT_MODEL.lower()},
    )

    if chat_models:
        chat_model_id = str(chat_models[0].get("id", ""))
        logger.debug(f"Fireworks chat model already exists: {chat_model_id}")
    else:
        chat_model = Model(
            name=FIREWORKS_CHAT_MODEL,
            provider=FIREWORKS_PROVIDER,
            type="language",
            credential=cred.id,
        )
        await chat_model.save()
        chat_model_id = chat_model.id or ""
        logger.info(
            f"Registered Fireworks chat model: {chat_model_id} "
            f"({FIREWORKS_CHAT_MODEL})"
        )

    # Check for existing embedding model
    embed_models = await repo_query(
        "SELECT * FROM model WHERE string::lowercase(provider) = $provider "
        "AND string::lowercase(name) = $name AND string::lowercase(type) = 'embedding' LIMIT 1",
        {"provider": FIREWORKS_PROVIDER, "name": FIREWORKS_EMBEDDING_MODEL.lower()},
    )

    if embed_models:
        embed_model_id = str(embed_models[0].get("id", ""))
        logger.debug(f"Fireworks embedding model already exists: {embed_model_id}")
    else:
        embed_model = Model(
            name=FIREWORKS_EMBEDDING_MODEL,
            provider=FIREWORKS_PROVIDER,
            type="embedding",
            credential=cred.id,
        )
        await embed_model.save()
        embed_model_id = embed_model.id or ""
        logger.info(
            f"Registered Fireworks embedding model: {embed_model_id} "
            f"({FIREWORKS_EMBEDDING_MODEL})"
        )

    return chat_model_id, embed_model_id


async def _seed_defaults(chat_model_id: str, embedding_model_id: str) -> None:
    """Set DefaultModels to point to Fireworks models.

    Only overwrites if:
    - No defaults exist yet (all slots empty), OR
    - VAULT_FORCE_FIREWORKS_DEFAULTS=true
    """
    defaults = await DefaultModels.get_instance()

    # Check if any defaults are already set
    has_existing = any([
        defaults.default_chat_model,
        defaults.default_transformation_model,
        defaults.large_context_model,
        defaults.default_embedding_model,
        defaults.default_tools_model,
    ])

    if has_existing and not FORCE_DEFAULTS:
        logger.info(
            "Default models already configured — skipping Fireworks bootstrap. "
            "Set VAULT_FORCE_FIREWORKS_DEFAULTS=true to override."
        )
        return

    changed = False

    # Always set Fireworks as defaults (either fresh install or forced)
    if not defaults.default_chat_model or FORCE_DEFAULTS:
        defaults.default_chat_model = chat_model_id
        changed = True

    if not defaults.default_transformation_model or FORCE_DEFAULTS:
        defaults.default_transformation_model = chat_model_id
        changed = True

    if not defaults.large_context_model or FORCE_DEFAULTS:
        defaults.large_context_model = chat_model_id
        changed = True

    if not defaults.default_tools_model or FORCE_DEFAULTS:
        defaults.default_tools_model = chat_model_id
        changed = True

    if not defaults.default_embedding_model or FORCE_DEFAULTS:
        defaults.default_embedding_model = embedding_model_id
        changed = True

    if changed:
        await defaults.update()
        logger.success(
            f"Fireworks defaults set: chat={chat_model_id}, "
            f"embedding={embedding_model_id}"
        )
    else:
        logger.debug("No default changes needed")


async def bootstrap_fireworks() -> dict:
    """Run the full Fireworks bootstrap sequence.

    Returns a summary dict for logging/reporting.
    """
    api_key = os.getenv("FIREWORKS_API_KEY")
    if not api_key:
        logger.debug("FIREWORKS_API_KEY not set — skipping Fireworks bootstrap")
        return {"status": "skipped", "reason": "no FIREWORKS_API_KEY"}

    logger.info("=== Fireworks AI Bootstrap ===")

    # Step 1: Ensure credential
    cred = await _ensure_fireworks_credential()
    if not cred:
        return {"status": "failed", "reason": "could not create credential"}

    # Step 2: Ensure models
    chat_model_id, embed_model_id = await _ensure_fireworks_models(cred)

    # Step 3: Seed defaults
    await _seed_defaults(chat_model_id, embed_model_id)

    summary = {
        "status": "ok",
        "credential_id": cred.id,
        "chat_model_id": chat_model_id,
        "embedding_model_id": embed_model_id,
        "force_defaults": FORCE_DEFAULTS,
    }

    logger.info(f"=== Fireworks Bootstrap Complete: {summary} ===")
    return summary
