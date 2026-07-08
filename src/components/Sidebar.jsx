import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const USER_LINKS = [
  { to: "/",         icon: "🏠", label: "Dashboard",      sub: "Overview & stats"    },
  { to: "/upload",   icon: "📤", label: "Summarize",       sub: "Upload & summarize"  },
  { to: "/excel",    icon: "📊", label: "Table Generator", sub: "Extract data tables" },
  { to: "/history",  icon: "🗂️", label: "History",         sub: "Past summaries"      },
  { to: "/pricing",  icon: "💳", label: "Plans & Billing",  sub: "Upgrade your plan"   },
  { to: "/settings", icon: "⚙️", label: "Settings",        sub: "Account & prefs"     },
];

const ADMIN_LINKS = [
  { to: "/admin",    icon: "🛡️", label: "Admin Panel",    sub: "Manage users"        },
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
              <div className="pt-3 pb-1.5 px-2">
                <div className="border-t border-gray-800 mb-2"/>
                <p className="text-[10px] uppercase tracking-widest text-yellow-600/70 font-semibold">Admin</p>
              </div>
            )}
            {collapsed && <div className="my-2 mx-auto w-6 border-t border-gray-700"/>}
            {ADMIN_LINKS.map(l => (
              <NavLink key={l.to} {...l} collapsed={collapsed} isActive={location.pathname === l.to} accent="yellow"/>
            ))}
          </>
        )}
      </nav>

      {/* User chip at bottom */}
      {!collapsed && (
        <div className="px-2 pb-4 shrink-0">
          <div className={`rounded-xl px-3 py-2.5 ${isAdmin ? "bg-yellow-500/10 border border-yellow-500/20" : "bg-gray-800"}`}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(user?.name || user?.email || "?")[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-300 truncate">{user?.name || user?.email || "User"}</p>
                <p className={`text-[10px] font-semibold capitalize ${isAdmin ? "text-yellow-400" : "text-gray-500"}`}>
                  {isAdmin ? "🛡️ Admin" : "User"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
