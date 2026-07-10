/**
 * UsageDashboard.jsx
 *
 * Admin-only page showing real-time Gemini API key usage.
 * Auto-refreshes via SSE (/api/usage/stream) so stats update the moment
 * a request completes — no manual polling needed.
 *
 * Route: /usage-dashboard  (add to Dashboard.jsx + Sidebar.jsx)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Tiny helpers ───────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function pct(n, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((n / total) * 100));
}

function timeAgo(iso) {
  if (!iso) return "Never";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, color = "blue", label }) {
  const colors = {
    blue:   "bg-blue-500",
    green:  "bg-green-500",
    yellow: "bg-yellow-400",
    red:    "bg-red-500",
    purple: "bg-purple-500",
    orange: "bg-orange-400",
  };

  const barColor = value >= 90 ? colors.red : value >= 70 ? colors.yellow : colors[color] || colors.blue;

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ── Feature pill ──────────────────────────────────────────────────────────────
function FeaturePill({ label, requests, tokens }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-medium text-gray-700 dark:text-gray-300 w-20">{label}</span>
      <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
        {fmt(requests)} req
      </span>
      <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
        {fmt(tokens)} tok
      </span>
    </div>
  );
}

// ── Single key card ───────────────────────────────────────────────────────────
function KeyCard({ keyData }) {
  const {
    keyLabel,
    isActive,
    requestCount,
    rateLimitHits,
    errorCount,
    inputTokens,
    outputTokens,
    totalTokens,
    byFeature,
    dailyRequestLimit,
    dailyTokenBudget,
    remainingRequests,
    remainingTokens,
    requestUsagePct,
    tokenUsagePct,
    lastRequestAt,
  } = keyData;

  const statusColor = isActive
    ? "ring-2 ring-blue-500 dark:ring-blue-400"
    : requestUsagePct >= 90
    ? "ring-2 ring-red-400"
    : "ring-1 ring-gray-200 dark:ring-gray-700";

  return (
    <div className={`relative bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm transition-all ${statusColor}`}>
      {/* Active badge */}
      {isActive && (
        <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
          ACTIVE
        </span>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold
          ${isActive ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}>
          {keyLabel.replace("Key ", "")}
        </div>
        <div>
          <p className="font-semibold text-gray-800 dark:text-white text-sm">{keyLabel}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(lastRequestAt)}</p>
        </div>
      </div>

      {/* Request progress */}
      <div className="mb-3">
        <ProgressBar value={requestUsagePct} color="blue" label={`Requests: ${fmt(requestCount)} / ${fmt(dailyRequestLimit)}`} />
      </div>

      {/* Token progress */}
      <div className="mb-4">
        <ProgressBar value={tokenUsagePct} color="purple" label={`Tokens: ${fmt(totalTokens)} / ${fmt(dailyTokenBudget)}`} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">Remaining Req</p>
          <p className="text-sm font-bold text-green-600 dark:text-green-400">{fmt(remainingRequests)}</p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">Rate Limits</p>
          <p className={`text-sm font-bold ${rateLimitHits > 0 ? "text-yellow-500" : "text-gray-400 dark:text-gray-600"}`}>
            {rateLimitHits}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">Errors</p>
          <p className={`text-sm font-bold ${errorCount > 0 ? "text-red-500" : "text-gray-400 dark:text-gray-600"}`}>
            {errorCount}
          </p>
        </div>
      </div>

      {/* Token breakdown */}
      <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
        <span>↑ {fmt(inputTokens)} in</span>
        <span>↓ {fmt(outputTokens)} out</span>
        <span className="ml-auto font-medium text-gray-700 dark:text-gray-300">{fmt(remainingTokens)} remaining</span>
      </div>

      {/* Feature breakdown */}
      {byFeature && (
        <div className="space-y-1.5 border-t border-gray-100 dark:border-gray-800 pt-3">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-gray-600 font-semibold mb-2">By Feature</p>
          <FeaturePill label="Summarize"  requests={byFeature.summarize?.requests || 0} tokens={byFeature.summarize?.tokens || 0} />
          <FeaturePill label="Banking"    requests={byFeature.banking?.requests   || 0} tokens={byFeature.banking?.tokens   || 0} />
          <FeaturePill label="Table"      requests={byFeature.table?.requests     || 0} tokens={byFeature.table?.tokens     || 0} />
        </div>
      )}
    </div>
  );
}

// ── History sparkline (7-day bar chart) ───────────────────────────────────────
function HistoryChart({ history }) {
  if (!history || history.length === 0) return null;

  const maxReq = Math.max(...history.map(d => d.requestCount), 1);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
      <p className="text-sm font-semibold text-gray-700 dark:text-white mb-4">Requests — Last {history.length} days</p>
      <div className="flex items-end gap-1.5 h-20">
        {history.map((day) => {
          const h = Math.max(4, Math.round((day.requestCount / maxReq) * 80));
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full rounded-t bg-blue-500 dark:bg-blue-600 transition-all duration-300 group-hover:bg-blue-400"
                style={{ height: `${h}px` }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                {day.date}<br />{fmt(day.requestCount)} req · {fmt(day.totalTokens)} tok
              </div>
              <span className="text-[9px] text-gray-400">{day.date.slice(5)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Last request info banner ──────────────────────────────────────────────────
function LastRequestBanner({ data }) {
  if (!data?.lastUsageMetadata) return null;
  const { promptTokenCount, candidatesTokenCount, totalTokenCount } = data.lastUsageMetadata;
  const feature = data.lastRequestFeature || "—";
  const keyIdx  = data.lastRequestKeyIndex ?? data.currentKeyIndex;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex flex-wrap gap-4 text-sm">
      <div>
        <span className="text-gray-500 dark:text-gray-400">Last request via </span>
        <span className="font-semibold text-blue-700 dark:text-blue-300">Key {keyIdx + 1}</span>
        <span className="ml-2 text-gray-500 dark:text-gray-400">({feature})</span>
      </div>
      <div className="flex gap-4 ml-auto flex-wrap">
        <span>📥 <b>{fmt(promptTokenCount)}</b> input</span>
        <span>📤 <b>{fmt(candidatesTokenCount)}</b> output</span>
        <span>🔢 <b>{fmt(totalTokenCount)}</b> total</span>
        <span className="text-gray-400">· {timeAgo(data.lastRequestAt)}</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function UsageDashboard() {
  const [data, setData]       = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError]     = useState(null);
  const [tick, setTick]       = useState(0);     // forces re-render for "X ago" labels
  const sseRef = useRef(null);

  // Fetch history separately (changes less often)
  const loadHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/usage/history?days=7`, { withCredentials: true });
      if (res.data.success) setHistory(res.data.data);
    } catch {}
  }, []);

  // SSE for real-time today stats
  useEffect(() => {
    let es;
    const connect = () => {
      es = new EventSource(`${API_BASE}/api/usage/stream`, { withCredentials: true });

      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.error) {
            setError(payload.error);
          } else {
            setData(payload);
            setError(null);
          }
        } catch {}
      };

      es.onerror = () => {
        es.close();
        // Retry after 5 s
        setTimeout(connect, 5000);
      };

      sseRef.current = es;
    };

    connect();
    loadHistory();

    // Refresh history every 5 minutes
    const historyInterval = setInterval(loadHistory, 5 * 60 * 1000);

    // Tick every 30 s to update "X ago" labels
    const tickInterval = setInterval(() => setTick(t => t + 1), 30_000);

    return () => {
      sseRef.current?.close();
      clearInterval(historyInterval);
      clearInterval(tickInterval);
    };
  }, [loadHistory]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        {error ? (
          <div className="text-center">
            <p className="text-4xl mb-3">🔑</p>
            <p className="text-red-500 font-medium">{error}</p>
            <p className="text-gray-400 text-sm mt-1">Admin access required</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading API key stats…</p>
          </div>
        )}
      </div>
    );
  }

  const { keys, totals, limits, currentKeyIndex, lastRotatedAt, date } = data;

  return (
    <div className="space-y-6 pb-10">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">API Key Usage Dashboard</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            Gemini 2.5 Flash · {date} (UTC) ·{" "}
            <span className="text-blue-500 font-medium">Key {currentKeyIndex + 1}</span> active
            {lastRotatedAt && <span className="ml-2 text-gray-400">· last rotated {timeAgo(lastRotatedAt)}</span>}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
          Live · updates every 10 s
        </div>
      </div>

      {/* Last request info */}
      <LastRequestBanner data={data} />

      {/* Totals row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Requests Today", value: fmt(totals.requestCount), icon: "📨", color: "blue" },
          { label: "Total Tokens Today",   value: fmt(totals.totalTokens),  icon: "🔢", color: "purple" },
          { label: "Rate Limit Hits",      value: fmt(totals.rateLimitHits), icon: "⚠️", color: totals.rateLimitHits > 0 ? "yellow" : "gray" },
          { label: "Active Key",           value: `Key ${currentKeyIndex + 1}`, icon: "🔑", color: "green" },
        ].map(({ label, value, icon, color }) => {
          const textColors = {
            blue: "text-blue-600 dark:text-blue-400",
            purple: "text-purple-600 dark:text-purple-400",
            yellow: "text-yellow-600 dark:text-yellow-400",
            green: "text-green-600 dark:text-green-400",
            gray: "text-gray-400 dark:text-gray-500",
          };
          return (
            <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
              <p className="text-2xl mb-1">{icon}</p>
              <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Key cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {keys.map((k) => (
          <KeyCard key={k.keyIndex} keyData={k} />
        ))}
      </div>

      {/* History chart */}
      <HistoryChart history={history} />

      {/* Quota config note */}
      <div className="text-xs text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-900 rounded-xl p-4 ring-1 ring-gray-200 dark:ring-gray-800">
        <p className="font-semibold mb-1 text-gray-500 dark:text-gray-400">ℹ️  Quota configuration</p>
        <p>
          Daily limits are configurable via environment variables:{" "}
          <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">GEMINI_DAILY_REQUEST_LIMIT</code> (default: 1 500) and{" "}
          <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">GEMINI_DAILY_TOKEN_BUDGET</code> (default: 1 000 000).
          Remaining quota is estimated — the Gemini free tier does not expose remaining-quota headers.
          Limits reset at midnight UTC. Stats are stored in MongoDB and survive server restarts.
        </p>
      </div>
    </div>
  );
}