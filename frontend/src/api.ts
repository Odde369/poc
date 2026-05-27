import type { Message, SourceChunk, ActionCard } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

interface ChatPayload {
  message: string;
  conversation_history: { role: string; content: string }[];
  tenant_id: string;
}

interface ChatResponseRaw {
  answer: string;
  sources: SourceChunk[];
  action_cards: ActionCard[];
}

export async function sendMessage(
  message: string,
  history: Message[]
): Promise<{ answer: string; sources: SourceChunk[]; action_cards: ActionCard[] }> {
  const conversation_history = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const payload: ChatPayload = {
    message,
    conversation_history,
    tenant_id: "demo-tenant",
  };

  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail ?? "Fehler beim Abrufen der Antwort.");
  }

  const data: ChatResponseRaw = await response.json();
  return { answer: data.answer, sources: data.sources, action_cards: data.action_cards ?? [] };
}
