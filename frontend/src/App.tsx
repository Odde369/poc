import { useRef, useEffect, useState } from "react";
import type { Message } from "./types";
import { sendMessage } from "./api";
import { MessageBubble } from "./components/MessageBubble";
import { ChatInput } from "./components/ChatInput";
import "./App.css";

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Guten Tag! Ich bin der KI-Assistent der EPR Cloud – ein KI-System gemäß EU AI Act Art. 50.\n\nIch helfe Ihnen bei Fragen zu Extended Producer Responsibility (EPR), dem Verpackungsgesetz (VerpackG), ElektroG, Batteriegesetz und der Nutzung der EPR Cloud Plattform.\n\nWie kann ich Ihnen helfen?",
  timestamp: new Date(),
};

function App() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (text: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const { answer, sources, action_cards } = await sendMessage(text, messages);
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: answer,
        sources,
        action_cards,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-inner">
          <span className="header-logo">EPR Cloud</span>
          <span className="header-badge">KI-Assistent · PoC</span>
        </div>
      </header>

      <main className="chat-area">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {loading && (
          <div className="message-wrapper assistant">
            <div className="bubble bubble-assistant loading">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}

        {error && <div className="error-bar">Fehler: {error}</div>}

        <div ref={bottomRef} />
      </main>

      <footer className="chat-footer">
        <ChatInput onSend={handleSend} disabled={loading} />
        <p className="disclaimer">
          Dieser KI-Assistent gibt keine Rechtsberatung. Bei komplexen
          Compliance-Fragen wenden Sie sich bitte an einen Rechtsanwalt.
        </p>
      </footer>
    </div>
  );
}

export default App;
