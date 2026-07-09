// src/pages/Dashboard.jsx
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Uploadcard from "../components/Uploadcard";
import History from "./History";
import DashboardCards from "../components/DashboardCards";
import { Routes, Route, Navigate } from "react-router-dom";
import Settings from "./Settings";
import SummaryDetailPage from "./SummaryDetailPage";
import ExcelSummary from "./ExcelSummary";
import TableDetailPage from "./TableDetailPage";
import AdminPanel from "./AdminPanel";
import Pricing from "./Pricing";
import Banking from "./Banking";   // ← NEW

function AdminGuard({ user, children }) {
  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-5xl mb-4">🚫</p>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">You don't have admin privileges.</p>
        </div>
      </div>
    );
  }
  return children;
}

function Dashboard({ setIsAuthenticated, user }) {
    return (
        <div className="flex h-screen w-full">
            <Sidebar user={user} />
            <div className="flex flex-col flex-1 h-full overflow-hidden">
                <Navbar setIsAuthenticated={setIsAuthenticated} user={user} />
                <main className="flex-1 bg-gray-100 dark:bg-gray-950 overflow-y-auto p-6 transition-colors duration-300">
                    <Routes>
                        <Route path="/" element={<DashboardCards user={user} />} />
                        <Route path="/upload" element={<Uploadcard />} />
                        <Route path="/history" element={<History />} />
                        <Route path="/history/:id" element={<SummaryDetailPage />} />
                        <Route path="/settings" element={<Settings user={user} setIsAuthenticated={setIsAuthenticated} />} />
                        <Route path="/excel" element={<ExcelSummary />} />
                        <Route path="/tables/:id" element={<TableDetailPage />} />
                        <Route path="/pricing" element={<Pricing user={user}/>} />
                        <Route path="/banking" element={<Banking />} />   {/* ← NEW */}
                        <Route path="/admin" element={
                          <AdminGuard user={user}>
                            <AdminPanel />
                          </AdminGuard>
                        } />
                        <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}
export default Dashboard;
