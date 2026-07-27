import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../api";
import PresentationUpload from "../components/PresentationUpload";
import PresentationProgress from "../components/PresentationProgress";
import PresentationPreview from "../components/PresentationPreview";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Presentation() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [options, setOptions] = useState({
    audience: "executive",
    purpose: "report",
    theme: "corporate",
    title: "",
    company: "",
    footer: "",
  });
  const [progress, setProgress] = useState({
    stage: "idle",
    percent: 0,
    message: "",
    done: false,
    error: false,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const resetProgress = () => {
    setProgress({ stage: "idle", percent: 0, message: "", done: false, error: false });
    setResult(null);
  };

  function handleOptionChange(field, value) {
    setOptions((prev) => ({ ...prev, [field]: value }));
  }

  async function generatePresentation() {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "text/plain",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      const ext = selectedFile.name.split(".").pop().toLowerCase();
      if (!["pdf", "docx", "doc", "xlsx", "xls", "csv", "txt"].includes(ext)) {
        toast.error("Only PDF, DOCX, XLSX, XLS, CSV, and TXT files are allowed");
        return;
      }
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Maximum file size is 10 MB");
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      resetProgress();

      const jobId = crypto.randomUUID();

      const es = new EventSource(`${API_BASE}/api/progress/${jobId}`);
      setProgress({ stage: "uploading", percent: 5, message: "Uploading file...", done: false, error: false });

      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setProgress({
            stage: data.stage,
            percent: data.percent,
            message: data.message,
            done: data.stage === "done",
            error: data.stage === "error",
          });
          if (data.stage === "done" || data.stage === "error") {
            es.close();
          }
        } catch {}
      };
      es.onerror = () => {
        es.close();
        setProgress((prev) =>
          prev.stage !== "error" ? { ...prev, stage: "error", percent: 0, message: "Connection lost", error: true } : prev
        );
      };

      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("jobId", jobId);
      formData.append("audience", options.audience);
      formData.append("purpose", options.purpose);
      formData.append("theme", options.theme);
      formData.append("title", options.title || selectedFile.name);
      formData.append("company", options.company);
      formData.append("author", "User");
      formData.append("footerText", options.footer);

      const response = await api.post("/api/presentation/generate", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success) {
        setResult(response.data);
        toast.success("Presentation generated successfully!");
      } else {
        throw new Error(response.data?.message || "Generation failed");
      }
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message || "Error generating presentation";
      setProgress((prev) => ({
        ...prev,
        stage: "error",
        percent: 0,
        message,
        error: true,
        done: false,
      }));
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function downloadPresentation() {
    if (!result?.buffer) return;
    try {
      const byteCharacters = atob(result.buffer);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: result.mimeType || "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename || "presentation.pptx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Download failed");
    }
  }

  async function loadHistory() {
    try {
      setHistoryLoading(true);
      const res = await api.get("/api/presentation/history", { params: { page: 1, limit: 12 } });
      setHistory(res.data?.docs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const isGenerating = loading || progress.stage === "uploading" || progress.stage === "extracting" || progress.stage === "ai" || progress.stage === "saving";

  return (
    <section className="rounded-xl shadow-lg transition-colors duration-300 overflow-hidden" style={{ background: "var(--card)" }}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-2xl font-bold" style={{ color: "var(--text)" }}>AI Presentation Generator</h2>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Left Panel — Upload */}
        <div className="flex flex-col lg:w-[55%] lg:min-h-[520px]" style={result ? { borderRight: "1px solid var(--border)" } : {}}>
          <PresentationUpload
            file={selectedFile}
            onFileSelect={setSelectedFile}
            onFileRemove={() => { setSelectedFile(null); resetProgress(); setResult(null); }}
            error={progress.error ? progress.message : null}
          />

          {/* Options */}
          {selectedFile && !result && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--muted)" }}>Audience</label>
                  <select
                    value={options.audience}
                    onChange={(e) => handleOptionChange("audience", e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition"
                    style={{ background: "var(--secondary)", color: "var(--text)", border: "1px solid var(--border)" }}
                  >
                    <option value="executive">Executive</option>
                    <option value="general">General</option>
                    <option value="technical">Technical</option>
                    <option value="academic">Academic</option>
                    <option value="business">Business</option>
                    <option value="students">Students</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--muted)" }}>Purpose</label>
                  <select
                    value={options.purpose}
                    onChange={(e) => handleOptionChange("purpose", e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition"
                    style={{ background: "var(--secondary)", color: "var(--text)", border: "1px solid var(--border)" }}
                  >
                    <option value="report">Report</option>
                    <option value="educational">Educational</option>
                    <option value="business">Business Proposal</option>
                    <option value="sales">Sales Pitch</option>
                    <option value="training">Training</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--muted)" }}>Presentation Theme</label>
                  <select
                    value={options.theme}
                    onChange={(e) => handleOptionChange("theme", e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition"
                    style={{ background: "var(--secondary)", color: "var(--text)", border: "1px solid var(--border)" }}
                  >
                    <option value="professional">Professional</option>
                    <option value="modern">Modern</option>
                    <option value="minimal">Minimal</option>
                    <option value="creative">Creative</option>
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--muted)" }}>Title</label>
                  <input
                    type="text"
                    value={options.title}
                    onChange={(e) => handleOptionChange("title", e.target.value)}
                    placeholder="My Presentation"
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition"
                    style={{ background: "var(--secondary)", color: "var(--text)", border: "1px solid var(--border)" }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--muted)" }}>Company</label>
                  <input
                    type="text"
                    value={options.company}
                    onChange={(e) => handleOptionChange("company", e.target.value)}
                    placeholder="Your Company"
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition"
                    style={{ background: "var(--secondary)", color: "var(--text)", border: "1px solid var(--border)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--muted)" }}>Footer</label>
                  <input
                    type="text"
                    value={options.footer}
                    onChange={(e) => handleOptionChange("footer", e.target.value)}
                    placeholder="Confidential"
                    className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition"
                    style={{ background: "var(--secondary)", color: "var(--text)", border: "1px solid var(--border)" }}
                  />
                </div>
              </div>
              <button
                onClick={generatePresentation}
                disabled={isGenerating}
                className="w-full py-3 rounded-lg text-white font-semibold transition"
                style={{
                  background: "linear-gradient(135deg, var(--primary), #818cf8)",
                  cursor: isGenerating ? "not-allowed" : "pointer",
                  opacity: isGenerating ? 0.7 : 1,
                }}
              >
                {isGenerating ? "Generating..." : "Generate Presentation"}
              </button>
            </div>
          )}
        </div>

        {/* Right Panel — Progress / Preview */}
        <div className="flex flex-col lg:w-[45%] px-6 py-5 gap-4">
          {!result && !isGenerating && selectedFile && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style={{ background: "rgba(var(--primary-rgb),.12)", color: "var(--primary)" }}>✨</div>
              <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>AI Presentation</span>
            </div>
          )}

          {(isGenerating || progress.error) && (
            <PresentationProgress progress={progress} />
          )}

          {result && !loading && (
            <PresentationPreview
              result={result}
              onDownload={downloadPresentation}
              onRetry={() => { setResult(null); resetProgress(); }}
            />
          )}

          {/* History */}
          <div className="mt-4">
            <h3 className="text-sm font-bold mb-3" style={{ color: "var(--muted)" }}>Recent Presentations</h3>
            {historyLoading ? (
              <p className="text-xs" style={{ color: "var(--muted)" }}>Loading...</p>
            ) : history.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--muted)" }}>No presentations yet.</p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {history.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{item.filename || item.title || "Untitled"}</p>
                      <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                        {item.slideCount ? `${item.slideCount} slides` : ""} {item.tokenStatus || ""}
                      </p>
                    </div>
                     <button
                       onClick={() => toast.info("Presentation details view coming soon")}
                       className="shrink-0 p-2 rounded-lg transition hover:opacity-80"
                       style={{ background: "var(--secondary)", color: "var(--text)", border: "1px solid var(--border)" }}
                       title="Details"
                     >
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                         <circle cx="12" cy="12" r="10" />
                         <line x1="12" y1="8" x2="12" y2="12" />
                         <line x1="12" y1="16" x2="12.01" y2="16" />
                       </svg>
                     </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Presentation;
