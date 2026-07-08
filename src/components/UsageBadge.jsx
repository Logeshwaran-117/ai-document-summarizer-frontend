/**
 * UsageBadge.jsx
 * src/components/UsageBadge.jsx
 *
 * Fetches /api/usage and renders a compact card showing how many
 * summarise + table credits have been used / remain for this billing period.
 *
 * Props:
 *   type  — 'summarize' | 'tables' | 'both'  (default 'both')
 *   className — extra Tailwind classes for the wrapper
 *
 * Usage:
 *   <UsageBadge type="summarize" />   ← only summary bar
 *   <UsageBadge type="tables" />      ← only table bar
 *   <UsageBadge />                    ← both bars (default)
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

const PLAN_COLORS = {
  free:       "bg-gray-100  dark:bg-gray-800  text-gray-600  dark:text-gray-300",
  pro:        "bg-blue-100  dark:bg-blue-900  text-blue-700  dark:text-blue-300",
  enterprise: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
};

const PLAN_LABEL = {
  free:       "Free",
  pro:        "Pro",
  enterprise: "Enterprise",
};

/** Single horizontal progress bar for one action */
function UsageBar({ label, icon, used, limit, remaining }) {
  const isUnlimited = limit === null || limit === undefined || limit === Infinity;
  const pct         = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const danger      = !isUnlimited && remaining <= 1;
  const warn        = !isUnlimited && !danger && remaining <= Math.ceil(limit * 0.2);

  const barColor = danger ? "bg-red-500"
    : warn       ? "bg-yellow-400"
    :              "bg-blue-500";

  const textColor = danger ? "text-red-600 dark:text-red-400"
    : warn        ? "text-yellow-600 dark:text-yellow-400"
    :               "text-gray-500 dark:text-gray-400";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1">
          {icon} {label}
        </span>
        <span className={`text-xs font-medium ${textColor}`}>
          {isUnlimited
            ? `${used} used · Unlimited`
            : `${used} / ${limit} used · ${remaining} left`}
        </span>
      </div>

      {/* Track */}
      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        {isUnlimited ? (
          <div className="h-2 w-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-40" />
        ) : (
          <div
            className={`h-2 rounded-full transition-all duration-700 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>

      {/* Warning caption */}
      {danger && !isUnlimited && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
          Limit reached — <Link to="/pricing" className="underline font-semibold">upgrade your plan</Link>
        </p>
      )}
      {warn && !danger && !isUnlimited && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
          Almost out — <Link to="/pricing" className="underline font-semibold">upgrade</Link> for more
        </p>
      )}
    </div>
  );
}

export default function UsageBadge({ type = "both", className = "" }) {
  const [usage,   setUsage]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get("/api/usage")
      .then(r => { if (!cancelled) setUsage(r.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!usage) return null;

  const plan      = usage.plan || "free";
  const isAdmin   = usage.role === "admin";
  const badgeClass = PLAN_COLORS[plan] || PLAN_COLORS.free;

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3 ${className}`}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Monthly Usage
        </span>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
          {isAdmin ? "Admin ∞" : PLAN_LABEL[plan] || plan}
        </span>
      </div>

      {/* Bars */}
      {isAdmin ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          Admins have unlimited access — no usage limits apply.
        </p>
      ) : (
        <>
          {(type === "summarize" || type === "both") && (
            <UsageBar
              label="Summaries"
              icon="📄"
              used={usage.summarize.used}
              limit={usage.summarize.limit}
              remaining={usage.summarize.remaining}
            />
          )}
          {(type === "tables" || type === "both") && (
            <UsageBar
              label="Table Extractions"
              icon="📊"
              used={usage.tables.used}
              limit={usage.tables.limit}
              remaining={usage.tables.remaining}
            />
          )}
        </>
      )}

      {/* Upgrade CTA */}
      {!isAdmin && plan !== "enterprise" && (
        <Link
          to="/pricing"
          className="block text-center text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-1"
        >
          {plan === "free" ? "⚡ Upgrade to Pro for more" : "⚡ Upgrade to Enterprise"}
        </Link>
      )}
    </div>
  );
}