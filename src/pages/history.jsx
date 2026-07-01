import { useEffect, useState } from "react";
import api from "../api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DocumentChat from "../components/DocumentChat";

function History() {
    const [history, setHistory] = useState([]);
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchHistory(); }, []);

    async function fetchHistory() {
        try {
            const response = await api.get("/api/history");
            setHistory(response.data.documents || response.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    async function remove(id) {
        if (!window.confirm("Delete this summary? This cannot be undone.")) return;
        try {
            await api.delete(`/api/history/${id}`);
            fetchHistory();
        } catch (error) {
            console.log(error);
            alert("Failed to delete.");
        }
    }

    function toggleExpand(id) {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    }

    const filtered = history.filter((item) =>
        item.filename.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Summary History</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
                {history.length} document{history.length !== 1 ? "s" : ""} summarized
            </p>

            {/* Search Bar */}
            <div className="relative mb-6">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                    🔍
                </span>
                <input
                    type="text"
                    placeholder="Search by filename..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 rounded-2xl shadow">
                    <p className="text-5xl mb-3">📭</p>
                    <p className="text-lg">
                        {history.length === 0 ? "No history found." : "No results match your search."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((item) => {
                        const isOpen = !!expanded[item._id];
                        return (
                            <div
                                key={item._id}
                                className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-6 transition-colors duration-300"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-2 text-xl shrink-0">📄</div>
                                        <div className="min-w-0">
                                            <h2 className="text-lg font-bold text-blue-700 dark:text-blue-400 truncate">
                                                {item.filename}
                                            </h2>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                {new Date(item.uploadedAt).toLocaleString("en-US", {
                                                    month: "short", day: "numeric", year: "numeric",
                                                    hour: "numeric", minute: "2-digit"
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => remove(item._id)}
                                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-sm font-medium shrink-0 transition"
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>

                                {/* Stats badges */}
                                {item.stats && (
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        <span className="text-xs bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-2.5 py-1 rounded-full font-medium">
                                            📝 {item.stats.words} words
                                        </span>
                                        <span className="text-xs bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 px-2.5 py-1 rounded-full font-medium">
                                            🔤 {item.stats.characters} characters
                                        </span>
                                        <span className="text-xs bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 px-2.5 py-1 rounded-full font-medium">
                                            ⏱ {item.stats.readingTime} min read
                                        </span>
                                        <span className="text-xs bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-300 px-2.5 py-1 rounded-full font-medium">
                                            ✓ Done
                                        </span>
                                    </div>
                                )}

                                <hr className="my-4 border-gray-200 dark:border-gray-700" />

                                {/* Summary content — collapsed or expanded */}
                                <div
                                    className={`overflow-hidden transition-all duration-300 ${
                                        isOpen ? "" : "max-h-32"
                                    }`}
                                >
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h1: ({ children }) => (
                                                <h1 className="text-xl font-bold text-blue-700 dark:text-blue-400 mb-2">{children}</h1>
                                            ),
                                            h2: ({ children }) => (
                                                <h2 className="text-lg font-semibold mt-4 mb-2 text-gray-900 dark:text-white">{children}</h2>
                                            ),
                                            p: ({ children }) => (
                                                <p className="leading-7 mb-2 text-gray-700 dark:text-gray-300">{children}</p>
                                            ),
                                            ul: ({ children }) => (
                                                <ul className="list-disc ml-5 mb-2 text-gray-700 dark:text-gray-300">{children}</ul>
                                            ),
                                            li: ({ children }) => <li className="mb-1">{children}</li>,
                                            strong: ({ children }) => (
                                                <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>
                                            ),
                                        }}
                                    >
                                        {item.summary}
                                    </ReactMarkdown>
                                </div>

                                {/* Fade-out gradient when collapsed */}
                                {!isOpen && (
                                    <div className="relative -mt-10 h-10 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
                                )}

                                <button
                                    onClick={() => toggleExpand(item._id)}
                                    className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {isOpen ? "Show less ▲" : "Show full summary ▼"}
                                </button>

                                {/* Q&A Chat — persisted per document */}
                                <DocumentChat
                                    documentId={item._id}
                                    initialChatHistory={item.chatHistory || []}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default History;
