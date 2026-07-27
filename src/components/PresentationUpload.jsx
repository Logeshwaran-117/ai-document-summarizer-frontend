import { useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { Upload as UploadIcon, X, Type } from "lucide-react";

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".doc", ".xlsx", ".xls", ".csv", ".txt"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

function getExt(file) {
  return "." + file.name.split(".").pop().toLowerCase();
}

function fileLabel(file) {
  const ext = getExt(file);
  if (ext === ".pdf") return { label: "PDF", color: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300" };
  if (ext === ".docx" || ext === ".doc") return { label: "Word", color: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300" };
  if (ext === ".xlsx" || ext === ".xls") return { label: "Spreadsheet", color: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300" };
  if (ext === ".csv") return { label: "CSV", color: "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300" };
  if (ext === ".txt") return { label: "Text", color: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300" };
  return { label: "Document", color: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300" };
}

function PresentationUpload({ file, onFileSelect, onFileRemove, error }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function validate(file) {
    if (!file) return "No file selected";
    if (!ALLOWED_EXTENSIONS.includes(getExt(file))) {
      return "Only PDF, DOCX, XLSX, XLS, CSV, and TXT files are allowed";
    }
    if (file.size > MAX_SIZE) {
      return "Maximum file size is 10 MB";
    }
    return null;
  }

  function handleFile(file) {
    const err = validate(file);
    if (err) {
      toast.error(err);
      return;
    }
    onFileSelect(file);
  }

  return (
    <div className="flex flex-col">
      {!file ? (
        <div
          className="m-6 border-2 border-dashed rounded-xl p-14 flex flex-col items-center transition-all duration-300"
          style={{
            borderColor: dragging ? "var(--primary)" : "var(--border)",
            background: dragging ? "rgba(var(--primary-rgb),.06)" : "transparent",
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            handleFile(f);
          }}
          onClick={() => inputRef.current?.click()}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "rgba(var(--primary-rgb),.08)" }}>
            <UploadIcon size={28} style={{ color: "var(--primary)" }} />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--text)" }}>Drag & Drop your document here</h3>
          <p className="text-sm mb-6 text-center" style={{ color: "var(--muted)" }}>
            PDF, DOCX, XLSX, XLS, CSV, TXT supported
          </p>
          <label
            className="px-7 py-3 rounded-lg cursor-pointer text-white font-medium transition hover:opacity-90 shadow"
            style={{ background: "var(--primary)" }}
            onClick={(e) => e.stopPropagation()}
          >
            Select File
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </label>
          <p className="text-xs mt-4" style={{ color: "var(--muted)", opacity: 0.5 }}>Max file size: 10 MB</p>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          {/* File bar */}
          <div className="px-5 py-3 flex items-center gap-3 shrink-0"
            style={{ background: "var(--secondary)", borderBottom: "1px solid var(--border)" }}>
            <Type size={18} style={{ color: "var(--primary)", flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>{file.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {(() => {
                  const fl = fileLabel(file);
                  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${fl.color}`}>{fl.label}</span>;
                })()}
                <span className="text-[11px]" style={{ color: "var(--muted)" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>
            <label className="shrink-0 text-xs px-3 py-1.5 rounded-lg cursor-pointer font-medium transition hover:opacity-80"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted)" }}>
              Replace
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </label>
            <button
              onClick={onFileRemove}
              className="shrink-0 p-1.5 rounded-lg transition hover:opacity-80"
              style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted)" }}
              title="Remove file"
            >
              <X size={14} />
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mx-6 mt-4 p-3 rounded-lg text-xs font-medium" style={{ background: "rgba(239,68,68,.08)", color: "var(--danger)", border: "1px solid rgba(239,68,68,.2)" }}>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PresentationUpload;
