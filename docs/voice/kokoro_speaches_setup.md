# Vault Voice Output Setup

Enable the **Listen** button on AI chat messages, Leaves, and Learning Memory in Vault.

---

## How Vault Voice Output Works

Vault uses **backend-mediated TTS** for voice output:

```
Browser UI (Listen button)
  → Vault frontend TTS wrapper
  → Vault backend POST /api/tts
  → Backend resolves default TTS model + credential server-side
  → Backend calls configured TTS provider
  → Backend returns audio bytes
  → Browser plays audio blob
```

**Security:** Credentials are resolved server-side only. The browser never sees API keys, provider endpoints, or decrypted credentials.

---

## Where Listen Buttons Appear

| Location | What it reads |
|----------|---------------|
| **AI Chat Messages** | The full AI response text |
| **Leaves** | The leaf content |
| **Learning Memory** | The memory leaf content |

---

## Prerequisites

You need a configured TTS model in Vault. Two options:

### Option A: Local TTS with Speaches + Kokoro (Recommended)

Free, private, offline. Uses [Speaches](https://github.com/speaches-ai/speaches) with the Kokoro voice model.

**Quick start:**

```bash
# Start Speaches
docker compose up -d

# Download Kokoro model (~500MB)
docker compose exec speaches uv tool run speaches-cli model download speaches-ai/Kokoro-82M-v1.0-ONNX
```

Then configure in Vault:
1. **Settings → API Keys → Add Credential**
2. Select **OpenAI-Compatible**
3. Base URL: `http://localhost:8969/v1` (or `http://host.docker.internal:8969/v1` if Vault is in Docker)
4. Save and test connection
5. **Settings → Models → Add Model**
6. Provider: `openai_compatible`, Name: `speaches-ai/Kokoro-82M-v1.0-ONNX`
7. Set as default TTS model

See [Local TTS Setup](../5-CONFIGURATION/local-tts.md) for full details.

### Option B: Cloud TTS (OpenAI, ElevenLabs, etc.)

Requires an API key from a cloud provider.

1. **Settings → API Keys → Add Credential**
2. Select your provider (OpenAI, ElevenLabs, etc.)
3. Enter API key
4. Save and test connection
5. **Settings → Models → Add Model**
6. Select the provider and TTS model
7. Set as default TTS model

---

## Setting the Default TTS Model

The Listen button uses Vault's **default text-to-speech model**.

1. Go to **Settings → Models**
2. Find your TTS model in the list
3. Click **Set as Default** next to Text-to-Speech

If no default TTS model is configured, the Listen button will show an error: *"Text-to-speech is not configured yet."*

---

## Testing

### Test the backend endpoint directly

```bash
curl -X POST http://localhost:5055/api/tts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"text": "Hello from Vault!"}' \
  --output test.mp3
```

Play `test.mp3` to verify audio generation works.

### Test in the Vault UI

1. Open any library with AI chat
2. Send a message to generate an AI response
3. Click **Listen** on the AI response
4. Audio should play through your speakers

---

## Common Failure States

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Text-to-speech is not configured yet" | No default TTS model set | Set default TTS model in Settings → Models |
| "Speech generation failed" | TTS provider error | Check Speaches is running / API key is valid |
| "Failed to load TTS model configuration" | Model or credential misconfigured | Verify credential connection in Settings → API Keys |
| No audio plays | Browser autoplay policy | Click the Listen button (user gesture enables audio) |
| Audio is silent | Wrong voice/model | Try a different voice or verify model download |

---

## Available Kokoro Voices

| Voice ID | Description |
|----------|-------------|
| `af_bella` | Clear, professional (female) |
| `af_sarah` | Warm, friendly (female) |
| `am_adam` | Deep, authoritative (male) |
| `am_michael` | Friendly, conversational (male) |
| `bf_emma` | British female, professional |
| `bm_george` | British male, formal |

---

## Architecture Details

### Backend Endpoint

```
POST /api/tts
Body: { "text": "...", "voice": "alloy" }
Response: audio/mpeg bytes
```

- Text length cap: 5,000 characters
- Uses `ModelDefaults.default_text_to_speech_model`
- Resolves model → credential server-side
- Returns raw audio bytes (no file storage)

### Frontend Components

- `TTSButton` — Reusable listen/stop button
- `useTts` hook — Manages audio playback state
- `ttsApi` — API wrapper for `/api/tts`

---

## Related

- [Local TTS Setup](../5-CONFIGURATION/local-tts.md) — Full Speaches/Kokoro setup guide
- [Local STT Setup](../5-CONFIGURATION/local-stt.md) — Speech-to-text setup
- [AI Providers](../5-CONFIGURATION/ai-providers.md) — All provider configuration
