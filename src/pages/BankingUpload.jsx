import { useState, useRef } from "react";
import api from "../api";
import BankingReport from "./BankingReport";

const ACCEPTED = ".pdf,.csv,.xlsx,.xls,.txt,.doc,.docx,.png,.jpg,.jpeg,.webp";
const TYPE_LABELS = {
  bank_statement: "Bank Statement",
  loan: "Loan Document",
  financial_report: "Financial Report",
  investment: "Investment Portfolio",
  unknown: "Financial Document",
};

export default function BankingUpload({ onAnalysisDone }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState("idle"); // idle | uploading | done | error
  const [stageLabel, setStageLabel] = useState("");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const STAGES = [
    { pct: 10, label: "Uploading file…" },
    { pct: 25, label: "Extracting text content…" },
    { pct: 40, label: "Detecting document type & metadata…" },
    { pct: 55, label: "Extracting transactions…" },
    { pct: 70, label: "Categorising transactions…" },
    { pct: 82, label: "Running anomaly detection…" },
    { pct: 90, label: "Generating AI summary…" },
    { pct: 100, label: "Done!" },
  ];

  function pickFile(f) {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError("");
    setStage("idle");
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files[0]);
  }

  async function analyse() {
    if (!file) return;
    setStage("uploading");
    setError("");
    setResult(null);

    let stageIdx = 0;
    setProgress(STAGES[0].pct);
    setStageLabel(STAGES[0].label);

    const ticker = setInterval(() => {
      stageIdx = Math.min(stageIdx + 1, STAGES.length - 2);
      setProgress(STAGES[stageIdx].pct);
      setStageLabel(STAGES[stageIdx].label);
    }, 4500);

    try {
      const fd = new FormData();
      fd.append("document", file);
      const res = await api.post("/api/banking/analyse", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      clearInterval(ticker);
      setProgress(100);
      setStageLabel("Done!");
      setResult(res.data);
      setStage("done");
      if (onAnalysisDone) onAnalysisDone();
    } catch (err) {
      clearInterval(ticker);
      setError(err.response?.data?.message || "Analysis failed. Please try again.");
      setStage("error");
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError("");
    setStage("idle");
    setProgress(0);
  }

  if (stage === "done" && result) {
    return <BankingReport result={result} onBack={reset} />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Banking & Finance Analyser</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Upload bank statements, loan documents, financial reports, or investment portfolios for AI-powered analysis.
        </p>
      </div>

      {/* Supported types */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { icon: "🏦", label: "Bank Statements", sub: "PDF / CSV / Image", color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400" },
          { icon: "📋", label: "Loan Documents", sub: "PDF / Word", color: "from-violet-500/10 to-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400" },
          { icon: "📈", label: "Financial Reports", sub: "PDF / XLSX / Word", color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" },
          { icon: "💼", label: "Investments", sub: "PDF / CSV / XLSX", color: "from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" },
        ].map(({ icon, label, sub, color }) => (
          <div key={label} className={`bg-gradient-to-br ${color} backdrop-blur-md border rounded-2xl p-3.5 text-center transition-all duration-200 hover:-translate-y-0.5 shadow-sm`}>
            <div className="text-2xl mb-1.5">{icon}</div>
            <div className="text-xs font-bold text-gray-900 dark:text-white">{label}</div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all duration-200 select-none glass-card
          ${dragging ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]" : "border-gray-300 dark:border-gray-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-500/5"}`}
      >
        <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={e => pickFile(e.target.files[0])} />
        {file ? (
          <div className="py-2">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner">📄</div>
            <p className="font-bold text-gray-900 dark:text-white text-base">{file.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
            <button onClick={e => { e.stopPropagation(); reset(); }} className="mt-3 px-3 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium transition">Remove file</button>
          </div>
        ) : (
          <div className="py-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">🏦</div>
            <p className="text-gray-900 dark:text-white font-bold text-lg">Drop your financial document here</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">or click to browse from device</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 max-w-sm mx-auto">PDF, Word, Excel, CSV, TXT, or Image (PNG/JPG) · Max 10 MB</p>
          </div>
        )}
      </div>

      {/* Upload progress */}
      {(stage === "uploading") && (
        <div className="mt-6 glass-card rounded-2xl p-6 shadow-lg border border-indigo-500/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-gray-800 dark:text-gray-200">{stageLabel}</span>
            <span className="text-sm text-indigo-600 dark:text-indigo-400 font-bold font-mono">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-700 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center gap-2 mt-4 text-gray-500 dark:text-gray-400">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Analyzing financial structures & running AI heuristics…</p>
          </div>
        </div>
      )}

      {/* Error */}
      {stage === "error" && (
        <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-sm text-red-600 dark:text-red-400 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Analyse button */}
      {stage === "idle" && (
        <button
          onClick={analyse}
          disabled={!file}
          className={`mt-6 w-full py-4 rounded-2xl text-white font-bold text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2
            ${file ? "btn-gradient hover:opacity-95 hover:shadow-indigo-500/25" : "bg-gray-300 dark:bg-gray-800 cursor-not-allowed text-gray-400 dark:text-gray-600"}`}
        >
          <span>🔍</span> Analyse Document
        </button>
      )}

      {stage === "error" && (
        <button onClick={reset} className="mt-3 w-full py-3.5 rounded-2xl bg-gray-700 hover:bg-gray-800 text-white text-sm font-semibold transition">
          Try Again
        </button>
      )}
    </div>
  );
}