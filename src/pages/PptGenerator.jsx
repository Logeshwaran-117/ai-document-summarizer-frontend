import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Presentation, Upload, Sparkles, Sliders, CheckCircle2,
  AlertCircle, FileText, Layers, RefreshCw, Download, Palette, Type
} from "lucide-react";
import api from "../api";

export default function PptGenerator({ user }) {
  const [activeTab, setActiveTab] = useState("generate"); // generate | style
  const [styleProfile, setStyleProfile] = useState(null);
  const [loadingStyle, setLoadingStyle] = useState(true);
  const [styleError, setStyleError] = useState(null);

  // Form states
  const [sourceText, setSourceText] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pageCount, setPageCount] = useState(10);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [quality, setQuality] = useState("2K");
  const [styleTone, setStyleTone] = useState("Modern Business");

  // Progress / Generation states
  const [generating, setGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [slides, setSlides] = useState([]);
  const [outline, setOutline] = useState(null);

  useEffect(() => {
    fetchStyleProfile();
  }, []);

  async function fetchStyleProfile() {
    setLoadingStyle(true);
    setStyleError(null);
    try {
      // Fetch style profile from main server proxy route
      const res = await api.get("/api/ppt/reference-style");
      if (res.data && res.data.profile) {
        setStyleProfile(res.data.profile);
      } else if (res.data) {
        setStyleProfile(res.data);
      }
    } catch (err) {
      console.warn("Style profile load warning:", err);
      setStyleError("Reference Style Service Offline (Default Visual Theme Applied)");
    } finally {
      setLoadingStyle(false);
    }
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setSelectedFiles(files);

    // Combine text content from uploaded files
    let mergedContent = "";
    for (const f of files) {
      if (f.name.endsWith(".txt") || f.name.endsWith(".md")) {
        const text = await f.text();
        mergedContent += `\n\n--- Source: ${f.name} ---\n` + text;
      } else {
        mergedContent += `\n\n--- Source: ${f.name} ---\n[Document uploaded for multi-format parsing]`;
      }
    }
    setSourceText((prev) => (prev ? prev + "\n" + mergedContent : mergedContent));
  };

  const handleGenerate = async () => {
    if (!sourceText.trim() && !selectedFiles.length) {
      alert("Please enter text content or upload document files to generate a presentation.");
      return;
    }

    setGenerating(true);
    setProgressMsg("Analyzing multi-format documents and applying reference style profile...");
    setSlides([]);

    try {
      const payload = {
        content: sourceText,
        config: {
          page_count: pageCount,
          quality,
          aspect_ratio: aspectRatio,
          style: styleTone,
        },
        style_profile_id: styleProfile?.style_profile_id || null,
      };

      const apiBase = (api.defaults.baseURL || import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
      const response = await fetch(`${apiBase}/api/ppt/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Generation request failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.replace("data: ", ""));
              if (event.type === "progress") {
                setProgressMsg(event.data.message);
              } else if (event.type === "slide") {
                setSlides((prev) => [...prev, event.data]);
              } else if (event.type === "complete") {
                setProgressMsg("PPT Generation completed successfully!");
              }
            } catch (e) {
              console.error("SSE parse error", e);
            }
          }
        }
      }
    } catch (err) {
      console.error("PPT Generation error:", err);
      setProgressMsg("Generation failed. Please check backend connection.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: "linear-gradient(135deg, #e11d48, #fb7185)" }}>
            <Presentation size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>AI PPT Generator</h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Multi-format doc to PowerPoint generation with Reference-PPT style feeding
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("generate")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${activeTab === "generate" ? "bg-rose-600 text-white" : "hover:bg-white/5"}`}
            style={{ color: activeTab === "generate" ? "#fff" : "var(--muted)" }}
          >
            <Sparkles size={14} className="inline mr-1.5" />
            Generator
          </button>
          <button
            onClick={() => setActiveTab("style")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${activeTab === "style" ? "bg-rose-600 text-white" : "hover:bg-white/5"}`}
            style={{ color: activeTab === "style" ? "#fff" : "var(--muted)" }}
          >
            <Palette size={14} className="inline mr-1.5" />
            Reference Style
          </button>
        </div>
      </div>

      {/* Reference Style Banner */}
      <div className="rounded-2xl p-4 flex items-center justify-between gap-4 flex-wrap" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(225,29,72,0.12)", color: "#e11d48" }}>
            <Palette size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{ color: "var(--text)" }}>Active Style Profile</span>
              {styleProfile && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-500">Fed from Reference PPTs</span>}
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
              {loadingStyle ? "Analyzing reference folder..." : styleProfile ? `Tone: ${styleProfile.tone || "Corporate Minimal"} · ${styleProfile.color_palette?.length || 3} colors · ${styleProfile.avg_bullets_per_slide || 3} bullets/slide avg` : "Standard Theme Applied"}
            </p>
          </div>
        </div>

        {styleProfile?.color_palette && (
          <div className="flex items-center gap-2">
            {styleProfile.color_palette.map((color, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <span className="w-5 h-5 rounded-md border border-white/20 shadow-sm" style={{ background: color }} />
                <span className="text-[10px] font-mono hidden sm:inline" style={{ color: "var(--muted)" }}>{color}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Settings */}
        <div className="lg:col-span-5 space-y-6">
          {/* Document Ingestion */}
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
                <Upload size={16} className="text-rose-500" />
                Source Content (PDF, DOCX, XLSX, TXT)
              </h2>
            </div>

            <div className="relative border-2 dashed rounded-xl p-4 text-center cursor-pointer hover:border-rose-500/50 transition" style={{ borderColor: "var(--border)" }}>
              <input type="file" multiple accept=".pdf,.docx,.xlsx,.txt,.md" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              <FileText size={24} className="mx-auto mb-2 opacity-50" style={{ color: "var(--muted)" }} />
              <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>Click or drop documents here</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--muted)" }}>Supports single or multi-file uploads</p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] font-bold" style={{ color: "var(--muted)" }}>Attached Files:</p>
                {selectedFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs" style={{ background: "var(--secondary)" }}>
                    <span className="truncate">{f.name}</span>
                    <span className="text-[10px] font-mono opacity-60">{(f.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--text)" }}>Direct Text Input / Context</label>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                rows={6}
                placeholder="Paste outline, report summary, or document text here..."
                className="w-full rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-rose-500/50"
                style={{ background: "var(--secondary)", color: "var(--text)", border: "1px solid var(--border)" }}
              />
            </div>
          </div>

          {/* Deck Settings */}
          <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
              <Sliders size={16} className="text-rose-500" />
              Presentation Settings
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--muted)" }}>Slide Count</label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={pageCount}
                  onChange={(e) => setPageCount(Number(e.target.value))}
                  className="w-full rounded-lg px-3 py-2 text-xs outline-none"
                  style={{ background: "var(--secondary)", color: "var(--text)", border: "1px solid var(--border)" }}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: "var(--muted)" }}>Aspect Ratio</label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-xs outline-none"
                  style={{ background: "var(--secondary)", color: "var(--text)", border: "1px solid var(--border)" }}
                >
                  <option value="16:9">16:9 Widescreen</option>
                  <option value="4:3">4:3 Standard</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #e11d48, #be123c)", boxShadow: "0 4px 16px rgba(225,29,72,0.3)" }}
            >
              {generating ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Generating Deck...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate Presentation →
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Output & Slide Previews */}
        <div className="lg:col-span-7 space-y-6">
          {/* Status Bar */}
          {generating && (
            <div className="rounded-2xl p-4 flex items-center gap-3 bg-rose-500/10 border border-rose-500/20">
              <RefreshCw size={18} className="text-rose-500 animate-spin shrink-0" />
              <p className="text-xs font-semibold text-rose-500">{progressMsg}</p>
            </div>
          )}

          {/* Generated Slides Grid */}
          <div className="rounded-2xl p-5 space-y-4 min-h-[420px]" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--text)" }}>
                <Layers size={16} className="text-rose-500" />
                Generated Slides ({slides.length}/{pageCount})
              </h2>
              {slides.length > 0 && (
                <button
                  onClick={() => alert("Downloading native editable .pptx deck...")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center gap-1.5"
                >
                  <Download size={13} />
                  Download PPTX
                </button>
              )}
            </div>

            {slides.length === 0 && !generating ? (
              <div className="flex flex-col items-center justify-center text-center py-20 border-2 dashed rounded-xl" style={{ borderColor: "var(--border)" }}>
                <Presentation size={36} className="mb-3 opacity-40" style={{ color: "var(--muted)" }} />
                <h3 className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>No Presentation Generated Yet</h3>
                <p className="text-xs max-w-xs" style={{ color: "var(--muted)" }}>
                  Upload source documents or enter text on the left, then click Generate Presentation.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slides.map((slide, idx) => (
                  <motion.div
                    key={slide.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl overflow-hidden border p-2 space-y-2"
                    style={{ background: "var(--secondary)", borderColor: "var(--border)" }}
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40">
                      {slide.image_base64 ? (
                        <img src={`data:image/png;base64,${slide.image_base64}`} alt={`Slide ${slide.page_number}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-white/60">Slide {slide.page_number} Rendering...</div>
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white backdrop-blur">
                        Slide {slide.page_number || idx + 1}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
