import { useState, useRef, useCallback, useEffect, useMemo } from "react";
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
  Target,
  LayoutGrid,
  RefreshCw,
  Presentation as PresentationIcon,
  Eye,
  Filter,
  CheckSquare,
  Square,
  ListChecks,
  Table2,
  PieChart,
  Lightbulb,
  AlertOctagon,
  ArrowLeft,
} from "lucide-react";
import UsageBadge from "../components/UsageBadge";

const ACCEPTED_TYPES = [
  ".pdf", ".docx", ".doc", ".xlsx", ".xls", ".csv", ".txt",
  ".png", ".jpg", ".jpeg", ".webp", ".tiff",
].join(",");

const PURPOSES = [
  "Executive Briefing", "Board Presentation", "Investor Pitch", "Client Report",
  "Internal Analysis", "Research Summary", "Audit Report", "Project Status", "Training Material",
];

const AUDIENCES = [
  "Senior Management", "Board of Directors", "Investors", "Clients",
  "Technical Team", "General Staff", "Government Officials", "Researchers",
];

const LANGUAGES = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam"];

const THEMES = [
  { id: "sharyx", label: "SharyX Brand Purple" },
  { id: "executive", label: "Executive Navy & Gold" },
  { id: "modern_dark", label: "Modern Dark & Neon" },
  { id: "corporate", label: "Corporate Slate & Blue" },
  { id: "clean_light", label: "Clean Minimal Light" },
  { id: "vibrant_tech", label: "Vibrant Tech Gradient" },
  { id: "pitch_deck", label: "Investor Pitch Deck" },
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

function range(n) {
  return Array.from({ length: n }, (_, i) => i);
}

const CHART_TYPE_OPTIONS = [
  { id: "bar", label: "Bar" },
  { id: "stackedBar", label: "Stacked Bar" },
  { id: "horizontalBar", label: "Horizontal Bar" },
  { id: "line", label: "Line" },
  { id: "pie", label: "Pie" },
  { id: "donut", label: "Donut" },
  { id: "area", label: "Area" },
];

const NARRATIVE_STYLES = [
  { id: "executive", label: "Executive", desc: "Concise insight bullets" },
  { id: "detailed", label: "Detailed", desc: "Richer context per slide" },
  { id: "data-heavy", label: "Data-heavy", desc: "Numbers, tables, charts first" },
];

const CHART_DENSITIES = [
  { id: "minimal", label: "Minimal", desc: "1–3 essential charts only" },
  { id: "balanced", label: "Balanced", desc: "Mix of KPIs, charts & tables" },
  { id: "heavy", label: "Heavy", desc: "Maximise chart slides" },
];

const VISUAL_EMPHASIS = [
  { id: "balanced", label: "Balanced" },
  { id: "data", label: "Data / visuals" },
  { id: "narrative", label: "Narrative / text" },
];

function buildDefaultSelection(intel) {
  if (!intel) return null;
  const chartOverrides = {};
  const tableOverrides = {};
  (intel.sections || []).forEach((sec, si) => {
    (sec.charts || []).forEach((c, ci) => {
      chartOverrides[`${si}-${ci}`] = {
        include: true,
        chartType: c.chartType || "bar",
      };
    });
    (sec.tables || []).forEach((t, ti) => {
      tableOverrides[`${si}-${ti}`] = { include: true };
    });
  });
  return {
    includeExecutiveSummary: !!intel.executiveSummary,
    selectedSectionIndices: range(intel.sections?.length || 0),
    selectedKpiIndices: range(intel.kpis?.length || 0),
    selectedFindingIndices: range(intel.keyFindings?.length || 0),
    selectedRecommendationIndices: range(intel.recommendations?.length || 0),
    selectedRiskIndices: range(intel.risks?.length || 0),
    includeTables: true,
    includeCharts: true,
    // Advanced generation prefs
    preferredChartTypes: ["bar", "donut", "line", "stackedBar"],
    chartDensity: "balanced",
    narrativeStyle: "executive",
    visualEmphasis: "balanced",
    includeProcessSlides: true,
    includeComparisonSlides: true,
    includeKpiOverview: true,
    includeAgenda: true,
    includeSummarySlide: true,
    includeRecommendationsSlide: true,
    chartOverrides,
    tableOverrides,
  };
}

function DropZone({ file, onFile, onRemove }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }, [onFile]);
  if (file) {
    return (
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border transition-all"
        style={{ background: "rgba(var(--primary-rgb), 0.04)", borderColor: "rgba(var(--primary-rgb), 0.2)" }}>
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="p-2.5 rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-sm">
            <GetFileIcon filename={file.name} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>{file.name}</h4>
            <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
              <span>{formatBytes(file.size)}</span>
              <span>•</span>
              <span className="text-[var(--success)] font-medium">Ready for AI processing</span>
            </div>
          </div>
        </div>
        <button onClick={onRemove} className="p-2 rounded-lg text-[var(--muted)] hover:text-rose-500 hover:bg-rose-500/10 transition" title="Remove file">
          <X size={18} />
        </button>
      </div>
    );
  }
  return (
    <div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}
      onClick={() => inputRef.current?.click()} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 group ${
        dragging ? "border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.06)] shadow-inner" : "border-[var(--border)] hover:border-[var(--primary)] bg-[var(--bg-subtle)]/50 hover:bg-[var(--bg-subtle)]"
      }`}>
      <input ref={inputRef} type="file" accept={ACCEPTED_TYPES} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} hidden />
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm"
        style={{ background: "rgba(var(--primary-rgb), 0.1)", color: "var(--primary)" }}>
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
          <span key={type} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium border"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--muted)" }}>{type}</span>
        ))}
      </div>
    </div>
  );
}

function PipelineProgress({ status, progress, message }) {
  const activeStage = PIPELINE_STAGES.find(s => s.id === status || (status === "done" && s.id === "complete"))
    || PIPELINE_STAGES.find(s => progress >= s.min && progress <= s.max) || PIPELINE_STAGES[0];
  const activeIdx = PIPELINE_STAGES.indexOf(activeStage);
  const ActiveIcon = activeStage.icon;
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(var(--primary-rgb), 0.12)", color: "var(--primary)" }}>
            <ActiveIcon size={24} className={status !== "complete" ? "animate-pulse" : ""} />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>{activeStage.label}</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{message || "Processing..."}</p>
          </div>
        </div>
        <span className="text-2xl font-black tracking-tight" style={{ color: "var(--primary)" }}>{progress}%</span>
      </div>
      <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(5, progress)}%`, background: "linear-gradient(90deg, var(--primary), #06B6D4)" }} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
        {PIPELINE_STAGES.map((stage, idx) => {
          const isDone = idx < activeIdx || progress === 100;
          const isActive = idx === activeIdx && progress < 100;
          const StageIcon = stage.icon;
          return (
            <div key={stage.id} className={`flex flex-col items-center text-center p-2.5 rounded-xl border transition-all ${
              isDone ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : isActive ? "bg-[rgba(var(--primary-rgb),0.1)] border-[var(--primary)] text-[var(--primary)] font-semibold shadow-sm"
              : "bg-[var(--bg-subtle)]/40 border-[var(--border)] text-[var(--muted)] opacity-60"
            }`}>
              <div className="mb-1.5">{isDone ? <CheckCircle2 size={16} /> : isActive ? <Loader2 size={16} className="animate-spin" /> : <StageIcon size={16} />}</div>
              <span className="text-[11px] leading-tight font-medium">{stage.label.split(" ")[0]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoryPanel({ history, onDownload, onDelete }) {
  if (!history || !history.length) {
    return (
      <div className="text-center py-14 px-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(var(--primary-rgb), 0.08)", color: "var(--primary)" }}>
          <FolderOpen size={26} />
        </div>
        <h3 className="text-base font-bold" style={{ color: "var(--text)" }}>No Presentations Yet</h3>
        <p className="text-xs mt-1 max-w-sm mx-auto" style={{ color: "var(--muted)" }}>Generated PowerPoint decks will be saved here for 7 days.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {history.map((item) => (
        <div key={item._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border glass-card transition hover:border-[var(--primary)]/40">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mt-0.5"><PresentationIcon size={22} /></div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold truncate" style={{ color: "var(--text)" }}>{item.title || item.filename}</h4>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs" style={{ color: "var(--muted)" }}>
                <span className="px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] font-medium">{item.slideCount || "18"} slides</span>
                <span>•</span><span>{item.intelligence?.documentType || "Document Deck"}</span>
                <span>•</span><span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button onClick={() => onDownload(item._id)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--primary)] text-white hover:opacity-90 transition shadow-sm">
              <Download size={14} /> Download
            </button>
            <button onClick={() => onDelete(item._id)} className="p-2 rounded-lg border border-[var(--border)] text-[var(--muted)] hover:text-rose-500 hover:bg-rose-500/10 transition" title="Delete">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SelectRow({ checked, onChange, children, sub }) {
  return (
    <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
      checked ? "border-[var(--primary)]/40 bg-[rgba(var(--primary-rgb),0.06)]" : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/25"
    }`}>
      <button type="button" onClick={(e) => { e.preventDefault(); onChange(!checked); }} className="mt-0.5 shrink-0" style={{ color: checked ? "var(--primary)" : "var(--muted)" }}>
        {checked ? <CheckSquare size={18} /> : <Square size={18} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium" style={{ color: "var(--text)" }}>{children}</div>
        {sub && <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: "var(--muted)" }}>{sub}</p>}
      </div>
    </label>
  );
}

function SectionHeader({ icon: Icon, title, count, selectedCount, onSelectAll, onClear }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-2">
      <div className="flex items-center gap-2">
        <Icon size={15} style={{ color: "var(--primary)" }} />
        <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text)" }}>{title}</h4>
        <span className="text-[10px] px-2 py-0.5 rounded-full border font-semibold" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>{selectedCount}/{count}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={onSelectAll} className="text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-[var(--bg-subtle)]" style={{ color: "var(--primary)" }}>All</button>
        <button type="button" onClick={onClear} className="text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-[var(--bg-subtle)]" style={{ color: "var(--muted)" }}>None</button>
      </div>
    </div>
  );
}

function ContentPreviewPanel({ intelligence, selection, setSelection, options, setOptions, showOptions, setShowOptions, onGenerate, onBack }) {
  const stats = intelligence?.stats || {};
  const toggleIndex = (key, idx) => {
    setSelection((prev) => {
      const arr = new Set(prev[key] || []);
      if (arr.has(idx)) arr.delete(idx); else arr.add(idx);
      return { ...prev, [key]: Array.from(arr).sort((a, b) => a - b) };
    });
  };
  const selectAll = (key, total) => setSelection((prev) => ({ ...prev, [key]: range(total) }));
  const clearAll = (key) => setSelection((prev) => ({ ...prev, [key]: [] }));
  const selectedTotal = useMemo(() => {
    if (!selection) return 0;
    return (selection.includeExecutiveSummary ? 1 : 0)
      + (selection.selectedSectionIndices?.length || 0)
      + (selection.selectedKpiIndices?.length || 0)
      + (selection.selectedFindingIndices?.length || 0)
      + (selection.selectedRecommendationIndices?.length || 0)
      + (selection.selectedRiskIndices?.length || 0);
  }, [selection]);
  const hasContent = selectedTotal > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="glass-card rounded-2xl p-5 sm:p-6 border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0"><Eye size={22} /></div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Content Preview &amp; Selection</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                Choose what from the source document should appear in your presentation. Only selected items will be used.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border" style={{ borderColor: "var(--border)", color: "var(--text)" }}>{intelligence.title || "Document"}</span>
                {intelligence.documentType && <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">{intelligence.documentType}</span>}
                {intelligence.organization && <span className="px-2.5 py-0.5 rounded-full text-[11px]" style={{ color: "var(--muted)" }}>{intelligence.organization}</span>}
                {intelligence.period && <span className="px-2.5 py-0.5 rounded-full text-[11px]" style={{ color: "var(--muted)" }}>{intelligence.period}</span>}
              </div>
            </div>
          </div>
          <button type="button" onClick={onBack} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium hover:bg-[var(--bg-subtle)] transition shrink-0" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            <ArrowLeft size={14} /> Change file
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { label: "Sections", value: stats.sectionCount || 0 },
            { label: "KPIs", value: stats.kpiCount || 0 },
            { label: "Findings", value: stats.findingCount || 0 },
            { label: "Actions", value: stats.recommendationCount || 0 },
            { label: "Risks", value: stats.riskCount || 0 },
            { label: "Tables", value: stats.tableCount || 0 },
            { label: "Charts", value: stats.chartCount || 0 },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-2.5 text-center border" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
              <p className="text-base font-bold tabular-nums" style={{ color: "var(--text)" }}>{s.value}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--muted)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 border space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Filter size={15} style={{ color: "var(--primary)" }} />
          <h3 className="text-sm font-bold" style={{ color: "var(--text)" }}>Content Filters</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <SelectRow checked={!!selection.includeExecutiveSummary} onChange={(v) => setSelection((p) => ({ ...p, includeExecutiveSummary: v }))}
            sub={intelligence.executiveSummary ? intelligence.executiveSummary.slice(0, 120) + (intelligence.executiveSummary.length > 120 ? "…" : "") : "No executive summary"}>
            Executive Summary
          </SelectRow>
          <SelectRow checked={!!selection.includeTables} onChange={(v) => setSelection((p) => ({ ...p, includeTables: v }))} sub={`${stats.tableCount || 0} tables found`}>
            Include Tables
          </SelectRow>
          <SelectRow checked={!!selection.includeCharts} onChange={(v) => setSelection((p) => ({ ...p, includeCharts: v }))} sub={`${stats.chartCount || 0} charts synthesised`}>
            Include Charts
          </SelectRow>
        </div>
      </div>

      {/* ── Advanced PPT Generation Options ── */}
      <div className="glass-card rounded-2xl p-5 border space-y-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={15} style={{ color: "var(--primary)" }} />
          <h3 className="text-sm font-bold" style={{ color: "var(--text)" }}>Advanced Generation Options</h3>
        </div>

        {/* Chart types */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Preferred chart types</p>
          <p className="text-[11px]" style={{ color: "var(--muted)" }}>Select which graph styles the AI should prefer when building slides.</p>
          <div className="flex flex-wrap gap-2">
            {CHART_TYPE_OPTIONS.map((ct) => {
              const on = (selection.preferredChartTypes || []).includes(ct.id);
              return (
                <button
                  key={ct.id}
                  type="button"
                  onClick={() => setSelection((p) => {
                    const cur = new Set(p.preferredChartTypes || []);
                    if (cur.has(ct.id)) cur.delete(ct.id); else cur.add(ct.id);
                    return { ...p, preferredChartTypes: Array.from(cur) };
                  })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                    on ? "border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.12)] text-[var(--primary)]" : "border-[var(--border)] text-[var(--muted)] hover:border-[var(--primary)]/40"
                  }`}
                >
                  {ct.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Density / narrative / emphasis */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Chart density</p>
            <div className="space-y-1.5">
              {CHART_DENSITIES.map((d) => (
                <button key={d.id} type="button" onClick={() => setSelection((p) => ({ ...p, chartDensity: d.id }))}
                  className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition ${
                    selection.chartDensity === d.id ? "border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.1)]" : "border-[var(--border)] hover:border-[var(--primary)]/30"
                  }`}>
                  <span className="font-semibold" style={{ color: "var(--text)" }}>{d.label}</span>
                  <span className="block mt-0.5" style={{ color: "var(--muted)" }}>{d.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Narrative style</p>
            <div className="space-y-1.5">
              {NARRATIVE_STYLES.map((d) => (
                <button key={d.id} type="button" onClick={() => setSelection((p) => ({ ...p, narrativeStyle: d.id }))}
                  className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition ${
                    selection.narrativeStyle === d.id ? "border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.1)]" : "border-[var(--border)] hover:border-[var(--primary)]/30"
                  }`}>
                  <span className="font-semibold" style={{ color: "var(--text)" }}>{d.label}</span>
                  <span className="block mt-0.5" style={{ color: "var(--muted)" }}>{d.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Visual emphasis</p>
            <div className="space-y-1.5">
              {VISUAL_EMPHASIS.map((d) => (
                <button key={d.id} type="button" onClick={() => setSelection((p) => ({ ...p, visualEmphasis: d.id }))}
                  className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition ${
                    selection.visualEmphasis === d.id ? "border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.1)]" : "border-[var(--border)] hover:border-[var(--primary)]/30"
                  }`}>
                  <span className="font-semibold" style={{ color: "var(--text)" }}>{d.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Structure toggles */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Slide structure</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[
              { key: "includeAgenda", label: "Agenda slide", sub: "Opening roadmap of topics" },
              { key: "includeKpiOverview", label: "KPI overview", sub: "Metric cards near the start" },
              { key: "includeProcessSlides", label: "Process / flow slides", sub: "Root-cause or step frameworks" },
              { key: "includeComparisonSlides", label: "Comparison slides", sub: "Side-by-side metric contrasts" },
              { key: "includeSummarySlide", label: "Summary & takeaways", sub: "Before recommendations" },
              { key: "includeRecommendationsSlide", label: "Recommendations", sub: "Numbered actions before Thank You" },
            ].map((item) => (
              <SelectRow
                key={item.key}
                checked={selection[item.key] !== false}
                onChange={(v) => setSelection((p) => ({ ...p, [item.key]: v }))}
                sub={item.sub}
              >
                {item.label}
              </SelectRow>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {(intelligence.sections?.length || 0) > 0 && (
          <div className="glass-card rounded-2xl p-5 border space-y-3">
            <SectionHeader icon={Layers} title="Sections" count={intelligence.sections.length} selectedCount={selection.selectedSectionIndices?.length || 0}
              onSelectAll={() => selectAll("selectedSectionIndices", intelligence.sections.length)} onClear={() => clearAll("selectedSectionIndices")} />
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {intelligence.sections.map((sec, idx) => (
                <SelectRow key={idx} checked={selection.selectedSectionIndices?.includes(idx)} onChange={() => toggleIndex("selectedSectionIndices", idx)}
                  sub={[sec.summary?.slice(0, 100), sec.tableCount ? `${sec.tableCount} table(s)` : null, sec.chartCount ? `${sec.chartCount} chart(s)` : null].filter(Boolean).join(" · ")}>
                  {sec.title}
                </SelectRow>
              ))}
            </div>
          </div>
        )}
        {(intelligence.kpis?.length || 0) > 0 && (
          <div className="glass-card rounded-2xl p-5 border space-y-3">
            <SectionHeader icon={BarChart3} title="KPIs / Metrics" count={intelligence.kpis.length} selectedCount={selection.selectedKpiIndices?.length || 0}
              onSelectAll={() => selectAll("selectedKpiIndices", intelligence.kpis.length)} onClear={() => clearAll("selectedKpiIndices")} />
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {intelligence.kpis.map((k, idx) => (
                <SelectRow key={idx} checked={selection.selectedKpiIndices?.includes(idx)} onChange={() => toggleIndex("selectedKpiIndices", idx)} sub={k.context || k.trend || undefined}>
                  <span className="font-semibold">{k.label}</span>
                  <span className="ml-2 text-[var(--primary)] font-mono text-xs">{k.value}{k.unit ? ` ${k.unit}` : ""}</span>
                </SelectRow>
              ))}
            </div>
          </div>
        )}
        {(intelligence.keyFindings?.length || 0) > 0 && (
          <div className="glass-card rounded-2xl p-5 border space-y-3">
            <SectionHeader icon={Lightbulb} title="Key Findings" count={intelligence.keyFindings.length} selectedCount={selection.selectedFindingIndices?.length || 0}
              onSelectAll={() => selectAll("selectedFindingIndices", intelligence.keyFindings.length)} onClear={() => clearAll("selectedFindingIndices")} />
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {intelligence.keyFindings.map((f, idx) => (
                <SelectRow key={idx} checked={selection.selectedFindingIndices?.includes(idx)} onChange={() => toggleIndex("selectedFindingIndices", idx)}>
                  <span className="text-xs leading-relaxed">{f}</span>
                </SelectRow>
              ))}
            </div>
          </div>
        )}
        {(intelligence.recommendations?.length || 0) > 0 && (
          <div className="glass-card rounded-2xl p-5 border space-y-3">
            <SectionHeader icon={ListChecks} title="Recommendations" count={intelligence.recommendations.length} selectedCount={selection.selectedRecommendationIndices?.length || 0}
              onSelectAll={() => selectAll("selectedRecommendationIndices", intelligence.recommendations.length)} onClear={() => clearAll("selectedRecommendationIndices")} />
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {intelligence.recommendations.map((r, idx) => (
                <SelectRow key={idx} checked={selection.selectedRecommendationIndices?.includes(idx)} onChange={() => toggleIndex("selectedRecommendationIndices", idx)}>
                  <span className="text-xs leading-relaxed">{r}</span>
                </SelectRow>
              ))}
            </div>
          </div>
        )}
        {(intelligence.risks?.length || 0) > 0 && (
          <div className="glass-card rounded-2xl p-5 border space-y-3 lg:col-span-2">
            <SectionHeader icon={AlertOctagon} title="Risks" count={intelligence.risks.length} selectedCount={selection.selectedRiskIndices?.length || 0}
              onSelectAll={() => selectAll("selectedRiskIndices", intelligence.risks.length)} onClear={() => clearAll("selectedRiskIndices")} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {intelligence.risks.map((r, idx) => (
                <SelectRow key={idx} checked={selection.selectedRiskIndices?.includes(idx)} onChange={() => toggleIndex("selectedRiskIndices", idx)}>
                  <span className="text-xs leading-relaxed">{r}</span>
                </SelectRow>
              ))}
            </div>
          </div>
        )}
      </div>

      {selection.includeTables && (stats.tableCount || 0) > 0 && (
        <div className="glass-card rounded-2xl p-5 border space-y-3">
          <div className="flex items-center gap-2">
            <Table2 size={15} style={{ color: "var(--primary)" }} />
            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text)" }}>Tables — include in deck</h4>
          </div>
          <p className="text-[11px]" style={{ color: "var(--muted)" }}>Uncheck any table you do not want as a slide.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(intelligence.sections || []).flatMap((sec, si) => {
              if (!selection.selectedSectionIndices?.includes(si)) return [];
              return (sec.tables || []).map((t, ti) => {
                const key = `${si}-${ti}`;
                const ov = selection.tableOverrides?.[key] || { include: true };
                return (
                  <div key={key} className={`p-3 rounded-xl border text-xs flex items-start gap-2 transition ${ov.include !== false ? "border-[var(--primary)]/30 bg-[rgba(var(--primary-rgb),0.04)]" : "border-[var(--border)] opacity-60"}`}>
                    <button type="button" onClick={() => setSelection((p) => ({
                      ...p,
                      tableOverrides: {
                        ...(p.tableOverrides || {}),
                        [key]: { include: ov.include === false },
                      },
                    }))} style={{ color: ov.include !== false ? "var(--primary)" : "var(--muted)" }}>
                      {ov.include !== false ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                    <div className="min-w-0">
                      <p className="font-semibold" style={{ color: "var(--text)" }}>{t.title || `Table ${ti + 1}`}</p>
                      <p style={{ color: "var(--muted)" }}>{(t.headers || []).slice(0, 4).join(" · ")}{t.rowCount ? ` · ${t.rowCount} rows` : ""}</p>
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>
      )}

      {selection.includeCharts && (stats.chartCount || 0) > 0 && (
        <div className="glass-card rounded-2xl p-5 border space-y-3">
          <div className="flex items-center gap-2">
            <PieChart size={15} style={{ color: "var(--primary)" }} />
            <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text)" }}>Charts — include & type</h4>
          </div>
          <p className="text-[11px]" style={{ color: "var(--muted)" }}>Toggle each chart and pick the graph type for that slide.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(intelligence.sections || []).flatMap((sec, si) => {
              if (!selection.selectedSectionIndices?.includes(si)) return [];
              return (sec.charts || []).map((c, ci) => {
                const key = `${si}-${ci}`;
                const ov = selection.chartOverrides?.[key] || { include: true, chartType: c.chartType || "bar" };
                return (
                  <div key={key} className={`p-3 rounded-xl border text-xs space-y-2 transition ${ov.include !== false ? "border-[var(--primary)]/30 bg-[rgba(var(--primary-rgb),0.04)]" : "border-[var(--border)] opacity-60"}`}>
                    <div className="flex items-start gap-2">
                      <button type="button" onClick={() => setSelection((p) => ({
                        ...p,
                        chartOverrides: {
                          ...(p.chartOverrides || {}),
                          [key]: { ...ov, include: ov.include === false },
                        },
                      }))} style={{ color: ov.include !== false ? "var(--primary)" : "var(--muted)" }}>
                        {ov.include !== false ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold" style={{ color: "var(--text)" }}>{c.title || `Chart ${ci + 1}`}</p>
                        <p className="line-clamp-1" style={{ color: "var(--muted)" }}>{c.insight || sec.title}</p>
                      </div>
                    </div>
                    {ov.include !== false && (
                      <select
                        value={ov.chartType || c.chartType || "bar"}
                        onChange={(e) => setSelection((p) => ({
                          ...p,
                          chartOverrides: {
                            ...(p.chartOverrides || {}),
                            [key]: { ...ov, chartType: e.target.value, include: true },
                          },
                        }))}
                        className="w-full px-2.5 py-1.5 rounded-lg text-[11px] font-medium border bg-[var(--card)]"
                        style={{ borderColor: "var(--border)", color: "var(--text)" }}
                      >
                        {CHART_TYPE_OPTIONS.map((ct) => (
                          <option key={ct.id} value={ct.id}>{ct.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              });
            })}
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-5 sm:p-6 border space-y-5">
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Desired Slide Count</label>
          <select value={options.slideCount} onChange={(e) => setOptions((o) => ({ ...o, slideCount: e.target.value }))}
            className="w-full sm:w-72 px-4 py-2.5 rounded-xl text-sm font-medium border bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition"
            style={{ borderColor: "var(--border)", color: "var(--text)" }}>
            {SLIDE_COUNTS.map((s) => <option key={s.value || "auto"} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <button type="button" onClick={() => setShowOptions((v) => !v)} className="flex items-center gap-2 text-xs font-semibold py-2 transition" style={{ color: "var(--primary)" }}>
            <SlidersHorizontal size={15} />
            <span>{showOptions ? "Hide Advanced Options" : "Show Advanced Options (Theme, Audience, Purpose, Language)"}</span>
            {showOptions ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <AnimatePresence>
            {showOptions && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 overflow-hidden">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Visual Theme</label>
                  <select value={options.theme} onChange={(e) => setOptions((o) => ({ ...o, theme: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs font-medium border bg-[var(--card)]" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                    {THEMES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Purpose</label>
                  <select value={options.purpose} onChange={(e) => setOptions((o) => ({ ...o, purpose: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs font-medium border bg-[var(--card)]" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                    {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Audience</label>
                  <select value={options.audience} onChange={(e) => setOptions((o) => ({ ...o, audience: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs font-medium border bg-[var(--card)]" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                    {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Language</label>
                  <select value={options.language} onChange={(e) => setOptions((o) => ({ ...o, language: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-xs font-medium border bg-[var(--card)]" style={{ borderColor: "var(--border)", color: "var(--text)" }}>
                    {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
                  <label className="block text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--muted)" }}>Watermark (optional)</label>
                  <input type="text" maxLength={60} placeholder="e.g. CONFIDENTIAL · Your Org" value={options.watermarkText || ""}
                    onChange={(e) => setOptions((o) => ({ ...o, watermarkText: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-xs font-medium border bg-[var(--card)]" style={{ borderColor: "var(--border)", color: "var(--text)" }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button type="button" disabled={!hasContent} onClick={onGenerate}
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
            hasContent ? "btn-gradient text-white shadow-lg cursor-pointer" : "bg-[var(--secondary)] text-[var(--muted)] opacity-60 cursor-not-allowed border border-[var(--border)]"
          }`}>
          <Sparkles size={18} />
          <span>Generate Presentation ({selectedTotal} content item{selectedTotal === 1 ? "" : "s"})</span>
        </button>
        {!hasContent && <p className="text-xs text-center text-rose-500 font-medium">Select at least one content item to continue.</p>}
      </div>
    </motion.div>
  );
}

export default function PresentationGenerator({ user }) {
  const [file, setFile] = useState(null);
  const [options, setOptions] = useState({
    purpose: "Executive Briefing", audience: "Senior Management", slideCount: "18",
    language: "English", theme: "sharyx", watermarkText: "",
  });
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressStatus, setProgressStatus] = useState("starting");
  const [resultInfo, setResultInfo] = useState(null);
  const [error, setError] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [selection, setSelection] = useState(null);
  const [activeTab, setActiveTab] = useState("generate");
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const jobIdRef = useRef(`pres_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const sseRef = useRef(null);
  const abortRef = useRef(null);
  const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (status !== "running" && status !== "analyzing") return;
    const interval = setInterval(() => setProgress((prev) => (prev < 92 ? prev + 1 : prev)), 600);
    return () => clearInterval(interval);
  }, [status]);

  const connectSSE = useCallback((jobId) => {
    if (sseRef.current) sseRef.current.close();
    const es = new EventSource(`${API}/api/progress/${jobId}`, { withCredentials: true });
    sseRef.current = es;
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        const percentVal = typeof data.percent === "number" ? data.percent : (typeof data.progress === "number" ? data.progress : null);
        const stageVal = data.stage || data.status;
        if (percentVal !== null) setProgress((prev) => Math.max(prev, percentVal));
        if (data.message) setProgressMessage(data.message);
        if (stageVal && stageVal !== "starting" && stageVal !== "running") setProgressStatus(stageVal);
        if (stageVal === "error" || data.status === "error") {
          setStatus("error");
          setError(data.message || "Generation failed");
          es.close();
        }
      } catch {}
    };
    es.onerror = () => es.close();
  }, [API]);

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus("analyzing");
    setProgress(8);
    setProgressMessage("Extracting document intelligence for preview…");
    setProgressStatus("parsing");
    setError(null);
    setIntelligence(null);
    setSelection(null);
    setResultInfo(null);
    const jobId = `pres_analyze_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    jobIdRef.current = jobId;
    connectSSE(jobId);
    const form = new FormData();
    form.append("file", file);
    form.append("jobId", jobId);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const resp = await fetch(`${API}/api/presentation/analyze`, { method: "POST", credentials: "include", body: form, signal: ctrl.signal });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.message || `Server error ${resp.status}`);
      }
      const data = await resp.json();
      if (!data.success || !data.intelligence) throw new Error(data.message || "Analysis returned no content");
      setIntelligence(data.intelligence);
      setSelection(buildDefaultSelection(data.intelligence));
      setStatus("preview");
      setProgress(100);
      setProgressMessage("Analysis complete — select content to include");
    } catch (err) {
      if (err.name === "AbortError") return;
      setStatus("error");
      setError(err.message || "Document analysis failed. Please try again.");
    } finally {
      if (sseRef.current) sseRef.current.close();
    }
  };

  const handleGenerate = async () => {
    if (!file || !selection) return;
    setStatus("running");
    setProgress(8);
    setProgressMessage("Generating presentation from selected content…");
    setProgressStatus("planning");
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
    form.append("contentSelection", JSON.stringify(selection));
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const resp = await fetch(`${API}/api/presentation/generate`, { method: "POST", credentials: "include", body: form, signal: ctrl.signal });
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.message || `Server error ${resp.status}`);
      }
      const slideCount = resp.headers.get("X-Slide-Count");
      const docType = resp.headers.get("X-Document-Type");
      const presId = resp.headers.get("X-Presentation-Id");
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
    setStatus(intelligence ? "preview" : "idle");
    setProgress(0);
    setProgressMessage("");
  };

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
    setIntelligence(null);
    setSelection(null);
    jobIdRef.current = `pres_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  };

  const handleBackToUpload = () => {
    setStatus("idle");
    setIntelligence(null);
    setSelection(null);
    setProgress(0);
    setError(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><PresentationIcon size={28} /></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading tracking-tight gradient-text">AI Presentation Generator</h1>
            <p className="text-xs sm:text-sm mt-0.5" style={{ color: "var(--muted)" }}>Analyze your document, choose what to include, then generate a structured PPTX deck.</p>
          </div>
        </div>
        <UsageBadge type="presentation" />
      </div>

      <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)] w-fit">
        <button onClick={() => setActiveTab("generate")} className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${activeTab === "generate" ? "bg-[var(--card)] text-[var(--text)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--text)]"}`}>
          <Sparkles size={16} className="text-indigo-500" /> Generate Deck
        </button>
        <button onClick={() => setActiveTab("history")} className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${activeTab === "history" ? "bg-[var(--card)] text-[var(--text)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--text)]"}`}>
          <Clock size={16} className="text-indigo-500" /> History
          {history.length > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">{history.length}</span>}
        </button>
      </div>

      {activeTab === "generate" && (
        <div className="space-y-6">
          {status === "idle" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Upload Source Document</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Step 1 of 2 — AI extracts sections, KPIs, findings, and recommendations so you can choose what goes into the slides.</p>
              </div>
              <DropZone file={file} onFile={(f) => { setFile(f); setIntelligence(null); setSelection(null); }} onRemove={() => { setFile(null); setIntelligence(null); setSelection(null); }} />
              <button disabled={!file} onClick={handleAnalyze}
                className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all ${
                  file ? "btn-gradient text-white shadow-lg cursor-pointer" : "bg-[var(--secondary)] text-[var(--muted)] opacity-60 cursor-not-allowed border border-[var(--border)]"
                }`}>
                <Eye size={18} /><span>Analyze Document &amp; Preview Content</span>
              </button>
            </motion.div>
          )}

          {status === "analyzing" && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border)" }}>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Analyzing Document</h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Source: <strong className="font-semibold text-[var(--text)]">{file?.name}</strong></p>
                </div>
                <button onClick={handleCancel} className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition">Cancel</button>
              </div>
              <PipelineProgress status={progressStatus} progress={progress} message={progressMessage} />
            </motion.div>
          )}

          {status === "preview" && intelligence && selection && (
            <ContentPreviewPanel intelligence={intelligence} selection={selection} setSelection={setSelection}
              options={options} setOptions={setOptions} showOptions={showOptions} setShowOptions={setShowOptions}
              onGenerate={handleGenerate} onBack={handleBackToUpload} />
          )}

          {status === "running" && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border)" }}>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Generating Presentation</h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Using your selected content from <strong className="font-semibold text-[var(--text)]">{file?.name}</strong></p>
                </div>
                <button onClick={handleCancel} className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition">Cancel</button>
              </div>
              <PipelineProgress status={progressStatus} progress={progress} message={progressMessage} />
            </motion.div>
          )}

          {status === "done" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-8 text-center space-y-5 border bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/30">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto"><CheckCircle2 size={36} /></div>
              <div>
                <h2 className="text-2xl font-black font-heading" style={{ color: "var(--text)" }}>Presentation Deck Ready!</h2>
                <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--muted)" }}>Generated from your selected content and downloaded.</p>
              </div>
              {resultInfo && (
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">📊 {resultInfo.slideCount} Slides</span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--card)] border border-[var(--border)]" style={{ color: "var(--text)" }}>📄 {resultInfo.docType}</span>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button onClick={handleReset} className="px-5 py-2.5 rounded-xl font-bold text-sm btn-gradient text-white shadow-md flex items-center gap-2"><RefreshCw size={16} /> Generate Another</button>
                {intelligence && <button onClick={() => setStatus("preview")} className="px-5 py-2.5 rounded-xl font-semibold text-sm border bg-[var(--card)] text-[var(--text)] hover:bg-[var(--bg-subtle)] transition" style={{ borderColor: "var(--border)" }}>Adjust Selection &amp; Regenerate</button>}
                <button onClick={() => setActiveTab("history")} className="px-5 py-2.5 rounded-xl font-semibold text-sm border bg-[var(--card)] text-[var(--text)] hover:bg-[var(--bg-subtle)] transition" style={{ borderColor: "var(--border)" }}>View All Presentations</button>
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-8 text-center space-y-4 border bg-rose-500/5 dark:bg-rose-950/20 border-rose-500/30">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto"><AlertTriangle size={30} /></div>
              <div>
                <h2 className="text-xl font-bold text-rose-600 dark:text-rose-400">{intelligence ? "Generation Failed" : "Analysis Failed"}</h2>
                <p className="text-xs sm:text-sm mt-1 max-w-md mx-auto" style={{ color: "var(--muted)" }}>{error || "An unexpected error occurred."}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {intelligence
                  ? <button onClick={() => setStatus("preview")} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-rose-600 text-white hover:bg-rose-700 transition shadow-md">Back to Selection</button>
                  : <button onClick={handleReset} className="px-5 py-2.5 rounded-xl font-bold text-sm bg-rose-600 text-white hover:bg-rose-700 transition shadow-md">Try Again</button>}
              </div>
            </motion.div>
          )}

          {status === "idle" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {[
                { icon: Eye, title: "Content Preview First", desc: "See sections, KPIs, and findings before any PPTX is built." },
                { icon: Filter, title: "Choose What to Include", desc: "Toggle sections, metrics, recommendations, tables, and charts." },
                { icon: BrainCircuit, title: "AI Document Intelligence", desc: "Extracts key insights, data points, and executive takeaways." },
                { icon: BarChart3, title: "Data & KPI Visuals", desc: "Formats metrics and tables into clear, slide-ready components." },
                { icon: Palette, title: "7 Custom Themes", desc: "Executive Navy, Pitch Deck, Tech Dark, Minimal Light & more." },
                { icon: ShieldCheck, title: "Secure & Private", desc: "Temporary processing with strict privacy guarantees." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="glass-card rounded-xl p-4 flex items-start gap-3 border transition hover:border-[var(--primary)]/40">
                  <div className="p-2 rounded-lg bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)] shrink-0"><Icon size={18} /></div>
                  <div>
                    <h4 className="text-xs font-bold" style={{ color: "var(--text)" }}>{title}</h4>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border)" }}>
            <div>
              <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Presentation History</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Your generated presentations are saved for 7 days.</p>
            </div>
            <button onClick={loadHistory} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-[var(--bg-subtle)] transition" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
              <RefreshCw size={13} className={historyLoading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
          {historyLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-[var(--muted)] gap-2">
              <Loader2 size={18} className="animate-spin text-[var(--primary)]" /><span>Loading presentations...</span>
            </div>
          ) : (
            <HistoryPanel history={history} onDownload={handleDownload} onDelete={handleDelete} />
          )}
        </div>
      )}
    </div>
  );
}
