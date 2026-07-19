/**
 * PptGeneratorPage.jsx — Complete Rewrite (v2)
 * Fixes:
 *  1. extractedData.extractedText → extractedData.documentText (matches server response)
 *  2. suggestedTitle → title is auto-set from filename (no server field needed)
 *  3. Progress steps are timer-driven and show correctly during generation
 *  4. Dark premium UI retained
 */

import { useState, useRef, useEffect, useCallback } from "react";

const API_BASE = "/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(bytes) {
  if (!bytes) return "–";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
function fmtDate(d) {
  if (!d) return "–";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
const EXT_ICON = { pdf: "📄", docx: "📝", doc: "📝", txt: "📃", xlsx: "📊", xls: "📊", csv: "📊", png: "🖼️", jpg: "🖼️", jpeg: "🖼️", webp: "🖼️", pptx: "📊", ppt: "📊" };
function fileIcon(name = "") { const ext = (name.split(".").pop() || "").toLowerCase(); return EXT_ICON[ext] || "📎"; }

// ── Static data ───────────────────────────────────────────────────────────────
const THEMES = [
  { key: "Professional", label: "Professional", colors: ["#1E2761", "#C9A84C", "#2FA4A0"] },
  { key: "Modern",       label: "Modern",       colors: ["#0D1B2A", "#00B4D8", "#0077B6"] },
  { key: "Minimal",      label: "Minimal",      colors: ["#0F3D3E", "#3FBFAE", "#F39C12"] },
  { key: "Corporate",    label: "Corporate",    colors: ["#1A1A2E", "#7C3AED", "#06B6D4"] },
  { key: "Creative",     label: "Creative",     colors: ["#1B4332", "#F4A261", "#40916C"] },
  { key: "Dark",         label: "Dark",         colors: ["#0F0F0F", "#C0392B", "#E67E22"] },
  { key: "Finance",      label: "Finance",      colors: ["#0A2342", "#D4AF37", "#C0A030"] },
  { key: "Healthcare",   label: "Healthcare",   colors: ["#1B3A4B", "#52B788", "#40916C"] },
];

const AUDIENCES = [
  { key: "Executive/C-Suite",       icon: "👔" },
  { key: "Business Stakeholders",   icon: "💼" },
  { key: "Technical Team",          icon: "⚙️" },
  { key: "General Audience",        icon: "🌍" },
  { key: "Investors",               icon: "💰" },
  { key: "Clients",                 icon: "🤝" },
  { key: "Students",                icon: "🎓" },
  { key: "Medical Professionals",   icon: "🏥" },
];

const PURPOSES = [
  { key: "Inform and present findings",  label: "Present Findings",   icon: "📢" },
  { key: "Pitch / Persuade",            label: "Pitch/Persuade",     icon: "💡" },
  { key: "Training / Education",        label: "Training",           icon: "📚" },
  { key: "Project status update",       label: "Status Update",      icon: "📈" },
  { key: "Financial review",            label: "Financial Review",   icon: "💵" },
  { key: "Strategy presentation",       label: "Strategy",           icon: "🎯" },
  { key: "Research presentation",       label: "Research",           icon: "🔬" },
];

const SECTIONS_LIST = ["Cover", "Agenda", "Executive Summary", "Key Findings", "Data Analysis", "Charts & Visuals", "Recommendations", "Conclusions", "Appendix"];

const PROGRESS_STEPS = [
  { id: 1, icon: "📤", label: "Uploading & reading document" },
  { id: 2, icon: "🔍", label: "Detecting document type & structure" },
  { id: 3, icon: "🧠", label: "Building presentation strategy" },
  { id: 4, icon: "🗂", label: "Designing slide outline" },
  { id: 5, icon: "✍️", label: "Writing slide content" },
  { id: 6, icon: "🎨", label: "Assembling PPTX file" },
];

// ── Theme colours ─────────────────────────────────────────────────────────────
const C = {
  bg: "#050A14", card: "#0B1120", cardBorder: "rgba(255,255,255,0.07)",
  accent: "#6366F1", accentGlow: "rgba(99,102,241,0.3)", cyan: "#22D3EE",
  success: "#10B981", error: "#EF4444",
  textPrimary: "#F1F5F9", textSecondary: "#94A3B8", textMuted: "#475569",
  divider: "rgba(255,255,255,0.06)",
};
const card = { background: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: 24 };
const T = "all 0.2s cubic-bezier(0.4,0,0.2,1)";

// ── Component ─────────────────────────────────────────────────────────────────
export default function PptGeneratorPage() {
  const [activeTab, setActiveTab]       = useState("generate");
  const [file, setFile]                 = useState(null);
  const [isDragging, setIsDragging]     = useState(false);
  const [extracting, setExtracting]     = useState(false);
  const [extractedData, setExtractedData] = useState(null);   // full server response
  const [uploadError, setUploadError]   = useState("");
  const fileInputRef                    = useRef(null);

  // Wizard
  const [title, setTitle]               = useState("");
  const [subtitle, setSubtitle]         = useState("");
  const [audience, setAudience]         = useState("Executive/C-Suite");
  const [purpose, setPurpose]           = useState("Inform and present findings");
  const [theme, setTheme]               = useState("Professional");
  const [slideCount, setSlideCount]     = useState(12);
  const [contentDensity, setContentDensity] = useState("Balanced");
  const [chartType, setChartType]       = useState("Smart");
  const [sections, setSections]         = useState(["Cover", "Executive Summary", "Key Findings", "Conclusions"]);
  const [speakerNotes, setSpeakerNotes] = useState(true);

  // Generation
  const [generating, setGenerating]     = useState(false);
  const [currentStep, setCurrentStep]   = useState(0);
  const [generationError, setGenerationError] = useState("");
  const [success, setSuccess]           = useState(null);
  const stepTimersRef                   = useRef([]);

  // History
  const [history, setHistory]           = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch]   = useState("");

  // Smart detection label
  const [detectedType, setDetectedType] = useState("");

  useEffect(() => {
    if (activeTab === "history") loadHistory();
  }, [activeTab]);

  // Drive progress steps forward while generating
  useEffect(() => {
    stepTimersRef.current.forEach(clearTimeout);
    stepTimersRef.current = [];
    if (!generating) { setCurrentStep(0); return; }
    // Steps advance at realistic intervals matching the 4-step AI pipeline
    const delays = [0, 1000, 3500, 7000, 12000, 18000];
    delays.forEach((delay, i) => {
      stepTimersRef.current.push(setTimeout(() => setCurrentStep(i + 1), delay));
    });
    return () => stepTimersRef.current.forEach(clearTimeout);
  }, [generating]);

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const r = await fetch(`${API_BASE}/ppt/presentations`, { credentials: "include" });
      if (r.ok) { const d = await r.json(); setHistory(d.presentations || []); }
    } catch {}
    setHistoryLoading(false);
  }

  function inferDocType(filename = "") {
    const ext = (filename.split(".").pop() || "").toLowerCase();
    const map = { pdf:"PDF Document", xlsx:"Excel Spreadsheet", xls:"Excel Spreadsheet", csv:"CSV Data", docx:"Word Document", doc:"Word Document", png:"Image", jpg:"Image", jpeg:"Image", webp:"Image", txt:"Text Document", pptx:"PowerPoint", ppt:"PowerPoint" };
    return map[ext] || "Document";
  }

  const onDrop = useCallback(async (droppedFile) => {
    if (!droppedFile) return;
    setFile(droppedFile);
    setExtractedData(null);
    setUploadError("");
    setSuccess(null);
    setDetectedType("");
    setExtracting(true);

    const form = new FormData();
    form.append("file", droppedFile);
    try {
      const r = await fetch(`${API_BASE}/ppt/upload-and-extract`, { method: "POST", body: form, credentials: "include" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Upload failed");
      setExtractedData(d);
      // Auto-fill title from filename (strip extension)
      const autoTitle = droppedFile.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setTitle(d.suggestedTitle || autoTitle);
      setDetectedType(inferDocType(droppedFile.name));
    } catch (e) {
      setUploadError(e.message);
    }
    setExtracting(false);
  }, []);

  function handleDragOver(e)  { e.preventDefault(); setIsDragging(true); }
  function handleDragLeave()  { setIsDragging(false); }
  function handleDrop(e)      { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) onDrop(f); }
  function handleFileInput(e) { const f = e.target.files[0]; if (f) onDrop(f); }

  async function handleGenerate() {
    if (!extractedData) return;

    // extractedData.documentText is the field the server returns
    const docText = extractedData.documentText || extractedData.extractedText || "";
    if (!docText && !extractedData.documentId) {
      setGenerationError("No document text found. Please re-upload the file.");
      return;
    }

    setGenerating(true);
    setGenerationError("");
    setSuccess(null);

    try {
      const body = {
        documentId:   extractedData.documentId,
        documentText: docText,
        filename:     file?.name || "Document",
        wizardOptions: {
          title,
          subtitle,
          audience,
          purpose,
          theme,
          slideCount,
          contentDensity,
          chartType: chartType === "Smart" ? "auto" : chartType === "Rich" ? "rich" : "minimal",
          sections,
          speakerNotes: speakerNotes ? "Yes" : "No",
          isImage:    extractedData.isImage    || false,
          base64Data: extractedData.base64Data || undefined,
          mimeType:   extractedData.mimeType   || undefined,
        },
      };

      const r = await fetch(`${API_BASE}/ppt/generate-ppt-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.message || "Generation failed");
      }

      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `${title || "presentation"}.pptx`;
      a.click();
      URL.revokeObjectURL(url);

      setSuccess({
        slides:  r.headers.get("X-Slide-Count") || slideCount,
        theme,
        docType: detectedType,
      });
      setCurrentStep(6);
    } catch (e) {
      setGenerationError(e.message);
    }
    setGenerating(false);
  }

  function toggleSection(s) {
    setSections(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function downloadHistory(id, filename) {
    try {
      const r = await fetch(`${API_BASE}/ppt/presentations/${id}/download`, { credentials: "include" });
      const blob = await r.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url; a.download = filename || "presentation.pptx"; a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }

  async function deleteHistory(id) {
    try {
      await fetch(`${API_BASE}/ppt/presentations/${id}`, { method: "DELETE", credentials: "include" });
      setHistory(prev => prev.filter(p => p._id !== id));
    } catch {}
  }

  const filteredHistory = history.filter(p =>
    !historySearch ||
    p.filename?.toLowerCase().includes(historySearch.toLowerCase()) ||
    p.sourceFilename?.toLowerCase().includes(historySearch.toLowerCase())
  );

  const canGenerate = !!extractedData && !generating && !extracting;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.textPrimary,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", paddingBottom: 60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:6px;}
        ::-webkit-scrollbar-track{background:#0B1120;}
        ::-webkit-scrollbar-thumb{background:#2D3748;border-radius:3px;}
        input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;background:rgba(255,255,255,0.1);outline:none;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#6366F1;cursor:pointer;box-shadow:0 0 0 3px rgba(99,102,241,0.3);}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(250%)}}`}
      </style>

      {/* Hero */}
      <div style={{ background:"linear-gradient(180deg,#090F1E 0%,#050A14 100%)", borderBottom:`1px solid ${C.cardBorder}`, padding:"48px 0 36px" }}>
        <div style={{ maxWidth:1000, margin:"0 auto", padding:"0 24px", textAlign:"center" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.25)", borderRadius:40, padding:"6px 16px", marginBottom:18 }}>
            <span style={{ fontSize:12, color:C.accent, fontWeight:600, letterSpacing:1 }}>AI-POWERED</span>
          </div>
          <h1 style={{ margin:0, fontSize:44, fontWeight:700, lineHeight:1.15,
            background:`linear-gradient(135deg,${C.accent} 0%,${C.cyan} 100%)`,
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
            AI Presentation Generator
          </h1>
          <p style={{ margin:"14px 0 0", color:C.textSecondary, fontSize:17 }}>
            Drop any document. Get a boardroom-ready presentation.
          </p>
          <div style={{ display:"flex", justifyContent:"center", gap:12, flexWrap:"wrap", marginTop:20 }}>
            {["✦ 12 File Formats","✦ 8 Slide Types","✦ 8 Themes","✦ AI-Powered"].map(b => (
              <span key={b} style={{ fontSize:12, color:C.textMuted, fontWeight:500, background:"rgba(255,255,255,0.04)", border:`1px solid ${C.cardBorder}`, borderRadius:20, padding:"5px 14px" }}>{b}</span>
            ))}
          </div>
          {/* Tabs */}
          <div style={{ display:"flex", justifyContent:"center", gap:4, marginTop:28 }}>
            {[{key:"generate",label:"Generate"},{key:"history",label:"History"}].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                background: activeTab === tab.key ? C.accent : "transparent",
                color: activeTab === tab.key ? "#fff" : C.textSecondary,
                border:"none", borderRadius:8, padding:"9px 24px", fontSize:14, fontWeight:600, cursor:"pointer", transition:T }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1000, margin:"0 auto", padding:"32px 24px 0" }}>

        {/* ── GENERATE TAB ───────────────────────────────────────────────── */}
        {activeTab === "generate" && (
          <>
            {/* Upload zone */}
            <div
              onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => !file && fileInputRef.current?.click()}
              style={{
                ...card, minHeight:260,
                display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column",
                cursor: file ? "default" : "pointer",
                border: isDragging ? `1.5px solid ${C.accent}` : `1.5px dashed ${extractedData ? C.success : C.cardBorder}`,
                boxShadow: isDragging ? `0 0 0 4px ${C.accentGlow}` : "none",
                transition:T, position:"relative", overflow:"hidden",
              }}>
              {isDragging && <div style={{ position:"absolute", inset:0, background:"rgba(99,102,241,0.06)", pointerEvents:"none" }} />}

              {extracting ? (
                <div style={{ textAlign:"center" }}>
                  <div style={{ width:260, height:5, background:"rgba(255,255,255,0.07)", borderRadius:3, overflow:"hidden", margin:"0 auto 16px" }}>
                    <div style={{ height:"100%", background:`linear-gradient(90deg,${C.accent},${C.cyan})`, borderRadius:3, animation:"shimmer 1.5s ease-in-out infinite", width:"60%" }} />
                  </div>
                  <p style={{ color:C.textSecondary, margin:0 }}>Extracting document content…</p>
                </div>
              ) : extractedData ? (
                <div style={{ textAlign:"center" }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>{fileIcon(file?.name)}</div>
                  <div style={{ fontWeight:600, color:C.textPrimary, fontSize:16 }}>{file?.name}</div>
                  <div style={{ display:"flex", gap:8, justifyContent:"center", marginTop:8, flexWrap:"wrap" }}>
                    <span style={{ fontSize:11, background:"rgba(16,185,129,0.12)", color:C.success, border:"1px solid rgba(16,185,129,0.3)", borderRadius:20, padding:"3px 10px", fontWeight:600 }}>✓ Ready</span>
                    <span style={{ fontSize:11, background:"rgba(255,255,255,0.05)", color:C.textMuted, border:`1px solid ${C.cardBorder}`, borderRadius:20, padding:"3px 10px" }}>{fmt(file?.size)}</span>
                    {extractedData.stats && (
                      <span style={{ fontSize:11, background:"rgba(255,255,255,0.05)", color:C.textMuted, border:`1px solid ${C.cardBorder}`, borderRadius:20, padding:"3px 10px" }}>{extractedData.stats.words?.toLocaleString()} words</span>
                    )}
                  </div>
                  <button onClick={e => { e.stopPropagation(); setFile(null); setExtractedData(null); setSuccess(null); setDetectedType(""); setTitle(""); }}
                    style={{ marginTop:12, background:"none", border:"none", color:C.textMuted, fontSize:12, cursor:"pointer", textDecoration:"underline" }}>
                    Remove file
                  </button>
                </div>
              ) : (
                <div style={{ textAlign:"center", pointerEvents:"none" }}>
                  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" style={{ marginBottom:16 }}>
                    <rect width="52" height="52" rx="14" fill="rgba(99,102,241,0.1)" />
                    <path d="M16 38h20M26 14v20M19 21l7-7 7 7" stroke={C.accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="18" y="28" width="16" height="14" rx="2" stroke={C.textMuted} strokeWidth="1.5" />
                  </svg>
                  <div style={{ fontWeight:600, fontSize:18, color:C.textPrimary, marginBottom:8 }}>Drop your file here</div>
                  <div style={{ color:C.textMuted, fontSize:13, marginBottom:18 }}>PDF · Word · Excel · CSV · TXT · PNG · JPG · WEBP · PPTX</div>
                  <button onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    style={{ background:"rgba(99,102,241,0.15)", border:`1px solid rgba(99,102,241,0.4)`, color:C.accent, borderRadius:8, padding:"9px 22px", fontSize:13, fontWeight:600, cursor:"pointer", transition:T }}>
                    Browse files
                  </button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.webp,.pptx,.ppt" onChange={handleFileInput} style={{ display:"none" }} />
            </div>

            {uploadError && (
              <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:10, padding:"12px 16px", color:"#FCA5A5", fontSize:13, marginTop:12 }}>
                ⚠️ {uploadError}
              </div>
            )}

            {/* Detection banner */}
            {detectedType && extractedData && (
              <div style={{ background:"rgba(34,211,238,0.07)", border:"1px solid rgba(34,211,238,0.2)", borderRadius:10, padding:"10px 16px", marginTop:12, display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:16 }}>📊</span>
                <span style={{ color:C.cyan, fontSize:13, fontWeight:500 }}>
                  {detectedType} detected — optimising AI analysis for this document type
                </span>
              </div>
            )}

            {/* How it works (no file) */}
            {!extractedData && !extracting && (
              <div style={{ marginTop:32 }}>
                <div style={{ color:C.textMuted, fontSize:11, fontWeight:600, letterSpacing:1.5, textAlign:"center", marginBottom:16 }}>HOW IT WORKS</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14 }}>
                  {[
                    { icon:"📤", title:"Upload Document",  desc:"Drop any file — PDF, Word, Excel, CSV, image, or text" },
                    { icon:"🧠", title:"AI Analyses",      desc:"4-step pipeline extracts real data, insights, and structure" },
                    { icon:"🎨", title:"Configure Style",  desc:"Choose theme, audience, purpose, and slide density" },
                    { icon:"⬇️", title:"Download PPTX",   desc:"Professional deck ready to present, no editing required" },
                  ].map((s, i) => (
                    <div key={i} style={{ ...card, borderTop:`2px solid ${C.accent}`, padding:"18px 20px" }}>
                      <div style={{ fontSize:22, marginBottom:8 }}>{s.icon}</div>
                      <div style={{ fontWeight:600, fontSize:13, color:C.textPrimary, marginBottom:4 }}>{s.title}</div>
                      <div style={{ color:C.textMuted, fontSize:12 }}>{s.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wizard — shown after upload, hidden during generation / success */}
            {extractedData && !success && !generating && (
              <div style={{ marginTop:24 }}>
                {/* Presentation Identity */}
                <WizardSection title="Presentation Identity">
                  <div style={{ marginBottom:14 }}>
                    <label style={labelStyle}>Title</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Auto-generated from document" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Subtitle / Tagline <span style={{ color:C.textMuted, fontWeight:400 }}>(optional)</span></label>
                    <input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="e.g. Q1 2026 Financial Review" style={inputStyle} />
                  </div>
                </WizardSection>

                {/* Audience & Purpose */}
                <WizardSection title="Audience & Purpose">
                  <div style={{ marginBottom:18 }}>
                    <label style={labelStyle}>Target Audience</label>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                      {AUDIENCES.map(a => (
                        <ChipCard key={a.key} selected={audience === a.key} onClick={() => setAudience(a.key)} icon={a.icon} label={a.key} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Purpose</label>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                      {PURPOSES.map(p => (
                        <ChipCard key={p.key} selected={purpose === p.key} onClick={() => setPurpose(p.key)} icon={p.icon} label={p.label} />
                      ))}
                    </div>
                  </div>
                </WizardSection>

                {/* Visual Style */}
                <WizardSection title="Visual Style">
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))", gap:10 }}>
                    {THEMES.map(t => (
                      <div key={t.key} onClick={() => setTheme(t.key)} style={{
                        ...card, padding:"12px 10px", cursor:"pointer",
                        border: theme === t.key ? `2px solid ${C.accent}` : `1px solid ${C.cardBorder}`,
                        boxShadow: theme === t.key ? `0 0 0 3px ${C.accentGlow}` : "none",
                        transition:T, textAlign:"center" }}>
                        <div style={{ display:"flex", gap:3, justifyContent:"center", marginBottom:8 }}>
                          {t.colors.map((c, i) => <div key={i} style={{ width:18, height:18, borderRadius:4, background:c }} />)}
                        </div>
                        <div style={{ fontSize:11, fontWeight:600, color: theme === t.key ? C.accent : C.textSecondary }}>{t.label}</div>
                        {theme === t.key && <div style={{ width:8, height:8, borderRadius:"50%", background:C.accent, margin:"6px auto 0" }} />}
                      </div>
                    ))}
                  </div>
                </WizardSection>

                {/* Slide Configuration */}
                <WizardSection title="Slide Configuration">
                  <div style={{ marginBottom:20 }}>
                    <label style={labelStyle}>
                      Slide Count — <span style={{ color:C.accent, fontSize:22, fontWeight:700 }}>{slideCount}</span>
                    </label>
                    <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:6 }}>
                      <span style={{ color:C.textMuted, fontSize:12 }}>5</span>
                      <input type="range" min={5} max={30} step={1} value={slideCount}
                        onChange={e => setSlideCount(Number(e.target.value))} style={{ flex:1 }} />
                      <span style={{ color:C.textMuted, fontSize:12 }}>30</span>
                    </div>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
                    <div>
                      <label style={labelStyle}>Content Density</label>
                      <ToggleGroup options={["Concise","Balanced","Detailed"]} value={contentDensity} onChange={setContentDensity} />
                    </div>
                    <div>
                      <label style={labelStyle}>Chart Richness</label>
                      <ToggleGroup options={["Minimal","Smart","Rich"]} value={chartType} onChange={setChartType} />
                    </div>
                  </div>

                  <div style={{ marginTop:18 }}>
                    <label style={labelStyle}>Sections to Include</label>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:6 }}>
                      {SECTIONS_LIST.map(s => (
                        <button key={s} onClick={() => toggleSection(s)} style={{
                          background: sections.includes(s) ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${sections.includes(s) ? "rgba(99,102,241,0.5)" : C.cardBorder}`,
                          color: sections.includes(s) ? C.accent : C.textMuted,
                          borderRadius:20, padding:"6px 14px", fontSize:12, fontWeight:500, cursor:"pointer", transition:T }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:18, padding:"14px 16px", background:"rgba(255,255,255,0.03)", borderRadius:10, border:`1px solid ${C.cardBorder}` }}>
                    <div>
                      <div style={{ fontWeight:600, color:C.textPrimary, fontSize:13 }}>Speaker Notes</div>
                      <div style={{ color:C.textMuted, fontSize:12 }}>Include presenter talking points</div>
                    </div>
                    <div onClick={() => setSpeakerNotes(p => !p)} style={{ width:46, height:26, borderRadius:13, background: speakerNotes ? C.accent : "rgba(255,255,255,0.1)", cursor:"pointer", transition:T, position:"relative" }}>
                      <div style={{ position:"absolute", top:3, left: speakerNotes ? 23 : 3, width:20, height:20, borderRadius:"50%", background:"#fff", transition:T }} />
                    </div>
                  </div>
                </WizardSection>

                {/* Generate button */}
                <button onClick={handleGenerate} disabled={!canGenerate} style={{
                  width:"100%", height:56, borderRadius:12, border:"none",
                  background: canGenerate ? `linear-gradient(135deg,${C.accent} 0%,#8B5CF6 100%)` : "rgba(255,255,255,0.05)",
                  color: canGenerate ? "#fff" : C.textMuted,
                  fontSize:16, fontWeight:700, cursor: canGenerate ? "pointer" : "not-allowed",
                  opacity: canGenerate ? 1 : 0.5,
                  boxShadow: canGenerate ? `0 4px 20px ${C.accentGlow}` : "none",
                  transition:T, marginTop:8 }}>
                  Generate Presentation →
                  <span style={{ fontWeight:400, opacity:0.75, marginLeft:8, fontSize:13 }}>(~{slideCount} slides)</span>
                </button>

                {generationError && (
                  <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:10, padding:"12px 16px", color:"#FCA5A5", fontSize:13, marginTop:12 }}>
                    ⚠️ {generationError}
                  </div>
                )}
              </div>
            )}

            {/* ── PROGRESS (shown while generating) ── */}
            {generating && (
              <div style={{ ...card, marginTop:24 }}>
                <div style={{ fontWeight:600, color:C.textPrimary, marginBottom:20, fontSize:15 }}>
                  Generating your presentation…
                </div>
                {PROGRESS_STEPS.map(step => {
                  const done   = currentStep > step.id;
                  const active = currentStep === step.id;
                  return (
                    <div key={step.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom: step.id < 6 ? `1px solid ${C.divider}` : "none" }}>
                      <div style={{
                        width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
                        background: done ? "rgba(16,185,129,0.15)" : active ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${done ? C.success : active ? C.accent : "rgba(255,255,255,0.1)"}`,
                        fontSize:14, transition:T,
                      }}>
                        {done
                          ? <span style={{ color:C.success, fontWeight:700 }}>✓</span>
                          : active
                            ? <span style={{ display:"inline-block", animation:"spin 1s linear infinite", color:C.accent }}>◌</span>
                            : <span style={{ color:C.textMuted, fontSize:11 }}>·</span>}
                      </div>
                      <div>
                        <span style={{ fontSize:16, marginRight:8 }}>{step.icon}</span>
                        <span style={{ fontSize:13, color: done ? C.success : active ? C.textPrimary : C.textMuted, transition:T }}>
                          {step.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {/* Progress bar */}
                <div style={{ marginTop:20, height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" }}>
                  <div style={{
                    height:"100%",
                    background:`linear-gradient(90deg,${C.accent},${C.cyan})`,
                    borderRadius:2,
                    width:`${Math.min((currentStep / 6) * 100, 100)}%`,
                    transition:"width 1s ease",
                  }} />
                </div>
                <div style={{ marginTop:10, fontSize:12, color:C.textMuted, textAlign:"center" }}>
                  This usually takes 20–60 seconds depending on document size
                </div>
              </div>
            )}

            {/* ── SUCCESS ── */}
            {success && (
              <div style={{ ...card, marginTop:24, textAlign:"center", padding:40 }}>
                <div style={{ fontSize:48, marginBottom:12 }}>✅</div>
                <div style={{ fontWeight:700, fontSize:22, color:C.textPrimary, marginBottom:8 }}>Your presentation is ready!</div>
                <div style={{ color:C.textMuted, fontSize:14, marginBottom:20 }}>
                  {success.slides} slides · {success.theme} theme · {success.docType}
                </div>
                <button onClick={() => { setSuccess(null); setFile(null); setExtractedData(null); setDetectedType(""); setTitle(""); }}
                  style={{ background:`linear-gradient(135deg,${C.accent} 0%,#8B5CF6 100%)`, color:"#fff", border:"none", borderRadius:10, padding:"12px 28px", fontSize:14, fontWeight:600, cursor:"pointer" }}>
                  Generate Another →
                </button>
              </div>
            )}
          </>
        )}

        {/* ── HISTORY TAB ───────────────────────────────────────────────── */}
        {activeTab === "history" && (
          <div>
            <div style={{ marginBottom:20 }}>
              <input value={historySearch} onChange={e => setHistorySearch(e.target.value)}
                placeholder="Search presentations…" style={{ ...inputStyle, width:"100%", margin:0 }} />
            </div>

            {historyLoading ? (
              <div style={{ textAlign:"center", padding:"60px 0", color:C.textMuted }}>Loading history…</div>
            ) : filteredHistory.length === 0 ? (
              <div style={{ ...card, textAlign:"center", padding:"60px 0" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
                <div style={{ fontWeight:600, color:C.textPrimary, marginBottom:6 }}>No presentations yet</div>
                <div style={{ color:C.textMuted, fontSize:13 }}>Generate your first one above.</div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {filteredHistory.map(p => (
                  <div key={p._id} style={{ ...card, padding:"16px 20px", display:"flex", alignItems:"center", gap:16 }}>
                    <div style={{ fontSize:26, flexShrink:0 }}>{fileIcon(p.sourceFilename)}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, color:C.textPrimary, fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.filename}</div>
                      <div style={{ color:C.textMuted, fontSize:12, marginTop:2 }}>
                        {p.sourceFilename} · {p.slideCount} slides · {fmtDate(p.createdAt)} · {fmt(p.sizeBytes)}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                      {p.theme && (
                        <span style={{ fontSize:11, background:"rgba(99,102,241,0.1)", color:C.accent, border:"1px solid rgba(99,102,241,0.25)", borderRadius:12, padding:"3px 8px" }}>{p.theme}</span>
                      )}
                      <button onClick={() => downloadHistory(p._id, p.filename)}
                        style={{ background:`linear-gradient(135deg,${C.accent},#8B5CF6)`, color:"#fff", border:"none", borderRadius:7, padding:"6px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}>
                        Download
                      </button>
                      <button onClick={() => deleteHistory(p._id)}
                        style={{ background:"rgba(239,68,68,0.1)", color:"#FCA5A5", border:"1px solid rgba(239,68,68,0.2)", borderRadius:7, padding:"6px 12px", fontSize:12, cursor:"pointer" }}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function WizardSection({ title, children }) {
  return (
    <div style={{ background:"#0B1120", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, padding:24, marginBottom:16 }}>
      <div style={{ fontWeight:700, fontSize:12, color:"#475569", letterSpacing:1.2, textTransform:"uppercase", marginBottom:18 }}>{title}</div>
      {children}
    </div>
  );
}

function ChipCard({ selected, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      background: selected ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${selected ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)"}`,
      color: selected ? "#6366F1" : "#94A3B8",
      borderRadius:10, padding:"8px 14px", fontSize:12.5, fontWeight:500, cursor:"pointer",
      transition:"all 0.2s cubic-bezier(0.4,0,0.2,1)",
      display:"flex", alignItems:"center", gap:6 }}>
      <span>{icon}</span>{label}
    </button>
  );
}

function ToggleGroup({ options, value, onChange }) {
  return (
    <div style={{ display:"flex", gap:4, marginTop:6 }}>
      {options.map(opt => (
        <button key={opt} onClick={() => onChange(opt)} style={{
          flex:1, padding:"8px 0", fontSize:12, fontWeight:600,
          background: value === opt ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${value === opt ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)"}`,
          color: value === opt ? "#6366F1" : "#94A3B8",
          borderRadius:8, cursor:"pointer", transition:"all 0.2s cubic-bezier(0.4,0,0.2,1)" }}>
          {opt}
        </button>
      ))}
    </div>
  );
}

const labelStyle = { display:"block", fontSize:11, fontWeight:700, color:"#475569", letterSpacing:0.8, textTransform:"uppercase", marginBottom:8 };
const inputStyle = {
  width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
  borderRadius:10, padding:"11px 14px", color:"#F1F5F9", fontSize:14, outline:"none",
  transition:"all 0.2s", marginBottom:0,
};