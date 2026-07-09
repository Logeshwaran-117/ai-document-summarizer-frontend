import { useState } from "react";
import BankingUpload from "./BankingUpload";
import BankingHistory from "./BankingHistory";
import BankingDetailPage from "./BankingDetailPage";

const TABS = [
  { id: "analyse", label: "Analyse", icon: "🔍" },
  { id: "history", label: "History", icon: "🗂️" },
];

export default function Banking() {
  const [tab, setTab] = useState("analyse");
  const [viewingDocId, setViewingDocId] = useState(null);

  function handleViewDoc(id) {
    setViewingDocId(id);
  }

  function handleBackFromDetail() {
    setViewingDocId(null);
  }

  if (viewingDocId) {
    return (
      <div>
        <button
          onClick={handleBackFromDetail}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-flex items-center gap-1"
        >
          ← Back to History
        </button>
        <BankingDetailPage docId={viewingDocId} onBack={handleBackFromDetail} />
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg">🏦</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Banking & Finance</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered financial document analysis</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-t-lg transition
              ${tab === t.id
                ? "border border-b-white dark:border-b-gray-950 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-blue-600 dark:text-blue-400 -mb-px"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "analyse" && <BankingUpload />}
      {tab === "history" && <BankingHistory onViewDoc={handleViewDoc} />}
    </div>
  );
}
