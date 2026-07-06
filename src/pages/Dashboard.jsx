// src/pages/Dashboard.jsx
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Uploadcard from "../components/Uploadcard";
import History from "./History";
import DashboardCards from "../components/DashboardCards";
import { Routes, Route } from "react-router-dom";
import Settings from "./Settings";
import SummaryDetailPage from "./SummaryDetailPage";
import ExcelSummary from "./ExcelSummary";
import TableDetailPage from "./TableDetailPage";

function Dashboard({ setIsAuthenticated, user }) {
    return (
        <div className="flex h-screen w-full">
            <Sidebar /> 
            <div className="flex flex-col flex-1 h-full overflow-hidden">
                <Navbar setIsAuthenticated={setIsAuthenticated} user={user} />
                <main className="flex-1 bg-gray-100 dark:bg-gray-950 overflow-y-auto p-6 transition-colors duration-300">
                    <Routes>
                        <Route path="/" element={
                            <DashboardCards user={user} />
                        } />
                        <Route path="/upload" element={<Uploadcard />} />
                        <Route path="/history" element={<History />} />
                        <Route path="/history/:id" element={<SummaryDetailPage />} />
                        <Route path="/settings" element={<Settings user={user} setIsAuthenticated={setIsAuthenticated} />} />
                        <Route path="/excel" element={<ExcelSummary />} />
                        <Route path="/tables/:id" element={<TableDetailPage />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}
export default Dashboard;
