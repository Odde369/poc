import json
import os
from app.models.schemas import ActionCard

_sitemap: list[dict] | None = None


def _load() -> list[dict]:
    global _sitemap
    if _sitemap is None:
        path = os.path.join(os.path.dirname(__file__), "..", "..", "data", "mock_sitemap.json")
        with open(path, "r", encoding="utf-8") as f:
            _sitemap = json.load(f)
    return _sitemap


# Tool definition passed to Claude
TOOL_SPEC = {
    "name": "get_navigation",
    "description": (
        "Sucht in der EPR Cloud App nach passenden Navigationspunkten und App-Bereichen. "
        "Verwende dieses Tool, wenn der Nutzer nach einer bestimmten Funktion sucht, "
        "zu einem Bereich navigieren möchte, oder wenn du eine direkte App-Navigation empfehlen willst."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Suchbegriff, z.B. 'Mengenmeldung VerpackG' oder 'Fristen Kalender'",
            }
        },
        "required": ["query"],
    },
}


def execute(query: str, max_results: int = 3) -> tuple[list[ActionCard], str]:
    """Returns matching action cards and a JSON string for the tool_result message."""
    query_lower = query.lower()
    scored: list[tuple[int, dict]] = []

    for entry in _load():
        score = 0
        for kw in entry["keywords"]:
            if kw in query_lower:
                score += 2
            elif any(word in kw for word in query_lower.split()):
                score += 1
        if any(word in entry["title"].lower() for word in query_lower.split()):
            score += 3
        if score > 0:
            scored.append((score, entry))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = [e for _, e in scored[:max_results]]

    cards = [
        ActionCard(
            id=e["id"],
            title=e["title"],
            description=e["description"],
            route=e["route"],
            icon=e["icon"],
            category=e["category"],
        )
        for e in top
    ]

    result_text = (
        f"Gefundene Navigationspunkte für '{query}':\n"
        + "\n".join(f"- {c.title}: {c.description} (Route: {c.route})" for c in cards)
        if cards
        else f"Keine passenden Navigationspunkte für '{query}' gefunden."
    )

    return cards, result_text
