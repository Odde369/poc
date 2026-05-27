import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import ChatRequest, ChatResponse
from app.rag.retriever import retrieve
from app.orchestrator import chat
from app.rag.knowledge_base import get_index


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_index()
    yield


app = FastAPI(
    title="EPR Cloud Chatbot API",
    description="Proof of Concept – RAG-basierter KI-Assistent für EPR-Compliance",
    version="0.1.0",
    lifespan=lifespan,
)

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "epr-chatbot-poc"}


@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Nachricht darf nicht leer sein.")

    sources = retrieve(request.message, n_results=5)

    answer, action_cards = chat(
        message=request.message,
        conversation_history=request.conversation_history,
        sources=sources,
    )

    return ChatResponse(answer=answer, sources=sources, action_cards=action_cards)
