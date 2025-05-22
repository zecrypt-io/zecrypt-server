import json
from pathlib import Path
from contextvars import ContextVar

# Global translation dict
TRANSLATIONS = {}

# Context variable for per-request language
request_language: ContextVar[str] = ContextVar("request_language", default="en")


def load_translations():
    locales_dir = Path(__file__).parent.parent / "locales"
    for file in locales_dir.glob("*.json"):
        lang = file.stem
        with open(file, "r", encoding="utf-8") as f:
            TRANSLATIONS[lang] = json.load(f)


def set_language(lang: str):
    # Only set known languages
    if lang in TRANSLATIONS:
        request_language.set(lang)
    else:
        request_language.set("en")


def translate(key: str) -> str:
    lang = request_language.get()
    current = TRANSLATIONS.get(lang, {})

    for part in key.split("."):
        if isinstance(current, dict):
            current = current.get(part)
        else:
            return key  # fallback: key itself

    return current or key  # fallback to key if not found
