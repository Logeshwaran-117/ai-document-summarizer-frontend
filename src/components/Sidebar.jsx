import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import UsageBadge from "./UsageBadge";

const USER_LINKS = [
  { to: "/",         icon: "🏠", label: "Dashboard",       sub: "Overview & stats"     },
  { to: "/upload",   icon: "📤", label: "Summarize",        sub: "Upload & summarize"   },
  { to: "/excel",    icon: "📊", label: "Table Generator",  sub: "Extract data tables"  },
  { to: "/banking",  icon: "🏦", label: "Banking",          sub: "Financial analysis"   },
  { to: "/history",  icon: "🗂️", label: "History",          sub: "Past summaries"       },
  { to: "/pricing",  icon: "💳", label: "Plans & Billing",   sub: "Upgrade your plan"    },
  { to: "/settings", icon: "⚙️", label: "Settings",         sub: "Account & prefs"      },
];

const ADMIN_LINKS = [
  { to: "/admin",           icon: "🛡️", label: "Admin Panel",     sub: "Manage users"         },
  // ── NEW ──────────────────────────────────────────────────────────────────────
  { to: "/usage-dashboard", icon: "📡", label: "API Key Usage",    sub: "Gemini key stats"     },
];

function NavLink({ to, icon, label, sub, collapsed, isActive, accent }) {
  return (
    <Link to={to} title={collapsed ? label : undefined}
      className={`flex items-center gap-3 rounded-xl transition-all font-medium text-sm group
        ${collapsed ? "justify-center px-0 py-3" : "px-3 py-2.5"}
        ${isActive
          ? accent === "yellow"
            ? "bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30"
            : "bg-blue-600 text-white shadow-md shadow-blue-900/40"
          : accent === "yellow"
          ? "text-yellow-500/70 hover:bg-yellow-500/10 hover:text-yellow-400"
          : "text-gray-400 hover:bg-gray-800 hover:text-white"
        }`}>
      <span className="text-lg shrink-0">{icon}</span>
      {!collapsed && (
        <div className="overflow-hidden">
          <p className="leading-tight truncate">{label}</p>
          <p className="text-[11px] leading-tight truncate font-normal opacity-60">{sub}</p>
        </div>
      )}
    </Link>
  );
}

function Sidebar({ user }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(true);
  const isAdmin = user?.role === "admin";

  return (
    <aside className={`h-screen bg-gray-900 text-white flex flex-col transition-all duration-300 shrink-0 border-r border-gray-800 ${collapsed ? "w-[68px]" : "w-60"}`}>

      {/* Logo / Toggle */}
      <div className={`flex items-center h-16 border-b border-gray-800 ${collapsed ? "justify-center px-0" : "px-3 gap-3"}`}>
        <button onClick={() => setCollapsed(!collapsed)} title={collapsed ? "Expand" : "Collapse"}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800 hover:bg-blue-600 transition-colors text-gray-400 hover:text-white shrink-0">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"
            style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform .3s" }}>
            <rect x="2" y="3" width="16" height="14" rx="2"/>
            <line x1="13" y1="3" x2="13" y2="17"/>
            <polyline points="6,7 10,10 6,13"/>
          </svg>
        </button>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white leading-tight truncate">DocSummarizer</p>
            <p className="text-[10px] text-gray-500 truncate">AI Powered</p>
          </div>
        )}
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-hidden">
        {!collapsed && (
          <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold px-2 pb-1.5">Main</p>
        )}
        {USER_LINKS.map(l => (
          <NavLink key={l.to} {...l} collapsed={collapsed} isActive={location.pathname === l.to} accent="blue"/>
        ))}

        {/* Admin section */}
        {isAdmin && (
          <>
            {!collapsed && (
              <p className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold px-2 pb-1.5 pt-3">Admin</p>
            )}
            {collapsed && <div className="my-1 border-t border-gray-800" />}
            {ADMIN_LINKS.map(l => (
              <NavLink key={l.to} {...l} collapsed={collapsed} isActive={location.pathname === l.to} accent="yellow"/>
            ))}
          </>
        )}
      </nav>

      {/* Usage badge */}
      {!collapsed && (
        <div className="p-3 border-t border-gray-800">
          <UsageBadge user={user} />
        </div>
      )}
    </aside>
  );
}

export default Sidebar;