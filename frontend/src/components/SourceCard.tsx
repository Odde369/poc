import { useState } from "react";
import type { SourceChunk } from "../types";

interface Props {
  source: SourceChunk;
  index: number;
}

export function SourceCard({ source, index }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="source-card">
      <button
        className="source-card-header"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="source-index">[{index}]</span>
        <span className="source-title">{source.title}</span>
        <span className="source-category">{source.category}</span>
        <span className="source-score">
          {Math.round(source.relevance_score * 100)}%
        </span>
        <span className="source-chevron">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <p className="source-content">{source.content}</p>
      )}
    </div>
  );
}
