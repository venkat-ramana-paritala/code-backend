import requests

import os

OLLAMA_URL = os.getenv("OLLAMA_HOST", "http://localhost:11434") + "/api/generate"
MODEL = "phi3"

def chat_with_ollama(prompt: str) -> str:
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=60   # VERY IMPORTANT
        )

        response.raise_for_status()
        return response.json().get("response", "").strip()

    except requests.exceptions.Timeout:
        return "⚠️ AI is still loading. Try again in a few seconds."

    except Exception as e:
        return f"⚠️ AI error: {str(e)}"
