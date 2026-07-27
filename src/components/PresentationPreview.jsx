import { Download, FileType2 } from "lucide-react";
import { motion } from "framer-motion";

function PresentationPreview({ result, onDownload, onRetry }) {
  if (!result) return null;

  const slideCount = result.slideCount ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-5 overflow-y-auto"
      style={{ background: "rgba(var(--primary-rgb),.04)", border: "1px solid rgba(var(--primary-rgb),.12)" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(var(--primary-rgb),.12)", color: "var(--primary)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Presentation Ready</h2>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{slideCount} slides generated</p>
        </div>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-lg p-3" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
          <span className="text-[10px] font-bold uppercase tracking-widest block mb-0.5" style={{ color: "var(--muted)" }}>File</span>
          <span className="text-xs font-semibold truncate block" style={{ color: "var(--text)" }}>{result.filename || "Presentation.pptx"}</span>
        </div>
        <div className="rounded-lg p-3" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
          <span className="text-[10px] font-bold uppercase tracking-widest block mb-0.5" style={{ color: "var(--muted)" }}>Slides</span>
          <span className="text-xs font-semibold font-mono" style={{ color: "var(--text)" }}>{slideCount}</span>
        </div>
        <div className="rounded-lg p-3" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
          <span className="text-[10px] font-bold uppercase tracking-widest block mb-0.5" style={{ color: "var(--muted)" }}>Tokens Used</span>
          <span className="text-xs font-semibold font-mono" style={{ color: "var(--text)" }}>{result.tokensUsed || 0}</span>
        </div>
        <div className="rounded-lg p-3" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
          <span className="text-[10px] font-bold uppercase tracking-widest block mb-0.5" style={{ color: "var(--muted)" }}>Status</span>
          <span className="text-xs font-semibold" style={{ color: "var(--success)" }}>Ready</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={onDownload}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-semibold transition hover:opacity-90"
          style={{ background: "var(--primary)" }}
        >
          <Download size={15} />
          Download PPTX
        </button>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition hover:opacity-80"
          style={{ background: "var(--secondary)", color: "var(--muted)", border: "1px solid var(--border)" }}
        >
          Retry
        </button>
      </div>
    </motion.div>
  );
}

export default PresentationPreview;
