# EPR Cloud Chatbot – Proof of Concept

Dokumentation der technischen Architektur, des Datenflusses und aller relevanten Code-Komponenten.

---

## Inhaltsverzeichnis

1. [Projektüberblick](#1-projektüberblick)
2. [Architekturübersicht](#2-architekturübersicht)
3. [Verzeichnisstruktur](#3-verzeichnisstruktur)
4. [Backend – Komponenten im Detail](#4-backend--komponenten-im-detail)
   - [API-Schicht (FastAPI)](#41-api-schicht-fastapi)
   - [RAG-Pipeline](#42-rag-pipeline)
   - [Orchestrator & Tool-Calling](#43-orchestrator--tool-calling)
   - [Sitemap-Tool](#44-sitemap-tool)
   - [Datenmodelle](#45-datenmodelle)
5. [Frontend – Komponenten im Detail](#5-frontend--komponenten-im-detail)
   - [Zustandsverwaltung (App.tsx)](#51-zustandsverwaltung-apptsx)
   - [HTTP-Client (api.ts)](#52-http-client-apits)
   - [Komponenten-Baum](#53-komponenten-baum)
   - [Mockup-Previews](#54-mockup-previews)
6. [Kompletter Request-Lifecycle](#6-kompletter-request-lifecycle)
7. [Mock-Daten](#7-mock-daten)
8. [Schnellstart](#8-schnellstart)
9. [Beispielfragen](#9-beispielfragen)
10. [Abgrenzung zur Zielarchitektur](#10-abgrenzung-zur-zielarchitektur)

---

## 1. Projektüberblick

Dieser PoC demonstriert einen RAG-basierten KI-Assistenten für EPR-Compliance-Fragen. Er beantwortet Nutzerfragen ausschließlich auf Basis einer kuratiert Wissensbasis (Grounding) und kann aktiv in App-Bereiche navigieren (Sitemap-Tool mit Claude Tool-Calling).

**Kernfunktionen:**
- Beantwortet Fragen zu VerpackG, ElektroG, Batteriegesetz, PROs, internationaler EPR
- Zitiert Quellen in jeder Antwort (`[Quelle N]`)
- Erkennt Navigationswünsche und zeigt klickbare Action Cards
- Zeigt Mockup-Previews der jeweiligen App-Sektion

---

## 2. Architekturübersicht

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (React)                             │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ ChatInput│  │MessageBubble │  │  SourceCard  │  │ActionCard  │ │
│  └────┬─────┘  └──────┬───────┘  └──────────────┘  │+ Mockup    │ │
│       │               │                             └────────────┘ │
└───────┼───────────────┼─────────────────────────────────────────────┘
        │ POST /chat    │ JSON Response
        ▼               ▲
┌───────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                                 │
│                                                                   │
│  main.py  ──▶  retrieve()  ──▶  ChromaDB (In-Memory)             │
│              (RAG Retriever)    all-MiniLM-L6-v2 Embeddings       │
│                   │                    ▲                          │
│                   │              mock_knowledge.json              │
│                   ▼                   (50 Chunks)                 │
│             orchestrator.chat()                                   │
│                   │                                               │
│        ┌──────────┴──────────┐                                    │
│        │                     │                                    │
│        ▼                     ▼                                    │
│   Anthropic API         Tool: get_navigation()                    │
│   claude-sonnet-4-6          │                                    │
│        │                     ▼                                    │
│        │             sitemap.execute()                            │
│        │             mock_sitemap.json                            │
│        │             (20 App-Sektionen)                           │
│        ▼                     │                                    │
│    Final Answer  ◀───────────┘                                    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

**Zwei Datenpfade parallel:**

| Pfad | Zweck | Technologie |
|------|-------|-------------|
| **RAG-Pfad** | Unstrukturiertes Wissen (Gesetze, Erklärungen) | ChromaDB + Embeddings |
| **Tool-Pfad** | Strukturierte App-Navigation | Claude Tool-Calling + JSON-Sitemap |

---

## 3. Verzeichnisstruktur

```
poc_chatbot/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI-App, CORS, /chat-Endpoint
│   │   ├── orchestrator.py      # Claude-Integration, Tool-Calling-Loop
│   │   ├── models/
│   │   │   └── schemas.py       # Pydantic-Datenmodelle
│   │   ├── rag/
│   │   │   ├── knowledge_base.py  # ChromaDB initialisieren & befüllen
│   │   │   └── retriever.py       # Vektorsuche, gibt SourceChunks zurück
│   │   └── tools/
│   │       └── sitemap.py         # Tool-Definition + Keyword-Suche
│   ├── data/
│   │   ├── mock_knowledge.json  # 50 EPR-Wissens-Chunks
│   │   └── mock_sitemap.json    # 20 App-Navigationspunkte
│   ├── .env                     # ANTHROPIC_API_KEY (nicht einchecken!)
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── App.tsx              # Zentraler State, Layout
        ├── api.ts               # HTTP-Client (fetch)
        ├── types.ts             # TypeScript-Interfaces
        └── components/
            ├── ChatInput.tsx       # Eingabefeld + Senden-Button
            ├── MessageBubble.tsx   # Chat-Bubble mit Markdown-Rendering
            ├── SourceCard.tsx      # Aufklappbare Quellenkarte
            ├── ActionCardItem.tsx  # Navigations-Card mit Vorschau-Button
            └── MockupPreview.tsx   # Mini-Screenshot-Mockups der App-Sektionen
```

---

## 4. Backend – Komponenten im Detail

### 4.1 API-Schicht (FastAPI)

**`app/main.py`** – Einstiegspunkt der Anwendung.

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    get_collection()   # ChromaDB beim Start befüllen (warmup)
    yield

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    # 1. RAG: relevante Chunks abrufen
    sources = retrieve(request.message, n_results=5)

    # 2. Orchestrator: Claude aufrufen (mit optionalem Tool-Calling)
    answer, action_cards = chat(
        message=request.message,
        conversation_history=request.conversation_history,
        sources=sources,
    )

    # 3. Antwort + Quellen + Action Cards zurückgeben
    return ChatResponse(answer=answer, sources=sources, action_cards=action_cards)
```

Der Endpoint ist bewusst synchron (`def`, nicht `async def`), da ChromaDB und der Anthropic-Client blockierend sind. FastAPI führt synchrone Endpoints automatisch in einem Thread-Pool aus.

---

### 4.2 RAG-Pipeline

Die RAG-Pipeline besteht aus zwei Dateien:

#### Knowledge Base (`app/rag/knowledge_base.py`)

Lädt die Mock-Chunks einmalig in eine In-Memory ChromaDB-Collection und hält sie als Singleton im Prozess.

```python
def get_collection() -> chromadb.Collection:
    global _collection
    if _collection is not None:
        return _collection                          # Singleton-Guard

    client = chromadb.EphemeralClient()             # In-Memory, kein Disk-I/O
    ef = embedding_functions.DefaultEmbeddingFunction()  # all-MiniLM-L6-v2

    collection = client.get_or_create_collection(
        name="epr_knowledge",
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"},          # Cosine-Ähnlichkeit
    )

    # JSON laden → Embeddings generieren → in ChromaDB schreiben
    with open("data/mock_knowledge.json") as f:
        chunks = json.load(f)

    collection.add(
        ids=[c["id"] for c in chunks],
        documents=[c["content"] for c in chunks],   # wird eingebettet
        metadatas=[{"title": c["title"], "category": c["category"]} for c in chunks],
    )

    _collection = collection
    return _collection
```

**Embedding-Modell:** ChromaDB's `DefaultEmbeddingFunction` nutzt `sentence-transformers/all-MiniLM-L6-v2` (wird beim ersten Start automatisch heruntergeladen, ~80 MB).

#### Retriever (`app/rag/retriever.py`)

Wandelt eine Nutzerfrage in einen Embedding-Vektor um und sucht die 5 ähnlichsten Chunks.

```python
def retrieve(query: str, n_results: int = 5) -> list[SourceChunk]:
    collection = get_collection()
    results = collection.query(query_texts=[query], n_results=n_results)

    # Cosine-Distanz → Relevanz-Score (0–1, höher = besser)
    for chunk_id, doc, meta, dist in zip(
        results["ids"][0], results["documents"][0],
        results["metadatas"][0], results["distances"][0]
    ):
        sources.append(SourceChunk(
            ...,
            relevance_score=round(1 - dist, 4),     # Distanz invertieren
        ))

    return sources
```

**Was intern passiert:**
1. `query_texts=["Wann muss ich mich bei LUCID registrieren?"]`
2. ChromaDB bettet die Frage mit demselben Modell ein → Vektor `[0.12, -0.34, ...]`
3. HNSW-Index sucht die 5 Vektoren mit kleinster Cosine-Distanz
4. Ergebnis: z.B. `verpackg-002` (Relevanz 0.82), `verpackg-001` (0.74), ...

---

### 4.3 Orchestrator & Tool-Calling

**`app/orchestrator.py`** – Herzstück des Systems. Koordiniert RAG-Kontext, Claude-Aufrufe und den Tool-Calling-Loop.

#### System-Prompt

```python
SYSTEM_PROMPT = """Du bist der KI-Assistent der EPR Cloud Plattform...

1. Beantworte Fragen ausschließlich auf Basis der dir bereitgestellten Quellen.
2. Zitiere relevante Quellen mit [Quelle N].
3. Falls die Antwort nicht in den Quellen ist, sage das klar.
4. Gib keine Rechtsberatung.
5. Nutze get_navigation, wenn der Nutzer zu einem App-Bereich navigieren möchte.
6. Du bist ein KI-System gemäß EU AI Act Art. 50."""
```

#### Kontext-Aufbau

Die RAG-Chunks werden als strukturierter Block **vor** die eigentliche Nutzerfrage gestellt:

```python
def _build_context_block(sources: list[SourceChunk]) -> str:
    lines = ["**Verfügbare Quellen:**\n"]
    for i, src in enumerate(sources, 1):
        lines.append(f"[Quelle {i}] {src.title} (Kategorie: {src.category})")
        lines.append(src.content)
        lines.append("")
    return "\n".join(lines)

# Ergebnis im messages-Array:
# {"role": "user", "content": "[Quelle 1] LUCID-Registrierungspflicht...\n\n**Nutzerfrage:** Wann muss ich mich registrieren?"}
```

#### Tool-Calling-Loop

Claude kann während eines Turns das Tool `get_navigation` aufrufen. Das erfordert einen **agentic loop** – der Loop läuft so lange, bis Claude mit `stop_reason="end_turn"` antwortet:

```python
def chat(message, conversation_history, sources) -> tuple[str, list[ActionCard]]:
    action_cards = []

    while True:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            tools=[sitemap_tool.TOOL_SPEC],         # Tool anbieten
            messages=messages,
        )

        if response.stop_reason == "end_turn":
            # Claude hat fertig geantwortet → Text extrahieren
            text = next(b.text for b in response.content if hasattr(b, "text"))
            return text, action_cards

        if response.stop_reason == "tool_use":
            # Claude möchte ein Tool aufrufen
            messages.append({"role": "assistant", "content": response.content})

            tool_results = []
            for block in response.content:
                if block.type == "tool_use" and block.name == "get_navigation":
                    cards, result_text = sitemap_tool.execute(block.input["query"])
                    action_cards.extend(cards)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result_text,      # Suchergebnis zurück an Claude
                    })

            messages.append({"role": "user", "content": tool_results})
            # → nächste Iteration: Claude verarbeitet das Tool-Ergebnis
```

**Sequenz bei einem Tool-Call:**

```
Turn 1:  user   → "Wo kann ich meine VerpackG-Mengen melden?"
Turn 1:  claude → tool_use { name: "get_navigation", input: { query: "Mengenmeldung VerpackG" } }
Turn 2:  user   → tool_result { content: "Gefunden: Mengenmeldung – VerpackG (Route: /meldungen/verpackg)..." }
Turn 2:  claude → "Sie können Ihre Mengen im Modul **Mengenmeldung – VerpackG** erfassen [Quelle 2]."
                   stop_reason: "end_turn"
```

---

### 4.4 Sitemap-Tool

**`app/tools/sitemap.py`** – Implementiert die Tool-Definition für Claude und die Keyword-Suche.

#### Tool-Definition (JSON Schema für Claude)

```python
TOOL_SPEC = {
    "name": "get_navigation",
    "description": "Sucht in der EPR Cloud App nach passenden Navigationspunkten...",
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
```

#### Keyword-Suche

Da die Sitemap nur 20 Einträge hat, wird eine einfache, gewichtete Keyword-Suche verwendet (kein Embedding nötig):

```python
def execute(query: str, max_results: int = 3) -> tuple[list[ActionCard], str]:
    query_lower = query.lower()

    for entry in _load():
        score = 0
        for kw in entry["keywords"]:
            if kw in query_lower:        score += 2   # Keyword vollständig enthalten
            elif any(word in kw for word in query_lower.split()):
                                         score += 1   # Teilwort-Treffer
        if any(word in entry["title"].lower() for word in query_lower.split()):
                                         score += 3   # Treffer im Titel: stärker gewichtet

    # Top-3 nach Score sortieren
    scored.sort(key=lambda x: x[0], reverse=True)
    return top[:max_results]
```

---

### 4.5 Datenmodelle

**`app/models/schemas.py`** – alle Pydantic-Modelle:

```python
class ChatRequest(BaseModel):
    message: str
    conversation_history: list[ChatMessage] = []
    tenant_id: Optional[str] = "demo-tenant"    # Vorbereitung für Multi-Tenancy

class SourceChunk(BaseModel):
    id: str                  # z.B. "verpackg-002"
    title: str               # z.B. "LUCID-Registrierungspflicht"
    content: str             # der vollständige Chunk-Text
    category: str            # z.B. "Verpackungsgesetz"
    relevance_score: float   # 0.0–1.0, aus Cosine-Ähnlichkeit

class ActionCard(BaseModel):
    id: str                  # z.B. "mengenmeldung-verpackg"
    title: str               # z.B. "Mengenmeldung – VerpackG"
    description: str
    route: str               # z.B. "/meldungen/verpackg"
    icon: str                # Icon-Name für das Frontend
    category: str

class ChatResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]
    action_cards: list[ActionCard] = []          # leer wenn kein Tool-Call
```

---

## 5. Frontend – Komponenten im Detail

### 5.1 Zustandsverwaltung (App.tsx)

Der gesamte Chat-State lebt in `App.tsx`. Es gibt keinen externen State-Manager – `useState` reicht für den PoC.

```typescript
const [messages, setMessages] = useState<Message[]>([WELCOME]);
const [loading, setLoading]   = useState(false);
const [error, setError]       = useState<string | null>(null);

const handleSend = async (text: string) => {
    // 1. User-Message sofort in die Liste (optimistic update)
    setMessages(prev => [...prev, { role: "user", content: text, ... }]);
    setLoading(true);

    // 2. Backend-Aufruf
    const { answer, sources, action_cards } = await sendMessage(text, messages);

    // 3. Assistent-Antwort mit allen Metadaten anfügen
    setMessages(prev => [...prev, {
        role: "assistant", content: answer, sources, action_cards, ...
    }]);
};
```

**Konversations-History:** Die letzten 3 Turns (6 Nachrichten) werden bei jedem Request mitgeschickt. Der Orchestrator limitiert dies ebenfalls auf `history[-6:]`, damit der Kontext-Window nicht überläuft.

---

### 5.2 HTTP-Client (api.ts)

```typescript
export async function sendMessage(message, history) {
    const payload = {
        message,
        conversation_history: history.map(m => ({ role: m.role, content: m.content })),
        tenant_id: "demo-tenant",
    };

    const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(await response.json().detail);

    return await response.json(); // { answer, sources, action_cards }
}
```

---

### 5.3 Komponenten-Baum

```
App
├── header.app-header
├── main.chat-area
│   └── MessageBubble  (für jede Nachricht)
│       ├── .bubble-user      (bei role="user")
│       │   └── plain text
│       └── .bubble-assistant (bei role="assistant")
│           ├── .markdown-body
│           │   └── ReactMarkdown + remark-gfm
│           │       (rendert ##, **, Tabellen, Listen, ---)
│           ├── .action-cards-section  (falls action_cards.length > 0)
│           │   └── ActionCardItem × n
│           │       ├── Icon + Titel + Beschreibung
│           │       ├── [Vorschau]-Button
│           │       │   └── MockupPreview  (bei Klick)
│           │       └── [Öffnen →]-Link
│           └── .sources-section  (falls sources.length > 0)
│               └── SourceCard × n
│                   └── aufklappbar: Chunk-Text
└── footer.chat-footer
    └── ChatInput
        ├── textarea  (Enter = Senden, Shift+Enter = Zeilenumbruch)
        └── button.send-button
```

#### Markdown-Rendering (MessageBubble.tsx)

Assistent-Antworten werden mit `react-markdown` gerendert. Das ist wichtig, weil Claude Markdown in seinen Antworten verwendet:

```typescript
import ReactMarkdown from "react-markdown";
import remarkGfm    from "remark-gfm";

<div className="markdown-body">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {message.content}
    </ReactMarkdown>
</div>
```

`remark-gfm` aktiviert GitHub Flavored Markdown: Tabellen, durchgestrichener Text, Task-Listen und automatische Link-Erkennung.

---

### 5.4 Mockup-Previews

**`MockupPreview.tsx`** enthält für jede der 20 App-Sektionen eine eigene React-Komponente, die einen Mini-Screenshot der Sektion simuliert:

| Sektion | Mockup-Typ | Inhalt |
|---------|------------|--------|
| Dashboard | `DashboardMockup` | KPI-Kacheln, Balkendiagramm |
| Fristen-Kalender | `CalendarMockup` | Kalender-Grid mit farbigen Terminen |
| Mengenmeldung (alle 3) | `MengenmeldungMockup` | Formular mit Material/Mengen-Feldern |
| PRO-Management | `ProManagementMockup` | Tabelle mit Systemen & Status-Badges |
| Registrierungen (alle 3) | `RegistrierungMockup` | Status-Liste mit ✅/⚠️ |
| Ländermodule (alle 4) | `LaenderMockup` | Länder-Liste mit Fortschrittsbalken |
| Dokumente | `DokumenteMockup` | Datei-Liste mit Typ-Badge & Datum |
| Berichte | `BerichteMockup` | KPI-Kacheln + 12-Monats-Balkendiagramm |
| Import | `ImportMockup` | Drag&Drop-Upload-Area + Formular |
| Einstellungen (alle 3) | `SettingsMockup` | Toggle-Liste |

Jedes Mockup hat einen simulierten Browser-Tab mit der App-Route:

```typescript
function MiniBar({ route }: { route: string }) {
    return (
        <div className="mockup-bar">
            <div className="mockup-bar-dots">...</div>
            <div className="mockup-bar-url">epr-cloud.de{route}</div>
        </div>
    );
}
```

Das Mapping von Sektions-ID → Mockup-Komponente:

```typescript
const MOCKUP_MAP: Record<string, () => JSX.Element> = {
    "dashboard":              () => <DashboardMockup />,
    "fristen-kalender":       () => <CalendarMockup />,
    "mengenmeldung-verpackg": () => <MengenmeldungMockup route="/meldungen/verpackg" />,
    // ... 17 weitere Einträge
};

export function MockupPreview({ sectionId }: { sectionId: string }) {
    const Render = MOCKUP_MAP[sectionId];
    if (!Render) return null;
    return <Render />;
}
```

---

## 6. Kompletter Request-Lifecycle

Anhand der Frage *"Wo kann ich meine LUCID-Registrierung prüfen?"*:

```
1. NUTZER tippt Frage, drückt Enter
   └── ChatInput.handleKey() → App.handleSend("Wo kann ich...")

2. FRONTEND
   └── User-Message sofort in messages-State (optimistic)
   └── sendMessage() → POST /chat {
         message: "Wo kann ich...",
         conversation_history: [...],
         tenant_id: "demo-tenant"
       }

3. BACKEND – main.py
   └── retrieve("Wo kann ich meine LUCID-Registrierung prüfen?", n_results=5)

4. RAG-RETRIEVER
   └── ChromaDB: Frage einbetten → HNSW-Suche
   └── Ergebnis (nach Relevanz sortiert):
       [0.89] registrierung-lucid  – "LUCID-Registrierung..."
       [0.81] verpackg-002         – "LUCID-Registrierungspflicht..."
       [0.74] zsvr-001             – "Zentrale Stelle Verpackungsregister..."
       [0.71] verpackg-001         – "Verpackungsgesetz Grundlagen..."
       [0.68] epr-cloud-002        – "EPR Cloud Erste Schritte..."

5. ORCHESTRATOR – Erster Claude-Call
   messages = [
     { role: "user", content: "[Quelle 1] LUCID-Registrierung...\n\n**Nutzerfrage:** Wo kann ich..." }
   ]
   tools = [TOOL_SPEC]

   └── Claude antwortet: stop_reason="tool_use"
       tool_use { name: "get_navigation", input: { query: "LUCID-Registrierung" } }

6. SITEMAP-TOOL
   └── execute("LUCID-Registrierung")
   └── Keyword-Scoring:
       "registrierung-lucid"  Score: 8  ← "lucid" +2, "registrierung" +2, Titelwort +3
       "registrierung-ear"    Score: 3
       "dashboard"            Score: 0
   └── Gibt zurück: [ActionCard("registrierung-lucid", ...)]
       result_text: "Gefundene Navigationspunkte: - LUCID-Registrierung: ... (Route: /registrierungen/lucid)"

7. ORCHESTRATOR – Zweiter Claude-Call
   messages += [
     { role: "assistant", content: [tool_use-Block] },
     { role: "user",      content: [tool_result "Gefundene Navigationspunkte..."] }
   ]
   └── Claude antwortet: stop_reason="end_turn"
       "Ihre LUCID-Registrierung können Sie im Bereich **Registrierungen** einsehen [Quelle 1].
        Die Zentrale Stelle Verpackungsregister (ZSVR) verwaltet das Register [Quelle 3].
        Ich habe den passenden App-Bereich für Sie herausgesucht."

8. BACKEND gibt zurück:
   {
     answer: "Ihre LUCID-Registrierung...",
     sources: [5 SourceChunks mit relevance_score],
     action_cards: [{ id: "registrierung-lucid", title: "LUCID-Registrierung", route: "/registrierungen/lucid", ... }]
   }

9. FRONTEND
   └── assistantMsg in messages-State
   └── MessageBubble rendert:
       - Markdown-Text mit [Quelle 1], [Quelle 3] als Text
       - Action Card "LUCID-Registrierung" mit [Vorschau]-Button
       - 5 aufklappbare SourceCards
```

---

## 7. Mock-Daten

### Knowledge Base (`data/mock_knowledge.json`)

50 Chunks in 10 Kategorien:

| Kategorie | Anzahl Chunks | Themen |
|-----------|---------------|--------|
| Verpackungsgesetz | 8 | LUCID, Duale Systeme, Fristen, VE, E-Commerce |
| Elektrogeräte (ElektroG) | 6 | EAR-Registrierung, Gerätekategorien, Rücknahme |
| Batteriegesetz | 4 | BattG, EU-Regulierung 2023, GRS |
| PRO-Management | 3 | PRO-Überblick, Verträge, EPR Cloud |
| Fristen und Termine | 4 | Jahresübersicht, LUCID-Frist, Dashboard |
| Internationales EPR | 4 | Frankreich, Österreich, Polen, Übersicht |
| EPR Cloud Plattform | 7 | Onboarding, Import, Dokumente, API, Rollen |
| Behörden und Register | 2 | ZSVR, LUCID-öffentlich |
| Compliance und Sanktionen | 3 | Bußgelder, Marktüberwachung |
| Glossar / FAQ | 6 | EPR-Begriffe, Inverkehrbringen, Materialarten |

### Sitemap (`data/mock_sitemap.json`)

20 App-Sektionen mit `id`, `title`, `description`, `route`, `icon`, `category`, `keywords`.

Beispiel-Eintrag:
```json
{
  "id": "mengenmeldung-verpackg",
  "title": "Mengenmeldung – VerpackG",
  "description": "Verpackungsmengen erfassen, prüfen und im LUCID-Portal melden",
  "route": "/meldungen/verpackg",
  "icon": "package",
  "category": "Mengenmeldung",
  "keywords": ["verpackg", "verpackungsgesetz", "mengenmeldung", "lucid", "vollständigkeitserklärung"]
}
```

---

## 8. Schnellstart

### Backend

```bash
cd backend

# Virtuelle Umgebung
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

# Dependencies
pip install -r requirements.txt

# API-Key setzen (in backend/.env)
# ANTHROPIC_API_KEY=sk-ant-...

# Server starten
uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

**Beim ersten Start** lädt ChromaDB das Embedding-Modell `all-MiniLM-L6-v2` herunter (~80 MB). Danach startet der Server in unter 2 Sekunden.

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## 9. Beispielfragen

**RAG-only (kein Tool-Call):**
- *"Wann muss ich die Vollständigkeitserklärung einreichen?"*
- *"Was sind die Bußgelder bei Verstößen gegen das Verpackungsgesetz?"*
- *"Welche Gerätekategorien gibt es im ElektroG?"*
- *"Wie funktioniert EPR in Frankreich?"*
- *"Was bedeutet Inverkehrbringen?"*

**Mit Tool-Call (Action Cards):**
- *"Wo melde ich meine VerpackG-Mengen?"*
- *"Wie sehe ich meine anstehenden Fristen?"*
- *"Wo kann ich meine LUCID-Registrierung prüfen?"*
- *"Wo verwalte ich meine PRO-Verträge?"*
- *"Ich möchte Daten per CSV importieren"*

---

## 10. Abgrenzung zur Zielarchitektur

| Feature | PoC | Zielarchitektur (Projektplan) |
|---------|-----|-------------------------------|
| Vektordatenbank | ChromaDB In-Memory | Qdrant (persistent, skalierbar) |
| Suche | Vector Search only | Hybrid Search (Vector + BM25) + Reranking |
| Knowledge Base | 50 statische Chunks | 100–200 Chunks, Ingestion Pipeline (n8n) |
| App-Daten | Keine DB-Anbindung | Read-Only Service Account, Tenant-Filter |
| Tool-Calling | Sitemap-Tool (Keyword) | 8–10 Tools (PROs, Fristen, Pflichten, Sitemap) |
| Konversation | Letzte 3 Turns | Vollständige Conversation-History |
| Streaming | Nein (Blocking) | Ja (SSE/WebSocket) |
| Sicherheit | CORS only | JWT-Validierung, Rate Limiting, Input-Validation |
| Compliance | Disclaimer im UI | Audit-Log, PII-Filter, Citation-Validation |
| Frontend | Standalone React | Eingebettetes Widget mit SSO-Session |
| Authentifizierung | Keine | SSO-Übernahme aus EPR Cloud |
