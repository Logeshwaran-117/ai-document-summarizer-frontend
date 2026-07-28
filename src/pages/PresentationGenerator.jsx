import { useState, useRef, useCallback, useEffect } from "react";

// ── Constants ──────────────────────────────────────────────────────────────────
const ACCEPTED_TYPES = [
  ".pdf", ".docx", ".doc", ".xlsx", ".xls", ".csv", ".txt",
  ".png", ".jpg", ".jpeg", ".webp", ".tiff",
].join(",");

const PURPOSES = [
  "Executive Briefing",
  "Board Presentation",
  "Investor Pitch",
  "Client Report",
  "Internal Analysis",
  "Research Summary",
  "Audit Report",
  "Project Status",
  "Training Material",
];

const AUDIENCES = [
  "Senior Management",
  "Board of Directors",
  "Investors",
  "Clients",
  "Technical Team",
  "General Staff",
  "Government Officials",
  "Researchers",
];

const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam"];

const SLIDE_COUNTS = [
  { label: "Auto (AI decides ~16–20)", value: "" },
  { label: "10 slides", value: "10" },
  { label: "12 slides", value: "12" },
  { label: "14 slides", value: "14" },
  { label: "16 slides", value: "16" },
  { label: "18 slides (recommended)", value: "18" },
  { label: "20 slides", value: "20" },
  { label: "22 slides", value: "22" },
  { label: "25 slides", value: "25" },
  { label: "30 slides", value: "30" },
];

const PIPELINE_STAGES = [
  { id: "parsing",    label: "Document Parsing",        icon: "📄", min: 5,  max: 25 },
  { id: "analyzing",  label: "AI Document Intelligence", icon: "🧠", min: 25, max: 45 },
  { id: "planning",   label: "Presentation Strategy",    icon: "🎯", min: 45, max: 65 },
  { id: "validating", label: "Quality Validation",       icon: "✅", min: 62, max: 70 },
  { id: "layouting",  label: "Layout Engine",            icon: "📐", min: 70, max: 80 },
  { id: "rendering",  label: "PPTX Rendering",           icon: "✨", min: 80, max: 98 },
  { id: "complete",   label: "Complete",                 icon: "🎉", min: 100,max: 100 },
];

// ── Utility ────────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  const icons = { pdf: "📕", docx: "📝", doc: "📝", xlsx: "📊", xls: "📊", csv: "📋", txt: "📄", png: "🖼️", jpg: "🖼️", jpeg: "🖼️" };
  return icons[ext] || "📁";
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function DropZone({ file, onFile, onRemove }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }, [onFile]);

  const handleChange = (e) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  if (file) {
    return (
      <div className="pgen-file-chip">
        <span className="pgen-file-icon">{getFileIcon(file.name)}</span>
        <div className="pgen-file-info">
          <span className="pgen-file-name">{file.name}</span>
          <span className="pgen-file-size">{formatBytes(file.size)}</span>
        </div>
        <button className="pgen-file-remove" onClick={onRemove} title="Remove file">✕</button>
      </div>
    );
  }

  return (
    <div
      className={`pgen-dropzone ${dragging ? "pgen-dropzone--over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
    >
      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES} onChange={handleChange} hidden />
      <div className="pgen-dropzone-icon">⬆</div>
      <p className="pgen-dropzone-title">Drop your document here or click to browse</p>
      <p className="pgen-dropzone-hint">
        PDF · DOCX · XLSX · CSV · TXT · Images (PNG, JPG) · Banking Statements · Reports
      </p>
    </div>
  );
}

function PipelineProgress({ status, progress, message, stages }) {
  const activeStage = PIPELINE_STAGES.find(s => s.id === status) || PIPELINE_STAGES[0];
  const activeIdx = PIPELINE_STAGES.indexOf(activeStage);

  return (
    <div className="pgen-progress-card">
      <div className="pgen-progress-header">
        <span className="pgen-progress-icon">{activeStage.icon}</span>
        <div>
          <div className="pgen-progress-label">{activeStage.label}</div>
          <div className="pgen-progress-message">{message}</div>
        </div>
        <div className="pgen-progress-pct">{progress}%</div>
      </div>

      {/* Progress bar */}
      <div className="pgen-progress-bar-bg">
        <div className="pgen-progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Stage pipeline */}
      <div className="pgen-stages">
        {PIPELINE_STAGES.slice(0, -1).map((stage, i) => (
          <div key={stage.id} className={`pgen-stage ${i < activeIdx ? "pgen-stage--done" : i === activeIdx ? "pgen-stage--active" : ""}`}>
            <div className="pgen-stage-dot">{i < activeIdx ? "✓" : stage.icon}</div>
            <span className="pgen-stage-label">{stage.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryPanel({ history, onDownload, onDelete }) {
  if (!history || !history.length) {
    return <div className="pgen-history-empty">No presentations generated yet.</div>;
  }

  return (
    <div className="pgen-history">
      {history.map((item) => (
        <div key={item._id} className="pgen-history-item">
          <div className="pgen-history-icon">📊</div>
          <div className="pgen-history-info">
            <div className="pgen-history-title">{item.title || item.filename}</div>
            <div className="pgen-history-meta">
              {item.slideCount} slides · {item.intelligence?.documentType || "Document"} ·{" "}
              {new Date(item.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="pgen-history-actions">
            <button className="pgen-btn pgen-btn--sm pgen-btn--outline" onClick={() => onDownload(item._id)}>
              ↓ Download
            </button>
            <button className="pgen-btn pgen-btn--sm pgen-btn--danger" onClick={() => onDelete(item._id)}>
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PresentationGenerator() {
  const [file, setFile] = useState(null);
  const [options, setOptions] = useState({
    purpose: "Executive Briefing",
    audience: "Senior Management",
    slideCount: "18",
    language: "English",
    theme: "executive",
  });

  const [status, setStatus] = useState("idle"); // idle | running | done | error
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressStatus, setProgressStatus] = useState("starting");
  const [resultInfo, setResultInfo] = useState(null);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("generate"); // generate | history
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [showOptions, setShowOptions] = useState(false);
  const jobIdRef = useRef(`pres_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const sseRef = useRef(null);
  const abortRef = useRef(null);

  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ── SSE progress listener ──────────────────────────────────────────────────
  const connectSSE = useCallback((jobId) => {
    if (sseRef.current) sseRef.current.close();
    const es = new EventSource(`${API}/api/progress/${jobId}`, { withCredentials: true });
    sseRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setProgress(data.progress || 0);
        setProgressMessage(data.message || "");
        setProgressStatus(data.status || "running");

        if (data.status === "error") {
          setStatus("error");
          setError(data.message || "Generation failed");
          es.close();
        }
      } catch {}
    };

    es.onerror = () => es.close();
  }, [API]);

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!file) return;

    setStatus("running");
    setProgress(5);
    setProgressMessage("Initializing AI pipeline…");
    setProgressStatus("starting");
    setError(null);
    setResultInfo(null);

    const jobId = `pres_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    jobIdRef.current = jobId;
    connectSSE(jobId);

    const form = new FormData();
    form.append("file", file);
    form.append("jobId", jobId);
    form.append("purpose", options.purpose);
    form.append("audience", options.audience);
    form.append("slideCount", options.slideCount || "");
    form.append("language", options.language);
    form.append("theme", options.theme);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const resp = await fetch(`${API}/api/presentation/generate`, {
        method: "POST",
        credentials: "include",
        body: form,
        signal: ctrl.signal,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.message || `Server error ${resp.status}`);
      }

      // Get metadata from headers
      const slideCount = resp.headers.get("X-Slide-Count");
      const docType = resp.headers.get("X-Document-Type");
      const presId = resp.headers.get("X-Presentation-Id");

      // Download the PPTX
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const safeName = (file.name.replace(/\.[^.]+$/, "") || "presentation").slice(0, 60);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}.pptx`;
      a.click();
      URL.revokeObjectURL(url);

      setResultInfo({ slideCount, docType, presId });
      setStatus("done");
      setProgress(100);
      setProgressMessage(`Presentation ready — ${slideCount} slides generated!`);

      // Reload history
      loadHistory();

    } catch (err) {
      if (err.name === "AbortError") return;
      setStatus("error");
      setError(err.message || "Generation failed");
    } finally {
      if (sseRef.current) sseRef.current.close();
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    if (sseRef.current) sseRef.current.close();
    setStatus("idle");
    setProgress(0);
    setProgressMessage("");
  };

  // ── History ────────────────────────────────────────────────────────────────
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const resp = await fetch(`${API}/api/presentation/history`, { credentials: "include" });
      const data = await resp.json();
      if (data.success) setHistory(data.presentations || []);
    } catch {}
    setHistoryLoading(false);
  };

  useEffect(() => { if (activeTab === "history") loadHistory(); }, [activeTab]);

  const handleDownload = async (id) => {
    const a = document.createElement("a");
    a.href = `${API}/api/presentation/${id}/download`;
    a.download = "presentation.pptx";
    a.click();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this presentation?")) return;
    await fetch(`${API}/api/presentation/${id}`, { method: "DELETE", credentials: "include" });
    setHistory(prev => prev.filter(p => p._id !== id));
  };

  const handleReset = () => {
    setStatus("idle");
    setFile(null);
    setProgress(0);
    setResultInfo(null);
    setError(null);
    jobIdRef.current = `pres_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="pgen-page">
      {/* ── Header ── */}
      <div className="pgen-header">
        <h1 className="pgen-title">
          <span className="pgen-title-icon">✨</span>
          AI Presentation Generator
        </h1>
        <p className="pgen-subtitle">
          Upload any document — PDF, DOCX, Excel, CSV, images — and receive a premium
          PowerPoint in seconds. Powered by a 10-stage AI pipeline.
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="pgen-tabs">
        <button className={`pgen-tab ${activeTab === "generate" ? "pgen-tab--active" : ""}`} onClick={() => setActiveTab("generate")}>
          Generate
        </button>
        <button className={`pgen-tab ${activeTab === "history" ? "pgen-tab--active" : ""}`} onClick={() => setActiveTab("history")}>
          History {history.length > 0 && <span className="pgen-badge">{history.length}</span>}
        </button>
      </div>

      {/* ── Generate Tab ── */}
      {activeTab === "generate" && (
        <div className="pgen-generate-tab">

          {/* Upload Card */}
          {status === "idle" && (
            <div className="pgen-card">
              <div className="pgen-card-header">
                <h2>Upload Document</h2>
                <p>Supports PDF, DOCX, DOC, XLSX, XLS, CSV, TXT, and Images (OCR)</p>
              </div>
              <DropZone file={file} onFile={setFile} onRemove={() => setFile(null)} />

              {/* Always-visible slide count control */}
              <div className="pgen-option-field" style={{ marginTop: 16, marginBottom: 8 }}>
                <label style={{ fontWeight: 600 }}>How many slides do you need?</label>
                <select
                  value={options.slideCount}
                  onChange={e => setOptions(o => ({ ...o, slideCount: e.target.value }))}
                  style={{ width: "100%", marginTop: 6 }}
                >
                  {SLIDE_COUNTS.map(s => (
                    <option key={s.value || "auto"} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                  AI will target this count (±2). More slides → more charts, tables, and detail.
                </p>
              </div>

              {/* Options toggle */}
              <button className="pgen-options-toggle" onClick={() => setShowOptions(v => !v)}>
                ⚙ More Options {showOptions ? "▲" : "▼"}
              </button>

              {showOptions && (
                <div className="pgen-options-grid">
                  <div className="pgen-option-field">
                    <label>Presentation Purpose</label>
                    <select value={options.purpose} onChange={e => setOptions(o => ({ ...o, purpose: e.target.value }))}>
                      {PURPOSES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="pgen-option-field">
                    <label>Target Audience</label>
                    <select value={options.audience} onChange={e => setOptions(o => ({ ...o, audience: e.target.value }))}>
                      {AUDIENCES.map(a => <option key={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className="pgen-option-field">
                    <label>Slide Count</label>
                    <select value={options.slideCount} onChange={e => setOptions(o => ({ ...o, slideCount: e.target.value }))}>
                      {SLIDE_COUNTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="pgen-option-field">
                    <label>Language</label>
                    <select value={options.language} onChange={e => setOptions(o => ({ ...o, language: e.target.value }))}>
                      {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <button
                className="pgen-btn pgen-btn--primary pgen-btn--lg"
                disabled={!file}
                onClick={handleGenerate}
              >
                ✨ Generate Presentation
              </button>
            </div>
          )}

          {/* Running State */}
          {status === "running" && (
            <div className="pgen-card">
              <div className="pgen-card-header">
                <h2>Generating Your Presentation</h2>
                <p>File: <strong>{file?.name}</strong></p>
              </div>
              <PipelineProgress
                status={progressStatus}
                progress={progress}
                message={progressMessage}
              />
              <button className="pgen-btn pgen-btn--danger pgen-btn--sm" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          )}

          {/* Success State */}
          {status === "done" && (
            <div className="pgen-card pgen-card--success">
              <div className="pgen-success-icon">🎉</div>
              <h2 className="pgen-success-title">Presentation Ready!</h2>
              {resultInfo && (
                <div className="pgen-result-meta">
                  <span className="pgen-meta-chip">📊 {resultInfo.slideCount} Slides</span>
                  {resultInfo.docType && <span className="pgen-meta-chip">📄 {resultInfo.docType}</span>}
                  <span className="pgen-meta-chip">✅ Auto-Downloaded</span>
                </div>
              )}
              <p className="pgen-success-hint">
                Your PPTX file has been downloaded. Open it in PowerPoint or Google Slides.
              </p>
              <div className="pgen-success-actions">
                <button className="pgen-btn pgen-btn--primary" onClick={handleReset}>
                  Generate Another
                </button>
                <button className="pgen-btn pgen-btn--outline" onClick={() => setActiveTab("history")}>
                  View History
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="pgen-card pgen-card--error">
              <div className="pgen-error-icon">⚠</div>
              <h2>Generation Failed</h2>
              <p className="pgen-error-message">{error}</p>
              <button className="pgen-btn pgen-btn--primary" onClick={handleReset}>
                Try Again
              </button>
            </div>
          )}

          {/* Feature Pills */}
          {status === "idle" && (
            <div className="pgen-features">
              {[
                ["🧠", "AI Document Intelligence", "Understands your document like a human analyst"],
                ["📊", "Auto Charts & KPIs", "Extracts and visualizes data automatically"],
                ["🎨", "Premium Design System", "Professional layouts, no plain bullets"],
                ["⚡", "10-Stage Pipeline", "Parse → Analyze → Plan → Design → Render → Validate"],
                ["📁", "Any Document Type", "PDF, Word, Excel, CSV, Images, Scanned PDFs"],
                ["🔒", "Secure & Private", "Files never stored permanently"],
              ].map(([icon, title, desc]) => (
                <div key={title} className="pgen-feature-pill">
                  <span className="pgen-feature-icon">{icon}</span>
                  <div>
                    <div className="pgen-feature-title">{title}</div>
                    <div className="pgen-feature-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── History Tab ── */}
      {activeTab === "history" && (
        <div className="pgen-card">
          <div className="pgen-card-header">
            <h2>Your Presentations</h2>
            <p>Saved for 7 days. Download anytime.</p>
          </div>
          {historyLoading ? (
            <div className="pgen-loading">Loading history…</div>
          ) : (
            <HistoryPanel history={history} onDownload={handleDownload} onDelete={handleDelete} />
          )}
        </div>
      )}

      {/* ── Styles ── */}
      <style>{`
        .pgen-page { max-width: 820px; margin: 0 auto; padding: 24px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .pgen-header { text-align: center; margin-bottom: 28px; }
        .pgen-title { font-size: 28px; font-weight: 800; color: #0D1B2A; margin: 0 0 8px; display: flex; align-items: center; justify-content: center; gap: 10px; }
        .pgen-title-icon { font-size: 32px; }
        .pgen-subtitle { color: #64748b; font-size: 14px; margin: 0; max-width: 580px; margin: 0 auto; }

        .pgen-tabs { display: flex; gap: 2px; background: #f1f5f9; border-radius: 10px; padding: 3px; margin-bottom: 20px; }
        .pgen-tab { flex: 1; padding: 9px; border: none; background: transparent; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; color: #64748b; transition: all .15s; display: flex; align-items: center; justify-content: center; gap: 6px; }
        .pgen-tab--active { background: white; color: #0D1B2A; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
        .pgen-badge { background: #E8A020; color: white; border-radius: 10px; padding: 1px 7px; font-size: 11px; font-weight: 700; }

        .pgen-card { background: white; border-radius: 14px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.05); margin-bottom: 16px; }
        .pgen-card--success { text-align: center; border: 2px solid #27AE60; }
        .pgen-card--error { text-align: center; border: 2px solid #E74C3C; }
        .pgen-card-header { margin-bottom: 18px; }
        .pgen-card-header h2 { margin: 0 0 4px; font-size: 18px; color: #0D1B2A; }
        .pgen-card-header p { margin: 0; color: #64748b; font-size: 13px; }

        .pgen-dropzone { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 40px 20px; text-align: center; cursor: pointer; transition: all .2s; background: #fafafa; }
        .pgen-dropzone:hover, .pgen-dropzone--over { border-color: #E8A020; background: #fffbf2; }
        .pgen-dropzone-icon { font-size: 36px; margin-bottom: 10px; }
        .pgen-dropzone-title { font-size: 15px; font-weight: 600; color: #0D1B2A; margin: 0 0 6px; }
        .pgen-dropzone-hint { font-size: 12px; color: #94a3b8; margin: 0; }
        .pgen-file-chip { display: flex; align-items: center; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; }
        .pgen-file-icon { font-size: 26px; }
        .pgen-file-info { flex: 1; min-width: 0; }
        .pgen-file-name { font-size: 14px; font-weight: 600; color: #0D1B2A; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pgen-file-size { font-size: 12px; color: #94a3b8; }
        .pgen-file-remove { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 16px; padding: 4px 6px; border-radius: 6px; }
        .pgen-file-remove:hover { background: #fee2e2; color: #E74C3C; }

        .pgen-options-toggle { width: 100%; background: none; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; text-align: left; cursor: pointer; color: #475569; font-size: 13px; margin: 14px 0; }
        .pgen-options-toggle:hover { background: #f8fafc; }
        .pgen-options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
        @media (max-width: 540px) { .pgen-options-grid { grid-template-columns: 1fr; } }
        .pgen-option-field label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
        .pgen-option-field select { width: 100%; padding: 9px 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; color: #0D1B2A; background: white; }

        .pgen-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 20px; border-radius: 9px; border: none; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .15s; }
        .pgen-btn--primary { background: #0D1B2A; color: white; width: 100%; margin-top: 6px; }
        .pgen-btn--primary:hover:not(:disabled) { background: #1a2e45; }
        .pgen-btn--primary:disabled { opacity: .45; cursor: not-allowed; }
        .pgen-btn--outline { background: white; color: #0D1B2A; border: 1.5px solid #cbd5e1; }
        .pgen-btn--outline:hover { border-color: #0D1B2A; }
        .pgen-btn--danger { background: #fee2e2; color: #E74C3C; }
        .pgen-btn--danger:hover { background: #fecaca; }
        .pgen-btn--lg { padding: 13px 24px; font-size: 15px; }
        .pgen-btn--sm { padding: 7px 12px; font-size: 12px; }

        /* Progress */
        .pgen-progress-card { background: #f8fafc; border-radius: 12px; padding: 18px; }
        .pgen-progress-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
        .pgen-progress-icon { font-size: 26px; }
        .pgen-progress-label { font-size: 15px; font-weight: 700; color: #0D1B2A; }
        .pgen-progress-message { font-size: 12px; color: #64748b; margin-top: 2px; }
        .pgen-progress-pct { margin-left: auto; font-size: 20px; font-weight: 800; color: #E8A020; }
        .pgen-progress-bar-bg { height: 6px; background: #e2e8f0; border-radius: 3px; margin-bottom: 16px; overflow: hidden; }
        .pgen-progress-bar-fill { height: 100%; background: linear-gradient(90deg, #0D1B2A, #E8A020); border-radius: 3px; transition: width .4s ease; }

        .pgen-stages { display: flex; gap: 6px; flex-wrap: wrap; }
        .pgen-stage { display: flex; align-items: center; gap: 5px; padding: 4px 9px; border-radius: 20px; background: #e2e8f0; font-size: 11px; color: #64748b; }
        .pgen-stage--done { background: #dcfce7; color: #15803d; }
        .pgen-stage--active { background: #fef3c7; color: #92400e; font-weight: 700; }
        .pgen-stage-dot { font-size: 12px; }
        .pgen-stage-label { display: none; }
        @media (min-width: 600px) { .pgen-stage-label { display: inline; } }

        /* Success/Error */
        .pgen-success-icon, .pgen-error-icon { font-size: 48px; margin: 10px 0; }
        .pgen-success-title { font-size: 22px; font-weight: 800; color: #0D1B2A; margin: 8px 0 14px; }
        .pgen-result-meta { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 12px; }
        .pgen-meta-chip { background: #f1f5f9; color: #475569; padding: 5px 12px; border-radius: 20px; font-size: 13px; font-weight: 500; }
        .pgen-success-hint { color: #64748b; font-size: 13px; margin-bottom: 20px; }
        .pgen-success-actions { display: flex; gap: 10px; justify-content: center; }
        .pgen-error-message { color: #E74C3C; margin: 10px 0 20px; font-size: 14px; }

        /* Features */
        .pgen-features { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
        @media (max-width: 540px) { .pgen-features { grid-template-columns: 1fr; } }
        .pgen-feature-pill { display: flex; gap: 10px; background: white; border: 1px solid #f1f5f9; border-radius: 10px; padding: 12px; }
        .pgen-feature-icon { font-size: 22px; flex-shrink: 0; }
        .pgen-feature-title { font-size: 13px; font-weight: 700; color: #0D1B2A; margin-bottom: 2px; }
        .pgen-feature-desc { font-size: 11px; color: #94a3b8; }

        /* History */
        .pgen-history-empty { text-align: center; color: #94a3b8; padding: 40px 0; font-size: 14px; }
        .pgen-history { display: flex; flex-direction: column; gap: 10px; }
        .pgen-history-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0; }
        .pgen-history-icon { font-size: 28px; flex-shrink: 0; }
        .pgen-history-info { flex: 1; min-width: 0; }
        .pgen-history-title { font-size: 14px; font-weight: 600; color: #0D1B2A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pgen-history-meta { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .pgen-history-actions { display: flex; gap: 6px; flex-shrink: 0; }

        .pgen-loading { text-align: center; color: #94a3b8; padding: 30px; }
      `}</style>
    </div>
  );
}
