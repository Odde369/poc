import { useState } from "react";
import type { ActionCard } from "../types";
import { MockupPreview } from "./MockupPreview";

const ICONS: Record<string, string> = {
  grid:       "M3 3h7v7H3zm0 11h7v7H3zm11-11h7v7h-7zm0 11h7v7h-7z",
  calendar:   "M8 2v3M16 2v3M3 8h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
  package:    "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM12 2l7 4-7 4-7-4z",
  zap:        "M13 2 3 14h9l-1 8 10-12h-9l1-8z",
  battery:    "M17 7H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm3 4h1M9 11h6",
  briefcase:  "M20 7H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-8-4H8v4h8V3h-4z",
  "file-text":"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  shield:     "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  "map-pin":  "M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  folder:     "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
  "bar-chart":"M12 20V10M18 20V4M6 20v-6",
  upload:     "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  users:      "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  code:       "M16 18l6-6-6-6M8 6l-6 6 6 6",
  bell:       "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
};

interface Props {
  card: ActionCard;
}

export function ActionCardItem({ card }: Props) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const d = ICONS[card.icon] ?? ICONS.grid;

  return (
    <div className={`action-card-wrapper ${previewOpen ? "preview-open" : ""}`}>
      <div className="action-card-row">
        <span className="action-card-icon">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
            <path d={d} stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>

        <span className="action-card-body">
          <span className="action-card-title">{card.title}</span>
          <span className="action-card-desc">{card.description}</span>
        </span>

        <div className="action-card-actions">
          <button
            className="preview-toggle"
            onClick={() => setPreviewOpen((v) => !v)}
            title={previewOpen ? "Vorschau ausblenden" : "Vorschau anzeigen"}
          >
            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
              {previewOpen
                ? <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></>
              }
            </svg>
            {previewOpen ? "Schließen" : "Vorschau"}
          </button>

          <a
            href={`#${card.route}`}
            className="action-card-nav-btn"
            onClick={(e) => {
              e.preventDefault();
              alert(`Navigation zu: ${card.route}\n(Im PoC noch nicht verdrahtet)`);
            }}
          >
            Öffnen →
          </a>
        </div>
      </div>

      {previewOpen && (
        <div className="action-card-preview">
          <MockupPreview sectionId={card.id} />
        </div>
      )}
    </div>
  );
}
