import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);

  const links = [
    { to: "/", icon: "🏠", label: "Dashboard" },
    { to: "/upload", icon: "📤", label: "Upload" },
    { to: "/history", icon: "📚", label: "History" },
    { to: "/settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <aside
      className={`h-screen bg-gray-800 dark:bg-gray-950 text-white p-4 flex flex-col transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className={`mb-8 flex items-center ${collapsed ? "flex-col gap-3" : "justify-between"}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center text-xl transition shrink-0"
          title={collapsed ? "Expand menu" : "Collapse menu"}
        >
          📄
        </button>
        {!collapsed && (
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Menu</h2>
        )}
      </div>

      <ul className="space-y-2 flex-1">
        {links.map(({ to, icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm
                  ${collapsed ? "justify-center px-0" : ""}
                  ${isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-700 dark:hover:bg-gray-800"
                  }`}
              >
                <span className="text-lg">{icon}</span>
                {!collapsed && label}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export default Sidebar;
