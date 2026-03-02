"""Local Ollama LLM wrapper with lazy imports."""
from __future__ import annotations

import logging
import os

log = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
DEFAULT_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2:11b")


def get_llm(model: str | None = None, temperature: float = 0.3):
    """Return a ChatOllama instance. Imports lazily to avoid hard dependency at module load."""
    from langchain_ollama import ChatOllama

    resolved = model or DEFAULT_MODEL
    log.info("Comply LLM: model=%s temp=%s", resolved, temperature)
    return ChatOllama(
        model=resolved,
        base_url=OLLAMA_BASE_URL,
        temperature=temperature,
    )


async def health_check() -> dict:
    """Check if Ollama is reachable."""
    import httpx
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            models = resp.json().get("models", [])
            return {
                "available": True,
                "provider": "ollama",
                "model": DEFAULT_MODEL,
                "loaded_models": [m["name"] for m in models],
            }
    except Exception as e:
        return {"available": False, "provider": "ollama", "error": str(e)}
