import api from "../api";
import { useState, useRef, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import toast from "react-hot-toast";
import { useNotifications } from "../context/NotificationContext";
import DocumentChat from "./DocumentChat";
import PptOptionsModal from "./PptOptionsModal";
import UsageBadge from "./UsageBadge";

// ── SSE progress hook (inline — no extra file needed) ────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function useProgress() {
  const [progress, setProgress] = useState({ stage: "idle", percent: 0, message: "", done: false, error: false });
  const esRef = useRef(null);

  const reset = useCallback(() => {
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    setProgress({ stage: "idle", percent: 0, message: "", done: false, error: false });
  }, []);

  const startListening = useCallback((jobId) => {
    reset();
    setProgress({ stage: "uploading", percent: 5, message: "Uploading file…", done: false, error: false });

    const es = new EventSource(`${API_BASE}/api/progress/${jobId}`, { withCredentials: true });
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setProgress({ stage: data.stage, percent: data.percent, message: data.message, done: data.stage === "done", error: data.stage === "error" });
        if (data.stage === "done" || data.stage === "error") { es.close(); esRef.current = null; }
      } catch (_) {}
    };
    es.onerror = () => { es.close(); esRef.current = null; };
  }, [reset]);

  useEffect(() => () => { if (esRef.current) esRef.current.close(); }, []);

  return { progress, startListening, reset };
}

// ── Stage label map ───────────────────────────────────────────────────────────
const STAGE_STEPS = [
  { key: "uploading",  label: "Upload",   icon: "⬆️" },
  { key: "extracting", label: "Extract",  icon: "📖" },
  { key: "ai",         label: "AI",       icon: "🤖" },
  { key: "saving",     label: "Save",     icon: "💾" },
  { key: "done",       label: "Done",     icon: "✅" },
];

const STAGE_ORDER = STAGE_STEPS.map(s => s.key);

function ProgressBar({ progress, isImage }) {
  const { stage, percent, message, error } = progress;

  const currentIdx = error ? -1 : STAGE_ORDER.indexOf(stage);

  const barColor = error ? "bg-red-500" : percent === 100 ? "bg-green-500" : "bg-blue-500";
  const titleColor = error ? "text-red-600 dark:text-red-400" : "text-blue-700 dark:text-blue-400";

  return (
    <div className="mt-6 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 p-5 rounded-xl">
      {/* Title */}
      <div className="flex items-center justify-between mb-1">
        <h2 className={`font-bold text-sm ${titleColor}`}>
          {error ? "❌ Error" : stage === "done" ? "✅ Summary Complete!" : isImage ? "🖼️ Analyzing image with AI…" : "📄 Generating AI Summary…"}
        </h2>
        <span className={`text-sm font-bold tabular-nums ${error ? "text-red-500" : "text-blue-600 dark:text-blue-400"}`}>
          {error ? "Failed" : `${percent}%`}
        </span>
      </div>

      {/* Sub-message */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{message}</p>

      {/* Bar track */}
      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${barColor} ${stage !== "done" && !error ? "relative overflow-hidden" : ""}`}
          style={{ width: `${error ? 100 : percent}%` }}
        >
          {/* Shimmer while in progress */}
          {stage !== "done" && !error && (
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.4s_infinite]" />
          )}
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex justify-between mt-3">
        {STAGE_STEPS.map((step, idx) => {
          const done    = !error && currentIdx >= idx;
          const active  = !error && currentIdx === idx;
          return (
            <div key={step.key} className="flex flex-col items-center gap-0.5" style={{ flex: 1 }}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all duration-300
                ${done   ? "bg-blue-600 text-white shadow-sm shadow-blue-300"
                : error  ? "bg-red-200 dark:bg-red-900 text-red-500"
                :          "bg-gray-200 dark:bg-gray-700 text-gray-400"}`}>
                {done ? (active && stage !== "done" ? "⋯" : step.icon) : step.icon}
              </div>
              <span className={`text-[10px] font-medium leading-none
                ${done   ? "text-blue-600 dark:text-blue-400"
                : error  ? "text-red-400"
                :          "text-gray-400 dark:text-gray-500"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── File type helpers ─────────────────────────────────────────────────────────
const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv", "application/csv",
];

const EXCEL_EXTENSIONS = [".xlsx", ".xls", ".csv"];
function getExt(file) { return "." + file.name.split(".").pop().toLowerCase(); }
function isImageFile(file)  { return file && file.type.startsWith("image/"); }
function isPdfFile(file)    { return file && (file.type === "application/pdf" || getExt(file) === ".pdf"); }
function isExcelFile(file)  { return file && EXCEL_EXTENSIONS.includes(getExt(file)); }
function isTextFile(file)   { return file && (file.type === "text/plain" || getExt(file) === ".txt"); }
function isDocxFile(file)   { return file && (getExt(file) === ".docx"); }
function isAllowedFile(file){ return file && (ALLOWED_TYPES.includes(file.type) || isExcelFile(file)); }

function fileTypeLabel(file) {
  if (isImageFile(file))  return { label: "Image",       color: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300", icon: "🖼️" };
  if (isPdfFile(file))    return { label: "PDF",         color: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",             icon: "📑" };
  if (isExcelFile(file))  return { label: "Spreadsheet", color: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300", icon: "📊" };
  if (isDocxFile(file))   return { label: "Word Doc",    color: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",         icon: "📝" };
  if (isTextFile(file))   return { label: "Text",        color: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",         icon: "📄" };
  return                         { label: "Document",    color: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",         icon: "📄" };
}

// ── FilePreview component ─────────────────────────────────────────────────────
function FilePreview({ file }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const objUrlRef = useRef(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    if (objUrlRef.current) { URL.revokeObjectURL(objUrlRef.current); objUrlRef.current = null; }
    setPreview(null);

    if (isImageFile(file)) {
      const url = URL.createObjectURL(file);
      objUrlRef.current = url;
      setPreview({ type: "image", src: url });
      return;
    }
    if (isPdfFile(file)) {
      const url = URL.createObjectURL(file);
      objUrlRef.current = url;
      setPreview({ type: "pdf", src: url });
      return;
    }
    if (isTextFile(file)) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result || "";
        setPreview({ type: "text", content: text.slice(0, 2000) + (text.length > 2000 ? "\n…" : "") });
        setLoading(false);
      };
      reader.onerror = () => setLoading(false);
      reader.readAsText(file);
      return;
    }
    if (getExt(file) === ".csv") {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result || "";
        const rows = text.trim().split("\n").slice(0, 10).map(r => r.split(",").map(c => c.replace(/^"|"$/g, "").trim()));
        setPreview({ type: "table", rows });
        setLoading(false);
      };
      reader.onerror = () => setLoading(false);
      reader.readAsText(file);
      return;
    }
    if (isExcelFile(file)) {
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
          const wb = XLSX.read(e.target.result, { type: "array" });
          const sheetName = wb.SheetNames[0];
          const ws = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
          setPreview({ type: "table", rows: rows.slice(0, 10), sheetName, totalSheets: wb.SheetNames.length });
        } catch {
          setPreview({ type: "error", message: "Could not render spreadsheet preview." });
        }
        setLoading(false);
      };
      reader.onerror = () => { setPreview({ type: "error", message: "Failed to read file." }); setLoading(false); };
      reader.readAsArrayBuffer(file);
      return;
    }
    if (isDocxFile(file)) {
      setPreview({ type: "docx", name: file.name, size: file.size });
      return;
    }
  }, [file]);

  useEffect(() => () => { if (objUrlRef.current) URL.revokeObjectURL(objUrlRef.current); }, []);

  if (!file) return null;

  const wrapper = (children) => (
    <div className="mt-4 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">👁️ Preview</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">— {file.name}</span>
      </div>
      <div className="bg-white dark:bg-gray-900 p-4">{children}</div>
    </div>
  );

  if (loading) return wrapper(
    <div className="flex items-center justify-center py-8 text-gray-400 gap-2">
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      <span className="text-sm">Loading preview…</span>
    </div>
  );

  if (!preview) return null;

  if (preview.type === "image") return wrapper(
    <div className="flex justify-center">
      <img src={preview.src} alt={file.name} className="max-h-72 max-w-full rounded-lg object-contain shadow-md" />
    </div>
  );

  if (preview.type === "pdf") return wrapper(
    <div className="w-full" style={{ height: "320px" }}>
      <iframe src={preview.src + "#toolbar=0&navpanes=0&scrollbar=0&page=1"} title="PDF Preview" className="w-full h-full rounded border-0" />
    </div>
  );

  if (preview.type === "text") return wrapper(
    <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words max-h-56 overflow-y-auto font-mono leading-relaxed">
      {preview.content || "(empty file)"}
    </pre>
  );

  if (preview.type === "table") {
    const [header, ...rows] = preview.rows;
    return wrapper(
      <div>
        {preview.sheetName && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
            Sheet: <strong>{preview.sheetName}</strong>{preview.totalSheets > 1 && ` (+${preview.totalSheets - 1} more)`}
          </p>
        )}
        <div className="overflow-x-auto max-h-56 overflow-y-auto rounded border border-gray-200 dark:border-gray-700">
          <table className="text-xs w-full border-collapse">
            {header && header.length > 0 && (
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 sticky top-0">
                  {header.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">{String(h || "")}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/50"}>
                  {(Array.isArray(row) ? row : []).map((cell, ci) => (
                    <td key={ci} className="px-3 py-1.5 text-gray-700 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 whitespace-nowrap max-w-xs truncate">{String(cell ?? "")}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Showing up to 10 rows</p>
      </div>
    );
  }

  if (preview.type === "docx") return wrapper(
    <div className="flex items-center gap-4 py-4">
      <div className="text-5xl">📝</div>
      <div>
        <p className="font-semibold text-gray-800 dark:text-gray-200">{preview.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Word Document · {(preview.size / 1024).toFixed(1)} KB</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Click "Summarize Document" to extract and analyze content</p>
      </div>
    </div>
  );

  if (preview.type === "error") return wrapper(
    <p className="text-sm text-red-500 dark:text-red-400 py-4 text-center">{preview.message}</p>
  );

  return null;
}

// ── Main Uploadcard ───────────────────────────────────────────────────────────
function Uploadcard() {
  const [selectedFile,  setSelectedFile]  = useState(null);
  const [dragging,      setDragging]      = useState(false);
  const [summary,       setSummary]       = useState("");
  const [filename,      setFilename]      = useState("");
  const [loading,       setLoading]       = useState(false);
  const [pptLoading,    setPptLoading]    = useState(false);
  const [stats,         setStats]         = useState(null);
  const [copied,        setCopied]        = useState(false);
  const [documentId,    setDocumentId]    = useState(null);
  const [showPptModal,  setShowPptModal]  = useState(false);
  // refresh trigger for UsageBadge after a successful summarize
  const [usageKey,      setUsageKey]      = useState(0);

  const { addNotification } = useNotifications();
  const { progress, startListening, reset: resetProgress } = useProgress();

  async function handleSummarize() {
    if (!selectedFile) return;

    if (!isAllowedFile(selectedFile)) {
      toast.error("Only PDF, DOCX, TXT, XLSX, XLS, CSV, JPG, PNG, and WEBP files are allowed");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Maximum file size is 10 MB");
      return;
    }

    try {
      setLoading(true);
      setSummary("");
      setStats(null);
      setDocumentId(null);

      // Generate a unique job id and open the SSE stream before POSTing
      const jobId = crypto.randomUUID();
      startListening(jobId);

      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("jobId", jobId); // controller uses this to push progress

      const response = await api.post("/api/summarize", formData);
      const data = response.data;

      setSummary(data.summary);
      setFilename(data.filename || selectedFile.name);
      setStats(data.stats);
      setDocumentId(data._id);
      setUsageKey(k => k + 1); // re-fetch usage badge
      toast.success("Summary generated successfully!");
      addNotification({ title: "Summary ready", message: `${selectedFile.name} was summarized successfully.`, type: "success" });
    } catch (error) {
      console.error(error);
      const errData = error.response?.data || {};
      const message = errData.message || "Error summarizing document";
      if (errData.limitReached) {
        toast.error(`Plan limit reached — ${message}`);
        addNotification({ title: "Usage limit reached", message: `Upgrade your plan to continue. ${message}`, type: "warning" });
      } else {
        toast.error(message);
        addNotification({ title: "Summarization failed", message: `${selectedFile?.name || "Document"}: ${message}`, type: "error" });
      }
      setSummary("");
      setStats(null);
      setDocumentId(null);
    } finally {
      setLoading(false);
    }
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("Failed to copy"); }
  }

  function downloadTXT() {
    try {
      const blob = new Blob([summary], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "Summary.txt"; a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded as TXT");
      addNotification({ title: "Download complete", message: "Summary.txt was downloaded.", type: "info" });
    } catch { toast.error("Failed to download"); }
  }

  function downloadPDF() {
    try {
      const pdf = new jsPDF();
      pdf.setFontSize(18);
      pdf.text("AI Document Summary", 10, 15);
      pdf.setFontSize(11);
      pdf.text(pdf.splitTextToSize(summary, 180), 10, 30);
      pdf.save("Summary.pdf");
      toast.success("Downloaded as PDF");
      addNotification({ title: "Download complete", message: "Summary.pdf was downloaded.", type: "info" });
    } catch { toast.error("Failed to download PDF"); }
  }

  async function downloadPPT(options) {
    if (!summary) return;
    try {
      setPptLoading(true);
      toast("Generating presentation...", { icon: "⏳" });
      const response = await api.post("/api/generate-ppt", { summary, filename: filename || selectedFile?.name || "Summary", documentId, options }, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (options?.title || filename || "Summary").replace(/\.[^/.]+$/, "");
      a.download = `${safeName}.pptx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Presentation downloaded!");
      addNotification({ title: "Download complete", message: `${safeName}.pptx was downloaded.`, type: "info" });
      setShowPptModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate presentation");
    } finally {
      setPptLoading(false);
    }
  }

  function clearFile() {
    setSelectedFile(null);
    setSummary("");
    setFilename("");
    setStats(null);
    setDocumentId(null);
    resetProgress();
  }

  function handleFileSelect(file) {
    if (!file) return;
    setSelectedFile(file);
    setSummary("");
    setStats(null);
    setDocumentId(null);
    resetProgress();
  }

  const { icon: fileIcon } = selectedFile ? fileTypeLabel(selectedFile) : { icon: "📄" };
  const { label: typeLabel, color: typeBadgeColor } = selectedFile ? fileTypeLabel(selectedFile) : {};

  const dropLabel = selectedFile && isImageFile(selectedFile) ? "Image ready for analysis"
    : selectedFile && isPdfFile(selectedFile)   ? "PDF ready for summary"
    : selectedFile && isExcelFile(selectedFile) ? "Spreadsheet ready for summary"
    : selectedFile && isDocxFile(selectedFile)  ? "Word document ready for summary"
    : selectedFile && isTextFile(selectedFile)  ? "Text file ready for summary"
    : "Drag & Drop your file here";

  const summarizeLabel = loading
    ? (isImageFile(selectedFile) ? "Analyzing Image…" : isExcelFile(selectedFile) ? "Summarizing Spreadsheet…" : "Generating Summary…")
    : (isImageFile(selectedFile) ? "Analyze Image"    : isExcelFile(selectedFile) ? "Summarize Spreadsheet"    : "Summarize Document");

  // Show progress bar while loading OR for 1.5 s after done (so user sees 100%)
  const showProgress = loading || progress.stage === "done" || progress.stage === "error";

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 transition-colors duration-300">

      <div className="flex items-start justify-between gap-4 mb-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Document</h2>
        {/* Usage badge — only summary type shown here */}
        <UsageBadge key={usageKey} type="summarize" className="w-64 shrink-0" />
      </div>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center transition-all duration-300
          ${dragging ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-gray-300 dark:border-gray-700"}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFileSelect(e.dataTransfer.files[0]); }}
      >
        <div className="text-6xl">{selectedFile ? fileIcon : "📄"}</div>
        <h3 className="text-2xl font-semibold mt-4 text-gray-900 dark:text-white">{dropLabel}</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">PDF, DOCX, TXT, XLSX, CSV, JPG, PNG, WEBP supported</p>

        <label className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition">
          Browse Files
          <input type="file" className="hidden" accept=".pdf,.txt,.docx,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp,.gif"
            onChange={(e) => handleFileSelect(e.target.files[0])} />
        </label>

        {selectedFile && (
          <div className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 w-full flex justify-between items-center">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-green-700 dark:text-green-400">{fileIcon} {selectedFile.name}</p>
              {typeLabel && <span className={`text-xs px-2 py-0.5 rounded-full ${typeBadgeColor}`}>{typeLabel}</span>}
            </div>
            <div className="text-gray-700 dark:text-gray-300 text-sm shrink-0 ml-4">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        )}
      </div>

      {selectedFile && <FilePreview file={selectedFile} />}

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <button onClick={clearFile} className="bg-red-600 text-white px-5 py-3 rounded-lg hover:bg-red-700 transition">❌</button>
        <button onClick={handleSummarize} disabled={!selectedFile || loading}
          className={`px-6 py-3 rounded-lg text-white transition
            ${loading ? "bg-yellow-500 cursor-not-allowed"
              : selectedFile ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-400 dark:bg-gray-700 cursor-not-allowed"}`}>
          {summarizeLabel}
        </button>
      </div>

      {/* ── Real Progress Bar ─────────────────────────────────────────────── */}
      {showProgress && (
        <ProgressBar progress={progress} isImage={isImageFile(selectedFile)} />
      )}

      {/* Summary Output */}
      {summary && (
        <div className="mt-8 bg-white dark:bg-gray-900 shadow rounded-xl p-6 border border-transparent dark:border-gray-800">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">AI Summary</h2>

          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
            h1: ({ children }) => <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400 mb-4">{children}</h1>,
            h2: ({ children }) => <h2 className="text-2xl font-semibold mt-5 mb-3 text-gray-900 dark:text-white">{children}</h2>,
            p:  ({ children }) => <p className="leading-7 mb-3 text-gray-700 dark:text-gray-300">{children}</p>,
            ul: ({ children }) => <ul className="list-disc ml-6 mb-3 text-gray-700 dark:text-gray-300">{children}</ul>,
            li: ({ children }) => <li className="mb-2">{children}</li>,
            strong: ({ children }) => <strong className="font-bold text-gray-900 dark:text-white">{children}</strong>,
          }}>
            {summary}
          </ReactMarkdown>

          {stats && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Document Statistics</h2>
              <div className="grid grid-cols-3 gap-5">
                {[
                  { icon: "📝", label: "Words",        value: stats.words },
                  { icon: "🔤", label: "Characters",   value: stats.characters },
                  { icon: "⏱",  label: "Reading Time", value: `${stats.readingTime} min` },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-5 shadow">
                    <h3 className="text-gray-700 dark:text-gray-300">{icon} {label}</h3>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-8 flex-wrap">
            <button onClick={copySummary} className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition">
              {copied ? "✅ Copied!" : "📋 Copy"}
            </button>
            <button onClick={downloadTXT} className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition">📄 Download TXT</button>
            <button onClick={downloadPDF} className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition">📑 Download PDF</button>
            <button onClick={() => setShowPptModal(true)} disabled={pptLoading}
              className={`px-5 py-2 rounded-lg text-white transition font-medium ${pptLoading ? "bg-orange-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600"}`}>
              {pptLoading ? "⏳ Generating..." : "📊 Download PPT"}
            </button>
          </div>

          <DocumentChat documentId={documentId} />
        </div>
      )}

      <PptOptionsModal
        open={showPptModal}
        defaultTitle={(filename || selectedFile?.name || "Summary").replace(/\.[^/.]+$/, "")}
        onCancel={() => setShowPptModal(false)}
        onConfirm={downloadPPT}
        loading={pptLoading}
      />
    </section>
  );
}

export default Uploadcard;