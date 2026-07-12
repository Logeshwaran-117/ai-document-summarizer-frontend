// src/pages/Dashboard.jsx
// Adds FeatureGate to every route so feature flags actually block access.
// All other code unchanged.

import Navbar            from "../components/Navbar";
import Sidebar           from "../components/Sidebar";
import Uploadcard        from "../components/Uploadcard";
import History           from "./History";
import DashboardCards    from "../components/DashboardCards";
import { Routes, Route, Navigate } from "react-router-dom";
import Settings          from "./Settings";
import SummaryDetailPage from "./SummaryDetailPage";
import ExcelSummary      from "./ExcelSummary";
import TableDetailPage   from "./TableDetailPage";
import AdminPanel        from "./AdminPanel";
import Pricing           from "./Pricing";
import Banking           from "./Banking";
import UsageDashboard    from "./UsageDashboard";

// ── Enterprise wiring ─────────────────────────────────────────────────────────
import MaintenanceGate    from "../components/MaintenanceGate";
import AnnouncementBanner from "../components/AnnouncementBanner";
import FeatureGate        from "../components/FeatureGate";
import { BroadcastToast } from "../components/AdminPanelExtension_v2";

function AdminGuard({ user, children }) {
  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-5xl mb-4">🚫</p>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>
            Access Denied
          </h2>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            You don't have admin privileges.
          </p>
        </div>
      </div>
    );
  }
  return children;
}

function Dashboard({ setIsAuthenticated, user }) {
  return (
    <MaintenanceGate user={user}>
      <div className="flex h-screen w-full overflow-hidden" style={{ background: "var(--bg)" }}>
        <Sidebar user={user} />

        <div className="flex flex-col flex-1 h-full overflow-hidden min-w-0">
          <Navbar setIsAuthenticated={setIsAuthenticated} user={user} />

          <main
            className="flex-1 overflow-y-auto transition-colors duration-300"
            style={{ background: "var(--bg)" }}
          >
            {/* Active announcements render as banners/toasts/popups */}
            <AnnouncementBanner user={user} />

            <Routes>
              {/* Dashboard — always available */}
              <Route path="/" element={<DashboardCards user={user} />} />

              {/* Summarizer / Upload */}
              <Route
                path="/upload"
                element={
                  <FeatureGate flag="summarizer">
                    <FeatureGate flag="docUpload">
                      <Uploadcard />
                    </FeatureGate>
                  </FeatureGate>
                }
              />

              {/* History */}
              <Route path="/history"     element={<History />} />
              <Route path="/history/:id" element={<SummaryDetailPage />} />

              {/* Settings */}
              <Route
                path="/settings"
                element={
                  <Settings
                    user={user}
                    setIsAuthenticated={setIsAuthenticated}
                  />
                }
              />

              {/* Table extraction */}
              <Route
                path="/excel"
                element={
                  <FeatureGate flag="tableExtract">
                    <ExcelSummary />
                  </FeatureGate>
                }
              />
              <Route path="/tables/:id" element={<TableDetailPage />} />

              {/* Pricing */}
              <Route path="/pricing" element={<Pricing user={user} />} />

              {/* Banking */}
              <Route
                path="/banking"
                element={
                  <FeatureGate flag="summarizer">
                    <Banking user={user} />
                  </FeatureGate>
                }
              />

              {/* Admin — always accessible to admins regardless of flags */}
              <Route
                path="/admin"
                element={
                  <AdminGuard user={user}>
                    <AdminPanel />
                  </AdminGuard>
                }
              />
              <Route
                path="/usage-dashboard"
                element={
                  <AdminGuard user={user}>
                    <UsageDashboard />
                  </AdminGuard>
                }
              />

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>

        {/* Broadcast toasts — floats above all content */}
        <BroadcastToast />
      </div>
    </MaintenanceGate>
  );
}

export default Dashboard;