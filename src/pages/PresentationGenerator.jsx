import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Upload,
  FileText,
  Clock,
  Download,
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileSpreadsheet,
  Image as ImageIcon,
  FolderOpen,
  BrainCircuit,
  BarChart3,
  Palette,
  Layers,
  FileType,
  ShieldCheck,
  Zap,
  Target,
  Users,
  Globe,
  LayoutGrid,
  RefreshCw,
  ArrowRight,
  Presentation as PresentationIcon,
} from "lucide-react";
import UsageBadge from "../components/UsageBadge";

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

const THEMES = [
  { id: "executive", label: "Executive Navy & Gold", desc: "Classic high-level corporate look" },
  { id: "modern_dark", label: "Modern Dark & Neon", desc: "Sleek, high-contrast dark aesthetic" },
  { id: "corporate", label: "Corporate Slate & Blue", desc: "Clean professional business style" },
  { id: "clean_light", label: "Clean Minimal Light", desc: "Minimalist white and subtle grey" },
  { id: "vibrant_tech", label: "Vibrant Tech Gradient", desc: "Dynamic startup & product vibe" },
  { id: "pitch_deck", label: "Investor Pitch Deck", desc: "Bold, metric-focused visual style" },
];

const SLIDE_COUNTS = [
  { label: "Auto (AI decides ~16–20)", value: "" },
  { label: "10 slides", value: "10" },
  { label: "12 slides", value: "12" },
  { label: "14 slides", value: "14" },
  { label: "16 slides", value: "16" },
  { label: "18 slides (Recommended)", value: "18" },
  { label: "20 slides", value: "20" },
  { label: "22 slides", value: "22" },
  { label: "25 slides", value: "25" },
  { label: "30 slides", value: "30" },
];

const PIPELINE_STAGES = [
  { id: "parsing",    label: "Document Parsing",        icon: FileText,     min: 5,  max: 25 },
  { id: "analyzing",  label: "AI Document Intelligence", icon: BrainCircuit, min: 25, max: 45 },
  { id: "planning",   label: "Presentation Strategy",    icon: Target,       min: 45, max: 65 },
  { id: "validating", label: "Quality Validation",       icon: ShieldCheck,  min: 62, max: 70 },
  { id: "layouting",  label: "Layout Engine",            icon: LayoutGrid,   min: 70, max: 80 },
  { id: "rendering",  label: "PPTX Rendering",           icon: Sparkles,     min: 80, max: 98 },
  { id: "complete",   label: "Complete Deck",            icon: CheckCircle2, min: 100,max: 100 },
];

// ── Utility Helpers ─────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function GetFileIcon({ filename = "" }) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (["pdf"].includes(ext)) return <FileText className="text-rose-500" size={24} />;
  if (["docx", "doc", "txt"].includes(ext)) return <FileText className="text-blue-500" size={24} />;
  if (["xlsx", "xls", "csv"].includes(ext)) return <FileSpreadsheet className="text-emerald-500" size={24} />;
  if (["png", "jpg", "jpeg", "webp", "tiff"].includes(ext)) return <ImageIcon className="text-purple-500" size={24} />;
  return <FileType className="text-indigo-500" size={24} />;
}

// ── DropZone Component ──────────────────────────────────────────────────────────
function DropZone({ file, onFile, onRemove }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

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
      <div
        className="flex items-center justify-between gap-4 p-4 rounded-xl border transition-all"
        style={{
          background: "rgba(var(--primary-rgb), 0.04)",
          borderColor: "rgba(var(--primary-rgb), 0.2)",
        }}
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="p-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-sm">
            <GetFileIcon filename={file.name} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
              {file.name}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
              <span>{formatBytes(file.size)}</span>
              <span>•</span>
              <span className="text-[var(--success)] font-medium">Ready for AI processing</span>
            </div>
          </div>
        </div>

        <button
          onClick={onRemove}
          className="p-2 rounded-lg text-[var(--muted)] hover:text-rose-500 hover:bg-rose-500/10 transition"
          title="Remove file"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group ${
        dragging
          ? "border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.06)] shadow-inner"
          : "border-[var(--border)] hover:border-[var(--primary)] bg-[var(--bg-subtle)]/50 hover:bg-[var(--bg-subtle)]"
      }`}
    >
      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES} onChange={handleChange} hidden />

      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
        style={{ background: "rgba(var(--primary-rgb), 0.1)", color: "var(--primary)" }}
      >
        <Upload size={26} />
      </div>

      <div>
        <p className="text-base font-bold" style={{ color: "var(--text)" }}>
          Drop your document here or <span style={{ color: "var(--primary)" }}>browse files</span>
        </p>
        <p className="text-xs mt-1 max-w-md mx-auto" style={{ color: "var(--muted)" }}>
          Supports PDF, Word (.docx), Excel (.xlsx, .csv), TXT, Scanned Docs &amp; Images
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
        {["PDF", "DOCX", "XLSX", "CSV", "TXT", "Images"].map((type) => (
          <span
            key={type}
            className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--muted)" }}
          >
            {type}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Pipeline Progress Component ─────────────────────────────────────────────────
function PipelineProgress({ status, progress, message }) {
  const activeStage = PIPELINE_STAGES.find(s => s.id === status || (status === "done" && s.id === "complete"))
    || PIPELINE_STAGES.find(s => progress >= s.min && progress <= s.max)
    || PIPELINE_STAGES[0];
  const activeIdx = PIPELINE_STAGES.indexOf(activeStage);
  const ActiveIcon = activeStage.icon;

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{ background: "rgba(var(--primary-rgb), 0.12)", color: "var(--primary)" }}
          >
            <ActiveIcon size={24} className={status !== "complete" ? "animate-pulse" : ""} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
              {activeStage.label}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {message || "Processing presentation pipeline..."}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-2xl font-black font-heading tracking-tight" style={{ color: "var(--primary)" }}>
            {progress}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
        <div
          className="h-full rounded-full transition-all duration-500 relative"
          style={{
            width: `${Math.max(5, progress)}%`,
            background: "linear-gradient(90deg, var(--primary), #06B6D4)",
          }}
        >
          {progress < 100 && (
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.4s_infinite]" />
          )}
        </div>
      </div>

      {/* Stages Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
        {PIPELINE_STAGES.map((stage, idx) => {
          const isDone = idx < activeIdx || progress === 100;
          const isActive = idx === activeIdx && progress < 100;
          const StageIcon = stage.icon;

          return (
            <div
              key={stage.id}
              className={`flex flex-col items-center text-center p-2.5 rounded-xl border transition-all ${
                isDone
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : isActive
                  ? "bg-[rgba(var(--primary-rgb),0.1)] border-[var(--primary)] text-[var(--primary)] font-semibold shadow-sm"
                  : "bg-[var(--bg-subtle)]/40 border-[var(--border)] text-[var(--muted)] opacity-60"
              }`}
            >
              <div className="mb-1.5">
                {isDone ? (
                  <CheckCircle2 size={16} />
                ) : isActive ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <StageIcon size={16} />
                )}
              </div>
              <span className="text-[11px] leading-tight font-medium">
                {stage.label.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── History Panel Component ─────────────────────────────────────────────────────
function HistoryPanel({ history, onDownload, onDelete }) {
  if (!history || !history.length) {
    return (
      <div className="text-center py-14 px-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: "rgba(var(--primary-rgb), 0.08)", color: "var(--primary)" }}
        >
          <FolderOpen size={26} />
        </div>
        <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>
          No Presentations Yet
        </h3>
        <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: "var(--muted)" }}>
          Generated PowerPoint decks will be saved here for 7 days for easy download anytime.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((item) => (
        <div
          key={item._id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border glass-card transition hover:border-[var(--primary)]/40"
        >
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mt-0.5">
              <PresentationIcon size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>
                {item.title || item.filename}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs" style={{ color: "var(--muted)" }}>
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] font-medium">
                  {item.slideCount || "18"} slides
                </span>
                <span>•</span>
                <span>{item.intelligence?.documentType || "Document Deck"}</span>
                <span>•</span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => onDownload(item._id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition shadow-sm"
            >
              <Download size={14} />
              Download
            </button>
            <button
              onClick={() => onDelete(item._id)}
              className="p-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-rose-500 hover:bg-rose-500/10 transition"
              title="Delete presentation"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main PresentationGenerator Page Component ───────────────────────────────────
export default function PresentationGenerator({ user }) {
  const [file, setFile] = useState(null);
  const [options, setOptions] = useState({
    purpose: "Executive Briefing",
    audience: "Senior Management",
    slideCount: "18",
    language: "English",
    theme: "executive",
    watermarkText: "",
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

  // ── Smooth progress trickle effect while running ────────────────────────────
  useEffect(() => {
    if (status !== "running") return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 92) {
          return prev + 1;
        }
        return prev;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [status]);

  // ── SSE progress listener ──────────────────────────────────────────────────
  const connectSSE = useCallback((jobId) => {
    if (sseRef.current) sseRef.current.close();
    const es = new EventSource(`${API}/api/progress/${jobId}`, { withCredentials: true });
    sseRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const percentVal = typeof data.percent === "number" ? data.percent : (typeof data.progress === "number" ? data.progress : null);
        const stageVal = data.stage || data.status;

        if (percentVal !== null) {
          setProgress((prev) => Math.max(prev, percentVal));
        }
        if (data.message) {
          setProgressMessage(data.message);
        }
        if (stageVal && stageVal !== "starting" && stageVal !== "running") {
          setProgressStatus(stageVal);
        }

        if (stageVal === "error" || data.status === "error") {
          setStatus("error");
          setError(data.message || "Generation failed");
          es.close();
        }
      } catch {}
    };

    es.onerror = () => es.close();
  }, [API]);

  // ── Generate Request ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!file) return;

    setStatus("running");
    setProgress(8);
    setProgressMessage("Initializing AI presentation pipeline…");
    setProgressStatus("parsing");
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
    if (options.watermarkText) form.append("watermarkText", options.watermarkText);

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

      // Metadata from headers
      const slideCount = resp.headers.get("X-Slide-Count");
      const docType = resp.headers.get("X-Document-Type");
      const presId = resp.headers.get("X-Presentation-Id");

      // Auto Download PPTX
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const safeName = (file.name.replace(/\.[^.]+$/, "") || "presentation").slice(0, 60);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}.pptx`;
      a.click();
      URL.revokeObjectURL(url);

      setResultInfo({ slideCount: slideCount || options.slideCount || "18", docType: docType || "Document", presId });
      setStatus("done");
      setProgress(100);
      setProgressMessage(`Presentation complete — ${slideCount || "18"} slides generated & auto-downloaded!`);

      // Reload history
      loadHistory();
    } catch (err) {
      if (err.name === "AbortError") return;
      setStatus("error");
      setError(err.message || "Presentation generation failed. Please try again.");
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

  // ── History Fetching ────────────────────────────────────────────────────────
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const resp = await fetch(`${API}/api/presentation/history`, { credentials: "include" });
      const data = await resp.json();
      if (data.success) setHistory(data.presentations || []);
    } catch {}
    setHistoryLoading(false);
  };

  useEffect(() => {
    if (activeTab === "history") loadHistory();
  }, [activeTab]);

  const handleDownload = async (id) => {
    const a = document.createElement("a");
    a.href = `${API}/api/presentation/${id}/download`;
    a.download = "presentation.pptx";
    a.click();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this presentation deck from history?")) return;
    await fetch(`${API}/api/presentation/${id}`, { method: "DELETE", credentials: "include" });
    setHistory((prev) => prev.filter((p) => p._id !== id));
  };

  const handleReset = () => {
    setStatus("idle");
    setFile(null);
    setProgress(0);
    setResultInfo(null);
    setError(null);
    jobIdRef.current = `pres_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <PresentationIcon size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight gradient-text">
              AI Presentation Generator
            </h1>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--muted)" }}>
              Upload any document to automatically generate structured, data-driven PPTX slide decks.
            </p>
          </div>
        </div>

        <UsageBadge type="presentation" />
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] w-fit">
        <button
          onClick={() => setActiveTab("generate")}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
            activeTab === "generate"
              ? "bg-[var(--card)] text-[var(--text)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          <Sparkles size={16} className="text-indigo-500" />
          Generate Deck
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
            activeTab === "history"
              ? "bg-[var(--card)] text-[var(--text)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--text)]"
          }`}
        >
          <Clock size={16} className="text-indigo-500" />
          History
          {history.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              {history.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Generate Tab Content ── */}
      {activeTab === "generate" && (
        <div className="space-y-6">
          {/* Main Form Card (Idle State) */}
          {status === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6 sm:p-8 space-y-6"
            >
              <div>
                <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
                  Upload Source Document
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  Our 10-stage AI document intelligence extracts key facts, metrics, structure, and charts to build your slides.
                </p>
              </div>

              {/* Upload Dropzone */}
              <DropZone file={file} onFile={setFile} onRemove={() => setFile(null)} />

              {/* Slide Count Control */}
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                  Desired Slide Count
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <select
                    value={options.slideCount}
                    onChange={(e) => setOptions((o) => ({ ...o, slideCount: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition"
                    style={{ borderColor: "var(--border)", color: "var(--text)" }}
                  >
                    {SLIDE_COUNTS.map((s) => (
                      <option key={s.value || "auto"} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center text-xs p-3 rounded-xl border bg-[var(--bg-subtle)]/50" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
                    <span>
                      AI targets target count (±2) and automatically formats charts, matrix tables, and key executive takeaways.
                    </span>
                  </div>
                </div>
              </div>

              {/* Options Toggle Accordion */}
              <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <button
                  type="button"
                  onClick={() => setShowOptions((v) => !v)}
                  className="flex items-center gap-2 text-xs font-semibold py-2 transition"
                  style={{ color: "var(--primary)" }}
                >
                  <SlidersHorizontal size={15} />
                  <span>{showOptions ? "Hide Advanced Options" : "Show Advanced Options (Theme, Audience, Purpose, Language)"}</span>
                  {showOptions ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>

                <AnimatePresence>
                  {showOptions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 overflow-hidden"
                    >
                      {/* Theme */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                          Visual Theme
                        </label>
                        <select
                          value={options.theme}
                          onChange={(e) => setOptions((o) => ({ ...o, theme: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-xs font-medium border bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition"
                          style={{ borderColor: "var(--border)", color: "var(--text)" }}
                        >
                          {THEMES.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Purpose */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                          Presentation Purpose
                        </label>
                        <select
                          value={options.purpose}
                          onChange={(e) => setOptions((o) => ({ ...o, purpose: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-xs font-medium border bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition"
                          style={{ borderColor: "var(--border)", color: "var(--text)" }}
                        >
                          {PURPOSES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Audience */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                          Target Audience
                        </label>
                        <select
                          value={options.audience}
                          onChange={(e) => setOptions((o) => ({ ...o, audience: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-xs font-medium border bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition"
                          style={{ borderColor: "var(--border)", color: "var(--text)" }}
                        >
                          {AUDIENCES.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Language */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                          Language
                        </label>
                        <select
                          value={options.language}
                          onChange={(e) => setOptions((o) => ({ ...o, language: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-xs font-medium border bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition"
                          style={{ borderColor: "var(--border)", color: "var(--text)" }}
                        >
                          {LANGUAGES.map((l) => (
                            <option key={l} value={l}>
                              {l}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Watermark */}
                      <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                        <label className="block text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                          Watermark (optional)
                        </label>
                        <input
                          type="text"
                          maxLength={60}
                          placeholder="e.g. CONFIDENTIAL · NIOS · Your Name"
                          value={options.watermarkText || ""}
                          onChange={(e) => setOptions((o) => ({ ...o, watermarkText: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg text-xs font-medium border bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition"
                          style={{ borderColor: "var(--border)", color: "var(--text)" }}
                        />
                        <p className="text-[10px]" style={{ color: "var(--muted)" }}>
                          Appears top-right on every slide at low opacity. Leave blank for none.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Generate Action Button */}
              <button
                disabled={!file}
                onClick={handleGenerate}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
                  file
                    ? "btn-gradient text-white shadow-lg cursor-pointer"
                    : "bg-[var(--secondary)] text-[var(--muted)] opacity-60 cursor-not-allowed border border-[var(--border)]"
                }`}
              >
                <Sparkles size={18} />
                <span>Generate Presentation Deck</span>
              </button>
            </motion.div>
          )}

          {/* Running State */}
          {status === "running" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border)" }}>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
                    Generating Presentation
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                    Source file: <strong className="font-semibold text-[var(--text)]">{file?.name}</strong>
                  </p>
                </div>

                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition"
                >
                  Cancel
                </button>
              </div>

              <PipelineProgress status={progressStatus} progress={progress} message={progressMessage} />
            </motion.div>
          )}

          {/* Success State */}
          {status === "done" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-8 text-center space-y-5 border bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <h2 className="text-2xl font-black font-heading" style={{ color: "var(--text)" }}>
                  Presentation Deck Ready!
                </h2>
                <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--muted)" }}>
                  Your PowerPoint deck has been generated and automatically downloaded to your device.
                </p>
              </div>

              {resultInfo && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    📊 {resultInfo.slideCount} Slides Generated
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--card)] border border-[var(--border)]" style={{ color: "var(--text)" }}>
                    📄 {resultInfo.docType}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--card)] border border-[var(--border)]" style={{ color: "var(--text)" }}>
                    ✨ Auto-Downloaded .PPTX
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm btn-gradient text-white shadow-md flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Generate Another
                </button>
                <button
                  onClick={() => setActiveTab("history")}
                  className="px-5 py-2.5 rounded-xl font-semibold text-sm border bg-[var(--card)] text-[var(--text)] hover:bg-[var(--bg-subtle)] transition"
                  style={{ borderColor: "var(--border)" }}
                >
                  View All Presentations
                </button>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-8 text-center space-y-4 border bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30"
            >
              <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <AlertTriangle size={30} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  Generation Failed
                </h2>
                <p className="text-xs sm:text-sm mt-1 max-w-md mx-auto" style={{ color: "var(--muted)" }}>
                  {error || "An unexpected error occurred during presentation generation."}
                </p>
              </div>

              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-rose-600 text-white hover:bg-rose-700 transition shadow-md"
              >
                Try Again
              </button>
            </motion.div>
          )}

          {/* Feature Highlight Pills */}
          {status === "idle" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {[
                { icon: BrainCircuit, title: "AI Document Intelligence", desc: "Extracts key insights, data points, and executive takeaways." },
                { icon: BarChart3, title: "Data & KPI Visuals", desc: "Formats metrics and tables into clear, slide-ready components." },
                { icon: Palette, title: "6 Custom Themes", desc: "Executive Navy, Pitch Deck, Tech Dark, Minimal Light & more." },
                { icon: Layers, title: "10-Stage Pipeline", desc: "Parse → Intelligence → Strategy → Validation → PPTX Render." },
                { icon: FileType, title: "Universal File Support", desc: "PDF, Word, Excel, CSV, Scanned PDFs, and Images." },
                { icon: ShieldCheck, title: "Secure & Private", desc: "Temporary processing with strict privacy guarantees." },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="glass-card rounded-xl p-4 flex items-start gap-3 border transition hover:border-[var(--primary)]/40"
                >
                  <div className="p-2 rounded-lg bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)] shrink-0">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold" style={{ color: "var(--text)" }}>
                      {title}
                    </h4>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── History Tab Content ── */}
      {activeTab === "history" && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border)" }}>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>
                Presentation History
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                Your generated presentations are saved for 7 days.
              </p>
            </div>

            <button
              onClick={loadHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-[var(--bg-subtle)] transition"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              <RefreshCw size={13} className={historyLoading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-[var(--muted)] gap-2">
              <Loader2 size={18} className="animate-spin text-[var(--primary)]" />
              <span>Loading presentations...</span>
            </div>
          ) : (
            <HistoryPanel history={history} onDownload={handleDownload} onDelete={handleDelete} />
          )}
        </div>
      )}
    </div>
  );
}
