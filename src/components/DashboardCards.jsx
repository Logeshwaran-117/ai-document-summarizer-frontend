import { useEffect, useState } from "react";
import api from "../api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

function DashboardCards({ user }) {
    const [stats, setStats] = useState(null);
    const [recentDocs, setRecentDocs] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAll();
    }, []);

    async function loadAll() {
        try {
            const [statsRes, historyRes, weeklyRes] = await Promise.all([
                api.get("/api/dashboard/stats"),
                api.get("/api/history", { params: { page: 1, limit: 5 } }),
                api.get("/api/dashboard/weekly-uploads"),
            ]);
            setStats(statsRes.data);
            setRecentDocs(historyRes.data.documents || []);
            setChartData(weeklyRes.data || []);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
    );

    const userName = user?.name || user?.displayName || user?.email?.split("@")[0] || "User";
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    return (
        <div className="space-y-6">

            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-900 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-blue-100 text-sm font-medium">{greeting} 👋</p>
                        <h1 className="text-3xl font-bold mt-1">{userName}</h1>
                        <p className="text-blue-100 mt-1 text-sm">Here's what's happening with your documents today.</p>
                    </div>
                    <div className="text-6xl opacity-20">📄</div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border-l-4 border-blue-500 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Uploads</p>
                            <p className="text-4xl font-bold text-gray-800 dark:text-white mt-1">{stats?.total ?? 0}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">All time</p>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900/40 rounded-full p-4 text-2xl">📁</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border-l-4 border-green-500 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Summaries Generated</p>
                            <p className="text-4xl font-bold text-gray-800 dark:text-white mt-1">{stats?.summaries ?? 0}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">AI powered</p>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/40 rounded-full p-4 text-2xl">🤖</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 border-l-4 border-orange-500 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Today's Uploads</p>
                            <p className="text-4xl font-bold text-gray-800 dark:text-white mt-1">{stats?.todayUploads ?? 0}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Since midnight</p>
                        </div>
                        <div className="bg-orange-100 dark:bg-orange-900/40 rounded-full p-4 text-2xl">📅</div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Bar Chart */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 transition-colors duration-300">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Uploads — Last 7 Days</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:opacity-10" />
                            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "currentColor" }} className="text-gray-500 dark:text-gray-400" />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-gray-500 dark:text-gray-400" />
                            <Tooltip
                                contentStyle={{ backgroundColor: "var(--tooltip-bg, #fff)", border: "none", borderRadius: "8px" }}
                                wrapperClassName="dark:[&>div]:!bg-gray-800 dark:[&>div]:!text-white"
                            />
                            <Bar dataKey="uploads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Line Chart */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 transition-colors duration-300">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Activity Trend</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" className="dark:opacity-10" />
                            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "currentColor" }} className="text-gray-500 dark:text-gray-400" />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "currentColor" }} className="text-gray-500 dark:text-gray-400" />
                            <Tooltip
                                contentStyle={{ backgroundColor: "var(--tooltip-bg, #fff)", border: "none", borderRadius: "8px" }}
                                wrapperClassName="dark:[&>div]:!bg-gray-800 dark:[&>div]:!text-white"
                            />
                            <Line type="monotone" dataKey="uploads" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Recent Documents */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 transition-colors duration-300">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Recent Summaries</h3>
                    <a href="/history" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View all →</a>
                </div>
                {recentDocs.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 dark:text-gray-500">
                        <p className="text-4xl mb-2">📭</p>
                        <p>No documents yet. Upload one to get started!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentDocs.map((doc) => (
                            <a
                                href={`/history/${doc._id}`}
                                key={doc._id}
                                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-2 text-xl">📄</div>
                                    <div>
                                        <p className="font-medium text-gray-800 dark:text-gray-200 text-sm">{doc.filename}</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(doc.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {doc.stats && (
                                        <span className="text-xs bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full">
                                            {doc.stats.words} words
                                        </span>
                                    )}
                                    <span className="text-xs bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-300 px-2 py-1 rounded-full">✓ Done</span>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow p-6 transition-colors duration-300">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <a href="/upload" className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition cursor-pointer">
                        <span className="text-3xl mb-2">📤</span>
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Upload Doc</span>
                    </a>
                    <a href="/history" className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/30 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/50 transition cursor-pointer">
                        <span className="text-3xl mb-2">📋</span>
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">View History</span>
                    </a>
                    <a href="/upload" className="flex flex-col items-center justify-center p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 transition cursor-pointer">
                        <span className="text-3xl mb-2">🤖</span>
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">New Summary</span>
                    </a>
                    <a href="/settings" className="flex flex-col items-center justify-center p-4 bg-orange-50 dark:bg-orange-900/30 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/50 transition cursor-pointer">
                        <span className="text-3xl mb-2">⚙️</span>
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Settings</span>
                    </a>
                </div>
            </div>

        </div>
    );
}

export default DashboardCards;
