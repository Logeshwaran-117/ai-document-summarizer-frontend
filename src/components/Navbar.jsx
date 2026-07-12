// src/components/Navbar.jsx  — Drop-in replacement (same props)
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Sun, Moon, Bell, Settings, LogOut,
  ChevronDown, Sparkles, Command,
} from "lucide-react";
import api from "../api";
import NotificationCenter from "./NotificationCenter";

const BREADCRUMB_MAP = {
  "/":               "Overview",
  "/upload":         "Summarize",
  "/excel":          "Table Generator",
  "/banking":        "Banking",
  "/history":        "History",
  "/pricing":        "Plans & Billing",
  "/settings":       "Settings",
  "/admin":          "Admin Panel",
  "/usage-dashboard":"API Key Usage",
};

function Navbar({ setIsAuthenticated, user }) {
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch]   = useState(false);
  const profileRef = useRef(null);
  const navigate   = useNavigate();
  const location   = useLocation();

  /* Apply theme */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  /* Ctrl+K shortcut */
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(v => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* Close profile on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try { await api.get("/auth/logout"); } catch {}
    setIsAuthenticated(false);
    navigate("/login");
  };

  const initials = (user?.name || user?.displayName || "U")[0].toUpperCase();
  const displayName = user?.name || user?.displayName || "User";
  const breadcrumb  = BREADCRUMB_MAP[location.pathname] || "Dashboard";

  return (
    <>
      <header
        className="flex items-center justify-between px-5 h-14 shrink-0 sticky top-0 z-40"
        style={{
          background: "var(--card)",
          borderBottom: "1px solid var(--border)",
          boxShadow: "var(--shadow)",
        }}
      >
        {/* Left: breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>DocAI</span>
          <span style={{ color: "var(--border)" }}>/</span>
          <span className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
            {breadcrumb}
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Search trigger */}
          <button
            onClick={() => setShowSearch(true)}
            className="hidden sm:flex items-center gap-2 px-3 h-8 rounded-lg text-xs transition-all hover:opacity-80"
            style={{ background: "var(--secondary)", color: "var(--muted)", border: "1px solid var(--border)" }}
          >
            <Search size={13} />
            <span>Search…</span>
            <span className="flex items-center gap-0.5 opacity-60">
              <Command size={11} /><span>K</span>
            </span>
          </button>

          {/* Model badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 h-7 rounded-full text-[11px] font-semibold"
            style={{
              background: "linear-gradient(135deg, rgba(var(--primary-rgb),.12), rgba(var(--primary-rgb),.06))",
              border: "1px solid rgba(var(--primary-rgb),.2)",
              color: "var(--primary)",
            }}>
            <Sparkles size={11} />
            Gemini 1.5 Pro
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Light mode" : "Dark mode"}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all hover:scale-105"
            style={{ background: "var(--secondary)", color: "var(--muted)" }}
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Notifications */}
          <NotificationCenter />

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 h-8 px-2 rounded-lg transition-all hover:opacity-80"
              style={{ background: "var(--secondary)" }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: "linear-gradient(135deg, var(--primary), #818cf8)" }}
              >
                {initials}
              </div>
              <span className="text-xs font-medium hidden sm:block" style={{ color: "var(--text)" }}>
                {displayName}
              </span>
              <ChevronDown size={12} style={{ color: "var(--muted)" }} />
            </button>

            <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, scale: .95, y: -4 }}
                  animate={{ opacity: 1, scale: 1,   y: 0  }}
                  exit={{   opacity: 0, scale: .95, y: -4 }}
                  transition={{ duration: .15 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl z-50 overflow-hidden"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-md)",
                  }}
                >
                  <div className="px-4 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{displayName}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{user?.email}</p>
                    {user?.role === "admin" && (
                      <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                        <Sparkles size={9} /> Admin
                      </span>
                    )}
                  </div>
                  <div className="py-1">
                    <ProfileAction icon={Settings} label="Settings" onClick={() => { setShowProfile(false); navigate("/settings"); }} />
                    <ProfileAction icon={LogOut} label="Log out" onClick={handleLogout} danger />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Search modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSearch(false)} />
            <motion.div
              className="relative w-full max-w-lg rounded-2xl overflow-hidden"
              style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)" }}
              initial={{ scale: .95, y: -8 }}
              animate={{ scale: 1,   y: 0  }}
              exit={{   scale: .95, y: -8  }}
            >
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <Search size={16} style={{ color: "var(--muted)" }} />
                <input
                  autoFocus
                  placeholder="Search documents, actions…"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "var(--text)" }}
                  onKeyDown={e => e.key === "Escape" && setShowSearch(false)}
                />
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--secondary)", color: "var(--muted)" }}>ESC</span>
              </div>
              <div className="p-2">
                {[
                  { label: "Upload document", hint: "Go to summarize" },
                  { label: "View history", hint: "Past summaries" },
                  { label: "Banking analysis", hint: "Financial docs" },
                  { label: "Table generator", hint: "Extract tables" },
                ].map(item => (
                  <button
                    key={item.label}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left transition-all hover:opacity-80"
                    style={{ color: "var(--text)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--secondary)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <span>{item.label}</span>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>{item.hint}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ProfileAction({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-all"
      style={{ color: danger ? "var(--danger)" : "var(--muted)" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--secondary)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
    >
      <Icon size={14} />
      {label}
    </button>
  );
}

export default Navbar;