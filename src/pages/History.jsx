import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";
import { useNotifications } from "../context/NotificationContext";

const PAGE_SIZE = 10;

const DEFAULT_FILTERS = {
    fileType: "all",
    dateFrom: "",
    dateTo: "",
    minWords: "",
    maxWords: "",
    sort: "newest",
};

function History() {
    const [history, setHistory] = useState([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const navigate = useNavigate();
    const { addNotification } = useNotifications();

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, debouncedSearch, filters]);

    async function fetchHistory() {
        setLoading(true);
        try {
            const response = await api.get("/api/history", {
                params: {
                    page,
                    limit: PAGE_SIZE,
                    search: debouncedSearch || undefined,
                    fileType: filters.fileType,
                    dateFrom: filters.dateFrom || undefined,
                    dateTo: filters.dateTo || undefined,
                    minWords: filters.minWords || undefined,
                    maxWords: filters.maxWords || undefined,
                    sort: filters.sort,
                },
            });
            const data = response.data;
            // Handle both paginated {documents, total, totalPages} and legacy plain array
            if (Array.isArray(data)) {
                setHistory(data);
                setTotal(data.length);
                setTotalPages(1);
            } else {
                setHistory(data.documents || []);
                setTotal(data.total || 0);
                setTotalPages(data.totalPages || 1);
            }
        } catch (error) {
            console.log(error);
            toast.error("Failed to load history");
            addNotification({ title: "Failed to load history", type: "error" });
        } finally {
            setLoading(false);
        }
    }

    function updateFilter(key, value) {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setPage(1);
    }

    function resetFilters() {
        setFilters(DEFAULT_FILTERS);
        setPage(1);
    }

    const activeFilterCount =
        (filters.fileType !== "all" ? 1 : 0) +
        (filters.dateFrom ? 1 : 0) +
        (filters.dateTo ? 1 : 0) +
        (filters.minWords ? 1 : 0) +
        (filters.maxWords ? 1 : 0) +
        (filters.sort !== "newest" ? 1 : 0);

    async function remove(e, id, filename) {
        e.stopPropagation();
        if (!window.confirm(`Delete "${filename}"? This can't be undone.`)) return;
        try {
            await api.delete(`/api/history/${id}`);
            toast.success("Summary deleted");
            addNotification({ title: "Summary deleted", message: `${filename} removed.`, type: "info" });
            if (history.length === 1 && page > 1) {
                setPage((p) => p - 1);
            } else {
                fetchHistory();
            }
        } catch (error) {
            console.log(error);
            toast.error("Failed to delete summary");
        }
    }

    function goToPage(p) {
        if (p < 1 || p > totalPages || p === page) return;
        setPage(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function getPageNumbers() {
        const pages = [];
        const delta = 1;
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== "...") {
                pages.push("...");
            }
        }
        return pages;
    }

    // File type icon
    function fileIcon(filename) {
        if (!filename) return "📄";
        if (filename.endsWith(".pdf")) return "📕";
        if (filename.endsWith(".docx")) return "📘";
        if (filename.endsWith(".txt")) return "📄";
        return "📄";
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Summary History</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    {loading ? "Loading..." : total > 0 ? `${total} document${total !== 1 ? 's' : ''} summarized` : "No documents yet"}
                </p>
            </div>

            {/* Search + Filter toggle */}
            <div className="flex gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Search by filename..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 border border-gray-300 dark:border-gray-700 p-3 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <button
                    onClick={() => setShowFilters((s) => !s)}
                    className={`relative px-4 py-3 rounded-lg font-medium text-sm flex items-center gap-2 transition shrink-0 border ${
                        showFilters
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                >
                    🎛️ Filters
                    {activeFilterCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            {debouncedSearch && !loading && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 -mt-2">
                    Found {total} result{total !== 1 ? "s" : ""} for "{debouncedSearch}"
                </p>
            )}

            {/* Filter Panel */}
            {showFilters && (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* File Type */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">File Type</label>
                        <select
                            value={filters.fileType}
                            onChange={(e) => updateFilter("fileType", e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="all">All Types</option>
                            <option value="pdf">PDF</option>
                            <option value="docx">DOCX</option>
                            <option value="txt">TXT</option>
                        </select>
                    </div>

                    {/* Sort */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Sort By</label>
                        <select
                            value={filters.sort}
                            onChange={(e) => updateFilter("sort", e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="wordsDesc">Most Words</option>
                            <option value="wordsAsc">Fewest Words</option>
                        </select>
                    </div>

                    {/* Reset */}
                    <div className="flex items-end">
                        <button
                            onClick={resetFilters}
                            disabled={activeFilterCount === 0}
                            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                            ↺ Reset Filters
                        </button>
                    </div>

                    {/* Date From */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">From Date</label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => updateFilter("dateFrom", e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">To Date</label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => updateFilter("dateTo", e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    <div /> {/* spacer */}

                    {/* Min Words */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Min Words</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={filters.minWords}
                            onChange={(e) => updateFilter("minWords", e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    {/* Max Words */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide">Max Words</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="No limit"
                            value={filters.maxWords}
                            onChange={(e) => updateFilter("maxWords", e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : history.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                    <p className="text-4xl mb-3">{debouncedSearch || activeFilterCount > 0 ? "🔍" : "📭"}</p>
                    <p className="text-lg">{debouncedSearch || activeFilterCount > 0 ? "No results found" : "No summaries yet"}</p>
                    <p className="text-sm mt-2">{debouncedSearch || activeFilterCount > 0 ? "Try adjusting your search or filters" : "Upload a document to get started"}</p>
                </div>
            ) : (
                <>
                    <div className="space-y-4 mb-8">
                        {history.map((item) => (
                            <div
                                key={item._id}
                                onClick={() => navigate(`/history/${item._id}`)}
                                className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-5 cursor-pointer hover:shadow-lg hover:ring-1 hover:ring-blue-200 dark:hover:ring-blue-900 transition-all duration-200"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="bg-blue-100 dark:bg-blue-900/40 rounded-lg p-2 text-xl shrink-0">
                                            {fileIcon(item.filename)}
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="text-lg font-bold text-blue-700 dark:text-blue-400 truncate">
                                                {item.filename}
                                            </h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                {new Date(item.uploadedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => remove(e, item._id, item.filename)}
                                        className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-lg ml-3 shrink-0 transition"
                                        title="Delete"
                                    >
                                        🗑️
                                    </button>
                                </div>

                                {/* Stats */}
                                {item.stats && (
                                    <div className="flex gap-2 mb-3 flex-wrap">
                                        <span className="text-xs bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full">
                                            📝 {item.stats.words} words
                                        </span>
                                        <span className="text-xs bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 px-2 py-1 rounded-full">
                                            🔤 {item.stats.characters} chars
                                        </span>
                                        <span className="text-xs bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300 px-2 py-1 rounded-full">
                                            ⏱️ {item.stats.readingTime} min read
                                        </span>
                                        <span className="text-xs bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-300 px-2 py-1 rounded-full">
                                            ✓ Done
                                        </span>
                                    </div>
                                )}

                                {/* Preview */}
                                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                                    {item.summary?.replace(/[#*_`>]/g, "").slice(0, 200)}...
                                </p>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                                        📖 View full summary →
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                            <button
                                onClick={() => goToPage(page - 1)}
                                disabled={page === 1}
                                className="px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                            >
                                ← Prev
                            </button>

                            {getPageNumbers().map((p, idx) =>
                                p === "..." ? (
                                    <span key={`e-${idx}`} className="px-2 text-gray-400 dark:text-gray-600">…</span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() => goToPage(p)}
                                        className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                                            p === page
                                                ? "bg-blue-600 text-white"
                                                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        }`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}

                            <button
                                onClick={() => goToPage(page + 1)}
                                disabled={page === totalPages}
                                className="px-3 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                            >
                                Next →
                            </button>

                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                Page {page} of {totalPages} ({total} total)
                            </span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default History;
