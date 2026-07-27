/**
 * Presentation.jsx
 *
 * AI-powered PPT Generator page with:
 * 1. Target slide count selection (5, 8, 12, 15, 20 slides)
 * 2. Live progressive slide creation stream (slides pop up live as AI generates them)
 * 3. Complete 16:9 interactive slide deck previewer
 * 4. Dual download options: Download PPTX (editable PowerPoint) & Download PDF
 */

import { useState, useRef, useEffect, useCallback } from "react";
import api from "../api";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import {
  Upload as UploadIcon, Sparkles, FileText, FileSpreadsheet,
  FileImage, File, Download, CheckCircle2, Loader2,
  BarChart3, PieChart, Table, TrendingUp, Layout,
  ChevronRight, AlertCircle, RotateCcw, Presentation as PresentationIcon,
  Layers, BookOpen, Brain, Zap, Eye, ChevronLeft, FileCode, Sliders
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Accepted file types ───────────────────────────────────────────────────────
const ACCEPTED = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "image/png", "image/jpeg", "image/jpg", "image/webp",
];

const EXT_ACCEPT = ".pdf,.doc,.docx,.txt,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.webp";

function fileIcon(mime = "") {
  if (mime.includes("pdf") || mime.includes("word")) return FileText;
  if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv")) return FileSpreadsheet;
  if (mime.startsWith("image/")) return FileImage;
  return File;
}

function formatBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

// ── SSE progress hook with live slide streaming ───────────────────────────────
function useProgress() {
  const [progress, setProgress] = useState({ stage: "idle", percent: 0, message: "", done: false, error: false });
  const [liveSlides, setLiveSlides] = useState([]);
  const [finalStructure, setFinalStructure] = useState(null);
  const [historyId, setHistoryId] = useState(null);
  const esRef = useRef(null);

  const reset = useCallback(() => {
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    setProgress({ stage: "idle", percent: 0, message: "", done: false, error: false });
    setLiveSlides([]);
    setFinalStructure(null);
    setHistoryId(null);
  }, []);

  const startListening = useCallback((jobId) => {
    reset();
    setProgress({ stage: "uploading", percent: 5, message: "Uploading document…", done: false, error: false });
    const es = new EventSource(`${API_BASE}/api/progress/${jobId}`, { withCredentials: true });
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setProgress({
          stage: data.stage,
          percent: data.percent,
          message: data.message,
          done: data.stage === "done",
          error: data.stage === "error"
        });

        if (data.extraData?.historyId) {
          setHistoryId(String(data.extraData.historyId));
        }

        // Collect live streamed slides
        if (data.extraData?.slide) {
          setLiveSlides((prev) => {
            const idx = data.extraData.slideIndex;
            const copy = [...prev];
            if (idx !== undefined && idx >= 0) {
              copy[idx] = data.extraData.slide;
            } else {
              copy.push(data.extraData.slide);
            }
            return copy;
          });
        }

        if (data.extraData?.slideStructure) {
          setFinalStructure(data.extraData.slideStructure);
        }

        if (data.stage === "done" || data.stage === "error") {
          es.close();
          esRef.current = null;
        }
      } catch (_) {}
    };

    es.onerror = () => { es.close(); esRef.current = null; };
  }, [reset]);

  useEffect(() => () => { if (esRef.current) esRef.current.close(); }, []);
  return { progress, liveSlides, finalStructure, historyId, startListening, reset };
}

// ── Pipeline stages ───────────────────────────────────────────────────────────
const STAGES = [
  { key: "uploading",  label: "Reading",   icon: BookOpen   },
  { key: "extracting", label: "Analyzing", icon: Brain      },
  { key: "ai",         label: "Designing", icon: Sparkles   },
  { key: "saving",     label: "Building",  icon: Layout     },
  { key: "done",       label: "Ready",     icon: CheckCircle2 },
];
const STAGE_ORDER = STAGES.map(s => s.key);

function PipelineProgress({ progress }) {
  const { stage, percent, message, error } = progress;
  const idx = error ? -1 : STAGE_ORDER.indexOf(stage);

  return (
    <div className="mt-4 rounded-xl p-4" style={{ background: "rgba(var(--primary-rgb),.06)", border: "1px solid rgba(var(--primary-rgb),.15)" }}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-sm" style={{ color: error ? "var(--danger)" : "var(--primary)" }}>
          {error ? "Generation Failed" : stage === "done" ? "Presentation Ready!" : "Generating Presentation…"}
        </span>
        <span className="text-sm font-bold tabular-nums" style={{ color: error ? "var(--danger)" : "var(--primary)" }}>
          {error ? "Error" : `${percent}%`}
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>{message}</p>

      <div className="w-full h-2.5 rounded-full overflow-hidden mb-3" style={{ background: "var(--border)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, background: error ? "var(--danger)" : stage === "done" ? "var(--success)" : "var(--primary)" }}
        />
      </div>

      <div className="flex items-center gap-1">
        {STAGES.map((s, i) => {
          const done = !error && i <= idx;
          const active = !error && i === idx && stage !== "done";
          const Icon = s.icon;
          return (
            <div key={s.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 w-full">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    background: done ? (active ? "var(--primary)" : "var(--success)") : "var(--border)",
                    color: done ? "#fff" : "var(--muted)",
                  }}
                >
                  {active ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Icon size={13} />
                  )}
                </div>
                <span className="text-[10px] whitespace-nowrap hidden sm:inline font-medium" style={{ color: done ? "var(--text)" : "var(--muted)" }}>
                  {s.label}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <div className="w-full h-px mb-4" style={{ background: i < idx || (stage === "done" && i <= idx) ? "var(--success)" : "var(--border)" }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PDF Exporter using jsPDF ──────────────────────────────────────────────────
function downloadPresentationPdf(slideStructure, filename = "presentation") {
  const slides = slideStructure?.slides || [];
  if (slides.length === 0) {
    toast.error("No slides available to export.");
    return;
  }

  toast.loading("Generating PDF presentation...", { id: "pdf-gen" });

  try {
    // 16:9 Landscape PDF (297mm x 167mm)
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [297, 167] });

    slides.forEach((slide, idx) => {
      if (idx > 0) doc.addPage([297, 167], "landscape");

      const isDark = slide.layout?.includes("dark") || slide.slideType === "cover" || slide.slideType === "thankYou";
      const bgColor = isDark ? [15, 23, 42] : [255, 255, 255];
      const textColor = isDark ? [255, 255, 255] : [30, 41, 59];
      const accentColor = [99, 102, 241]; // Indigo-500

      // Fill Background
      doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      doc.rect(0, 0, 297, 167, "F");

      // Left Accent Ribbon
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(0, 0, 6, 167, "F");

      // Slide Badge / Tag
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`SLIDE ${idx + 1} OF ${slides.length}  |  ${(slide.slideType || "CONTENT").toUpperCase()}`, 20, 18);

      // Title
      doc.setFontSize(20);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      const titleLines = doc.splitTextToSize(slide.title || "Presentation Slide", 250);
      doc.text(titleLines, 20, 30);

      let curY = 30 + titleLines.length * 9;

      // Subtitle
      if (slide.subtitle) {
        doc.setFontSize(11);
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.text(slide.subtitle, 20, curY);
        curY += 10;
      }

      // Bullet Points
      if (slide.content?.bullets && slide.content.bullets.length > 0) {
        doc.setFontSize(11);
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        slide.content.bullets.forEach((bullet) => {
          if (curY > 145) return;
          const wrapped = doc.splitTextToSize(`•  ${bullet}`, 250);
          doc.text(wrapped, 22, curY);
          curY += wrapped.length * 6 + 3;
        });
      }

      // Stats Cards Grid
      if (slide.content?.stats && slide.content.stats.length > 0) {
        curY += 4;
        const stats = slide.content.stats.slice(0, 4);
        const colWidth = 58;
        stats.forEach((st, sIdx) => {
          const xPos = 20 + sIdx * (colWidth + 6);
          if (xPos + colWidth <= 280 && curY + 24 <= 155) {
            doc.setFillColor(isDark ? 30 : 241, isDark ? 41 : 245, isDark ? 59 : 249);
            doc.roundedRect(xPos, curY, colWidth, 24, 3, 3, "F");
            doc.setFontSize(14);
            doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.text(String(st.value || ""), xPos + colWidth / 2, curY + 10, { align: "center" });
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(String(st.label || ""), xPos + colWidth / 2, curY + 18, { align: "center" });
          }
        });
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`AI Presentation  ·  Generated ${new Date().toLocaleDateString()}`, 20, 160);
    });

    const safeName = (filename || "presentation").replace(/\.[^.]+$/, "").replace(/[^a-z0-9_\-\s]/gi, "").trim();
    doc.save(`${safeName}_presentation.pdf`);
    toast.success("PDF exported successfully!", { id: "pdf-gen" });
  } catch (err) {
    console.error(err);
    toast.error("Failed to export PDF presentation", { id: "pdf-gen" });
  }
}

// ── Interactive 16:9 Slide Canvas Renderer ────────────────────────────────────
function SlideCanvas({ slide, totalSlides, index }) {
  if (!slide) return null;
  const isDark = slide.slideType === "cover" || slide.slideType === "thankYou" || slide.layout?.includes("dark");

  return (
    <div className={`relative w-full aspect-[16/9] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl overflow-hidden transition-all duration-300 border ${
      isDark
        ? "bg-slate-950 text-white border-slate-800"
        : "bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-800"
    }`}>
      {/* Gradient Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      {/* Top Tag & Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            Slide {index + 1} of {totalSlides} · {slide.slideType || "content"}
          </span>
          <span className="text-xs text-slate-400 font-mono capitalize">
            Layout: {slide.layout || "standard"}
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-1">{slide.title}</h2>
        {slide.subtitle && (
          <p className="text-xs sm:text-sm font-semibold text-indigo-400 mb-3">{slide.subtitle}</p>
        )}
      </div>

      {/* Content Body */}
      <div className="my-auto space-y-3">
        {slide.content?.bullets && slide.content.bullets.length > 0 && (
          <ul className="space-y-2">
            {slide.content.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        )}

        {slide.content?.stats && slide.content.stats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
            {slide.content.stats.slice(0, 3).map((st, i) => (
              <div key={i} className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-center">
                <p className="text-lg sm:text-xl font-bold text-indigo-500">{st.value}</p>
                <p className="text-[10px] sm:text-xs text-slate-400 truncate">{st.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Speaker Notes / Footer */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate max-w-[75%]">
          💡 {slide.speakerNotes || slide.content?.callout?.text || "Document Intelligence Analysis"}
        </span>
        <span className="font-mono">AI Presentation</span>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Presentation({ user }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [targetSlides, setTargetSlides] = useState(12); // Default 12 slides
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadName, setDownloadName] = useState("");
  const [presHistoryId, setPresHistoryId] = useState(null);
  const { progress, liveSlides, finalStructure, historyId, startListening, reset } = useProgress();

  const inputRef = useRef(null);
  const dlRef = useRef(null);

  const slidesToDisplay = finalStructure?.slides || liveSlides || [];
  const currentSlideCount = slidesToDisplay.length;

  const handleFile = (f) => {
    if (!f) return;
    if (!ACCEPTED.includes(f.type) && !EXT_ACCEPT.split(",").some(ext => f.name.toLowerCase().endsWith(ext.replace(".", "")))) {
      toast.error("Unsupported file type. Please upload PDF, DOCX, TXT, XLSX, CSV, or image files.");
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 20 MB.");
      return;
    }
    setFile(f);
    setDownloadUrl(null);
    setDownloadName("");
    setPresHistoryId(null);
    setActiveSlideIndex(0);
    reset();
  };

  const onInputChange = (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); };
  const onDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleGenerate = async () => {
    if (!file) { toast.error("Please select a document first."); return; }
    setLoading(true);
    setDownloadUrl(null);
    setPresHistoryId(null);
    setActiveSlideIndex(0);
    reset();

    const jobId = `ppt_${Date.now()}`;
    startListening(jobId);

    const formData = new FormData();
    formData.append("document", file);
    formData.append("jobId", jobId);
    formData.append("targetSlides", targetSlides);

    try {
      const res = await api.post("/api/presentation/generate", formData, {
        responseType: "blob",
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 180000,
      });

      const hId = res.headers["x-presentation-id"];
      if (hId) setPresHistoryId(String(hId));

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      });
      const url = URL.createObjectURL(blob);

      const cd = res.headers["content-disposition"] || "";
      const match = cd.match(/filename="?([^"]+)"?/);
      const name = match?.[1] || `${file.name.replace(/\.[^.]+$/, "")}_presentation.pptx`;

      setDownloadUrl(url);
      setDownloadName(name);
      toast.success("Presentation generated successfully!");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.message || "Generation failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPptx = async () => {
    if (downloadUrl) {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = downloadName || `${file?.name?.replace(/\.[^.]+$/, "") || "presentation"}_presentation.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Downloading presentation PPTX...");
      return;
    }

    const targetHistoryId = presHistoryId || historyId || finalStructure?._id;
    if (targetHistoryId) {
      const tid = toast.loading("Downloading presentation PPTX...");
      try {
        const res = await api.get(`/api/presentation/history/${targetHistoryId}/download`, {
          responseType: "blob",
        });
        const blob = new Blob([res.data], {
          type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        });
        const url = URL.createObjectURL(blob);
        const name = `${file?.name?.replace(/\.[^.]+$/, "") || "presentation"}_presentation.pptx`;
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setDownloadUrl(url);
        setDownloadName(name);
        toast.success("PPTX downloaded successfully!", { id: tid });
      } catch (err) {
        console.error(err);
        toast.error("Failed to download PPTX file. Please try again.", { id: tid });
      }
      return;
    }

    toast.error("Presentation is still finalizing. Please wait a moment.");
  };

  const handleReset = () => {
    setFile(null);
    setDownloadUrl(null);
    setDownloadName("");
    setActiveSlideIndex(0);
    reset();
    if (inputRef.current) inputRef.current.value = "";
  };

  const FileIcon = file ? fileIcon(file.type) : UploadIcon;
  const isProcessing = loading;
  const isDone = progress.done && downloadUrl;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)" }}>
              <PresentationIcon size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">AI PPT Generator & Live Previewer</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload your document — AI designs slides live with real-time preview & instant PPTX/PDF downloads
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Options */}
        <div className="lg:col-span-5 space-y-5">
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !isProcessing && inputRef.current?.click()}
            className="relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer p-6 text-center"
            style={{
              borderColor: dragging ? "var(--primary)" : file ? "#22c55e" : "var(--border)",
              background: dragging ? "rgba(99,102,241,.04)" : file ? "rgba(34,197,94,.03)" : "var(--card)",
            }}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={EXT_ACCEPT}
              onChange={onInputChange}
              disabled={isProcessing}
            />
            {file ? (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 bg-emerald-500/10 text-emerald-500">
                  <FileIcon size={26} />
                </div>
                <p className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-xs">{file.name}</p>
                <p className="text-xs text-slate-400 mb-2">{formatBytes(file.size)}</p>
                {!isProcessing && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                    className="text-xs px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
                  >
                    Change File
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 bg-indigo-500/10 text-indigo-500">
                  <UploadIcon size={26} />
                </div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Drop your document here</p>
                <p className="text-xs text-slate-400 mt-1 mb-2">or click to select file</p>
                <p className="text-[11px] text-slate-400">PDF · DOCX · TXT · XLSX · CSV · Images (up to 20 MB)</p>
              </div>
            )}
          </div>

          {/* Target Slide Count Picker */}
          <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sliders size={14} className="text-indigo-500" />
                <span>Target Slide Count</span>
              </label>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">
                {targetSlides} Slides
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[5, 8, 12, 15, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setTargetSlides(num)}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    targetSlides === num
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!file || isProcessing}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: !file || isProcessing
                ? "var(--border)"
                : "linear-gradient(135deg, #6366f1, #a855f7)",
              color: "#ffffff",
            }}
          >
            {isProcessing ? (
              <><Loader2 size={18} className="animate-spin" /> Designing {targetSlides} Slides Live…</>
            ) : isDone ? (
              <><CheckCircle2 size={18} /> Re-Generate Presentation</>
            ) : (
              <><Sparkles size={18} /> Generate {targetSlides}-Slide Presentation</>
            )}
          </button>

          {/* Progress Component */}
          {(isProcessing || progress.stage !== "idle") && (
            <PipelineProgress progress={progress} />
          )}

          {/* Download Action Hub */}
          {slidesToDisplay.length > 0 && (
            <div className="rounded-2xl p-5 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-slate-900/40 border border-indigo-500/20 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <span>Presentation Ready ({slidesToDisplay.length} Slides)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Download editable PPTX or formatted PDF</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadPptx}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white transition shadow-md cursor-pointer"
                >
                  <Download size={15} /> Download PPTX
                </button>

                <button
                  type="button"
                  onClick={() => downloadPresentationPdf(finalStructure || { slides: slidesToDisplay }, file?.name || "presentation")}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition shadow-md"
                >
                  <FileText size={15} className="text-red-400" /> Download PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Slide Canvas & Deck Viewer */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
            {/* Live Header Status */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Eye size={18} className="text-indigo-400" />
                  <span>Live Slide Deck Preview</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isProcessing
                    ? `Live Creating: ${liveSlides.length} of ${targetSlides} slides ready…`
                    : currentSlideCount > 0
                    ? `Showing Slide ${activeSlideIndex + 1} of ${currentSlideCount}`
                    : "Upload a document to preview live slide generation"}
                </p>
              </div>

              {currentSlideCount > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={activeSlideIndex === 0}
                    onClick={() => setActiveSlideIndex(p => Math.max(0, p - 1))}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-mono font-bold text-indigo-400 px-2 py-1 bg-slate-800 rounded-lg">
                    {activeSlideIndex + 1}/{currentSlideCount}
                  </span>
                  <button
                    disabled={activeSlideIndex >= currentSlideCount - 1}
                    onClick={() => setActiveSlideIndex(p => Math.min(currentSlideCount - 1, p + 1))}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Slide Canvas Viewer */}
            {currentSlideCount > 0 ? (
              <SlideCanvas
                slide={slidesToDisplay[activeSlideIndex] || slidesToDisplay[0]}
                totalSlides={currentSlideCount}
                index={activeSlideIndex}
              />
            ) : (
              <div className="aspect-[16/9] rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-8 bg-slate-950/50">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
                  <PresentationIcon size={28} />
                </div>
                <p className="font-bold text-sm text-slate-300">No slides generated yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Upload a document and select your target slide count to watch the AI build slides in real-time
                </p>
              </div>
            )}

            {/* Live Slide Thumbnails Strip */}
            {currentSlideCount > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
                  All Slides ({currentSlideCount})
                </p>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {slidesToDisplay.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlideIndex(idx)}
                      className={`shrink-0 w-28 aspect-[16/9] rounded-xl p-2 text-left border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                        activeSlideIndex === idx
                          ? "bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/50"
                          : "bg-slate-950 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100"
                      }`}
                    >
                      <span className="text-[9px] font-mono font-bold text-indigo-400">
                        #{idx + 1}
                      </span>
                      <p className="text-[10px] font-bold text-slate-200 truncate leading-tight">
                        {s.title || `Slide ${idx + 1}`}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
