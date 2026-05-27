import os
import anthropic
from app.rag.retriever import retrieve
from app.models.schemas import ChatMessage, SourceChunk, ActionCard
from app.tools import sitemap as sitemap_tool

SYSTEM_PROMPT = """Du bist der KI-Assistent der EPR Cloud Plattform. Du hilfst Nutzern bei Fragen rund um Extended Producer Responsibility (EPR), Verpackungsgesetz (VerpackG), ElektroG, Batteriegesetz und die Nutzung der EPR Cloud Plattform.

**Deine Regeln:**
1. Beantworte Fragen ausschließlich auf Basis der dir bereitgestellten Quellen (Kontext-Abschnitte).
2. Zitiere relevante Quellen in deiner Antwort mit [Quelle N] – zum Beispiel: "Laut dem Verpackungsgesetz müssen Sie sich registrieren [Quelle 1]."
3. Falls die Antwort nicht in den Quellen zu finden ist, sage klar: "Zu dieser Frage habe ich leider keine gesicherten Informationen in meiner Wissensbasis. Bitte wenden Sie sich an unseren Support."
4. Gib keine Rechtsberatung. Weise bei rechtlich relevanten Fragen darauf hin, dass ein Rechtsanwalt oder Compliance-Berater hinzugezogen werden sollte.
5. Nutze das Tool `get_navigation`, wenn der Nutzer nach einer Funktion in der App sucht oder wenn du auf einen konkreten App-Bereich hinweisen möchtest. Erkläre kurz, wohin die Navigation führt.
6. Antworte auf Deutsch, präzise und professionell.
7. Du bist ein KI-System im Sinne des EU AI Acts (Art. 50). Mache deutlich, dass du ein KI-Assistent bist."""


def _build_context_block(sources: list[SourceChunk]) -> str:
    lines = ["**Verfügbare Quellen:**\n"]
    for i, src in enumerate(sources, 1):
        lines.append(f"[Quelle {i}] {src.title} (Kategorie: {src.category})")
        lines.append(src.content)
        lines.append("")
    return "\n".join(lines)


def chat(
    message: str,
    conversation_history: list[ChatMessage],
    sources: list[SourceChunk],
) -> tuple[str, list[ActionCard]]:
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    context_block = _build_context_block(sources)
    user_content = f"{context_block}\n\n**Nutzerfrage:** {message}"

    messages: list[dict] = []
    for msg in conversation_history[-6:]:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": user_content})

    action_cards: list[ActionCard] = []

    # Agentic loop: handle tool calls until Claude stops
    while True:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            tools=[sitemap_tool.TOOL_SPEC],
            messages=messages,
        )

        if response.stop_reason == "end_turn":
            text = next(
                (block.text for block in response.content if hasattr(block, "text")),
                "",
            )
            return text, action_cards

        if response.stop_reason == "tool_use":
            # Add assistant message with tool_use block
            messages.append({"role": "assistant", "content": response.content})

            tool_results = []
            for block in response.content:
                if block.type != "tool_use":
                    continue
                if block.name == "get_navigation":
                    cards, result_text = sitemap_tool.execute(block.input.get("query", ""))
                    action_cards.extend(cards)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result_text,
                    })

            messages.append({"role": "user", "content": tool_results})
            continue

        # Unexpected stop reason – return whatever text we have
        text = next(
            (block.text for block in response.content if hasattr(block, "text")),
            "Es ist ein Fehler aufgetreten.",
        )
        return text, action_cards
