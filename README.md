<a id="readme-top"></a>

<div align="center">
  <a href="https://github.com/trueinoking-lgtm/Vault">
    <img src="docs/assets/hero.svg" alt="Vault — a book encased in golden chains">
  </a>

  <h1>Vault</h1>

  <p>
    An AI-powered learning workspace for turning materials into structured study leaves, guided review, and persistent learning memory.
  </p>
</div>

---

## What is Vault?

Vault is a self-hosted, privacy-focused research and learning assistant. Upload multi-modal content — PDFs, audio, video, web pages — organize it into libraries, and use AI to transform raw materials into structured study notes with persistent memory.

**Key principles:**
- 🔒 **Privacy first** — your data stays on your machine
- 🤖 **Multi-provider AI** — OpenAI, Anthropic, Google, Ollama, and 15+ more
- 📚 **Library-based organization** — group related materials into libraries
- 🧠 **Persistent learning memory** — track what you've learned and where you're weak
- ✅ **Guided review** — check your answers and save weak spots for later

---

## Core Concepts

### Libraries

Libraries are the top-level containers for your research. Each library groups related materials and provides its own chat, notes, and learning memory. Think of a library as a course, project, or topic area.

### Materials

Materials are the raw content you add to a library — PDFs, URLs, audio files, video, or pasted text. Vault processes and indexes each material so it can be searched, discussed, and transformed by AI.

### Leaves

Leaves are structured study notes created from materials. They capture summaries, key insights, and lessons in a persistent format. Each leaf is linked to its source material and lives inside a library.

### Learning Memory

Learning Memory is a special leaf that tracks your learning journey. It records study sessions, quiz results, and saved weak spots over time. Vault uses it to generate targeted review sessions.

### Review and Answer Checking

After a study session, Vault can grade your answers against the source material. It marks responses as Correct, Partial, or Incorrect, explains reasoning, reveals correct answers, and summarizes weak spots. You can optionally save weak spots to Learning Memory for later review.

### Command Center

The Command Center (`/vault`) is your central dashboard. It provides quick actions (add material, create leaf, ask a question, review memory), shows your most recently active libraries, displays learning progress across libraries, and lets you resume studying where you left off.

---

## Features

### Content and Organization
- **Multi-modal import** — PDFs, URLs, audio, video, Office docs, plain text
- **Library management** — create, archive, and organize libraries
- **Material processing** — automatic content extraction and indexing
- **Leaf editor** — create and edit structured study notes
- **Bulk operations** — batch import materials and manage context

### AI-Powered
- **18+ AI providers** — OpenAI, Anthropic, Google, Groq, Ollama, Mistral, DeepSeek, xAI, and more
- **Context-aware chat** — conversations powered by your library's materials and notes
- **Knowledge base search** — full-text and vector semantic search
- **Content transformations** — customizable prompts to summarize, extract insights, or generate structured outputs
- **Answer grading** — check your responses and get feedback with weak-spot identification

### Learning
- **Learning Memory** — persistent study tracking across sessions
- **Weak-spot saving** — optionally save graded weak spots for later review
- **Review sessions** — generate practice questions from your learning memory
- **Command Center** — central dashboard for quick actions and progress

### Advanced
- **Podcast generation** — multi-speaker AI podcast episodes from your research
- **REST API** — full programmatic access to all features
- **Multi-language UI** — English, Portuguese, Chinese, Japanese, Russian, Bengali, and more
- **Optional authentication** — password protection for shared deployments

---

## Provider Support

Thanks to the [Esperanto](https://github.com/lfnovo/esperanto) library, Vault supports these AI providers out of the box:

| Provider | LLM | Embedding | STT | TTS |
|----------|-----|-----------|-----|-----|
| OpenAI | ✅ | ✅ | ✅ | ✅ |
| Anthropic | ✅ | ❌ | ❌ | ❌ |
| Google (GenAI) | ✅ | ✅ | ✅ | ✅ |
| Groq | ✅ | ❌ | ✅ | ❌ |
| Ollama | ✅ | ✅ | ❌ | ❌ |
| Mistral | ✅ | ✅ | ✅ | ✅ |
| DeepSeek | ✅ | ❌ | ❌ | ❌ |
| xAI | ✅ | ❌ | ❌ | ✅ |
| Azure OpenAI | ✅ | ✅ | ✅ | ✅ |
| Vertex AI | ✅ | ✅ | ❌ | ✅ |
| OpenRouter | ✅ | ✅ | ❌ | ❌ |
| ElevenLabs | ❌ | ❌ | ✅ | ✅ |
| Deepgram | ❌ | ❌ | ❌ | ✅ |
| Voyage | ❌ | ✅ | ❌ | ❌ |
| DashScope (Qwen) | ✅ | ❌ | ❌ | ❌ |
| MiniMax | ✅ | ❌ | ❌ | ❌ |
| Perplexity | ✅ | ❌ | ❌ | ❌ |
| OpenAI Compatible* | ✅ | ✅ | ✅ | ✅ |

*Supports LM Studio and any OpenAI-compatible endpoint.

---

## Tech Stack

- **Frontend** — Next.js 16, React 19, TypeScript, Tailwind CSS, Shadcn/ui
- **Backend** — Python 3.11+, FastAPI, LangGraph workflows
- **Database** — SurrealDB (graph database with vector search)
- **AI** — Esperanto library for multi-provider support

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Quick Start

1. **Get the compose file**

   ```bash
   curl -o docker-compose.yml https://raw.githubusercontent.com/lfnovo/open-notebook/main/docker-compose.yml
   ```

2. **Set your encryption key**

   Open `docker-compose.yml` and replace the `OPEN_NOTEBOOK_ENCRYPTION_KEY` value with any secret string.

3. **Start services**

   ```bash
   docker compose up -d
   ```

4. **Open Vault** at `http://localhost:8502` and configure your AI provider in Settings.

> **Note:** Vault uses the same backend infrastructure as Open Notebook. The Docker setup above pulls the upstream backend image, which is fully compatible with Vault's frontend.

### More Options

- **Ollama (free local AI)** — see `examples/docker-compose-ollama.yml`
- **From source** — see `docs/1-INSTALLATION/from-source.md`
- **Full installation guide** — see `docs/1-INSTALLATION/index.md`

---

## Documentation

- **[Getting Started](docs/0-START-HERE/index.md)** — introduction and first steps
- **[Installation](docs/1-INSTALLATION/index.md)** — deployment guides
- **[Core Concepts](docs/2-CORE-CONCEPTS/index.md)** — architecture and how things work
- **[User Guide](docs/3-USER-GUIDE/index.md)** — tutorials for materials, leaves, chat, search
- **[AI Providers](docs/4-AI-PROVIDERS/index.md)** — model configuration
- **[Configuration](docs/5-CONFIGURATION/index.md)** — settings and security
- **[Development](docs/7-DEVELOPMENT/index.md)** — contributing and architecture

---

## Development

Vault welcomes contributions. See the [Contributing Guide](docs/7-DEVELOPMENT/contributing.md) for details.

**Current tech stack:** Python, FastAPI, Next.js, React, SurrealDB, LangGraph

---

## Attribution

Vault began as a heavily modified fork of [Open Notebook](https://github.com/lfnovo/open-notebook) by Luis Novo, used under the MIT License. Open Notebook is an open-source, privacy-focused AI research assistant that provides the foundation for Vault's backend, database schema, and AI provider integrations.

Vault preserves all required license notices and copyright attribution. The MIT license file remains unchanged.

**Open Notebook** — [GitHub](https://github.com/lfnovo/open-notebook) · [Website](https://www.open-notebook.ai) · [MIT License](LICENSE)

---

## License

Vault is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Copyright (c) 2024 Luis Novo — retained from Open Notebook.

---

<p align="right">(<a href="#readme-top">back to top</a>)</p>
