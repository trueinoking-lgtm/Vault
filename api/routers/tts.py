"""
TTS Router

Provides a backend-mediated text-to-speech endpoint.
Credentials are resolved server-side and never exposed to the browser.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from loguru import logger
from pydantic import BaseModel, Field

from open_notebook.ai.models import model_manager
from open_notebook.exceptions import ConfigurationError

router = APIRouter(prefix="/tts", tags=["tts"])

MAX_TTS_TEXT_LENGTH = 5000


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=MAX_TTS_TEXT_LENGTH, description="Text to synthesize")
    voice: str | None = Field(None, description="Optional voice name (provider-specific)")


@router.post("")
async def generate_speech(request: TTSRequest) -> Response:
    """
    Generate speech audio from text using the configured default TTS model.

    Returns audio bytes as audio/mpeg. Credentials are resolved server-side.
    """
    try:
        tts_model = await model_manager.get_text_to_speech()
    except Exception as e:
        logger.error(f"Failed to load TTS model: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to load TTS model configuration.",
        )

    if tts_model is None:
        raise HTTPException(
            status_code=400,
            detail="No text-to-speech model is configured. Please set a default TTS model in Settings → Models.",
        )

    try:
        voice = request.voice or "alloy"
        result = await tts_model.agenerate_speech(text=request.text, voice=voice)

        if result and hasattr(result, "content") and result.content:
            audio_bytes = result.content  # type: ignore[attr-defined]
            return Response(
                content=audio_bytes,
                media_type="audio/mpeg",
                headers={"Content-Disposition": "inline; filename=speech.mp3"},
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="TTS provider returned empty audio.",
            )
    except HTTPException:
        raise
    except ConfigurationError as e:
        logger.error(f"TTS configuration error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Speech generation failed: {str(e)[:200]}",
        )
