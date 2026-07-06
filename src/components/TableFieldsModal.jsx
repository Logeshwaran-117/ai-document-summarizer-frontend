import { useState, useEffect } from "react";

/**
 * Props:
 *  - open: boolean
 *  - onCancel: () => void
 *  - onConfirm: (fields: string[]) => void
 *  - loading: boolean
 *  - suggestedFields: string[]  — AI-suggested fields (from backend)
 *  - loadingSuggestions: boolean
 */
function TableFieldsModal({ open, onCancel, onConfirm, loading = false, suggestedFields = [], loadingSuggestions = false }) {
  const [fields, setFields] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  // Auto-populate with AI suggestions when they arrive
  useEffect(() => {
    if (suggestedFields.length > 0 && fields.length === 0) {
      setFields(suggestedFields);
    }
  }, [suggestedFields]);

  // Reset when modal closes
  useEffect(() => {
    if (!open) {
      setFields([]);
      setInput("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  function addField(raw) {
    const value = raw.trim();
    if (!value) return;
    if (fields.some((f) => f.toLowerCase() === value.toLowerCase())) {
      setInput("");
      return;
    }
    setFields((prev) => [...prev, value]);
    setInput("");
    setError("");
  }

  function removeField(value) {
    setFields((prev) => prev.filter((f) => f !== value));
  }

  function toggleSuggestion(f) {
    if (fields.some((x) => x.toLowerCase() === f.toLowerCase())) {
      removeField(f);
    } else {
      addField(f);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addField(input);
    }
  }

  function handleConfirm() {
    if (fields.length === 0) {
      setError("Add at least one field for the table columns.");
      return;
    }
    onConfirm(fields);
  }

  // Fields that are AI-suggested but not yet in the selected list
  const remainingSuggestions = suggestedFields.filter(
    (f) => !fields.some((x) => x.toLowerCase() === f.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onCancel}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">📊 Table columns</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Choose which fields to extract from your document.
          </p>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <p className="text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/30 px-4 py-2 rounded-lg text-sm">
              {error}
            </p>
          )}

          {/* AI Suggestions */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                🤖 AI Suggested for this document
              </p>
              {loadingSuggestions && (
                <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>

            {loadingSuggestions ? (
              <div className="flex gap-2 flex-wrap">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                ))}
              </div>
            ) : suggestedFields.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {suggestedFields.map((f) => {
                  const selected = fields.some((x) => x.toLowerCase() === f.toLowerCase());
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => toggleSuggestion(f)}
                      className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition font-medium
                        ${selected
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        }`}
                    >
                      {selected ? "✓" : "+"} {f}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">No suggestions available — add fields manually below.</p>
            )}
          </div>

          {/* Selected fields */}
          {fields.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Selected columns ({fields.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {fields.map((f) => (
                  <span
                    key={f}
                    className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm px-3 py-1.5 rounded-full"
                  >
                    {f}
                    <button
                      type="button"
                      onClick={() => removeField(f)}
                      className="text-blue-400 hover:text-blue-700 dark:hover:text-blue-100 transition"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Manual entry */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              Add a custom field
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Invoice No — press Enter"
                className="flex-1 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => addField(input)}
                disabled={!input.trim()}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 transition"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
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
            disabled={loading || fields.length === 0}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "⏳ Extracting..." : `Extract Table (${fields.length} field${fields.length !== 1 ? "s" : ""})`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TableFieldsModal;
