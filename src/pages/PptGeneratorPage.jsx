/**
 * PptGeneratorPage.jsx
 *
 * Standalone PPT Generator page with:
 *  - Document upload (reads original doc directly — no summary step)
 *  - AI Wizard (audience, tone, slide count, theme, chart density, etc.)
 *  - Progress tracking
 *  - PPT History (list, download, delete, filter)
 *
 * Drop this file into your React frontend src/pages/ or src/components/.
 * Adjust the API_BASE constant if your backend runs on a different URL.
 */

import { useState, useRef, useEffect, useCallback } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const API_BASE = "/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(bytes) {
  if (!bytes) return "–";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
function fmtDate(d) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
const EXT_ICON = { pdf: "📄", docx: "📝", doc: "📝", txt: "📃", xlsx: "📊", xls: "📊", csv: "📊", png: "🖼️", jpg: "🖼️", jpeg: "🖼️" };
function fileIcon(name = "") { const ext = name.split(".").pop().toLowerCase(); return EXT_ICON[ext] || "📎"; }

// ── Themes and options ────────────────────────────────────────────────────────
const THEMES = [
  { key: "Professional", label: "Professional", color: "#1E2761" },
  { key: "Modern",       label: "Modern",       color: "#0D1B2A" },
  { key: "Minimal",      label: "Minimal",       color: "#0F3D3E" },
  { key: "Corporate",    label: "Corporate",     color: "#1E2761" },
  { key: "Creative",     label: "Creative",      color: "#1B4332" },
  { key: "Dark",         label: "Dark",          color: "#231F20" },
  { key: "Finance",      label: "Finance",       color: "#1E2761" },
  { key: "Healthcare",   label: "Healthcare",    color: "#0F3D3E" },
];

const AUDIENCES = ["Executive/C-Suite", "Business Stakeholders", "Technical Team", "General Audience", "Investors", "Clients", "Students", "Medical Professionals"];
const PURPOSES  = ["Inform and present findings", "Pitch / Persuade", "Training / Education", "Project status update", "Financial review", "Strategy presentation", "Research presentation"];
const DENSITY   = ["Concise", "Balanced", "Detailed"];
const CHART_STYLES = ["Charts where useful", "Minimal charts", "Rich with charts"];
const SPEAKER_NOTES = ["Yes, include notes", "No notes"];
const SECTIONS_LIST = ["Agenda", "Executive Summary", "Key Findings", "Data Analysis", "Recommendations", "Conclusion"];

// ── Subcomponents ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, label, stage }) {
  const colors = { uploading: "#3b82f6", extracting: "#8b5cf6", ai: "#f59e0b", done: "#10b981", error: "#ef4444" };
  const color = colors[stage] || "#3b82f6";
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: "#94a3b8" }}>
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div style={{ background: "#1e293b", borderRadius: 99, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function WizardOption({ label, value, selected, onClick }) {
  return (
    <button onClick={() => onClick(value)} style={{
      padding: "8px 14px", borderRadius: 8, border: `2px solid ${selected ? "#6366f1" : "#334155"}`,
      background: selected ? "rgba(99,102,241,0.15)" : "transparent",
      color: selected ? "#a5b4fc" : "#94a3b8", cursor: "pointer", fontSize: 13,
      transition: "all 0.15s", fontWeight: selected ? 600 : 400,
    }}>{label}</button>
  );
}

function ThemeCard({ theme, selected, onClick }) {
  return (
    <button onClick={() => onClick(theme.key)} style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      padding: "12px 10px", borderRadius: 10, border: `2px solid ${selected ? "#6366f1" : "#334155"}`,
      background: selected ? "rgba(99,102,241,0.1)" : "#0f172a",
      cursor: "pointer", minWidth: 90, transition: "all 0.15s",
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.color, border: "2px solid rgba(255,255,255,0.1)" }} />
      <span style={{ fontSize: 11, color: selected ? "#a5b4fc" : "#64748b", fontWeight: selected ? 600 : 400 }}>{theme.label}</span>
    </button>
  );
}

function HistoryCard({ pres, onDownload, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div style={{
      background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12,
      padding: "16px 20px", display: "flex", alignItems: "center", gap: 16,
      transition: "border-color 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#334155"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#1e293b"}
    >
      {/* Icon */}
      <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 22 }}>
        🎞️
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, color: "#e2e8f0", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {pres.filename}
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>📁 {pres.sourceFilename || "—"}</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>🗓 {fmtDate(pres.createdAt)}</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>📐 {pres.slideCount} slides</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>💾 {fmt(pres.sizeBytes)}</span>
          {pres.generatedBy === "claude-ai" && (
            <span style={{ fontSize: 11, background: "rgba(99,102,241,0.2)", color: "#a5b4fc", padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>AI Wizard</span>
          )}
        </div>
      </div>
      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button onClick={() => onDownload(pres._id, pres.filename)} style={{
          padding: "7px 14px", borderRadius: 8, border: "1px solid #334155",
          background: "rgba(99,102,241,0.15)", color: "#a5b4fc", cursor: "pointer", fontSize: 13, fontWeight: 600,
        }}>⬇ Download</button>
        <button onClick={async () => {
          if (!window.confirm("Delete this presentation?")) return;
          setDeleting(true);
          await onDelete(pres._id);
          setDeleting(false);
        }} disabled={deleting} style={{
          padding: "7px 10px", borderRadius: 8, border: "1px solid #334155",
          background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 13,
        }}>🗑</button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PptGeneratorPage() {
  // ── Tabs ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("generate"); // "generate" | "history"

  // ── Upload & extraction ───────────────────────────────────────────────────
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [documentText, setDocumentText] = useState("");
  const [documentId, setDocumentId] = useState(null);
  const [docStats, setDocStats] = useState(null);
  const fileRef = useRef(null);

  // ── Wizard options ────────────────────────────────────────────────────────
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizard, setWizard] = useState({
    theme:         "Professional",
    audience:      "Business Stakeholders",
    purpose:       "Inform and present findings",
    slideCount:    12,
    contentDensity:"Balanced",
    chartStyle:    "Charts where useful",
    speakerNotes:  "Yes, include notes",
    sections:      ["Agenda", "Key Findings", "Conclusion"],
    title:         "",
  });

  // ── Generation ────────────────────────────────────────────────────────────
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ pct: 0, label: "", stage: "" });
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ── History ───────────────────────────────────────────────────────────────
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histPage, setHistPage] = useState(1);
  const [histTotal, setHistTotal] = useState(0);
  const [histSearch, setHistSearch] = useState("");
  const [histSort, setHistSort] = useState("newest");
  const HIST_LIMIT = 10;

  // ── Load history ──────────────────────────────────────────────────────────
  const loadHistory = useCallback(async (page = 1) => {
    setHistLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: HIST_LIMIT, sort: histSort });
      if (histSearch) params.set("search", histSearch);
      const res = await fetch(`${API_BASE}/ppt/presentations?${params}`, { credentials: "include" });
      const data = await res.json();
      setHistory(data.presentations || []);
      setHistTotal(data.total || 0);
      setHistPage(data.page || 1);
    } catch {
      setHistory([]);
    }
    setHistLoading(false);
  }, [histSort, histSearch]);

  useEffect(() => { if (activeTab === "history") loadHistory(1); }, [activeTab, loadHistory]);

  // ── File handling ─────────────────────────────────────────────────────────
  const handleFile = async (f) => {
    if (!f) return;
    setFile(f);
    setDocumentText("");
    setDocumentId(null);
    setDocStats(null);
    setError("");
    setSuccessMsg("");
    setExtracting(true);
    setProgress({ pct: 15, label: "Uploading file…", stage: "uploading" });

    try {
      const form = new FormData();
      form.append("file", f);

      const res = await fetch(`${API_BASE}/ppt/upload-and-extract`, {
        method: "POST",
        body: form,
        credentials: "include",
      });

      // Safe-parse: an empty or non-JSON body must never throw an unhandled error.
      let data = {};
      try {
        const text = await res.text();
        if (text.trim()) data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned an invalid response (HTTP ${res.status}). Check backend logs.`);
      }

      if (!res.ok || !data.success) throw new Error(data.message || `Upload failed (HTTP ${res.status})`);

      setDocumentText(data.documentText || "");
      setDocumentId(data.documentId || null);
      setDocStats(data.stats || null);
      setProgress({ pct: 100, label: "Ready for AI generation ✓", stage: "done" });
      setWizard(w => ({ ...w, title: w.title || f.name.replace(/\.[^.]+$/, "") }));
      setTimeout(() => setWizardOpen(true), 400);
    } catch (e) {
      setError(e.message);
      setProgress({ pct: 0, label: "", stage: "" });
    }
    setExtracting(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  };

  // ── Generate PPT ──────────────────────────────────────────────────────────
  const generatePpt = async () => {
    if (!documentText && !documentId) { setError("Please upload a document first."); return; }
    setGenerating(true);
    setError("");
    setSuccessMsg("");
    setProgress({ pct: 10, label: "Sending document to AI…", stage: "ai" });

    try {
      // Simulate progress ticks while AI works
      const ticks = [
        [20, "Analysing document type…"],
        [35, "Building presentation strategy…"],
        [55, "Generating slide outline…"],
        [70, "Writing slide content…"],
        [85, "Building charts and visuals…"],
        [92, "Assembling PPTX file…"],
      ];
      let tickIdx = 0;
      const ticker = setInterval(() => {
        if (tickIdx < ticks.length) {
          setProgress({ pct: ticks[tickIdx][0], label: ticks[tickIdx][1], stage: "ai" });
          tickIdx++;
        }
      }, 4000);

      const wizardOptions = {
        ...wizard,
        chartType: wizard.chartStyle === "Rich with charts" ? "rich" : wizard.chartStyle === "Minimal charts" ? "minimal" : "auto",
        speakerNotes: wizard.speakerNotes.startsWith("Yes") ? "Yes" : "No",
      };

      const res = await fetch(`${API_BASE}/ppt/generate-ppt-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          documentText,
          documentId,
          filename: file?.name || "Document",
          wizardOptions,
        }),
      });

      clearInterval(ticker);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Generation failed");
      }

      setProgress({ pct: 100, label: "Presentation ready!", stage: "done" });

      // Trigger download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cdHeader = res.headers.get("Content-Disposition") || "";
      const fnMatch = cdHeader.match(/filename="([^"]+)"/);
      a.download = fnMatch ? fnMatch[1] : `${wizard.title || "Presentation"}.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setSuccessMsg(`✅ Presentation downloaded! ${res.headers.get("X-Slide-Count") || ""} slides generated.`);
      loadHistory(1);
    } catch (e) {
      setError(e.message);
      setProgress({ pct: 0, label: "", stage: "error" });
    }
    setGenerating(false);
  };

  // ── Download from history ─────────────────────────────────────────────────
  const downloadPres = async (id, filename) => {
    const res = await fetch(`${API_BASE}/presentations/${id}/download`, { credentials: "include" });
    if (!res.ok) return alert("Download failed.");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  // ── Delete from history ───────────────────────────────────────────────────
  const deletePres = async (id) => {
    await fetch(`${API_BASE}/presentations/${id}`, { method: "DELETE", credentials: "include" });
    loadHistory(histPage);
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const S = {
    page: { minHeight: "100vh", background: "#020817", color: "#e2e8f0", fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: "32px 24px" },
    container: { maxWidth: 960, margin: "0 auto" },
    heading: { fontSize: 28, fontWeight: 700, color: "#f8fafc", marginBottom: 4 },
    subheading: { fontSize: 14, color: "#64748b", marginBottom: 28 },
    tabs: { display: "flex", gap: 4, marginBottom: 28, background: "#0f172a", padding: 6, borderRadius: 12, width: "fit-content" },
    tab: (active) => ({
      padding: "9px 22px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600,
      background: active ? "#6366f1" : "transparent", color: active ? "#fff" : "#64748b", transition: "all 0.15s",
    }),
    card: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 14, padding: 24, marginBottom: 20 },
    label: { fontSize: 12, fontWeight: 700, color: "#64748b", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, display: "block" },
    input: { width: "100%", background: "#020817", border: "1px solid #334155", borderRadius: 8, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" },
    btn: (variant = "primary") => ({
      padding: variant === "sm" ? "8px 16px" : "12px 28px",
      borderRadius: 10, border: "none", cursor: "pointer", fontSize: variant === "sm" ? 13 : 15,
      fontWeight: 700, transition: "all 0.15s",
      background: variant === "primary" ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
        : variant === "danger" ? "#ef4444" : "#1e293b",
      color: "#fff",
    }),
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.container}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🎞️</div>
            <div>
              <h1 style={S.heading}>AI Presentation Generator</h1>
              <p style={S.subheading}>Upload any document — the AI reads it directly and builds a professional PPTX presentation.</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={S.tabs}>
          <button style={S.tab(activeTab === "generate")} onClick={() => setActiveTab("generate")}>🪄 Generate</button>
          <button style={S.tab(activeTab === "history")} onClick={() => setActiveTab("history")}>🕓 History {histTotal > 0 && `(${histTotal})`}</button>
        </div>

        {/* ── GENERATE TAB ──────────────────────────────────────────────── */}
        {activeTab === "generate" && (
          <div>
            {/* Upload zone */}
            <div style={S.card}>
              <span style={S.label}>Step 1 — Upload Your Document</span>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => !extracting && fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? "#6366f1" : file ? "#10b981" : "#334155"}`,
                  borderRadius: 12, padding: "48px 24px", textAlign: "center",
                  cursor: extracting ? "wait" : "pointer", transition: "all 0.2s",
                  background: dragOver ? "rgba(99,102,241,0.05)" : file ? "rgba(16,185,129,0.04)" : "transparent",
                }}
              >
                <input ref={fileRef} type="file" style={{ display: "none" }} accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg" onChange={(e) => handleFile(e.target.files?.[0])} />
                {file ? (
                  <div>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>{fileIcon(file.name)}</div>
                    <div style={{ fontWeight: 700, color: "#10b981", fontSize: 16 }}>{file.name}</div>
                    {docStats && <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>{docStats.words?.toLocaleString()} words · {fmt(file.size)}</div>}
                    {documentText && <div style={{ color: "#22c55e", fontSize: 13, marginTop: 8 }}>✓ Text extracted — ready for AI</div>}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
                    <div style={{ fontWeight: 600, color: "#94a3b8", fontSize: 16 }}>Drop your document here or click to browse</div>
                    <div style={{ color: "#475569", fontSize: 13, marginTop: 6 }}>PDF · Word · Excel · CSV · TXT · Images — up to 10 MB</div>
                    <div style={{ marginTop: 12, padding: "6px 16px", borderRadius: 8, background: "rgba(99,102,241,0.12)", color: "#a5b4fc", fontSize: 12, display: "inline-block" }}>
                      🤖 AI reads the original document — no summary step required
                    </div>
                  </div>
                )}
              </div>

              {(extracting || progress.pct > 0) && (
                <ProgressBar pct={progress.pct} label={progress.label} stage={progress.stage} />
              )}
            </div>

            {/* Wizard */}
            {documentText && (
              <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: wizardOpen ? 20 : 0 }}>
                  <span style={S.label}>Step 2 — Presentation Settings</span>
                  <button onClick={() => setWizardOpen(o => !o)} style={{ background: "transparent", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    {wizardOpen ? "▲ Collapse" : "▼ Expand"}
                  </button>
                </div>

                {wizardOpen && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Title */}
                    <div>
                      <span style={S.label}>Presentation Title</span>
                      <input style={S.input} placeholder="Leave blank to auto-generate from document" value={wizard.title} onChange={e => setWizard(w => ({ ...w, title: e.target.value }))} />
                    </div>

                    {/* Theme */}
                    <div>
                      <span style={S.label}>Theme</span>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {THEMES.map(t => <ThemeCard key={t.key} theme={t} selected={wizard.theme === t.key} onClick={k => setWizard(w => ({ ...w, theme: k }))} />)}
                      </div>
                    </div>

                    {/* Audience */}
                    <div>
                      <span style={S.label}>Target Audience</span>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {AUDIENCES.map(a => <WizardOption key={a} label={a} value={a} selected={wizard.audience === a} onClick={v => setWizard(w => ({ ...w, audience: v }))} />)}
                      </div>
                    </div>

                    {/* Purpose */}
                    <div>
                      <span style={S.label}>Presentation Purpose</span>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {PURPOSES.map(p => <WizardOption key={p} label={p} value={p} selected={wizard.purpose === p} onClick={v => setWizard(w => ({ ...w, purpose: v }))} />)}
                      </div>
                    </div>

                    {/* Slide count + Content density */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                      <div>
                        <span style={S.label}>Number of Slides: {wizard.slideCount}</span>
                        <input type="range" min={5} max={25} value={wizard.slideCount} onChange={e => setWizard(w => ({ ...w, slideCount: parseInt(e.target.value) }))}
                          style={{ width: "100%", accentColor: "#6366f1" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569" }}><span>5</span><span>25</span></div>
                      </div>
                      <div>
                        <span style={S.label}>Content Density</span>
                        <div style={{ display: "flex", gap: 8 }}>
                          {DENSITY.map(d => <WizardOption key={d} label={d} value={d} selected={wizard.contentDensity === d} onClick={v => setWizard(w => ({ ...w, contentDensity: v }))} />)}
                        </div>
                      </div>
                    </div>

                    {/* Charts + Speaker notes */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                      <div>
                        <span style={S.label}>Charts & Visuals</span>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {CHART_STYLES.map(c => <WizardOption key={c} label={c} value={c} selected={wizard.chartStyle === c} onClick={v => setWizard(w => ({ ...w, chartStyle: v }))} />)}
                        </div>
                      </div>
                      <div>
                        <span style={S.label}>Speaker Notes</span>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {SPEAKER_NOTES.map(s => <WizardOption key={s} label={s} value={s} selected={wizard.speakerNotes === s} onClick={v => setWizard(w => ({ ...w, speakerNotes: v }))} />)}
                        </div>
                      </div>
                    </div>

                    {/* Sections to include */}
                    <div>
                      <span style={S.label}>Sections to Include</span>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {SECTIONS_LIST.map(sec => {
                          const active = wizard.sections.includes(sec);
                          return (
                            <button key={sec} onClick={() => setWizard(w => ({
                              ...w,
                              sections: active ? w.sections.filter(s => s !== sec) : [...w.sections, sec],
                            }))} style={{
                              padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13,
                              border: `2px solid ${active ? "#6366f1" : "#334155"}`,
                              background: active ? "rgba(99,102,241,0.15)" : "transparent",
                              color: active ? "#a5b4fc" : "#64748b", fontWeight: active ? 600 : 400,
                            }}>{active ? "✓ " : ""}{sec}</button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error / Success */}
            {error && (
              <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "14px 18px", color: "#fca5a5", marginBottom: 16, fontSize: 14 }}>
                ⚠️ {error}
              </div>
            )}
            {successMsg && (
              <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "14px 18px", color: "#6ee7b7", marginBottom: 16, fontSize: 14 }}>
                {successMsg}
              </div>
            )}

            {/* Generate button */}
            <div style={{ textAlign: "center", marginTop: 8 }}>
              <button
                onClick={generatePpt}
                disabled={(!documentText && !documentId) || generating || extracting}
                style={{
                  ...S.btn("primary"),
                  opacity: ((!documentText && !documentId) || generating || extracting) ? 0.5 : 1,
                  cursor: ((!documentText && !documentId) || generating || extracting) ? "not-allowed" : "pointer",
                  padding: "16px 40px", fontSize: 16,
                  boxShadow: "0 0 30px rgba(99,102,241,0.3)",
                }}
              >
                {generating ? "⏳ Generating presentation…" : "🪄 Generate Presentation"}
              </button>
              {documentText && !generating && (
                <div style={{ color: "#475569", fontSize: 12, marginTop: 10 }}>
                  AI will read the full document directly — no summarization step
                </div>
              )}
            </div>

            {generating && (
              <div style={{ marginTop: 20 }}>
                <ProgressBar pct={progress.pct} label={progress.label} stage={progress.stage} />
              </div>
            )}

            {/* How it works */}
            {!documentText && (
              <div style={{ ...S.card, marginTop: 32 }}>
                <span style={S.label}>How It Works</span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                  {[
                    { icon: "📂", step: "1", title: "Upload", desc: "Upload PDF, Word, Excel, CSV, TXT or image" },
                    { icon: "🔍", step: "2", title: "AI Reads", desc: "AI analyses the full document — not a summary" },
                    { icon: "🎯", step: "3", title: "Configure", desc: "Choose theme, audience, slide count, charts" },
                    { icon: "⬇️", step: "4", title: "Download", desc: "Get a professional .pptx in seconds" },
                  ].map(item => (
                    <div key={item.step} style={{ textAlign: "center", padding: "16px 12px", borderRadius: 12, background: "#020817", border: "1px solid #1e293b" }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                      <div style={{ fontSize: 10, color: "#6366f1", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 4 }}>STEP {item.step}</div>
                      <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                      <div style={{ color: "#64748b", fontSize: 12, lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ───────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <div>
            {/* Filters */}
            <div style={{ ...S.card, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <input
                style={{ ...S.input, maxWidth: 280 }}
                placeholder="🔍 Search presentations…"
                value={histSearch}
                onChange={e => setHistSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && loadHistory(1)}
              />
              <select
                value={histSort}
                onChange={e => { setHistSort(e.target.value); loadHistory(1); }}
                style={{ ...S.input, maxWidth: 160 }}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
              <button onClick={() => loadHistory(1)} style={S.btn("sm")}>Search</button>
              <span style={{ color: "#475569", fontSize: 13, marginLeft: "auto" }}>
                {histTotal} presentation{histTotal !== 1 ? "s" : ""}
              </span>
            </div>

            {/* List */}
            {histLoading ? (
              <div style={{ textAlign: "center", padding: 60, color: "#475569" }}>Loading…</div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60 }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎞️</div>
                <div style={{ color: "#475569", fontSize: 16 }}>No presentations yet</div>
                <div style={{ color: "#334155", fontSize: 13, marginTop: 6 }}>Generate your first presentation above</div>
                <button onClick={() => setActiveTab("generate")} style={{ ...S.btn("primary"), marginTop: 20 }}>Go to Generator</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {history.map(pres => (
                  <HistoryCard key={pres._id} pres={pres} onDownload={downloadPres} onDelete={deletePres} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {histTotal > HIST_LIMIT && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
                <button onClick={() => loadHistory(histPage - 1)} disabled={histPage <= 1} style={{ ...S.btn("sm"), opacity: histPage <= 1 ? 0.4 : 1 }}>← Prev</button>
                <span style={{ color: "#64748b", padding: "8px 12px", fontSize: 14 }}>Page {histPage} of {Math.ceil(histTotal / HIST_LIMIT)}</span>
                <button onClick={() => loadHistory(histPage + 1)} disabled={histPage >= Math.ceil(histTotal / HIST_LIMIT)} style={{ ...S.btn("sm"), opacity: histPage >= Math.ceil(histTotal / HIST_LIMIT) ? 0.4 : 1 }}>Next →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}