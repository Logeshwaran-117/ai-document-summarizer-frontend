import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import api from "../api";
import toast from "react-hot-toast";
import { useNotifications } from "../context/NotificationContext";
import TableFieldsModal from "../components/TableFieldsModal";
import { exportTableToExcel, exportTableToPDF, exportTableToDocx } from "../utils/tableExport";
import TableChat from "../components/TableChat";
import UsageBadge from "../components/UsageBadge";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ── SSE progress hook (same as in Uploadcard) ─────────────────────────────────
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

// ── Table-specific stages ─────────────────────────────────────────────────────
const STAGE_STEPS = [
  { key: "uploading",  label: "Upload",   icon: "⬆️" },
  { key: "extracting", label: "Read",     icon: "📖" },
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
      <div className="flex items-center justify-between mb-1">
        <h2 className={`font-bold text-sm ${titleColor}`}>
          {error ? "❌ Error" : stage === "done" ? "✅ Table Extracted!" : isImage ? "🖼️ Reading image with Gemini Vision…" : "📊 Building your table…"}
        </h2>
        <span className={`text-sm font-bold tabular-nums ${error ? "text-red-500" : "text-blue-600 dark:text-blue-400"}`}>
          {error ? "Failed" : `${percent}%`}
        </span>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{message}</p>

      <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${barColor} ${stage !== "done" && !error ? "relative overflow-hidden" : ""}`}
          style={{ width: `${error ? 100 : percent}%` }}
        >
          {stage !== "done" && !error && (
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.4s_infinite]" />
          )}
        </div>
      </div>

      <div className="flex justify-between mt-3">
        {STAGE_STEPS.map((step, idx) => {
          const done   = !error && currentIdx >= idx;
          const active = !error && currentIdx === idx;
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

// ── Helpers ───────────────────────────────────────────────────────────────────
const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
];

function isImageFile(file) { return file && file.type.startsWith("image/"); }
function isPDFFile(file)   { return file && file.type === "application/pdf"; }

// ── Main ExcelSummary ─────────────────────────────────────────────────────────
function ExcelSummary() {
  const [selectedFile,       setSelectedFile]       = useState(null);
  const [previewUrl,         setPreviewUrl]         = useState(null);
  const [dragging,           setDragging]           = useState(false);
  const [showFieldsModal,    setShowFieldsModal]    = useState(false);
  const [extracting,         setExtracting]         = useState(false);
  const [result,             setResult]             = useState(null);
  const [numPages,           setNumPages]           = useState(null);
  const [currentPage,        setCurrentPage]        = useState(1);
  const [suggestedFields,    setSuggestedFields]    = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [tablePage,          setTablePage]          = useState(1);
  const [usageKey,           setUsageKey]           = useState(0);
  const TABLE_PAGE_SIZE = 10;

  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { progress, startListening, reset: resetProgress } = useProgress();

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  function handleFileSelect(file) {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only PDF, DOCX, TXT, JPG, PNG, and WEBP files are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Maximum file size is 10 MB");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setResult(null);
    setSuggestedFields([]);
    setCurrentPage(1);
    setNumPages(null);
    resetProgress();
    setPreviewUrl(URL.createObjectURL(file));
  }

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setResult(null);
    setPreviewUrl(null);
    setSuggestedFields([]);
    setCurrentPage(1);
    setNumPages(null);
    resetProgress();
  }

  async function handleGenerateClick() {
    if (!selectedFile) return;
    setShowFieldsModal(true);
    setLoadingSuggestions(true);
    setSuggestedFields([]);

    try {
      const formData = new FormData();
      formData.append("document", selectedFile);
      const res = await api.post("/api/suggest-fields", formData);
      setSuggestedFields(res.data.fields || []);
    } catch (err) {
      console.warn("Field suggestion failed:", err);
      const message = err.response?.data?.message;
      if (message) toast.error(`Couldn't auto-suggest fields: ${message}`);
    } finally {
      setLoadingSuggestions(false);
    }
  }

  async function handleExtract(fields) {
    if (!selectedFile) return;
    setShowFieldsModal(false);
    setExtracting(true);

    try {
      // Generate job id and open SSE before posting
      const jobId = crypto.randomUUID();
      startListening(jobId);

      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("fields", JSON.stringify(fields));
      formData.append("jobId", jobId);

      const response = await api.post("/api/extract-table", formData);
      setResult(response.data);
      setTablePage(1);
      setUsageKey(k => k + 1); // refresh usage badge
      toast.success("Table extracted successfully!");
      addNotification({ title: "Table ready", message: `${selectedFile.name} was converted into a table.`, type: "success" });
    } catch (error) {
      console.error(error);
      const errData = error.response?.data || {};
      const message = errData.message || "Error extracting table";
      if (errData.limitReached) {
        toast.error(`Plan limit reached — ${message}`);
        addNotification({ title: "Usage limit reached", message: `Upgrade your plan to continue. ${message}`, type: "warning" });
      } else {
        toast.error(message);
        addNotification({ title: "Extraction failed", message, type: "error" });
      }
      setResult(null);
    } finally {
      setExtracting(false);
    }
  }

  const onDocumentLoadSuccess = useCallback(({ numPages }) => { setNumPages(numPages); }, []);
  const baseName = (result?.filename || selectedFile?.name || "table").replace(/\.[^/.]+$/, "");
  const showProgress = extracting || progress.stage === "done" || progress.stage === "error";

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 transition-colors duration-300">

      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Table Generator</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Upload any document or image — even handwritten notes — and turn it into a structured table you define.
          </p>
        </div>
        {/* Usage badge — only table type shown here */}
        <UsageBadge key={usageKey} type="tables" className="w-64 shrink-0" />
      </div>

      <div className="mb-6" />

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-xl transition-all duration-300
          ${dragging ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-gray-300 dark:border-gray-700"}
          ${selectedFile ? "p-4" : "p-12 flex flex-col items-center"}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFileSelect(e.dataTransfer.files[0]); }}
      >
        {!selectedFile ? (
          <>
            <div className="text-6xl">📊</div>
            <h3 className="text-2xl font-semibold mt-4 text-gray-900 dark:text-white text-center">
              Drag & Drop your document here
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-center">
              PDF, DOCX, TXT, JPG, PNG, WEBP supported
            </p>
            <label className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition">
              Browse Files
              <input type="file" className="hidden" accept=".pdf,.txt,.docx,.jpg,.jpeg,.png,.webp,.gif"
                onChange={(e) => handleFileSelect(e.target.files[0])} />
            </label>
          </>
        ) : (
          <div className="w-full space-y-4">
            {/* File info */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{isImageFile(selectedFile) ? "🖼️" : isPDFFile(selectedFile) ? "📑" : "📄"}</span>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <label className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                Change file
                <input type="file" className="hidden" accept=".pdf,.txt,.docx,.jpg,.jpeg,.png,.webp,.gif"
                  onChange={(e) => handleFileSelect(e.target.files[0])} />
              </label>
            </div>

            {/* Image preview */}
            {isImageFile(selectedFile) && previewUrl && (
              <div className="flex justify-center bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <img src={previewUrl} alt="preview" className="max-h-96 max-w-full rounded-lg object-contain shadow" />
              </div>
            )}

            {/* PDF preview with page navigation */}
            {isPDFFile(selectedFile) && previewUrl && (
              <div className="flex flex-col items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <Document file={previewUrl} onLoadSuccess={onDocumentLoadSuccess} className="shadow-lg rounded overflow-hidden">
                  <Page pageNumber={currentPage} width={Math.min(560, window.innerWidth - 80)} renderTextLayer={true} renderAnnotationLayer={false} />
                </Document>
                {numPages && numPages > 1 && (
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40 transition">
                      ← Prev
                    </button>
                    <span>Page {currentPage} of {numPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage === numPages}
                      className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-40 transition">
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Non-previewable types */}
            {!isImageFile(selectedFile) && !isPDFFile(selectedFile) && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center text-gray-400 dark:text-gray-500 text-sm">
                📝 Text document — preview not available. Click Generate Table to proceed.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-6">
        <button onClick={clearFile} className="bg-red-600 text-white px-5 py-3 rounded-lg hover:bg-red-700 transition">❌</button>
        <button onClick={handleGenerateClick} disabled={!selectedFile || extracting}
          className={`px-6 py-3 rounded-lg text-white transition
            ${extracting ? "bg-yellow-500 cursor-not-allowed"
              : selectedFile ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 dark:bg-gray-700 cursor-not-allowed"}`}>
          {extracting ? "Extracting Table..." : "Generate Table"}
        </button>
      </div>

      {/* ── Real Progress Bar ─────────────────────────────────────────────── */}
      {showProgress && (
        <ProgressBar progress={progress} isImage={isImageFile(selectedFile)} />
      )}

      {/* Result Table */}
      {result && (() => {
        const totalPages = Math.ceil(result.rows.length / TABLE_PAGE_SIZE);
        const pageRows = result.rows.slice((tablePage - 1) * TABLE_PAGE_SIZE, tablePage * TABLE_PAGE_SIZE);
        return (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Extracted Table</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {result.rows.length} row{result.rows.length !== 1 ? "s" : ""} · {result.fields.length} field{result.fields.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => exportTableToExcel(result.fields, result.rows, baseName)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition font-medium">📗 Excel</button>
                <button onClick={() => exportTableToPDF(result.fields, result.rows, baseName)}   className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition font-medium">📕 PDF</button>
                <button onClick={() => exportTableToDocx(result.fields, result.rows, baseName)}  className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition font-medium">📘 Word</button>
                <button onClick={() => navigate("/history")} className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 dark:hover:bg-gray-600 transition font-medium">📚 View in History</button>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap w-10">#</th>
                      {result.fields.map((f) => (
                        <th key={f} className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">{f}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {pageRows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs tabular-nums">{(tablePage - 1) * TABLE_PAGE_SIZE + i + 1}</td>
                        {result.fields.map((f) => (
                          <td key={f} className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{row[f]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Showing {(tablePage - 1) * TABLE_PAGE_SIZE + 1}–{Math.min(tablePage * TABLE_PAGE_SIZE, result.rows.length)} of {result.rows.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setTablePage(1)} disabled={tablePage === 1} className="px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition">«</button>
                    <button onClick={() => setTablePage(p => Math.max(1, p - 1))} disabled={tablePage === 1} className="px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition">‹ Prev</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - tablePage) <= 1)
                      .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push("..."); acc.push(p); return acc; }, [])
                      .map((item, idx) =>
                        item === "..." ? <span key={`e-${idx}`} className="px-1 text-xs text-gray-400">…</span>
                        : <button key={item} onClick={() => setTablePage(item)}
                            className={`min-w-[28px] px-2 py-1 rounded text-xs font-medium transition ${tablePage === item ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                          >{item}</button>
                      )
                    }
                    <button onClick={() => setTablePage(p => Math.min(totalPages, p + 1))} disabled={tablePage === totalPages} className="px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition">Next ›</button>
                    <button onClick={() => setTablePage(totalPages)} disabled={tablePage === totalPages} className="px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition">»</button>
                  </div>
                </div>
              )}
            </div>

            <TableChat tableId={result._id} />
          </div>
        );
      })()}

      <TableFieldsModal
        open={showFieldsModal}
        onCancel={() => setShowFieldsModal(false)}
        onConfirm={handleExtract}
        loading={extracting}
        suggestedFields={suggestedFields}
        loadingSuggestions={loadingSuggestions}
      />
    </section>
  );
}

export default ExcelSummary;