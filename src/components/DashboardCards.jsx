// src/components/DashboardCards.jsx
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../api";

import HeroSection     from "./dashboard/HeroSection";
import AnalyticsCharts from "./dashboard/AnalyticsCharts";
import RecentDocuments from "./dashboard/RecentDocuments";
import SidePanel       from "./dashboard/SidePanel";
import { useNavigate } from "react-router-dom";
import OnboardingWizard from "./OnboardingWizard";

/* ── Skeleton ── */
function Skeleton({ className }) {
  return (
    <div
      className={`rounded-xl animate-pulse ${className}`}
      style={{ background: "var(--secondary)" }}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-64 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6">
          <Skeleton className="h-72" />
          <Skeleton className="h-48" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-52" />
        </div>
      </div>
    </div>
  );
}

// ── Module-level cache (survives page-to-page navigation, cleared after 60 s) ──
let _dashCache = null;
let _dashCacheAt = 0;
const DASH_CACHE_TTL = 60_000; // 60 seconds

/* ── Main ── */
function DashboardCards({ user }) {
  const [stats,      setStats]      = useState(() => _dashCache?.stats      ?? null);
  const [recentDocs, setRecentDocs] = useState(() => _dashCache?.recentDocs ?? []);
  const [chartData,  setChartData]  = useState(() => _dashCache?.chartData  ?? []);
  const [billing,    setBilling]    = useState(() => _dashCache?.billing     ?? null);
  const [loading,    setLoading]    = useState(() => !_dashCache || Date.now() - _dashCacheAt > DASH_CACHE_TTL);

  useEffect(() => {
    // If cache is still fresh, skip the fetch
    if (_dashCache && Date.now() - _dashCacheAt < DASH_CACHE_TTL) return;
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [statsRes, historyRes, weeklyRes, billingRes] = await Promise.all([
        api.get("/api/dashboard/stats"),
        api.get("/api/history", { params: { page: 1, limit: 5 } }),
        api.get("/api/dashboard/weekly-uploads"),
        api.get("/api/billing/status").catch(() => ({ data: null })),
      ]);
      const data = {
        stats:      statsRes.data,
        recentDocs: historyRes.data.documents || [],
        chartData:  weeklyRes.data || [],
        billing:    billingRes.data,
      };
      // Save to module-level cache
      _dashCache   = data;
      _dashCacheAt = Date.now();
      setStats(data.stats);
      setRecentDocs(data.recentDocs);
      setChartData(data.chartData);
      setBilling(data.billing);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const storageKey = `onboarding_done_${user?._id}`;
  const [showOnboarding, setShowOnboarding] = useState(
    !localStorage.getItem(storageKey)
 );
  const handleDismissOnboarding = () => {
    localStorage.setItem(storageKey, "1");
    setShowOnboarding(false);
 };

  if (loading) return <DashboardSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto"
    >

      {showOnboarding && (
        <OnboardingWizard user={user} onDismiss={handleDismissOnboarding} />
      )}
      {/* ── Unified Hero: greeting + plan badge + quick actions + stat pills ── */}
      <HeroSection user={user} stats={stats} billing={billing} />

      {/* ── Main content: charts + side panel ── */}
      <div className="dashboard-main-grid gap-6">
        <div className="space-y-6 min-w-0">
          <AnalyticsCharts chartData={chartData} />
          <RecentDocuments docs={recentDocs} />
        </div>
        <SidePanel billing={billing} docs={recentDocs} />
      </div>
    </motion.div>
  );
}

export default DashboardCards;