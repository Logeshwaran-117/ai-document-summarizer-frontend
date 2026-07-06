import { useState } from "react";

const THEMES = [
  { key: "navyGold", label: "Navy & Gold", swatch: ["#1E2761", "#C9A84C"] },
  { key: "tealSlate", label: "Teal & Slate", swatch: ["#0F3D3E", "#3FBFAE"] },
  { key: "charcoalRuby", label: "Charcoal & Ruby", swatch: ["#231F20", "#C0392B"] },
];

const DETAIL_LEVELS = [
  { key: "concise", label: "Concise", hint: "Fewer bullets, high-level only" },
  { key: "standard", label: "Standard", hint: "Balanced detail (recommended)" },
  { key: "detailed", label: "Detailed", hint: "Maximum bullets & context" },
];

/**
 * Props:
 *  - open: boolean
 *  - defaultTitle: string
 *  - onCancel: () => void
 *  - onConfirm: (options) => void   options = { title, theme, detailLevel, includeAgenda, includeNotes }
 *  - loading: boolean
 */
function PptOptionsModal({ open, defaultTitle = "", onCancel, onConfirm, loading = false }) {
  const [title, setTitle] = useState(defaultTitle);
  const [theme, setTheme] = useState("navyGold");
  const [detailLevel, setDetailLevel] = useState("standard");
  const [includeAgenda, setIncludeAgenda] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);

  if (!open) return null;

  function handleConfirm() {
    onConfirm({
      title: title.trim() || defaultTitle,
      theme,
      detailLevel,
      includeAgenda,
      includeNotes,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onCancel}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">📊 Generate Presentation</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Choose how your slides should look before we build them.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Presentation Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={defaultTitle}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Detail level */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Detail Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DETAIL_LEVELS.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => setDetailLevel(d.key)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition ${
                    detailLevel === d.key
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-500"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{d.label}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{d.hint}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Color Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTheme(t.key)}
                  className={`flex flex-col items-center gap-2 px-3 py-3 rounded-lg border transition ${
                    theme === t.key
                      ? "border-blue-500 ring-1 ring-blue-500"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex gap-1">
                    <span className="w-5 h-5 rounded-full" style={{ backgroundColor: t.swatch[0] }} />
                    <span className="w-5 h-5 rounded-full" style={{ backgroundColor: t.swatch[1] }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Include agenda slide</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">A "What's Inside" overview after the cover</p>
              </div>
              <input
                type="checkbox"
                checked={includeAgenda}
                onChange={(e) => setIncludeAgenda(e.target.checked)}
                className="w-5 h-5 accent-blue-600"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Include speaker notes</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Plain-text notes attached to each slide</p>
              </div>
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
                className="w-5 h-5 accent-blue-600"
              />
            </label>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "⏳ Generating..." : "Generate PPT"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PptOptionsModal;
