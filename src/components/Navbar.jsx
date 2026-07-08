import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import NotificationCenter from "./NotificationCenter";

function Navbar({ setIsAuthenticated, user }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const handleLogout = async () => {
    try {
      await api.get("/auth/logout");
    } catch (err) {
      // ignore — we're logging out regardless
    }
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 text-black dark:text-white shadow-md transition-colors duration-300">
      <div>
        <h1 className="font-semibold text-lg">AI Document Summarizer</h1>
      </div>
      <div className="flex items-center gap-3">

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-lg"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        {/* Notification Center */}
        <NotificationCenter />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-2 rounded-full transition"
          >
            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {(user?.name || user?.displayName || "U")[0].toUpperCase()}
            </div>
            <span className="text-sm font-medium dark:text-white">
              {user?.name || user?.displayName || "Profile"}
            </span>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 z-50">
              <div className="px-4 py-3 border-b dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                  {user?.displayName || user?.name || "User"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                {user?.role === 'admin' && <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">🛡️ Admin</span>}
              </div>
              <button
                onClick={() => { setShowDropdown(false); navigate("/settings"); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                ⚙️ Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-b-xl"
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
