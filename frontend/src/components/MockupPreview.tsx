import React from "react";
import "./MockupPreview.css";

function MiniBar({ route }: { route: string }) {
  return (
    <div className="mockup-bar">
      <div className="mockup-bar-dots">
        <div className="mockup-bar-dot" />
        <div className="mockup-bar-dot" />
        <div className="mockup-bar-dot" />
      </div>
      <div className="mockup-bar-url">epr-cloud.de{route}</div>
    </div>
  );
}

function DashboardMockup() {
  return (
    <div className="mockup-frame">
      <MiniBar route="/dashboard" />
      <div className="mockup-content">
        <div className="mockup-kpi-row">
          <div className="mockup-kpi red"><div className="mockup-kpi-num">3</div><div className="mockup-kpi-label">Offene Fristen</div></div>
          <div className="mockup-kpi green"><div className="mockup-kpi-num">7</div><div className="mockup-kpi-label">Aktive PROs</div></div>
          <div className="mockup-kpi blue"><div className="mockup-kpi-num">5</div><div className="mockup-kpi-label">Länder</div></div>
          <div className="mockup-kpi orange"><div className="mockup-kpi-num">12</div><div className="mockup-kpi-label">Dokumente</div></div>
        </div>
        <div className="mockup-chart">
          {[55, 80, 40, 90, 65, 75, 50].map((h, i) => (
            <div key={i} className="mockup-bar-item" style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="mockup-chart-labels">
          {["Jan","Feb","Mär","Apr","Mai","Jun","Jul"].map((l) => (
            <div key={l} className="mockup-chart-label">{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarMockup() {
  const days = [
    { label: "Mo", cls: "header" }, { label: "Di", cls: "header" }, { label: "Mi", cls: "header" },
    { label: "Do", cls: "header" }, { label: "Fr", cls: "header" }, { label: "Sa", cls: "header" },
    { label: "So", cls: "header" },
    ...["","","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31"].map((d) => {
      if (!d) return { label: "", cls: "" };
      if (d === "15") return { label: d, cls: "red" };
      if (d === "30") return { label: d, cls: "yellow" };
      if (d === "26") return { label: d, cls: "today" };
      if (["3","10","18"].includes(d)) return { label: d, cls: "green" };
      return { label: d, cls: "" };
    }),
  ].slice(0, 35);

  return (
    <div className="mockup-frame">
      <MiniBar route="/fristen" />
      <div className="mockup-content">
        <div className="mockup-calendar-header">
          <span className="mockup-cal-title">Mai 2026</span>
          <span className="mockup-cal-nav">‹ ›</span>
        </div>
        <div className="mockup-cal-grid">
          {days.map((d, i) => (
            <div key={i} className={`mockup-cal-day ${d.cls}`}>{d.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MengenmeldungMockup({ route }: { route: string }) {
  const rows = [
    { mat: "Kunststoff", val: "1.240 kg" },
    { mat: "Papier/Karton", val: "3.820 kg" },
    { mat: "Glas", val: "540 kg" },
    { mat: "Aluminium", val: "210 kg" },
  ];
  return (
    <div className="mockup-frame">
      <MiniBar route={route} />
      <div className="mockup-content">
        <div className="mockup-form-section">Mengen Q1 2026</div>
        {rows.map((r) => (
          <div key={r.mat} className="mockup-form-row">
            <div className="mockup-form-label">{r.mat}</div>
            <div className="mockup-form-input filled">{r.val}</div>
          </div>
        ))}
        <div className="mockup-form-btn">Zur Prüfung einreichen →</div>
      </div>
    </div>
  );
}

function ProManagementMockup() {
  return (
    <div className="mockup-frame">
      <MiniBar route="/pro-management" />
      <div className="mockup-content">
        <table className="mockup-table">
          <thead>
            <tr><th>System</th><th>Menge</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td>Der Grüne Punkt</td><td>4.200 kg</td><td><span className="mockup-badge green">Aktiv</span></td></tr>
            <tr><td>Interseroh</td><td>1.800 kg</td><td><span className="mockup-badge green">Aktiv</span></td></tr>
            <tr><td>Landbell</td><td>900 kg</td><td><span className="mockup-badge yellow">Prüfung</span></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RegistrierungMockup({ route, title }: { route: string; title: string }) {
  return (
    <div className="mockup-frame">
      <MiniBar route={route} />
      <div className="mockup-content">
        <div className="mockup-status-row">
          <span className="mockup-status-icon">✅</span>
          <div className="mockup-status-text">
            <div>{title}-Registrierung</div>
            <div className="mockup-status-sub">Nr. DE123456789012 · aktiv</div>
          </div>
          <span className="mockup-badge green">Gültig</span>
        </div>
        <div className="mockup-status-row">
          <span className="mockup-status-icon">✅</span>
          <div className="mockup-status-text">
            <div>Systembeteiligung</div>
            <div className="mockup-status-sub">3 duale Systeme aktiv</div>
          </div>
          <span className="mockup-badge green">OK</span>
        </div>
        <div className="mockup-status-row">
          <span className="mockup-status-icon">⚠️</span>
          <div className="mockup-status-text">
            <div>Mengenmeldung 2025</div>
            <div className="mockup-status-sub">Fällig bis 15.05.2026</div>
          </div>
          <span className="mockup-badge yellow">Offen</span>
        </div>
      </div>
    </div>
  );
}

function LaenderMockup({ route, flag, name }: { route: string; flag: string; name: string }) {
  const countries = [
    { flag, name, progress: 85 },
    { flag: "🇫🇷", name: "Frankreich", progress: 60 },
    { flag: "🇦🇹", name: "Österreich", progress: 100 },
    { flag: "🇵🇱", name: "Polen", progress: 40 },
  ].filter((_, i) => i < 4);
  countries[0] = { flag, name, progress: 85 };

  return (
    <div className="mockup-frame">
      <MiniBar route={route} />
      <div className="mockup-content">
        {countries.map((c) => (
          <div key={c.name} className="mockup-country-row">
            <span className="mockup-country-flag">{c.flag}</span>
            <span className="mockup-country-name">{c.name}</span>
            <div className="mockup-progress-bar">
              <div className="mockup-progress-fill" style={{ width: `${c.progress}%` }} />
            </div>
            <span style={{ fontSize: 7, color: "#6b78a8", width: 24, textAlign: "right" }}>{c.progress}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DokumenteMockup() {
  const files = [
    { name: "LUCID-Bestätigung 2025", date: "12.01.2025", ext: "PDF" },
    { name: "VE-Testat 2024", date: "14.05.2024", ext: "PDF" },
    { name: "EAR-Jahresbericht", date: "28.04.2024", ext: "PDF" },
    { name: "PRO-Vertrag Grüner Punkt", date: "01.01.2024", ext: "DOC" },
  ];
  return (
    <div className="mockup-frame">
      <MiniBar route="/dokumente" />
      <div className="mockup-content">
        {files.map((f) => (
          <div key={f.name} className="mockup-file-row">
            <div className="mockup-file-icon">{f.ext}</div>
            <span className="mockup-file-name">{f.name}</span>
            <span className="mockup-file-date">{f.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BerichteMockup() {
  return (
    <div className="mockup-frame">
      <MiniBar route="/berichte" />
      <div className="mockup-content">
        <div className="mockup-kpi-row">
          <div className="mockup-kpi blue"><div className="mockup-kpi-num">6.9 t</div><div className="mockup-kpi-label">Verpackungen</div></div>
          <div className="mockup-kpi green"><div className="mockup-kpi-num">92%</div><div className="mockup-kpi-label">Compliance</div></div>
        </div>
        <div className="mockup-chart" style={{ height: 40 }}>
          {[30, 65, 50, 80, 55, 70, 90, 60, 75, 85, 65, 95].map((h, i) => (
            <div key={i} className="mockup-bar-item" style={{ height: `${h}%`, opacity: i === 11 ? 1 : 0.6 }} />
          ))}
        </div>
        <div className="mockup-chart-labels">
          {["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"].map((l) => (
            <div key={l} className="mockup-chart-label">{l}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ImportMockup() {
  return (
    <div className="mockup-frame">
      <MiniBar route="/import" />
      <div className="mockup-content">
        <div className="mockup-upload-area">
          <div className="mockup-upload-icon">📂</div>
          <div>CSV-Datei hierher ziehen</div>
          <div style={{ color: "#9098a8", marginTop: 2 }}>oder Datei auswählen</div>
        </div>
        <div className="mockup-form-row">
          <div className="mockup-form-label">Zeitraum</div>
          <div className="mockup-form-input filled">Q1 2026</div>
        </div>
        <div className="mockup-form-row">
          <div className="mockup-form-label">Kategorie</div>
          <div className="mockup-form-input filled">VerpackG</div>
        </div>
      </div>
    </div>
  );
}

function SettingsMockup({ route }: { route: string }) {
  const items = [
    { label: "E-Mail-Benachrichtigungen", on: true },
    { label: "Frist-Erinnerungen (30 Tage)", on: true },
    { label: "API-Zugang aktiviert", on: false },
    { label: "Zwei-Faktor-Authentifizierung", on: true },
  ];
  return (
    <div className="mockup-frame">
      <MiniBar route={route} />
      <div className="mockup-content">
        {items.map((it) => (
          <div key={it.label} className="mockup-setting-row">
            <span style={{ color: "#1a2540" }}>{it.label}</span>
            <div className={`mockup-toggle ${it.on ? "on" : "off"}`}>
              <div className="mockup-toggle-knob" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const MOCKUP_MAP: Record<string, () => React.JSX.Element> = {
  dashboard:                    () => <DashboardMockup />,
  "fristen-kalender":           () => <CalendarMockup />,
  "mengenmeldung-verpackg":     () => <MengenmeldungMockup route="/meldungen/verpackg" />,
  "mengenmeldung-elektrog":     () => <MengenmeldungMockup route="/meldungen/elektrog" />,
  "mengenmeldung-battg":        () => <MengenmeldungMockup route="/meldungen/batterien" />,
  "pro-management":             () => <ProManagementMockup />,
  "pro-vertraege":              () => <ProManagementMockup />,
  "registrierung-lucid":        () => <RegistrierungMockup route="/registrierungen/lucid" title="LUCID" />,
  "registrierung-ear":          () => <RegistrierungMockup route="/registrierungen/ear" title="EAR" />,
  "registrierung-batterie":     () => <RegistrierungMockup route="/registrierungen/batterien" title="Batterie" />,
  "laender-deutschland":        () => <LaenderMockup route="/laender/de" flag="🇩🇪" name="Deutschland" />,
  "laender-frankreich":         () => <LaenderMockup route="/laender/fr" flag="🇫🇷" name="Frankreich" />,
  "laender-oesterreich":        () => <LaenderMockup route="/laender/at" flag="🇦🇹" name="Österreich" />,
  "laender-polen":              () => <LaenderMockup route="/laender/pl" flag="🇵🇱" name="Polen" />,
  dokumente:                    () => <DokumenteMockup />,
  berichte:                     () => <BerichteMockup />,
  import:                       () => <ImportMockup />,
  "einstellungen-benutzer":     () => <SettingsMockup route="/einstellungen/benutzer" />,
  "einstellungen-api":          () => <SettingsMockup route="/einstellungen/api" />,
  "einstellungen-benachrichtigungen": () => <SettingsMockup route="/einstellungen/benachrichtigungen" />,
};

interface Props {
  sectionId: string;
}

export function MockupPreview({ sectionId }: Props) {
  const Render = MOCKUP_MAP[sectionId];
  if (!Render) return null;
  return <Render />;
}
