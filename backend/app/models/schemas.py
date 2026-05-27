from pydantic import BaseModel
from typing import Optional


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: list[ChatMessage] = []
    tenant_id: Optional[str] = "demo-tenant"


class SourceChunk(BaseModel):
    id: str
    title: str
    content: str
    category: str
    relevance_score: float


class ActionCard(BaseModel):
    id: str
    title: str
    description: str
    route: str
    icon: str
    category: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]
    action_cards: list[ActionCard] = []
