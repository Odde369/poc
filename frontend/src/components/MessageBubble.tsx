import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "../types";
import { SourceCard } from "./SourceCard";
import { ActionCardItem } from "./ActionCardItem";

interface Props {
  message: Message;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const visibleSources = message.sources?.filter(s => s.relevance_score > 0) ?? [];

  return (
    <div className={`message-wrapper ${isUser ? "user" : "assistant"}`}>
      {!isUser && (
        <div className="assistant-avatar">
          <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
            <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
            <path
              d="M9 9h.01M15 9h.01M9 14s1 2 3 2 3-2 3-2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      <div className="bubble-column">
        <div className={`bubble ${isUser ? "bubble-user" : "bubble-assistant"}`}>
          {isUser ? (
            <p className="bubble-text-plain">{message.content}</p>
          ) : (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && message.action_cards && message.action_cards.length > 0 && (
          <div className="action-cards-section">
            <p className="action-cards-label">
              <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
                <path d="M8 1l1.5 3 3.5.5-2.5 2.5.5 3.5L8 9l-3 1.5.5-3.5L3 4.5 6.5 4z"
                  stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              </svg>
              Direkt navigieren
            </p>
            <div className="action-cards-list">
              {message.action_cards.map((card) => (
                <ActionCardItem key={card.id} card={card} />
              ))}
            </div>
          </div>
        )}

        {!isUser && visibleSources.length > 0 && (
          <div className="sources-section">
            <p className="sources-label">
              <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
                <path d="M2 3h12M2 6h12M2 9h7" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Quellen ({visibleSources.length})
            </p>
            <div className="sources-list">
              {visibleSources.map((src, i) => (
                <SourceCard key={src.id} source={src} index={i + 1} />
              ))}
            </div>
          </div>
        )}

        <div className="bubble-time">
          {message.timestamp.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
