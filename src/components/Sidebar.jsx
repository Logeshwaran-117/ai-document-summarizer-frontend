import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);

  const links = [
    { to: "/",        icon: "🏠", label: "Dashboard",       sub: "Overview & stats"    },
    { to: "/upload",  icon: "📤", label: "Summarize",        sub: "Upload & summarize"  },
    { to: "/excel",   icon: "📊", label: "Table Generator",  sub: "Extract data tables" },
    { to: "/history", icon: "🗂️", label: "History",          sub: "Past summaries"      },
    { to: "/settings",icon: "⚙️", label: "Settings",         sub: "Account & prefs"     },
  ];

  return (
    <aside
      className={`h-screen bg-gray-900 dark:bg-gray-950 text-white flex flex-col transition-all duration-300 shrink-0 ${
        collapsed ? "w-[72px]" : "w-60"
      }`}
    >
      {/* Toggle button */}
      <div className="flex items-center h-16 px-3 border-b border-gray-800">
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand menu" : "Collapse menu"}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800 hover:bg-blue-600 transition text-gray-300 hover:text-white shrink-0"
        >
          {/* Expand/collapse icon — matches the box-with-arrow style in image 1 */}
          <svg
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 transition-transform duration-300"
            style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)" }}
          >
            {/* Outer box */}
            <rect x="2" y="3" width="16" height="14" rx="2" />
            {/* Vertical divider */}
            <line x1="13" y1="3" x2="13" y2="17" />
            {/* Arrow pointing right (flips to left when expanded) */}
            <polyline points="6,7 10,10 6,13" />
          </svg>
        </button>

        {!collapsed && (
          <span className="ml-3 text-sm font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap overflow-hidden">
            Menu
          </span>
        )}
      </div>

      {/* Nav links */}
      <ul className="flex-1 py-3 space-y-1 px-2 overflow-hidden">
        {links.map(({ to, icon, label, sub }) => {
          const isActive = location.pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-xl transition font-medium text-sm
                  ${collapsed ? "justify-center px-0 py-3" : "px-3 py-3"}
                  ${isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
              >
                <span className="text-lg shrink-0">{icon}</span>
                {!collapsed && (
                  <div className="overflow-hidden">
                    <p className="leading-tight truncate">{label}</p>
                    <p className="text-[11px] text-gray-500 leading-tight truncate font-normal">{sub}</p>
                  </div>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

export default Sidebar;