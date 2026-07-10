import { useState } from "react";
import { Link } from "react-router-dom";
import BankingUpload from "./BankingUpload";
import BankingHistory from "./BankingHistory";
import BankingDetailPage from "./BankingDetailPage";
import UsageBadge from "../components/UsageBadge";

const TABS = [
  { id: "analyse", label: "Analyse", icon: "🔍" },
  { id: "history", label: "History", icon: "🗂️" },
];

// Plans that are allowed to use banking
const ALLOWED_PLANS = ["pro", "enterprise"];

function BankingAccessGate({ user }) {
  const plan = user?.plan?.toLowerCase() || "free";
  const allowed = ALLOWED_PLANS.includes(plan);

  if (allowed) return null; // no gate needed

  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {/* Lock icon */}
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-4xl mb-5 shadow-lg shadow-blue-600/30">
        🔒
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Pro & Enterprise Only
      </h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-1 text-sm">
        Banking & Finance analysis is available on the <span className="font-semibold text-blue-600 dark:text-blue-400">Pro</span> and{" "}
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">Enterprise</span> plans.
      </p>
      <p className="text-gray-400 dark:text-gray-500 text-xs mb-8">
        Your current plan: <span className="capitalize font-medium">{plan}</span>
      </p>

      {/* Plan cards */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 text-left w-52">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚡</span>
            <span className="font-bold text-blue-700 dark:text-blue-400">Pro</span>
          </div>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>✅ Banking document analysis</li>
            <li>✅ 100 summaries / month</li>
            <li>✅ 50 table extractions</li>
          </ul>
        </div>
        <div className="border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-4 text-left w-52">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🏢</span>
            <span className="font-bold text-indigo-700 dark:text-indigo-400">Enterprise</span>
          </div>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>✅ Unlimited banking analyses</li>
            <li>✅ Unlimited everything</li>
            <li>✅ Priority support</li>
          </ul>
        </div>
      </div>

      <Link
        to="/pricing"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 hover:from-blue-700 hover:to-indigo-700 transition-all"
      >
        View Plans & Upgrade →
      </Link>
    </div>
  );
}

export default function Banking({ user }) {
  const [tab, setTab] = useState("analyse");
  const [viewingDocId, setViewingDocId] = useState(null);
  const [usageKey, setUsageKey] = useState(0);

  const plan = user?.plan?.toLowerCase() || "free";
  const isAllowed = ALLOWED_PLANS.includes(plan);

  function handleViewDoc(id) { setViewingDocId(id); }
  function handleBackFromDetail() { setViewingDocId(null); }
  function handleAnalysisDone() { setUsageKey(k => k + 1); }

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
        <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg">🏦</div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Banking & Finance</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI-powered financial document analysis</p>
            </div>
          </div>

          {/* Usage badge — only visible if allowed */}
          {isAllowed && (
            <UsageBadge key={usageKey} type="banking" className="w-64 shrink-0" />
          )}
        </div>
      </div>

      {/* Access gate for free users */}
      {!isAllowed ? (
        <BankingAccessGate user={user} />
      ) : (
        <>
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

          {tab === "analyse" && <BankingUpload onAnalysisDone={handleAnalysisDone} />}
          {tab === "history" && <BankingHistory onViewDoc={handleViewDoc} />}
        </>
      )}
    </div>
  );
}